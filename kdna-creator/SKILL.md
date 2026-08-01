---
name: kdna-creator
description: Guide a user through the unreleased recoverable KDNA Creation Engine source candidate using natural language and explicit material paths.
---

# KDNA Creator

Status: unreleased source candidate. Do not claim that npm `latest`, every
terminal Host, or a published compatibility contract provides this workflow.

Use `kdna-studio` as the single state-machine authority. Do not recreate its
workspace schema, compiler, signatures, digests, or gate logic in the Host.

Before touching material, verify that the invoked executable is the unreleased
source candidate and that its help lists `create-agent`, `inventory-agent`,
`guide-agent`, `deliver-material`, `export-agent`, and `finalize-agent`. When the candidate is
installed in the current project's dependencies, invoke it with
`npx --no-install kdna-studio`; do not silently fall back to an older global
`kdna-studio`. If neither invocation exposes the candidate commands, stop
without reading material and report the package-installation mismatch.

## User conversation

Start from ordinary language. Ask only for:

- what bounded judgment the user wants to make reusable;
- the explicit file or directory to use, if any;
- whether the final judgment represents the user, represents an organization,
  interprets sources without representing their authors, is Agent-authored, or
  is genuinely co-authored;
- whether material processing must be local-only or may use a named remote
  processor; the Host determines whether it can technically attest that
  processing boundary and fails closed when it cannot;
- whether the final file is an ordinary unprotected local file, a protected
  file, or a remote asset.

Do not ask the user for a Creation mode enum, workflow enum, Agent ID,
operation ID, digest, schema version, signing key, receipt, seed, or benchmark
size. The Host generates stable technical coordinates and reuses them for
exact retries. Before the first write, show the inferred authority claim in
plain language and ask only when the represented authority or processing
boundary is genuinely ambiguous.

Runtime `access: public` means that possession of the file is sufficient to
load it. It does not publish the file to the Internet. Creation never shares
or publishes an asset automatically.

## Start or resume

Choose one explicit private workspace below the project root. The CLI protects
that workspace from accidental Git staging and excludes it from material
inventory.

If the workspace exists:

```bash
kdna-studio guide-agent <workspace> --json
```

Otherwise, obtain the public machine template, translate the natural-language
request into private machine input, and run:

```bash
kdna-studio guide-agent --action create --json
kdna-studio create-agent <workspace> --input-stdin --json
```

Use `guide-agent` again after each state change. Do not inspect installed
package source or private workspace JSON to discover an action shape. If the
guide says a template or official adapter is unavailable, stop at that
reported product boundary.

Private answers use stdin or a mode-0600 file. Expert argv fields are for
non-secret automation only; never put source text, judgments, passwords, or
API keys in shell arguments.

Follow `next_action.required_actor` and `next_action.requires_user`.
Autonomous work may perform reversible extraction, propose bounded judgments,
retain uncertainty, and request an independent Agent evaluation. Human or
organization representation, material-processing authorization, and protected
asset authorization still require the corresponding authority.

## Material-first boundary

Zero files, one file, a small directory, and a large paged directory are all
valid inputs. File count is not an acceptance score.

For a path input:

1. Run `inventory-agent` before reading content. The preview is content-free;
   entries are `eligible` or explicitly excluded/unsupported, never accepted
   before approval.
2. Present relative paths, processing destination and assurance level,
   exclusions, unsupported
   formats, duplicates, and batch continuation in plain language.
3. Bind the exact inventory digest and processing policy as Host-owned machine
   state. If the user's original instruction already authorized the displayed
   path, processing destination, and boundary, do not ask them to approve a
   digest; ask again only for an unexpected path, sensitive item, unsupported
   coverage, destination change, or genuine ambiguity. A generic
   `host-declared` capability digest records only what the caller asserted; it
   is not verified-local evidence. If verified local-only processing is
   required, use a separately trusted Host adapter or stop before reading.
