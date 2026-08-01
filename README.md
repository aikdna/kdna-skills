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
kdna load ./judgment.kdna --profile=compact --as=json
```

The published CLI `0.35.1` performs validation and planning inside that single
`load` invocation. If the original instruction already binds the exact file,
task/purpose, current Host, named processor and least projection, no additional
confirmation is needed. Otherwise the Host asks one consolidated confirmation
covering the missing dimensions. An Agent must not repeat that approval for
separate validate/plan/load steps. This use-once path creates no attachment or
persistent workspace state. `validate` and `plan-load` remain optional
diagnostics, not mandatory pre-load calls. A protected file may require one
additional password authorization through bounded stdin; the password never
belongs in argv, environment, a task file, or output.

The `0.5.0` MCP source candidate also supports an approved workspace relation
through its exact `@aikdna/kdna-cli@0.36.0` source dependency. The registry CLI
is still `0.35.1`; do not expect these commands from that published version:

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

The Host then calls the thin MCP workspace status/resolver/load tools. The MCP
adapter exposes only those three workspace-bound tools. It cannot create or
mutate the attachment relation, and it does not expose arbitrary-path
explicit-file tools; use the official CLI path above for a user-selected file.

The MCP component can consume a password from a native Host secret provider
through a fresh current-user-owned mode-`0600` authorization file. The path and
value stay outside tool arguments, and the adapter passes the value only
through the pinned CLI's password stdin. This proves a process boundary, not a
current Codex/OpenCode user path: users must not handcraft the file, export its
coordinate, or send a password in chat. Until a standard Host supplies a
model-hidden provider and owns cleanup, protected MCP consumption remains
deferred. Protected explicit-file CLI stdin remains a tested low-level
capability; ordinary public files require no secret provider.

Attachment approval does not authorize delivery of a decrypted Capsule to a
model. Before workspace load, the Host must obtain one plain-language approval
for the exact asset, Host identity, named processing destination and minimal
projection. The adapter binds that approval through a Host-private rotating
consent file. The user sees names and Allow/Decline; the Host hides attachment
IDs, digests, schema, scope mode, approval-source and profile mechanics.

The user must select the file, or approve an exact Host attachment first. The
adapter may not scan a global store, choose assets from task keywords, infer
consent from file presence, or hide whether KDNA was used.

The checked-in CLI candidate is the exact 32-file closed package surface. It
has no Eval dependency, retired command modules, global Store implementation,
or bundled legacy Skill.

## Adapter contract

- accept one explicit file or exact user-approved attachment;
- defer parsing, integrity, authorization, decryption, and projection to Core;
- load only when the LoadPlan permits it, or when its sole remaining
  requirement is a password that the real CLI load verifies through stdin;
- show active identity, version or digest, scope, and reason;
- provide disable, switch, and rollback controls;
- keep facts, user intent, law, safety, system rules, and Host permissions above
  asset content.

See [the loader contract](docs/KDNA_LOADER_CONTRACT.md) and the
[support matrix](docs/agent-support-matrix.json).

## Repository components

| Component               | Current status                                                      |
| ----------------------- | ------------------------------------------------------------------- |
| `kdna-loader/SKILL.md`  | Unassessed fallback adapter candidate                               |
| `kdna-creator/SKILL.md` | Source candidate for terminal Creation Engine guidance; Unassessed  |
| MCP server              | `0.5.0` three-tool workspace candidate; component tests pass         |
| Codex / OpenCode        | `RECHECK_REQUIRED` at the two current benchmark coordinates         |
| Other placement guides  | Unassessed integration notes                                        |
| installers              | One explicitly selected Host only; no detection or install-all mode |

Component tests do not establish Host delivery, semantic adoption,
Creation-to-Consumption integration, or real-human acceptance. Those four
dimensions remain `RECHECK_REQUIRED`, `RECHECK_REQUIRED`,
`RECHECK_REQUIRED`, and `NOT_RUN` until a machine-readable current authority is
rebuilt. Codex and OpenCode are benchmark coordinates, not the only supported
Host brands or a product requirement.

One qualified Host can close one functional consumption loop when it delivers
a real Runtime Capsule and proves visible, authorized, reversible semantic
adoption. The Codex+OpenCode pair is this candidate's separate
`PORTABILITY_BENCHMARK`; it does not require every user, installation, or
third-party Host to run two Hosts. Studio application integration is deferred
and must later reuse the same CLI/Core attachment schema rather than becoming a
second state authority.

The published npm MCP remains `0.4.2`; it is historical and is not the `0.5.0`
workspace candidate. The presence of a Skill file, a successful `kdna setup`,
or an enumerated local file does not prove correct Agent integration.

## Creation adapter

[`kdna-creator`](kdna-creator/SKILL.md) guides a terminal Agent through the
Studio CLI Creation Engine without requiring the Studio App. It is separate
from the read-only loader adapter: creation writes an explicit project
workspace, while loading consumes an explicit `.kdna` file or approved
workspace attachment.

The [Creation Agent contract](docs/KDNA_CREATION_AGENT_CONTRACT.md) defines the
natural-language Host boundary, content-free material inventory, private
material delivery, honest authority pauses, managed test candidate, three
separate gates, and final exact-byte delivery. Internal IDs, signing material,
and application evidence are Host orchestration details rather than user
inputs. These source documents do not establish Host support or Studio Product
Acceptance; `kdna-creator` remains Unassessed until a clean-install,
fresh-context Host completes the public flow.

[中文](./README.zh.md)
