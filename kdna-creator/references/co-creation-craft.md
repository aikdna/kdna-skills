# Human + Agent Co-Creation Craft Playbook (Native `0.6.0` Assets)

This reference defines the five-stage co-creation workflow for turning lived human expertise, authored works, or compared research into high-signal native `0.6.0` `.kdna` judgment assets using `@aikdna/kdna-cli@0.45.2` (or the Host-selected local CLI checkout). It adds editorial craft and interaction discipline without weakening Core's structural authority or introducing numerical quality scores.

---

## Stage 0: Clarify the Judgment Core

Before scaffolding anything, align with the author on what makes their judgment worth preserving:

- **Focus on real trade-offs and boundaries**: Whenever the user wants to capture their decision criteria, taste, or stop-limits (even a small, focused set of judgments), help them articulate *when a rule applies*, *what it prioritizes*, and *where it stops*.
- **Quality over count**: One strong judgment with clear boundaries is better than twenty padded truisms. Never manufacture extra judgments to make an asset look comprehensive.

---

## Stage 1: Choose One of the Three Co-Creation Entry Modes

Match the starting scaffold and conversation style to what the human actually brings:

| Mode | CLI Scaffold | When to Use | How the Agent Conducts Discovery |
| --- | --- | --- | --- |
| **A. Socratic Interview** | `kdna init --mode interview --output draft.json` | The author holds tacit rules in their head and has few or no written documents yet. | Ask **1–2 concrete scenario dilemmas per turn** (*"When X and Y collide under deadline pressure, which wins first, and at what exact threshold does that flip?"*). Never hand the human a blank schema or ask for protocol IDs, hashes, or role tables. |
| **B. Works + Targeted Interview** | `kdna init --mode works --output draft.json` | The author supplies essays, postmortems, design docs, review comments, or memos (for example, authoring a work like *《KDNA白皮书》* `1.0.2`). | Read only the explicitly authorized files. Extract judgments that need to be preserved (working either from explicit questions or backward from existing conclusions, rules, processes, and methods to surface the question each answers), verbatim rationale (`reasons`), and concrete cases (`example`). Interview **only** on genuine gaps: unresolved collisions between two pieces, implicit scope limits, or missing stop-boundaries. |
| **C. Research & Reference Synthesis** | `kdna init --mode research --output draft.json` | The user asks the Agent to compare external standards/papers for a human choice, or delegates synthesis of a trusted reference-material corpus into a holder-reviewed domain work. | Present structured options with supporting and contrary evidence (`evidence_analysis`) or synthesize the authorized reference corpus with explicit source attribution (never disguising reference synthesis as personal lived experience). Require explicit human review and adoption before saving, and keep unchosen candidates as `discuss` materials or undecided `answer_kind: "other"` items. |

For a minimal single-preference scratchpad, `kdna init --output draft.json` (`--mode minimal`) remains available.

---

## Stage 2: Question Distillation, Anti-Platitude & Three-Tier Boundary Craft

Every candidate judgment must pass four structural craft checks before human review:

1. **Contested Question (`focus`)**:
   - Write `focus` as the specific recurring decision question where reasonable practitioners could choose differently (e.g., *"Whether routine weekly engineering updates lead with completed outcomes or chronological activity"*), not a vague noun label (*"Team communication"*).
   - Two judgments must not ask the exact same `focus` question unless scoped to distinct non-overlapping contexts.

2. **Anti-Platitude Conclusion (`statement` / `core_expression.statement`)**:
   - **Test**: Could a competent practitioner reasonably choose the opposite rule in another valid context? If nobody could ever disagree (*"Write clear, maintainable code and test thoroughly"*), it is a platitude, not a judgment.
   - Rewrite platitudes into operational priorities that name what wins, what loses, and what cost is accepted. Never copy `focus` verbatim into `statement`.

3. **Honest Formation Method & Unique Role Components**:
   - Choose a method term (`tradeoff`, `criteria_comparison`, `observation`, `experience`, `evidence_analysis`, `inference`, `feeling`, or `other`) **only** when the author's reasoning genuinely matches that formation structure.
   - Do not repeat `statement` verbatim inside a method role; explain *how* the conclusion was reached.
   - **Unique role rule**: In full `0.6.0` input, each role in `method.components` may appear **at most once** per judgment. When an author states two points for the same role (for example, two accepted downsides under `不可兼得之处`), merge them in order into a single component statement so zero authored nuance is lost.

