#!/usr/bin/env bash
set -euo pipefail

# Build command for Cloudflare Pages
npm install
npm run build
