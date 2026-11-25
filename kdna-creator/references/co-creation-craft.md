# Human + Agent Co-Creation Craft Playbook (Native `0.6.0`)

This reference expands the procedural craft behind [`SKILL.md`](../SKILL.md) for turning lived experience, authored works, or compared reference materials into high-signal native `0.6.0` `.kdna` assets using `@aikdna/kdna-cli@0.46.0`. It encodes interaction discipline and anti-distortion safeguards without replacing Core's structural authority or introducing numerical quality scores.

---

## 1. Scope Split, Tier Calibration & 4-Factor Diagnostics

### Expand vs. Isolate a New Asset
Before adding judgments to an existing `.kdna` file, ask whether they govern the **same recurring decision domain**:
- **Expand** when new judgments refine priorities, boundaries, or exceptions inside the same domain and reader expectation.
- **Isolate into a separate `.kdna` asset** when combining unrelated domains would pollute `catalog` selection on ordinary tasks.
- **Elevate live cross-domain collisions**: When two otherwise valid domains collide in practice (for example, personal writing taste vs. legal compliance), do not quietly bury one inside the other — record the arbitration priority as an explicit issue (or dedicated precedence asset).

### Tier Calibration (No Uniform Quality Ruler)
A 4-rule aesthetic preference file and a 60-rule domain system do **not** share one structural ruler:

| Tier | Typical Size & Use | Required Craft Elements | Avoid Over-Engineering |
| --- | --- | --- | --- |
| **Tier 1 — Light / Taste** | 1–15 judgments (personal taste, writing voice, weekly cadence, quick team habits) | Sharp `focus`, non-platitude `statement`, concrete `applies_when`, explicit `boundaries` | Do **not** force `sections`, `relationships`, `worldview`, `value_order`, or fabricated `method` roles. Leave optional arrays empty. |
| **Tier 2 — Domain Playbook** | 10–30 judgments (code review, editorial SOP, hiring rubric, negotiation playbook) | Tier 1 + `creator`, `value_order`, selective `relationships` (`conflict`/`qualify` brakes), `exceptions`, `misuse` | Add edges only where genuine tension or qualification exists; never pad counts to hit round numbers. |
| **Tier 3 — Complex System / Book / Research** | 25+ judgments or multi-source corpus (books, methodologies, literature syntheses) | Tier 2 + `sections`, `worldview`, `sources` + `source_refs`, `.kdna-work/` staging, layered human review | Separate reading chapters (`sections`) from runtime execution steps; preserve undecided questions honestly (`answer_kind: "other"`). |

### Four-Factor Failure Diagnosis
When an Agent produces a poor result using a `.kdna` asset, diagnose which of four distinct factors failed before rewriting the asset:
1. **Distorted saving**: The `.kdna` file omitted a boundary, mangled the author's priority, or flattened provenance.
2. **Retrieval / condition matching**: `focus` or `applies_when` was too vague or jargon-heavy for Step-1 `catalog` selection.
3. **Uncovered trade-off**: The real task exposed a new collision the author had not yet decided.
4. **Agent execution capability**: The right judgments arrived intact, but the model failed to follow them under task complexity.

---

## 2. Three Co-Creation Paths & Distinct Confirmation Contracts

