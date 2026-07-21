#!/usr/bin/env bash
set -euo pipefail

# KDNA CLI Installer
#
# STATUS (2026-07-21): the hosted one-command endpoint
# https://aikdna.com/install currently returns HTTP 410 and is NOT the
# install path. Install the CLI directly from npm instead:
#
#   npm install -g @aikdna/kdna-cli
#
# This script is a convenience wrapper around that npm install. It is open
# source and auditable.
# Source: https://github.com/aikdna/kdna-skills/blob/main/install-cli.sh

NPM_PKG="@aikdna/kdna-cli"
KDNA_ROOT="${HOME}/.kdna"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

log()    { echo -e "${GREEN}[kdna]${NC} $1"; }
warn()   { echo -e "${YELLOW}[kdna]${NC} $1"; }
err()    { echo -e "${RED}[kdna]${NC} $1"; exit 1; }
header() { echo -e "\n${BOLD}${GREEN}══ $1 ══${NC}\n"; }

# ─── Pre-flight ─────────────────────────────────────────────────────────

header "KDNA CLI Installer"

# Check for npm
if ! command -v npm &>/dev/null; then
  err "npm is required but not found. Install Node.js first: https://nodejs.org"
fi

NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ "${NODE_VERSION:-0}" -lt 18 ]; then
  err "Node.js 18+ required. Current: $(node -v 2>/dev/null || echo 'none')"
fi

# ─── Install CLI ─────────────────────────────────────────────────────────

log "Installing ${NPM_PKG}..."
if npm install -g "${NPM_PKG}" 2>/dev/null; then
  log "kdna CLI installed successfully"
else
  err "Global install failed. Check npm permissions: npm config get prefix. See https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally"
fi

# Verify
if ! command -v kdna &>/dev/null; then
  err "kdna command not found after install. Check your npm global bin path."
fi

INSTALLED_VERSION=$(kdna version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "?")
log "Version: ${INSTALLED_VERSION}"

# ─── Setup ──────────────────────────────────────────────────────────────
# `kdna setup` still exists in the CLI, but it is a historical interactive
# wizard and is not the recommended path. The current recommended path is
# file-first: obtain a .kdna asset explicitly, then validate/load it.
# Skipping the wizard here.

# ─── Done ─────────────────────────────────────────────────────────────────

header "Done"

echo "  CLI:       $(which kdna)"
echo "  Version:   ${INSTALLED_VERSION}"
echo "  KDNA root: ${KDNA_ROOT}"
echo ""
echo "  Next steps (file-first path):"
echo "    # Public reference assets live in aikdna/kdna-assets. Download an"
echo "    # asset and its .sha256 from its release page, verify the checksum,"
echo "    # then install the local file:"
echo "    curl -fLO https://github.com/aikdna/kdna-assets/releases/download/0.1.1/laozi-wuwei-0.1.1.kdna"
echo "    curl -fLO https://github.com/aikdna/kdna-assets/releases/download/0.1.1/laozi-wuwei-0.1.1.kdna.sha256"
echo "    shasum -a 256 -c laozi-wuwei-0.1.1.kdna.sha256"
echo "    kdna install ./laozi-wuwei-0.1.1.kdna"
echo ""
echo "    kdna list                    # show installed packages (only --json is supported)"
echo "    kdna validate ./laozi-wuwei-0.1.1.kdna"
echo "    kdna doctor --agents         # verify agent integration"
echo ""
echo "  Note: 'kdna install @scope/name' requires a configured registry"
echo "  (KDNA_REGISTRY_URL); no default registry is set."
echo ""
echo "  Authoring:"
echo "    npm install -g @aikdna/kdna-studio-cli"
echo "    kdna-studio create my_domain # create a Studio project"
