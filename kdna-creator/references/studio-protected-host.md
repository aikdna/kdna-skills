# Reopen and revise a locally protected Studio asset

Use this source-only Host with the exact [Studio archive binding](current-studio-binding.json): StudioCLI `0.13.0-rc.components.2`, StudioCore `4.0.0-rc.components.2`, Core `0.37.1-rc.browser.1` and Read `0.11.2-rc.browser.1`. It consumes container `0.5.0` through Read `0.6.4`. The native CLI and MCP use container `0.6`; they do not decrypt or revise this Studio output.

Obtain the complete matching StudioCLI source checkout, including its tracked `vendor/` archives, and install its locked graph with Node 22 and npm 10.9.8:

```sh
npm ci --offline --ignore-scripts --omit=optional --no-audit --no-fund
```

Run that command in the matching StudioCLI checkout. A packed StudioCLI tarball alone does not carry its dependency archives. The Host checks the frozen CLI files, public binding, declared installed package members and dependency resolution before importing the public SDK. The launcher must independently approve and protect this installation against concurrent modification. Content hashes alone do not authenticate the launcher or provider.

Create and export through the [terminal session](terminal-session.md), using explicitly authorized material and an actual human or delegated Agent adoption channel. The current Studio exporter requires an explicitly complete method, including its required roles. An ordinary conclusion or result can use that method; a method-absent proposal currently fails with `CREATION_METHOD_REQUIRED`. Do not fabricate a method to fill the form. Use the native authoring route when its contract fits the intended asset. For password export, the trusted launcher supplies `--password-fd` on a separate pre-opened pipe.

Close the creation process before reopening. Studio's static `read` and `verify` commands do not unlock protected output. The [local Host script](../scripts/studio-protected-host.cjs) performs public SDK admission, explicit Read delivery and separately authorized source revision. It does not reconstruct a live Studio session.

## Launch and permission boundary

A separately trusted launcher selects the installation, exact file and purpose; obtains the user's existing read or source permission; and owns the credential channels. The Agent may request an operation and propose an edit. It must not construct its own authorization binding or enlarge permission. A descriptor is transport, not proof that its sender is authorized. An unrestricted model shell needs a Host boundary outside that shell before this route establishes permission.

These are the **child process arguments** supplied by that launcher, not standalone shell commands that create authorization:

```text
node kdna-creator/scripts/studio-protected-host.cjs read --asset <asset.kdna> --host-fd 3 --password-fd 4 --judgment 1 --budget 1048576
node kdna-creator/scripts/studio-protected-host.cjs source --asset <asset.kdna> --host-fd 3 --password-fd 4
node kdna-creator/scripts/studio-protected-host.cjs revise --asset <original.kdna> --host-fd 3 --password-fd 4 --recovery-fd 5 --edit <edit.json> --reason <reason.json> --out <new-directory>
```

For public bytes, omit the password and recovery options. Omit `--judgment` for a whole-asset Read containing the authored question declarations; numbered selection returns the selected judgment and its required closure. This is the existing Read contract, not a new natural-language query API. Reading does not grant action authority.

The launcher writes one closed JSON object to FD 3 and closes it:

| Field | Binding |
| --- | --- |
| `installation_root` | Canonical absolute path of the approved StudioCLI installation |
| `asset` | Canonical absolute path of the selected file |
| `expected_A` | `sha256:` followed by the digest of the captured file bytes |
| `purpose` | Exactly `read`, `source` or `revise` |
| `binding_id` | Fresh Host-owned scope/epoch identifier |
| `expires_at_ms` | Future expiry, at most 60 seconds from admission |
| `allow_read`, `allow_source` | Separate booleans reflecting existing permission |
| `output` | Revision only: exact absolute new output directory |
| `edit_sha256`, `reason_sha256` | Revision only: SHA-256 of the actual edit and reason files, without a prefix |

FD 4 carries UTF-8 credential bytes and closes. FD 5 receives the new recovery credential through the trusted sink. The three descriptors must be distinct pipes or sockets numbered 3 or higher. Keep credentials out of argv, model payloads, transcripts and ordinary logs. A legitimately held recovery credential can use FD 4 with `--slot 1`; password slot 0 is the default. The launcher controls storage and later retrieval of recovery material.

## Read, modify and retain the original

Read the actual saved file, inspect its question declarations and select the judgment relevant to the task. Consider its evidence, conditions and uncertainty when doing the work. Request `source` separately only when full source disclosure and modification are authorized. Read permission does not imply that permission.

Prepare an edit file with exactly these fields:

```json
{"manifest": "FULL_NEW_MANIFEST_OBJECT", "payload": "FULL_NEW_PAYLOAD_OBJECT"}
```

The placeholders above represent objects. Preserve identity, increment both declared asset versions, retain applicable evidence and license information, and record the actual scope of revision history. A partial history must remain explicitly partial. The SDK validates the complete edited manifest and payload. The reason file is exactly:

```json
{"source_A": "sha256:PREDECESSOR_DIGEST", "reason": "The actual nonempty editorial rationale for this revision."}
```

The launcher independently binds both files' bytes and the new destination. Protected revision uses a fresh one-use public source context, validates and re-encrypts the successor, and checks admission before saving. The low-level wrapper uses the supplied credential as the successor's password; it does not ask for a different new password. Use password slot 0 for this revision workflow. Recovery slot 1 is available for Read and source disclosure. Output is an exclusive new directory containing `asset.kdna` and `revision-receipt.json`; files and directory become read-only. Recovery delivery must succeed before the save completes. A failed recovery sink removes the incomplete successor directory. An existing destination is refused. Keep the original file and its digest, close the process, then reopen the successor in a new authorized process and read the affected judgment again. A new file needs a new binding.

Missing or wrong credentials, denied source permission, expired or mismatched scope, changed edit bytes and an unbound installation fail without Read/source bodies. The receipt binds predecessor and successor bytes and rationale. Static reopening and revision retain `creation_accepted:not_evaluated`, `identity:not_verified` and `action_authorization:not_evaluated`; they do not prove editorial fitness, human acceptance or live Creation acceptance.

The accompanying [process tests](../scripts/studio-protected-host.test.cjs) exercise ordinary and password-protected create/save/close/read/revise/reopen, recovery and rejection cases. Their editorial driver is explicitly synthetic. They do not establish real Agent adoption, named Host activation, human acceptance or publication.
