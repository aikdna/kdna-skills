# Authoring, reading, diffing and local protection (0.6.0 assets)

## CLI surface matrix (`0.43.5` baseline vs older `0.43.2` checkouts)

Always inspect `kdna --help` on the Host-selected CLI entry so you use the exact commands installed in that environment (`0.43.5` and `0.43.3` commands are not in 0.43.2):

| Capability | `@aikdna/kdna-cli@0.43.5` (not in 0.43.2) | `@aikdna/kdna-cli@0.43.2` (older checkout) |
| --- | --- | --- |
| Scaffold a draft | `init [--mode minimal\|interview\|works\|research] [--lang en\|zh] [--example] [--output draft.json]` | Author full `{manifest, payload, members}` JSON directly |
| Pre-flight input & craft check | `validate-input <draft-or-authored.json> [--format json\|human]` | Validate via `create` diagnostics |
| Build a `0.6.0` asset | `create --draft draft.json --output first.kdna --allow-create` or `compile` + `create` | `create authored.json --output first.kdna --allow-create` |
| Inspect / validate | `inspect [--format json\|human]`, `validate [--system] [--format json\|human]` | `inspect --json`, `validate --system --json` |
| Reopen and revise | `source-open`, `source-pack` | `source-open`, `source-pack` |
| Read selected judgments | `read --mode exact_selection --judgment-id id1,id2 --allow-read --compact [--format human]` (default `--budget` is `1000000` bytes [`1 MB`] on `catalog` and `exact_selection`, and `4000000` bytes [`4 MB`] on `whole_asset`; `--compact` preserves full safety closure) or `--session` | `read --session --allow-read` with `selection.judgment_ids` and explicit `budget_bytes` |
| Local password protection | `protect <in.kdna> --output <locked.kdna> (--password-fd <n> \| --password-file <path>)` (permanently account-free, offline) | Not present in `0.43.2` |
| Compare two revisions | `diff <first.kdna> <revised.kdna> [--format json\|human]` | Compare `source-open` JSON payloads |

## Create or revise a `0.6.0` asset (`0.43.5` workflow)

Follow [co-creation-craft.md](co-creation-craft.md) for discovery and human review, and [native-asset-authoring.md](native-asset-authoring.md) for full-payload domain coverage:

1. Scaffold the matching draft mode (`init --mode interview`, `works`, `research`, or default `minimal`, optionally with `--lang zh` or `--example` for a compilable teaching template) — or prepare full `0.6.0` authored JSON when encoding custom shared declarations or attachments.
2. Run `validate-input draft.json --format human`. Resolve every blocking diagnostic (`missing_field`, `unknown_field`, `placeholder_not_replaced`, `duplicate_method_roles`) and review any non-blocking structural craft advisories (`tautological_statement`, `method_repeats_statement`, `unbounded_judgment`, `overbroad_scope`, `duplicate_focus`, `uniform_default_method`) with the author.
3. Produce the asset without replacing existing files: `create --draft draft.json --output first.kdna --allow-create` (or `compile draft.json --output authored.json` followed by `create authored.json --output first.kdna --allow-create`).
4. Verify in a separate invocation: `inspect first.kdna --format human`, `validate first.kdna --system --format human`, and `read first.kdna --mode catalog --allow-read --format human`.
5. Revise without overwriting: `source-open first.kdna --expected-a sha256:<file-sha256> --allow-source`, apply the confirmed edits, save `revised.kdna` with `source-pack`, and verify the exact delta via `diff first.kdna revised.kdna --format human`.

## Local password protection (permanently account-free, offline)

`protect` encrypts a native `0.6.0` payload locally into an AEAD envelope (`password` entitlement). Public, local, and password-protected `.kdna` creation and reading are permanently account-free — no online account, server, or network request is ever involved.

- Supply the password **only** through `--password-fd <n>` (`n >= 3`) or `--password-file <path>`. Never put a password in argv, a command line, shell history, echoed environment variables, or chat text.
- Only the user chooses or supplies the passphrase; never invent, log, or reuse one on their behalf. Keep any password file mode `0600` and remind the user to remove temporary password files when finished.
- Always write to a new output path (`locked.kdna`) while keeping both the unencrypted authoring draft (`draft.json` / `authored.json`) and the plaintext `.kdna` source file (`first.kdna`) in private author storage. `kdna protect` produces an encrypted distribution envelope (`kdna.envelope.aead`), whereas future revisions (`source-open` / `source-pack` or `create --draft`) operate on plaintext source rather than encrypted `.kdna` envelopes.
- State clearly that losing the password makes the protected payload unrecoverable.
- Pass the same `--password-file` or `--password-fd` to `inspect`, `validate`, `read`, or `diff` when working with a protected `.kdna` file. Local confidentiality is not identity verification, editorial endorsement, or action authorization.

## Diff two assets

`diff <first.kdna> <revised.kdna> [--format json|human]` compares two user-selected `.kdna` revisions at judgment granularity (identity, digests, added/removed/changed judgments, conditions, and relations). Report only the observed differences and ask for user confirmation before adopting changed judgments into an active workflow.
