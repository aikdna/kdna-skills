#!/usr/bin/env bash
set -euo pipefail

# KDNA Skills Installer
# Installs kdna-loader and kdna-create skills for detected AI agents

KDNA_REPO="https://github.com/aikdna/KDNA"
SKILLS_REPO="https://github.com/aikdna/kdna-skills"

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
  local data_dir="$3"

  log "Installing for $name..."

  mkdir -p "$skill_base/kdna-loader"
  mkdir -p "$skill_base/kdna-create"
  mkdir -p "$data_dir"

  if [ -f "$SCRIPT_DIR/kdna-loader/SKILL.md" ]; then
    cp "$SCRIPT_DIR/kdna-loader/SKILL.md" "$skill_base/kdna-loader/SKILL.md"
    cp "$SCRIPT_DIR/kdna-create/SKILL.md" "$skill_base/kdna-create/SKILL.md"
  else
    curl -fsSL "https://raw.githubusercontent.com/aikdna/kdna-skills/main/kdna-loader/SKILL.md" -o "$skill_base/kdna-loader/SKILL.md"
    curl -fsSL "https://raw.githubusercontent.com/aikdna/kdna-skills/main/kdna-create/SKILL.md" -o "$skill_base/kdna-create/SKILL.md"
  fi

  log "  kdna-loader: $skill_base/kdna-loader/SKILL.md"
  log "  kdna-create: $skill_base/kdna-create/SKILL.md"
  log "  KDNA data:    $data_dir/"

  if [ ! -f "$data_dir/registry.json" ]; then
    cat > "$data_dir/registry.json" << EOF
{
  "version": "0.4",
  "root": "$data_dir",
  "domains": []
}
EOF
    log "  registry:     $data_dir/registry.json"
  fi

  # Create symlink from data_dir to ~/.kdna so loader can find installed domains
  local kdna_root="$HOME/.kdna"
  if [ "$data_dir" != "$kdna_root" ] && [ ! -L "$data_dir" ]; then
    mkdir -p "$kdna_root"
    if [ ! -e "$data_dir" ] || [ -d "$data_dir" ]; then
      # Ensure data_dir exists for the symlink target
      mkdir -p "$data_dir"
      # Symlink ~/.kdna → data_dir if no symlink exists yet
      if [ ! -L "$kdna_root" ] && [ "$(readlink "$data_dir" 2>/dev/null)" != "$kdna_root" ]; then
        ln -sf "$kdna_root" "$data_dir/kdna_root" 2>/dev/null || true
      fi
    fi
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

Installs two skills:
  kdna-loader  — loads KDNA domain cognition before responding
  kdna-create  — creates, downloads, or imports KDNA domains
EOF
}

install_codex() {
  install_skills_for_agent "Codex" \
    "$HOME/.codex/skills" \
    "$HOME/.codex/Kdna"
}

install_claude() {
  install_skills_for_agent "Claude Code" \
    "$HOME/.claude/skills" \
    "$HOME/.claude/Kdna"
}

install_opencode() {
  install_skills_for_agent "OpenCode" \
    "$HOME/.agents/skills" \
    "$HOME/.agents/Kdna"
}

install_cursor() {
  install_skills_for_agent "Cursor" \
    "$HOME/.cursor/skills" \
    "$HOME/.cursor/Kdna"
}

install_copilot() {
  install_skills_for_agent "GitHub Copilot" \
    "$HOME/.agents/skills" \
    "$HOME/.agents/Kdna"
}

interactive_mode() {
  local agents
  agents=$(detect_agents)

  if [ -z "$agents" ]; then
    warn "No agents detected. Manual install:"
    echo ""
    echo "  Codex:       mkdir -p ~/.codex/skills/kdna-loader ~/.codex/skills/kdna-create"
    echo "  Claude Code: mkdir -p ~/.claude/skills/kdna-loader ~/.claude/skills/kdna-create"
    echo "  OpenCode:    mkdir -p ~/.agents/skills/kdna-loader ~/.agents/skills/kdna-create"
    echo ""
    echo "Then copy kdna-loader/SKILL.md and kdna-create/SKILL.md into each."
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
log "Installation complete. Two skills installed:"
echo ""
echo "  kdna-loader — loads domain cognition before responding"
echo "  kdna-create — creates, downloads, or imports KDNA domains"
echo ""
echo "Next steps:"
echo "  1. Add domains: ask your agent 'download the communication KDNA from the registry'"
echo "  2. Or create:   ask your agent 'create a KDNA for my domain expertise'"
echo "  3. See available domains: $KDNA_REPO"
