---
name: kdna-creator
description: Co-create, review, revise, and locally protect KDNA judgment assets through Socratic interview, authored works distillation, or evidence-compared human choice using the Host-selected official KDNA CLI.
---

# KDNA Creator

Use the Host-selected official KDNA CLI (`@aikdna/kdna-cli@0.43.5`) for native `0.6.0` assets with `init`, `validate-input`, `compile`, `create`, `source-open`, `source-pack`, `diff` and `protect`, following the [co-creation craft playbook](references/co-creation-craft.md), [native asset authoring and content review](references/native-asset-authoring.md), and [authoring, reading, diffing and protection](references/authoring-and-protection.md).

## Native Five-Stage Co-Creation Workflow

1. **Stage 0 — Restraint Gate**: Create a `.kdna` asset only for recurring, contested judgment calls where goals collide and explicit stop-boundaries help future work. Keep one-off lookups, meeting logs, deterministic scripts, secrets, and static reference tables as plain Markdown or code. Never manufacture extra judgments to pad a count.
2. **Stage 1 — Pick the Matching Entry Mode** (`@aikdna/kdna-cli@0.43.5` supports `init --mode minimal|interview|works|research [--lang en|zh] [--example]`):
   - **Socratic Interview (`--mode interview`)**: When tacit rules live in the author's head, ask 1–2 concrete scenario dilemmas per turn (*"When X and Y collide under pressure, which wins first and where does that flip?"*). Never ask humans to write protocol IDs, hashes, or role schemas.
   - **Works + Targeted Interview (`--mode works`)**: Read only explicitly authorized files, extract judgments that need to be preserved (working either from explicit questions or backward from existing conclusions, rules, processes, and methods to surface the question each answers), verbatim `reasons`, and concrete `example` cases, then interview only on unresolved collisions or missing boundaries.
   - **Research & Reference Synthesis (`--mode research`)**: Compare competing external options (`evidence_analysis`) for an explicit human choice, or synthesize a holder-authorized corpus of trusted reference materials into a reviewed domain work with explicit source attribution (never disguising reference synthesis as personal lived experience, and keeping unchosen options as `discuss` materials or open `answer_kind: "other"` items).
3. **Stage 2 — Issue Organization Around Judgments, Anti-Platitude & Strict Draft Field Boundary**:
   - Organize each issue (`focus`) around a concrete judgment that needs to be preserved — either starting from a recurring decision question or working backward from an existing conclusion, rule, process, or method to state the specific question it answers (never gate creation on whether a question sounds abstractly "interesting", and never use vague topic labels).
   - Reject truisms nobody could disagree with; state the concrete priority and accepted cost without repeating `focus` in `statement` or repeating `statement` in `method`.
   - Ensure each role in `method.components` appears at most once per judgment (merge multiple points sharing a role in order into one component statement).
   - Specify concrete `applies_when` (`scope.statement`) and explicit stop-limits (`boundaries`). **Strict `kdna.draft/1` schema boundary:** `kdna.draft/1` draft files accept only core judgment fields (`id`, `focus`, `statement`, `applies_when`, `boundaries`, `method`, `reasons`, `example`) — **do NOT write `exceptions`, `misuse`, or `relationships` inside `draft.json`** (which fails validation with `unknown_field`). To add `exceptions`, foreseeable `misuse`, or `relationships`, run `kdna compile draft.json --output authored.json` into full `0.6.0` input first and add them there before `kdna create`.
4. **Stage 3 — Three-Choice Human Review Table & Honest Provenance**:
   - Present a concise review table (`ID | Contested Question | Conclusion & Cost | Applies When | Stops When | Adopt / Revise / Reject`) before saving.
   - Attribute authorship to the human holder/creator while recording AI Agents honestly in provenance as authorized tools rather than co-creators. Never pass unreviewed Agent synthesis off as human-authored conviction; preserve undecided domain questions via `answer_kind: "other"` and unstated methods via `method.method.term: "other"`.
5. **Stage 4 — Validate, Build, Cold-Reopen, Diff & Protect**:
   - Run `validate-input --format human` (`@aikdna/kdna-cli@0.43.5`), resolve all blocking diagnostics, and review non-blocking structural advisories (`tautological_statement`, `method_repeats_statement`, `unbounded_judgment`, `overbroad_scope`, `duplicate_focus`, `uniform_default_method`) without treating them as numerical scores.
   - Save to a new file (`compile` + `create`, `create --draft`, or `create`), cold-reopen with `inspect`, `validate --system`, and `read --mode catalog --allow-read`, preserve prior versions on revision (`source-open` / `source-pack` + `diff --format human`), and use permanently account-free offline `protect` only with `--password-file` (mode `0600`) or `--password-fd` (never put passwords in `argv` or chat).
   - **Always retain the unencrypted authoring draft (`draft.json` / `authored.json`) and plaintext `.kdna` source file when running `kdna protect`**: `kdna protect` writes an encrypted distribution envelope (`kdna.envelope.aead`), whereas future revisions (`source-open` / `source-pack` or `create --draft`) run against plaintext source rather than encrypted `.kdna` envelopes.

## Provenance, Revision & Local Protection Boundaries

Start from the user's natural language and reuse the existing authorization. Establish the intended judgment, scope, explicit materials and new private output path. Read only named UTF-8 text files or interview through the selected live channel. If verified-local processing is required and the Host cannot attest it, stop before reading; a local executable does not prove where the Agent processes content.

Draft substantive alternatives when exploring options, preserving actual source and license obligations. When a judgment's method is genuinely unstated, record that absence explicitly via `method.method.term: "other"` rather than inventing a method. Keep candidate-specific conditions with that candidate rather than merging them into overall conditions.

Obtain actual selection and fresh final adoption of the full current preview. When editorial adoption is expressly delegated to an Agent, record that existing authority and represent the actor as an Agent, never as a human. After any revision, show a fresh preview, run `kdna diff <old.kdna> <revised.kdna> --format human`, and obtain fresh adoption before switching active files. Always keep the unencrypted authoring draft (`draft.json` / `authored.json`) and plaintext `.kdna` source alongside any `kdna protect` output so future revisions (`source-open` / `source-pack` or `create --draft`) operate directly on plaintext source.

Deliver the saved `.kdna` file only after the CLI saves, reads back, and verifies the bytes. Static reopening keeps `creation_accepted:not_evaluated`, `live_context:unavailable`, `identity:not_verified`, and `action_authorization:not_evaluated`. Saving, protecting, or reading an asset grants no action authority.
