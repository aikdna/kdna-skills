# KDNA Agent Adapters

This repository keeps KDNA's Agent, Skill, and MCP integration mission. Its
current `kdna-loader` Skill is **Unassessed** while the user-authorization and
Host-visibility contract is being recertified.

KDNA is not a Skill. A `.kdna` file is a portable judgment asset; an adapter is
only one way for a Host to call the official KDNA toolchain.

## Current safe paths

For one explicit file:

```bash
npm install -g @aikdna/kdna-cli
kdna validate ./judgment.kdna
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

The `0.5.0` MCP source candidate also supports an approved workspace relation
through its exact `@aikdna/kdna-cli@0.36.0` source dependency. The registry CLI
is still `0.35.1`; do not expect these commands from that published version:

```bash
kdna attach ./judgment.kdna --cwd ./my-project --role article-writing \
  --applies-to draft --does-not-apply-to code --yes
kdna attachments --cwd ./my-project
```

The Host then calls the thin MCP workspace status/resolver/load tools. The MCP
adapter cannot create or mutate the attachment relation.

The user must select the file, or approve an exact Host attachment first. The
adapter may not scan a global store, choose assets from task keywords, infer
consent from file presence, or hide whether KDNA was used.

## Adapter contract

- accept one explicit file or exact user-approved attachment;
- defer parsing, integrity, authorization, decryption, and projection to Core;
- load only when the LoadPlan permits it;
- show active identity, version or digest, scope, and reason;
- provide disable, switch, and rollback controls;
- keep facts, user intent, law, safety, system rules, and Host permissions above
  asset content.

See [the loader contract](docs/KDNA_LOADER_CONTRACT.md) and the
[support matrix](docs/agent-support-matrix.json).

## Repository components

| Component              | Current status                                                      |
| ---------------------- | ------------------------------------------------------------------- |
| `kdna-loader/SKILL.md` | Unassessed fallback adapter candidate                               |
| MCP server             | `0.5.0` source candidate; Codex and OpenCode verified               |
| Codex / OpenCode       | Source candidate verified through independent MCP configurations    |
| Other placement guides | Unassessed integration notes                                        |
| installers             | One explicitly selected Host only; no detection or install-all mode |

The published npm MCP remains `0.4.2`; it is historical and is not the `0.5.0`
workspace candidate. The presence of a Skill file, a successful `kdna setup`,
or an enumerated local file does not prove correct Agent integration.

[中文](./README.zh.md)
