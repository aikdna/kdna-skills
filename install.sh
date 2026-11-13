#!/usr/bin/env bash
set -euo pipefail

# Installs kdna-loader and kdna-creator (including agents/, references/, and
# scripts/) for exactly one explicitly selected Host or target skills directory.
# Never auto-detects Hosts, installs into multiple Hosts, scans directories for
# .kdna assets, or grants read/action permission.

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { printf '%b[kdna]%b %s\n' "$GREEN" "$NC" "$1"; }
err() { printf '%b[kdna]%b %s\n' "$RED" "$NC" "$1" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

print_usage() {
  cat <<'EOF'
Usage: install.sh TARGET [--only loader|creator] [--force]

Install kdna-loader and kdna-creator (with references/, scripts/, and agents/)
into one explicitly selected Host skills directory:
  --claude             Claude Code (~/.claude/skills)
  --codex              Codex (~/.codex/skills)
  --cursor             Cursor (~/.cursor/skills)
  --opencode           OpenCode (~/.agents/skills)
  --copilot            GitHub Copilot-compatible agents (~/.agents/skills)
  --antigravity        Antigravity (~/.gemini/antigravity/skills)
  --dir <skills-root>  Explicit target skills directory

Options:
  --only loader|creator  Install only kdna-loader or only kdna-creator
  --force                Update existing Skill files when local copies differ
  --help, -h             Show this message

Exit codes:
  0  Installed cleanly (or already up to date with identical bytes)
  1  Invalid arguments or missing source checkout files
  2  Existing destination file differs and --force was not given

This installer never detects Hosts automatically, never installs into multiple
Hosts at once, and never grants permission to read or create KDNA assets.
EOF
}

HOST_NAME=""
SKILL_BASE=""
ONLY_WHICH="both"
FORCE=0
TARGET_COUNT=0

set_target() {
  HOST_NAME="$1"
  SKILL_BASE="$2"
  TARGET_COUNT=$((TARGET_COUNT + 1))
}

if [ "$#" -eq 0 ]; then
  err "Choose exactly one Host or --dir <skills-root>."
  print_usage
  exit 1
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --claude) set_target "Claude Code" "$HOME/.claude/skills"; shift ;;
    --codex) set_target "Codex" "$HOME/.codex/skills"; shift ;;
    --cursor) set_target "Cursor" "$HOME/.cursor/skills"; shift ;;
    --opencode) set_target "OpenCode" "$HOME/.agents/skills"; shift ;;
    --copilot) set_target "GitHub Copilot-compatible agents" "$HOME/.agents/skills"; shift ;;
    --antigravity) set_target "Antigravity" "$HOME/.gemini/antigravity/skills"; shift ;;
    --dir)
      if [ "$#" -lt 2 ] || [ -z "${2:-}" ] || [[ "${2:-}" == -* ]]; then
        err "--dir requires a non-empty target path."
        exit 1
      fi
      set_target "custom directory ($2)" "$2"
      shift 2
      ;;
    --only)
      if [ "$#" -lt 2 ]; then
        err "--only requires 'loader' or 'creator'."
        exit 1
      fi
      case "$2" in
        loader|creator) ONLY_WHICH="$2" ;;
        *) err "Invalid --only value: $2 (expected loader or creator)."; exit 1 ;;
      esac
      shift 2
      ;;
    --force) FORCE=1; shift ;;
    --help|-h) print_usage; exit 0 ;;
    *) err "Unknown option or Host: $1"; print_usage; exit 1 ;;
  esac
done

if [ "$TARGET_COUNT" -ne 1 ]; then
  err "Choose exactly one Host or --dir target."
  print_usage
  exit 1
fi

REL_FILES=()

collect_loader_files() {
  if [ ! -f "$SCRIPT_DIR/kdna-loader/SKILL.md" ]; then
    err "Missing source file: kdna-loader/SKILL.md"
    err "Run this installer from a complete kdna-skills checkout."
    exit 1
  fi
  REL_FILES+=("kdna-loader/SKILL.md")
}

collect_creator_files() {
  local rel
  for rel in \
    "kdna-creator/SKILL.md" \
    "kdna-creator/agents/openai.yaml" \
    "kdna-creator/references/authoring-and-protection.md" \
    "kdna-creator/references/co-creation-craft.md" \
    "kdna-creator/references/native-asset-authoring.md" \
    "kdna-creator/scripts/native-asset-review.mjs"; do
    if [ ! -f "$SCRIPT_DIR/$rel" ]; then
      err "Missing source file: $rel"
      err "Run this installer from a complete kdna-skills checkout."
      exit 1
    fi
    REL_FILES+=("$rel")
  done
}

case "$ONLY_WHICH" in
  loader) collect_loader_files ;;
  creator) collect_creator_files ;;
  both) collect_loader_files; collect_creator_files ;;
esac

CONFLICTS=()
NEED_WRITE=0

for rel in "${REL_FILES[@]}"; do
  src="$SCRIPT_DIR/$rel"
  dst="$SKILL_BASE/$rel"
  if [ -e "$dst" ]; then
    if [ ! -f "$dst" ]; then
      err "Destination path exists and is not a regular file: $dst"
      exit 2
    fi
    if ! cmp -s "$src" "$dst"; then
      if [ "$FORCE" -eq 1 ]; then
        NEED_WRITE=1
      else
        CONFLICTS+=("$rel")
      fi
    fi
  else
    NEED_WRITE=1
  fi
done

if [ "${#CONFLICTS[@]}" -gt 0 ]; then
  err "$HOST_NAME already has modified Skill file(s) under $SKILL_BASE:"
  for rel in "${CONFLICTS[@]}"; do
    err "  - $SKILL_BASE/$rel"
    err "    Inspect diff: diff -u \"$SKILL_BASE/$rel\" \"$SCRIPT_DIR/$rel\""
  done
  err "Re-run with --force to replace those files with this checkout's copy."
  exit 2
fi

if [ "$NEED_WRITE" -eq 0 ]; then
  log "$HOST_NAME already has the exact selected KDNA Skill files in $SKILL_BASE."
  exit 0
fi

INSTALLED_COUNT=0
UPDATED_COUNT=0

for rel in "${REL_FILES[@]}"; do
  src="$SCRIPT_DIR/$rel"
  dst="$SKILL_BASE/$rel"
  mkdir -p "$(dirname "$dst")"
  if [ -f "$dst" ]; then
    if cmp -s "$src" "$dst"; then
      continue
    fi
    cp -p "$src" "$dst"
    UPDATED_COUNT=$((UPDATED_COUNT + 1))
  else
    cp -p "$src" "$dst"
    INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
  fi
done

log "Completed KDNA Skill setup for $HOST_NAME in $SKILL_BASE (installed $INSTALLED_COUNT new, updated $UPDATED_COUNT)."

cat <<'EOF'

Skill placement does not activate the Host or grant permission to read or create
an asset. Use the direct official CLI (run `bash install-cli.sh` in this checkout
for an offline local CLI, or `@aikdna/kdna-cli@0.43.5`) as the primary route.
EOF