| Path | CLI Scaffold | Discovery Rhythm | Confirmation Contract (CRITICAL) |
| --- | --- | --- | --- |
| **Works (`works`)** | `kdna init --mode works --output draft.json` | Read all user-authorized files first. Extract judgments forward (`Q -> A`) or backward (`rule/conclusion -> Q`), verbatim `reasons`, and concrete `example` cases. Interview **only** on live collisions or missing stop-boundaries. | Confirm **fidelity to the author's current stance** (superseding outdated drafts cleanly via authority hierarchy). |
| **Interview (`interview`)** | `kdna init --mode interview --output draft.json` | Ask **1–2 concrete scenario dilemmas per turn** (*"When X and Y collide under pressure, which wins first and where does that flip?"*). **Anti-nagging**: stop interviewing once priorities and stop-boundaries are clear; never repeat answered questions or hand over blank schemas. | Confirm **concrete slices, priority order, and stop-boundaries** in plain language. |
| **Research (`research`)** | `kdna init --mode research --output draft.json` | Compare external papers/standards (`evidence_analysis`) or synthesize an authorized reference corpus. Separate `creator` (holder/compiler) from original `sources` (`source_refs`). Keep unchosen candidates as `discuss` materials or open `answer_kind: "other"` judgments. | **NEVER ask non-experts to certify domain truth.** Confirm **material scope, route preference, and adoption boundaries** — and state explicitly that cited claims belong to their `sources`, not the holder's lived experience. |

---

## 3. Five Empirical Distillation Lessons (From Real Multi-Draft Corpus Work)

Real-world distillation of complex book-length corpora (including multi-revision editions of *Minimalist Communication* / 《极简沟通》) uncovered five recurring LLM failure modes that prompt platitudes fail to stop:

1. **Source Authority Hierarchy Beats Secondary Summaries**:
   An early 916-row extraction reported "zero substantive deviation" because the Agent checked itself against secondary AI glossaries and summaries that had *already* mutated the author's core concepts (flipping perspective definitions and renaming core terms). Always enforce:
   `live author correction > author-edited primary text > raw draft > secondary summary / AI glossary`.
   Never let a higher draft number or self-declared "locked" banner override an author-edited primary source.
2. **Separate Operating Phases Explicitly ("Flexible Caveat" Does Not Fix a Category Error)**:
   Labeling an offline training/reflection loop as "flexible" still caused downstream Agents to run that loop step-by-step during live real-time conversation. Always declare operating phase explicitly in `applies_when` (e.g., *"Pre-meeting preparation and post-interaction review only"*) and `misuse` (*"Do not run as a live script during real-time conflict"*).
3. **Scoped, Layered Confirmation Prevents Phantom Sign-Off & Quota Padding**:
   An author saying *"the framework looks right"* NEVER confirms verbatim wording, external citations, or symmetric scenario padding (e.g., mechanically generating exactly 15 intimate + 15 family + 15 workplace extensions). Confirm in layers: (a) load-bearing core spine first, (b) live unresolved conflicts second, (c) optional derived extensions clearly tagged and kept out of core unless adopted.
4. **Cross-File Boundary Attribution & Live-Conflict Filtering**:
   Every minor fidelity bug in large multi-file extractions came from silently attaching a stop-boundary from File B under File A's citation, or escalating superseded historical drafts as "conflicts". Always preserve each boundary's exact file anchor, and escalate **only** live mutually exclusive collisions to the author.
5. **Reading Order ≠ Discovery History ≠ Runtime Execution Order**:
   Organizing judgments into narrative `sections` helps human readers navigate a book-scale asset, but Agents readily mistake `reading_order` for a mandatory step-by-step runtime checklist. Keep chapter structure in `sections`, state applicability independently per judgment, and use `form: "rule"` only when an actual conditional procedure is intended.

---

## 4. Multi-Format Ingestion & Conditional `.kdna-work/` Staging

### Multi-Format Ingestion Rules
- Read **only** files explicitly named or authorized by the user.
- For `.docx`, `.pdf`, chat logs, or voice transcripts, extract clean UTF-8 text before distilling.
- On voice/ASR transcripts, repair obvious homophone errors strictly from surrounding context and mark any uncertain repair for author review rather than silently guessing.
- **Zero silent skips**: If any file is encrypted, scanned image-only without OCR, corrupted, or unsupported, list it explicitly in the inventory and ask the user how to handle it.

### Conditional `.kdna-work/` Staging Protocol (`>= 5` files OR `> 30 KB`)
Skip staging completely for small single-file or short interview tasks. When authorized inputs reach **`>= 5` files or `> 30 KB` total text**, create a private sibling `.kdna-work/` folder (never bundled into `.kdna`) and run four deterministic files in order:

