# KDNA with Antigravity

Current local runtime coordinates: MCP 0.8.0-rc.native-sections.3 / CLI 0.43.5 / Core 0.37.9 / Read 0.13.3
(contract kdna.read/0.7.0-candidate).

## 1. Install Both KDNA Skills (`kdna-loader` + `kdna-creator`)

From a `kdna-skills` checkout, install both Skills into Antigravity (`~/.gemini/antigravity/skills/`):

```sh
bash install.sh --antigravity
```

- Pass `--only loader` or `--only creator` to install a single Skill.
- Pass `--force` to update existing Skill files when upgrading a local checkout.
- Skill placement places `kdna-loader/SKILL.md` and `kdna-creator/` (`SKILL.md`, `agents/openai.yaml`, `references/co-creation-craft.md`, `references/native-asset-authoring.md`, `references/authoring-and-protection.md`, and `scripts/native-asset-review.mjs`) under `~/.gemini/antigravity/skills/`. It does not automatically grant permission to read or create `.kdna` assets.

## 2. Install or Verify the Official KDNA CLI

Requires **Node.js >= 22**. Choose either the npm package or the checkout's offline vendored graph:

```sh
# Option A — Run or install from npm
npx -y @aikdna/kdna-cli@0.43.5 --help
# or install globally:
npm install -g @aikdna/kdna-cli@0.43.5

# Option B — Offline verified local CLI inside this kdna-skills checkout
bash install-cli.sh
```

## 3. Direct CLI Workflow (Recommended Default)

When Antigravity has terminal tool access, use the official CLI directly for the exact file the user selected:

### Reading a `.kdna` Asset (`kdna-loader`)

```sh
kdna inspect /absolute/selected.kdna --format human
kdna validate /absolute/selected.kdna --system --format human
kdna read /absolute/selected.kdna --mode catalog --allow-read --format human
kdna read /absolute/selected.kdna --mode exact_selection --judgment-id <id-1>,<id-2> --allow-read --format human
```

- Always read `catalog` first and select only the 1–5 judgment IDs relevant to the current task (`0` is valid when none apply).
- Pass `--format human` or `--compact` on multi-judgment works (such as the *KDNA Whitepaper* `v1.0.1`) so output stays compact while preserving full `scope`, `boundaries`, `exceptions`, `misuse`, and `closure`.
- For password-protected `0.6.0` assets, pass `--password-file /path/to/0600-passphrase.txt` or `--password-fd <n>` (`n >= 3`) — never pass a password in `argv` or chat.

### Co-Creating, Revising, and Protecting a `.kdna` Asset (`kdna-creator`)

```sh
kdna init --mode interview --output draft.json
kdna validate-input draft.json --format human
kdna create --draft draft.json --output first.kdna --allow-create
kdna diff first.kdna revised.kdna --format human
kdna protect first.kdna --output locked.kdna --password-file ./passphrase.txt
```

- Follow [`kdna-creator/SKILL.md`](../../kdna-creator/SKILL.md), [`co-creation-craft.md`](../../kdna-creator/references/co-creation-craft.md), [`native-asset-authoring.md`](../../kdna-creator/references/native-asset-authoring.md), and [`authoring-and-protection.md`](../../kdna-creator/references/authoring-and-protection.md).
- Always retain the unencrypted authoring draft (`draft.json` / `authored.json`) and plaintext `.kdna` source (`first.kdna`) when running `kdna protect`, because future revisions (`source-open` / `source-pack` or `create --draft`) operate on plaintext source rather than encrypted `.kdna` envelopes.

## 4. Optional Operator-Bound MCP Server Configuration

When you prefer an operator-bound stdio MCP session scoped to one local `.kdna` file (`bash install-cli.sh` must be run first so `mcp-server/node_modules` is populated), configure this portable process command vector outside model-controlled tool parameters:

```json
{
  "command": "/absolute/path/to/node",
  "args": ["/absolute/installed/mcp-server/bin/kdna-mcp.mjs", "--asset", "/absolute/selected.kdna", "--allow-read"]
}
```

### Antigravity MCP Configuration (`~/.gemini/antigravity/mcp_config.json`)

Add the `kdna` server entry to `~/.gemini/antigravity/mcp_config.json` (pass `--password-file /absolute/path/to/0600-passphrase.txt` in `args` when binding a password-protected `.kdna` asset):

```json
{
  "mcpServers": {
    "kdna": {
      "command": "/absolute/path/to/node",
      "args": [
        "/absolute/installed/mcp-server/bin/kdna-mcp.mjs",
        "--asset",
        "/absolute/selected.kdna",
        "--allow-read"
      ]
    }
  }
}
```

### MCP Boundaries and Presentation Modes

No model-supplied path or initialize approval can create a binding. Do not let the model rewrite launch arguments or automatically pick files. Read `kdna.catalog` once, then request the task's required `judgment_ids` together in one `kdna.read` with an explicit budget. Expand only using an actual issued handle when the task needs that detail. `kdna.inspect` is technical only. `kdna.cancel` ends further use and closes the binding; switching assets or opening a revised file requires a new operator-controlled launch.

For `kdna.catalog`, `kdna.read` and `kdna.expand`, omitted `presentation` returns the installed Read package's body view (authored content plus one fingerprint); when that package cannot project, the default is the complete official envelope, and an explicit `presentation: "body"` is refused. Explicit `presentation: "task"` requires `view_budget_bytes` in addition to the unchanged official `budget_bytes`; full and body reject the view budget. Task mode supplies the adapter's `kdna.mcp.task-presentation/0.1.0` representation: read all canonical content, states, `verification_summary` and external `content_aliases`; do not treat alias placeholders as missing author content. Expand accepts either the old `handle` or the delivered `handle_ref`, never both. `kdna.audit` accepts only `audit_ref` and `budget_bytes` to retrieve one exact past full result; it adds no read permission or fresh verification. References are bound to the same live process/snapshot/asset/tuple/Host epoch and expire within 60 seconds, no later than the original expiry for short handles. See [presentation and capacity details](../../mcp-server/README.md#optional-task-presentation-and-exact-audit). Named Host delivery and semantic adoption on this Host remain unassessed in [`docs/agent-support-matrix.json`](../../docs/agent-support-matrix.json).
