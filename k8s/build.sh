#!/usr/bin/env bash
# quit on error
set -e
set -euo pipefail

IS_MAC=0; # FALSE
if [ `uname` == 'Darwin' ]; then
    IS_MAC=1;
fi

REPO=

cache=0
push=1
latest=0

while getopts "chlr:n?" opt
do
    case $opt in
    (c) cache=1 ;;
    (l) latest=1 ;;
    (n) push=0 ;;
    (r) REPO=${OPTARG} ;;
    (h|?)
      echo "Usage: release.h [-h|-?] [-c] [-l] [-n] [-r REPO] tag"
      echo "    -h|-?      Print help message"
      echo "    -c         Use building cache, will not try to pull images when building"
      echo "    -l         Make the version LATEST version"
      echo "    -r <REPO>  Base image repository, if not given, will try to get from environment variable REPO_BASE"
      echo "    -n         Not push the image after building"
      echo "    tag        Version tag to use, like v3.1.2 or latest"
      exit 1
      ;;

    (*) printf "Illegal option -$OPTARG" 1>&2 && exit 1 ;;
    esac
done

# remove option arguments
shift $((OPTIND-1))

# ROOT points to start build.sh, i.e. <repo>/k8s
ROOT=$(cd "$(dirname ${BASH_SOURCE[0]})" && pwd)

# INFO are lines of text in form of key#value, let's split it into key and value

TAG=
TAG_OPERATOR=
TAG_CENTRAL=
TAG_NORMAL=
while IFS='#' read -r key value; do
  if [ "$key" == "collector" ]; then
    TAG="v$value"
  elif [ "$key" == "operator" ]; then
    TAG_OPERATOR="v$value"
  elif [ "$key" == "central" ]; then
    TAG_CENTRAL="v$value"
  elif [ "$key" == "normal" ]; then
    TAG_NORMAL="v$value"
  fi
done <<< "$(more $ROOT/../RELEASE)"

build() {
  local name=$1
  local tag=$2
    
  local IMAGE_NAME=zoomphant/${name}:${tag}

  if [ $cache -eq 0 ]; then
    docker build -f Dockerfile.${name} --no-cache=true --build-arg REPO=${REPO_BASE:-$REPO} --build-arg RELEASE=${tag} -t ${IMAGE_NAME} .
  else
    docker build -f Dockerfile.${name} --build-arg REPO=${REPO_BASE:-$REPO} --build-arg RELEASE=${tag} -t ${IMAGE_NAME} .
  fi

  if [ $push -eq 0 ]; then
    echo "Built image ${IMAGE_NAME} NOT pushed!"
  else
    docker push ${IMAGE_NAME}
  fi

  # make it also latest
  if [ $latest -eq 1 ]; then
    echo "Tag ${IMAGE_NAME} as LATEST ..."
    docker tag ${IMAGE_NAME} zoomphant/${name}:latest

    if [ $push -eq 1 ]; then
      docker push zoomphant/${name}:latest
    fi
  fi
}

cd ${ROOT}

echo "Building ${TAG} PACK image from ${REPO_BASE:-$REPO} ..."
build "pack" "${TAG}"
echo "Create PACK image done"

echo "Building ${TAG} AIO image from ${REPO_BASE:-$REPO} ..."
build "aio" "${TAG}"
echo "Create AIO image done"

echo "Building ${TAG_OPERATOR} operator image from ${REPO_BASE:-$REPO} ..."
build "operator" "${TAG_OPERATOR}"
echo "Create operator image done"

echo "Building ${TAG_CENTRAL} central metrics image from ${REPO_BASE:-$REPO} ..."
build "central-metrics" "${TAG_CENTRAL}"
echo "Create central metric image done"

echo "Building ${TAG_NORMAL} normal metrics image from ${REPO_BASE:-$REPO} ..."
build "normal-metrics" "${TAG_NORMAL}"
echo "Create normal metrics image done"
