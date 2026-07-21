# KDNA Loader Contract

> **Status:** Non-normative adapter contract. The protocol source of truth is
> `aikdna/kdna`. The current Skill implementation is Unassessed.

An adapter may consume only a file explicitly selected by the user or an exact
Host attachment already approved by the user. It must not make arbitrary local
files eligible by discovery, choose a judgment autonomously, or hide active
use.

The adapter must:

1. use official Core/CLI operations rather than parse the container;
2. run LoadPlan and continue only when `can_load_now` is true;
3. use only the toolchain-produced Runtime Capsule projection;
4. preserve access, integrity, revocation, and scope failures;
5. expose active identity, exact version or digest, scope, and selection reason;
6. provide disable, switch, and rollback control;
7. remain subordinate to current facts, user intent, law, safety, system rules,
   and Host permissions.

Discovery and matching APIs may support an application UI, but their output is
not consent or authority. Any future automatic applicability decision is
limited to the exact set of attachments the user already approved.
