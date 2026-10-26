# Current terminal session adapter

Use the Host's approved installation, preferably its explicit local `node_modules/.bin/kdna-studio` path or `npx --no-install` from that installation. Check `current-studio-binding.json` and the separate installation receipt before reading material. Never search global binaries or install latest as a fallback. The archive declarations describe expected bytes; `declared_not_authenticated` is not executable identity proof.

The private stdin/stdout Agent pipe is separate from the adoption endpoint. Keep private stdout out of public logs. Use a separately owned fd3 as `--human-fd 3`, or, for express delegated editorial authority, `--agent-adoption-fd 3 --delegation-record FILE`. The JSON record contains only nonempty `coordinate` and `statement` for existing authority. It does not grant itself authority. A human reply stays human-declared; an Agent adoption stays delegated-Agent editorial. Local I/O and file permissions do not prove local model processing; if required locality cannot be attested, stop before reading.

The session accepts explicit `--text`/`--interview` files and `--out NEW_DIRECTORY`. `--synthetic-fixture` labels tests. An interview asks through the selected live adoption channel. JSONL operations are private orchestration, not a public asset wire.

| Operation | Input |
| --- | --- |
| brief | title and scope |
| propose | local judgment key and at least two alternatives |
| revise | same local key, exact baseRevision, replacements and explanation |
| system | declared system layer: optional `worldview`/`value_order` (`{statement,items}`), `relations` over judgment local keys, `boundaries` (named refusal until the identity-model unit) |
| review | actual selection or final adoption reply |
| preview | complete current pre-compiler mapping |
| status | inspect current state |
| export | one exclusive saved/readback/completed bundle |

Alternative fields are `localKey,title,subject,scope,statement,rationale,materials`; material ordinals start at 1. The input grammar permits optional `method,formationRule,publicSources,publicNotices`, but the current Studio exporter rejects method absence with `CREATION_METHOD_REQUIRED`. Its supported export needs an explicitly complete method and required roles. Do not replace missing method or missing own arrays with null or empty arrays, or fabricate a method. Typed content comes from the sole public component descriptor. The Agent must supply the meaning; Studio does not infer or fabricate it.

Review the system-layer cues the brief and materials actually carry — a stance stated across the work, an ordered value in the author's words, signals of support, complement, qualification or open disagreement — with the signal-table discipline in [native-asset-authoring.md](native-asset-authoring.md) §"When the author's words carry a relation": ask about the signal, record the actual answer, and leave silence unrecorded; do not force the layer to be non-empty. Declare it with `system`; its judgment keys are syntactic at declaration time and resolve against the selected set when the preview compiles — unknown `CREATION_SYSTEM_JUDGMENT_UNKNOWN`, proposed but unselected `CREATION_SYSTEM_JUDGMENT_UNSELECTED`. Boundary signals stay open on this surface: `boundaries` is refused by name (`CREATION_BOUNDARIES_ACTOR_REQUIRED`) until the identity-model unit, and must not be re-encoded as a worldview, an ordinary judgment or a relation to make it fit.

A review emits `adoption_reply` containing actual text, the current review and `replyTo`. Send exactly one interpretation with the same ticket. Select names one current alternative per judgment; note/reject/confirm have no choices. Example:

```json
{"id":"select-current","op":"interpret","data":{"replyTo":"COPY_CURRENT_TICKET","kind":"select","choices":[{"judgmentLocalKey":"signal","alternativeLocalKey":"preserve"}]}}
```

For a final reply interpreted as confirmation:

```json
{"id":"confirm-current","op":"interpret","data":{"replyTo":"COPY_NEW_CURRENT_TICKET","kind":"confirm"}}
```

Never inject reviewer text into the Agent pipe, forge a role, manufacture a ticket, or reuse a decision from an earlier context. A real Agent given editorial authority must actually consider the alternatives and state its choice on its own channel. Synthetic provider execution does not satisfy that step. Revision invalidates the current preview. EOF, failure or abort ends the process; there is no persistent replay/resume. One request is active and frames are bounded; do not pipeline an unbounded queue.

Outputs are never replaced. The new private bundle has exact `asset.kdna`, detached private evidence/binding, live save verification, and version2 completion written last. `kdna.studio-creation-evidence/2` is current. Static verify cannot recreate `accepted_with_live_context`; it retains not_evaluated and unavailable. Public Read requires explicit local permission and grants no action. Legacy evidence is noncurrent here and remains with its old accepted graph; missing historical pins stay UNKNOWN.

Creator behavior requires a separate independent forward evaluation with actual Agent decisions and an authorized real task. Static document checks and synthetic CLI I/O tests cannot replace that evaluation. No new whole-project or publication acceptance is asserted by this adapter.

## Current package and container scope

The [exact archive binding](current-studio-binding.json) selects the local stable candidate: StudioCLI `0.13.0`, StudioCore `4.0.0`, Core `0.37.2` and Read `0.11.3`. The Studio session produces container `0.5` with `kdna.read/0.6.4`. Static CLI `read` and `verify` apply to public output; they do not unlock protected output. Use the [local protection Host](studio-protected-host.md) for public or protected saved-byte Read and separately permitted source revision. Its trusted launcher supplies authorization and credentials independently of the Agent. NativeCLI `0.43.2` uses container `0.6` and Read `0.7.0-candidate`. Its ordinary read route does not consume the Studio container; the explicit conversion step below is the only established route from a sealed Studio bundle into `0.6`. Same companion package versions do not by themselves establish conversion or cross-reader support.

## Bringing a delivered bundle into 0.6

A delivered Studio bundle is a sealed unit: a read-only directory holding `asset.kdna` and the detached evidence files. To obtain a container `0.6` file from it, use the explicit step `kdna-studio export06 --bundle DIR [--output FILE] [--kdna EXECUTABLE]`. It invokes the published native CLI's `convert` on `asset.kdna`, supplies that file's own digest reading itself, and writes a new file — the sibling `DIR.0.6.kdna` unless `--output` names another. The sealed bundle is never written.

- CLI selection: `--kdna EXECUTABLE`, then `KDNA_CLI_BIN`, then `kdna` on `PATH`. When none is found the step is the named refusal `CLI_KDNA_CONVERT_MISSING` with public acquisition guidance; it never falls back to a private conversion path.
- Converter refusals pass through by their own names: `MIGRATION_SOURCE_UNSUPPORTED_VERSION` for historical generations, `MIGRATION_SOURCE_PROTECTED_UNSUPPORTED` for protected containers, `MIGRATION_SOURCE_EXTENSION_UNSUPPORTED` for member extensions such as `checksums.json`. An existing output is refused, not renamed.
- The converted file belongs to the `0.6` read stack. It carries the already-adopted Studio content; conversion is not authoring, source revision of converted bytes is not established by this step, and the original bundle and its evidence are never changed.
