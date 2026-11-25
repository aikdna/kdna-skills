# Creation Agent Adapter Contract (Native `0.6.0`)

The standalone creation entry is [KDNA Creator](../kdna-creator/SKILL.md), paired
with four focused on-demand references:
[co-creation-craft.md](../kdna-creator/references/co-creation-craft.md),
[draft-schema-and-methods.md](../kdna-creator/references/draft-schema-and-methods.md),
[authoring-and-protection.md](../kdna-creator/references/authoring-and-protection.md),
and [native-asset-authoring.md](../kdna-creator/references/native-asset-authoring.md).
This repository contributes authoring guidance and digest-bound review tooling,
not a second public parser, component interpreter, or compiler.

## Authoring & Compilation Boundary

1. **Direct native CLI (`@aikdna/kdna-cli@0.46.0`)**: Creation, validation,
   revision, diffing, and permanently account-free offline protection run
   through the official CLI (`init`, `validate-input`, `compile`,
   `create --draft`, `inspect`, `validate --system`, `read`, `review`, `diff`,
   `protect`, `unprotect`, and `source-open` / `source-pack` for external
   `.kdna` files without a `draft.json`).
2. **Read-only MCP stays separate**: `@aikdna/kdna-mcp-server@0.8.4` remains a
   strictly read-only, single-file OS-`argv`-bound local stdio adapter. It does
   not expose compile, create, or write tools.
3. **Single-source revision discipline**: For draft-born assets, `draft.json`
   (`kdna.draft/1`) is the sole canonical source for revisions. Saving never
   overwrites prior `.kdna` files; every revision writes a new sibling file and
   presents `kdna diff --format human` for fresh author confirmation.

## Craft, Provenance & Honest Verification

- **Tier calibration**: Tier 1 light/taste assets (1–15 judgments) require only
  sharp `focus`, non-platitude `statement`, `applies_when`, and `boundaries`
  without forced sections or relationships. Tier 2/3 systems activate
  `sections`, typed `relationships`, `value_order`, `worldview`, `exceptions`,
  `misuse`, and `sources` provenance.
- **Distinct 3-path confirmation contracts**: `works` confirms fidelity to the
  author's current stance; `interview` confirms concrete slices, priorities,
  and stop-boundaries without nagging; `research` confirms material scope,
  route preference, and adoption boundaries — never asking non-experts to
  certify domain truth — while separating `creator` from cited original
  `sources`.
- **Digest-bound raw review**: For raw `{manifest, payload, members}` inputs,
  [`native-asset-review.mjs`](../kdna-creator/scripts/native-asset-review.mjs)
  emits a SHA-256-bound structural inventory and declared-review check. Record
  completeness never establishes content quality, Core admission, human
  confirmation, or Reader acceptance.
- **Two-tier verification honesty**: Same-session CLI checks are reported
  honestly as Tier 1 Deterministic Closure & Brake Smoke Checks (never "blind
  tests"). Tier 2 True Fresh-Context Blind Testing applies only when the Host
  spawns zero-history isolated subagents.
- **Offline protection & trust invariants**: Passphrases enter only through
  `--password-prompt`, `--password-env <VAR>`, `--password-file <0600-path>`,
  or `--password-fd <n>` — never `argv` or chat. Outer `manifest` metadata
  remains plaintext while `payload.kdnab` is AEAD-encrypted. Private dialogue
  and `.kdna-work/` staging files stay private; creation, identity, human
  adoption, and action authorization remain distinct (`not_evaluated` /
  `not_verified` on static reopening).
