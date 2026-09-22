---
name: rewrite
description: Rewrite the character dialogue in one or more workbench/mod .linscript files to the parody tone in workbench/tone/*.md, and populate the Meta() block with object names inferred from each handler's text. Use when the user asks to rewrite, re-tone, or parody a linscript.
---

# Rewrite a linscript in the parody tone

Arguments: one or more `.linscript` paths (absolute, or relative to the repo root).
If a path is not under `workbench/mod/`, tell the user; the mod dir is where rewrites live.
`pnpm select <name>.linscript` copies a script from `workbench/linscript-exploration/` into it.

## 1. Load the tone

Read every file in `workbench/tone/*.md` before writing a line. `README.md` has the
hard formatting rules, `tone.md` the premise and general voice, `makoto.md` the
protagonist, and every other file one supporting character or Monokuma (named by first
name, e.g. `kiyotaka.md`, `monokuma.md`). If the script has a character with no file,
extrapolate from their original lines and the "escalate the existing trait" rule, and
say so in the report.

Note `Speaker(Mukuro)` in chapter one is Junko in disguise: use Junko's section.

## 2. Read the script and decide what is dialogue

Run the helper to list every text line with its speaker and object handler:

```
python3 .claude/skills/rewrite/objects.py <file>
```

Rewrite: every `Text(...)`/`RawText(...)` spoken by a named `Speaker(...)`, including
`<thought>` narration and object-inspection thoughts (rewrite both the first-visit and
repeat-visit variants, keep them distinct). Monokuma's in-world notices rendered as
`<system>` text count as his dialogue.

Leave untouched:
- `Speaker(Blank)` tutorial text (handbook controls, `%CTRL_...%` placeholders).
- School regulation cards and any `<style N>` fallback lines.
- Silent beats `"..."`, grunts (`"Ng...gah..."`, `"Urgh..."`), sound effects
  (`*WHAM*`, `*Rattle rattle*`), menu labels, `"Leave the area?"` prompts.

## 3. Write the replacement map

Create `<scratchpad>/<script>.json`: an object mapping the exact source string (as it
appears between the quotes in the file, escapes and tags included) to the replacement.
Rules the compiler will not check for you:

- At most 2 lines, at most 56 visible characters per line (tags excluded). Break with
  a literal `\n`.
- Keep the tag structure exactly: `<thought>…</thought>`, `<keyword>…</keyword>`, and
  the close/reopen pattern when a keyword sits inside a thought or system wrapper. If
  the source leaves a wrapper unclosed, leave yours unclosed too.
- Every fact the original line conveyed must survive (see "Keep the plot legible").
- Duplicated source lines share one key; the helper replaces every copy.
- Do not put a `Raw` prefix decision in the map; the helper preserves whatever the
  source line used.

## 4. Apply and verify

```
python3 .claude/skills/rewrite/apply.py <file> <map.json>
```

It refuses to write if any key is unmatched or any replacement breaks the width rule,
then compiles with the CLI, decompiles, and diffs the text lines. Fix and rerun until
it prints `OK`.

## 5. Populate Meta()

For each `OnObject(N)` (and matching `ObjectState(N, ...)`) whose handler text
identifies the object, add `Object(N, Name)` to the `Meta()` block at the bottom of the
file and replace the numeric references with the name. Conventions from existing files:

- PascalCase identifiers; suffix doors with `_Door` (`Bathroom_Door`, `Gym_Door`),
  number repeats (`MetalPlate_1`, `MetalPlate_2`, `Camera_1`). Unique per file.
- Do not name `254`/`255` or ids that only appear in `ObjectState` at map load with no
  handler; leave them numeric and list them in the report.
- If the file has no `Meta()` block, add one after the final `StopScript()` with a blank
  line before it. Keep any existing `Option(...)` rows.
- Object ids and option ids are separate namespaces; only add `Option(n, Name)` when the
  script's own labels make the meaning unambiguous (`"Yes"`/`"No"` → `Yes`/`No`).

Recompile after editing Meta() (step 4 again).

## 6. Report

For each file: how many lines changed, which UI lines were deliberately left, any
character voiced without a tone section, and every object id left numeric with the
reason (no handler, or handler text does not say what it is). Note that
`workbench/` is gitignored, so there is nothing to commit.
