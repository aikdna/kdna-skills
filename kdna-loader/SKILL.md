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
If `ask` includes a selection plan, show the current candidates once and pass
the user's exact choice back through the official one-task selection input.
Never reuse that choice for a later task.

## Explicit-file flow

This path uses the official CLI, not generic MCP tools. The current MCP source
candidate intentionally exposes no arbitrary-path inspect, verify, plan, or
load tool because an unmodified Host cannot prove a model-supplied path is a
user file selection.

If the original user instruction already binds the exact file, task or
purpose, current Host, named processing destination, and least projection, it
is the meaningful use-once approval: do not ask again. If any of those
substantive dimensions is missing, show the asset name and purpose, current
Host, named destination, and minimum delivered context in one consolidated
Allow/Decline confirmation. After that single confirmation, do not ask again
for internal validation, planning, or loading. Thus an ordinary public file
needs zero or one supplemental meaningful confirmation, never a fixed second
prompt. Do not ask the user for a receipt, internal ID, digest, schema, scope
mode, approval source, or profile. Do not create an attachment or other
persistent state.

```bash
kdna load <file.kdna> --profile=compact --as=json
```

`kdna load` performs Core validation and LoadPlan enforcement internally.
`kdna validate` and `kdna plan-load` are optional diagnostics only; do not
force three reads or three approvals before an ordinary use-once load. Do not
parse the ZIP, decode the payload, or infer authorization from manifest fields.

If the single load reports that a password is the sole remaining requirement,
obtain one additional secret authorization and retry once with
`--password-stdin`. Preserve leading and trailing spaces; remove only the
transport newline defined by the CLI. Never put the secret in argv,
environment, a workspace file, or output. A wrong value blocks without
echoing it. Ordinary public files never request a secret.

Treat invalid, expired, revoked, incompatible, unauthorized, or
integrity-failed results as a block.

Use only the toolchain-produced Runtime Capsule projection. For a text-only
Host, `--as=prompt` is allowed. Never expose credentials, encrypted payloads,
protected source content, or raw container internals.

## Apply with visible Host state

Use the selected judgment only inside its declared boundaries. Current facts,
explicit user intent, law, safety rules, system and developer instructions, and
Host permissions take precedence.

When the Runtime Capsule or its adoption result carries judgment rules (axioms
with `applies_when`, `does_not_apply_when`, and `failure_risk`), treat those
rules as the binding decision criteria for the loaded task. Do not reduce the
projection to a surface direction such as a task role or intent label: the
rules, their applicability, and their failure risk are the operative content.
When a candidate change is a preference-only change that the rules do not mark
as blocking, it must not be reported as a blocker. When rules describe a
demonstrated correctness, safety, or reproducibility defect as blocking, that
defect is blocking. When in doubt between a demonstrated defect and a
preference, the rules and their `does_not_apply_when` decide, not the Host's
default review habits.

Before using a loaded projection, expose in the tool event or a short adoption
notice:

- active asset identity;
- exact version or digest;
- attachment scope;
- why it was loaded;
- the CLI controls to view, disable, switch, or roll back.

Present the notice in human terms first: the asset's role and purpose, what
scope it applies to, why it was loaded for this task, and the controls to
disable/switch/roll back. The digest, snapshot path, and policy enums are
machine-verification details: include them for auditability but do not let
them crowd out the human-facing summary. An empty or unavailable field is
not a problem; say so plainly (for example "worldview: none declared")
instead of listing an empty structure the user must interpret.

Disclosure is unconditional: it is not gated on the user asking about KDNA,
mentioning attachments, or requesting an explanation. Whether or not the user
inquires, when a loaded projection influences your answer you must state that
KDNA was used, which asset, and the controls to disable it. Do not hide whether KDNA was used, and do not treat silence about KDNA as acceptable because the user did not ask. Do not claim that the asset is true, expert, officially
approved, or guaranteed to improve the result.

The disclosure must be explicit and visible in the response (or the tool
event for tool-calling hosts), not implied by tone or buried in a footnote
the user must request. A response that applies the loaded judgment without
any mention of KDNA is a disclosure failure even when the answer itself is
correct.

## Failure handling

| Situation                                     | Action                                    |
| --------------------------------------------- | ----------------------------------------- |
| No explicit file or exact approved attachment | Do not use KDNA.                          |
| Ambiguous asset choice                        | Ask the user; do not choose autonomously. |
| Resolver returns `ask`, `skip`, or `block`    | Do not plan or load.                      |
| `can_load_now` is not `true`                  | Follow the Core-required action or block. |
| Asset is outside its declared scope           | Skip it.                                  |
| User disables or replaces the attachment      | Stop using it immediately.                |

One qualified Host can complete this functional contract. A second Host may be
used as a portability benchmark, but is not a per-user or per-task product
minimum. Studio product integration is separate and must reuse the same
CLI/Core attachment state when implemented.
