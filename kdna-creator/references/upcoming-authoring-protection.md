# Authoring, reading, diffing and local protection (0.6.0 assets)

## Availability: read this first

| Capability | `@aikdna/kdna-cli@0.43.2` (published) | Upcoming / not in 0.43.2 |
| --- | --- | --- |
| Author a 0.6.0 asset | `create <input.json> --output <f>.kdna --allow-create` | `init`, `compile`, `create --draft`, `validate-input` |
| Inspect / validate | `inspect --json`, `validate --system --json` | – |
| Reopen and revise | `source-open`, `source-pack` | – |
| Read several judgments | `read --session --allow-read` with an `exact_selection` JSONL request listing several `judgment_ids` | repeated `--judgment-id`, `read --compact`, `--format human` |
| Local password protection | not available | `protect` with `--password-fd` / `--password-file` |
| Compare two assets | not available | `diff` |

The "upcoming" column is being developed on an unmerged CLI branch. Those
commands are not installable from npm today. Do not tell a user to run them,
do not claim they are released, and do not invent flags. Check
`kdna --help` of the installed CLI (or run `npm view @aikdna/kdna-cli version`)
and use an upcoming command only if the installed CLI actually lists it.

## Create or revise a 0.6.0 asset

Works today (0.43.2). Follow [native-asset-authoring.md](native-asset-authoring.md)
for content and field coverage.

1. Write the author input JSON from the user's authorized materials.
2. `create authored.json --output first.kdna --allow-create`.
3. `inspect first.kdna --json` and `validate first.kdna --system --json`.
4. Revise: `source-open first.kdna --expected-a sha256:<file sha> --allow-source`,
   edit, then `source-pack first.kdna --edits revised-edits.json --expected-a sha256:<file sha> --output revised.kdna --allow-source`.
   Never overwrite the original; keep both versions.

Upcoming / not in 0.43.2 (use only when the installed CLI lists them):
`init` (scaffold input), `validate-input` (check input before compiling),
`compile` / `create --draft` (build from a draft). Run `validate-input`
before `compile` or `create`; fix every reported field rather than guessing.

## Local password protection (no account)

Upcoming / not in 0.43.2. `protect` encrypts a local asset with a password.
No account, service or network is involved, and nothing is uploaded.

- Supply the password only through `--password-fd <n>` or
  `--password-file <path>`. Never put a password in argv, a command line,
  shell history, an environment variable echoed to logs, or the chat.
- The user types or supplies the password; do not invent, store or reuse one.
  A password file must be private (mode 0600) and removed by the user when done.
- Keep the original public file; write the protected copy to a new output path.
- Losing the password means the content cannot be recovered. Say so.
- Protection is local confidentiality, not identity, publication approval or
  action authorization.

## Diff two assets

Upcoming / not in 0.43.2. `diff <a.kdna> <b.kdna>` compares two assets
(typically an old and a revised version). Both files must be user-selected.
Use `--format human` for a reader-facing summary. Report added, removed and
changed judgments from the output; do not infer unreported differences. Until
`diff` is installed, compare via `source-open` payloads as described in
native-asset-authoring.md.