4. **Three-Tier Scope & Stop-Boundary Craft**:
   - **`applies_when` (`scope.statement`)**: Name the concrete task, actor, and operating conditions. Avoid single-word catch-alls (`"all"`, `"always"`, `"通用"`, `"所有场景"`).
   - **`boundaries`**: Name the explicit stop-edge or threshold where this judgment yields, reverses, or stays silent (e.g., *"Stops applying once an incident is declared; switch to incident timeline protocol"*).
   - **`exceptions` / `misuse` / `relationships` (full `0.6.0` input only — never in `kdna.draft/1`)**: Do **not** place `exceptions`, `misuse`, or `relationships` inside `draft.json` (`kdna.draft/1` rejects them with `unknown_field`). When adding explicit carve-outs (`exceptions`), foreseeable misapplications (`misuse`), or inter-judgment `relationships`, run `kdna compile draft.json --output authored.json` into full `0.6.0` input first.

---

## Stage 3: Three-Choice Human Review Table & Honest Provenance

Never dump raw JSON onto a human author as the primary review step. Present a concise review table in natural language and ask for an explicit per-judgment disposition:

| Judgment ID | Contested Question (`focus`) | Proposed Conclusion & Accepted Tradeoff | Applies When | Stops Applying (`boundaries`) | Author Disposition |
| --- | --- | --- | --- | --- | --- |
| `update:order` | Lead with outcomes vs chronological log? | Lead with completed outcomes, blockers second, next steps third; accepts losing narrative backstory. | Routine async weekly engineering updates. | Active incidents or postmortem timelines. | **Adopt / Revise / Reject** |

Provenance rules during review:
- **Adopt**: Record as the author's judgment with the confirmed scope and boundaries.
- **Revise**: Update wording, scope, method, or boundaries to match the author's correction, then re-confirm affected relations (`support`, `conflict`, `qualify`, `complement`, `value_order`).
- **Reject / Still Undecided**: Remove rejected Agent suggestions cleanly. If the question itself belongs inside the author's domain but the author has deliberately not yet decided, preserve it honestly in full `0.6.0` input with `answer_kind: "other"` rather than fabricating a conclusion or silently erasing the open question.

---

## Stage 4: Validate, Compile, Cold-Reopen, Diff & Local Protection

Once the author confirms the review table:

1. **Validate input & inspect craft advisories**:
   ```sh
   "$KDNA_NODE" "$KDNA_CLI" validate-input draft.json --format human
   ```
   - Fix every blocking diagnostic (`missing_field`, `unknown_field`, `placeholder_not_replaced`, `duplicate_method_roles`, `invalid_method_roles`, `missing_method_roles`).
   - Review any non-blocking structural advisories (`tautological_statement`, `method_repeats_statement`, `unbounded_judgment`, `overbroad_scope`, `duplicate_focus`, `uniform_default_method`). Advisories keep exit status `0` and never compute a numerical score, but each flags a concrete risk of downstream Agent misapplication.

2. **Compile and create without overwriting prior files**:
   ```sh
   "$KDNA_NODE" "$KDNA_CLI" create --draft draft.json --output first.kdna --allow-create
   ```
   (Or run `compile draft.json --output authored.json` when adding full `0.6.0` relationships, shared declarations, exceptions, misuse, or attachments before `create authored.json --output first.kdna --allow-create`.)

3. **Cold-reopen, verify & export a one-page author review sheet**:
   ```sh
   "$KDNA_NODE" "$KDNA_CLI" inspect first.kdna --format human
   "$KDNA_NODE" "$KDNA_CLI" validate first.kdna --system --format human
   "$KDNA_NODE" "$KDNA_CLI" read first.kdna --mode catalog --allow-read --format human
   "$KDNA_NODE" "$KDNA_CLI" review first.kdna --allow-read --output first-review.md
   ```
   Hand the one-page review sheet to the author (or present it inline) so they can inspect every judgment's claim, method, reasons, boundaries, conditional exceptions, misuse warnings, and related judgments without reading raw JSON.

