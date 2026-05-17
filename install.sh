#!/usr/bin/env bash
set -euo pipefail

# KDNA Skills Installer
# Installs kdna-loader skill for detected AI agents

SKILL_SRC="https://raw.githubusercontent.com/aikdna/kdna-skills/main/SKILL.md"
KDNA_REPO="https://github.com/aikdna/KDNA"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[kdna]${NC} $1"; }
warn() { echo -e "${YELLOW}[kdna]${NC} $1"; }
err()  { echo -e "${RED}[kdna]${NC} $1"; }

install_for_agent() {
  local name="$1"
  local skill_dir="$2"
  local data_dir="$3"

  log "Installing for $name..."

  mkdir -p "$skill_dir"
  mkdir -p "$data_dir"

  if [ -f "SKILL.md" ]; then
    cp SKILL.md "$skill_dir/SKILL.md"
  else
    curl -fsSL "$SKILL_SRC" -o "$skill_dir/SKILL.md"
  fi

  log "  Skill: $skill_dir/SKILL.md"
  log "  Data:  $data_dir/"
  log "  $name: done"
}

install_registry() {
  local data_dir="$1"
  local registry_file="$data_dir/registry.json"

  if [ ! -f "$registry_file" ]; then
    cat > "$registry_file" << 'EOF'
{
  "version": "0.1",
  "root": "KDNA_DATA_DIR",
  "domains": []
}
EOF
  fi
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
EOF
}

install_codex() {
  install_for_agent "Codex" \
    "$HOME/.codex/skills/kdna-loader" \
    "$HOME/.codex/Kdna"
  install_registry "$HOME/.codex/Kdna"
}

install_claude() {
  install_for_agent "Claude Code" \
    "$HOME/.claude/skills/kdna-loader" \
    "$HOME/.claude/Kdna"
  install_registry "$HOME/.claude/Kdna"
}

install_opencode() {
  install_for_agent "OpenCode" \
    "$HOME/.agents/skills/kdna-loader" \
    "$HOME/.agents/Kdna"
  install_registry "$HOME/.agents/Kdna"
}

install_cursor() {
  install_for_agent "Cursor" \
    "$HOME/.cursor/skills/kdna-loader" \
    "$HOME/.cursor/Kdna"
  install_registry "$HOME/.cursor/Kdna"
}

install_copilot() {
  install_for_agent "GitHub Copilot" \
    "$HOME/.agents/skills/kdna-loader" \
    "$HOME/.agents/Kdna"
  install_registry "$HOME/.agents/Kdna"
}

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
    echo "Then copy SKILL.md into the directory."
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

log "Installation complete."
echo ""
echo "Next steps:"
echo "  1. Add domains to your KDNA data directory"
echo "  2. See available domains: $KDNA_REPO"
