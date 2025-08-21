$ErrorActionPreference = 'Stop'

# Config
$owner = 'Andhika-Rey'
$projectNumber = 10
$issues = @(210,211,212,213)
$targetFields = @('Team','Area','Priority','Size','Risk')

# Desired values per issue (adjustable)
$plan = @{
  210 = @{ Team='DevOps'; Area='Infra/DevOps'; Priority='P1'; Size='XL'; Risk='Medium' }
  211 = @{ Team='DevOps'; Area='Infra/DevOps'; Priority='P1'; Size='L' ; Risk='Medium' }
  212 = @{ Team='DevOps'; Area='Tooling'     ; Priority='P2'; Size='M' ; Risk='Low' }
  213 = @{ Team='DevOps'; Area='Tooling'     ; Priority='P2'; Size='M' ; Risk='Low' }
}

$gh = Join-Path $Env:ProgramFiles 'GitHub CLI/gh.exe'
if (-not (Test-Path $gh)) {
  try {
    $ghCmd = Get-Command gh -ErrorAction Stop
    $gh = $ghCmd.Source
  } catch {
    $gh = 'gh'
  }
}

function Invoke-GraphQL([string]$query) {
  if (-not (Test-Path 'artifacts')) { New-Item -ItemType Directory -Path 'artifacts' | Out-Null }
  $qFile = Join-Path 'artifacts' 'debug-graphql-last.graphql'
  # Write without BOM to avoid GraphQL parser issues
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($qFile, $query, $utf8NoBom)
  $raw = & $gh api graphql -H "GraphQL-Features: projects_next_graphql" -F ("query=@$qFile") 2>&1
  if ($LASTEXITCODE -ne 0) { throw "GraphQL call failed: $raw" }
  $obj = $raw | ConvertFrom-Json
  if ($obj.errors) { throw ("GraphQL errors: " + ($obj.errors | ConvertTo-Json -Depth 6)) }
  return $obj
}

function Get-ProjectId([int]$number, [string]$owner) {
  $ghArgs = @('project','view',"$number",'--format','json')
  if ($owner) { $ghArgs += @('--owner', $owner) }
  $raw = & $gh @ghArgs 2>&1
  if ($LASTEXITCODE -eq 0) {
    try { return ($raw | ConvertFrom-Json).id } catch { }
  }
  # Fallback: viewer context
  $raw2 = & $gh project view "$number" --format json 2>&1
  if ($LASTEXITCODE -eq 0) {
    try { return ($raw2 | ConvertFrom-Json).id } catch { }
  }
  return $null
}

# 1) Resolve Project ID via CLI
$projectId = Get-ProjectId -number $projectNumber -owner $owner
if (-not $projectId) { throw "Project not found via CLI: $owner/$projectNumber" }

# Fetch fields using gh CLI first (more stable for names/options), then fallback to GraphQL
$fieldMap = @{}
$fieldsJson = & $gh project field-list $projectNumber --owner $owner --format json 2>&1
if ($LASTEXITCODE -eq 0) {
  try {
    $fields = $fieldsJson | ConvertFrom-Json
    foreach ($f in $fields) { $fieldMap[$f.name] = $f }
    ($fields | ConvertTo-Json -Depth 6) | Out-File -FilePath (Join-Path 'artifacts' 'debug-project-fields-cli.json') -Encoding utf8
  } catch {
    Write-Host 'CLI field-list JSON parse failed, will use GraphQL fallback.'
  }
}
if ($fieldMap.Count -eq 0) {
  $qProject = @"
query {
  node(id: "$projectId") {
    ... on ProjectV2 {
      fields(first: 50) {
        nodes {
          __typename
          ... on ProjectV2SingleSelectField { id name options { id name } }
          ... on ProjectV2Field { id name }
          ... on ProjectV2IterationField { id name }
        }
      }
    }
  }
}
"@
  $projRes = Invoke-GraphQL $qProject
  $fieldNodes = $projRes.node.fields.nodes
  foreach ($n in $fieldNodes) { $fieldMap[$n.name] = $n }
  ($fieldNodes | ConvertTo-Json -Depth 6) | Out-File -FilePath (Join-Path 'artifacts' 'debug-project-fields-graphql.json') -Encoding utf8
}

# Final fallback: load from cached artifact if available
if ($fieldMap.Count -eq 0 -or ($targetFields | Where-Object { -not $fieldMap.ContainsKey($_) })) {
  $fieldsArtifact = Join-Path 'artifacts' 'project10-fields.json'
  if (Test-Path $fieldsArtifact) {
    try {
      $cached = Get-Content -Path $fieldsArtifact -Raw | ConvertFrom-Json
      foreach ($f in $cached.fields) { $fieldMap[$f.name] = $f }
      Write-Host 'Loaded field map from artifacts/project10-fields.json'
    } catch {}
  }
}

# Validate required fields exist
foreach ($fname in $targetFields) {
  if (-not $fieldMap.ContainsKey($fname)) { throw "Missing field: $fname" }
}

