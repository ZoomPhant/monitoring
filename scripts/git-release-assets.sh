#!/bin/bash

# if we shall try to delete an asset before uploading
delete=0

# create release if not exists
create=0

message="n/a"

# token to use to interact with GitHub, otherwise using GITHUB_TOKEN environment variable
token=
while getopts "cdhm:t:?" opt
do
    case $opt in
    (c) create=1 ;;
    (d) delete=1 ;;
    (m) message="${OPTARG}";;
    (t) token="${OPTARG}";;
    (h|?)
    echo "Usage: git-release-assets.sh [-d] [-h|?] <owner> <repo> [<tag> [<file>]]"
    echo "    -c           Create a release if it is not existing"
    echo "    -d           Delete asset if already exists, otherwise it will fail."
    echo "    -m <message> Message to describe the action, e.g. when creating a release"
    echo "    -t <token>   GitHub token to use. If not given, will read from GITHUB_TOKEN environment variable"
    echo "    -h|-?        Print this help message"
    echo "    owner        The repository or account name of GitHub, e.g. ZoomPhant"
    echo "    repo         The repository name, e.g. monitoring"
    echo "    tag          The release tag, e.g. v2.3.50, if not given, this program will list all release tag to their release IDs"
    echo "    file         The file to upload, if not given, this program will list all assets within the given release tag"
    ;;
    (*) printf "Illegal option '-%s'\n" "$opt" && exit 1 ;;
    esac
done

# remove option arguments
shift $((OPTIND-1))

TOKEN="${GITHUB_TOKEN:-$token}"

if [ -z "$TOKEN" ]; then
  echo "Missing GitHub API token, set it as GITHUB_TOKEN environment variable or pass in as -t <token>"
  exit 255;
fi

if [ "$#" -lt 2 ]; then
  echo "Usage: git-release-assets.sh [-d] [t <token>] [-h|?] <owner> <repo> [<tag> [<file>]]"
  exit 255;
fi

OWNER=$1
REPO=$2
RELEASE_TAG=
FILE=

if [ "$#" -ge 3 ]; then
  RELEASE_TAG=$3
fi

if [ "$#" -ge 4 ]; then
  FILE=$4
fi

# best effort, if already exists, ignore
create_tag() {
  tag=$1
  msg="$2"

  echo "Creating tag $tag ..."
  git tag -a $tag -m "$msg"
  git push --tags
  echo "Tag $tag created."
}

remove_tag() {
  tag=$1

  echo "Removing tag $tag ..."
  # delete local
  git tag -d $1
  #delete remote
  git push --delete origin $1
  echo "Tag $tag removed"
}

get_release() {
  tag=$1

  response=$(
    curl -sL -w '%{http_code}' \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "https://api.github.com/repos/$OWNER/$REPO/releases/tags/$tag"
  )

  # get the last line
  http_code=$(tail -n1 <<< "$response")
  
  # get all but the last line which contains the status code
  content=$(sed '$ d' <<< "$response")   

  if [ $http_code = 200 ]; then
    jq '.id' <<< "$content"
  else
     ## Send message to stderr.
    printf "Error retrieving release ID for tag $tag (status code: $http_code), aborting!\n" >&2
    exit 1
  fi
}

# best effort, if already exists, ignore
create_release() {
  tag=$1
  msg="$2"

  # first create the tag
  echo "Try create tag $tag ..."
  create_tag $tag "$msg";

  # now create the release
  echo "Try create release with tag $tag ..."

  data=$(printf '{"tag_name": "%s","target_commitish": "main","name": "%s","body": "%s","draft": false,"prerelease": false,"generate_release_notes":false}' $tag $tag "$msg")

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
    echo "Release with tag $tag successfully created"
  elif [ $http_code = 422 ]; then
    echo "Release with tag $tag already exists"
  else
    printf "ERROR: Something went wrong (status code: $http_code), aborting!\n" >&2
    exit 1;
  fi
}

remove_release() {
  tag=$1
  echo "Try get release ID for tag $tag ..."
  release=$(get_release $tag) || exit 1

  echo "Try delete release with ID $release ..."
  curl -L \
    -X DELETE \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    https://api.github.com/repos/$OWNER/$REPO/releases/$release

  # now delete the tag
  echo "Try delete tag $tag ..."
  remove_tag $1

  echo "Release with tag $tag successfully deleted"
}


