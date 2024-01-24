#!/usr/bin/env bash
# quit on error
set -e
set -euo pipefail

IS_MAC=0; # FALSE
if [ `uname` == 'Darwin' ]; then
    IS_MAC=1;
fi

cache=0
push=1
REPO=
while getopts "chr:n?" opt
do
    case $opt in
    (c) cache=1 ;;
    (n) push=0 ;;
    (r) REPO=${OPTARG} ;;
    (h|?)
      echo "Usage: release.h [-h|-?] [-c] [-n] [-r REPO] tag"
      echo "    -h|-?      Print help message"
      echo "    -c         Use building cache, will not try to pull images when building"
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

if [ "$#" -eq 1 ]; then
  TAG="$1";
else
  # echo "Please give version tag like v2.3.4 or latest to build"
  # exit 1;
  TAG="v$(head -1 $ROOT/../RELEASE)"
fi


cd ${ROOT}

IMAGE_NAME=zoomphant/aio:${TAG}

echo "Building ${TAG} AIO image from ${REPO_BASE:-$REPO} ..."
if [ $cache -eq 0 ]; then
  docker build --no-cache=true --build-arg REPO=${REPO_BASE:-$REPO} -t ${IMAGE_NAME} .
else
  docker build --build-arg REPO=${REPO_BASE:-$REPO} -t ${IMAGE_NAME} .
fi

if [ $push -eq 0 ]; then
    echo "Built image ${IMAGE_NAME} NOT pushed!"
else
    docker push ${IMAGE_NAME}
fi

echo "Create AIO image done"