# 2) Collect ALL items via pagination and map issue number -> itemId
$items = @()
$after = $null
do {
  if ($after) { $afterPart = "after: `"$after`"" } else { $afterPart = '' }
  $qItems = @"
query {
  node(id: "$projectId") {
    ... on ProjectV2 {
      items(first: 100 $afterPart) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          content {
            __typename
            ... on Issue { number url title state }
            ... on PullRequest { number url title state }
          }
        }
      }
    }
  }
}
"@
  $res = Invoke-GraphQL $qItems
  $page = $res.node.items
  $items += $page.nodes
  $after = $page.pageInfo.endCursor
  $more = $page.pageInfo.hasNextPage
} while ($more)

$itemMap = @{}
foreach ($it in $items) {
  if ($it.content -and $it.content.__typename -eq 'Issue' -and $issues -contains [int]$it.content.number) {
    $itemMap[[int]$it.content.number] = $it.id
  }
}

# Ensure items exist: add missing ones by issue node id
$toAdd = @()
foreach ($num in $issues) { if (-not $itemMap.ContainsKey($num)) { $toAdd += $num } }
if ($toAdd.Count -gt 0) {
  # Resolve issue node IDs
  $issueQueries = $toAdd | ForEach-Object { "i$($_): repository(name: `"merajutasa.id`", owner: `"$owner`") { issue(number: $($_)) { id number } }" }
  $qIssues = @"
query {
  $($issueQueries -join "`n  ")
}
"@
  $issueRes = Invoke-GraphQL $qIssues
  $contentIds = @{}
  foreach ($k in $issueRes.PSObject.Properties.Name) {
    $node = $issueRes.$k.issue
    if ($node) { $contentIds[[int]$node.number] = $node.id }
  }
  foreach ($num in $toAdd) {
    if (-not $contentIds.ContainsKey($num)) { continue }
    $contentId = $contentIds[$num]
    $mutationAdd = @"
mutation {
  addProjectV2ItemById(input: { projectId: "$projectId", contentId: "$contentId" }) { item { id } }
}
"@
    $addRes = Invoke-GraphQL $mutationAdd
    $newItemId = $addRes.addProjectV2ItemById.item.id
    if ($newItemId) { $itemMap[$num] = $newItemId }
  }
}

# 3) Prepare option ID lookup
function Get-OptionId([string]$fieldName, [string]$optionName) {
  $f = $fieldMap[$fieldName]
  if (-not $f) { throw "Field not found: $fieldName" }
  if (-not $f.options) { throw "Field is not single-select: $fieldName" }
  $opt = $f.options | Where-Object { $_.name -eq $optionName }
  if (-not $opt) { return $null }
  return $opt.id
}

# 4) Apply updates via mutation
$applied = @()
foreach ($num in $issues) {
  if (-not $itemMap.ContainsKey($num)) {
    $applied += @{ issue = $num; status = 'MISSING_ITEM'; detail = 'Item not found in Project 10' }
    continue
  }
  $itemId = $itemMap[$num]
  $vals = $plan[$num]
  foreach ($fname in $vals.Keys) {
    $f = $fieldMap[$fname]
    $fid = $f.id
    $desired = $vals[$fname]
    $oid = Get-OptionId $fname $desired
    if (-not $oid) {
      $applied += @{ issue=$num; field=$fname; value=$desired; status='OPTION_NOT_FOUND' }
      continue
    }
    $mutation = @"
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "$projectId"
    itemId: "$itemId"
    fieldId: "$fid"
    value: { singleSelectOptionId: "$oid" }
  }) {
    projectV2Item { id }
  }
}
"@
    Invoke-GraphQL $mutation | Out-Null
    $applied += @{ issue=$num; field=$fname; value=$desired; status='SET' }
  }
}

# 5) Snapshot after values (best-effort by re-fetching items field values)
$snapshot = @()
$after = $null
do {
  if ($after) { $afterPart = "after: `"$after`"" } else { $afterPart = '' }
  $qItems2 = @"
query {
  node(id: "$projectId") {
    ... on ProjectV2 {
      items(first: 100 $afterPart) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          content { __typename ... on Issue { number title } }
          fieldValues(first: 50) {
            nodes {
              __typename
              ... on ProjectV2ItemFieldSingleSelectValue {
                field { ... on ProjectV2SingleSelectField { name } }
                name
              }
            }
          }
        }
      }
    }
  }
}
"@
  $res2 = Invoke-GraphQL $qItems2
  $page2 = $res2.node.items
  foreach ($node in $page2.nodes) {
    if ($node.content.__typename -eq 'Issue' -and $issues -contains [int]$node.content.number) {
      $vals = @{}
      foreach ($fv in $node.fieldValues.nodes) {
        if ($fv.__typename -eq 'ProjectV2ItemFieldSingleSelectValue') {
          $fname = $fv.field.name
          if ($targetFields -contains $fname) { $vals[$fname] = $fv.name }
        }
      }
      $snapshot += @{ number = [int]$node.content.number; title = $node.content.title; fields = $vals }
    }
  }
  $after = $page2.pageInfo.endCursor
  $more = $page2.pageInfo.hasNextPage
} while ($more)

# 6) Write artifact
$out = @{ projectOwner=$owner; projectNumber=$projectNumber; projectId=$projectId; applied=$applied; snapshot=$snapshot }
$artifactPath = Join-Path 'artifacts' 'project10-field-apply-210-213.json'
($out | ConvertTo-Json -Depth 8) | Out-File -FilePath $artifactPath -Encoding utf8
Write-Host "Wrote artifact: $artifactPath"
