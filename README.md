# KDNA Agent Adapters

**Agent, Skill, and MCP integrations that let a Host call the official KDNA
toolchain to inspect, validate, and load `.kdna` judgment assets.**

KDNA is not a Skill. A `.kdna` file is a portable judgment asset; an adapter is
only one way for a Host to call the official KDNA toolchain. This repository
provides:

- **`kdna-loader`** — a Skill that guides an Agent through loading one explicit
  `.kdna` file or an approved workspace attachment via the official CLI.
- **`kdna-creator`** — a Skill that guides a terminal Agent through the Studio
  CLI Creation Engine to author a `.kdna` project workspace.
- **MCP server** (`@aikdna/kdna-mcp-server`) — a thin stdio adapter for
  user-approved workspace attachments, delegating integrity, authorization,
  resolver, plan, and load decisions to the pinned KDNA CLI/Core runtime.

All adapters defer parsing, integrity, authorization, decryption, and projection
to the official KDNA Core. The MCP server does not teach a Host a parallel KDNA
format and does not expose arbitrary-path file tools.

> New to KDNA? → [KDNA Core](https://github.com/aikdna/kdna)
>
> Need the CLI? → [@aikdna/kdna-cli](https://github.com/aikdna/kdna-cli)

---

## Install

### CLI (for the loader Skill)

```bash
npm install -g @aikdna/kdna-cli
```

### MCP server (npm)

```bash
npm install -g @aikdna/kdna-mcp-server
```

The MCP server pins the exact `@aikdna/kdna-cli@0.36.0` source dependency and
resolves one `@aikdna/kdna-core@0.21.0` runtime.

---

## Quick start

### Load one explicit file

```bash
kdna load ./judgment.kdna --profile=compact --as=json
```

The published CLI performs validation and planning inside that single `load`
invocation. If the original instruction already binds the exact file,
task/purpose, current Host, named processor, and least projection, no additional
confirmation is needed. Otherwise the Host asks one consolidated confirmation
covering the missing dimensions. `validate` and `plan-load` remain optional
diagnostics, not mandatory pre-load calls.

### Workspace attachments

A protected asset may require one password authorization through bounded stdin
(the password never belongs in argv, environment, a task file, or output). The
published CLI also exposes a human-readable `kdna host-consent --from-workspace`
surface that derives the Host processing consent draft from a user-approved
workspace attachment record; its terminal prompt hides digests, attachment IDs,
and scope coordinates.

The MCP server supports an approved workspace relation through its exact
`@aikdna/kdna-cli@0.36.0` source dependency:

```bash
secure-host-attachment-json | kdna attach ./judgment.kdna \
  --cwd ./my-project --attachment-stdin --preview
secure-host-attachment-json | kdna attach ./judgment.kdna \
  --cwd ./my-project --attachment-stdin --yes \
  --consent-digest sha256:<digest-from-preview>
kdna attachments --cwd ./my-project
```

`secure-host-attachment-json` represents the Host's bounded strict-UTF-8 stdin
producer. The two invocations use identical bytes containing the final role,
positive scope, optional negative scope, and approval source. Agent and MCP
integrations must not put those potentially private fields in argv or replace
the preview receipt with an unbound `--yes`.

### Create an asset

Follow the [`kdna-creator`](kdna-creator/SKILL.md) Skill to guide a terminal
Agent through the Studio CLI Creation Engine. Creation writes an explicit
project workspace; loading consumes an explicit `.kdna` file or approved
workspace attachment.

---

## Safety contract

- The user must select the file, or approve an exact Host attachment first.
- The adapter may not scan a global store, choose assets from task keywords,
  infer consent from file presence, or hide whether KDNA was used.
- Before workspace load, the Host must obtain one plain-language approval for
  the exact asset, Host identity, named processing destination, and minimal
  projection. The user sees names and Allow/Decline; the Host hides attachment
  IDs, digests, schema, scope mode, approval-source, and profile mechanics.
- Attachment approval does not authorize delivery of a decrypted Capsule to a
  model without that separate approval.
- The adapter shows active identity, version or digest, scope, and reason, and
  offers the official controls — direct attachment mutations such as disable,
  enable, switch, rollback, remove, and cleanup — through the CLI. The MCP adapter itself does not mutate
  attachments and never reads `.kdna/attachments.json`.

See [the loader contract](docs/KDNA_LOADER_CONTRACT.md), the
[Creation Agent contract](docs/KDNA_CREATION_AGENT_CONTRACT.md), and the
[support matrix](docs/agent-support-matrix.json).

---

## Status

| Component               | Status                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| MCP server              | Published `0.5.0` on npm; component tests pass                      |
| `kdna-loader/SKILL.md`  | Unassessed fallback adapter candidate                               |
| `kdna-creator/SKILL.md` | Source candidate for terminal Creation Engine guidance; Unassessed  |
| Codex / OpenCode        | OpenCode `VERIFIED_SINGLE_HOST_ORDINARY_TASK` at `1.18.11`; Codex `RECHECK_REQUIRED` at `0.144.3` (ordinary-task rerun pending) |
| Other placement guides  | Unassessed integration notes                                       |

Component tests do not establish Host delivery, semantic adoption,
Creation-to-Consumption integration, or real-human acceptance. Real-human
acceptance remains `NOT_RUN`. Codex and OpenCode are benchmark coordinates, not
the only supported Host brands or a product requirement. One qualified Host can
close one functional consumption loop; running two Hosts is not a requirement
for every user or third-party Host. Studio application integration is deferred
and must reuse the same CLI/Core attachment schema rather than becoming a second
state authority.

The presence of a Skill file, a successful `kdna setup`, or an enumerated local
file does not prove correct Agent integration.

---

[中文](./README.zh.md)
