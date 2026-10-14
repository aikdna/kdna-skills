# Native asset authoring and content review

Use this route when the Host has explicitly supplied a matching native CLI,
Core and Read installation with `create`, `source-open` and `source-pack`.
Select it by exact archive and installation receipts. Same package versions do
not establish same bytes. This reference neither installs packages nor grants
permission to read materials, use providers, adopt content or publish.

Start from the intended reader, task, authorized materials and actual questions.
A short, self-contained judgment may need little shared material. A larger work
may need common concepts, foundations and limits. An empty input may require an
interview; do not manufacture judgments to meet a count. There is no file-count,
field-count or text-length quality score.

Organize the work before encoding it. Identify concepts whose confusion would
change the answer, assumptions genuinely shared by the relevant questions, and
limits that apply to the work as a whole. Preserve local assumptions and limits
at their original scope. Do not collect every local premise into a global
foundation. Use a worldview, value order, role, exception or attachment only
when it expresses actual content. Source facts, author synthesis, constructed
examples, expected outcomes and observed outcomes stay distinguishable.

## Inventory and declared review

Run the bundled helper against the explicit authored input. Its only inputs
are named JSON files; it does not scan directories, call a model or modify an
asset. Keep its output private when the author input is private.

```sh
"$KDNA_NODE" SKILL_ROOT/scripts/native-asset-review.mjs authored.json > inventory.json
```

Set `KDNA_NODE` to the Host-selected Node executable and replace `SKILL_ROOT`
with this Skill's actual directory. The inventory includes
authored values, exact field pointers, kinds, scopes and references. It preserves
absent fields, empty arrays and Declared states separately. Conditions, reasons
and auxiliary contracts retain their full authored bodies. Fields outside the
named domains remain visible under `unassigned_authored_fields`, without an
invented interpretation. The review template
is under `review.template`; save and complete that object as `author-review.json`.
Set the intended purpose, actual reviewer kind/name and task-required domains.
For each domain, state provided, none, not_applicable, unknown or incomplete,
with a reason, real JSON-pointer evidence and any remaining action. A domain
that is needed for this task belongs in `required_domains`; optional empty
domains may correctly be none or not_applicable with a reason.

```sh
"$KDNA_NODE" SKILL_ROOT/scripts/native-asset-review.mjs authored.json \
  --review author-review.json > reviewed-inventory.json
```

The helper binds the record to the input's full SHA256. A stale record, unresolved
required domain or missing evidence returns exit 2 with specific problems.
Evidence for provided content must identify nonempty authored content in that
domain; a title cannot stand in for an absent example. It
does not decide whether natural-language definitions, methods or sources are
good. `declared_review_record_complete` describes the record, and is never
content quality, Schema admission, human confirmation or Reader acceptance.
Core remains the official structure and semantic authority. Do not write this
author-side report into Payload or add private paths to a public asset.

Review these actual responsibilities:

| Content | Native authoring fields | Editorial check |
| --- | --- | --- |
| Purpose and common question | Manifest title/summary; declarations.highest_question; kernel.purpose | The common question frames the work; one sentence cannot substitute for necessary shared knowledge. |
| Common foundations and concepts | kernel.foundation_refs; materials of kind foundation/premise/definition | Explain needed concepts and distinctions, actual sources and precise applies_to. A kernel reference does not widen scope. |
| Shared declarations | shared_declarations kind/subject/applies_to/value | Preserve a real shared statement or leave the domain empty with a reason; do not invent a stance. When the author's words already order values, the question above is how that ordering gets recorded. |
| Questions and formation | judgments; conditions; reasons; contracts; focus, core_expression, result or formation_rule, method and necessary references | Deliver each actual answer or formation method and referenced body, without truncating another field into a fabricated overview. |
| Scope and limits | Payload/Judgment scope; declarations.boundaries; local boundaries, exceptions and misuse | Work-wide and local responsibilities remain distinct; unknown is not none and an unevaluated exception is not active. |
| Organization and dependencies | relationships, dependencies, parent_ref, reading_order | Express real relations and requirements. Navigation does not replace common content or an execution plan. The relation signals worth asking about are in the section above. |
| Examples and results | examples context/input/adopted_judgments/application/results | Explain a concrete use. Preserve illustrative/observed and expected/observed/disposition/partial identity; never invent an observation. |
| Sources and file history | sources/source_uses; actors/attributions; Manifest identity/time/rights/lineage/history | Attribute each source's actual use. Record only real changes and authorized rights; creation identity is not human confirmation. |

