# KDNA with Your Agent (`kdna-skills`)

English | [简体中文](./README.zh.md) · [Website](https://aikdna.com) · [Case Studies & Benchmarks](https://aikdna.com/en/explore/systems) · [KDNA Reader (macOS)](https://aikdna.com/en/downloads) · [Integration Guide](https://aikdna.com/en/docs/integrations)

**Agent Skills (`kdna-creator`, `kdna-loader`) and local MCP server for co-creating, reading, and revising `.kdna` judgment works.**

When you work with Claude Code, Codex, Cursor, OpenCode, Copilot, or Antigravity, these skills teach your agent how to distill real experience, writings, or reference corpora into structured `.kdna` judgment works, how to protect sensitive files locally with a passphrase, and how to read only the judgments relevant to a task with their premises, conditional exceptions, and stop-boundaries intact.

Every workflow here is **permanently account-free** and runs locally on **Node.js `>=22`**.

---

## Zero-Clone Quickstart (Start in 10 Seconds)

You do **not** need to clone this repository just to create or use a `.kdna` work. Point any tool-capable Agent (Node.js `>=22`) directly at `@aikdna/kdna-cli@0.46.0` and the live entry guides:

- **Create a `.kdna` work (`create.md`)**: Give your Agent [`https://aikdna.com/create.md`](https://aikdna.com/create.md) (Mainland China mirror: [`https://aikdna.cn/create.md`](https://aikdna.cn/create.md)) and ask it to guide you through `works`, `interview`, or `research` creation using `npx -y @aikdna/kdna-cli@0.46.0`.
- **Use a received `.kdna` work (`use.md`)**: Give your Agent [`https://aikdna.com/use.md`](https://aikdna.com/use.md) (Mainland China mirror: [`https://aikdna.cn/use.md`](https://aikdna.cn/use.md)) alongside any `.kdna` file path.
- **Direct CLI one-liner**:
  ```sh
  npx -y @aikdna/kdna-cli@0.46.0 --help
  # Or install globally:
  npm install -g @aikdna/kdna-cli@0.46.0
  # Mainland China timeout fallback only:
  npx --registry=https://registry.npmmirror.com -y @aikdna/kdna-cli@0.46.0 --help
  ```

---

## Optional Persistent Skills Install (`kdna-creator` + `kdna-loader`)

Install both Skills locally when you want deep multi-file staging craft, 16-method role references, and persistent Host skill discovery without fetching remote URLs each time:

```sh
git clone https://github.com/aikdna/kdna-skills && cd kdna-skills
bash install.sh --claude      # or: --codex | --cursor | --opencode | --copilot | --antigravity | --dir <skills-root>
# Optional: offline vendored read-only graph for local MCP server (@aikdna/kdna-mcp-server@0.8.4):
bash install-cli.sh
```

| Agent Host | Install Command (`install.sh` places both `kdna-loader` and `kdna-creator`) |
| --- | --- |
| Claude Code | `bash install.sh --claude` (`~/.claude/skills/`) |
| Codex | `bash install.sh --codex` (`~/.codex/skills/`) |
| Cursor | `bash install.sh --cursor` (`~/.cursor/skills/`) |
| OpenCode / Copilot | `bash install.sh --opencode` or `--copilot` (`~/.agents/skills/`) |
| Antigravity | `bash install.sh --antigravity` (`~/.gemini/antigravity/skills/`) |
| Custom directory | `bash install.sh --dir /path/to/skills` |

- `install.sh` installs **both** [`kdna-loader`](./kdna-loader/SKILL.md) (task-scoped selective reading, `--password-env` unlock, multi-asset conflict arbitration) and [`kdna-creator`](./kdna-creator/SKILL.md) (3-path craft, extended `kdna.draft/1` schema, large-corpus `.kdna-work/` staging, honest 2-tier verification, single-source `draft.json` revision, and offline protection). Re-running with identical files exits `0`; modified local files exit `2` with a `diff -u` hint unless `--force` is passed (`--only loader|creator` is also supported).

---

## Starter Prompts (Copy & Paste to Your Agent)

Try these directly in Claude Code, Cursor, Codex, OpenCode, Copilot, or Antigravity (requires **Node.js `>=22`**). For human reading on macOS, download **KDNA Reader (macOS Desktop)** at [`aikdna.com/en/downloads`](https://aikdna.com/en/downloads), explore our official bilingual domain exemplars and 192-run clean benchmarks at [`aikdna.com/en/explore/systems`](https://aikdna.com/en/explore/systems) ([Human-Sounding Writing `v1.0.1`](https://aikdna.com/en/explore/human-writing) · [Code Review `v1.0.2`](https://aikdna.com/en/explore/code-review)), or download **KDNA Whitepaper `v1.0.2`** (*《KDNA白皮书》* by Zhang Ling / 张零, `CC BY 4.0`, `45` judgments) directly in [English (`.kdna`)](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna), [Chinese (`.kdna`)](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna), or [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets):

1. **Direct-read the official *KDNA Whitepaper* `v1.0.2` (zero repo setup):**
   > *"Download `kdna-whitepaper-1.0.2.en.kdna` from `https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna`, run `npx -y @aikdna/kdna-cli@0.46.0 read kdna-whitepaper-1.0.2.en.kdna --mode catalog --format human --allow-read` to inspect the 45-question catalog, and then read only the relevant judgments for my question via `--mode exact_selection --judgment-id <id1,id2> --format human --allow-read` (never call `--mode whole_asset` expecting judgment prose)."*
2. **Apply any local `.kdna` work to a real task (using `/use.md` or `kdna-loader`):**
   > *"Follow `https://aikdna.com/use.md` (or `kdna-loader`) with `/absolute/path/work.kdna` for this task: `<your task>`. Read `--mode catalog --format human --allow-read` first, select only the 1–5 relevant judgment IDs via `--mode exact_selection --format human` (`0` is valid if none apply), preserve boundaries and conditional exceptions, and tell me which judgments shaped your answer."*
3. **Co-create a new `.kdna` judgment work (zero-clone `/create.md` or installed `kdna-creator`):**
   > *"Follow `https://aikdna.com/create.md` (or `kdna-creator/SKILL.md`) with `npx -y @aikdna/kdna-cli@0.46.0` to help me turn my experience, writings, or authorized reference materials on `<topic>` into a validated `0.6.0` `.kdna` work (show me a layered `Adopt / Revise / Reject` review table and `kdna review` proof sheet before delivering `<folder>/first.kdna`)."*
4. **Compare two versions before adopting an update:**
   > *"Compare `first.kdna` and `revised.kdna` with `npx -y @aikdna/kdna-cli@0.46.0 diff first.kdna revised.kdna --format human`, explain which judgments, boundaries, or exceptions changed, and wait for my confirmation before switching files."*

---

## Optional: Local stdio MCP Server (`@aikdna/kdna-mcp-server@0.8.4` · `mcp-server/`)

For MCP-capable clients that prefer structured tool calls over shell execution, [`mcp-server/`](./mcp-server/README.md) (`@aikdna/kdna-mcp-server@0.8.4` on npm, running on its verified offline read-only `0.45.2` / Core `0.37.11` / Read `0.13.5` graph) provides a strictly read-only, single-file OS-`argv`-bound local stdio MCP server without broad filesystem scanning. Host setup guides live in [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md) and [`integrations/`](./integrations).

---

## Three Built-In Collaboration Guardrails

1. **Authorship and verification stay honest.** `kdna-creator` keeps author stance, editorial synthesis, and external `sources` distinct, never asks non-experts to certify domain truth, and never calls same-session self-rehearsal a "blind test".
2. **Never unzip `.kdna` containers as raw text.** `kdna-loader` always enters through `kdna read` (`catalog` → `exact_selection`) so supporting premises, boundaries, conditional exceptions, and conflict brakes stay attached.
3. **Explicit user choice per task.** Installing a skill or keeping a `.kdna` file on disk never activates it silently across unrelated sessions, and reading content never grants file-write, network, or external execution authority.

---

## Repository Verification & License

```sh
node scripts/check-current-names.mjs
node scripts/validate-creation-agent.js
node scripts/validate-agent-support.js
node --test scripts/test-*.mjs
```

Code is licensed under [Apache-2.0](./LICENSE).
