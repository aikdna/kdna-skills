---
name: kdna-loader
description: Validate and load one explicit KDNA .kdna file when the user asks to use that file or the Host supplies an exact user-approved attachment. Do not discover, install, auto-select, or silently apply assets.
---

# KDNA Loader

This adapter consumes one explicit KDNA judgment asset through the official
KDNA CLI/Core boundary. It does not define the KDNA protocol or decide which
judgment has authority.

## Activation boundary

Use this Skill only when either:

- the user explicitly asks to use a specific local `.kdna` file; or
- the Host supplies an exact attachment already approved by the user, including
  file identity or path, version or digest, and attachment scope.

Do not scan directories or a global asset store, call discovery or matching
commands to choose an asset, infer consent from file presence, or activate from
broad task keywords. If no exact approved asset is available, continue without
KDNA or ask the user to choose one.

## Validate and plan

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

The Host must expose, outside ordinary answer prose:

- active asset identity;
- exact version or digest;
- attachment scope;
- why it was loaded;
- controls to disable, switch, or roll back.

Do not hide whether KDNA was used. Do not claim that the asset is true, expert,
officially approved, or guaranteed to improve the result.

## Failure handling

| Situation | Action |
|---|---|
| No explicit file or exact approved attachment | Do not use KDNA. |
| Ambiguous asset choice | Ask the user; do not choose autonomously. |
| `can_load_now` is not `true` | Follow the Core-required action or block. |
| Asset is outside its declared scope | Skip it. |
| User disables or replaces the attachment | Stop using it immediately. |
