# Extended `kdna.draft/1` Schema & 16-Method Role Reference (`@aikdna/kdna-cli@0.46.0`)

Use this reference when authoring or validating `kdna.draft/1` JSON with `@aikdna/kdna-cli@0.46.0`. All extensions below are **100% optional and backward-compatible** — a minimal 1–15 judgment Tier 1 draft needs only `format`, `asset`, `scope`, `actors`, `highest_question`, `boundaries`, and `judgments[]`.

The compiler owns all synthetic Core IDs, `{term}` / `{state, value}` wrappers, `owner_ref` wiring, bidirectional `boundary_ref` ↔ `exception_refs` links, and dynamic `asset_capability`. Never hand-code raw Core IR envelopes when `kdna.draft/1` expresses the work cleanly.

---

## 1. Top-Level `kdna.draft/1` Fields

| Field | Required | Shape & Compiler Behavior (`0.46.0`) |
| --- | --- | --- |
| `format` | Yes | Exact string `"kdna.draft/1"`. |
| `asset` | Yes | `{ id, type, title, summary, description?, keywords?, language, version, license? }`. `asset.type` must be one of `"domain"`, `"cluster"`, `"tool"`, `"sample"`, `"fixture"`, `"bundle"`. Bump `asset.version` on every revision. |
| `scope` | Yes | Asset-level applicability statement (avoid single-word catch-alls like `"all"`). |
| `actors` | Yes | Non-empty array of `{ id, name, kind? }` (`kind` defaults to `"person"`; valid values: `"person"`, `"organization"`, `"collective"`, `"anonymous"`, `"asset_native"`, `"agent"`). |
| `creator` | Optional | Actor ID string (referencing `actors[]`) OR `{ id?, name, kind?, statement? }`. Defaults to `actors[0]`. Compiler emits **both** `manifest.creator` AND `payload.attributions` (`role: "creator"`), ensuring `KDNA Reader v0.3.4` displays the creator name. When `sources` are present, include a clear `statement` separating the compiler/holder from cited original sources. |
| `highest_question` | Yes | Framing question unifying the asset. |
| `boundaries` | Optional (Recommended) | Asset-level stop-boundary: non-empty string (or `null`). Required whenever asset-level `exceptions` are declared. |
| `exceptions` | Optional | Asset-level conditional carve-outs: `[{ when, statement?, then?: "waive" \| "replace_boundary", replace_boundary? }]`. Requires asset-level `boundaries`. |
| `misuse` | Optional | Asset-level foreseeable misapplications (`string[]`). |
| `worldview` | Optional | Asset-wide framing assumptions (`string[]`) → compiles to `payload.shared_declarations[]` (`kind: "worldview"`, `applies_to: {kind: "asset"}`). |
| `value_order` | Optional | Ordered priority list (`string[]`, highest priority first) → compiles to `payload.shared_declarations[]` (`kind: "value_order"`, `applies_to: {kind: "asset"}`). |
| `sources` | Optional | Cited external works: `[{ id, name?, title?, identity, version?, uri? }]` → compiles to `payload.sources[]`. Referenced per judgment via `source_refs`. |
| `sections` | Optional | Chapter map for Tier 2/3 assets: `[{ id?, number?, title, range?, judgments: string[] }]`. Validates 1-to-1 coverage of all judgment IDs, orders compiled `judgments` / `reading_order` to match section order, and emits `extension:reading-sections` (`definition: "kdna.reading-sections/1"`, `critical: false`). |
| `relationships` | Optional | Inter-judgment edges: `[{ id?, kind: "support" \| "qualify" \| "conflict" \| "complement", from, to, statement }]`. Validates distinct existing judgment IDs and emits Core's exact 4 normative tuples (`support`: supporter→claim, `complement`: supplement→base, `qualify`: qualifier→qualified, `conflict`: side_a↔side_b undirected). |
| `judgments` | Yes | Non-empty array of judgment objects (see §2). |

---

## 2. Per-Judgment `judgments[]` Fields

