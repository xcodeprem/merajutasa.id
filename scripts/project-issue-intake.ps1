<#
  Issue Intake & Hygiene (Phase 2) - 100% CLI (gh)
  Derives component/team/priority/SLA fields & sets project fields.

  Usage:
    pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/project-issue-intake.ps1 -Owner xcodeprem -Repo merajutasa.id -ProjectNumber 10 -IssueNumbers 210,213 -ConfigPath config\governance\project-field-schema.json

  Limitations:
    - Assumes fields already exist (run project-fields-sync.ps1 first).
    - Cannot add missing single-select options after field creation (API limitation); will warn & skip.
#>
param(
  [string]$Owner,
  [Parameter(Mandatory=$true)][string]$Repo,
  [int]$ProjectNumber,
  [Parameter(Mandatory=$true)][string]$IssueNumbers,
  [string]$ConfigPath = 'config/governance/project-field-schema.json'
)

$ErrorActionPreference = 'Stop'
function Test-CmdAvailable($n){ if (-not (Get-Command $n -ErrorAction SilentlyContinue)) { throw "Missing required CLI: $n" } }
Test-CmdAvailable gh

if (-not (Test-Path $ConfigPath)) { throw "Config not found: $ConfigPath" }
$config = (Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json)

if (-not $Owner -or -not $ProjectNumber) {
  if ($config.project_reference.url -match 'https://github.com/users/([^/]+)/projects/([0-9]+)') {
    if (-not $Owner) { $Owner = $Matches[1] }
    if (-not $ProjectNumber) { $ProjectNumber = [int]$Matches[2] }
  } else { throw 'Owner/ProjectNumber missing and cannot parse from config project_reference.url' }
}

# --- Label bootstrap (auto-create missing expected labels) ---
function Invoke-RepoLabelsEnsure {
  param([string]$Owner,[string]$Repo,[object]$Config)
  Write-Host "[LABELS] Ensuring baseline labels exist"
  $expected = New-Object 'System.Collections.Generic.List[string]'
  # Component labels
  foreach ($opt in $Config.fields.Components.options) { $expected.Add("comp:$($opt.key)") }
  # Team labels (unique)
  $teams = ($Config.derivation.team_rules.team | Sort-Object -Unique)
  foreach ($t in $teams) { $expected.Add("team:$($t.ToLower())") }
  # Priority labels
  foreach ($p in @('priority:p0','priority:p1','priority:p2','priority:p3')) { $expected.Add($p) }
  # Automation control labels
  $expected.Add('manual-override')
  $expected.Add('no-auto')
  $existing = @()
  try {
    $page1 = gh api "repos/$Owner/$Repo/labels?per_page=100" 2>$null
    if ($page1) { $existing = ($page1 | ConvertFrom-Json).name }
  } catch { Write-Warning "Could not list existing labels: $($_.Exception.Message)" }
  $createdLocal = @()
  foreach ($name in ($expected | Sort-Object -Unique)) {
    if ($existing -contains $name) { continue }
    $color = '0366d6'
    if ($name -like 'team:*') { $color = '5319e7' }
    elseif ($name -like 'priority:p0') { $color = 'd73a4a' }
    elseif ($name -like 'priority:p1') { $color = 'e99695' }
    elseif ($name -like 'priority:p2') { $color = 'fbca04' }
    elseif ($name -like 'priority:p3') { $color = '0e8a16' }
    elseif ($name -eq 'manual-override') { $color = 'b60205' }
    elseif ($name -eq 'no-auto') { $color = 'c2e0c6' }
    $desc = "Auto-created label $name"
    try {
      gh api "repos/$Owner/$Repo/labels" -f name="$name" -f color=$color -f description="$desc" 1>$null 2>$null
      $createdLocal += $name
      Write-Host "[LABELS] Created $name"
    } catch { Write-Warning "Failed to create label ${name}: $($_.Exception.Message)" }
  }
  return $createdLocal
}

$createdLabels = Invoke-RepoLabelsEnsure -Owner $Owner -Repo $Repo -Config $config

$projectId = gh project view $ProjectNumber --owner $Owner --format json --jq '.id'
if (-not $projectId) { throw "Could not resolve project id" }

# Load field metadata once
$fieldsJson = gh project field-list $ProjectNumber --owner $Owner --format json
$fields = ($fieldsJson | ConvertFrom-Json).fields
$fieldIndex = @{}
foreach ($f in $fields) { $fieldIndex[$f.name] = $f }

function Get-SingleSelectOptionId($fieldName, [string]$label){
  if (-not $fieldIndex.ContainsKey($fieldName)) { return $null }
  $opts = $fieldIndex[$fieldName].options
  if (-not $opts) { return $null }
  $hit = $opts | Where-Object { $_.name -eq $label }
  return $hit.id
}

