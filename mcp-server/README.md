# KDNA MCP 0.8.0-rc.native-sections.1 — local Read candidate

**Local release candidate; npm publication is disabled by `private: true`.** This stdio adapter delegates to the exact
CLI 0.39.0-rc.native-sections.3 / Core 0.37.1-rc.browser.1 / Read 0.11.2-rc.browser.1 artifacts. The Read contract is
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
| kdna.catalog | budget_bytes | Complete public catalog within the budget |
| kdna.read | selection, budget_bytes | Exact selection and mandatory closure |
| kdna.expand | handle, budget_bytes | Original issued handle passed unchanged, with its selection |
| kdna.cancel | {} | Closes binding and current session |

Selection is the exact asset_id, asset_version and either one `judgment_id` or a `judgment_ids` array (1..64 unique ids) taken from the catalog. Exactly one of the two keys must be *present*, and the present key's value must also be valid: `judgment_id: null` beside a valid `judgment_ids` is refused, not ignored, and the declared JSON schema (`oneOf`, not `anyOf`) refuses the same inputs the adapter does, so a caller that skips schema validation gets the same refusals. The adapter maps both forms to the native `judgment_ids: [...]` selection, so one call can carry the whole set instead of repeating the full audit envelope once per judgment; `judgment_ids` is additive, the single-id form is unchanged, sending both at once is refused, and the 64-item bound is a tool-surface convenience limit rather than a KDNA limit. Expansion passes the complete handle unchanged and uses its `anchor.selection`; it does not fabricate or translate a handle.
Budget is an integer from 0 through 1000000 bytes. Request lines are bounded to
1 MiB. Tools accept only their listed keys, never path/cwd/approved/allow_read.
One read/inspect runs at a time; overlapping work returns MCP_READ_BUSY instead
of queuing more asset reads. JSON/argument errors use JSON-RPC errors. Local
binding/process errors use an MCP_* tool error. Public results remain unchanged
JSON text in content[0].text. Native `catalog_only` is a successful catalog result; rejected and no-body results have isError:true.

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

## Install and test from source

Use Node.js with that release's bundled npm. This batch requires Node.js 22 or
later (the package's declared minimum) and is verified on Node.js 22.23.1 and
24.18.0, with 22.23.1 recommended; other versions are not covered by this
batch's verification. From `mcp-server/`:

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

The MCP tar has nineteen regular members: bin modules, package metadata,
README, LICENSE, NOTICE and twelve runtime archives. Tests, source tooling and
package-lock.json are excluded. The companion consumer lock is generated from
the checked source graph. The packed-consumer test installs with an empty npm
cache, then runs the same real stdio boundary suite against the installed bin.

This package remains a local RC. Registry publication is disabled and stable
release/dependency guards reject it. A source prerelease uses this complete checkout and its offline installer; it is a separate delivery channel and does not bypass npm stable publication guards. Source and installed process tests do not
establish named Host adoption, human review, authorship or Creation acceptance.

## Native section contract boundary

The complete CLI public contract binding is pinned by SHA-256 `ca729552115391c184dee30ca019fcd81bc223220be8df3caf85285863bbb5fc`. It identifies the native container `0.6.0` and Read `0.7.0-candidate` tuple, exact Core/Read artifacts and route contracts. CLI and Read must resolve the same fixed Core instance; a nested shadow dependency is refused. The adapter delegates native admission and retained section reads to that runtime. Preserve catalog-only status, mandatory closure, native handle origin, diagnostics, absent declarations and explicit empty states. Technical validity, Read and static declarations do not establish live Creation authority, human confirmation or action permission.

The public regression corpus is generated from synthetic authored JSON with the fixed CLI. It tests real native containers and one deliberately truncated container; no legacy component-format asset is treated as current native input.
