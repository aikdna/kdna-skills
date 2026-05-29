#!/usr/bin/env bash
set -euo pipefail

# KDNA CLI Installer
# One-command install: curl -fsSL https://aikdna.com/install | bash
#
# This script is open source and auditable.
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

# ─── Run setup ──────────────────────────────────────────────────────────

log "Running kdna setup..."
kdna setup || warn "kdna setup had warnings — check output above"

# ─── Done ─────────────────────────────────────────────────────────────────

header "Done"

echo "  CLI:       $(which kdna)"
echo "  Version:   ${INSTALLED_VERSION}"
echo "  KDNA root: ${KDNA_ROOT}"
echo ""
echo "  Next steps:"
echo "    kdna list --available        # browse domains"
echo "    kdna install @aikdna/writing # install a domain"
echo "    kdna doctor --agents         # verify agent integration"
echo "    npm install -g @aikdna/kdna-studio-cli"
echo "    kdna-studio create my_domain # create a Studio project"
