# ZoomPhant Monitoring Release Process

This document describes the complete release process for ZoomPhant Monitoring components, including collector agents and Docker images.

## Table of Contents

- [Overview](#overview)
- [Release Components](#release-components)
- [Prerequisites](#prerequisites)
- [Release Process](#release-process)
  - [Step 0: Prepare zpagent Release Package](#step-0-prepare-zpagent-release-package)
  - [Step 1: Run Release Script](#step-1-run-release-script)
  - [Step 2: Verify Release Assets](#step-2-verify-release-assets)
  - [Step 3: Docker Image Build](#step-3-docker-image-build)
  - [Step 4: Update Other Components (Optional)](#step-4-update-other-components-optional)
- [Manual Triggers](#manual-triggers)
- [Troubleshooting](#troubleshooting)

---

## Overview

The release process consists of two main phases:

1. **Agent Release**: 
   - **Manual Step**: Build ZoomPhant Agent Package (`zpagent-release-{version}.tar.gz`)
     - **Note For Maintainers**: You shall do this in ZoomPhant development repo (agent/installer/release.sh)
   - **Automated**: Run `bamboo.sh` script which automatically:
     - Creates GitHub release (tag + release page) via API
     - Builds docker images publicly accessible
     - Uploads collector agent installers and upgrade packages to GitHub releases
     - Updates version tracking files
   
2. **Docker Image Build**: 
   - **Fully Automated**: Triggered by changes to `releases/**` directory
   - Builds and pushes Docker images for Kubernetes deployments

**Key Point**: Only the zpagent package creation is manual. Everything else (GitHub release creation, asset upload, version updates, Docker builds) is fully automated via scripts and GitHub Actions!

### Automation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RELEASE PROCESS                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ MANUAL STEP      │
│ Build zpagent    │──┐
│ package locally  │  │
└──────────────────┘  │
                      │
                      ▼
         ┌────────────────────────────┐
         │ zpagent-release-2.4.65.    │
         │        tar.gz              │
         └────────────────────────────┘
                      │
                      │ Copy to monitoring repo
                      ▼
         ┌────────────────────────────┐
         │ Run: ./scripts/bamboo.sh   │
         └────────────────────────────┘
                      │
         ┌────────────┴────────────────┐
         │    FULLY AUTOMATED          │
         ├─────────────────────────────┤
         │ 1. Create git tag           │
         │ 2. Push tag to GitHub       │
         │ 3. Create GitHub Release    │◄─── Via GitHub API
         │    (via API)                │
         │ 4. Upload 5 installers      │◄─── Via GitHub API
         │    + MD5 files              │
         │ 5. Create releases/v2.4.65/ │
         │ 6. Update RELEASE file      │
         │ 7. Git commit & push        │
         └─────────────────────────────┘
                      │
                      │ Push triggers GitHub Actions
                      ▼
         ┌────────────────────────────┐
         │ GitHub Actions Workflow    │
         │ (.github/workflows/        │
         │  docker-image.yml)         │
         └────────────────────────────┘
                      │
         ┌────────────┴────────────────┐
         │    FULLY AUTOMATED          │
         ├─────────────────────────────┤
         │ 1. Read RELEASE file        │
         │ 2. Build 8 Docker images    │
         │ 3. Tag with versions        │
         │ 4. Push to registries       │
         │    - Docker Hub             │
         │    - ZP Registry            │
         └─────────────────────────────┘
                      │
                      ▼
              ✅ RELEASE COMPLETE
```

---

## Release Components

### Agent Components
- **Collector Agent**: The main monitoring agent (`v2.4.x` series)
- **Upgrader Package**: `upgrader.zip` - Used for in-place agent upgrades
- **Installers**:
  - `installer-linux-x64.bin` - Linux 64-bit installer
  - `installer-linux-x86.bin` - Linux 32-bit installer
  - `installer-windows-x64.exe` - Windows 64-bit installer
  - `installer-windows-x86.exe` - Windows 32-bit installer

### Docker Images
Built automatically after agent release:

1. **collector** - Main collector container
2. **collector-packages** - Collector with all packages
3. **collector-installer** - Collector installer container
4. **pack** - Pack image
5. **aio** (All-In-One) - Complete monitoring stack
6. **zp-operator** - Kubernetes operator (separate version)
7. **zpmetrics** - Central metrics collector (separate version)
8. **dockermetrics** - Docker metrics collector (separate version)

---

## Prerequisites

Before starting a release, ensure you have:

- [ ] Access to the agent build system (where zpagent is built)
- [ ] GitHub Personal Access Token with repo access (set as `GITHUB_TOKEN` environment variable)
- [ ] Docker Hub credentials (configured in GitHub Secrets)
- [ ] ZP Docker Registry credentials (configured in GitHub Secrets)
- [ ] Git repository write access
- [ ] Required tools installed: `jq`, `curl`, `tar`, `git`

---

## Release Process

### Step 0: Prepare zpagent Release Package

**This step is performed manually** on the agent build system (outside this repository).

#### Build Process

1. **Build the collector agent** with the target version number:
   ```bash
   # On the agent build system
   cd /path/to/zpagent
   
   # Build for version 2.4.65 (example)
   ./build.sh --version 2.4.65
   ```

2. **Create the release package** containing all installers and upgrade package:
   ```
   zpagent-release-2.4.65.tar.gz
   └── Contents:
       ├── agent.zip              # Upgrade package
       ├── agent.zip.md5          # MD5 checksum
       ├── linux/
       │   ├── x64.bin            # Linux 64-bit installer
       │   ├── x64.bin.md5        # MD5 checksum
       │   ├── x86.bin            # Linux 32-bit installer
       │   └── x86.bin.md5        # MD5 checksum
       └── windows/
           ├── x64.exe            # Windows 64-bit installer
           ├── x64.exe.md5        # MD5 checksum
           ├── x86.exe            # Windows 32-bit installer
           └── x86.exe.md5        # MD5 checksum
   ```

3. **Transfer the package** to the monitoring repository root:
   ```bash
   # Copy to monitoring repo
   scp zpagent-release-2.4.65.tar.gz user@server:/path/to/monitoring/
   ```

4. **Verify the package**:
   ```bash
   # In monitoring repo
   cd /path/to/monitoring
   tar -tzf zpagent-release-2.4.65.tar.gz
   
   # Should show all expected files
   ```

---

### Step 1: Run Release Script

Once the zpagent release package is in place, run the automated release script:

```bash
cd /path/to/monitoring

# Ensure GITHUB_TOKEN is set
export GITHUB_TOKEN="ghp_your_token_here"

# Run the release script
./scripts/bamboo.sh
```

#### What This Script Does (Fully Automated):

1. ✅ Detects the version from the `zpagent-release-*.tar.gz` filename
2. ✅ **Creates GitHub release automatically** (if it doesn't exist)
   - Creates git tag `v{version}`
   - Pushes tag to GitHub
   - Creates GitHub release via API
3. ✅ Extracts the release package to a temporary directory
4. ✅ Compares MD5 checksums with previous release
5. ✅ **Uploads all installer assets to GitHub release** (via GitHub API)
   - `upgrader.zip` + `.md5`
   - `installer-linux-x64.bin` + `.md5`
   - `installer-linux-x86.bin` + `.md5`
   - `installer-windows-x64.exe` + `.md5`
   - `installer-windows-x86.exe` + `.md5`
6. ✅ Creates version directory under `releases/v{version}/`
7. ✅ Stores MD5 checksums for future comparison
8. ✅ **Automatically updates the collector version in `RELEASE` file**
9. ✅ Commits and pushes changes to the repository

**Important**: The GitHub release creation and asset upload are **completely automated**. You don't need to manually create releases on GitHub - the script handles everything via GitHub API!

#### Expected Output:

```
Found release version 2.4.65 ...
Updating GitHub repo ...
Extracting artifacts to /tmp/zpagent-XXXXXXXXXX ...
Create version release dir releases/v2.4.65 ...
Creating or updating artifacts in releases/v2.4.65 ...
Uploading new or updated asset upgrader.zip.md5 ...
SUCCESS: Asset upgrader.zip.md5 successfully uploaded to GitHub Release!
Uploading new or updated asset upgrader.zip ...
SUCCESS: Asset upgrader.zip successfully uploaded to GitHub Release!
...
Updating RELEASE file with collector version 2.4.65 ...
Updated collector version to 2.4.65 in RELEASE file
[main abc1234] Release 2.4.65
 6 files changed, 6 insertions(+)
```

---

### Step 2: Verify Release Assets

After the script completes:

1. **Check GitHub Releases**:
   - Go to https://github.com/ZoomPhant/monitoring/releases
   - Verify the release `v2.4.65` exists
   - Confirm all 5 assets are uploaded:
     - `upgrader.zip` + `.md5`
     - `installer-linux-x64.bin` + `.md5`
     - `installer-linux-x86.bin` + `.md5`
     - `installer-windows-x64.exe` + `.md5`
     - `installer-windows-x86.exe` + `.md5`

2. **Check Repository Changes**:
   ```bash
   # Verify the releases directory was created/updated
   ls -la releases/v2.4.65/
   
   # Verify RELEASE file was updated
   cat RELEASE | grep collector
   # Should show: collector#2.4.65
   ```

3. **Verify Git Commit**:
   ```bash
   git log -1
   # Should show: Release 2.4.65
   ```

---

### Step 3: Docker Image Build

The Docker image build is **automatically triggered** by GitHub Actions when changes are pushed to the `releases/**` directory.

#### Automatic Trigger

When `scripts/bamboo.sh` pushes changes to `releases/v2.4.65/`, GitHub Actions will:

1. Detect changes in `releases/**` path
2. Trigger the "ZP AIO Build" workflow
3. Read version information from the `RELEASE` file
4. Build all 8 Docker images with appropriate version tags
5. Push images to Docker Hub and ZP Registry
6. Tag images as `latest` (if configured)

#### Monitor Build Progress

1. Go to https://github.com/ZoomPhant/monitoring/actions
2. Find the "ZP AIO Build" workflow run
3. Monitor the build progress and logs

#### Built Images

The following images will be built and pushed:

| Image | Tag | Description |
|-------|-----|-------------|
| `zoomphant/collector` | `v2.4.65`, `latest` | Main collector |
| `zoomphant/collector-packages` | `v2.4.65`, `latest` | Collector with packages |
| `zoomphant/collector-installer` | `v2.4.65`, `latest` | Collector installer |
| `zoomphant/pack` | `v2.4.65`, `latest` | Pack image |
| `zoomphant/aio` | `v2.4.65`, `latest` | All-in-one |
| `zoomphant/zp-operator` | `v4.1.7`, `latest` | Kubernetes operator |
| `zoomphant/zpmetrics` | `v4.1.7`, `latest` | Central metrics |
| `zoomphant/dockermetrics` | `v4.1.7`, `latest` | Docker metrics |

**Note**: Operator, central, and normal metrics use separate version numbers from the `RELEASE` file.

---

### Step 4: Update Other Components (Optional)

If you need to update operator, central, normal, or launcher versions, you can do so manually:

#### Option A: Using the Utility Script

```bash
# Update operator to 4.2.0
./scripts/update-release-component.sh operator 4.2.0

# Update central metrics to 4.2.0
./scripts/update-release-component.sh central 4.2.0

# Update normal metrics to 4.2.0
./scripts/update-release-component.sh normal 4.2.0

# Commit and push
git add RELEASE
git commit -m "Update operator and metrics to 4.2.0"
git push
```

#### Option B: Manual Edit

1. Edit the `RELEASE` file directly:
   ```bash
   vim RELEASE
   ```

2. Update the version line for the component:
   ```
   operator#4.2.0
   central#4.2.0
   normal#4.2.0
   ```

3. Commit and push:
   ```bash
   git add RELEASE
   git commit -m "Update operator and metrics to 4.2.0"
   git push
   ```

**Important**: Updating the `RELEASE` file will **NOT** automatically trigger a new Docker build unless you also modify files in `releases/**`. To trigger a build after updating component versions, you can either:

- Touch a file in releases: `touch releases/.trigger && git add releases/.trigger && git commit -m "Trigger build" && git push`
- Use manual workflow trigger (see next section)

---

## Manual Triggers

### Manually Trigger Docker Build

You can manually trigger the Docker image build from GitHub UI:

1. Go to https://github.com/ZoomPhant/monitoring/actions
2. Click on "ZP AIO Build" workflow
3. Click "Run workflow" button
4. Configure options:
   - **Use building cache**: Enable to speed up builds (uses existing layers)
   - **Tag images as latest**: Enable to tag images as `latest`
   - **Skip pushing images**: Enable to build without pushing (for testing)
5. Click "Run workflow"

### Command-Line Build

You can also build images locally for testing:

```bash
cd k8s

# Build with default options (tag as latest, push to registries)
./build.sh -l

# Build with cache enabled
./build.sh -l -c

# Build without pushing (local only)
./build.sh -l -n

# Build without tagging as latest
./build.sh
```

**Options**:
- `-c`: Use building cache
- `-l`: Tag images as `latest`
- `-n`: Don't push images after building
- `-r <REPO>`: Specify base repository (overrides `REPO_BASE` env var)

---

## Troubleshooting

### Common Issues

#### Issue: "No release file found"

**Cause**: The `zpagent-release-*.tar.gz` file is not in the repository root.

**Solution**:
```bash
# Check if file exists
ls zpagent-release-*.tar.gz

# If missing, copy it from build system
scp user@build-server:/path/to/zpagent-release-*.tar.gz .
```

#### Issue: "GITHUB_TOKEN not set"

**Cause**: The `GITHUB_TOKEN` environment variable is not set.

**Solution**:
```bash
# Set the token
export GITHUB_TOKEN="ghp_your_token_here"

# Or add to your shell profile
echo 'export GITHUB_TOKEN="ghp_your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

#### Issue: "Asset already exists"

**Cause**: Trying to upload an asset that already exists with the same MD5.

**Solution**: This is actually fine - the script detects identical assets and skips them. If you need to force re-upload:
```bash
# Delete the MD5 files from the releases directory
rm -rf releases/v2.4.65/*.md5

# Re-run the script
./scripts/bamboo.sh
```

#### Issue: Docker build fails with "unauthorized"

**Cause**: Docker registry credentials not configured or expired.

**Solution**:
1. Check GitHub repository secrets:
   - `DOCKER_USERNAME` and `DOCKER_PASSWORD`
   - `ZPDOCKER_USERNAME` and `ZPDOCKER_PASSWORD`
2. Verify credentials are still valid
3. Update if necessary in repository settings

#### Issue: Build script can't find RELEASE file

**Cause**: The `RELEASE` file is missing or malformed.

**Solution**:
```bash
# Verify RELEASE file exists and has correct format
cat RELEASE

# Should contain lines like:
# collector#2.4.65
# operator#4.1.7
# etc.

# If malformed, restore from git history
git checkout HEAD -- RELEASE
```

#### Issue: sed error on macOS

**Cause**: macOS and Linux use different `sed` syntax.

**Solution**: The scripts already handle this automatically by checking `$OSTYPE`. If you still see errors:
```bash
# Install GNU sed on macOS
brew install gnu-sed

# Use gsed instead
alias sed=gsed
```

---

## Quick Reference

### File Locations

| File/Directory | Purpose |
|----------------|---------|
| `RELEASE` | Version information for all components |
| `releases/v{version}/` | MD5 checksums for release assets |
| `scripts/bamboo.sh` | Main release automation script |
| `scripts/update-release-component.sh` | Utility to update component versions |
| `k8s/build.sh` | Docker image build script |
| `.github/workflows/docker-image.yml` | GitHub Actions workflow |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes (for bamboo.sh) | GitHub API token for release management |
| `REPO_BASE` | No | Base Docker repository for building (defaults in workflow) |

### Version Files

- **Collector version**: Automatically updated by `scripts/bamboo.sh`
- **Operator/Central/Normal versions**: Manually updated in `RELEASE` file
- **Launcher version**: Manually updated in `RELEASE` file (rarely changes)

---

## Release Checklist

Use this checklist for each release:

- [ ] Build zpagent release package (`zpagent-release-{version}.tar.gz`)
- [ ] Copy package to monitoring repository root
- [ ] Verify package contents (`tar -tzf`)
- [ ] Set `GITHUB_TOKEN` environment variable
- [ ] Run `./scripts/bamboo.sh`
- [ ] Verify GitHub release created with all assets
- [ ] Verify `releases/v{version}/` directory created
- [ ] Verify `RELEASE` file updated with collector version
- [ ] Monitor GitHub Actions for Docker build completion
- [ ] Verify Docker images pushed to registries
- [ ] Update operator/metrics versions if needed (optional)
- [ ] Test deployed images in staging environment
- [ ] Update release notes in GitHub release (optional)
- [ ] Notify team of new release

---

## Additional Resources

- [Docker Build Script Documentation](k8s/build.sh) - See inline comments
- [GitHub Actions Workflow](.github/workflows/docker-image.yml)
- [Release Utility Script](scripts/update-release-component.sh)
- [ZoomPhant Documentation](https://docs.zoomphant.com) (if applicable)

---

## Questions or Issues?

If you encounter problems not covered in this documentation:

1. Check the troubleshooting section above
2. Review script output and GitHub Actions logs
3. Check GitHub Issues for similar problems
4. Contact the DevOps team

---

**Last Updated**: August 2026  
**Document Version**: 1.0  
**Maintained by**: ZoomPhant DevOps Team
