# KDNA with GitHub Copilot-Compatible Agents

> **Status:** Unassessed adapter placement. Skill-file presence is not evidence
> of correct integration.

Use an explicit file through the official CLI:

```bash
kdna validate ./judgment.kdna
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

Some compatible Agents inspect `~/.agents/skills/kdna-loader/`, but placement
alone is not support. Do not install a broad-trigger discovery Skill. A
conforming Host must receive one exact user-approved file or attachment and
expose active identity, version or digest, scope, reason, and
disable/switch/rollback controls.

## Creation

Creation is also Unassessed. Some compatible Agents inspect
`~/.agents/skills/kdna-creator/`; the Skill calls the Studio CLI for one
explicit project:

```bash
kdna-studio resume ./my-judgment --json
```

Follow the [Creation Agent contract](../../docs/KDNA_CREATION_AGENT_CONTRACT.md).
Placement alone is not creation support evidence.
