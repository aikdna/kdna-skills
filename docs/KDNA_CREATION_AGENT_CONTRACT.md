# KDNA Creation Agent Contract

Status: unreleased, public-safe source contract for terminal Host integration.
It is not a release, publication, or universal Host-support claim.

## Responsibility boundary

A Creation Agent starts from a natural-language goal and, optionally, one
explicit file or directory. The Studio CLI Creation Engine owns the private
workspace, semantic revisions, stale-evidence invalidation, compilation, and
the three completion gates. A Host must not recreate those rules from prompt
text or write `.kdna` bytes itself.

The ordinary user does not choose an internal mode enum or provide an Agent
ID, operation ID, schema version, digest, signing key, receipt, seed, or
benchmark coordinate. The Host derives stable technical coordinates and
reuses them for retries. It asks the user only for a meaningful judgment,
scope, representation or authorship decision, material-processing permission,
and file-access protection.

## Honest authority and execution

Execution and authority are separate:

- `workflow_mode` is `collaborative` or `autonomous`;
- authority is `agent-authored`, `human-confirmed`,
  `organization-confirmed`, `interpretive`, or `mixed-authorship`.

Human participation by itself is a receipt, not an authority mode.
`mixed-authorship` means that both a human and an Agent made substantive
judgment-content contributions; it requires unit-scoped contribution evidence.
An interpretive asset does not represent a source author. Human or
organization representation requires a digest-bound confirmation by the
proper authority. An independent Agent evaluator may accept an autonomous
Agent-authored or interpretive candidate, but the creating Agent may not
self-accept.

The private authority, participation, subject, and confirmation records do not
become Runtime creator identity or a public representation claim.

## Recoverable command flow

Every command returns one JSON document on stdout and diagnostics on stderr.
Private source bodies and decrypted payloads must never appear in either.

```text
guide-agent       discover the public create/next-action machine template
create-agent      create a private recoverable workspace
resume            return the next required actor and action
status            inspect private state and the three gates
inventory-agent   preview an explicit path without reading content
deliver-material  deliver one approved exact source through private fd 3
answer            record a structured answer bound to current state
review            record source, candidate, relation or authority review
try               freeze or record semantic/application evidence
repair            apply a bounded repair and invalidate stale evidence
export-agent      create an exact managed test candidate in the workspace
finalize-agent    deliver unchanged verified bytes to the requested path
```

The Host calls `guide-agent --action create` before a new workspace and
`guide-agent <workspace>` after state changes. It must not inspect installed
package source or private workspace JSON to reconstruct undocumented fields.
An unavailable action template or official application adapter is a product
blocker, not permission to hand-compose internal signatures or receipts.

The machine API may require explicit `mode`, `workflow_mode`, `created_by`,
`operation_id`, revision, and digest fields. Those are Host responsibilities,
not user questionnaire fields. Private structured input uses stdin or a
mode-0600 file; source text, judgments, passwords, and API keys must not be
placed in argv or shell history.

`resume` is the source of truth after process interruption or Agent handoff.
The Host must honor `next_action.required_actor` and
`next_action.requires_user`. Autonomous work can collect evidence, retain
uncertainty, narrow a claim, or request an independent Agent evaluation.
Actual human/organization representation, material-processing authorization,
and irreversible distribution decisions cannot be fabricated.

## Material authorization

Zero material, one file, a small collection, and a paged large collection are
all valid. Counts are resource and stress-test coordinates, never Creation
quality thresholds.

Material-first flow is:

1. `inventory-agent` creates a content-free inventory. Readable entries are
   eligible or awaiting approval, not accepted.
2. The Host shows relative paths, exclusions, unsupported formats, duplicates,
   batch continuation, and the declared processing destination.
3. The user or authorized Host policy approves the exact inventory digest,
   local-only or named-remote destination, and assurance level.
4. `deliver-material` releases only an approved entry through a Host-owned
   mode-0600 system-temporary file, or fd 3 when a dedicated adapter owns that
   channel. Raw content must not enter normal JSON, stdout, stderr, or
   workspace state.
