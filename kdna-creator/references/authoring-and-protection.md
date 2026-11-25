# Authoring, Revision, Diffing & Local Protection (`@aikdna/kdna-cli@0.46.0`)

Use this reference for exact CLI `0.46.0` commands, single-source revision discipline, multi-password `diff`, and permanently account-free offline protection.

> **Registry note**: Run `npx -y @aikdna/kdna-cli@0.46.0` against the official npm registry by default. Only if npm times out in Mainland China, add `--registry=https://registry.npmmirror.com`. Never use `@latest` when exact reproducibility is needed.

---

## 1. CLI Surface Matrix (`0.46.0` Direct CLI vs. `0.45.2` Vendored MCP vs. `0.43.2`)

Always inspect `kdna --help` on the Host-selected CLI entry (`0.46.0` extensions and `0.45.2` commands are not in 0.43.2):

| Capability | `@aikdna/kdna-cli@0.46.0` (Direct CLI Primary) | `@aikdna/kdna-cli@0.45.2` (Offline Vendored MCP Graph) | `@aikdna/kdna-cli@0.43.2` (Older Checkout) |
| --- | --- | --- | --- |
| Scaffold a draft | `init [--mode minimal\|interview\|works\|research] [--lang en\|zh] [--example] [--output draft.json]` (cross-domain examples) | Same flags (software-leaning examples) | Author full `{manifest, payload, members}` JSON directly |
| Extended `kdna.draft/1` | Supports `creator`, `worldview`, `value_order`, `sources`, `source_refs`, `sections`, `relationships`, `exceptions`, `misuse`, `form: "rule"`, `answer_other` | Core draft fields only (`unknown_field` on extensions) | Not present |
| Pre-flight input & craft check | `validate-input <draft-or-authored.json> [--format json\|human]` (blocking errors + non-blocking advisories + typo hints) | `validate-input` (core checks) | Validate via `create` diagnostics |
| Build a `0.6.0` asset | `create --draft draft.json --output first.kdna --allow-create` or `compile` + `create` | `create --draft` or `compile` + `create` | `create authored.json --output first.kdna --allow-create` |
| Inspect / validate | `inspect [--metadata] [--format json\|human]` (`--metadata` reads outer manifest safely pre-unlock on locked files), `validate [--system] [--format json\|human]` | `inspect` (requires unlock on locked files), `validate --system` | `inspect --json`, `validate --system --json` |
| Read selected judgments | `read --mode catalog\|exact_selection --judgment-id id1,id2 --allow-read --format human\|--compact` (renders full conditional `exceptions`, `answer_other`, `formation_rule`; default `--budget` `1000000` on `catalog`/`exact_selection`, `4000000` on `whole_asset`) or `--session` | Same commands (older `human` output omits exception `when`/`replace_limit`) | `read --session --allow-read` with `selection.judgment_ids` and explicit `budget_bytes` |
| One-page author review sheet | `review <file.kdna> --allow-read [--format markdown\|human\|json] [--output review.md]` | `review` (older exception formatting) | Inspect unpacked payload manually |
| Compare two revisions | `diff <old.kdna> <new.kdna> [--format json\|human] [--verbose]` + `--left-password-*` / `--right-password-*` | `diff` (single shared password only) | Compare `source-open` JSON payloads |
| Local password protection | `protect` / `unprotect` + `--password-prompt`, `--password-env <VAR>`, `--password-file <0600-path>`, `--password-fd <n>` (with explicit plaintext-manifest notice) | `--password-file` / `--password-fd` only | Not present in 0.43.2 |
| Reopen external `.kdna` | `source-open` / `source-pack` (`source-pack` safely preserves omitted `representation_metadata`) | `source-open` / `source-pack` (must preserve full `representation_metadata`) | `source-open` / `source-pack` |

---

## 2. Standard Creation Workflow (`@aikdna/kdna-cli@0.46.0`)

Follow [co-creation-craft.md](co-creation-craft.md) for discovery and layered review, and [draft-schema-and-methods.md](draft-schema-and-methods.md) for extended `kdna.draft/1` fields:

```sh
npx -y @aikdna/kdna-cli@0.46.0 init --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.46.0 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.46.0 create --draft draft.json --output first.kdna --allow-create
```

Cold-reopen and verify in a fresh invocation before delivering to the author:

```sh
npx -y @aikdna/kdna-cli@0.46.0 inspect first.kdna --format human
npx -y @aikdna/kdna-cli@0.46.0 validate first.kdna --system --format human
npx -y @aikdna/kdna-cli@0.46.0 read first.kdna --mode catalog --allow-read --format human
npx -y @aikdna/kdna-cli@0.46.0 review first.kdna --allow-read --output first-review.md
```

Then run Tier 1 Closure & Brake Smoke Check (or Tier 2 Fresh-Context Blind Test when isolated subagents exist) on real user cases:

```sh
npx -y @aikdna/kdna-cli@0.46.0 read first.kdna \
  --mode exact_selection --judgment-id <primary-id> --allow-read --format human
```

---

## 3. Single-Source Revision Workflow (Prevent Dual-Source Drift)

### Primary Path: Revise `draft.json` (Sole Canonical Source)
For every draft-born asset, **always** edit `draft.json` — never fork edits through `source-open` while keeping an outdated `draft.json`:

1. Apply the author-confirmed changes in `draft.json` and bump `asset.version` (e.g., `1.0.0` → `1.1.0`).
2. Re-validate and compile to a **new sibling file** (never overwrite `first.kdna`):
   ```sh
   npx -y @aikdna/kdna-cli@0.46.0 validate-input draft.json --format human
   npx -y @aikdna/kdna-cli@0.46.0 create --draft draft.json --output revised.kdna --allow-create
   ```
