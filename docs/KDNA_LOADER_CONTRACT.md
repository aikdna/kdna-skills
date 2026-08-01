# KDNA Loader Contract

> **Status:** Non-normative adapter contract. The protocol source of truth is
> `aikdna/kdna`. The current Skill implementation remains Unassessed; the MCP
> workspace adapter has source-candidate component tests, while Host delivery,
> semantic adoption, Creation-to-Consumption integration, and real-human
> acceptance remain `RECHECK_REQUIRED`, `RECHECK_REQUIRED`,
> `RECHECK_REQUIRED`, and `NOT_RUN`.

An adapter may consume only a file explicitly selected by the user or an exact
Host attachment already approved by the user. It must not make arbitrary local
files eligible by discovery, choose a judgment autonomously, or hide active
use.

For one explicit file, the current product path is the official CLI through the
loader Skill. An original instruction that already binds the exact file, task,
Host, named processor, and least projection needs no supplemental confirmation;
otherwise the Host obtains one consolidated confirmation for the missing
dimensions. The ordinary path therefore adds zero or one meaningful
confirmation and uses one `kdna load`
call, which validates and plans internally, and creates no persistent state.
Optional `validate` or `plan-load` diagnostics must not cause repeated user
approval. A protected file may add one secret authorization through bounded
stdin. The MCP candidate exposes no generic arbitrary-path file tools because
a model-supplied path is not a user file-selection receipt.

For an approved workspace relation, the adapter must pass the current Host
launch root, current workspace, and task to the official CLI resolver. Lookup
must remain between the workspace and that explicit root; it must not parse
`attachments.json` and reproduce selection logic itself.

The adapter must:

1. use official Core/CLI operations rather than parse the container;
2. preserve the resolver's `load`, `ask`, `skip`, or `block` decision;
3. run LoadPlan only after a resolver `load` decision; continue when
   `can_load_now` is true, or when the sole remaining requirement is a
   process-scoped password that the real load verifies through stdin;
4. use only the toolchain-produced Runtime Capsule projection;
5. preserve access, integrity, revocation, compatibility, conflict, and scope failures;
6. expose active identity, exact version or digest, scope, selection reason,
   authorization, and integrity;
7. provide visible CLI commands for view, disable, switch, and rollback;
8. remain subordinate to current facts, user intent, law, safety, system rules,
   and Host permissions.

One qualified Host with a real non-empty Runtime Capsule and visible,
authorized, reversible semantic adoption is sufficient for one functional
consumption completion. A multi-Host run is a separate portability benchmark,
not a requirement that every user or third-party Host install multiple Hosts.
Studio UI integration is deferred; a future implementation must reuse this
CLI/Core attachment schema and pass interoperability tests rather than create
another state authority.

The MCP/Skill layer must not expose attachment mutation tools, password values,
password tool arguments, or caller-supplied entitlement claims. A
process-scoped authorization file must be private, remain outside the
workspace, be omitted from CLI child environments, and be destroyed by its
caller on success, cancellation, or Host exit. It is only a one-use transport
for a user-approved secret: without it, protected workspace loading returns
structured `authorization_required`; a rejected secret is never echoed.
Ordinary public assets do not read or require the provider. Attachment consent
does not authorize Capsule delivery to a processor: the Host must separately
bind the exact attachment, workspace, Host identity, named destination and
least projection after one plain-language approval. The current adapter accepts
only named processing destinations; verifiable local-only processing remains
deferred. A Host may atomically replace newly approved consent at the same
private path, while mid-load drift suppresses the Capsule. The
adapter must not scan a global directory,
maintain hidden version choices, silently combine assets, or use output quality
as a success condition. Applicability decisions are limited to the exact set
of attachments the user already approved.