| Field | Required | Shape & Compiler Behavior (`0.46.0`) |
| --- | --- | --- |
| `id` | Yes | Unique stable identifier (e.g., `"edit:lead-claim"`). |
| `focus` | Yes | Specific, catalog-blind-readable decision question (embed key scope cues; no vague topic labels or unexplained private jargon). |
| `form` | Optional | `"conclusion"` (default) or `"rule"`. Compiler automatically computes `payload.asset_capability` (`asserted_answers`, `result_forming_rules`, or `mixed`). |
| `statement` | Yes | Authored conclusion (with accepted cost) or rule summary (`core_expression.statement`). For `form: "rule"`, Core omits `result` and encodes `formation_rule`. |
| `formation_rule` | Conditional | Required when `form: "rule"`: either a string or `{ statement, conditions?: string[] }`. |
| `answer_kind` | Optional | Defaults to `"preference"`. Valid Core enum values: `"determination"`, `"classification"`, `"evaluation"`, `"status"`, `"diagnosis"`, `"estimate"`, `"prediction"`, `"applicability"`, `"ranking"`, `"selection"`, `"adjustment"`, `"interpretation"`, `"stance"`, `"preference"`, `"guidance"`, `"other"`. Use `"other"` for genuinely undecided in-domain questions. |
| `answer_other` | Conditional | Required **only** when `answer_kind: "other"` (rejected otherwise). Accepts a shorthand string (auto-expanded to `{ name, definition, exclusion_reason }`) or the explicit 3-key object. |
| `applies_when` | Yes | Concrete task, actor, operating phase (`prep`/`review`/`live`), and conditions where this judgment applies. |
| `boundaries` | Recommended | Explicit stop-limit or threshold where this judgment yields or stays silent: non-empty string (or `null`). Required whenever judgment-level `exceptions` are declared. |
| `exceptions` | Optional | Conditional carve-outs: `[{ when, statement?, then?: "waive" \| "replace_boundary", replace_boundary? }]`. Compiler creates `payload.conditions[]` (`interpreted`) with `owner_ref: {kind: "judgment", id}` (for Reader `v0.3.4` compatibility) and wires `boundary_ref` ↔ `exception_refs` bidirectionally. |
| `misuse` | Optional | Foreseeable misapplications for this specific judgment (`string[]`). |
| `method` | Optional | `{ term, roles: { <role>: "<text>" }, other?: { name, definition, exclusion_reason } }`. Pick a term from §4 only when genuinely grounded; leave absent or use `other` when unstated. |
| `reasons` | Optional | Supporting rationale (`string[]`). |
| `source_refs` | Optional | Array of `sources[].id` strings supporting this judgment → compiles to `payload.source_uses[]` (`role: "support"`). |
| `example` | Optional | Concrete illustrative or observed case (`{ summary, context, input, application, result }`). Never present constructed examples as observed outcomes. |

---

## 3. Frozen `KDNA Reader v0.3.4` Compatibility Notes

CLI `0.46.0` targets Core `0.37.11` / Container `0.6.0`. When an asset will also be opened in frozen desktop **`KDNA Reader v0.3.4`**, note these exact rendering behaviors:

| Extended Feature | CLI `0.46.0` (`read --format human` / `review`) | Frozen `KDNA Reader v0.3.4` |
| --- | --- | --- |
| `creator` (`payload.attributions` + `manifest.creator`) | Full display | Clean display in header & File tab (zero banner) |
| `worldview`, `value_order`, `sources`, `source_refs`, `misuse` | Full display | Clean display (zero banner) |
| `relationships` (`support`/`qualify`/`conflict`/`complement`) | Full display + closure delivery | Clean display on judgment cards, Kernel tab, and 3D Helix view |
| `exceptions` (`when` + `waive` / `replace_boundary`) | Full display (`When:` + effect) | Clean display (compiler sets `owner_ref: {kind: "judgment", id}`) |
| `sections` (`extension:reading-sections`, `critical: false`) | Preserved in `reading_order` & review | Clean chapter headers in left Judgments list (3D Atlas uses chunking/`parent_ref`) |
| `form: "rule"` (`formation_rule`) | Full explicit rendering | Shows an incomplete-rendering banner (`当前界面尚未完整呈现`) |
| `answer_kind: "other"` (`answer_other`) | Full explicit open-question rendering | Shows an incomplete-rendering banner (`当前界面尚未完整呈现`) |
| `method: "other"` (or omitted `method`) | Full clean display (`draft.js` compiles omitted `method` to `method.term: "other"` + `method.other`) | Shows an incomplete-mechanism banner (`本题还包含当前界面尚未完整呈现的机制内容。`) |

**Guidance**: Whenever clean zero-banner display in frozen `KDNA Reader v0.3.4` is a priority, default to `form: "conclusion"` with an explicitly grounded named `method` (for example, `feeling` when a Tier 1 taste judgment genuinely reflects personal preference) until Reader's next release. Never fabricate an answer for a truly undecided domain question or invent a method term when the author genuinely has not stated one — surface the Reader display trade-off honestly instead.

