# Native Raw `{manifest, payload, members}` Authoring & Diagnostics

> **Start with `kdna.draft/1` first**: Most Tier 1–3 assets — including `creator`, `worldview`, `value_order`, `sources`, `sections`, `relationships`, `exceptions`, `misuse`, `form: "rule"`, and `answer_kind: "other"` — compile cleanly via `kdna create --draft draft.json` (`@aikdna/kdna-cli@0.46.0`). See [draft-schema-and-methods.md](draft-schema-and-methods.md).

Load this guide **only** for rare cases that require raw `{manifest, payload, members}` authored JSON:
1. Bundling binary or text file attachments in `members[]` (0–128 entries, each `{ name, type: "file", mode, bytes_base64 }`, max 8 MiB per member / 12 MiB total).
2. Encoding specialized Core constructs outside `kdna.draft/1` (such as `shared_declarations` of `kind: "role"`, structured/external-evaluator conditions, `dependencies`, or custom `materials`/`contracts`).
3. Running a digest-bound structural inventory (`scripts/native-asset-review.mjs`) or revising an external `.kdna` without a `draft.json` via `source-open` / `source-pack`.

You can start from a draft and inspect the exact Core shape with `kdna compile draft.json --output authored.json`, then add raw fields before `kdna create authored.json --output first.kdna --allow-create`.

---

## 1. Structural Discipline for Raw `0.6.0` Payloads

- **Top-level contract**: Exactly three keys: `manifest`, `payload`, `members` (an empty `[]` means no attachments; `null` is rejected). Never add `format_version` or a fourth key.
- **Preserve local vs. asset scope**: Keep local premises, boundaries, and exceptions on their own judgment (`applies_to: {kind: "judgments", judgment_refs: [...]}`); never hoist every local assumption into global `kernel.foundation_refs` or asset declarations.
- **Unprovided declaration states stay distinct**: `unknown`, `none`, and `not_applicable` (`{state, value: null}`) mean different things — never collapse `unknown` into `none`.
- **Exception & condition wiring**:
  - `exceptions.value[]` holds complete `Exception` objects (`id`, `statement`, `boundary_ref`, `applies_to`, `when`, `effect`), never bare ID strings.
  - Every `boundary_ref` must match a `Boundary.id` whose `exception_refs[]` lists that `Exception.id`.
  - For judgment-level exceptions, set the referenced `ConditionDefinition.owner_ref` to `{"kind": "judgment", "id": "<judgment.id>"}` so frozen `KDNA Reader v0.3.4` resolves the trigger condition cleanly.
- **Dynamic `asset_capability`**: Must match all judgment `form` values (`conclusion` only → `asserted_answers`; `rule` only → `result_forming_rules`; both → `mixed`).
- **Four-place version bump on raw revisions**: Update `manifest.version`, `manifest.judgment_version`, `payload.asset.asset_version`, and `payload.asset.judgment_version` together, using UTC timestamps (`YYYY-MM-DDTHH:MM:SSZ`), and save to a new filename.

---

## 2. Digest-Bound Inventory & Declared Review (`native-asset-review.mjs`)

For audits or raw authored JSON reviews, run the bundled zero-network helper against the named file (it never scans directories, calls a model, or modifies the asset; keep its output private when inputs are private):

```sh
"$KDNA_NODE" SKILL_ROOT/scripts/native-asset-review.mjs authored.json > inventory.json
```

Fill in the emitted `review.template` as `author-review.json` (naming `purpose`, `actor`, `required_domains`, and per-domain `state`: `provided` / `none` / `not_applicable` / `unknown` / `incomplete` with real JSON-pointer evidence and any remaining action), then verify:

```sh
"$KDNA_NODE" SKILL_ROOT/scripts/native-asset-review.mjs authored.json \
  --review author-review.json > reviewed-inventory.json
```

The script binds the record to the exact input SHA-256 and returns exit `2` on stale hashes, wrong-domain pointers, empty `provided` wrappers, or unresolved `required_domains`. `declared_review_record_complete` verifies record integrity only — it never establishes content quality, Core admission, human confirmation, or Reader acceptance. Never write the author-side report into `payload` or leak local machine paths into a public asset.

---

## 3. Reading Complete CLI & Core Diagnostics

Never replace raw diagnostics with a one-line paraphrase. Inspect the entire diagnostics array and keep exact error codes, stages, and JSON pointers visible alongside plain-language explanations:

| Failure Layer | Exact Fields to Preserve & Inspect |
| --- | --- |
| CLI argument / input shape (`SOURCE_INPUT_INVALID` / `KDNA_AUTHORED_INPUT_INVALID`) | Top-level `status`, `code`, and `diagnostic.{field, reason, expected, missing, unexpected}`. |
| `validate-input` (`0.46.0`) | `status`, all `diagnostics[]` (`field`, `code`, `message`, `hint`, `duplicate_roles`, `fix_hint`), and non-blocking `advisories[]` (`code`, `path`, `message`). |
| Core admission (`core_rejected` / `READ_CORE_INVALID`) | Top-level `status`, `stage`, `core.reason`, **every** item in `core.diagnostics[]` (`code`, `stage`, `severity`, `subject`, `field`), plus `guidance[]`. Note: a method-role error points at `…/method/components` (the array) — resolve it against the 16-method role table in [draft-schema-and-methods.md](draft-schema-and-methods.md). |
| Container / format mismatch (`READ_UNSUPPORTED_VERSION`, `READ_INPUT_INVALID`) | Original `code`, `stage`, `field`, and `diagnostic` (preserve `null` vs. absent fields). |

Never silence a pointer you have not understood by dropping authored content, converting formats implicitly, or bypassing the official CLI. After saving, cold-reopen in a fresh process (`inspect`, `validate --system`, `read --mode catalog`, `read --mode exact_selection`) and verify that saved bytes match the authored source without loss.