5. The Host binds the observed bytes to the approved source digest, and
   judgments cite the resulting material ID or an explicit Agent inference.

For an explicitly approved named remote processor, a terminal Host may place
the mode-0600 temporary-file bytes into that named model context under its
declared retention policy and delete the file in `finally`.
That route is Host-declared remote processing; it does not prove verified-local
execution or log-free model input.

A generic Host-declared capability digest is a coordinate, not proof that
processing stayed local. A request for verified local-only processing requires
a separately trusted Host adapter; the generic CLI fails closed rather than
upgrading a caller assertion. A changed destination, provider, capability,
file identity, or content digest invalidates the approval. A directory path is
not permission to read VCS
metadata, dependencies, build/cache output, hidden secrets, the Creation
workspace, managed candidates, or output files.

Images, audio, video, and unsupported extractors use a digest-bound Host
observation when the Host has that capability. The record binds the source
digest, media type, observer/tool coordinate, coverage, uncertainty, and
observation digest. It does not represent the source author. Unsupported
items remain visible in the inventory and do not silently disappear.

## Small and large assets

One complete, traceable Judgment Unit can be sufficient. Do not invent a
worldview, value hierarchy, priority, exception, conflict, correction, or
additional judgment to match a fixture.

Each unit states its rationale, applicability, non-applicability, misuse risk,
source or inference, bounded counterexample search, and honest confidence.
Actual contrary evidence may be empty. A digest-bound review may record
`reviewed-no-change`; a correction is required only when the candidate is
actually wrong.

Test coverage is derived from the asset's structure and risk. It covers
applicability, boundaries or exit, and over-application prevention. Existing
priority, exception, conflict, authority-precedence, unique, and high-risk
claims must be covered, while absent structures must not be invented. A
pre-frozen highest-risk applicable or boundary scenario supplies repeated
stability evidence; this does not make every task a fixed multi-run matrix.

## Candidate and final delivery

The gates remain distinct and bind one semantic digest and one exact asset:

- `JUDGMENT_ACCEPTED` — the current judgment model, applicable semantic
  evidence, boundaries, and authority acceptance are current.
- `FORMAT_VALID` — the managed candidate's exact bytes pass public
  container/schema/profile/integrity and Runtime compatibility checks.
- `APPLICATION_VERIFIED` — an official Host loads those exact bytes in an
  isolated fresh Consumer context and obtains an independent, applicable
  per-dimension evaluation with pre-frozen stability evidence.

`export-agent` creates only the managed private test candidate:

```bash
kdna-studio export-agent <workspace> --json
```

It must not place an incomplete candidate at the user's delivery path. The
ordinary user must not construct application plans, role keys, signatures, or
receipts. The official Host orchestration owns required Consumer/evaluator
isolation and cryptographic plumbing. If a Host has no conforming adapter, it
must report that integration blocker rather than substitute the creating
Agent or an internal benchmark runner.

After the three gates agree, `finalize-agent` atomically copies the unchanged
managed bytes:

```bash
kdna-studio finalize-agent <workspace> --out <asset.kdna> --json
```

For Runtime `access: public`, possession of the file is sufficient to load it.
That value does not publish the file to the Internet. Creation does not share
or publish an asset automatically. A protected managed candidate is authorized
while it is application-tested; final exact-byte copying does not ask for a
meaningless second password.

Per-asset verification depends on exact loading and semantic fidelity. A
without-KDNA lane is optional diagnostic evidence unless a frozen
system-capability task requests a paired comparison. Equal correct outputs do
not make an asset fail and do not prove causal influence.

## Lifecycle and support status

The current local lifecycle is create, resume, revise, invalidate stale
evidence, retest, finalize, and recover the last valid state. Stopping retains
the private workspace. There is not yet a general public workspace
abandon/delete command; the signed application-attempt abandonment operation
only closes one interrupted Consumer attempt. Sharing, publication,
marketplace distribution, deprecation, and revocation are separate management
capabilities.

Skill text is not Host acceptance. A Host integration remains Unassessed until
a clean-install, fresh-context Agent completes this public flow without
private controllers, hidden evidence, or user-supplied technical coordinates.
