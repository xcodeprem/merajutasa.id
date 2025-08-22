<#
	Bulk Issues Backfill Automation
	Normalizes all (or limited) open issues into governed labels & project fields.

	Usage:
		pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/project-issues-backfill.ps1 -RepoOwner codexridd -Repo merajutasa.id -Limit 50

	Parameters:
		-RepoOwner         GitHub username that owns both repo & user project (user project v2)
		-Repo              Repository name
		-Limit             (Optional) Max open issues to process (oldest first)
		-ConfigPath        Path to governance schema JSON
		-SinceIssue        Only process issues with number >= this (useful to resume)
		-DryRun            If set, do not mutate (labels, project fields, comments) – just simulate & report

	Notes:
		- Respects automation_policy.skip_if_label_present (manual-override, no-auto)
		- Adds governed labels comp:*, team:*, priority:*
		- Derives Component, Team, Priority, SLA Tier, Response/Resolve Targets, Last Automation Sync, Triage State
		- Implements exponential-ish backoff using automation_policy.retry_backoff_seconds on rate limit errors
		- If a required single-select option is missing (e.g. new component key not yet in field), logs error & skips field set (labels still applied)
		- Idempotent: repeated runs will only fill missing labels/fields & update sync date
#>
param(
	[Parameter(Mandatory=$true)][string]$RepoOwner,
	[Parameter(Mandatory=$true)][string]$Repo,
	[int]$Limit = 0,
	[string]$ConfigPath = 'config/governance/project-field-schema.json',
	[int]$SinceIssue = 0,
	[switch]$DryRun
)

$ErrorActionPreference = 'Stop'
function Test-CmdAvailable($n){ if (-not (Get-Command $n -ErrorAction SilentlyContinue)) { throw "Missing required CLI: $n" } }
Test-CmdAvailable gh

if (-not (Test-Path $ConfigPath)) { throw "Config not found: $ConfigPath" }
$config = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json

# Derive project owner/id from config if matches user
if ($config.project_reference.url -match 'https://github.com/users/([^/]+)/projects/([0-9]+)') {
	$projectOwner = $Matches[1]
	$projectNumber = [int]$Matches[2]
} else { throw 'Cannot parse project_reference.url' }
if ($projectOwner -ne $RepoOwner) { Write-Warning "RepoOwner ($RepoOwner) differs from project owner ($projectOwner); proceeding" }

$skipLabels = $config.automation_policy.skip_if_label_present
$backoffs = $config.automation_policy.retry_backoff_seconds
if (-not $backoffs) { $backoffs = @(2,5,15) }

Write-Host "[INIT] Project owner=$projectOwner projectNumber=$projectNumber repo=$RepoOwner/$Repo"

function Invoke-WithRetry([scriptblock]$Operation,[string]$Context){
	$attempt = 0
	while ($true) {
		try { return & $Operation } catch {
			$msg = $_.Exception.Message
			if ($msg -match 'rate limit exceeded' -or $msg -match 'secondary rate limit') {
				if ($attempt -ge ($backoffs.Count)) { throw "Rate limit persists after $attempt retries for ${Context}: $msg" }
				$delay = $backoffs[$attempt]
				Write-Warning "[RETRY] Rate limit for $Context (attempt=$attempt) sleeping ${delay}s"
				Start-Sleep -Seconds $delay
				$attempt++
				continue
			} else { throw }
		}
	}
}

function Get-OpenIssues(){
	# Use pagination via gh api; keep concise (first 200 if no limit)
	$perPage = 100
	$page = 1
	$collected = @()
	while ($true) {
	$json = gh api "repos/$RepoOwner/$Repo/issues?state=open&per_page=$perPage&page=$page" 2>$null
		if (-not $json) { break }
		$batch = $json | ConvertFrom-Json
		if (-not $batch) { break }
		$onlyIssues = $batch | Where-Object { -not $_.pull_request } | Where-Object { $_.number -ge $SinceIssue }
		$collected += $onlyIssues
		if ($Limit -gt 0 -and $collected.Count -ge $Limit) { break }
		if ($batch.Count -lt $perPage) { break }
		$page++
	}
	if ($Limit -gt 0 -and $collected.Count -gt $Limit) { $collected = $collected | Select-Object -First $Limit }
	# oldest first for stability
	return ($collected | Sort-Object number)
}

function Get-DerivedComponent($title,$body){
	$text = ($title + ' ' + $body) -as [string]
	$ltext = $text.ToLower()
	foreach ($rule in $config.derivation.component_regex) {
		if ($ltext -match $rule.pattern) { return $rule.component_key }
	}
	return 'infrastructure'
}

