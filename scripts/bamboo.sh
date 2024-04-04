#!/bin/bash
source /etc/profile

# ROOT=${GITHUB_REPO:-~/monitoring}
ROOT=$(cd $(dirname ${BASH_SOURCE[0]})/.. && pwd)

OWNER=ZoomPhant
REPO=monitoring
TOKEN="${GITHUB_TOKEN}"

# release JSON
RELEASE="{}"

echo "Try building using root $ROOT ..."

remove_asset() {
  local asset=$1

  local selector=$(printf '.assets[] | select(.name=="%s") | .url' "$asset")

  local url=$(jq -r "$selector" <<< $RELEASE)

  if [ -z "$url" ]; then
    echo "Asset url not found, ignored"
  else
    echo "URL: [$url]"

    echo "Removing asset $asset using url $url ..."
    
    local response=$(
      curl -sL -X DELETE -w '\n%{http_code}' \
        --header "Accept: application/vnd.github.v3+json" \
        --header "Authorization: Bearer $TOKEN" \
        --header "X-GitHub-Api-Version: 2022-11-28" \
        $url
    )
    
    echo "Got response $response ..."
  
    local http_code=$(tail -n1 <<< "$response")  # get the last line
    local content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code
  
    if [ $http_code = 204 ]; then
      echo "SUCCESS: Asset $asset successfully deleted from GitHub Release!"
    else
      printf "ERROR: Something went wrong delete asset $asset (status code: $http_code), aborting!\n" >&2
      exit 1
    fi
  fi
}

upload_asset () {
  local asset=$1
  local file=$2

  local FILETYPE=$(file -b --mime-type $file)
  
  local release=$(jq '.id' <<< "$RELEASE")

  local response=$(
    curl -sL -w '\n%{http_code}' \
      -X POST \
      --header "Accept: application/vnd.github.v3+json" \
      --header "Authorization: Bearer $TOKEN" \
      --header "X-GitHub-Api-Version: 2022-11-28" \
      --header "Content-Type: $FILETYPE" \
      --data-binary @$file \
      "https://uploads.github.com/repos/$OWNER/$REPO/releases/$release/assets?name=$asset"
  )

  local http_code=$(tail -n1 <<< "$response")  # get the last line
  local content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

  if [ $http_code = 201 ]; then
    echo "SUCCESS: Asset $asset successfully uploaded to GitHub Release!"
  elif [ $http_code = 422 ]; then
    printf "ERROR: Asset $asset already exist on this GitHub Release, aborting!\n" >&2
    exit 1
  else
    printf "ERROR: Something went wrong uploading asset $asset (status code: $http_code), aborting!\n" >&2
    exit 2
  fi
}

# helper to upload assets to GitHub
# We check the md5 of an assets, if changed, we delete old one and upload new one
# require 5 args
#   version
#   releaseDir
#   asset
#   file
update_asset() {
  local ver=$1;
  local dir=$2;
  local asset=$3;
  local file=$4;

  # if we need to delete old asset
  local delete=0

  # if we need to upload new asset
  local upload=0

  if [ -f "$file" ] && [ -f "$file.md5" ]; then
    # check if md5 exists and changed?
    if [ ! -f "$dir/$asset.md5" ]; then
      upload=1
      cp "$file.md5" "$dir/$asset.md5"
    else
      if [ "$(head -1 "$file.md5")" == "$(head -1 "$dir/$asset.md5")" ]; then
        echo "Intact asset ignored $dir/$asset ..."
      else
        cp "$file.md5" "$dir/$asset.md5"
        delete=1
        upload=1
      fi
    fi
  fi

  if [ $delete -eq 1 ]; then
    echo "Deleting outdated asset $asset.md5 ..."
    remove_asset "$asset.md5"
    
    echo "Deleting outdated asset $asset ..."
    remove_asset "$asset"
  fi

  if [ $upload -eq 1 ]; then
    echo "Uploading new or updated asset $asset.md5 ..."
    upload_asset "$asset.md5" "$file.md5"

    echo "Uploading new or updated asset $asset ..."
    upload_asset "$asset" "$file"
  fi
}