Read the current contract supplied with the selected installation for exact
types and references. These are content responsibilities, not additional Schema
requirements. Check the complete readable work and its field relationships
independently. If necessary content is unfinished, deliver an explicit draft,
not a finished benchmark. A well-formed record can still describe poor content.

## When the author's words carry a relation

The payload carries the relations the interview actually produced, in the
author's own words. An author's phrasing often already signals that a real
relation or an ordered value exists. Ask about the signal and record the
answer; a signal you noticed and never raised is a dropped relation, not a
smaller one. Do not fill the shape without the answer.

| Signal in the author's words | Ask | Record as |
| --- | --- | --- |
| "how I read this kind of case", "the way I work is…" | Does that stance hold across the whole work rather than inside one judgment? | A `worldview` shared declaration: the stance in `subject.statement`, the author's stated items in `value`, scoped by `applies_to`. |
| "one standard", "the same rule for all of them" | Does the statement cover only the named cases or all of them? Does the author say one claim backs another? | The scoped `subject`/`applies_to` of the statement; a `support` relation when the author says one claim backs another. |
| "these two don't fight", "they go together" | Which statement completes the other, and what does each side add? | A `complement` relation between the two judgments. |
| "when they disagree I follow X", "X comes first" | Which two statements disagree, and which one wins in the author's practice? | A `conflict` relation between the two judgments, and the winning order in a `value_order` shared declaration. |
| "the only exception is…" | Does the exception change when the statement applies, or does it loosen the statement itself? | A `qualify` relation; an exception or boundary at its own scope when the author limits the work itself. |
| "this doesn't cover…", "I don't deal with…" | Is that outside the work entirely, or a limit on how far this content currently goes? | `declarations.boundaries` — `exclude` or `out_of_domain` for what the work does not claim, `limit` for the edge of what it currently asserts. |

The interview can end with fewer relations than it produced signals: an answer
of "it is the same thing, just worded twice" narrows scope instead of adding a
relation, and a boundary the author confirms belongs in its native slot even
when no relation is authored. Record what the answer actually was.

The current contract fixes the shape: each `relationships[]` entry carries
exactly `id`, `kind`, `direction`, two `participants`, `operator`, `effect` and
`statement`, and the four normative tuples are `support` (supporter → claim),
`complement` (supplement → base), `qualify` (qualifier → qualified) and
`conflict` (side_a ↔ side_b, undirected). Read the contract supplied with the
selected installation for the exact terms. The `statement` stays the relation
in the author's words.

A recorded answer is not a forced relation. The rule below still holds: when
the material produces no relation, the arrays stay empty.

## When the author has not stated something

These authoring situations have an honest encoding even though the payload
cannot label them directly. None of them authorizes fabrication, and none of
them is a reason to drop real content.

- **The author has not stated how a judgment was formed.** Do not pick a
  method term on the author's behalf; ask first. When the answer really is
  "I have never thought about it", the honest encoding is
  `method.method.term: "other"` with the required `other` definition naming
  the absence, and the term's mandated role components kept as explicit
  not-stated statements; record the domain as incomplete or unknown in the
  author review record with a remaining action. A term chosen by the encoder
  passes admission silently and reads back exactly like a stated method, so
  this is the one substitution nothing downstream can detect.
- **A question inside the author's own domain is still undecided.** Keep it
  as a judgment with `answer_kind: "other"` and an `answer_other` definition
  saying the author has not decided, and keep it in `reading_order` and the
  review record. Do not convert it to `out_of_domain` or `none` and do not
  delete it; either rewrite silently removes the open question from the work
  while admission stays green.
- **The author's words, an Agent inference, a suggestion and commissioned
  research coexist.** Each has its own place: the author's statement is the
  judgment with an authored core expression; an inference is a judgment whose
  method is `inference` with its premise and derivation components, material
  references and reasons; a suggestion stays a material under `content_uses`
  (role `discuss`) until the author adopts it; commissioned research is a
  `source` with its `source_uses` role. None of the three non-author items is
  presented as the author's adopted answer, and none is deleted. The payload
  has no structural field for adoption state today, so the distinction lives
  in the component and statement text and in the author review record; report
  that as a gap instead of blurring it.
