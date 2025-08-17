#!/bin/bash
set -euo pipefail

# check-actions-pinning.sh
# Linter script that enforces GitHub Actions must be pinned to commit SHA (not tags)
# Allows local actions (./path) without @

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ALLOWLIST_PATH="$REPO_ROOT/.github/actions-allowlist.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

violations=0
warnings=0

log_error() {
    echo -e "${RED}ERROR:${NC} $1" >&2
    ((violations++))
}

log_warn() {
    echo -e "${YELLOW}WARN:${NC} $1" >&2
    ((warnings++))
}

log_info() {
    echo -e "${GREEN}INFO:${NC} $1"
}

# Load allowlist if it exists
load_allowlist() {
    if [[ -f "$ALLOWLIST_PATH" ]]; then
        log_info "Loading allowlist from $ALLOWLIST_PATH"
        return 0
    else
        log_warn "Allowlist not found at $ALLOWLIST_PATH"
        return 1
    fi
}

# Check if an action SHA is in the allowlist
check_allowlist() {
    local action="$1"
    local sha="$2"
    
    if [[ ! -f "$ALLOWLIST_PATH" ]]; then
        return 1
    fi
    
    # Use node to check JSON allowlist
    node -e "
        const fs = require('fs');
        const allowlist = JSON.parse(fs.readFileSync('$ALLOWLIST_PATH', 'utf8'));
        const action = '$action';
        const sha = '$sha';
        
        const entry = allowlist.allowed_actions.find(a => a.action === action);
        if (entry && entry.allowed_shas.includes(sha)) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    " 2>/dev/null
}

# Validate SHA format (40 character hex string)
validate_sha() {
    local sha="$1"
    if [[ $sha =~ ^[a-f0-9]{40}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Check a single workflow file
check_workflow() {
    local workflow_file="$1"
    local filename=$(basename "$workflow_file")
    
    log_info "Checking workflow: $filename"
    
    # Extract uses: lines that reference actions
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ $line =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
            continue
        fi
        
        # Match 'uses:' lines
        if [[ $line =~ ^[[:space:]]*uses:[[:space:]]*(.+)$ ]]; then
            local action_ref="${BASH_REMATCH[1]}"
            # Remove quotes if present
            action_ref=$(echo "$action_ref" | sed 's/^["'\'']//' | sed 's/["'\'']$//')
            
            # Skip local actions (start with ./ or /)
            if [[ $action_ref =~ ^\./ ]] || [[ $action_ref =~ ^/ ]]; then
                log_info "  ✓ Local action: $action_ref"
                continue
            fi
            
            # Check if it contains @
            if [[ $action_ref =~ ^([^@]+)@(.+)$ ]]; then
                local action="${BASH_REMATCH[1]}"
                local ref="${BASH_REMATCH[2]}"
                
                # Remove any comments after the ref (e.g., "# v4.1.7")
                ref=$(echo "$ref" | sed 's/[[:space:]]*#.*//')
                
                # Check if ref is a commit SHA (40 hex chars)
                if validate_sha "$ref"; then
                    # Check if SHA is in allowlist
                    if check_allowlist "$action" "$ref"; then
                        log_info "  ✓ Action pinned to approved SHA: $action@$ref"
                    else
                        log_warn "  ? Action pinned to SHA but not in allowlist: $action@$ref"
                    fi
                else
                    log_error "  ✗ Action not pinned to commit SHA: $action_ref (found tag/branch: $ref)"
                fi
            else
                log_error "  ✗ Action missing @ reference: $action_ref"
            fi
        fi
    done < "$workflow_file"
}

# Main execution
main() {
    log_info "GitHub Actions Pinning Linter"
    log_info "==============================="
    
    # Change to repo root
    cd "$REPO_ROOT"
    
    # Load allowlist
    load_allowlist
    
    # Find all workflow files
    workflow_files=()
    if [[ -d ".github/workflows" ]]; then
        while IFS= read -r file; do
            if [[ -n "$file" ]]; then
                workflow_files+=("$file")
            fi
        done < <(find .github/workflows -name "*.yml" -o -name "*.yaml")
    fi
    
    if [[ ${#workflow_files[@]} -eq 0 ]]; then
        log_warn "No workflow files found"
        exit 0
    fi
    
    # Check each workflow
    for workflow in "${workflow_files[@]}"; do
        check_workflow "$workflow"
    done
    
    # Summary
    echo
    log_info "Summary: $violations violations, $warnings warnings"
    
    if [[ $violations -gt 0 ]]; then
        echo
        log_error "Actions pinning check FAILED"
        exit 1
    else
        echo
        log_info "Actions pinning check PASSED"
        exit 0
    fi
}

# Run main function
main "$@"