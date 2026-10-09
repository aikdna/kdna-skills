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
| Shared declarations | shared_declarations kind/subject/applies_to/value | Preserve a real shared statement or leave the domain empty with a reason; do not invent a stance. |
| Questions and formation | judgments; conditions; reasons; contracts; focus, core_expression, result or formation_rule, method and necessary references | Deliver each actual answer or formation method and referenced body, without truncating another field into a fabricated overview. |
| Scope and limits | Payload/Judgment scope; declarations.boundaries; local boundaries, exceptions and misuse | Work-wide and local responsibilities remain distinct; unknown is not none and an unevaluated exception is not active. |
| Organization and dependencies | relationships, dependencies, parent_ref, reading_order | Express real relations and requirements. Navigation does not replace common content or an execution plan. |
| Examples and results | examples context/input/adopted_judgments/application/results | Explain a concrete use. Preserve illustrative/observed and expected/observed/disposition/partial identity; never invent an observation. |
| Sources and file history | sources/source_uses; actors/attributions; Manifest identity/time/rights/lineage/history | Attribute each source's actual use. Record only real changes and authorized rights; creation identity is not human confirmation. |

Read the current contract supplied with the selected installation for exact
types and references. These are content responsibilities, not additional Schema
requirements. Check the complete readable work and its field relationships
independently. If necessary content is unfinished, deliver an explicit draft,
not a finished benchmark. A well-formed record can still describe poor content.

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
