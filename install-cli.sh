#!/usr/bin/env bash
set -euo pipefail

# Install the current fixed local CLI graph from this complete source checkout.
# Registry/latest and global installations do not supply this RC's exact bytes.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
if [ "$#" -eq 1 ] && [ "$1" = "--help" ]; then
  echo "Usage: install-cli.sh"
  echo "Install the checkout's exact CLI dependencies locally, offline, without hooks."
  exit 0
fi
if [ "$#" -ne 0 ]; then
  echo "Usage: install-cli.sh (no registry or global installation options)" >&2
  exit 2
fi
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "Node.js 22 or newer and its bundled npm are required." >&2
  exit 1
fi
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) process.exit(1)' || {
  echo "Node.js 22 or newer is required." >&2
  exit 1
}
PACKAGE_ROOT="$SCRIPT_DIR/mcp-server"
node "$PACKAGE_ROOT/scripts/verify-runtime-candidates.mjs" --source-only
npm --prefix "$PACKAGE_ROOT" ci --dry-run=false --offline --ignore-scripts --omit=optional --no-audit --no-fund
node "$PACKAGE_ROOT/scripts/verify-runtime-candidates.mjs"
cat <<EOF
Installed the fixed CLI graph locally. No global binary was installed.

Inspect technical facts:
  node "$PACKAGE_ROOT/node_modules/@aikdna/kdna-cli/src/cli.js" inspect /absolute/selected.kdna
Read the selected file after operator permission:
  node "$PACKAGE_ROOT/node_modules/@aikdna/kdna-cli/src/cli.js" read /absolute/selected.kdna --mode catalog --budget 1000000 --allow-read

See mcp-server/README.md for operator-bound MCP startup and packed installation.
Creation uses the separate kdna-creator Skill and its current Studio CLI binding.
EOF