4. **Plain-language revision loop (Agent handles hashes, full-source preservation & ripple check)**:
   When the author asks in plain language to revise an existing `.kdna` file, never ask them to calculate SHA-256 hashes or hand-edit nested JSON. The Agent runs the full loop behind the scenes:
   1. Compute the original file's SHA-256 (`expected-a`) and extract complete source via `source-open <first.kdna> --expected-a sha256:<hash> --allow-source --output edits.json`.
   2. Apply only the confirmed edits inside `edits.json`, preserving all existing `reasons`, `conditions`, `exceptions`, `misuse`, `relationships`, `sources`, `materials`, and `history` entries, bumping `manifest.version` / `payload.asset.asset_version` (and `judgment_version`), and appending an honest revision entry.
   3. Pack to a new sibling file via `source-pack <first.kdna> --edits edits.json --expected-a sha256:<hash> --output revised.kdna --allow-source` (never overwriting `first.kdna`), and validate `--system`.
   4. Present the clean author-facing delta — **before vs. after substantive changes plus every affected downstream related judgment** — using:
      ```sh
      "$KDNA_NODE" "$KDNA_CLI" diff first.kdna revised.kdna --format human
      ```
      (Pass `--verbose` or `--format json` only when inspecting low-level IR wiring or component IDs.) Obtain fresh author confirmation before switching active files.
   - When the author wants offline local confidentiality (no account, no cloud upload), offer `protect` by piping the passphrase via `--password-file /dev/stdin` (or an inherited file descriptor `--password-fd <n>`, `n >= 3`) so no plaintext password file is written to disk — never command-line text — and always retain the unencrypted authoring draft (`draft.json` / `authored.json`) and plaintext `.kdna` source file (`first.kdna`) for future revisions (`source-open` / `source-pack` or `create --draft` operate on plaintext source rather than encrypted `.kdna` envelopes):
     ```sh
     # Pipe passphrase from a password manager or silent prompt (`IFS= read -rs KDNA_PASS`) — no plaintext file on disk
     printf '%s' "$KDNA_PASS" | "$KDNA_NODE" "$KDNA_CLI" protect first.kdna --output locked.kdna --password-file /dev/stdin
     ```

---

## Reference `kdna.draft/1` Example (Rich Domain Draft)

```json
{
  "format": "kdna.draft/1",
  "asset": {
    "id": "engineering-review",
    "type": "domain",
    "title": "Engineering Change Review Judgments",
    "summary": "Recurring priorities and stop-boundaries for reviewing production service changes.",
    "description": "Distilled from team postmortems and review notes for backend service pull requests.",
    "keywords": ["code-review", "reliability", "rollback"],
    "language": "en",
    "version": "1.0.0",
    "license": {
      "identifier": "CC-BY-4.0",
      "uri": "https://creativecommons.org/licenses/by/4.0/"
    }
  },
  "scope": "Routine backend service pull requests; emergency hotfixes during active outages follow incident command rules instead.",
  "actors": [
    { "id": "lead", "name": "Service Architecture Team", "kind": "organization" }
  ],
  "highest_question": "What must be verified first before approving a backend service change?",
  "boundaries": "Does not authorize deployment or override security vulnerability blocks.",
  "judgments": [
    {
      "id": "review:rollback-before-elegance",
      "focus": "Whether rollback safety or internal abstraction elegance takes priority when reviewing a stateful change",
      "statement": "Require a verified rollback path before debating internal code elegance on any change touching persistent state.",
      "applies_when": "Pull requests that alter database schemas, queue formats, or persistent state migrations.",
      "boundaries": "Purely stateless refactors with byte-identical wire and storage behavior.",
      "method": {
        "term": "tradeoff",
        "roles": {
          "options": "Gate approval on rollback reversibility first versus gate approval on clean internal refactoring in the same change.",
          "factors": "Blast-radius containment speed during partial deploy failure versus short-term code duplication.",
          "priority_rule": "Reversibility under production failure outweighs temporary adapter duplication during a two-step migration.",
          "accepted_cost": "Accepts carrying temporary dual-read compatibility code across one release cycle."
        }
      },
      "reasons": [
        "Irreversible schema deploys turned minor logic bugs into multi-hour outages in prior releases."
      ],
      "example": {
        "summary": "Order-status column rename review",
        "context": "Backend service running rolling deployments across four replicas.",
        "input": "Single pull request dropping the old column and deploying new reader code simultaneously.",
        "application": "Blocked single-step drop; split into expand-and-dual-write release followed by cleanup.",
        "result": "Canary rollback succeeded in under two minutes when an upstream consumer sent the legacy field."
      }
    }
  ]
}
```