3. Show the author substantive before-vs-after changes and affected downstream related judgments via `diff`:
   ```sh
   npx -y @aikdna/kdna-cli@0.46.0 diff first.kdna revised.kdna --format human
   ```
4. Obtain fresh author confirmation before switching active files.

### Fallback Path: External `.kdna` Without `draft.json` (or With `members[]` Attachments)
Use `source-open` → `source-pack` **only** when revising an external `.kdna` file that has no `draft.json` source (or carries binary/text `members[]` attachments):

1. Compute the original file's SHA-256 (`--expected-a`) automatically and run:
   ```sh
   npx -y @aikdna/kdna-cli@0.46.0 source-open first.kdna \
     --expected-a sha256:<file-sha256> --allow-source --output edits.json
   ```
2. **Large-file guardrail**: On 20+ judgment assets, `edits.json` can exceed 500 KB–1.2 MB due to derived `representation_metadata`. Mutate `edits.json` with a targeted Node script instead of loading tens of thousands of lines into chat context (preserve all existing `reasons`, `conditions`, `exceptions`, `misuse`, `relationships`, `sources`, `materials`, and `history`; bump versions in all four places: `manifest.version`, `manifest.judgment_version`, `payload.asset.asset_version`, `payload.asset.judgment_version`). CLI `0.46.0` `source-pack` safely reattaches `representation_metadata` if omitted; older `0.45.2` requires keeping it intact.
3. Pack to a new sibling file and run `diff`:
   ```sh
   npx -y @aikdna/kdna-cli@0.46.0 source-pack first.kdna --edits edits.json \
     --expected-a sha256:<file-sha256> --output revised.kdna --allow-source
   npx -y @aikdna/kdna-cli@0.46.0 diff first.kdna revised.kdna --format human
   ```

---

## 4. Offline Local Password Protection (Permanently Account-Free)

`kdna protect` encrypts `payload.kdnab` locally into an AEAD envelope (`scrypt-sha256` / `argon2id` + `AES-256-KW` + `AES-256-GCM`). No account, cloud key server, or network request is ever used.

### Safe Passphrase Input Channels (Ranked)

1. **`--password-prompt` (Interactive human terminal)**: Hidden TTY prompt (asks twice to confirm on `protect`; fails closed in non-TTY scripts so automation never hangs).
   ```sh
   npx -y @aikdna/kdna-cli@0.46.0 protect first.kdna --output locked.kdna --password-prompt
   ```
2. **`--password-env <VAR>` (Preferred for Agent shells & cross-platform Windows/macOS/Linux)**: The user exports the passphrase in their own shell environment outside chat; CLI reads `process.env[VAR]` once and fails closed if unset/empty. Avoids writing plaintext password files to disk and avoids non-interactive TTY / stdin conflicts.
   ```sh
   npx -y @aikdna/kdna-cli@0.46.0 protect first.kdna --output locked.kdna --password-env KDNA_PASS
   npx -y @aikdna/kdna-cli@0.46.0 read locked.kdna --mode catalog --allow-read --format human --password-env KDNA_PASS
   ```
3. **`--password-file <0600-path>` or `--password-fd <n>` (`n >= 3`)**: Use for scripts, read-only `--session` mode, or operator-bound MCP (`kdna-mcp.mjs`). **Never pass `--password-file /dev/stdin` to `--session` or MCP**, because `stdin` carries JSONL / JSON-RPC requests. Keep password files mode `0600` and remove temporary files when done.

### Mandatory Confidentiality & Lifecycle Guardrails

- **Never put a password in argv**, command lines, shell history, echoed logs, or chat messages. Only the user chooses or supplies the passphrase; never invent, log, or guess one.
- **Plaintext outer manifest warning**: `kdna protect` encrypts `payload.kdnab`, while outer `manifest` metadata (`title`, `summary`, `creator`, `keywords`, `version`) remains **plaintext** so `kdna inspect locked.kdna --metadata --format human` can show pre-unlock file metadata safely. Never place confidential secrets inside `title`, `summary`, `creator`, or `keywords`.
- **Keep plaintext authoring sources privately**: Always write `protect` to a new file (`locked.kdna`) and keep your unencrypted `draft.json` and plaintext `.kdna` privately for future revisions. State clearly that losing the passphrase makes the encrypted payload unrecoverable.
- **Pre-unlock inspection**: Run `kdna inspect locked.kdna --metadata --format human` to inspect outer manifest metadata and encryption status without unlocking the payload (pass `--password-env` / `--password-prompt` / `--password-file` / `--password-fd` when unlocking for full validation or reading).
- **Comparing encrypted revisions (`diff`)**: When both files share a passphrase, pass `--password-env <VAR>` (or `--password-prompt` / `--password-file` / `--password-fd`). When passphrases rotated between revisions (or only one file is encrypted), pass independent left/right flags:
  ```sh
  npx -y @aikdna/kdna-cli@0.46.0 diff locked-old.kdna locked-new.kdna --format human \
    --left-password-env KDNA_OLD_PASS --right-password-env KDNA_NEW_PASS
  ```
  (`--left-password-prompt`, `--left-password-file`, `--left-password-fd`, `--right-password-prompt`, `--right-password-file`, and `--right-password-fd` are also supported.)
- Local confidentiality does not imply identity verification, editorial endorsement, or action authorization.
