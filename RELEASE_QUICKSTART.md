# Quick Start: Release Process

> **For detailed documentation, see [RELEASE.md](RELEASE.md)**

## TL;DR

1. **Manual**: Build zpagent package  
2. **Automated**: Run bamboo.sh (creates GitHub release + uploads assets)  
3. **Automated**: GitHub Actions builds Docker images

---

## Step-by-Step

### 1. Prepare Release Package (Manual)

On your build system, create `zpagent-release-{version}.tar.gz`:

```bash
# Build zpagent with version 2.4.65
cd /path/to/zoomphant (repo base)
./agent/installer/release.sh (which will generate zpagent-release-{version}.tar.gz from source directly

# Package should contain:
# - agent.zip + .md5
# - linux/x64.bin + .md5
# - linux/x86.bin + .md5  
# - windows/x64.exe + .md5
# - windows/x86.exe + .md5
```

### 2. Copy to Monitoring Repo

```bash
scp zpagent-release-2.4.65.tar.gz user@server:/path/to/monitoring/
```

### 3. Run Release Script

```bash
cd /path/to/monitoring
export GITHUB_TOKEN="ghp_your_token_here"
./scripts/bamboo.sh
```

This script **automatically**:
- ✅ Creates GitHub release (if doesn't exist)
- ✅ Uploads all installers to GitHub releases
- ✅ Creates `releases/v2.4.65/` directory
- ✅ Updates collector version in `RELEASE` file
- ✅ Commits and pushes changes

**No manual GitHub release creation needed!**

### 4. Wait for Docker Build

GitHub Actions automatically builds Docker images when `releases/**` changes.

Monitor: https://github.com/ZoomPhant/monitoring/actions

### 5. Update Other Components (If Needed)

```bash
# Update operator/metrics versions (optional)
./scripts/update-release-component.sh operator 4.2.0
git push

# Or manually trigger build from GitHub UI
```

---

## Manual Docker Build

```bash
cd k8s
./build.sh -l          # Build and push with 'latest' tag
./build.sh -l -c       # Use cache (faster)
./build.sh -l -n       # Build only, don't push
```

---

## Common Commands

```bash
# Check current versions
cat RELEASE

# List releases directory
ls -la releases/

# View latest release assets
./scripts/git-release-assets.sh ZoomPhant monitoring v2.4.65

# Manually trigger GitHub Actions
# Go to: https://github.com/ZoomPhant/monitoring/actions
# Click: "ZP AIO Build" → "Run workflow"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No release file found" | Copy `zpagent-release-*.tar.gz` to repo root |
| "GITHUB_TOKEN not set" | `export GITHUB_TOKEN="ghp_..."` |
| "Asset already exists" | Normal - means file unchanged |
| Build fails | Check GitHub Actions logs |

---

**Full Documentation**: [RELEASE.md](RELEASE.md)
