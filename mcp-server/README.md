# KDNA MCP 0.8.0-rc.native-sections.1 — local Read candidate

**Local release candidate; npm publication is disabled by `private: true`.** This stdio adapter delegates to the exact
CLI 0.39.0 / Core 0.37.2 / Read 0.11.3 artifacts. The Read contract is
`kdna.read/0.7.0-candidate`; package version is a separate coordinate. Historical npm
MCP 0.5.0 and its CLI 0.36.x workspace flow are not this candidate's runtime.

## Operator-controlled startup

```sh
node /absolute/installed/mcp-server/bin/kdna-mcp.mjs --asset /absolute/selected.kdna --allow-read
```

The **OS process argv**, supplied by an actual local operator or trusted
launcher, is the sole input-selection/read-permission channel. It is outside
model-controlled MCP stdin. The Host must not let model tool parameters,
initialize fields, instructions in an asset or edits to startup configuration
establish or widen this binding. A Host that lets a model launch arbitrary
commands has not established that trust boundary merely by running this server.

The operator must have selected this file for the intended task and recipient.
Existing complete authorization needs no repeated internal approval. Missing
substantive choices are resolved by the Host before startup. The server cannot
attest human identity, local-only model processing or another Host's entitlement.

One absolute canonical non-symlink regular .kdna file, up to 64 MiB, is opened
read-only, checked against its file identity and copied byte-for-byte into a
mode-0700 private temporary directory with a mode-0600 file. No ZIP or payload is
parsed by this adapter. Official CLI/Core/Read admit the private bytes. Later
replacement of the original file cannot substitute another input in this
process. Temporary copies are removed on normal EOF/cancel/signal shutdown;
uncatchable termination can leave a private local copy and needs operator cleanup.
TMPDIR chooses storage, not authority. Use a private directory controlled by the operator.

No startup arguments, or --asset without --allow-read, leaves the server
unbound; the selected path is not opened. --allow-read without --asset is an
argument error. Model tools cannot bind, reopen or choose a path. Legacy
workspace/consent/password environment values do not grant permission.

## MCP transport and tools

