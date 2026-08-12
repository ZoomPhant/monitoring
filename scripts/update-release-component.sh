#!/bin/bash
#
# Standalone utility script to update component versions in the RELEASE file
# This script can be used for manual updates to operator, central, normal, or launcher components
#
# Usage: ./update-release-component.sh <component> <version>
# Example: ./update-release-component.sh operator 4.1.8
#

ROOT=$(cd $(dirname ${BASH_SOURCE[0]})/.. && pwd)

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <component> <version>"
  echo ""
  echo "Available components:"
  echo "  - launcher"
  echo "  - collector"
  echo "  - operator"
  echo "  - central"
  echo "  - normal"
  echo ""
  echo "Example: $0 operator 4.1.8"
  exit 1
fi

component=$1
version=$2

release_file="$ROOT/RELEASE"

if [ ! -f "$release_file" ]; then
  echo "ERROR: RELEASE file not found at $release_file"
  exit 1
fi

echo "Updating ${component} to version ${version} in RELEASE file..."

# Check if the component exists in the RELEASE file
if ! grep -q "^${component}#" "$release_file"; then
  echo "WARNING: Component '${component}' not found in RELEASE file, adding new entry"
  echo "${component}#${version}" >> "$release_file"
else
  # Use sed to update the component version line
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS sed requires -i with backup extension
    sed -i.bak "s/^${component}#.*/${component}#${version}/" "$release_file"
    rm -f "$release_file.bak"
  else
    # Linux sed
    sed -i "s/^${component}#.*/${component}#${version}/" "$release_file"
  fi
fi

echo "✓ Updated ${component} version to ${version}"
echo ""
echo "Current RELEASE file contents:"
echo "----------------------------------------"
cat "$release_file"
echo "----------------------------------------"
echo ""
echo "Don't forget to commit and push the changes:"
echo "  git add RELEASE"
echo "  git commit -m 'Update ${component} to ${version}'"
echo "  git push"
