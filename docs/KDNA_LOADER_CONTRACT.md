# KDNA Loader Contract

Status: Implementation Contract
Normative: No
Protocol Source of Truth: `aikdna/kdna`

`kdna-skills` provides agent adapters. It does not define the KDNA protocol and
must not become a parallel authorization runtime.

## Loader Rules

- Adapters MUST use the official CLI/Core loader path for `.kdna` assets.
- Adapters MUST NOT parse `.kdna` containers manually.
- Adapters MUST NOT infer entitlement validity from raw manifest fields.
- Adapters MUST call `kdna plan-load` or an equivalent Core implementation
  before loading protected, licensed, or remote assets.
- Adapters MUST NOT load an asset unless the Core/CLI result says
  `can_load_now=true`.
- Adapters MUST treat remote assets as recognized but unsupported until a
  conforming remote runtime is available.
- Adapters MUST NOT expose full protected payloads to tools, plugins, logs, or
  ordinary model context by default.
- Adapters MUST NOT claim marketplace approval, official quality endorsement,
  or registry-required authorization.

## Initial Support Matrix

| Asset | Adapter behavior |
|---|---|
| `public` | May load through CLI/Core when `can_load_now=true`. |
| `licensed/password` | May load only after CLI/Core authorizes the credential. |
| `licensed/local_receipt` | Recognize and defer to CLI/Core receipt handling. |
| `remote` | Recognize and block locally unless a conforming runtime is connected. |
| invalid/tampered/expired/revoked | Fail closed and surface Core issue codes. |

## Agent Boundary

KDNA shapes judgment for a task. It does not override system policy, tool
permissions, safety policy, or user intent. Agent adapters should load the
smallest runtime projection needed for the task, not raw KDNA internals.
