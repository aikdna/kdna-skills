# Current terminal session adapter

Use the Host's approved installation, preferably its explicit local `node_modules/.bin/kdna-studio` path or `npx --no-install` from that installation. Check `current-studio-binding.json` and the separate installation receipt before reading material. Never search global binaries or install latest as a fallback. The archive declarations describe expected bytes; `declared_not_authenticated` is not executable identity proof.

The private stdin/stdout Agent pipe is separate from the adoption endpoint. Keep private stdout out of public logs. Use a separately owned fd3 as `--human-fd 3`, or, for express delegated editorial authority, `--agent-adoption-fd 3 --delegation-record FILE`. The JSON record contains only nonempty `coordinate` and `statement` for existing authority. It does not grant itself authority. A human reply stays human-declared; an Agent adoption stays delegated-Agent editorial. Local I/O and file permissions do not prove local model processing; if required locality cannot be attested, stop before reading.

The session accepts explicit `--text`/`--interview` files and `--out NEW_DIRECTORY`. `--synthetic-fixture` labels tests. An interview asks through the selected live adoption channel. JSONL operations are private orchestration, not a public asset wire.

| Operation | Input |
| --- | --- |
| brief | title and scope |
| propose | local judgment key and at least two alternatives |
| revise | same local key, exact baseRevision, replacements and explanation |
| review | actual selection or final adoption reply |
| preview | complete current pre-compiler mapping |
| status | inspect current state |
| export | one exclusive saved/readback/completed bundle |

Alternative fields are `localKey,title,subject,scope,statement,rationale,materials`; material ordinals start at 1. Optional fields are `method,formationRule,publicSources,publicNotices`. Do not replace missing method or missing own arrays with null or empty arrays. Typed content comes from the sole public component descriptor. The Agent must supply the meaning; Studio does not infer or fabricate it.

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
