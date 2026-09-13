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
3. Run the installer from a complete `kdna-skills` checkout. It resolves
   `kdna-loader/SKILL.md` next to the script and fails closed when that file is
   missing, so a piped `curl | bash` invocation is not a supported path.
4. Verify that the installer writes to exactly the one Host named on the
   command line, and that it never overwrites an existing different Skill at
   the destination.
5. Open a PR

### Adding Agent Support

To add support for a new AI agent:

1. Add the Host destination to the explicit `case "$1"` selection in
   `install.sh`
2. Add a `--<agent>` usage line to the `print_usage` text
3. Test the full install flow for that one Host
4. Update README

The installer never detects Hosts, never installs into multiple Hosts, and
never creates workspace attachments. Host detection belongs to the operator,
not to this script. Copying a Skill file is an install step only: it does not
mean the Host has enabled, validated or consumed the Skill.

## Quality Requirements

- Skill files must be valid Markdown
- install.sh must pass `shellcheck` (or equivalent)
- No proprietary or private data in skill files
- All agent paths must be documented

## License

Apache 2.0

## Developer Certificate of Origin (DCO)

All commits must include a `Signed-off-by:` line. Use `git commit -s` to add it automatically.

This certifies that you wrote the code or have the right to submit it under the project's license (Apache-2.0). No CLA is required.
