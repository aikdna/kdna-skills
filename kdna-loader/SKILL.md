---
name: kdna-loader
description: Discover and load KDNA judgment frameworks from ~/.kdna/domains/ when the task requires domain-specific judgment (review, diagnosis, critique, classification, strategy) where the same input could legitimately be interpreted multiple ways. Skip for pure formatting, factual lookup, code execution, or mechanical transformations. This skill is the entire interface to KDNA — domains themselves are not separate skills.
---

# KDNA Loader

KDNA (Knowledge DNA) is a portable format for encoding domain judgment.
Each KDNA domain is a small JSON bundle (~5–30 KB) that describes how
an expert thinks inside one domain: the principles they reason from,
the misunderstandings they avoid, the questions they ask themselves
before deciding.

**KDNA does not act. KDNA shapes how an agent judges before acting.**
Together with this skill, KDNA + kdna-loader form a complete loop:
this skill provides the **routing and protocol**, KDNA provides the
**judgment material**.

This skill is the **only** KDNA-related skill. Domains themselves are
not registered as skills — they live in `~/.kdna/domains/` as data and
are discovered on demand. Whether the user has 1 domain installed or
100, this skill is the single entry point.

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

Do **not** assume any specific domains exist. Look every time.

```bash
ls ~/.kdna/domains/                # list installed scopes (e.g. @aikdna, @yourname)
ls ~/.kdna/domains/<scope>/        # list domains within a scope
```

Typical layout:

```
~/.kdna/domains/
├── @aikdna/
│   ├── writing/
│   ├── decision_state/
│   ├── code_review/
│   └── ...
└── @yourorg/
    └── internal_review/
```

If `~/.kdna/domains/` is empty or missing → no KDNA available → answer
normally, mention installation only if the user is asking about KDNA
itself.

---

## Part 3 — Evaluate fit (per candidate domain)

For each candidate domain, read its `kdna.json` first. This is small
(~1 KB) and cheap.

```bash
cat ~/.kdna/domains/<scope>/<name>/kdna.json
```

Check these fields:

| Field | What it tells you |
|---|---|
| `name` | The full @scope/name identifier |
| `version`, `judgment_version` | How recent the judgment surface is |
| `description` | One-sentence domain purpose |
| `core_insight` | The single most distinctive claim of this domain |
| `keywords` | Topic signals |
| `status` | `experimental` / `reference` / `stable` |
| `yanked` | If `true`, **do not load** |

If a domain's purpose is clearly outside the task → skip without
opening any other file.

For surviving candidates, open `KDNA_Core.json` and walk the `axioms`
array. **v2.1 axioms carry `applies_when` and `does_not_apply_when`** —
match the current task against both:

```json
{
  "id": "axiom_problem_not_prose",
  "applies_when": [
    "the user asks for content feedback, review, or 'why isn't this working'"
  ],
  "does_not_apply_when": [
    "the task is copy editing for grammar, spelling, or compliance",
    "the format is rigid (legal contracts, regulatory filings)"
  ],
  "failure_risk": "Refusing to fix sentences when the user genuinely just wants smoother prose."
}
```

Decision rules:

- **Any** `does_not_apply_when` clearly matches the task → the domain
  has **disqualified itself**. Drop it. Even strong keyword overlap
  cannot override an explicit boundary.
- `applies_when` matches → strong fit candidate.
- Neither matches clearly → weak fit. Prefer skipping over forcing.

---

## Part 4 — Selection

After evaluating, you should usually have:

- **0 fits** → do not load KDNA. Answer normally.
- **1 fit** → load it.
- **2+ fits** → prefer the narrowest match. If two domains take
  genuinely different stances on the task, surface the choice:
  > "Two installed domains could apply here: @aikdna/writing
  > (structural diagnosis) and @yourorg/copy_polish (line-level
  > polish). Which judgment frame should I use?"
  Do **not** silently blend.

Never load more than one domain as primary. A secondary domain can
constrain (e.g. `@aikdna/agent_safety` always advises on irreversible
actions), but the primary judgment frame is always one.

---

## Part 5 — Load

Once selected, read the domain's full judgment surface:

```bash
cat ~/.kdna/domains/<scope>/<name>/KDNA_Core.json
cat ~/.kdna/domains/<scope>/<name>/KDNA_Patterns.json
```

Optionally, if relevant to the task:

| File | When to also load |
|---|---|
| `KDNA_Scenarios.json` | Concrete situation with conditions/conflicts |
| `KDNA_Cases.json` | User asks for examples or before/after |
| `KDNA_Reasoning.json` | User wants the reasoning, not just the conclusion |
| `KDNA_Evolution.json` | User asks about practice / capability growth |

**Token discipline**: Core + Patterns is usually enough. Only load
optional files when the task signals you'll use them.

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
| `~/.kdna/domains/` missing or empty | Skip KDNA. Answer normally. |
| Domain's `KDNA_Core.json` missing or unparseable | Skip that domain. Try next candidate or skip KDNA entirely. |
| `kdna.json.yanked == true` | Do not load. If user asked for that specific domain by name, tell them it has been yanked and suggest `replaced_by` if present. |
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

- Not a list of available KDNA domains (those live in
  `~/.kdna/domains/`, discovered on demand)
- Not a registry browser (use `kdna list --available` CLI)
- Not a domain creator (use `kdna init <name>` CLI)
- Not an auto-loader that runs on every request — you decide per
  request whether the task needs KDNA at all

The skill teaches the protocol. The KDNA files supply the judgment.
Both are required; neither is sufficient alone.