4. Use `deliver-material` only for an accepted entry. A named remote terminal
   Host pre-creates a mode-0600 system-temporary file, lets the CLI write only
   the accepted bytes via `--private-output-file`, places those bytes in the
   named model context under the approved provider retention boundary, and
   destroys the file in `finally`. A dedicated Host adapter may instead own fd
   3. Raw material must not enter CLI stdout, stderr, status JSON, or workspace
   state. The temporary-file path is Host-declared remote processing, not
   private-model-input or verified-local evidence.
5. Bind every proposed judgment to the accepted material ID or an explicit
   Agent-inference reference.

Directories exclude version-control metadata, dependencies, build/cache
outputs, the Creation workspace, managed candidates, and secret-like files by
default. Limits are recoverable per-operation safety budgets, not product
minimums or a statement that larger collections are better.

This source candidate does not implement offset-based continuation inside one
text file larger than the direct-processing byte limit. Inventory reports that
file as unsupported and asks for an explicitly selected split copy that
preserves ordering and full coverage; do not promise an automatic next chunk.

Images, audio, video, and extractor gaps require a digest-bound Host
observation. The source is stream-hashed; the bounded observation records the
source digest, media type, observer/tool coordinate, coverage, uncertainty,
and observation digest. It never represents the source author.

## Judgment and uncertainty

A narrow asset may contain one complete judgment and no relation. Do not
invent a worldview, priority, exception, conflict, correction, or additional
judgment to satisfy a sample shape.

Each judgment needs a statement, rationale, applicability, non-applicability,
misuse risk, traceable source or Agent inference, bounded counterexample
search, and honest confidence. Actual contrary evidence may be empty; record
what was searched and the remaining uncertainty.

Use `review` for source classification, candidate decisions, relation
decisions, confirmations, and uncertainty dispositions. A review may honestly
record `reviewed-no-change`. Do not manufacture a correction.

## Three gates and delivery

Keep these gates separate:

- `JUDGMENT_ACCEPTED`: current judgment evidence, applicable semantic tests,
  boundary/exit coverage, and the authority-mode acceptance are current.
- `FORMAT_VALID`: the exact managed candidate bytes pass the public
  container/schema/profile/integrity and Runtime compatibility checks.
- `APPLICATION_VERIFIED`: an official Host orchestration loads those exact
  bytes in a fresh Consumer context and obtains independent, per-dimension
  evaluation with scenario-local stability.

Report `Creation Complete` only when all three gates bind that same semantic
digest and exact managed candidate.

Run `export-agent` to create the exact managed test candidate inside the
private workspace. It does not write a user delivery file:

```bash
kdna-studio export-agent <workspace> --json
```

The ordinary user must not manually build application plans, keys, signatures,
or receipts. Follow the official Host application action returned by
`next_action`. If the current Host has no official adapter capable of isolated
Consumer/evaluator execution, report that Host-integration blocker; do not
substitute the creating Agent, a hand-written receipt, or an internal
benchmark runner.

Only after all three gates bind the same semantic and asset digests may the
Host deliver the unchanged managed bytes:

```bash
kdna-studio finalize-agent <workspace> --out <asset.kdna> --json
```

`finalize-agent` does not ask for a password merely to copy already verified
ciphertext. It rejects stale receipts, replaced candidate bytes, workspace
output paths, and partial transactions.

With-KDNA output fidelity is the per-asset gate. A without-KDNA lane is an
optional diagnostic unless the frozen task explicitly requests a paired
system-capability sample. Equal correct answers do not make an asset fail and
do not prove causal influence.

## Lifecycle

The current local command lifecycle is create, resume, revise, invalidate stale
evidence, retest, deliver, and recover the last valid local state. To stop,
retain the private workspace unless the user explicitly requests its removal.
This source candidate does not yet expose a general workspace-abandon/delete
command; application-attempt abandonment is narrower and must not be described
as workspace deletion. Sharing, publication, deprecation, revocation,
marketplace distribution, and Studio App management are separate capabilities
and do not occur implicitly.

Read [the machine contract](../docs/KDNA_CREATION_AGENT_CONTRACT.md) only when
implementing a Host adapter. It is not a user questionnaire.