upload_asset () {
  echo ""
  echo "Uploading asset ($FILENAME) to GitHub Release..."

  release=$(get_release $RELEASE_TAG) || exit 1
  
  response=$(
    curl -sL -w '%{http_code}' \
      -X POST \
      --header "Accept: application/vnd.github.v3+json" \
      --header "Authorization: Bearer $TOKEN" \
      --header "X-GitHub-Api-Version: 2022-11-28" \
      --header "Content-Type: $FILETYPE" \
      --data-binary @$FILE \
      "https://uploads.github.com/repos/$OWNER/$REPO/releases/$release/assets?name=$FILENAME"
  )

  http_code=$(tail -n1 <<< "$response")  # get the last line
  content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

  if [ $http_code = 201 ]; then
    echo "SUCCESS: Asset ($FILENAME) successfully uploaded to GitHub Release!"
  elif [ $http_code = 422 ]; then
    printf "ERROR: Asset ($FILENAME) already exist on this GitHub Release, aborting!\n" >&2
    exit 1
  else
    printf "ERROR: Something went wrong (status code: $http_code), aborting!\n" >&2
    exit 1
  fi
}

delete_asset () {
  local ASSET_URL=$1

  echo ""
  if [ -z ${ASSET_URL+x} ]; then
    printf "Missing argument ASSET_URL, aborting!!\n" >&2
    exit 1
  fi

  echo "Deleting asset ($FILENAME) from GitHub Release..."

  response=$(
    curl -sL -w '%{http_code}' \
      -X DELETE \
      --header "Accept: application/vnd.github.v3+json" \
      --header "Authorization: token $TOKEN" \
      --header "X-GitHub-Api-Version: 2022-11-28" \
      $ASSET_URL
  )

  http_code=$(tail -n1 <<< "$response")  # get the last line
  content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code
  
  if [ $http_code = 204 ]; then
    echo "SUCCESS: Asset ($FILENAME) successfully deleted from GitHub Release!"
  else
    printf "ERROR: Something went wrong (status code: $http_code), aborting!\n" >&2
    exit 1
  fi
}

list_releases() {
  response=$(
    curl -sL -w '%{http_code}' \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Authorization: token $TOKEN" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      https://api.github.com/repos/$OWNER/$REPO/releases
  )

  http_code=$(tail -n1 <<< "$response")  # get the last line
  content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

  if [ $http_code = 200 ]; then
    jq '.[] | .tag_name + " => " + (.id|tostring)' <<< "$content"
  else
    printf "ERROR: Something went wrong (status code: $http_code), aborting!\n" >&2
    exit 1
  fi
}

list_assets() {
  release=$(get_release $RELEASE_TAG) || exit 1

  echo "Try listing releases with release ID $release ..."
  response=$(
    curl -sL -w '%{http_code}' \
      -H "Accept: application/vnd.github.v3+json" \
      -H "Authorization: token $TOKEN" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      https://api.github.com/repos/$OWNER/$REPO/releases/$release/assets
  )

  http_code=$(tail -n1 <<< "$response")  # get the last line
  content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

  if [ $http_code = 200 ]; then
    echo "Assets in release with tag $RELEASE_TAG:"
    jq '.[] | .name + " => " + (.size|tostring) + ": " + .url' <<< "$content"
  else
    printf "ERROR: Something went wrong (status code: $http_code), aborting!\n" >&2
    exit 1
  fi
}

if [ -z "$RELEASE_TAG" ]; then
  echo "Try list all releases for $OWNER/$REPO ..."
  list_releases
elif [ -z "$FILE" ]; then
  if [ $create -eq 1 ]; then
    echo "Try create release with tag $RELEASE_TAG ..."
    create_release $RELEASE_TAG "$message"
  elif [ $delete -eq 1 ]; then
    echo "Try delete release with tag $RELEASE_TAG ..."
    remove_release $RELEASE_TAG
  else
    echo "Try list all assets for release with tag $RELEASE_TAG of $OWNER/$REPO ..."
    list_assets $create
  fi
else
  FILENAME=$(basename $FILE)
  FILETYPE=$(file -b --mime-type $FILE)


  echo "Try upload assets to Github:"
  echo "    Repository: $OWNER/$REPO"
  echo "    Release Tag: $RELEASE_TAG"
  echo "    File:"
  echo "    - Path: $FILE"
  echo "    - Filename: $FILENAME"
  echo "    - Filetype: $FILETYPE"
  echo ""

  upload_asset $FILENAME $FILETYPE
fi