function Get-ComponentLabel($key){ ($config.fields.Components.options | Where-Object { $_.key -eq $key }).label }
function Get-DerivedTeam($componentKey){
	$rule = $config.derivation.team_rules | Where-Object { $_.component_key -eq $componentKey } | Select-Object -First 1
	if ($rule) { return $rule.team } else { return 'Platform' }
}
function Get-DerivedPriority($labels,$title,$body){
	$existing = $labels | Where-Object { $_ -match '^priority:p[0-3]$' }
	if ($existing) { $first = if ($existing -is [Array]) { $existing[0] } else { $existing }; return (($first -split ':')[1]).ToUpper() }
	$text = ($title + ' ' + $body).ToLower()
	$kw = $config.fields.Priority.rules.keywords
	if ($kw.p0 | Where-Object { $text.Contains($_) }) { return 'P0' }
	if ($kw.p1 | Where-Object { $text.Contains($_) }) { return 'P1' }
	if ($kw.p3 | Where-Object { $text.Contains($_) }) { return 'P3' }
	return $config.fields.Priority.rules.default
}
function Get-SLAForPriority($prio){ $tierMap = $config.fields.'SLA Tier'.rules.mapping; $tier = $tierMap.$prio; $sla = $config.sla_matrix.$prio; return [ordered]@{ tier=$tier; response=$sla.response_hours; resolve=$sla.resolve_hours } }
function Get-TriageState($issue,$labels){
	$rules = $config.fields.'Triage State'.rules
	$bodyText = if ($issue.body) { $issue.body } else { '' }
	$text = ($issue.title + ' ' + $bodyText)
	$ltext = $text.ToLower()
	if ($labels | Where-Object { $_ -eq 'priority:p0' }) { return 'Ready' }
	if ($rules.waiting_keywords | Where-Object { $ltext.Contains($_) }) { return 'Waiting' }
	if ($rules.needs_info_keywords | Where-Object { $ltext.Contains($_) }) { return 'Needs Info' }
	# createdAt property from gh issue view
	$created = Get-Date $issue.createdAt
	if ((Get-Date) - $created -lt ([TimeSpan]::FromDays($rules.recent_days_new))) { return 'New' }
	return 'Ready'
}
function Invoke-LegacyLabelMigration([string[]]$labels){
	$adds=@();$rem=@()
	foreach ($l in $labels){
		switch -Regex ($l) {
			'^P([0-3])$' { $adds += "priority:p$($Matches[1])"; $rem += $l }
			'^automation$' { $adds += 'comp:automation'; $rem += $l }
			'^infrastructure$' { $adds += 'comp:infrastructure'; $rem += $l }
			'^governance$' { $adds += 'team:governance'; $rem += $l }
			'^security$' { $adds += 'team:security'; $rem += $l }
		}
	}
	@{ add=($adds|Sort-Object -Unique); remove=($rem|Sort-Object -Unique) }
}

# Preload project fields & option indexes
$projectId = gh project view $projectNumber --owner $projectOwner --format json --jq '.id'
if (-not $projectId) { throw 'Could not resolve project id' }
$fieldsJson = gh project field-list $projectNumber --owner $projectOwner --format json
$fields = ($fieldsJson | ConvertFrom-Json).fields
$fieldIndex = @{}
foreach ($f in $fields) { $fieldIndex[$f.name] = $f }

function Get-SingleSelectOptionId($fieldName,[string]$label){ if (-not $fieldIndex.ContainsKey($fieldName)) { return $null }; $opt = $fieldIndex[$fieldName].options | Where-Object { $_.name -eq $label }; return $opt.id }
function Get-ProjectItemEnsured([int]$n){
	$existing = gh project item-list $projectNumber --owner $projectOwner --format json --jq ".items[] | select(.content.number==$n) | .id"
	if ($existing) { return $existing }
	if ($DryRun) { return "DRYRUN-$n" }
	gh project item-add $projectNumber --owner $projectOwner --url "https://github.com/$RepoOwner/$Repo/issues/$n" | Out-Null
	Start-Sleep -Milliseconds 600
	return gh project item-list $projectNumber --owner $projectOwner --format json --jq ".items[] | select(.content.number==$n) | .id"
}
function Set-SingleSelect([string]$itemId,[string]$fieldName,[string]$value){ if (-not $value) { return }; $optId = Get-SingleSelectOptionId $fieldName $value; if (-not $optId) { Write-Warning "Option '$value' missing for field '$fieldName'"; return }; if ($DryRun) { return }; gh project item-edit --id $itemId --project-id $projectId --field-id $fieldIndex[$fieldName].id --single-select-option-id $optId | Out-Null }
function Set-Number([string]$itemId,[string]$fieldName,[int]$val){ if ($DryRun) { return }; if (-not $fieldIndex.ContainsKey($fieldName)) { return }; gh project item-edit --id $itemId --project-id $projectId --field-id $fieldIndex[$fieldName].id --number $val | Out-Null }
function Set-Date([string]$itemId,[string]$fieldName,[datetime]$dt){ if ($DryRun) { return }; if (-not $fieldIndex.ContainsKey($fieldName)) { return }; gh project item-edit --id $itemId --project-id $projectId --field-id $fieldIndex[$fieldName].id --date ($dt.ToString('yyyy-MM-dd')) | Out-Null }

$issues = Get-OpenIssues
Write-Host "[SCAN] Found $($issues.Count) open issues (limit=$Limit since=$SinceIssue)"

