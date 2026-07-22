---
name: kdna-loader
description: Use the official KDNA MCP or CLI for one explicit .kdna file or the current workspace's user-approved attachments. Do not discover, attach, mutate, auto-select outside the approved set, or hide adoption.
---

# KDNA Loader

This adapter consumes one explicit KDNA judgment asset through the official
KDNA CLI/Core boundary. It does not define the KDNA protocol or decide which
judgment has authority.

## Activation boundary

Use this Skill only when either:

- the user explicitly asks to use a specific local `.kdna` file; or
- the current Host workspace may contain an attachment record previously
  approved by the user.

Do not scan directories or a global asset store, call discovery or matching
commands to choose an asset, infer consent from file presence, or activate from
broad task keywords. Do not read an attachment record yourself and invent a
selection. Pass the Host's current workspace and current task to the official
resolver. If no exact approved asset is available, continue without KDNA or ask
the user to choose one.

## Preferred workspace flow

When the Host exposes the KDNA MCP tools, call:

1. `kdna.workspace-status` with the current Host workspace when status is
   requested;
2. `kdna.workspace-load` with that workspace and the current task before using
   any attached judgment.

Respect the returned `load`, `ask`, `skip`, or `block` decision. Only `load`
contains a Runtime Capsule. Do not call CLI attachment mutations through this
Skill. The user controls the relation explicitly with `kdna attachments`,
`kdna disable`, `kdna enable`, `kdna switch`, `kdna rollback`, and `kdna remove`.

## Explicit-file flow

Use only the official toolchain:

```bash
kdna validate <file.kdna>
kdna plan-load <file.kdna> --json
```

Do not parse the ZIP, decode the payload, or infer authorization from manifest
fields. Continue only when Core reports `can_load_now: true`. Treat invalid,
expired, revoked, incompatible, unauthorized, or integrity-failed results as a
block.

## Load

```bash
kdna load <file.kdna> --profile=compact --as=json
```

Use only the toolchain-produced Runtime Capsule projection. For a text-only
Host, `--as=prompt` is allowed. Never expose credentials, encrypted payloads,
protected source content, or raw container internals.

## Apply with visible Host state

Use the selected judgment only inside its declared boundaries. Current facts,
explicit user intent, law, safety rules, system and developer instructions, and
Host permissions take precedence.

Before using a loaded projection, expose in the tool event or a short adoption
notice:

- active asset identity;
- exact version or digest;
- attachment scope;
- why it was loaded;
- the CLI controls to view, disable, switch, or roll back.

Do not hide whether KDNA was used. Do not claim that the asset is true, expert,
officially approved, or guaranteed to improve the result.

## Failure handling

| Situation                                     | Action                                    |
| --------------------------------------------- | ----------------------------------------- |
| No explicit file or exact approved attachment | Do not use KDNA.                          |
| Ambiguous asset choice                        | Ask the user; do not choose autonomously. |
| Resolver returns `ask`, `skip`, or `block`    | Do not plan or load.                      |
| `can_load_now` is not `true`                  | Follow the Core-required action or block. |
| Asset is outside its declared scope           | Skip it.                                  |
| User disables or replaces the attachment      | Stop using it immediately.                |