---

## 4. Complete 16-Method Role Table (Core `0.37.11`)

Each role inside `method.roles` may appear **at most once** per judgment. If the author gives multiple points for the same role, merge them in order into one concise statement. Do not repeat `statement` verbatim inside a role.

| Method `term` | Required Roles | Optional Roles |
| --- | --- | --- |
| `analogy` | `reference_case`, `correspondence`, `transfer_rule` | `key_differences`, `non_transferable_limits` |
| `calculation` | `inputs_and_meaning`, `formula_or_relation` | `assumptions`, `bounds`, `error_notes` |
| `causal_analysis` | `phenomenon`, `causal_link` | `candidate_causes`, `distinguishing_basis`, `counterfactual_cases` |
| `criteria_comparison` | `criterion`, `comparison_method`, `decision_rule` | `baseline_floor`, `exceptions` |
| `elimination` | `candidate_set`, `elimination_criteria`, `retention_rule` | `special_cases` |
| `evidence_analysis` | `materials_used`, `evidence_link` | `contrary_evidence`, `weighing_rationale` |
| `experience` | `lesson` | `reference_experience`, `applicable_cases`, `exceptions` |
| `feedback` | `target`, `signal`, `adjustment_rule` | `stop_condition`, `conflict_handling` |
| `feeling` | `personal_preference` | `experience_notes`, `preference_shift` |
| `inference` | `premise`, `derivation` | `key_assumptions`, `exceptions` |
| `interpretation` | `subject_interpreted`, `interpretive_link` | `context`, `cues`, `alternative_readings` |
| `observation` | `observed_basis` | `criteria`, `observation_limits` |
| `other` | `method_description`, `basis`, `relation` | `notes`, `limits` |
| `recognition` | `features`, `category_definition`, `matching_rule` | `confusable_cases` |
| `simulation` | `initial_conditions`, `change_assumptions`, `progression` | `branching_scenarios`, `inflection_signals` |
| `tradeoff` | `options`, `factors`, `priority_rule` | `accepted_cost`, `priority_shift` |

**Unstated method rule**: When an author has genuinely never articulated how they formed a taste or conviction, do not guess a method term. Use `term: "other"` with an explicit `other` definition naming the absence (or omit `method` on simple Tier 1 drafts if the compiler allows it, without fabricating rationale).

---

## 5. Non-Blocking `validate-input` Advisories

`kdna validate-input draft.json --format human` reports blocking structural errors (exit non-zero) separately from non-blocking craft advisories (exit `0`, never a numerical score):
- `tautological_statement` / `method_repeats_statement`: `statement` echoes `focus` or `method` echoes `statement`.
- `vague_or_short_focus` / `duplicate_focus`: `focus` lacks enough context for blind `catalog` selection or duplicates another issue.
- `unbounded_judgment` / `overbroad_scope` / `unbounded_absolutism`: missing stop-limit, catch-all scope, or absolute guarantee lacking boundaries/exceptions.
- `isolated_multi_judgment`: 6+ judgments with zero `relationships` (review whether genuine tensions or qualifications were omitted).
- `research_provenance_mismatch`: `sources` present alongside `feeling` method or missing `source_refs`.

---

## 6. Valid `kdna.draft/1` Examples

### Example A — Tier 1 Minimal Taste Draft (Photography Editing)

```json
{
  "format": "kdna.draft/1",
  "asset": {
    "id": "street-photo-taste",
    "type": "domain",
    "title": "Street Photography Editing Taste",
    "summary": "Core light, shadow, and cropping priorities for personal street-photography edits.",
    "language": "en",
    "version": "1.0.0"
  },
  "scope": "Personal documentary street photography edited from RAW captures.",
  "actors": [
    { "id": "author", "name": "Lin Chen", "kind": "person" }
  ],
  "highest_question": "What visual trade-offs define my street-photography edit?",
  "boundaries": "Does not apply to commercial client shoots requiring even exposure across products or faces.",
  "judgments": [
    {
      "id": "light:keep-shadows",
      "focus": "Whether harsh midday street edits preserve deep unrecovered shadows or lift shadow detail for balanced exposure",
      "statement": "Preserve deep unrecovered shadows in harsh midday light to keep graphic tension; accept losing texture in dark clothing.",
      "applies_when": "High-contrast outdoor daylight street frames where light geometry is the primary subject.",
      "boundaries": "Stops applying when the human expression inside the shadow is the frame's sole story.",
      "method": {
        "term": "feeling",
        "roles": {
          "personal_preference": "Prefers stark tonal separation over flat HDR-like visibility in bright sunlight."
        }
      }
    }
  ]
}
```

