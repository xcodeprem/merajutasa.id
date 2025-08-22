<#
  Project / Repo Labels Reconciliation
  Audits existing repository labels against governance taxonomy (components, teams, priorities, automation control) and
  emits a normalization plan. Optionally applies safe renames/creations when -Apply switch used.

  Usage (dry run):
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/project-labels-reconcile.ps1 -RepoOwner xcodeprem -Repo merajutasa.id

  Apply changes:
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/project-labels-reconcile.ps1 -RepoOwner xcodeprem -Repo merajutasa.id -Apply

  Output artifact: artifacts/project-labels-reconcile.json
#>
param(
  [Parameter(Mandatory=$true)][string]$RepoOwner,
  [Parameter(Mandatory=$true)][string]$Repo,
  [string]$ConfigPath = 'config/governance/project-field-schema.json',
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'
function Test-CmdAvailable($n){ if (-not (Get-Command $n -ErrorAction SilentlyContinue)) { throw "Missing CLI: $n" } }
Test-CmdAvailable gh

if (-not (Test-Path $ConfigPath)) { throw "Config not found: $ConfigPath" }
$config = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json

Write-Host "[RECON] Auditing labels for $RepoOwner/$Repo (apply=$($Apply.IsPresent))"

# Desired sets
$desiredComponents = @{}
foreach ($c in $config.fields.Components.options){ $desiredComponents["comp:$($c.key)"] = [string]$c.label }
$desiredTeamLabels = @{}
$teams = ($config.derivation.team_rules | ForEach-Object { $_.team } | Sort-Object -Unique)
foreach ($t in $teams){ $desiredTeamLabels["team:$($t.ToLower())"] = [string]$t }
$desiredPriority = @{}
$desiredPriority['priority:p0'] = 'P0'
$desiredPriority['priority:p1'] = 'P1'
$desiredPriority['priority:p2'] = 'P2'
$desiredPriority['priority:p3'] = 'P3'
$controlLabels = @{ 'manual-override'='stop automation'; 'no-auto'='stop automation' }

$allDesired = @()
$allDesired += $desiredComponents.Keys
$allDesired += $desiredTeamLabels.Keys
$allDesired += $desiredPriority.Keys
$allDesired += $controlLabels.Keys
$allDesired = $allDesired | Sort-Object -Unique

# Fetch existing labels (paginate)
$existing = @()
$page = 1
while ($true) {
  $resp = gh api "repos/$RepoOwner/$Repo/labels?per_page=100&page=$page" 2>$null
  if (-not $resp) { break }
  $chunk = $resp | ConvertFrom-Json
  if (-not $chunk -or $chunk.Count -eq 0) { break }
  $existing += $chunk
  if ($chunk.Count -lt 100) { break }
  $page++
  if ($page -gt 10) { break } # safety cap
}
$existingNames = $existing.name

# Classification
$missing = @(); foreach ($d in $allDesired){ if ($existingNames -notcontains $d){ $missing += $d } }

# Heuristic detection of near-miss labels (e.g., chain, Chain, component names without prefix)
function Get-CandidateMappings {
  param($ExistingNames,$DesiredMapPrefix,$Prefix)
  $out=@()
  foreach ($e in $ExistingNames){
    if ($e -like "$Prefix*") { continue }
    $norm = $e.ToLower().Replace(' ','_').Replace('-','_')
    foreach ($d in $DesiredMapPrefix.Keys){
      $target = $d.Substring($Prefix.Length)
      if ($norm -eq $target) { $out += @{ from=$e; to=$d; reason='prefix-normalization' } }
    }
  }
  return $out
}

Write-Host "[RECON] Computing rename candidates"
$componentRenameCandidates = @(Get-CandidateMappings -ExistingNames $existingNames -DesiredMapPrefix $desiredComponents -Prefix 'comp:')
$teamRenameCandidates = @(Get-CandidateMappings -ExistingNames $existingNames -DesiredMapPrefix $desiredTeamLabels -Prefix 'team:')
$priorityRenameCandidates = @(Get-CandidateMappings -ExistingNames $existingNames -DesiredMapPrefix $desiredPriority -Prefix 'priority:')

$renamePlan = @()
if ($componentRenameCandidates) { $renamePlan += $componentRenameCandidates }
if ($teamRenameCandidates) { $renamePlan += $teamRenameCandidates }
if ($priorityRenameCandidates) { $renamePlan += $priorityRenameCandidates }

$performed = @()
if ($Apply){
  Write-Host "[RECON] Applying create + rename"
  foreach ($m in $missing){
    $color = '0366d6'
    if ($m -like 'team:*'){ $color='5319e7' }
    elseif ($m -like 'comp:*'){ $color='1d76db' }
    elseif ($m -like 'priority:p0'){ $color='d73a4a' }
    elseif ($m -like 'priority:p1'){ $color='e99695' }
    elseif ($m -like 'priority:p2'){ $color='fbca04' }
    elseif ($m -like 'priority:p3'){ $color='0e8a16' }
    elseif ($m -eq 'manual-override'){ $color='b60205' }
    elseif ($m -eq 'no-auto'){ $color='c2e0c6' }
    try {
      gh api "repos/$RepoOwner/$Repo/labels" -f name="$m" -f color=$color -f description="Auto created ($m)" 1>$null 2>$null
      $performed += @{ action='create'; label=$m }
      Write-Host "[RECON] Created $m"
  } catch { Write-Warning "Create failed for ${m}: $($_.Exception.Message)" }
  }
  foreach ($r in $renamePlan){
    if ($existingNames -contains $r.to) { continue }
    try {
      gh label edit $r.from -R "$RepoOwner/$Repo" --new-name $r.to 1>$null 2>$null
      $performed += @{ action='rename'; from=$r.from; to=$r.to }
      Write-Host "[RECON] Renamed $($r.from) -> $($r.to)"
  } catch { Write-Warning "Rename failed $($r.from): $($_.Exception.Message)" }
  }
}

$artifact = [ordered]@{
  timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
  repo = "$RepoOwner/$Repo"
  apply = $Apply.IsPresent
  totals = [ordered]@{
    existing = $existingNames.Count
    desired = $allDesired.Count
    missing = $missing.Count
    rename_candidates = $renamePlan.Count
  }
  missing_desired = $missing
  rename_plan = $renamePlan
  performed = $performed
  unmanaged_labels = ($existingNames | Where-Object { $allDesired -notcontains $_ })
}

New-Item -ItemType Directory -Force -Path artifacts | Out-Null
$outFile = 'artifacts/project-labels-reconcile.json'
$artifact | ConvertTo-Json -Depth 6 | Out-File -FilePath $outFile -Encoding utf8
Write-Host "[RECON] Artifact written -> $outFile"