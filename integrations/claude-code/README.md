# KDNA with Claude Code

Current local MCP runtime coordinates: MCP 0.8.4 / vendored CLI 0.45.2 / Core 0.37.11 / Read 0.13.5
(contract kdna.read/0.7.0-candidate). Direct CLI authoring and reading use `@aikdna/kdna-cli@0.46.0`.

## 1. Install Both KDNA Skills (`kdna-loader` + `kdna-creator`)

From a `kdna-skills` checkout, install both Skills into Claude Code (`~/.claude/skills/`):

```sh
bash install.sh --claude
```

- Pass `--only loader` or `--only creator` to install a single Skill.
- Pass `--force` to update existing Skill files when upgrading a local checkout.
- Skill placement places `kdna-loader/SKILL.md` and `kdna-creator/` (`SKILL.md`, `agents/openai.yaml`, `references/co-creation-craft.md`, `references/draft-schema-and-methods.md`, `references/authoring-and-protection.md`, `references/native-asset-authoring.md`, and `scripts/native-asset-review.mjs`) under `~/.claude/skills/`. It does not automatically grant permission to read or create `.kdna` assets.

## 2. Install or Verify the Official KDNA CLI

Requires **Node.js >= 22**. Choose either the npm package (recommended for `0.46.0` authoring & reading) or the checkout's offline vendored graph (powers MCP `0.8.4`):

```sh
# Option A — Run or install from npm (add --registry=https://registry.npmmirror.com only on CN timeout)
npx -y @aikdna/kdna-cli@0.46.0 --help
# or install globally:
npm install -g @aikdna/kdna-cli@0.46.0

# Option B — Offline verified read-only graph inside this kdna-skills checkout (CLI 0.45.2 for MCP 0.8.4)
bash install-cli.sh
```

## 3. Direct CLI Workflow (Recommended Default)

When Claude Code has Bash tool access, use `@aikdna/kdna-cli@0.46.0` directly for the exact file the user selected:

### Reading a `.kdna` Asset (`kdna-loader`)

```sh
kdna inspect /absolute/selected.kdna --format human
kdna validate /absolute/selected.kdna --system --format human
kdna read /absolute/selected.kdna --mode catalog --allow-read --format human
kdna read /absolute/selected.kdna --mode exact_selection --judgment-id <id-1>,<id-2> --allow-read --format human
```

- Always read `catalog` first and select only the 1–5 judgment IDs relevant to the current task (`0` is valid when none apply).
- Pass `--format human` or `--compact` on multi-judgment works (such as the *KDNA Whitepaper* `v1.0.2`) so output stays compact while preserving full `scope`, `boundaries`, conditional `exceptions`, `misuse`, and `closure`.
- For password-protected `0.6.0` assets, pass `--password-env <VAR>` (user exports outside chat), `--password-prompt` (interactive TTY), `--password-file /path/to/0600-passphrase.txt`, or `--password-fd <n>` (`n >= 3`) — never pass a password in `argv` or chat, and never use `/dev/stdin` with `--session`.

### Co-Creating, Revising, and Protecting a `.kdna` Asset (`kdna-creator`)

```sh
kdna init --mode interview --output draft.json
kdna validate-input draft.json --format human
kdna create --draft draft.json --output first.kdna --allow-create
kdna review first.kdna --allow-read
kdna diff first.kdna revised.kdna --format human
# Interactive hidden TTY prompt (or --password-env KDNA_PASS in Agent shells; outer manifest stays plaintext):
kdna protect first.kdna --output locked.kdna --password-prompt
```

- Follow [`kdna-creator/SKILL.md`](../../kdna-creator/SKILL.md), [`co-creation-craft.md`](../../kdna-creator/references/co-creation-craft.md), [`draft-schema-and-methods.md`](../../kdna-creator/references/draft-schema-and-methods.md), [`authoring-and-protection.md`](../../kdna-creator/references/authoring-and-protection.md), and [`native-asset-authoring.md`](../../kdna-creator/references/native-asset-authoring.md).
- Keep `draft.json` as the sole canonical source for revisions (edit `draft.json` → `create --draft` → `kdna diff`), and retain plaintext `draft.json` + `.kdna` privately alongside any `kdna protect` output.

## 4. Optional Operator-Bound MCP Server Configuration

When you prefer an operator-bound stdio MCP session scoped to one local `.kdna` file (`bash install-cli.sh` must be run first so `mcp-server/node_modules` is populated), configure this portable process command vector outside model-controlled tool parameters:

```json
{
  "command": "/absolute/path/to/node",
  "args": ["/absolute/installed/mcp-server/bin/kdna-mcp.mjs", "--asset", "/absolute/selected.kdna", "--allow-read"]
}
```

### Claude Code MCP Configuration (`.mcp.json` or `claude mcp add`)

Add the `kdna` server to a project-scoped `.mcp.json` (for password-protected `.kdna` assets, pass `--password-file /absolute/path/to/0600-passphrase.txt` or `--password-fd <n>` in `args` — never `--password-file /dev/stdin`):

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

Or register via the Claude Code CLI:

```sh
claude mcp add kdna -- /absolute/path/to/node /absolute/installed/mcp-server/bin/kdna-mcp.mjs --asset /absolute/selected.kdna --allow-read
```

### MCP Boundaries and Presentation Modes

No model-supplied path or initialize approval can create a binding. Do not let the model rewrite launch arguments or automatically pick files. Read `kdna.catalog` once, then request the task's required `judgment_ids` together in one `kdna.read` with an explicit budget. Expand only using an actual issued handle when the task needs that detail. `kdna.inspect` is technical only. `kdna.cancel` ends further use and closes the binding; switching assets or opening a revised file requires a new operator-controlled launch.

For `kdna.catalog`, `kdna.read` and `kdna.expand`, omitted `presentation` returns the installed Read package's body view (authored content plus one fingerprint); when that package cannot project, the default is the complete official envelope, and an explicit `presentation: "body"` is refused. Explicit `presentation: "task"` requires `view_budget_bytes` in addition to the unchanged official `budget_bytes`; full and body reject the view budget. Task mode supplies the adapter's `kdna.mcp.task-presentation/0.1.0` representation: read all canonical content, states, `verification_summary` and external `content_aliases`; do not treat alias placeholders as missing author content. Expand accepts either the old `handle` or the delivered `handle_ref`, never both. `kdna.audit` accepts only `audit_ref` and `budget_bytes` to retrieve one exact past full result; it adds no read permission or fresh verification. References are bound to the same live process/snapshot/asset/tuple/Host epoch and expire within 60 seconds, no later than the original expiry for short handles. See [presentation and capacity details](../../mcp-server/README.md#optional-task-presentation-and-exact-audit). Named Host delivery and semantic adoption on this Host remain unassessed in [`docs/agent-support-matrix.json`](../../docs/agent-support-matrix.json).
