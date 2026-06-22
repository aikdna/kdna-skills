#!/usr/bin/env bash
set -euo pipefail

# KDNA Skills Installer
# Installs the single kdna-loader skill for detected AI agents.
# kdna-loader is the entire skill surface — it teaches the agent how to
# discover and use installed KDNA assets. KDNA domains themselves are
# immutable .kdna assets managed by the CLI and are not registered as skills.

KDNA_REPO="https://github.com/aikdna/KDNA"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[kdna]${NC} $1"; }
warn() { echo -e "${YELLOW}[kdna]${NC} $1"; }
err()  { echo -e "${RED}[kdna]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

install_skills_for_agent() {
  local name="$1"
  local skill_base="$2"

  log "Installing for $name..."

  mkdir -p "$skill_base/kdna-loader"

  if [ -f "$SCRIPT_DIR/kdna-loader/SKILL.md" ]; then
    cp "$SCRIPT_DIR/kdna-loader/SKILL.md" "$skill_base/kdna-loader/SKILL.md"
  else
    curl -fsSL "https://raw.githubusercontent.com/aikdna/kdna-skills/main/kdna-loader/SKILL.md" -o "$skill_base/kdna-loader/SKILL.md"
  fi

  log "  kdna-loader: $skill_base/kdna-loader/SKILL.md"

  # Clean up any pre-v0.9 kdna-create skill (no longer maintained).
  if [ -d "$skill_base/kdna-create" ]; then
    rm -rf "$skill_base/kdna-create"
    log "  removed legacy kdna-create skill (use KDNA Studio for reviewed asset authoring)"
  fi

  log "  $name: done"
}

detect_agents() {
  local found=""
  [ -d "$HOME/.codex" ]  && found="$found codex"
  [ -d "$HOME/.claude" ] && found="$found claude"
  [ -d "$HOME/.agents" ] && found="$found opencode"
  echo "$found"
}

print_usage() {
  cat << EOF
Usage: install.sh [OPTIONS]

Options:
  --codex      Install for Codex (OpenAI)
  --claude     Install for Claude Code (Anthropic)
  --opencode   Install for OpenCode
  --cursor     Install for Cursor
  --copilot    Install for GitHub Copilot
  --all        Install for all detected agents
  --help       Show this message

Without options, runs interactive mode.

Installs one skill:
  kdna-loader  — teaches the agent how to discover and load installed
                 KDNA .kdna assets through the kdna CLI

For reviewed KDNA authoring workflows, use KDNA Studio or @aikdna/kdna-studio-cli.
EOF
}

install_codex()  { install_skills_for_agent "Codex"       "$HOME/.codex/skills"; }
install_claude() { install_skills_for_agent "Claude Code" "$HOME/.claude/skills"; }
install_opencode(){ install_skills_for_agent "OpenCode"    "$HOME/.agents/skills"; }
install_cursor() { install_skills_for_agent "Cursor"      "$HOME/.cursor/skills"; }
install_copilot(){ install_skills_for_agent "GitHub Copilot" "$HOME/.agents/skills"; }

interactive_mode() {
  local agents
  agents=$(detect_agents)

  if [ -z "$agents" ]; then
    warn "No agents detected. Manual install:"
    echo ""
    echo "  Codex:       mkdir -p ~/.codex/skills/kdna-loader"
    echo "  Claude Code: mkdir -p ~/.claude/skills/kdna-loader"
    echo "  OpenCode:    mkdir -p ~/.agents/skills/kdna-loader"
    echo ""
    echo "Then copy kdna-loader/SKILL.md into each."
    exit 0
  fi

  log "Detected: $agents"

  for agent in $agents; do
    case "$agent" in
      codex)
        read -r -p "Install for Codex? [Y/n] " answer
        [ "${answer:-Y}" != "n" ] && [ "${answer:-Y}" != "N" ] && install_codex
        ;;
      claude)
        read -r -p "Install for Claude Code? [Y/n] " answer
        [ "${answer:-Y}" != "n" ] && [ "${answer:-Y}" != "N" ] && install_claude
        ;;
      opencode)
        read -r -p "Install for OpenCode? [Y/n] " answer
        [ "${answer:-Y}" != "n" ] && [ "${answer:-Y}" != "N" ] && install_opencode
        ;;
    esac
  done
}

# Main
if [ $# -eq 0 ]; then
  interactive_mode
  exit 0
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --codex)   install_codex; shift ;;
    --claude)  install_claude; shift ;;
    --opencode) install_opencode; shift ;;
    --cursor)  install_cursor; shift ;;
    --copilot) install_copilot; shift ;;
    --all)
      detected=$(detect_agents)
      for agent in $detected; do
        case "$agent" in
          codex)   install_codex ;;
          claude)  install_claude ;;
          opencode) install_opencode ;;
        esac
      done
      shift
      ;;
    --help) print_usage; exit 0 ;;
    *) err "Unknown option: $1"; print_usage; exit 1 ;;
  esac
done

echo ""
log "Installation complete: kdna-loader installed."
echo ""
warn "Restart your agent session to use the updated skill."
echo ""
echo "Next steps:"
echo "  1. Install a KDNA domain: kdna install @aikdna/writing"
echo "  2. Ask your agent a domain-relevant question — the agent will"
echo "     discover the installed KDNA via kdna-loader and apply it."
echo "  3. Browse available domains: $KDNA_REPO"