function Get-DerivedComponent($title,$body){
  $text = ($title + ' ' + $body).ToLower()
  foreach ($rule in $config.derivation.component_regex) {
    if ($text -match $rule.pattern) { return $rule.component_key }
  }
  return 'infrastructure'
}

function Get-ComponentLabel($key){
  $opt = $config.fields.Components.options | Where-Object { $_.key -eq $key }
  return $opt.label
}

function Get-DerivedTeam($componentKey){
  $rule = $config.derivation.team_rules | Where-Object { $_.component_key -eq $componentKey } | Select-Object -First 1
  if ($rule) { return $rule.team }
  return 'Platform'
}

function Get-DerivedPriority($labels,$title,$body){
  $existing = $labels | Where-Object { $_ -match '^priority:p[0-3]$' }
  if ($existing) {
    $first = if ($existing -is [System.Array]) { $existing[0] } else { $existing }
    return (($first -split ':')[1]).ToUpper()
  }
  $text = ($title + ' ' + $body).ToLower()
  $kw = $config.fields.Priority.rules.keywords
  if ($kw.p0 | Where-Object { $text.Contains($_) }) { return 'P0' }
  if ($kw.p1 | Where-Object { $text.Contains($_) }) { return 'P1' }
  if ($kw.p3 | Where-Object { $text.Contains($_) }) { return 'P3' }
  return $config.fields.Priority.rules.default
}

function Get-SLAForPriority($prio){
  $tierMap = $config.fields.'SLA Tier'.rules.mapping
  $tier = $tierMap.$prio
  $sla = $config.sla_matrix.$prio
  return [ordered]@{ tier=$tier; response=$sla.response_hours; resolve=$sla.resolve_hours }
}

function Get-TriageState($issue,$labels){
  $rules = $config.fields.'Triage State'.rules
  $text = ($issue.title + ' ' + $issue.body).ToLower()
  if ($labels | Where-Object { $_ -eq 'priority:p0' }) { return 'Ready' }
  if ($rules.waiting_keywords | Where-Object { $text.Contains($_) }) { return 'Waiting' }
  if ($rules.needs_info_keywords | Where-Object { $text.Contains($_) }) { return 'Needs Info' }
  $created = Get-Date $issue.createdAt
  if ((Get-Date) - $created -lt [TimeSpan]::FromDays($rules.recent_days_new)) { return 'New' }
  return 'Ready'
}

function Invoke-LegacyLabelMigrate([string[]]$labels){
  $adds = @(); $removes = @()
  foreach ($l in $labels){
    switch -Regex ($l) {
      '^P([0-3])$' { $adds += "priority:p$($Matches[1])"; $removes += $l }
      '^automation$' { $adds += 'comp:automation'; $removes += $l }
      '^infrastructure$' { $adds += 'comp:infrastructure'; $removes += $l }
      '^governance$' { $adds += 'team:governance'; $removes += $l }
      '^security$' { $adds += 'team:security'; $removes += $l }
    }
  }
  return @{ add=($adds | Sort-Object -Unique); remove=($removes | Sort-Object -Unique) }
}

function Get-ProjectIssueItemEnsured([int]$n){
  $itemId = gh project item-list $ProjectNumber --owner $Owner --format json --jq ".items[] | select(.content.number==$n) | .id"
  if (-not $itemId) {
    gh project item-add $ProjectNumber --owner $Owner --url "https://github.com/$Owner/$Repo/issues/$n" | Out-Null
    Start-Sleep -Seconds 1
    $itemId = gh project item-list $ProjectNumber --owner $Owner --format json --jq ".items[] | select(.content.number==$n) | .id"
  }
  if (-not $itemId) { throw "Failed to resolve project item for issue #$n" }
  return $itemId
}

function Set-SingleSelect([string]$itemId,[string]$fieldName,[string]$label){
  if (-not $label) { return }
  $optId = Get-SingleSelectOptionId $fieldName $label
  if (-not $optId) { Write-Warning "Option '$label' not found for field '$fieldName'"; return }
  gh project item-edit --id $itemId --project-id $projectId --field-id $fieldIndex[$fieldName].id --single-select-option-id $optId | Out-Null
}

function Set-Number([string]$itemId,[string]$fieldName,[int]$value){
  if (-not $fieldIndex.ContainsKey($fieldName)) { return }
  gh project item-edit --id $itemId --project-id $projectId --field-id $fieldIndex[$fieldName].id --number $value | Out-Null
}

function Set-Date([string]$itemId,[string]$fieldName,[datetime]$date){
  if (-not $fieldIndex.ContainsKey($fieldName)) { return }
  gh project item-edit --id $itemId --project-id $projectId --field-id $fieldIndex[$fieldName].id --date ($date.ToString('yyyy-MM-dd')) | Out-Null
}

