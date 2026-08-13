#!/bin/bash
#
# Clean GitHub Releases
# 
# This script can:
# 1. Delete a specific release version
# 2. Delete all releases up to (and including) a given version
#
# Usage:
#   ./clean-releases.sh --version 2.4.15              # Delete only v2.4.15
#   ./clean-releases.sh --up-to 2.4.20                # Delete all versions <= v2.4.20
#   ./clean-releases.sh --up-to 2.4.20 --dry-run      # Preview what would be deleted
#
# Requirements:
#   - GITHUB_TOKEN environment variable must be set
#   - GITHUB_REPOSITORY environment variable (format: owner/repo)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
MODE=""
TARGET_VERSION=""

# Function to print usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    --version <version>     Delete a specific version (e.g., 2.4.15)
    --up-to <version>       Delete all versions up to and including this version
    --dry-run               Preview what would be deleted without actually deleting
    -h, --help              Show this help message

Examples:
    # Delete only v2.4.15
    $0 --version 2.4.15

    # Delete all versions up to and including v2.4.20
    $0 --up-to 2.4.20

    # Preview what would be deleted
    $0 --up-to 2.4.20 --dry-run

Environment Variables:
    GITHUB_TOKEN            Required: GitHub API token with repo permissions
    GITHUB_REPOSITORY       Required: Repository in format owner/repo

EOF
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            MODE="single"
            TARGET_VERSION="$2"
            shift 2
            ;;
        --up-to)
            MODE="range"
            TARGET_VERSION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}ERROR: Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Validate inputs
if [ -z "$MODE" ] || [ -z "$TARGET_VERSION" ]; then
    echo -e "${RED}ERROR: Must specify either --version or --up-to${NC}"
    usage
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}ERROR: GITHUB_TOKEN environment variable is required${NC}"
    exit 1
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
    echo -e "${RED}ERROR: GITHUB_REPOSITORY environment variable is required${NC}"
    exit 1
fi

