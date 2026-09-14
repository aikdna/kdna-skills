# KDNA Agent Adapters

Agent, Skill and local stdio integrations for the official KDNA toolchain.
A .kdna asset is task material; an adapter is not a protocol authority.

- **`kdna-loader`** — current explicit local catalog/selection/Read guidance.
- **`kdna-creator`** — a Skill adapting the fixed Studio CLI live
  session for bounded text judgment creation and natural-language human review.
- **MCP server** — local candidate 0.7.0-rc.component-semantics.1 for one operator-bound input, using
  fixed CLI 0.38.0-rc.component-semantics.1/Core 0.24.0-rc.component-semantics.2/Read 0.3.0-rc.component-semantics.2. No model-selected paths or discovery.

## Current local Read workflow

Install from this checkout using its lock and bundled dependency archives.
The local RC uses exact file dependencies and disables npm publication. Do not
substitute a global or registry CLI by version alone.
See [local reproduction and package boundaries](mcp-server/README.md).
`bash install-cli.sh` installs this same fixed CLI graph into the checkout.
It requires the complete checkout and does not install a global binary.
Older versions of this script installed the registry CLI globally; callers
should now use the local path printed by the script. Existing global installs
are neither selected nor modified.

```sh
node /absolute/installed/mcp-server/bin/kdna-mcp.mjs --asset /absolute/selected.kdna --allow-read
```

The operator/trusted launcher supplies OS argv outside MCP stdin. initialize
and tools never establish or enlarge permission. Read the catalog, use an exact
canonical selection with its mandatory closure, and expand only in that same
official CLI process. A ready Read result does not establish authorship,
confirmation, action permission or Creation acceptance. Cancel closes the
binding; a new file requires a new operator-controlled launch.

Use [kdna-loader](kdna-loader/SKILL.md) for the complete direct CLI and MCP
workflow. No global store scanning, automatic matching, workspace attachment
mutation, raw-payload parser or legacy load/plan-load fallback is provided.
KDNA adoption must be visible, and asset text cannot override Host instructions.

### Create an asset

Follow [`kdna-creator`](kdna-creator/SKILL.md) and its self-contained
[terminal session adapter](kdna-creator/references/terminal-session.md). An Agent
uses the approved exact local Studio CLI with explicitly authorized ordinary
text or interview material and a separate human channel. A live session can
produce a new private technical export bundle; it does not support persistent
resume or establish Creation Complete, real identity or editorial fitness.
This Creator candidate does not change Loader/MCP support or publication status.


## Validation scope

| Component | Reproducible checks |
| --- | --- |
| Loader/MCP | Direct CLI, source stdio and fresh offline packed-consumer tests |
| `kdna-creator/SKILL.md` | Current archive declarations, examples and standalone links |
| Five Host guides | Operator command vectors; named Host delivery and semantic adoption NOT_RUN |

Run the commands in the [MCP README](mcp-server/README.md). The
[support matrix](docs/agent-support-matrix.json) describes this version only.
Its validator checks the actual runtime manifest, complete lock and archive
bytes. Process tests check the real tool surface. These checks do not establish
Host activation, editorial quality, human review or publication.
[Loader contract](docs/KDNA_LOADER_CONTRACT.md) describes only this adapter.
Earlier released versions remain documented in [CHANGELOG](CHANGELOG.md).

Official KDNA npm packages use the @aikdna scope; the unscoped kdna npm package
is not affiliated. The source workflow requires no global installation.

[中文](./README.zh.md)
