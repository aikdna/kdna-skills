# KDNA with Your Agent (`kdna-skills`)

English | [简体中文](./README.zh.md) · [Website](https://aikdna.com) · [KDNA Reader](https://aikdna.com/reader/) · [Integration Guide](https://aikdna.com/en/docs/integrations)

**Agent Skills (`kdna-creator`, `kdna-loader`) and local MCP server for co-creating, reading, and revising `.kdna` judgment works.**

When you work with Claude Code, Codex, Cursor, OpenCode, Copilot, or Antigravity, these skills teach your agent how to help distill real experience and source materials into structured `.kdna` judgment works, how to protect sensitive files locally with a password, and how to read only the judgments relevant to a task with their premises and boundaries intact—without flattening your specific trade-offs into generic boilerplate.

Every workflow here is **permanently account-free** and runs locally on **Node.js `>=22`**.

---

## 60-Second Setup

```sh
git clone https://github.com/aikdna/kdna-skills && cd kdna-skills
bash install-cli.sh           # installs the verified offline local CLI inside this checkout
bash install.sh --claude      # or: --codex | --cursor | --opencode | --copilot | --antigravity | --dir <skills-root>
```

| Agent Host | Install Command (`install.sh` places both `kdna-loader` and `kdna-creator`) |
| --- | --- |
| Claude Code | `bash install.sh --claude` (`~/.claude/skills/`) |
| Codex | `bash install.sh --codex` (`~/.codex/skills/`) |
| Cursor | `bash install.sh --cursor` (`~/.cursor/skills/`) |
| OpenCode / Copilot | `bash install.sh --opencode` or `--copilot` (`~/.agents/skills/`) |
| Antigravity | `bash install.sh --antigravity` (`~/.gemini/antigravity/skills/`) |
| Custom directory | `bash install.sh --dir /path/to/skills` |

- `install.sh` installs **both** [`kdna-loader`](./kdna-loader/SKILL.md) (task-scoped selective reading) and [`kdna-creator`](./kdna-creator/SKILL.md) (guided interviews, distillation from existing works, research synthesis, and revisions) for the host you choose. Re-running with identical files exits `0`; modified local files exit `2` with a `diff -u` hint unless `--force` is passed (`--only loader|creator` is also supported).
- Prefer a global CLI install? Run `npm install -g @aikdna/kdna-cli@0.43.4` (`init`, `validate-input`, `compile`, `create --draft`, `protect`, `validate`, `read`, `diff`).

---

## Three Starter Prompts

Once installed, try any of these directly in your agent session (you can also download or inspect **KDNA Whitepaper v1.0.0**—*《KDNA白皮书》* by Zhang Ling / 张零, `CC BY 4.0`, `45` judgments—via [KDNA Reader](https://aikdna.com/reader/?sample=kdna-whitepaper) or [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets)):

1. **Apply a `.kdna` work to a real task (without judgment pollution):**
   > *"Use `kdna-loader` with the `.kdna` file at `/absolute/path/work.kdna` for this task: `<your task>`. Read `catalog` first, select only the judgment IDs relevant to this task (or none if none fit), apply them with their conditions and stop boundaries, and tell me which judgments shaped your answer."*
2. **Co-create a new `.kdna` judgment work (interview, existing works, or research):**
   > *"Help me co-create a `.kdna` judgment work on `<topic>` using `kdna-creator`. Interview me on 1–2 concrete trade-offs at a time (or distill `<my-notes.md>`), show me a clear review table (`Adopt / Revise / Reject`) before compiling, run `validate-input`, and save the result to `<folder>/first.kdna`."*
3. **Compare two versions before adopting an update:**
   > *"Compare `first.kdna` and `revised.kdna` with `kdna diff --format human`, explain which judgments or boundaries were added, removed, or tightened, and wait for my confirmation before switching to the revised file."*

---

## Optional: Local stdio MCP Server (`mcp-server/`)

For MCP-capable clients that prefer structured tool calls over shell execution, [`mcp-server/`](./mcp-server/README.md) provides a local stdio MCP server exposing scoped `catalog`, `exact_selection`, and expansion reads without broad filesystem scanning. Host setup guides live in [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md) and [`integrations/`](./integrations).

---

## Three Built-In Collaboration Guardrails

1. **Authorship stays honest.** `kdna-creator` keeps your source material, AI-suggested drafts, and your confirmed positions distinct—never inventing personal history or real-world outcomes.
2. **Never unzip `.kdna` containers as raw text.** `kdna-loader` always enters through `kdna read` (`catalog` → `exact_selection`) so required supporting premises, boundaries, and misuse warnings stay attached to every selected judgment.
3. **Explicit user choice per task.** Installing a skill or keeping a `.kdna` file on disk never activates it silently across unrelated sessions, and reading content never grants file-write, network, or external execution authority.

---

## Repository Verification & License

```sh
node scripts/check-current-names.mjs
node scripts/validate-creation-agent.js
node scripts/validate-agent-support.js
```

Code is licensed under [Apache-2.0](./LICENSE).