1. **`00-inventory.md`**: List every authorized file, byte size, extraction status (`ok` / `partial` / `skipped` + reason), and **Source Authority Rank** (`1 = live author correction`, `2 = author-edited primary`, `3 = raw draft`, `4 = secondary summary`).
2. **`01-raw-claims.jsonl`**: One JSON object per line with upfront provenance tags before clustering:
   `{"claim_id":"c001","source_file":"ch2.md","anchor":"L42-L50","authority_rank":2,"provenance":"direct_author","subject":"...","claim":"...","boundary":"...","phase":"live|prep|review"}`
   Allowed `provenance` values: `direct_author`, `synthesis`, `derived_extension`, `external_source`. Keep boundaries bound to their exact `source_file` + `anchor`.
3. **`02-cluster-and-weave.md`**: Deduplicate overlapping claims by authority rank, flag load-bearing spine judgments, isolate **live** mutually exclusive conflicts (discarding already-superseded draft differences), check blind-readability of each proposed `focus`, and pair prescriptive throttles with their brake (`conflict`/`qualify`) edges.
4. **`03-review-table.md`**: Layered natural-language `Adopt / Revise / Reject` review table grouped into Layer 1 (Load-bearing spine), Layer 2 (Live conflicts & boundaries), and Layer 3 (Optional extensions / open questions).

---

## 5. Distillation & Anti-Distortion Craft Checks

Before presenting the review table, verify every candidate judgment against six checks:

1. **Bidirectional Issue Framing**: Either `Q -> A` (from a recurring decision dilemma) or `conclusion/rule -> Q` (working backward from an existing rule to name the exact decision it settles). Never discard a needed operational rule because its question sounds plain rather than "interesting".
2. **Catalog Blind-Readability (`focus`)**: Read `focus` with all bodies hidden. Would an unfamiliar Agent select this judgment accurately from `catalog` alone? Embed key scope cues in `focus` and replace unexplained internal acronyms or vague topic nouns.
3. **Anti-Platitude & Calibrated Anti-Absolutism**:
   - Reject truisms nobody could disagree with (*"Communicate clearly and empathetically"*). Name what wins, what loses, and what cost is accepted.
   - Ban unverified outcome guarantees (*"Guarantees conflict resolution in 5 minutes"*) and mind-reading (*"They only interrupt because they lack confidence"*).
   - **Keep** sharp operational redlines (*"Never deploy a destructive schema drop without a tested rollback"*) paired with explicit `boundaries` / `exceptions` and observable facts.
4. **Subject Lock & Provenance Separation**: Keep each judgment locked to one clear subject; never blend author convictions, editorial summaries, and external research quotes into one unmarked paragraph.
5. **Throttle-Brake Pairing**: Where a high-leverage rule could be over-applied (e.g., *"Cut meetings aggressively"* or *"Be radically direct"*), check whether a real counterweight/stop-boundary exists and wire it via `qualify` or `conflict` (for Tier 2/3 assets) or explicit `boundaries`/`misuse`. Do not invent artificial counter-rules for simple Tier 1 taste preferences.
6. **Honest Method & Unique Roles**: Use a formation `method` only when genuinely backed by the material (see [draft-schema-and-methods.md](draft-schema-and-methods.md)); if unstated, use `other`. Never repeat `statement` verbatim inside a method role; merge multiple points sharing one role in order.

---

## 6. Cross-Domain Examples (Beyond Software Engineering)

Avoid defaulting to software-engineering jargon when the author's domain is taste, writing, life, or research:

- **Aesthetic Taste / Photography Curation (Tier 1, 5 judgments)**:
  - `focus`: *"Whether street-photography edits preserve harsh midday shadow contrast or recover shadow detail for balanced exposure"*
  - `statement`: *"Preserve deep unrecovered shadows in harsh midday light to keep graphic tension; accept losing texture in dark clothing."*
  - `method`: `feeling` (`personal_preference`) or `criteria_comparison` — zero `sections` or `relationships` required.
