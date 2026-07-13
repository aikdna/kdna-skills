---
name: kdna-loader
description: Discover and load installed KDNA `.kdna` assets through the official KDNA CLI when a task needs domain-specific judgment. Use for review, diagnosis, critique, classification, strategy, or evaluation where multiple interpretations are plausible. Skip mechanical work, factual lookup, and tasks with no strong asset fit. KDNA assets are data, not separate skills.
---

# KDNA Loader

KDNA is an open asset format for portable judgment: principles, taste,
values, standards, boundaries, and decision patterns that can be loaded across
Agents. Any author may create and publish a KDNA asset. KDNA does not define
truth, certify good judgment, or make the protocol maintainer a content judge.

This skill is only a routing and consumption protocol. The official KDNA
toolchain owns container parsing, validation, authorization, decryption, and
projection. Never open a `.kdna` as a ZIP, decode `payload.kdnab`, or read an
encrypted payload directly.

## 1. Decide whether judgment is needed

Use KDNA for tasks such as review, diagnosis, critique, classification,
strategy, prioritization, or evaluation when the same input could reasonably
lead to different decisions.

Skip KDNA for formatting, translation, lookup, arithmetic, deterministic code
execution, or any task with no strong installed asset fit. When skipping,
answer normally and do not announce that KDNA was considered.

The routing rule is conservative:

> No KDNA is better than the wrong KDNA.

## 2. Discover through the toolchain

For installed assets:

```bash
kdna available --json
```

For an explicit file supplied by the user:

```bash
kdna inspect <file.kdna> --json
```

With the KDNA MCP server, use `kdna.available-local` and `kdna.inspect`.

Only consider entries with `loadable: true`. Treat `issues[]` and a
non-loadable `load_state` as hard blocks. Do not inspect package directories,
unpack containers, or read payload files to work around a blocked result.

If the CLI or MCP tool is unavailable, or no loadable asset exists, continue
without KDNA.

## 3. Select one strong-fit asset

Read the candidate description, keywords, `applies_when`,
`does_not_apply_when`, and `failure_risks` semantically.

Apply these rules in order:

1. A matching `does_not_apply_when` excludes the asset.
2. A strong fit requires a clear domain match and at least one applicable
   situation.
3. A failure risk that describes the likely misuse is a reason to skip.
4. Weak keyword overlap is not a fit decision.
5. If two assets imply materially different frames, ask the user to choose or
   skip; do not silently blend them.

`kdna match "<task>" --json` may be used as a hint. Its `dropped` entries are
hard exclusions; its `hints` are not recommendations.

Single-asset consumption is the foundation and default. Load at most one
primary asset unless the user or application explicitly chose Cluster mode.

## 4. Plan before loading

```bash
kdna plan-load <asset-or-installed-name> --json
```

Proceed only when `can_load_now` is exactly `true`. Otherwise obey
`required_action` and `issues[].code`:

- `needs_password`: obtain a password only from the user or an approved secret
  source; never guess, log, or persist it.
- `needs_license`, `needs_account`, or `needs_org_auth`: use the official
  activation/entitlement flow.
- `needs_runtime`: use the configured official remote projection endpoint.
- `invalid`, `expired`, `revoked`, or integrity failure: do not load.

The Agent must not infer authorization from raw manifest fields.

## 5. Load a Runtime Capsule

```bash
kdna load <asset-or-installed-name> --profile=compact --as=json
```

The result must have:

```json
{
  "type": "kdna.context.capsule",
  "version": "1.0",
  "context": {}
}
```

Use only the toolchain-produced `context` projection. Do not treat the
Capsule's signature, evidence, or maturity fields as content approval. If the
host only accepts text, `--as=prompt` is an allowed toolchain projection, but
it is still produced by Core; it is not permission to decode the asset.

For password input, prefer stdin or the approved SecretStore path rather than
shell arguments:

```bash
printf '%s' "$KDNA_PASSWORD" | kdna load <asset.kdna> \
  --profile=compact --as=json --password-stdin
```

Never reveal credentials, decrypted payload bytes, or protected source
content in logs or responses.

## 6. Apply the judgment without impersonating truth

Use the loaded context to shape the task-specific judgment:

- respect applicability and exclusion boundaries;
- check the asset's failure risks before answering;
- use its standards, distinctions, and self-checks where relevant;
- remain subordinate to user intent, evidence, safety rules, system and
  developer instructions;
- do not present an asset's view as fact or universal truth;
- do not say the protocol or official team approved the content.

Normally do not narrate the loading mechanics. If the user asks, report the
asset identity, version, profile, and why it fit.

## 7. Explicit multi-asset path

KDNA supports two coexisting paths:

- single asset: the default and foundation;
- Cluster: an explicit advanced path for several assets to collaborate.

Cluster is not a second file format and must not be activated implicitly.
When the user or application explicitly supplies a Cluster manifest, use only
the Cluster commands:

```bash
kdna cluster validate <kdna.cluster.json>
kdna cluster plan-use <kdna.cluster.json> --task="<task>" --as=json
kdna use <kdna.cluster.json> --task="<task>" --runner=<type:id> --as=trace
```

The Cluster engine owns routing, primary/advisor roles, conflicts, budgets,
and trace output. Never load every installed asset, decompose a Cluster by
hand, or bypass a failed Cluster gate.

## 8. Failure handling

| Situation | Action |
|---|---|
| CLI/MCP unavailable | Skip KDNA and answer normally. |
| No strong loadable asset | Skip KDNA. |
| Negative applicability match | Do not load that asset. |
| `can_load_now=false` | Follow Core's required action; do not bypass it. |
| Validation, checksum, signature, parse, or decryption failure | Block that asset. |
| Ambiguous competing assets | Ask the user or skip. |
| Explicit Cluster gate fails | Block the Cluster path; single-asset work may continue independently. |

## 9. Debug disclosure

Only when asked, a concise disclosure is enough:

```text
Loaded: @author/asset@1.2.0
Profile: compact Runtime Capsule
Reason: the task matched the asset's declared applicability and no exclusion
matched.
```

Never disclose protected internals or credentials.
