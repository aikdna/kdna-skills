# Contributing to KDNA Skills

This repository contains the kdna-loader agent skill and the
installer script (install.sh) for KDNA.

## How to Contribute

### Skill Improvements

1. Edit the relevant `SKILL.md` file in `kdna-loader/`
2. Test with your target agent (Claude Code, Codex, OpenCode, etc.)
3. Open a PR with a description of what changed and why

### Installer Improvements

1. Edit `install.sh`
2. Test with `bash -n install.sh` (syntax check) and a live install
3. Verify both piped (`curl | bash`) and cloned usage work
4. Open a PR

### Adding Agent Support

To add support for a new AI agent:

1. Add an `install_<agent>()` function in `install.sh`
2. Add the agent to `detect_agents()`
3. Add a `--<agent>` CLI flag
4. Test the full install flow
5. Update README

## Quality Requirements

- Skill files must be valid Markdown
- install.sh must pass `shellcheck` (or equivalent)
- No proprietary or private data in skill files
- All agent paths must be documented

## License

Apache 2.0