- **Do not force non-empty relationships.** `relationships`, `reasons` and
  every other optional collection stay empty when the content does not
  produce them. A larger graph is not a better work. Asking the questions
  above first is what keeps an authored relation honest.

The complete required and optional role set for every method term is listed
in the CLI authoring field reference (section 6), generated from the installed
contract; read it before authoring a method instead of discovering it through
rejections. The Studio export route separately rejects a method-absent
proposal, so a stated absence belongs on this native route; never invent a
method to satisfy the exporter. When the current contract cannot carry
something at all, keep the draft and the review record's remaining action
rather than filling a field with invented content.

## Read the whole diagnostic

The native CLI already returns JSON with the original failure details. Do not
present only a short top-level status. Identify the failing layer and keep its
complete result available to the authorized task:

| Result shape | Fields to show |
| --- | --- |
| CLI argument or authored-input rejection | Top-level `status` and `code`; when supplied, `diagnostic.field`, `diagnostic.reason` and `diagnostic.expected` |
| `core_rejected` | Top-level `status` and `stage`, `core.reason`, and every item in `core.diagnostics`, including its `code`, `stage`, `severity`, `subject` and `field` |
| Source-route failure carrying `diagnostic` | The original `diagnostic.code` and `diagnostic.stage`, plus any other fields actually present |

For example, `members: null` produces `KDNA_AUTHORED_INPUT_INVALID` with
`diagnostic.field` equal to `/members`. An empty first judgment `focus` produces
`core_rejected` with `core.reason: READ_CORE_INVALID` and
`core.diagnostics[0].field: /payload/judgments/0/focus`. The latter field is nested;
its absence at the top level does not mean Core omitted the location.

Read the complete diagnostics array, not just its first element. Preserve an
absent field and an explicit `null` subject as different reported states; do not
invent a pointer or subject from nearby text. Show exact codes and pointers
alongside an ordinary-language explanation, retain nested reference details and
the original causal result, and correct the actual authored input. A translated
summary does not replace the diagnostic. A Core `READ_CORE_INVALID` carries
exact coordinates but no explanatory sentence; resolve the pointer against the
contract — for a method-role rejection, against the field reference's role
table — before paraphrasing it, and never adjust the input to silence a
pointer you have not understood. Do not retry a refused operation by changing
formats, dropping required content or bypassing the official CLI.

## Save, read, revise

Use the exact authorized installed CLI entry, represented below by `KDNA_CLI`.
It is an explicit JavaScript CLI entry, invoked with the same Host-selected
`KDNA_NODE`; neither path is an automatically discovered binary.

```sh
"$KDNA_NODE" "$KDNA_CLI" create authored.json --output first.kdna --allow-create
"$KDNA_NODE" "$KDNA_CLI" source-open first.kdna --expected-a sha256:ACTUAL_FILE_SHA256 --allow-source
```

Keep the author input and saved bytes. In a fresh process, compare the complete
Source payload with the complete author payload, preserving types, property
presence, order and values. Compare every original Manifest key/value and
classify only the contract's actual additions. Compare attachment bytes when
present. A save result or equal counts cannot replace this comparison.

Read the same version through official whole_asset, the needed question
selections and actual returned asset handles in that session. Check discovered
indices and deferred common materials, boundaries, sources, examples and
revisions. Deferred, denied, over-budget and unsupported are not absence.
Close and reopen the saved original in a new process. Do not use author JSON
as a substitute for the runtime's supplied body or rebuild a handle from JSON.

Make a real content revision on the same materials, such as clarifying an
example's unit, denominator or observation window. Check affected definitions,
questions, conditions and results together. Preserve the old version and record
what actually changed, why and which targets it affects. For an official Source
revision, use exactly the returned/editable Manifest and Payload transport:

```sh
"$KDNA_NODE" "$KDNA_CLI" source-pack first.kdna --edits revised-edits.json \
  --expected-a sha256:ACTUAL_FIRST_FILE_SHA256 --output revised.kdna --allow-source
```

Never replace the original, fake a revision history or silently change the
selected contract. Recheck the new version's full Source equality and affected
official reads. Record content review, no-loss saving, runtime supply, Reader
observation and actual human/task outcomes separately. Fixtures for unusual
field branches are engineering inputs with explicit expected results; they do
not establish a normal work's quality or actual business observations.
