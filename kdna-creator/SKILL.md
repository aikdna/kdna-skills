---
name: kdna-creator
description: Co-create, review, revise, and locally protect native 0.6.0 KDNA assets via works, interview, or research using @aikdna/kdna-cli@0.46.0.
---

# KDNA Creator

Use `@aikdna/kdna-cli@0.46.0` (npm primary; `--registry=https://registry.npmmirror.com` only on CN timeout) for native `0.6.0` authoring. Load references **on demand only**:

- [co-creation-craft.md](references/co-creation-craft.md): 3-path craft, 5 empirical lessons, `.kdna-work/` staging, cross-domain examples.
- [draft-schema-and-methods.md](references/draft-schema-and-methods.md): extended `kdna.draft/1`, 16-method roles, `KDNA Reader v0.3.4` notes.
- [authoring-and-protection.md](references/authoring-and-protection.md): CLI `0.46.0` commands, single-source `draft.json` revision, `diff`, protection.
- [native-asset-authoring.md](references/native-asset-authoring.md): raw `{manifest, payload, members}` attachments, `native-asset-review.mjs`, diagnostics.

## Stage 0: Scope & Tier Calibration

- **Expand vs. Isolate**: Extend an existing `.kdna` only within one decision domain; isolate separate domains so `catalog` stays clean. Elevate recurring cross-domain collisions into an explicit arbitration issue.
- **Tier Calibration (no uniform quality ruler)**:
  - *Tier 1 (Light / Taste, 1-15)*: Sharp `focus`, non-platitude `statement`, `applies_when`, `boundaries` only; never force `sections`, `relationships`, `worldview`, or fabricated `method` roles.
  - *Tier 2/3 (System / Research, 15+ or multi-source)*: Activate `sections`, `relationships` (`support`/`qualify`/`conflict`/`complement`), `value_order`, `worldview`, `exceptions`, `misuse`, and `sources`.

## Stage 1: 3-Path Routing & Confirmation

Reuse prior choices; ask at most one plain question for missing route/output path. Never ask humans for schemas, IDs, or hashes.

- **`works` (`--mode works`)**: Exhaust authorized files first; ask only on live collisions or missing stop-boundaries. **Confirm**: fidelity to the author's *current* stance.
- **`interview` (`--mode interview`)**: Elicit tacit rules via 1-2 dilemmas/turn (*"When X and Y collide, which wins and where does it flip?"*). **Anti-nagging**: no repetitive loops; ask only for missing priorities, stop-boundaries, or irreversible commitments.
- **`research` (`--mode research`)**: Compare options (`evidence_analysis`) or synthesize a trusted corpus. **Confirm**: material scope, route preference, and adoption boundaries -- **NEVER ask non-experts to certify domain truth**. Separate `creator` from cited `sources` (`source_refs`); keep unchosen options as `discuss` or open `answer_kind: "other"`.

## Stage 2: Ingestion, Authority & Staging

- **Multi-format extraction**: Read only authorized files. Extract UTF-8 first from `.docx`, `.pdf`, chat exports, or voice transcripts; fix ASR homophones by context (flag uncertain edits). **Never skip unreadable files silently** -- list every skipped file.
- **Source Authority Hierarchy**: `live author correction > author-edited primary > raw draft > secondary summary / AI glossary`. Higher version labels never override primary sources.
- **Conditional `.kdna-work/` Staging** (ONLY at `>= 5` files or `> 30 KB`): stage privately in `.kdna-work/` (`00-inventory.md` -> `01-raw-claims.jsonl` with upfront provenance tags + anchors -> `02-cluster-and-weave.md` -> `03-review-table.md`). Never pack `.kdna-work/` into `.kdna`.

## Stage 3: Distillation, Anti-Distortion & Weaving

- **Bidirectional issues**: Derive `focus` forward (`Q -> A`) or backward (`conclusion/rule -> Q`); never reject needed rules because the question sounds plain.
- **Catalog blind-readability**: Every `focus` must be selectable from `catalog` alone -- include scope cues; ban vague labels and unexplained jargon.
- **Subject lock & provenance**: Lock each judgment to its subject; separate direct stance, synthesis, derived extensions, and external sources; enforce **cross-file boundary attribution** (never cite File A for File B's limit).
- **Calibrated anti-absolutism & facts**: Ban unverified outcome guarantees and mind-reading; **keep** sharp operational redlines with boundaries/exceptions. Separate observable facts from inferred motives.
- **Phase & order**: Distinguish prep/review/training vs. live execution in `applies_when`/`misuse`; never treat `sections` (`reading_order`) as mandatory execution steps unless `form: "rule"`.
- **Throttle-brake & methods**: Pair prescriptive/mutually constraining rules with counterweights via `conflict`/`qualify` (no fake conflicts on Tier 1). Use `method.term: "other"` when unstated; merge repeated roles in order.

## Stage 4: Scoped Layered Review

Confirm layer-by-layer (spine -> live conflicts -> optional extensions) in a plain **`Adopt / Revise / Reject`** table (broad praise never confirms wording or citations). After compiling, run `kdna review <file.kdna> --allow-read` for a one-page proof sheet.

## Stage 5: Compile, Verification & Protection

- **Single-source `kdna.draft/1`**: Run `validate-input draft.json --format human`, fix errors, review advisories, then `create --draft draft.json --output <new.kdna> --allow-create`. Keep `draft.json` as the **sole canonical source** for revisions (edit `draft.json` -> bump `asset.version` -> `create --draft` -> `kdna diff <old> <new> --format human`). Use `source-open`/`source-pack` only for external `.kdna` without `draft.json` (or with `members[]`).
- **Honest 2-Tier Verification** (after cold-reopen `inspect` + `validate --system`):
  - *Tier 1 -- Closure & Brake Smoke Check (all Hosts; never call "blind")*: Run `kdna read <file.kdna> --mode exact_selection --judgment-id <id> --format human --allow-read` on 1 real task + 1 edge case; verify CLI stdout delivers paired brakes (`conflict`/`qualify`), boundaries, and exceptions.
  - *Tier 2 -- Fresh-Context Blind Test (only with isolated zero-history subagents)*: Fresh subagent gets only `catalog` stdout + case -> picks IDs -> CLI runs `exact_selection` -> fresh turn gets only `exact_selection` stdout + case. Label single-thread runs as non-blind walkthroughs.
- **Offline protection**: Run `kdna protect` via `--password-prompt`, `--password-env <VAR>`, `--password-file <0600-path>`, or `--password-fd <n>` -- never passphrases in `argv`/chat. Warn that **outer `manifest` stays plaintext** while `payload.kdnab` is AEAD-encrypted; keep plaintext `draft.json` + `.kdna` privately.
- **Frozen `KDNA Reader v0.3.4`**: CLI `0.46.0` supports `form: "rule"` and `answer_kind: "other"`, while Reader `v0.3.4` shows an incomplete banner on both; default to `form: "conclusion"` + `method` for zero-banner display until Reader's next release (never fabricate answers for undecided questions).

## Trust Boundaries

Stop before reading if verified-local processing is required without Host attestation. Record delegated Agents as Agents, never humans. Static reopening keeps `creation_accepted:not_evaluated`, `identity:not_verified`, and `action_authorization:not_evaluated`; saving or reading grants no action authority.
