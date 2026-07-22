# KDNA Loader Contract

> **Status:** Non-normative adapter contract. The protocol source of truth is
> `aikdna/kdna`. The current Skill implementation remains Unassessed; the MCP
> workspace adapter is a two-Host-verified source candidate pending exact
> dependency publication and release acceptance.

An adapter may consume only a file explicitly selected by the user or an exact
Host attachment already approved by the user. It must not make arbitrary local
files eligible by discovery, choose a judgment autonomously, or hide active
use.

For an approved workspace relation, the adapter must pass the current Host
workspace and task to the official CLI resolver. It must not parse
`attachments.json` and reproduce selection logic itself.

The adapter must:

1. use official Core/CLI operations rather than parse the container;
2. preserve the resolver's `load`, `ask`, `skip`, or `block` decision;
3. run LoadPlan only after `load` and continue only when `can_load_now` is true;
4. use only the toolchain-produced Runtime Capsule projection;
5. preserve access, integrity, revocation, compatibility, conflict, and scope failures;
6. expose active identity, exact version or digest, scope, selection reason,
   authorization, and integrity;
7. provide visible CLI commands for view, disable, switch, and rollback;
8. remain subordinate to current facts, user intent, law, safety, system rules,
   and Host permissions.

The MCP/Skill layer must not expose attachment mutation tools, password values,
or caller-supplied entitlement claims. It must not scan a global directory,
maintain hidden version choices, silently combine assets, or use output quality
as a success condition. Applicability decisions are limited to the exact set of
attachments the user already approved.
