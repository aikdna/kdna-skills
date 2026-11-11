---
name: kdna-creator
description: Co-create, review, and revise KDNA judgment assets through Socratic interview, authored works distillation, or evidence-compared human choice using the Host-selected native CLI or matched Studio session.
---

# KDNA Creator

Choose the creation route from the Host's exact installed contract. For native `0.6.0` assets with `init`, `validate-input`, `compile`, `create`, `source-open`, `source-pack`, `diff` and `protect`, follow the [co-creation craft playbook](references/co-creation-craft.md), [native asset authoring and content review](references/native-asset-authoring.md), and [authoring, reading, diffing and protection](references/upcoming-authoring-protection.md). Do not require Studio or Work as a prerequisite for the native CLI route.

## Native Five-Stage Co-Creation Workflow

1. **Stage 0 — Restraint Gate**: Create a `.kdna` asset only for recurring, contested judgment calls where goals collide and explicit stop-boundaries help future work. Keep one-off lookups, meeting logs, deterministic scripts, secrets, and static reference tables as plain Markdown or code. Never manufacture extra judgments to pad a count.
2. **Stage 1 — Pick the Matching Entry Mode** (`@aikdna/kdna-cli@0.43.4` supports `init --mode minimal|interview|works|research [--lang en|zh] [--example]`):
   - **Socratic Interview (`--mode interview`)**: When tacit rules live in the author's head, ask 1–2 concrete scenario dilemmas per turn (*"When X and Y collide under pressure, which wins first and where does that flip?"*). Never ask humans to write protocol IDs, hashes, or role schemas.
   - **Works + Targeted Interview (`--mode works`)**: Read only explicitly authorized files, extract recurring questions, conclusions, verbatim `reasons`, and concrete `example` cases, then interview only on unresolved collisions or missing boundaries.
   - **Research + Human Choice (`--mode research`)**: Present competing evidence (`evidence_analysis`) and require an explicit human adoption choice; keep unchosen options as `discuss` materials or open `answer_kind: "other"` items.
3. **Stage 2 — Question Distillation, Anti-Platitude & Three-Tier Boundaries**:
   - Frame `focus` as a contested recurring question, not a vague topic label.
   - Reject truisms nobody could disagree with; state the concrete priority and accepted cost without repeating `focus` in `statement` or repeating `statement` in `method`.
   - Ensure each role in `method.components` appears at most once per judgment (merge multiple points sharing a role in order into one component statement).
   - Specify concrete `applies_when` (`scope.statement`), explicit stop-limits (`boundaries`), and — in `0.43.4` drafts or full `0.6.0` input — `exceptions` and foreseeable `misuse`.
4. **Stage 3 — Three-Choice Human Review Table & Honest Provenance**:
   - Present a concise review table (`ID | Contested Question | Conclusion & Cost | Applies When | Stops When | Adopt / Revise / Reject`) before saving.
   - Never pass Agent synthesis off as human-authored conviction. Preserve undecided domain questions via `answer_kind: "other"` and unstated methods via `method.method.term: "other"`.
5. **Stage 4 — Validate, Build, Cold-Reopen, Diff & Protect**:
   - Run `validate-input --format human` (`@aikdna/kdna-cli@0.43.4`), resolve all blocking diagnostics, and review non-blocking structural advisories (`tautological_statement`, `method_repeats_statement`, `unbounded_judgment`, `overbroad_scope`, `duplicate_focus`, `uniform_default_method`) without treating them as numerical scores.
   - Save to a new file (`compile` + `create`, `create --draft`, or `create`), cold-reopen with `inspect`, `validate --system`, and `read --mode catalog --allow-read`, preserve prior versions on revision (`source-open` / `source-pack` + `diff --format human`), and use permanently account-free offline `protect` only with `--password-file` (mode `0600`) or `--password-fd` (never put passwords in `argv` or chat).

## Matched Studio Session & Provenance Boundaries

For the explicitly matched Studio session, follow [the terminal adapter](references/terminal-session.md). Core owns component interpretation and Studio owns materialization and the one-use lifecycle. Exact archive content and a Host-approved installation are required; no global binary, latest package, alternate checkout or old-Core fallback. The matched Studio route creates container `0.5` assets with Read `0.6.4`; the native CLI route creates container `0.6` assets with Read `0.7.0-candidate`. Keep each workflow on its declared reader and source-revision route. To reopen and revise either public or protected Studio output, use the separate [local Studio Host](references/studio-protected-host.md) with independently supplied read/source permission. Neither kind is input for the native MCP reader.

Start from the user's natural language and reuse the existing authorization. Establish the intended judgment, scope, explicit materials and new private output directory. Read only named UTF-8 text files or interview through the selected live channel. If verified-local processing is required and the Host cannot attest it, stop before reading; a local executable does not prove where the Agent processes content.

Draft substantive alternatives when exploring options, preserving actual source and license obligations. The Studio exporter requires an explicitly complete method and rejects method absence with `CREATION_METHOD_REQUIRED`; do not invent a method to bypass that restriction. Keep candidate-specific conditions with that candidate rather than merging them into overall conditions.

Obtain actual selection and fresh final adoption of the full current preview. When editorial adoption is expressly delegated to an Agent, record that existing authority and represent the actor as an Agent, never as a human. Keep stdin/stdout private. After any revision, show a fresh preview and obtain fresh adoption.

Deliver the saved bundle only after the CLI saves, reads back, and verifies the bytes. Static reopening keeps `creation_accepted:not_evaluated`, `live_context:unavailable`, `identity:not_verified`, and `action_authorization:not_evaluated`. Saving or reading grants no action authority. Current format2 and its exact graph are required on the Studio route; see [the typed input guide](references/component-creation-draft.md).
