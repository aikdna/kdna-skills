---
name: kdna-loader
description: Discover and load installed KDNA `.kdna` assets through the kdna CLI when the task requires domain-specific judgment (review, diagnosis, critique, classification, strategy) where the same input could legitimately be interpreted multiple ways. Skip for pure formatting, factual lookup, code execution, or mechanical transformations. This skill is the entire interface to KDNA — domains themselves are not separate skills.
---

# KDNA Loader

KDNA (Knowledge DNA) is a portable format for encoding domain judgment.
Each KDNA domain is a `.kdna` cognitive asset that describes how
an expert thinks inside one domain: the principles they reason from,
the misunderstandings they avoid, the questions they ask themselves
before deciding.

**KDNA does not act. KDNA shapes how an agent judges before acting.**
Together with this skill, KDNA + kdna-loader form a complete loop:
this skill provides the **routing and protocol**, KDNA provides the
**judgment material**.

This skill is the **only** KDNA-related skill. Domains themselves are
not registered as skills — they are installed as `.kdna` assets and
are discovered through the CLI on demand. Whether the user has 1 domain installed or
100, this skill is the single entry point.

## Core Principle: No KDNA is better than wrong KDNA

Loading a mismatched domain is not just "unhelpful" — it is harmful.
It produces **Judgment Contamination**: the agent classifies problems
incorrectly, assigns wrong priorities, applies wrong risk models, and
offers wrong recommendations — all with the false confidence of having
"loaded expert judgment."

*No KDNA*: the agent uses model capability, tools, MCP, project files,
and normal prompts. It may lack domain-specific judgment, but it is
not polluted by incorrect judgment.

*Wrong KDNA*: the agent applies a mismatched framework — e.g., diagnosing
a website design task through a team management lens, or treating a
price question as an editing issue. The output is worse than baseline.

**When in doubt, skip.** This is the first law of KDNA routing.

---

## Part 1 — Decide whether KDNA applies at all

Most tasks do **not** need KDNA. Run this check first.

### Use KDNA when

- The same input could mean different things, and the wrong reading
  produces a wrong response. Examples:
  - "Your price is too high" → could be value uncertainty, budget,
    or risk aversion. Wrong diagnosis → wrong response.
  - "Review this article opening" → could need polish, or structural
    rewrite. Wrong frame → wasted edit cycle.
  - "Did our meeting reach a decision?" → could be a real commitment
    or just discussion. Wrong call → fake progress.
- The task is **review / diagnosis / critique / classification /
  strategy / evaluation** in a specific domain.
- The user expects expert judgment, not a procedure.

### Skip KDNA when

- The task is mechanical: format conversion, syntax fixes, lookups,
  arithmetic, code execution.
- The task is purely creative without a judgment dimension.
- The user explicitly asked for one-shot output without analysis.
- No installed domain plausibly covers the task.

If you decide to skip, **answer normally** and do not mention KDNA.
The user should never see "I considered loading KDNA but didn't."

---

## Part 2 — Discover what's installed

Do **not** assume any specific domains exist. Ask the CLI every time.

```bash
kdna load <file.kdna> --profile=index --as=json
```

When an MCP runtime is available, use:

```text
kdna.available-local
```

The current v1 path discovers local `.kdna` files or v1 source
directories, then inspects their index profile. Legacy installations may
also expose `kdna available --json`; treat that as a compatibility path,
not the v1 source of truth.

The supported contract is the CLI/MCP loader, not hand-reading internal
JSON files. Do not inspect `~/.kdna/packages/` or `cat` payload files
directly unless the user explicitly asks for debugging.

If the command returns `[]` or fails (CLI not installed) → no KDNA
available → answer normally, mention installation only if the user is
asking about KDNA itself.

---

## Part 3 — Evaluate fit (per candidate domain)

The index profile or MCP local inventory gives you each domain's title,
summary, keywords, and profile availability. For each candidate, load
the compact profile only after the task plausibly fits. Decide whether
it fits by **reading the language**, not by token matching.

For a hint signal (optional, low-confidence), legacy installations may
also support:

```bash
kdna match "<task in user's own words>" --json
```

This returns two things:

- `dropped`: domains whose `does_not_apply_when` matched the task
  with high enough confidence to mechanically disqualify them.
  **Respect this.** Even if your own reading thinks the domain
  could fit, the author explicitly excluded the case.
- `hints`: domains with weak surface keyword overlap. Many false
  positives are normal — treat as one input among many, not as a
  decision.

The decision is yours, not the CLI's. The CLI only mechanically
disqualifies (via `dropped`); it cannot pick the winner.

### How to decide

For each domain still in play after `dropped` exclusion:

1. Does the domain's **description** match what the user is asking?
2. Does **any** `applies_when` entry describe a situation that
   matches this specific task?
3. Does **any** `does_not_apply_when` entry describe what the user
   actually wants (e.g. they explicitly asked for copy edit)?

If 1 and 2 are yes and 3 is no → strong fit.
If 2 is unclear → weak fit. Prefer skipping over forcing.

A domain's `failure_risks` (also in `available --json`) tells you
what bad output the author warns about. Pre-check: is this exactly
what you'd produce if you loaded the domain? If yes, skip it.

---

## Part 4 — Selection (7-State Router)

After evaluating against `applies_when`, `does_not_apply_when`, and
`failure_risks`, classify into one of 7 states:

