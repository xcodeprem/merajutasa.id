<#!
.SYNOPSIS
Migrates GitHub Issues (labels, milestones, issues, comments) from one repository to another using gh CLI.

.DESCRIPTION
Copies labels, milestones, and issues (optionally comments) from a source repo to a destination repo.
By default, PRs are skipped. Supports WhatIf (dry-run) and a date filter. Requires gh CLI authenticated
with a token that can read source and write destination repos.

.EXAMPLE
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/issues-migrate.ps1 `
  -SourceOwner xcodeprem -SourceRepo merajutasa.id `
  -DestOwner xcodeprem -DestRepo merajutasa.id `
  -IncludeComments:$true -State all -WhatIf

.NOTES
Limitations when not using Import API:
- Authors and timestamps of issues/comments cannot be preserved; they will appear as the authenticated user.
- Closed/created timestamps aren’t preserved; only current state can be set (open/closed).

To preserve author/timestamps, enable -UseImportApi (preview) which uses the Issue Import API.
This requires the preview Accept header and may take longer. See: https://docs.github.com/rest/issues/issues#import-issues
#>

[CmdletBinding(SupportsShouldProcess=$true)]
param(
  [Parameter(Mandatory=$true)] [string]$SourceOwner,
  [Parameter(Mandatory=$true)] [string]$SourceRepo,
  [Parameter(Mandatory=$true)] [string]$DestOwner,
  [Parameter(Mandatory=$true)] [string]$DestRepo,
  [ValidateSet('open','closed','all')] [string]$State = 'all',
  [switch]$IncludeComments = $true,
  [switch]$IncludePRs = $false,
  [string]$SinceISO8601,
  [int[]]$IssueNumbers, # migrate only these numbers
  [string]$AssigneeMapFile, # JSON: { "sourceUser": "destUser" }
  [switch]$UseImportApi = $false,
  [int]$DelayMs = 250
)

set-strictmode -version latest
$ErrorActionPreference = 'Stop'

function Ensure-Gh {
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'gh CLI is required. Install from https://cli.github.com/'
  }
  try {
    gh auth status | Out-Null
  } catch {
    Write-Warning 'gh is not authenticated. Run: gh auth login'
    throw 'Authenticate gh CLI before running this script.'
  }
}

function Invoke-GhApiPaged {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Hashtable]$Query
  )
  $page = 1
  $per_page = 100
  $results = @()
  while ($true) {
    $qp = @{ per_page = $per_page; page = $page }
    if ($Query) { $qp += $Query }
    $args = @('api', '--silent', '--method', 'GET', $Path)
    foreach ($k in $qp.Keys) { $args += @('-F', "$k=$($qp[$k])") }
    $json = & gh @args | ConvertFrom-Json
    if (-not $json) { break }
    if ($json -is [System.Array]) { $results += $json } else { $results += ,$json }
    if (($json | Measure-Object).Count -lt $per_page) { break }
    $page++
  }
  return $results
}

function Get-Labels {
  param([string]$Owner,[string]$Repo)
  Invoke-GhApiPaged -Path "/repos/$Owner/$Repo/labels"
}

function Ensure-Labels {
  param([object[]]$Labels,[string]$Owner,[string]$Repo)
  foreach ($lbl in $Labels) {
    $body = @{ name = $lbl.name; color = $lbl.color; description = $lbl.description } | ConvertTo-Json -Depth 5
    if ($PSCmdlet.ShouldProcess("$Owner/$Repo", "Ensure label '$($lbl.name)'")) {
      try {
  $encName = [uri]::EscapeDataString($lbl.name)
  & gh api "/repos/$Owner/$Repo/labels/$encName" --method GET --silent | Out-Null
      } catch {
  $body | & gh api "/repos/$Owner/$Repo/labels" --method POST -H "Content-Type: application/json" -i --input - | Out-Null
        Start-Sleep -Milliseconds $DelayMs
      }
    }
  }
}

function Get-Milestones {
  param([string]$Owner,[string]$Repo)
  # state=all to include closed milestones
  Invoke-GhApiPaged -Path "/repos/$Owner/$Repo/milestones" -Query @{ state = 'all' }
}

function Ensure-Milestones {
  param([object[]]$Milestones,[string]$Owner,[string]$Repo)
  foreach ($ms in $Milestones) {
    $existing = Invoke-GhApiPaged -Path "/repos/$Owner/$Repo/milestones" -Query @{ state = 'all' ; per_page=100; page=1 } | Where-Object { $_.title -eq $ms.title }
    if (-not $existing) {
      $payload = @{ title = $ms.title; description = $ms.description; due_on = $ms.due_on } | ConvertTo-Json -Depth 5
      if ($PSCmdlet.ShouldProcess("$Owner/$Repo", "Create milestone '$($ms.title)'")) {
  $payload | & gh api "/repos/$Owner/$Repo/milestones" --method POST -H "Content-Type: application/json" --input - -i | Out-Null
        Start-Sleep -Milliseconds $DelayMs
      }
    }
  }
}

function Get-Issues {
  param([string]$Owner,[string]$Repo,[string]$State,[string]$Since,[int[]]$Numbers)
  if ($Numbers -and $Numbers.Count -gt 0) {
    $items = @()
    foreach ($n in $Numbers) {
      $it = & gh api "/repos/$Owner/$Repo/issues/$n" --silent | ConvertFrom-Json
      if ($it) { $items += $it }
      Start-Sleep -Milliseconds $DelayMs
    }
    return $items
  }
  $q = @{ state = $State; direction = 'asc' }
  if ($Since) { $q.since = $Since }
  Invoke-GhApiPaged -Path "/repos/$Owner/$Repo/issues" -Query $q
}

function Resolve-MilestoneNumber {
  param([string]$Title,[object[]]$DestMilestones)
  if (-not $Title) { return $null }
  $match = $DestMilestones | Where-Object { $_.title -eq $Title } | Select-Object -First 1
    if ($match) { return $match.number } else { return $null }
}

function Load-MapFile {
  param([string]$Path)
  if (-not $Path) { return @{} }
  if (-not (Test-Path $Path)) { throw "Map file not found: $Path" }
  $raw = Get-Content -Raw -Path $Path | ConvertFrom-Json
  return @{} + $raw.PSObject.Properties.ForEach({ @{ ($_.Name) = $_.Value } })
}

Ensure-Gh

$assigneeMap = Load-MapFile -Path $AssigneeMapFile

Write-Host "Fetching source labels/milestones…" -ForegroundColor Cyan
$srcLabels = Get-Labels -Owner $SourceOwner -Repo $SourceRepo
$srcMilestones = Get-Milestones -Owner $SourceOwner -Repo $SourceRepo

Write-Host "Ensuring destination labels/milestones…" -ForegroundColor Cyan
Ensure-Labels -Labels $srcLabels -Owner $DestOwner -Repo $DestRepo
$destMilestones = Get-Milestones -Owner $DestOwner -Repo $DestRepo
Ensure-Milestones -Milestones $srcMilestones -Owner $DestOwner -Repo $DestRepo
$destMilestones = Get-Milestones -Owner $DestOwner -Repo $DestRepo # refresh

Write-Host "Fetching issues from $SourceOwner/$SourceRepo (state=$State)…" -ForegroundColor Cyan
$issues = Get-Issues -Owner $SourceOwner -Repo $SourceRepo -State $State -Since $SinceISO8601 -Numbers $IssueNumbers

if (-not $IncludePRs) {
  $issues = $issues | Where-Object { -not $_.pull_request }
}

Write-Host ("Planning to migrate {0} issues" -f ($issues | Measure-Object).Count) -ForegroundColor Yellow

$migrated = @()
foreach ($it in $issues) {
  $srcNumber = $it.number
  $title = $it.title
  $labels = @($it.labels | ForEach-Object { $_.name })
    $milestoneTitle = $null
    if ($it.PSObject.Properties.Name -contains 'milestone' -and $it.milestone) {
      $milestoneTitle = $it.milestone.title
    }
  $milestoneNum = Resolve-MilestoneNumber -Title $milestoneTitle -DestMilestones $destMilestones
  $assignees = @($it.assignees | ForEach-Object { $name = $_.login; if ($assigneeMap.ContainsKey($name)) { $assigneeMap[$name] } else { $null } } | Where-Object { $_ })
  
  $bodyHeader = "(Migrated from https://github.com/$SourceOwner/$SourceRepo/issues/$srcNumber)"
  $body = if ($it.body) { "$bodyHeader`n`n$($it.body)" } else { $bodyHeader }

  $payload = @{ title = $title; body = $body; labels = $labels }
  if ($milestoneNum) { $payload.milestone = $milestoneNum }
  if ($assignees.Count -gt 0) { $payload.assignees = $assignees }
  $json = $payload | ConvertTo-Json -Depth 10

  if ($PSCmdlet.ShouldProcess("$DestOwner/$DestRepo", "Create issue '$title' from #$srcNumber")) {
    if ($UseImportApi) {
      # Build import payload (preview). Comments added inline for import.
      $comments = @()
      if ($IncludeComments) {
        $rawComments = Invoke-GhApiPaged -Path "/repos/$SourceOwner/$SourceRepo/issues/$srcNumber/comments"
        foreach ($c in $rawComments) {
          $comments += @{ created_at = $c.created_at; body = "(by @$($c.user.login) on $($c.created_at))`n`n$($c.body)" }
        }
      }
      $importPayload = @{
        issue = @{
          title = $title
          body = $it.body
          created_at = $it.created_at
          closed_at = if ($it.state -eq 'closed') { $it.closed_at } else { $null }
          assignee = ($assignees | Select-Object -First 1)
          milestone = $milestoneTitle
          labels = $labels
        }
        comments = $comments
      } | ConvertTo-Json -Depth 10

  $resp = $importPayload | & gh api "/repos/$DestOwner/$DestRepo/import/issues" --method POST -H "Accept: application/vnd.github.gargoyle-preview+json" -H "Content-Type: application/json" --input - | ConvertFrom-Json
  $newUrl = $null
  if ($resp -and ($resp.PSObject.Properties.Name -contains 'issue_url')) { $newUrl = $resp.issue_url }
  $newNumber = if ($newUrl) { [int]($newUrl.Split('/')[-1]) } else { $null }
      if ($newNumber) {
        if ($it.state -eq 'closed') {
          # Already closed via import, but double-check
          & gh api "/repos/$DestOwner/$DestRepo/issues/$newNumber" --method PATCH -F state=closed | Out-Null
        }
        $migrated += @{ source=$srcNumber; dest=$newNumber }
      }
      Start-Sleep -Milliseconds $DelayMs
    }
    else {
      # Standard create
    $created = $json | & gh api "/repos/$DestOwner/$DestRepo/issues" --method POST -H "Content-Type: application/json" --input - | ConvertFrom-Json
      $newNumber = $created.number

      if ($IncludeComments) {
        $comments = Invoke-GhApiPaged -Path "/repos/$SourceOwner/$SourceRepo/issues/$srcNumber/comments"
        foreach ($c in $comments) {
      $commentBody = "(Original by @$($c.user.login) on $($c.created_at))`n`n$($c.body)"
      $commentPayload = @{ body = $commentBody } | ConvertTo-Json -Depth 5
      $commentPayload | & gh api "/repos/$DestOwner/$DestRepo/issues/$newNumber/comments" --method POST -H "Content-Type: application/json" --input - | Out-Null
          Start-Sleep -Milliseconds $DelayMs
        }
      }

      if ($it.state -eq 'closed') {
        & gh api "/repos/$DestOwner/$DestRepo/issues/$newNumber" --method PATCH -F state=closed | Out-Null
      }

      $migrated += @{ source=$srcNumber; dest=$newNumber }
      Start-Sleep -Milliseconds $DelayMs
    }
  }
}

$report = [PSCustomObject]@{
  source = "$SourceOwner/$SourceRepo"
  dest = "$DestOwner/$DestRepo"
  totalPlanned = ($issues | Measure-Object).Count
  migrated = $migrated
}

New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot '..' 'artifacts') | Out-Null
$outPath = Join-Path $PSScriptRoot "..\artifacts\issues-migrate-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$report | ConvertTo-Json -Depth 10 | Out-File -FilePath $outPath -Encoding utf8

Write-Host "Migration report written: $outPath" -ForegroundColor Green