$issues = $IssueNumbers.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^[0-9]+$' }
if (-not $issues) { throw "No valid issue numbers" }

$results = @()
foreach ($i in $issues) {
  try {
    $j = gh issue view $i -R "$Owner/$Repo" --json number,title,body,labels,createdAt,url
    $issue = $j | ConvertFrom-Json
    if ($issue.pullRequest) { Write-Host "[SKIP] #$i is a PR"; continue }
    $labels = $issue.labels.name
    if ($labels -and ($config.automation_policy.skip_if_label_present | Where-Object { $labels -contains $_ })) {
      Write-Host "[SKIP] #$i manual override label present"
      $results += @{ issue=$i; skipped='manual-override' }
      continue
    }
  $componentKey = Get-DerivedComponent $issue.title $issue.body
  $componentLabel = Get-ComponentLabel $componentKey
  $team = Get-DerivedTeam $componentKey
  $priority = Get-DerivedPriority $labels $issue.title $issue.body
  $sla = Get-SLAForPriority $priority

    # Legacy migrate first
    $migration = Invoke-LegacyLabelMigrate $labels
    if ($migration.add.Count -gt 0) {
      gh issue edit $i -R "$Owner/$Repo" --add-label ($migration.add -join ',') | Out-Null
      $labels = ($labels + $migration.add) | Sort-Object -Unique
    }
    if ($migration.remove.Count -gt 0) {
      gh issue edit $i -R "$Owner/$Repo" --remove-label ($migration.remove -join ',') | Out-Null
      $labels = $labels | Where-Object { $migration.remove -notcontains $_ }
    }

    # Ensure governed labels
    $needLabels = @()
    if ($componentLabel) { $wantComp = "comp:$($componentKey)"; if ($labels -notcontains $wantComp) { $needLabels += $wantComp } }
    $wantTeam = "team:$($team.ToLower())"; if ($labels -notcontains $wantTeam) { $needLabels += $wantTeam }
    $wantPrio = "priority:$($priority.ToLower())"; if ($labels -notcontains $wantPrio) { $needLabels += $wantPrio }
    if ($needLabels.Count -gt 0) {
      gh issue edit $i -R "$Owner/$Repo" --add-label ($needLabels -join ',') | Out-Null
    }

  $itemId = Get-ProjectIssueItemEnsured $i
    Set-SingleSelect $itemId 'Components' $componentLabel
    Set-SingleSelect $itemId 'Teams' $team
  Set-SingleSelect $itemId 'Priority' $priority
    Set-SingleSelect $itemId 'SLA Tier' $sla.tier
    Set-Number $itemId 'Response Target (hrs)' $sla.response
    Set-Number $itemId 'Resolve Target (hrs)' $sla.resolve
    Set-Date $itemId 'Last Automation Sync' (Get-Date).ToUniversalTime()
    $triage = Get-TriageState $issue $labels
    Set-SingleSelect $itemId 'Triage State' $triage

    # Comment once
    $marker = $config.automation_policy.comment_once_marker
    $commentsJson = gh issue view $i -R "$Owner/$Repo" --json comments
    $comments = ($commentsJson | ConvertFrom-Json).comments.body
    if (-not ($comments | Where-Object { $_ -like "*$marker*" })) {
      $summary = @()
      $summary += "Component: $componentLabel ($componentKey)"
      $summary += "Team: $team"
      $summary += "Priority: $priority (SLA: resp ${sla.response}h / res ${sla.resolve}h)"
  $summary += "Labels Added: $($needLabels -join ', ')"
  if ($migration.add.Count -gt 0 -or $migration.remove.Count -gt 0) { $summary += "Legacy Migrated: add=[$($migration.add -join ',')] remove=[$($migration.remove -join ',')]" }
  $summary += "Triage State: $triage"
      $summary += "Override: add label 'manual-override' to stop future automation"
      $body = "${marker}`nAuto Triage Summary`n`n- " + ($summary -join "`n- ")
      gh issue comment $i -R "$Owner/$Repo" --body $body | Out-Null
    }

  $results += @{ issue=$i; component=$componentLabel; team=$team; priority=$priority; triage=$triage; sla=$sla }
    Write-Host "[OK] #$i component=$componentKey team=$team prio=$priority"
  } catch {
    Write-Warning "[ERR] #$i $_"
    $results += @{ issue=$i; error=$_.Exception.Message }
  }
}

New-Item -ItemType Directory -Force -Path artifacts | Out-Null
$out = [ordered]@{
  timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
  project = $ProjectNumber
  labels_created = $createdLabels
  results = $results
}
$outFile = 'artifacts/project-issue-intake-summary.json'
$out | ConvertTo-Json -Depth 8 | Out-File -FilePath $outFile -Encoding utf8
Write-Host "[DONE] Written summary -> $outFile"