# Validate version format (x.y.z where x, y, z are numbers)
if ! [[ "$TARGET_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}ERROR: Invalid version format: $TARGET_VERSION${NC}"
    echo "Expected format: x.y.z (e.g., 2.4.15)"
    exit 1
fi

# Function to compare semantic versions
# Returns: 0 if v1 == v2, 1 if v1 > v2, 2 if v1 < v2
version_compare() {
    local v1=$1
    local v2=$2
    
    # Split versions into components
    IFS='.' read -r -a v1_parts <<< "$v1"
    IFS='.' read -r -a v2_parts <<< "$v2"
    
    # Compare major version
    if [ "${v1_parts[0]}" -gt "${v2_parts[0]}" ]; then
        return 1
    elif [ "${v1_parts[0]}" -lt "${v2_parts[0]}" ]; then
        return 2
    fi
    
    # Compare minor version
    if [ "${v1_parts[1]}" -gt "${v2_parts[1]}" ]; then
        return 1
    elif [ "${v1_parts[1]}" -lt "${v2_parts[1]}" ]; then
        return 2
    fi
    
    # Compare patch version
    if [ "${v1_parts[2]}" -gt "${v2_parts[2]}" ]; then
        return 1
    elif [ "${v1_parts[2]}" -lt "${v2_parts[2]}" ]; then
        return 2
    fi
    
    return 0
}

# Function to get all releases from GitHub
get_all_releases() {
    local page=1
    local per_page=100
    local all_releases=""
    
    while true; do
        local response=$(curl -s -H "Accept: application/vnd.github.v3+json" \
            -H "Authorization: Bearer $GITHUB_TOKEN" \
            "https://api.github.com/repos/${GITHUB_REPOSITORY}/releases?per_page=${per_page}&page=${page}")
        
        # Check if response is empty or error
        if [ -z "$response" ] || [ "$response" == "[]" ]; then
            break
        fi
        
        all_releases="${all_releases}${response}"
        
        # Check if we got less than per_page results (last page)
        local count=$(echo "$response" | jq '. | length')
        if [ "$count" -lt "$per_page" ]; then
            break
        fi
        
        page=$((page + 1))
    done
    
    echo "$all_releases"
}

# Function to delete a release
delete_release() {
    local release_id=$1
    local tag_name=$2
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would delete release: ${tag_name} (ID: ${release_id})"
        return
    fi
    
    echo -e "${BLUE}Deleting release: ${tag_name} (ID: ${release_id})...${NC}"
    
    # Delete the release
    local response=$(curl -s -X DELETE \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        "https://api.github.com/repos/${GITHUB_REPOSITORY}/releases/${release_id}")
    
    if [ -z "$response" ]; then
        echo -e "${GREEN}✓ Release deleted${NC}"
    else
        echo -e "${RED}✗ Failed to delete release${NC}"
        echo "$response" | jq .
        return 1
    fi
    
    # Delete the git tag
    echo -e "${BLUE}Deleting git tag: ${tag_name}...${NC}"
    local tag_response=$(curl -s -X DELETE \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        "https://api.github.com/repos/${GITHUB_REPOSITORY}/git/refs/tags/${tag_name}")
    
    if [ -z "$tag_response" ]; then
        echo -e "${GREEN}✓ Git tag deleted${NC}"
    else
        echo -e "${YELLOW}⚠ Failed to delete git tag (may not exist)${NC}"
    fi
    
    echo ""
}

# Main logic
echo "========================================"
echo "GitHub Release Cleanup Tool"
echo "========================================"
echo ""
echo "Repository: $GITHUB_REPOSITORY"
echo "Mode: $MODE"
echo "Target Version: $TARGET_VERSION"
echo "Dry Run: $DRY_RUN"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}⚠ DRY RUN MODE - No changes will be made${NC}"
    echo ""
fi

echo "Fetching releases from GitHub..."
ALL_RELEASES=$(get_all_releases)

if [ -z "$ALL_RELEASES" ] || [ "$ALL_RELEASES" == "[]" ]; then
    echo -e "${YELLOW}No releases found${NC}"
    exit 0
fi

# Parse releases and filter based on mode
declare -a releases_to_delete

if [ "$MODE" == "single" ]; then
    # Single version mode - find exact match
    echo "Looking for release v${TARGET_VERSION}..."
    
    RELEASE_DATA=$(echo "$ALL_RELEASES" | jq -r ".[] | select(.tag_name == \"v${TARGET_VERSION}\")")
    
    if [ -z "$RELEASE_DATA" ]; then
        echo -e "${YELLOW}Release v${TARGET_VERSION} not found${NC}"
        exit 0
    fi
    
    RELEASE_ID=$(echo "$RELEASE_DATA" | jq -r '.id')
    TAG_NAME=$(echo "$RELEASE_DATA" | jq -r '.tag_name')
    
    echo -e "${GREEN}Found release: ${TAG_NAME}${NC}"
    echo ""
    
    # Confirm before deletion
    if [ "$DRY_RUN" = false ]; then
        read -p "Delete this release? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Cancelled"
            exit 0
        fi
    fi
    
    delete_release "$RELEASE_ID" "$TAG_NAME"
    
elif [ "$MODE" == "range" ]; then
    # Range mode - find all versions <= target
    echo "Looking for all releases up to v${TARGET_VERSION}..."
    echo ""
    
    # Get all releases and filter by version
    while IFS= read -r line; do
        RELEASE_ID=$(echo "$line" | jq -r '.id')
        TAG_NAME=$(echo "$line" | jq -r '.tag_name')
        
        # Extract version number (remove 'v' prefix)
        VERSION="${TAG_NAME#v}"
        
        # Skip if not in x.y.z format
        if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            continue
        fi
        
        # Compare versions
        version_compare "$VERSION" "$TARGET_VERSION"
        result=$?
        
        # If version <= target (result is 0 or 2)
        if [ $result -eq 0 ] || [ $result -eq 2 ]; then
            releases_to_delete+=("$RELEASE_ID|$TAG_NAME")
            echo -e "${BLUE}→${NC} $TAG_NAME"
        fi
    done < <(echo "$ALL_RELEASES" | jq -c '.[]')
    
    if [ ${#releases_to_delete[@]} -eq 0 ]; then
        echo -e "${YELLOW}No releases found matching criteria${NC}"
        exit 0
    fi
    
    echo ""
    echo -e "${GREEN}Found ${#releases_to_delete[@]} release(s) to delete${NC}"
    echo ""
    
    # Confirm before deletion
    if [ "$DRY_RUN" = false ]; then
        read -p "Delete these releases? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Cancelled"
            exit 0
        fi
        echo ""
    fi
    
    # Delete releases
    for item in "${releases_to_delete[@]}"; do
        IFS='|' read -r RELEASE_ID TAG_NAME <<< "$item"
        delete_release "$RELEASE_ID" "$TAG_NAME"
    done
fi

echo "========================================"
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY RUN COMPLETE${NC}"
else
    echo -e "${GREEN}CLEANUP COMPLETE${NC}"
fi
echo "========================================"