get_release() {
  local tag=$1

  # see we have the release already?
  local response=$(
    curl -sL -w '%{http_code}' \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "https://api.github.com/repos/$OWNER/$REPO/releases/tags/$tag"
  )

  # get the last line
  local http_code=$(tail -n1 <<< "$response")
  
  # get all but the last line which contains the status code
  local content=$(sed '$ d' <<< "$response")   

  if [ $http_code = 200 ]; then
    echo "$content"
    exit 0
  fi
  
  # we allow fail here, let's try create the release
  set -e
  git tag -a $tag -m "Release version $tag" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    git push --tags > /dev/null 2>&1
  fi
  
  data=$(printf '{"tag_name": "%s","target_commitish": "main","name": "%s","body": "%s","draft": false,"prerelease": false,"generate_release_notes":false}' $tag $tag "Release version $tag")

  response=$(
    curl -sL -w '%{http_code}'\
      -X POST \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      https://api.github.com/repos/$OWNER/$REPO/releases \
      -d "$data"
    )

  http_code=$(tail -n1 <<< "$response")  # get the last line
  content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

  if [ $http_code = 201 ]; then
    echo "{}"
  else
    printf "ERROR: Something went wrong for get or create release $tag (status code: $http_code), aborting!\n" >&2
    exit 1;
  fi
}

#
# Prepare the release file. For each version, we create a sub folder under $ROOT/release/,
# and in that folder, we would save each asset's MD5 information
#
# Those MD5 information will be used to decide whether we shall update the asset in GitHub
#
# Required args
#   version
#   assetsDir
prepare_release() {
  local ver=$1
  local assets=$2

  local dir="$ROOT/releases/v$ver"
  if [ ! -d "$dir" ]; then
    echo "Create version release dir $dir ..."
    mkdir -p "$dir"
  fi

  echo "Creating or updating artifacts in $dir ..."

  # assets contains following stuff
  #   agent.zip
  #   agent.zip.md5
  #   linux/x64.bin
  #   linux/x64.bin.md5
  #   linux/86.bin
  #   linux/x86.bin.md5
  #   windows/x64.exe
  #   windows/x64.exe.md5
  #   windows/86.exe
  #   windows/x86.exe.md5
  update_asset $ver $dir "upgrader.zip" "$assets/agent.zip"
  update_asset $ver $dir "installer-linux-x64.bin" "$assets/linux/x64.bin"
  update_asset $ver $dir "installer-linux-x86.bin" "$assets/linux/x86.bin"
  update_asset $ver $dir "installer-windows-x64.exe" "$assets/windows/x64.exe"
  update_asset $ver $dir "installer-windows-x86.exe" "$assets/windows/x86.exe"

  # add all the stuff to git
  git add "$dir"
}

cd $ROOT

# 1. check if release file exists
version=`ls $ROOT/zpagent-release-*.gz | xargs basename | cut -d - -f 3 | cut -d . -f 1-3`
echo "Found release version $version ..."
if [ -z "$version" ]; then
  echo "No release file found"
  exit 1
fi

if [ ! -f ./zpagent-release-$version.tar.gz ]; then
  echo "Cannot find release file for version $version"
  exit 2
fi

set -e

# let's try to create the release if not existing yet
# release contains the assets info as .assets[{...}, {...}]
RELEASE=$(get_release "v${version}")

echo "Updating GitHub repo ..."
# Now do the job
# make sure we are latest
git pull

# 2. create a temp folder and extract all the stuff in it
ASSETS_DIR=$(mktemp -d -t zpagent-XXXXXXXXXX)
trap 'rm -rf -- "$ASSETS_DIR"' EXIT

echo "Extracting artifacts to $ASSETS_DIR ..."

tar xzvf ./zpagent-release-$version.tar.gz -C $ASSETS_DIR

# 3. prepare release
prepare_release $version $ASSETS_DIR 

# RELEASE is updated outside of the script now, in multiple lines like
#   collector##v4.2.20, etc.
## 4. update the release info
## echo $version > $ROOT/RELEASE

git commit -a -m "Release $version"

git push

