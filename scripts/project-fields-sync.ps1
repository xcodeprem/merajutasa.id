<#
  Project Fields Sync (Phase 1) - 100% CLI (gh)
  Usage:
    pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/project-fields-sync.ps1 -Owner xcodeprem -ProjectNumber 10 -ConfigPath config\governance\project-field-schema.json

  Notes:
    - Creates managed fields (single_select/number/date/text) if missing.
    - For existing single_select fields, logs missing options (GitHub API currently does not expose an official mutation to append options via gh CLI; manual addition may be required) .
    - Emits summary JSON artifact.
#>
param(
  [string]$Owner,
  [int]$ProjectNumber,
  [string]$ConfigPath = 'config/governance/project-field-schema.json',
  [switch]$ResetManaged
)

$ErrorActionPreference = 'Stop'

function Test-CmdAvailable($name){ if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "Missing required CLI: $name" } }
Test-CmdAvailable gh

if (-not (Test-Path $ConfigPath)) { throw "Config file not found: $ConfigPath" }
$configRaw = Get-Content $ConfigPath -Raw -Encoding UTF8
$config = $configRaw | ConvertFrom-Json

# Derive owner / project from config if omitted
if (-not $Owner -or -not $ProjectNumber) {
  if ($config.project_reference.url -match 'https://github.com/users/([^/]+)/projects/([0-9]+)') {
    if (-not $Owner) { $Owner = $Matches[1] }
    if (-not $ProjectNumber) { $ProjectNumber = [int]$Matches[2] }
  } else {
    throw 'Owner/ProjectNumber not provided and could not parse from project_reference.url'
  }
}

Write-Host "[SYNC] Owner=$Owner Project=$ProjectNumber (config ref id=$($config.project_reference.id)) Reset=$($ResetManaged.IsPresent)"

# Auth check (non-fatal if secondary stored accounts error)
try { gh auth status 1>$null 2>$null } catch { Write-Warning "gh auth status reported an issue; continuing" }

# Resolve project id
$projectId = gh project view $ProjectNumber --owner $Owner --format json --jq '.id'
if (-not $projectId) { throw "Failed to resolve project id for $Owner/#$ProjectNumber" }

$fieldsDesired = $config.fields.PSObject.Properties | ForEach-Object { $_.Value | Add-Member -NotePropertyName name -NotePropertyValue $_.Name -PassThru }

Write-Host "[SYNC] Desired managed fields: " ($fieldsDesired | Where-Object {$_.managed}).name -join ', '

# Current fields
$existingJson = gh project field-list $ProjectNumber --owner $Owner --format json
$existing = $existingJson | ConvertFrom-Json

$existingMap = @{}
foreach ($f in $existing.fields) { $existingMap[$f.name] = $f }

$created = @(); $missingOptions = @(); $skipped = @()

if ($ResetManaged) {
  Write-Host "[RESET] Deleting existing managed fields so they can be recreated"
  foreach ($ef in $existing.fields) {
    if ($fieldsDesired | Where-Object { $_.managed -and $_.name -eq $ef.name }) {
      try {
  gh project field-delete $ProjectNumber --id $ef.id 1>$null 2>$null
        Write-Host "[RESET] Deleted field '$($ef.name)'"
      } catch { Write-Warning "Failed delete $($ef.name): $($_.Exception.Message)" }
    }
  }
  Start-Sleep -Seconds 2
  $existingJson = gh project field-list $ProjectNumber --owner $Owner --format json
  $existing = $existingJson | ConvertFrom-Json
  $existingMap = @{}
  foreach ($ef in $existing.fields) { $existingMap[$ef.name] = $ef }
}

foreach ($f in $fieldsDesired | Where-Object { $_.managed -eq $true }) {
  $name = $f.name
  if (-not $existingMap.ContainsKey($name)) {
    Write-Host "[CREATE] Field '$name' (type=$($f.type))"
    if ($f.type -eq 'single_select') {
      $optLabels = ($f.options | ForEach-Object { $_.label }) -join ','
      gh project field-create $ProjectNumber --owner $Owner --name "$name" --data-type SINGLE_SELECT --single-select-options $optLabels | Out-Null
    } elseif ($f.type -eq 'number') {
      gh project field-create $ProjectNumber --owner $Owner --name "$name" --data-type NUMBER | Out-Null
    } elseif ($f.type -eq 'date') {
      gh project field-create $ProjectNumber --owner $Owner --name "$name" --data-type DATE | Out-Null
    } elseif ($f.type -eq 'text') {
      gh project field-create $ProjectNumber --owner $Owner --name "$name" --data-type TEXT | Out-Null
    } else {
      Write-Warning "Unsupported field type for creation: $($f.type) on $name"
      $skipped += $name
      continue
    }
    Start-Sleep -Seconds 1
    # refresh existing
    $existingJson = gh project field-list $ProjectNumber --owner $Owner --format json
    $existing = $existingJson | ConvertFrom-Json
    $existingMap = @{}
    foreach ($ef in $existing.fields) { $existingMap[$ef.name] = $ef }
    $created += $name
  } else {
    # check options if single_select
    if ($f.type -eq 'single_select') {
      $have = @()
      if ($existingMap[$name].options) { $have = $existingMap[$name].options.name }
      $want = $f.options | ForEach-Object { $_.label }
      $diff = $want | Where-Object { $have -notcontains $_ }
      if ($diff.Count -gt 0) {
        Write-Warning "Missing options on existing field '$name': $($diff -join ', ') (manual add required)"
        $missingOptions += @{ field = $name; options = $diff }
      }
    }
  }
}

$summary = [ordered]@{
  timestamp_utc = (Get-Date).ToUniversalTime().ToString("o")
  project = $ProjectNumber
  project_id = $projectId
  created_fields = $created
  missing_options = $missingOptions
  skipped = $skipped
  total_existing = $existing.fields.Count
}

New-Item -ItemType Directory -Force -Path artifacts | Out-Null
$outFile = "artifacts/project-field-sync-summary.json"
$summary | ConvertTo-Json -Depth 6 | Out-File -FilePath $outFile -Encoding utf8
Write-Host "[DONE] Summary written -> $outFile"
