# KDNA with Your Agent (`kdna-skills`)

English | [简体中文](./README.zh.md) · [Website](https://aikdna.com) · [KDNA Reader (macOS)](https://aikdna.com/en/downloads) · [Integration Guide](https://aikdna.com/en/docs/integrations)

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
- Prefer a global CLI install? Run `npm install -g @aikdna/kdna-cli@0.43.5` (`init`, `validate-input`, `compile`, `create --draft`, `protect`, `validate`, `read`, `diff`).

---

## Starter Prompts (Copy & Paste to Your Agent)

Try these directly in Claude Code, Cursor, Codex, OpenCode, Copilot, or Antigravity (requires **Node.js `>=22`**). For human reading on macOS, download **KDNA Reader (macOS Desktop)** at [`aikdna.com/en/downloads`](https://aikdna.com/en/downloads), or download **KDNA Whitepaper `v1.0.1`** (*《KDNA白皮书》* by Zhang Ling / 张零, `CC BY 4.0`, `45` judgments) directly in [English (`.kdna`)](https://aikdna.com/downloads/whitepaper/v1.0.1/kdna-whitepaper-1.0.1.en.kdna), [Chinese (`.kdna`)](https://aikdna.com/downloads/whitepaper/v1.0.1/kdna-whitepaper-1.0.1.zh-CN.kdna), or [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets):

1. **Direct-read the official *KDNA Whitepaper* `v1.0.1` with your Agent (zero repo setup needed):**
   > *"Download `kdna-whitepaper-1.0.1.en.kdna` from `https://aikdna.com/downloads/whitepaper/v1.0.1/kdna-whitepaper-1.0.1.en.kdna`, run `npx -y @aikdna/kdna-cli@0.43.5 read kdna-whitepaper-1.0.1.en.kdna --mode catalog --format human --allow-read` to inspect the 45-question catalog, and then read the relevant judgments for my question via `--mode exact_selection --judgment-id <id1,id2> --format human --allow-read` (always pass `--format human` or `--compact` to keep context lean; never call `--mode whole_asset` expecting judgment prose)."*
2. **Apply any local `.kdna` work to a real task (without judgment pollution):**
   > *"Use `kdna-loader` with the `.kdna` file at `/absolute/path/work.kdna` for this task: `<your task>`. Read `--mode catalog --format human --allow-read` first, select only the 1–5 judgment IDs relevant to this task via `--mode exact_selection --format human` (or none if none fit; do not use `whole_asset`), apply them with their conditions and stop boundaries, and tell me which judgments shaped your answer."*
3. **Co-create a new `.kdna` judgment work (interview, existing works, or reference synthesis):**
   > *"Clone `https://github.com/aikdna/kdna-skills`, run `bash install-cli.sh` and `bash install.sh --claude` (or your Host flag), read `kdna-creator/SKILL.md`, and help me turn my experience, existing works, or trusted reference materials on `<topic>` into a validated `0.6.0` `.kdna` work via the `kdna.draft/1` workflow (show me an `Adopt / Revise / Reject` review table before compiling to `<folder>/first.kdna`)."*
4. **Compare two versions before adopting an update:**
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