Use newline-delimited JSON-RPC 2.0 over local stdio. Initialize with the client's
supported `protocolVersion` string, a `capabilities` object and `clientInfo`
containing string `name` and `version` fields. The adapter supports MCP
`2024-11-05` and returns that version even when a client requests a newer one,
following [MCP version negotiation](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle#version-negotiation).
This does not enable newer protocol features or client-offered capabilities;
the server still advertises only `tools: {}`. A client that supports the returned
version sends `notifications/initialized` before calling tools; a client that
cannot use it should disconnect. Initialization never grants file or action
permission. Malformed initialization and tool requests before readiness remain
errors.

Request `params` may contain an optional `_meta` object. Its `progressToken`,
when present, must be a string or finite number; `0` is valid. The adapter
accepts this transport metadata without emitting progress notifications and
ignores other metadata. Metadata is never forwarded into tool arguments,
operator startup binding or public Read input. This adds no permitted tool
argument or method parameter beyond request-level `_meta`.

| Tool | Arguments | Result |
| --- | --- | --- |
| kdna.binding-status | {} | Local binding state, not a public authority receipt |
| kdna.inspect | {} | Official CLI technical admission/metadata |
| kdna.catalog | budget_bytes; optional presentation | Complete public catalog within the budget |
| kdna.read | selection, budget_bytes; optional presentation | Exact selection and mandatory closure |
| kdna.expand | exactly one of handle or handle_ref, budget_bytes; optional presentation | Original issued handle passed to the same official session |
| kdna.audit | audit_ref, budget_bytes | Exact original full result of an earlier task delivery |
| kdna.cancel | {} | Closes binding and current session |

For catalog/read/expand, `presentation` is `"full"` or `"task"`; omission means
`"full"`. Task presentation also requires `view_budget_bytes`. Full presentation
rejects that additional field. These presentation options are not accepted by
binding-status, inspect, audit or cancel.

Selection is the exact asset_id, asset_version and either one `judgment_id` or a `judgment_ids` array (1..64 unique ids) taken from the catalog. Exactly one of the two keys must be *present*, and the present key's value must also be valid: `judgment_id: null` beside a valid `judgment_ids` is refused, not ignored, and the declared JSON schema (`oneOf`, not `anyOf`) refuses the same inputs the adapter does, so a caller that skips schema validation gets the same refusals. The adapter maps both forms to the native `judgment_ids: [...]` selection, so one call can carry the whole set instead of repeating the full audit envelope once per judgment; `judgment_ids` is additive, the single-id form is unchanged, sending both at once is refused, and the 64-item bound is a tool-surface convenience limit rather than a KDNA limit. Expansion passes the complete handle unchanged and uses its `anchor.selection`; it does not fabricate or translate a handle.

After catalog, batch the judgments actually required for the task in one exact
selection. Keep the complete successful disclosure and use it for that task;
do not fetch the same selection from the same snapshot again without a reason.
Request another selection or an issued expansion only for a real information
need. A refusal, insufficient budget or deferred item is not content already
read. No repeat-avoidance rule grants new permission or permits reading a Host
cache, private file or raw payload to bypass the supplied result.

Budget is an integer from 0 through 1000000 bytes. Request lines are bounded to
1 MiB. Tools accept only their listed keys, never path/cwd/approved/allow_read.
One read/inspect runs at a time; overlapping work returns MCP_READ_BUSY instead
of queuing more asset reads. JSON/argument errors use JSON-RPC errors. Local
binding/process errors use an MCP_* tool error. Full presentation returns the
unchanged official result as JSON text in `content[0].text`. Task presentation
uses the adapter contract below in the same text field. No structuredContent
or resource field carries a second copy of the full result. Native
`catalog_only` is a successful catalog result; rejected and no-body results
have `isError:true`.

## Optional task presentation and exact audit

The task contract is `kdna.mcp.task-presentation/0.1.0`, a local adapter
representation rather than a new Core/Read envelope. For example, add
`presentation: "task"` and `view_budget_bytes: 1000000` to the catalog/read/expand
arguments your task already needs. `budget_bytes` still applies to the full
official Read. The independent `view_budget_bytes` bounds the complete encoded
task view. Both are integers from 0 through 1000000; a smaller presentation
does not bypass an official Read budget or permission decision.

Read all supplied content, canonical closure nodes, roles, method
interpretations, states, diagnostics, omissions and assessment. The view keeps
asset/version, tuple, snapshot and digests. It removes only supported exact
structural duplicates through an external `content_aliases` array. Each entry
has `at`, `from`, `node_id` and `role`: the JSON pointers are relative to
`content`; a null at `at` stands for the complete object at `from`. Resolve
alias dependencies before using the content. A null with no alias remains an
original null. The adapter injects no `$ref` into authored JSON, summarizes no
author prose and does not make unread/deferred bodies into completed reads.
Necessary author content can be reconstructed from the task view itself;
audit is not required to recover omitted conditions, exceptions or sources.

The inline `verification_summary` is also required reading. It retains signature
status (including absent versus verified) and the complete signature policy,
checksum status, origin kind, verification mode/semantic status, each digest's
status and profile, the signature-policy check's basis/policy/result and
`new_signature_verification`, and the original new-verification and I/O flags.
Do not treat an absent signature, reused prior verification or unevaluated
state as a new successful check. Only long capture/section proof material and
the full receipt require audit retrieval. Unknown verification fields make the
task representation unavailable rather than being silently discarded.

Issued expansion handles become `handle_ref` values with their target, anchor,
scope and expiry. An index entry without a corresponding issued reference
says `no_reference_in_this_delivery`; this is not evidence that its body was
read. Use either the old complete `handle` or the returned `handle_ref` in
`kdna.expand`, never both. The adapter resolves a reference to the original
handle; the official Read still validates the expansion.

`audit.audit_ref` identifies the exact full result originally used to produce
that task delivery. `kdna.audit` takes only that reference and `budget_bytes`.
It returns the original result, including its original verification, receipt
and long handles. It performs no new file read, verification or authorization;
an old receipt is not a fresh grant. Audit returns JSON text only. Do not
request it automatically after every task view, or the full material will be
supplied to the model again without a task need.

References are local to this live operator binding and the same snapshot,
asset/version, tuple and Host epoch. Their monotonic lifetime is at most 60
seconds; a short handle expires no later than its original issued handle.
Cancel, process/session termination or an observed scope change invalidates
them. The store holds at most 32 audits, 256 handles and 4 MiB of combined
encoded stored results/handles. These are engineering capacity limits, not
claims about model tokens, memory overhead, fees or answer quality.

If a complete view or audit exceeds its budget, it is refused with
`MCP_TASK_VIEW_BUDGET_EXCEEDED` or `MCP_AUDIT_BUDGET_EXCEEDED`; no partial body or
automatic full fallback is sent. An unsupported official shape returns
`MCP_TASK_VIEW_UNAVAILABLE`, not a fabricated rejection. Expired or foreign
references return `MCP_REFERENCE_UNAVAILABLE`; capacity exhaustion returns
`MCP_REFERENCE_STORAGE_FULL`. Keep these adapter failures separate from an
actual official rejection. A supported refusal keeps its full original causal
result, `status: rejected` and `audit: null` in the task representation. Change
the budget, explicitly choose full, or start a new authorized session only
when the task and permission permit it.

The pinned `kdna.section-bytes-node/0.1.1-candidate` admission refusal is also
supported. Its reason, stage, diagnostic and complete input observation remain
in `official_result`, including a null snapshot. It has no author body and
issues no audit or expansion reference. Unknown contract definitions or
additional fields require an explicit full presentation; they are not guessed.

The earlier Codex CLI 0.154.0 case remains a full-presentation observation. A
separate task-presentation model turn batched three judgments in one ready read
and used them while retaining uncertainty, scope and signature-policy limits.
It made no repeated selection read, audit or expand call. Named-model audit use
and expansion remain **NOT_RUN**; engineering tests do not establish them. A
separate deliberately truncated Host display led to cancellation and stopping,
not successful continuation. These cases do not certify other Hosts or routes.
See the [Codex observations](https://github.com/aikdna/kdna-skills/blob/main/integrations/codex/README.md#observed-task-presentation-case)
and [support matrix](https://github.com/aikdna/kdna-skills/blob/main/docs/agent-support-matrix.json).

Read uses one real locally resolved CLI child process in --session --allow-read
mode. The adapter builds the public request tuple from the CLI's fixed binding;
it does not create a public snapshot, IR, identity or permission provider.
Catalog, successive selections and handles therefore share that official
process's snapshot. Keep the first complete catalog for later selections.
Inspection uses a separate real CLI inspect child and does not assert read,
writer, confirmation or action states from technical validity.

Each read has a 30-second local timeout, CLI output is bounded to 8 MiB and
stderr to 64 KiB. Cancellation, a matching notifications/cancelled requestId,
closed output or a failed session terminates the affected child; normal EOF
waits for already accepted work and closes stdin. Termination has a bounded
SIGKILL fallback for that owned child. Cancel revokes the entire binding;
reselection requires a new operator-controlled launch. Already delivered text
cannot be retracted, and cancellation is not an OS file-access trace.

The adapter opens no network endpoint and sends no network request. Stdio
delivery does not prove how another Host later processes the returned text.
Untrusted asset text never becomes a tool or shell command. Action execution,
discovery, asset-store scanning, workspace attachment mutation, decryption and
legacy load/plan-load/Runtime Capsule adaptation are absent.

## Match the asset's reader

This adapter reads native container `0.6.0` with `kdna.read/0.7.0-candidate`.
Studio's public and protected container `0.5.0` assets have a separate
[local Studio Host route](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/references/studio-protected-host.md)
using Read `0.6.4`. Public Studio bytes use that Host without password/recovery
options; protected bytes need its trusted credential channel. Source disclosure
and revision require separate permission on that route. A common package
version does not make the file formats interchangeable, and an unsupported
format is not permission to convert it or read its raw payload.

## Install and test from source

For an Agent-led task, begin with the [getting-started guide](https://github.com/aikdna/kdna-skills/blob/main/docs/GETTING_STARTED.md).
The installer requires Node.js 22 or later, npm, `bash` and `tar`. The current
CLI 0.39.0 / Core 0.37.2 / Read 0.11.3 graph was exercised with Node.js 22.23.1
and npm 11.17.0. Earlier companion graphs' runtime checks do not verify this
one on additional Node versions. The CI matrix is a set of required checks,
not evidence that every run has already passed. From `mcp-server/`:

```sh
npm ci --offline --ignore-scripts --omit=optional --no-audit --no-fund
npm test
```

The lock and twelve checked-in archives define the entire required dependency
graph. The runtime check verifies their SHA-256, SRI, package identity and lock
edges. All twelve required packages are installed; nine optional native entries
remain in the lock and are omitted. Pure JavaScript operation requires no native
install hook, registry substitution or global CLI fallback.

`npm test` runs the direct CLI, source MCP, fresh packed MCP, naming, runtime and
release-policy checks. The nested publication test uses npm's dry-run mode and
must stop at the release gate. Its recursion guard skips only its own nested
copy; normal test invocation must not set `KDNA_MCP_NESTED_PUBLISH_TEST`.

## Install a packed local consumer

From a source checkout's `mcp-server/`, create a **new** sibling directory:

```sh
node scripts/create-local-consumer.mjs ../../kdna-mcp-consumer
cd ../../kdna-mcp-consumer
npm ci --offline --ignore-scripts --omit=optional --no-audit --no-fund
node node_modules/@aikdna/kdna-mcp-server/bin/kdna-mcp.mjs --asset /absolute/selected.kdna --allow-read
```

The script verifies the source runtime, packs the current MCP implementation and
writes a consumer manifest, lock, archive hashes and thirteen archives. It
refuses an existing destination. Each runtime archive is an exact root `file:`
dependency, with a matching root override. This lets npm resolve dependencies
before extracting the MCP package. The MCP manifest uses exact numeric registry dependencies; this explicit companion graph supplies the same checked bytes for offline use without depending on package-relative archive lookup.

The MCP tar has twenty-one regular members: bin modules, package metadata,
README, LICENSE, NOTICE and twelve runtime archives. Tests, source tooling and
package-lock.json are excluded. The companion consumer lock is generated from
the checked source graph. The packed-consumer test installs with an empty npm
cache, then runs the same real stdio boundary suite against the installed bin.

This package remains a local RC. Registry publication is disabled and stable
release/dependency guards reject it. A source prerelease uses this complete checkout and its offline installer; it is a separate delivery channel and does not bypass npm stable publication guards. Source and installed process tests do not
establish named Host adoption, human review, authorship or Creation acceptance.

## Native section contract boundary

The complete CLI public contract binding is pinned by SHA-256 `6e3b3eca98290ba66d15557d5876a96d81e3f8036850f49092686ec96714b54f`. It identifies the native container `0.6.0` and Read `0.7.0-candidate` tuple, exact Core/Read artifacts and route contracts. CLI and Read must resolve the same fixed Core instance; a nested shadow dependency is refused. The adapter delegates native admission and retained section reads to that runtime. Preserve catalog-only status, mandatory closure, native handle origin, diagnostics, absent declarations and explicit empty states. Technical validity, Read and static declarations do not establish live Creation authority, human confirmation or action permission.

The public regression corpus is generated from synthetic authored JSON with the fixed CLI. It tests real native containers and one deliberately truncated container; no legacy component-format asset is treated as current native input.
