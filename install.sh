#!/usr/bin/env bash
set -euo pipefail

# Installs the thin kdna-loader fallback for exactly one user-selected Host.
# It never detects Hosts, installs into multiple Hosts, removes legacy files,
# or creates KDNA workspace attachments.

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "${GREEN}[kdna]${NC} $1"; }
err() { echo -e "${RED}[kdna]${NC} $1" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
SOURCE_SKILL="$SCRIPT_DIR/kdna-loader/SKILL.md"

print_usage() {
  cat <<'EOF'
Usage: install.sh HOST

Install the thin fallback Skill for exactly one explicitly selected Host:
  --codex      Codex
  --claude     Claude Code
  --opencode   OpenCode
  --cursor     Cursor
  --copilot    GitHub Copilot-compatible agents
  --help       Show this message

This installer does not detect Hosts, install into every Host, discover KDNA
assets, or create workspace attachments. MCP is preferred where the selected
Host supports it.
EOF
}

install_skill() {
  local host_name="$1"
  local skill_base="$2"
  local destination="$skill_base/kdna-loader/SKILL.md"

  if [ ! -f "$SOURCE_SKILL" ]; then
    err "Missing source Skill: kdna-loader/SKILL.md"
    err "Run this installer from a complete kdna-skills checkout."
    exit 1
  fi

  if [ -f "$destination" ]; then
    if cmp -s "$SOURCE_SKILL" "$destination"; then
      log "$host_name already has this exact kdna-loader Skill."
      return
    fi
    err "$host_name already has a different kdna-loader Skill at $destination"
    err "Review and remove or back up that file explicitly before installing."
    exit 1
  fi

  mkdir -p "$skill_base/kdna-loader"
  cp "$SOURCE_SKILL" "$destination"
  log "Installed kdna-loader for $host_name: $destination"
}

if [ "$#" -ne 1 ]; then
  err "Choose exactly one Host."
  print_usage
  exit 1
fi

case "$1" in
  --codex) install_skill "Codex" "$HOME/.codex/skills" ;;
  --claude) install_skill "Claude Code" "$HOME/.claude/skills" ;;
  --opencode) install_skill "OpenCode" "$HOME/.agents/skills" ;;
  --cursor) install_skill "Cursor" "$HOME/.cursor/skills" ;;
  --copilot) install_skill "GitHub Copilot-compatible agents" "$HOME/.agents/skills" ;;
  --help) print_usage; exit 0 ;;
  *) err "Unknown Host: $1"; print_usage; exit 1 ;;
esac

cat <<'EOF'

The Skill adapter is now enabled only for the selected Host.

Workspace attachment commands require the exact @aikdna/kdna-cli@0.36.0 source
candidate; the current registry CLI does not provide them. During coordinated
source acceptance, create the relation explicitly:
  kdna attach ./judgment.kdna --cwd ./my-project --role article-writing \
    --applies-to draft --does-not-apply-to code --yes
  kdna attachments --cwd ./my-project

The Host adapter may read and load approved workspace attachments. It cannot
attach, disable, switch, roll back, or remove them on its own.
EOF