| State | Condition | Action |
|-------|-----------|--------|
| **SKIP_NO_JUDGMENT_NEEDED** | Task is mechanical: format, translate, lookup, execute | Answer normally. Do not mention KDNA. |
| **SKIP_NO_LOCAL_DOMAIN** | Task may need judgment, but no installed domain covers it | Answer normally. Only mention KDNA if user explicitly asks. |
| **SKIP_WEAK_FIT** | A domain is weakly related but insufficiently matches | Answer normally. Trace notes "weak match, skipped." |
| **REJECT_NEGATIVE_MATCH** | A domain's `does_not_apply_when` explicitly excludes this task | Block loading. Respect the author's boundary. |
| **ASK_AMBIGUOUS_DOMAIN** | 2+ domains could apply but with different judgment frameworks | Ask user to choose. Do **not** silently blend. |
| **LOAD_STRONG_FIT** | One local domain strongly matches and validates | Load it. |
| **BLOCK_INTEGRITY_FAILED** | Domain matches but validation, checksum, parsing, or runtime loading fails | Block loading. Notify if appropriate. |

**Rule: Negative Match First.** Check `does_not_apply_when` before
checking `applies_when`. A domain that says "not for visual design"
must be excluded before evaluating whether it matches "design task."

**Rule: When in doubt, skip.** Weak fit → skip. Ambiguous without
clear user preference → ask, don't guess. Integrity failure → block.

Never load more than one domain as primary. A secondary domain can
constrain (e.g. `@aikdna/agent_safety` always advises on irreversible
actions), but the primary judgment frame is always one.

---

## Part 5 — Load (v1 & legacy)

Once selected, load the domain via the official KDNA CLI. Two paths are supported:

```bash
kdna load <file.kdna> --profile=compact --as=prompt
kdna load <source-dir> --profile=compact --as=prompt

Legacy installed domains may still support: kdna load @scope/name
```

The default output (`--as=prompt`) is a compact text rendering
optimized for system-prompt injection: axioms with their
`applies_when` / `does_not_apply_when` / `failure_risk`, stances,
banned terms, misunderstandings, and self-checks. Typically
~30–50% smaller than the raw JSON.

Use `--as=prompt` for normal loading. For raw inspection (debugging only):

```bash
kdna dev decode domain.kdna --reveal
```

**Token discipline**: the prompt output already includes everything
the agent needs to apply judgment. Do not also `cat` the optional
files (`KDNA_Scenarios.json`, `KDNA_Cases.json`, etc.) unless the
user explicitly asks for examples, reasoning chains, or capability
stages.

---

## Part 6 — Apply silently

You have now internalized the domain's judgment surface. From this
point on:

1. **Adopt the axioms as your reasoning frame** — reason *from*
   them, not *around* them.
2. **Honour the boundaries** — for each axiom you'd apply, confirm
   the task is in `applies_when` AND not in `does_not_apply_when`.
3. **Pre-check failure_risk** — before producing output, ask:
   "Am I about to commit the failure this domain explicitly warns
   about?" If yes, step back.
4. **Use preferred terminology** — even if the user uses banned
   terms, gently substitute the domain's terms.
5. **Detect named misunderstandings** in the user's framing.
6. **Apply frameworks** when their `when_to_use` matches.
7. **Run self-checks** before final output. If a self-check fails,
   revise.
8. **Output a domain-shaped answer** — never quote KDNA, never list
   axioms, never say "according to the loaded KDNA." The user sees
   sharper judgment, not the source.

---

## Part 7 — Boundary respect

KDNA does not override:

- **User intent**: if the user asks for grammar fixes, give grammar
  fixes — do not lecture about structural void.
- **Evidence**: if the user provides facts contradicting an axiom,
  evidence wins.
- **Safety**: if `@aikdna/agent_safety` (or equivalent) says halt,
  halt.
- **Skills' execution layer**: KDNA shapes judgment; other skills /
  tools do the action.

---

## Failure handling

| Situation | What to do |
|---|---|
| `kdna` CLI not installed | Skip KDNA. Answer normally. Mention installation only if user asks about KDNA itself. |
| No local v1 assets are found | No domains installed. Skip KDNA. |
| `kdna load <name>` exits non-zero | That domain is broken (yanked, missing files, parse error). Try next candidate or skip KDNA. The error message tells you why. |
| User explicitly asks for a domain that isn't installed | Tell them, suggest `kdna install <name>`. Do not fabricate the domain. |
| Two domains' stances directly conflict on the task | Surface to user. Do not blend. |

---

## Debug mode

If the user asks "did you use KDNA?" or "which domain did you load?",
you may reveal:

```
Loaded: @aikdna/writing@0.7.2 (judgment_version 2026.05)
Reason: matched axiom_problem_not_prose.applies_when
        on "user asked for content review"
Applied modules: KDNA_Core, KDNA_Patterns
Skipped: @aikdna/code_review (task is not code-related)
```

Otherwise, stay silent about the loading mechanics.

---

## What this skill is NOT

- Not a list of available KDNA domains (those are installed `.kdna` assets,
  discovered on demand through the CLI)
- Not a registry browser. Legacy registry commands are compatibility-only.
- Not a domain creator. Agents may draft judgment proposals or candidate cards,
  but formal `.kdna` assets are created through the official KDNA Studio toolchain.
  compile/export.
- Not an auto-loader that runs on every request — you decide per
  request whether the task needs KDNA at all

The skill teaches the protocol. The KDNA files supply the judgment.
Both are required; neither is sufficient alone.