$processed = @(); $stats = [ordered]@{ issues_processed=0; fields_set=0; skipped_manual=0; errors=0 }

foreach ($issue in $issues) {
	$n = $issue.number
	try {
		$detail = Invoke-WithRetry { gh issue view $n -R "$RepoOwner/$Repo" --json number,title,body,labels,createdAt,url } "issue#$n" | ConvertFrom-Json
		$labels = $detail.labels.name
		if ($labels -and ($skipLabels | Where-Object { $labels -contains $_ })) { Write-Host "[SKIP] #$n manual override"; $stats.skipped_manual++; $processed += @{ issue=$n; skipped='manual-override' }; continue }
		$componentKey = Get-DerivedComponent $detail.title $detail.body
		$componentLabel = Get-ComponentLabel $componentKey
		$team = Get-DerivedTeam $componentKey
		$priority = Get-DerivedPriority $labels $detail.title $detail.body
		$sla = Get-SLAForPriority $priority
		$triage = Get-TriageState $detail $labels

		# Legacy migration
		$migration = Invoke-LegacyLabelMigration $labels
		if (-not $DryRun) {
			if ($migration.add.Count -gt 0) { gh issue edit $n -R "$RepoOwner/$Repo" --add-label ($migration.add -join ',') | Out-Null; $labels = ($labels + $migration.add) | Sort-Object -Unique }
			if ($migration.remove.Count -gt 0) { gh issue edit $n -R "$RepoOwner/$Repo" --remove-label ($migration.remove -join ',') | Out-Null; $labels = $labels | Where-Object { $migration.remove -notcontains $_ } }
		}

		# Governed labels
		$labelAdds = @()
		if ($componentLabel) { $desiredComp = "comp:$componentKey"; if ($labels -notcontains $desiredComp) { $labelAdds += $desiredComp } }
		$desiredTeam = "team:$($team.ToLower())"; if ($labels -notcontains $desiredTeam) { $labelAdds += $desiredTeam }
		$desiredPrio = "priority:$($priority.ToLower())"; if ($labels -notcontains $desiredPrio) { $labelAdds += $desiredPrio }
		if ($labelAdds.Count -gt 0 -and -not $DryRun) { gh issue edit $n -R "$RepoOwner/$Repo" --add-label ($labelAdds -join ',') | Out-Null }

		$itemId = Get-ProjectItemEnsured $n
		if ($itemId) {
			Set-SingleSelect $itemId 'Components' $componentLabel
			Set-SingleSelect $itemId 'Teams' $team
			Set-SingleSelect $itemId 'Priority' $priority
			Set-SingleSelect $itemId 'SLA Tier' $sla.tier
			Set-Number $itemId 'Response Target (hrs)' $sla.response
			Set-Number $itemId 'Resolve Target (hrs)' $sla.resolve
			Set-Date $itemId 'Last Automation Sync' (Get-Date).ToUniversalTime()
			Set-SingleSelect $itemId 'Triage State' $triage
			$stats.fields_set += 7
		}

		# Comment once
		$marker = $config.automation_policy.comment_once_marker
		$commentsJson = Invoke-WithRetry { gh issue view $n -R "$RepoOwner/$Repo" --json comments } "comments#$n"
		$commentBodies = ($commentsJson | ConvertFrom-Json).comments.body
		if (-not ($commentBodies | Where-Object { $_ -like "*$marker*" })) {
			if (-not $DryRun) {
				$summary = @(
					"Component: $componentLabel ($componentKey)",
					"Team: $team",
					"Priority: $priority (SLA: resp $($sla.response)h / res $($sla.resolve)h)",
					"Labels Added: $($labelAdds -join ', ')",
					"Legacy Migrated: add=[$($migration.add -join ',')] remove=[$($migration.remove -join ',')]",
					"Triage State: $triage",
					"Override: add label 'manual-override' to stop future automation"
				)
				$body = "${marker}`nAuto Backfill Summary`n`n- " + ($summary -join "`n- ")
				gh issue comment $n -R "$RepoOwner/$Repo" --body $body | Out-Null
			}
		}

		Write-Host "[OK] #$n comp=$componentKey team=$team prio=$priority triage=$triage"
		$stats.issues_processed++
		$processed += @{ issue=$n; component=$componentKey; team=$team; priority=$priority; triage=$triage; labels_added=$labelAdds; migration=$migration }
	} catch {
		$err = $_.Exception.Message
		Write-Warning "[ERR] #$n $err"
		$stats.errors++
		$processed += @{ issue=$n; error=$err }
	}
}

New-Item -ItemType Directory -Force -Path artifacts | Out-Null
$out = [ordered]@{
	timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
	project_number = $projectNumber
	repo = "$RepoOwner/$Repo"
	dry_run = [bool]$DryRun
	stats = $stats
	results = $processed
}
$outFile = 'artifacts/project-issues-backfill-summary.json'
$out | ConvertTo-Json -Depth 8 | Out-File -FilePath $outFile -Encoding utf8
Write-Host "[DONE] Summary -> $outFile"