### Example B — Tier 2/3 Extended System Draft (Editorial Review with Sources, Sections, Relations & Exceptions)

```json
{
  "format": "kdna.draft/1",
  "asset": {
    "id": "editorial-review-system",
    "type": "domain",
    "title": "Analytical Essay Editorial System",
    "summary": "Priorities, evidence guardrails, and stop-boundaries for editing analytical essays.",
    "keywords": ["editing", "essays", "evidence"],
    "language": "en",
    "version": "1.0.0"
  },
  "scope": "Pre-publication editing of non-fiction analytical essays; excludes fiction and breaking news.",
  "actors": [
    { "id": "editor", "name": "Editorial Desk", "kind": "organization" }
  ],
  "creator": {
    "id": "editor",
    "name": "Editorial Desk",
    "kind": "organization",
    "statement": "Compiled and held by Editorial Desk; external style benchmarks are attributed separately in sources."
  },
  "highest_question": "How do we balance sharp analytical clarity against evidence rigor before publishing an essay?",
  "boundaries": "Stops applying to personal memoirs, creative fiction, or legal notices.",
  "worldview": [
    "Readers abandon buried theses faster than they forgive dense opening paragraphs."
  ],
  "value_order": [
    "Factual accuracy and bounded claims over rhetorical punch",
    "Early structural clarity over suspenseful reveal"
  ],
  "sources": [
    {
      "id": "src:house-guide",
      "title": "Internal Fact-Checking Standard",
      "identity": "Editorial Desk House Reference",
      "version": "2026.1"
    }
  ],
  "sections": [
    {
      "id": "sec:structure-and-evidence",
      "number": "1",
      "title": "Opening Clarity and Claim Limits",
      "judgments": ["edit:lead-claim", "edit:bound-metrics"]
    }
  ],
  "relationships": [
    {
      "kind": "qualify",
      "from": "edit:bound-metrics",
      "to": "edit:lead-claim",
      "statement": "Leading with a sharp thesis never permits dropping source scope or sample limits from headline numbers."
    }
  ],
  "judgments": [
    {
      "id": "edit:lead-claim",
      "focus": "Whether analytical essays state the central contested claim in the opening paragraph or build chronologically",
      "statement": "Put the central contested claim in the opening paragraph before unpacking evidence; accept losing narrative suspense.",
      "applies_when": "Pre-publication structural edits of analytical essays over 800 words.",
      "boundaries": "Stops applying when the piece is an investigative profile whose framing depends on reconstructing events in sequence.",
      "exceptions": [
        {
          "when": "A short opening scene under 120 words is required to define an unfamiliar domain problem before stating the claim",
          "then": "replace_boundary",
          "replace_boundary": "State the central claim immediately in paragraph two right after the scene."
        }
      ],
      "misuse": [
        "Do not apply during rough exploratory drafting when the author has not yet discovered their thesis."
      ],
      "source_refs": ["src:house-guide"],
      "method": {
        "term": "tradeoff",
        "roles": {
          "options": "Front-load the core thesis vs. hold the conclusion until the final section.",
          "factors": "Reader orientation speed vs. dramatic tension.",
          "priority_rule": "Orientation speed wins in analytical writing so readers evaluate evidence against a visible claim.",
          "accepted_cost": "Reduces surprise in the closing paragraph."
        }
      }
    },
    {
      "id": "edit:bound-metrics",
      "focus": "Whether cited quantitative claims in analytical essays may omit sample size or date scope for smoother prose",
      "statement": "Attach date range and sample scope to every quantitative claim cited in an analytical essay; cut the number if scope cannot be verified.",
      "applies_when": "Pre-publication fact-check of any essay citing benchmarks, surveys, or financial figures.",
      "boundaries": "Stops applying only to well-established physical constants or mathematical identities.",
      "source_refs": ["src:house-guide"],
      "method": {
        "term": "evidence_analysis",
        "roles": {
          "materials_used": "Historical editorial corrections log and house fact-checking standard.",
          "evidence_link": "Most post-publication retractions traced to stripped denominators or stale dates."
        }
      }
    }
  ]
}
```