- **Editorial / Long-Form Writing (Tier 1–2, 12 judgments)**:
  - `focus`: *"Whether analytical essays open with the central claim or build chronologically toward a final reveal"*
  - `statement`: *"State the contested claim within the opening paragraph before unpacking evidence; accept sacrificing suspense for reader orientation."*
  - `boundaries`: *"Personal narrative memoirs or fiction where dramatic pacing is the primary goal."*
- **Family & Life Decisions (Tier 1–2, 8 judgments)**:
  - `focus`: *"How our household splits discretionary weekend time between scheduled family commitments and unscheduled recovery"*
  - Uses `experience`, an explicit `exceptions` carve-out (`when`: *"Out-of-town relatives visit for under 72 hours"*, `then`: `"waive"`), and keeps an unresolved question (e.g., school choice criteria) honestly marked `answer_kind: "other"`.
- **Domain Research Synthesis (Tier 2–3, 20 judgments)**:
  - `creator`: `{ "id": "compiler", "name": "Caregiver Research Notes", "kind": "person", "statement": "Compiled from cited clinical guidelines; not original medical advice." }`
  - `sources`: named published guidelines with `version` and `uri`, cited via `source_refs`; `method`: `evidence_analysis` with `contrary_evidence`; strong `misuse` warning prohibiting clinical diagnosis.
- **Production Operations Governance (Tier 2–3, 18 judgments)**:
  - Combines `sections`, `value_order`, `tradeoff` rules, and a `conflict`/`qualify` throttle-brake edge pairing *"Require two-step reversible migrations"* with *"Active Sev-1 outage mitigation override"*.

---

## 7. Scoped Layered Review & Honest 2-Tier Verification

### Layered Review Table (`Adopt / Revise / Reject`)
Present judgments in natural language — never dump raw JSON for human approval:

| Layer | ID | Question (`focus`) | Stance & Accepted Cost | Applies When / Stops When | Provenance | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Spine | `edit:lead-claim` | Open analytical essays with claim or chronological build-up? | State the claim in paragraph 1; accepts losing suspense. | Analytical essays / Stops on narrative memoir or fiction. | `direct_author` (`notes.md:L14`) | **Adopt / Revise / Reject** |

After `create --draft`, run `kdna review <file.kdna> --allow-read` so the author inspects one clean plain-prose proof sheet covering all boundaries, conditional exceptions, misuse warnings, and relations.

### Honest 2-Tier Verification (Never Fake Blindness)
Running `read --mode catalog` → picking IDs → `exact_selection` inside the **same conversation that just authored `draft.json`** is **contaminated by live context** and must NEVER be called a "blind test" or "zero-leakage test":

- **Tier 1 — Deterministic Closure & Brake Smoke Check (all Hosts; label as smoke check / non-blind walkthrough)**:
  1. Ask the human for 1 real task + 1 edge/counter-case.
  2. Run `kdna read <file.kdna> --mode exact_selection --judgment-id <primary_throttle_id> --format human --allow-read`.
  3. Inspect CLI stdout deterministically: confirm that the expected `boundaries`, conditional `exceptions` (including trigger `When:` and `replace_limit`/`waive`), `misuse`, and paired brake judgments (`conflict`/`qualify`) actually appeared in the returned closure.
- **Tier 2 — True Fresh-Context Blind Test (ONLY when the Host supports isolated zero-history subagents)**:
  1. Subagent A (zero prior history) receives strictly `catalog` stdout + the user's real case → emits selected IDs only.
  2. CLI runs `exact_selection` on strictly those emitted IDs.
  3. Subagent B (or clean turn seeing strictly `exact_selection` stdout + user case, zero draft history) produces the task answer.
  If your Host cannot isolate conversation context (single-thread chats), run Tier 1 and report it honestly as a non-blind walkthrough.
