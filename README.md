# KDNA Agent Adapters

This repository keeps KDNA's Agent, Skill, and MCP integration mission. Its
current `kdna-loader` Skill is **Unassessed** while the user-authorization and
Host-visibility contract is being recertified.

KDNA is not a Skill. A `.kdna` file is a portable judgment asset; an adapter is
only one way for a Host to call the official KDNA toolchain.

## Current safe path

```bash
npm install -g @aikdna/kdna-cli
kdna validate ./judgment.kdna
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

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

| Component | Current status |
|---|---|
| `kdna-loader/SKILL.md` | Unassessed adapter candidate |
| MCP server | Experimental tool adapter; discovery tools do not create authority |
| Agent placement guides | Unassessed integration notes |
| legacy setup scripts | Published historical implementation; not the recommended path |

The presence of a Skill file, a successful `kdna setup`, or an enumerated local
file does not prove correct Agent integration.

[中文](./README.zh.md)
