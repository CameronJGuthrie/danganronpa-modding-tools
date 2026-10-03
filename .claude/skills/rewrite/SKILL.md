---
name: rewrite
description: Rewrite the character dialogue in one or more workbench/mod .linscript files to the parody tone in workbench/tone/*.md, and populate the Meta() block with object names inferred from each handler's text. Use when the user asks to rewrite, re-tone, or parody a linscript.
---

# Rewrite a linscript in the parody tone

Arguments: one or more `.linscript` paths (absolute, or relative to the repo root).
If a path is not under `workbench/mod/`, tell the user; the mod dir is where rewrites live.
`pnpm select <name>.linscript` copies a script from `workbench/exploration/` (`chapter_CC/scene_SSS/eCC_SSS_NNN.linscript`) into it.

Mod scripts are organised by chapter and scene with a room label on the filename:
`workbench/mod/dr1_data_us/Dr1/data/us/script/chapter_01/scene_005/103_MakotosRoom.linscript`
is the game's `e01_005_103`. Only the folder numbers and the leading three digits name the
script; the suffix after the digits is for the reader. A user may hand you either form
(`e01_005_103`, `103_MakotosRoom.linscript`, or the full path); resolve it by the numbers.

## 1. Load the tone

Read every file in `workbench/tone/*.md` before writing a line. `README.md` has the
hard formatting rules, `plot-differences.md` the deliberate departures from the
original plot by chapter (a scene that touches a listed beat must match it, and a
rewrite that changes a fact rather than a voice must add an entry), `tone.md` the
premise and general voice, `makoto.md` the protagonist, and every other file one supporting character or Monokuma (named by first
name, e.g. `kiyotaka.md`, `monokuma.md`). If the script has a character with no file,
extrapolate from their original lines and the "escalate the existing trait" rule, and
say so in the report.

Note `Speaker(Mukuro)` in chapter one is Junko in disguise: use Junko's section.

The game is set in 2010, before smartphones and social media were widespread. Jokes must fit
that: no followers, feeds, scrolling, selfies, apps, streaming or influencers. Flip phones, texting,
forums, magazines, TV and DVDs are fine.

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
  (`*WHAM*`, `*Rattle rattle*`), menu labels.

One `<system>` line does change: the generic `"Leave the area?"` prompt (a
`RawText("<system>Leave the area?\n</system>")` under the exit option) becomes a
prompt naming the room the script plays in, in plain English and the same shape:
`Leave the dining hall?`, `Leave the kitchen?`, `Leave the gym?`, `Leave the room?`
for Makoto's room, and just `Leave the bathroom?` for any bathroom (no floor or
gender). Take the room from the file's suffix or
`workbench/tone/rooms.md`, keep the `<system>` wrapper and trailing `\n`, and use
the same wording every time that room appears so the prompt matches across scenes
(`grep -rn "Leave the" <mod script dir>` shows what is already in use). Leave a
prompt that already names its room alone.

## 3. Write the lines

Rephrase each line from scratch in the character's voice, keeping its facts. Do not
keep the original sentence and bolt a joke onto the end of it: the source's register
and the appended quip pull in different directions and the line reads as two voices.
If the original wording survives, it should be because it already sounds like the
parody character, not because it was the starting point.

Vary the rhythm. A line may be one flowing sentence, a question, or a sentence and a
half; it should not default to a run of clipped fragments ("A desk. With drawers. My
enemy."). That cadence is a seasoning for a few landing beats per scene, not the base.
Read a scene's lines together and check that no two neighbouring lines share the same
shape or the same punchline.

Vary the target, too. Each character has one dominant trait to escalate, but a scene
where every line hits it becomes a single joke repeated. Aim for roughly one line in
three that plays the character's signature bit; let the rest be that character
reacting to the actual situation, other characters, or the object in front of them,
still rude and still in voice.

Makoto in particular: he resents school, but he is not a school-hatred machine. Only
some of his thoughts should route back to it; he should also be tired, petty about
whoever just spoke to him, wryly observant, or briefly and grudgingly sincere.

## 3a. Write the replacement map

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
- Check `workbench/tone/rooms.md` for the map first and reuse the names it lists;
  add the room, or any new names, to that file afterwards.
- If the file has no `Meta()` block, add one after the final `StopScript()` with a blank
  line before it. Keep any existing `Option(...)` rows.
- Object ids and option ids are separate namespaces; only add `Option(n, Name)` when the
  script's own labels make the meaning unambiguous (`"Yes"`/`"No"` → `Yes`/`No`).

Also name the characters the script places for investigation: every setup `Sprite(N, Name, 0, Set, spot)`
line (fourth argument `Set`) that has an `OnCharacter(N)` handler gets `Character(N, Name)`, and the
handler is written `OnCharacter(Name)`. Use the student's first name as the identifier (`Taka`,
`Mukuro` for `Speaker(Mukuro)`); leave 254/255 and slots with no `Sprite` numeric.

Recompile after editing Meta() (step 4 again).

## 5b. Name the file

Make sure the script sits at `chapter_CC/scene_SSS/NNN_<Suffix>.linscript` under the mod
script directory, where `eCC_SSS_NNN` is its game name. `pnpm select` and a fresh copy
land as a flat `eCC_SSS_NNN.linscript`; move it into place with `mv` (create the folders)
and never leave two files that flatten to the same name, the build refuses to run then.

Choose the suffix from the room, since every script in a map shares it and the folder
already says which chapter and scene it is:

- Look the map id (the last three digits) up in `workbench/tone/rooms.md`, then in
  `projects/gui/src/data/room.ts`. Reuse the suffix any existing sibling script with the
  same map already carries (`find` the mod script dir for `NNN_*.linscript`) so a room
  reads identically across scenes.
- PascalCase, letters and digits only, no apostrophes or spaces: `MakotosRoom`,
  `DiningHall`, `1FBoysBathroom`, `TrophyDisplayCase`. Drop qualifiers such as "(crime
  scene)" unless two maps in the same scene would otherwise share a suffix; then keep the
  shortest distinguishing word (`GymEntranceCeremony` vs `Gym`).
- When the map id is not a location (the prologue `000` scripts, Free Time `e08_*` and
  School Mode `e09_*`), describe what the script is instead, from its text: `Opening`,
  `FreeTimeTutorial`, `Classroom1A` for a scene that only loads one map.
- If the room is new to `rooms.md`, add it there (step 5 already asks for this) with the
  same name you used in the suffix.

For each file: its final path (chapter/scene folder and suffix), how many lines changed, which UI lines were deliberately left, any
character voiced without a tone section, and every object id left numeric with the
reason (no handler, or handler text does not say what it is). Note that
`workbench/` is gitignored, so there is nothing to commit.
