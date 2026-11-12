# Human + Agent Co-Creation Craft Playbook (Native `0.6.0` Assets)

This reference defines the five-stage co-creation workflow for turning lived human expertise, authored works, or compared research into high-signal native `0.6.0` `.kdna` judgment assets using `@aikdna/kdna-cli@0.43.4` (or the Host-selected local CLI checkout). It adds editorial craft and interaction discipline without weakening Core's structural authority or introducing numerical quality scores.

---

## Stage 0: Restraint Gate — When NOT to Create a `.kdna` Asset

Before scaffolding anything, verify that the user actually needs a reusable judgment system:

- **Keep plain Markdown, docs, or code** when the material is a one-off factual lookup, a chronological meeting log, deterministic code/configuration, credentials, or static reference tables with no recurring judgment calls.
- **Create a `.kdna` asset** only when there are recurring, contested decisions where goals collide, context boundaries matter, and an Agent or teammate needs explicit applicability and stop-limits during future tasks.
- One strong judgment with clear boundaries is better than twenty padded truisms. Never manufacture extra judgments to make an asset look comprehensive.

---

## Stage 1: Choose One of the Three Co-Creation Entry Modes

Match the starting scaffold and conversation style to what the human actually brings:

| Mode | CLI Scaffold | When to Use | How the Agent Conducts Discovery |
| --- | --- | --- | --- |
| **A. Socratic Interview** | `kdna init --mode interview --output draft.json` | The author holds tacit rules in their head and has few or no written documents yet. | Ask **1–2 concrete scenario dilemmas per turn** (*"When X and Y collide under deadline pressure, which wins first, and at what exact threshold does that flip?"*). Never hand the human a blank schema or ask for protocol IDs, hashes, or role tables. |
| **B. Works + Targeted Interview** | `kdna init --mode works --output draft.json` | The author supplies essays, postmortems, design docs, review comments, or memos (for example, authoring a work like *《KDNA白皮书》* `1.0.1`). | Read only the explicitly authorized files. Extract judgments that need to be preserved (working either from explicit questions or backward from existing conclusions, rules, processes, and methods to surface the question each answers), verbatim rationale (`reasons`), and concrete cases (`example`). Interview **only** on genuine gaps: unresolved collisions between two pieces, implicit scope limits, or missing stop-boundaries. |
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

3. **Cold-reopen & verify in a separate invocation**:
   ```sh
   "$KDNA_NODE" "$KDNA_CLI" inspect first.kdna --format human
   "$KDNA_NODE" "$KDNA_CLI" validate first.kdna --system --format human
   "$KDNA_NODE" "$KDNA_CLI" read first.kdna --mode catalog --allow-read --format human
   ```

4. **Compare revisions & offer local password protection**:
   - On any subsequent revision (`revised.kdna`), keep `first.kdna` intact and verify the exact delta:
     ```sh
     "$KDNA_NODE" "$KDNA_CLI" diff first.kdna revised.kdna --format human
     ```
   - When the author wants offline local confidentiality (no account, no cloud upload), offer `protect` using a private mode-`0600` password file or file descriptor (`>= 3`), never command-line text:
     ```sh
     "$KDNA_NODE" "$KDNA_CLI" protect first.kdna --output locked.kdna --password-file ./passphrase.txt
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
          "候选方案": "Gate approval on rollback reversibility first versus gate approval on clean internal refactoring in the same change.",
          "比较因素": "Blast-radius containment speed during partial deploy failure versus short-term code duplication.",
          "取舍原则": "Reversibility under production failure outweighs temporary adapter duplication during a two-step migration.",
          "不可兼得之处": "Accepts carrying temporary dual-read compatibility code across one release cycle."
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
