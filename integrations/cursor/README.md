# KDNA with Cursor

> **Status:** Unassessed adapter placement. Skill-file presence is not evidence
> of correct integration.

Use an explicit file through the official CLI:

```bash
kdna validate ./judgment.kdna
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

The candidate Skill path is `~/.cursor/skills/kdna-loader/`. Do not install it
as a broad-trigger discovery Skill. A conforming Cursor Host must receive one
exact user-approved file or attachment and expose active identity, version or
digest, scope, reason, and disable/switch/rollback controls.
