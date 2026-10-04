#!/usr/bin/env node

/**
 * Writes a character's gift reactions into their `e08_CCC_000` script in `workbench/mod`.
 *
 *   pnpm gift-dialogue Sayaka
 *
 * The dialogue comes from `mod/gift-dialogue/<character>.ts`. For every `SetOption` handler
 * that gives a present, the generator keeps the `GivePresent`, then writes the gift sound, hides
 * the present menu, writes the brief as comments, the conversation, and the `Goto` for the
 * present's reaction. The first run also strips the shipped dialogue out of the result handlers
 * (`OkayGift` … `HatedGift`), leaving only the relationship bookkeeping and Makoto's closing
 * thought, which is the player's signal for how the gift landed. Re-running is safe: handlers
 * are regenerated from the table, everything else in the file is left alone.
 *
 * The script must name its result labels `OkayGift`, `LikedGift`, `LovedGift`, `DislikedGift`
 * and `HatedGift` in its `Meta()` block.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Chapter, Character, Present, sprites, voiceLinesByCharacterByChapter } from "linscript-definitions";
import { errorMessage } from "../lib/errors.ts";
import { findModScript, SCRIPT_DIR_SEGMENTS } from "../lib/mod-scripts.ts";
import { PROJECT_ROOT } from "../lib/paths.ts";
import type { GiftDialogue, Line, PresentDialogue, Reaction, VoiceRef } from "./gift-dialogue/types.ts";

const MOD_SCRIPT_DIR = join(PROJECT_ROOT, "workbench", "mod", "dr1_data_us", ...SCRIPT_DIR_SEGMENTS);

/** Widest line the textbox shows without wrapping (visible characters, tags excluded). */
const TEXT_WIDTH = 56;
const MAX_TEXT_LINES = 2;

const REACTION_SOUND: Record<Reaction, number> = { Okay: 122, Liked: 122, Loved: 122, Disliked: 123, Hated: 123 };
const REACTIONS = new Set<string>(Object.keys(REACTION_SOUND));

function showUsage(): void {
  console.log(`Usage: pnpm gift-dialogue <character>

Regenerates the present handlers of workbench/mod/.../e08_CCC_000 from
packages/scripts/src/mod/gift-dialogue/<character>.ts.

Example:
  pnpm gift-dialogue Sayaka`);
}

// --- text -----------------------------------------------------------------------------------

/** Word-wraps at TEXT_WIDTH, honouring explicit newlines, and refuses text that needs a third line. */
function wrap(text: string): string {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const candidate = line === "" ? word : `${line} ${word}`;
      if (candidate.length > TEXT_WIDTH) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  if (lines.length > MAX_TEXT_LINES || lines.some((l) => l.length > TEXT_WIDTH)) {
    throw new Error(`text needs ${lines.length} lines of up to ${TEXT_WIDTH} characters: ${JSON.stringify(text)}`);
  }
  return lines.join("\\n");
}

function quote(text: string): string {
  return text.replace(/"/g, '\\"');
}

// --- lookups --------------------------------------------------------------------------------

type VoiceTable = { [voiceLineId: number]: string };

function voiceTable(character: Character): VoiceTable {
  const table = voiceLinesByCharacterByChapter[character]?.[Chapter.Chapter_99];
  if (table === undefined) {
    throw new Error(`${Character[character]} has no Chapter_99 voice lines in linscript-definitions`);
  }
  const { metadata: _, ...lines } = table;
  return lines;
}

/** Resolves a voice reference to its id; the first line with that transcript when given text. */
function voiceId(table: VoiceTable, ref: VoiceRef, who: string): number {
  if (typeof ref === "number") {
    if (table[ref] === undefined) {
      throw new Error(`${who} has no Chapter_99 voice line ${ref}`);
    }
    return ref;
  }
  for (const [id, transcript] of Object.entries(table)) {
    if (transcript === ref) {
      return Number(id);
    }
  }
  throw new Error(`${who} has no Chapter_99 voice line saying ${JSON.stringify(ref)}`);
}

function spriteTable(character: Character): Map<string, number> {
  const table = sprites[character];
  if (table === undefined) {
    throw new Error(`${Character[character]} has no sprite names in linscript-definitions`);
  }
  return new Map(Object.entries(table).map(([id, name]) => [name, Number(id)]));
}

// --- emission -------------------------------------------------------------------------------

interface Emitter {
  character: Character;
  spriteIds: Map<string, number>;
  voices: VoiceTable;
  makotoVoices: VoiceTable;
}

/** Opcode lines for one present's conversation. Mode and Sprite are only written when they change. */
function emitLines(emitter: Emitter, present: string, lines: Line[]): string[] {
  const name = Character[emitter.character];
  const out: string[] = [];
  let mode: "say" | "makoto" | "think" | null = null;
  let sprite: string | null = null;

  const voiced = (table: VoiceTable, who: string, ref: VoiceRef | undefined): string | null => {
    if (ref === undefined) {
      return null;
    }
    return `Voice(${who}, Chapter_99, ${voiceId(table, ref, who)})`;
  };

  for (const line of lines) {
    switch (line.kind) {
      case "say": {
        const spriteId = emitter.spriteIds.get(line.sprite);
        if (spriteId === undefined) {
          throw new Error(
            `${present}: ${name} has no sprite named ${line.sprite} (known: ${[...emitter.spriteIds.keys()].join(", ")})`,
          );
        }
        if (line.sprite !== sprite) {
          out.push(`Sprite(0, ${name}, ${spriteId}, FadeIn, Center)`);
          sprite = line.sprite;
        }
        if (mode !== "say") {
          out.push(`Mode(Speaking, ${name})`);
          mode = "say";
        }
        const voice = voiced(emitter.voices, name, line.voice);
        if (voice !== null) {
          out.push(voice);
        }
        out.push(`Text("${quote(wrap(line.text))}")`);
        break;
      }
      case "makoto": {
        if (mode !== "makoto") {
          out.push("Mode(Speaking)");
          mode = "makoto";
        }
        const voice = voiced(emitter.makotoVoices, "Makoto", line.voice);
        if (voice !== null) {
          out.push(voice);
        }
        out.push(`Text("${quote(wrap(line.text))}")`);
        break;
      }
      case "think":
        if (mode !== "think") {
          out.push("Mode(Thinking)");
          mode = "think";
        }
        out.push(`Text("<thought>${quote(wrap(line.text))}</thought>")`);
        break;
      case "raw":
        out.push(line.line);
        break;
    }
  }
  return out;
}

// --- rewriting ------------------------------------------------------------------------------

const OPTION_LINE = /^SetOption\(\w+\)$/;
const GIVE_PRESENT_LINE = /^\s{4}GivePresent\((\w+)\)$/;
const HANDLER_GOTO_LINE = /^\s{4}Goto\((\w+)Gift\)$/;

interface RewriteResult {
  text: string;
  handlers: number;
}

/**
 * Regenerates every present handler in `source`. A handler is `SetOption(n)` followed by an
 * indented `GivePresent`, up to and including its indented `Goto(<Reaction>Gift)`. After the
 * first result label, the shipped dialogue between `Speaker(<character>)` and `Mode(Thinking)`
 * is removed.
 */
function rewrite(source: string, dialogue: GiftDialogue, emitter: Emitter): RewriteResult {
  const name = Character[dialogue.character];
  const lines = source.split("\n");
  const out: string[] = [];
  const used = new Set<string>();
  let inResults = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const give = i + 1 < lines.length ? GIVE_PRESENT_LINE.exec(lines[i + 1]) : null;

    if (OPTION_LINE.test(line) && give !== null) {
      const present = give[1];
      if (!(present in Present)) {
        throw new Error(`line ${i + 2}: unknown present ${present}`);
      }
      const entry: PresentDialogue | undefined = dialogue.presents[present];
      if (entry === undefined) {
        throw new Error(`no dialogue for ${present} in the ${name} table`);
      }
      if (!REACTIONS.has(entry.reaction)) {
        throw new Error(`${present}: unknown reaction ${entry.reaction}`);
      }
      used.add(present);

      let j = i + 2;
      const existingBrief: string[] = [];
      while (j < lines.length && !HANDLER_GOTO_LINE.test(lines[j])) {
        if (lines[j].trim().startsWith("#")) {
          existingBrief.push(lines[j].trim().replace(/^#\s?/, ""));
        }
        j++;
      }
      if (j === lines.length) {
        throw new Error(`line ${i + 1}: ${present} handler has no Goto(<Reaction>Gift)`);
      }
      const brief = entry.brief ?? existingBrief;

      out.push(line);
      out.push(`    GivePresent(${present})`);
      out.push(`    Sound(${REACTION_SOUND[entry.reaction]})`);
      out.push("    SetUI(ChoosePresent, Hidden)");
      out.push(...brief.map((b) => `    # ${b}`));
      out.push(...emitLines(emitter, present, entry.lines).map((l) => `    ${l}`));
      out.push(`    Goto(${entry.reaction}Gift)`);
      i = j + 1;
      continue;
    }

    if (line === "Label(OkayGift)") {
      inResults = true;
    }
    if (inResults && line === `Speaker(${name})`) {
      while (i < lines.length && lines[i] !== "Mode(Thinking)") {
        i++;
      }
      continue;
    }

    out.push(line);
    i++;
  }

  const unused = Object.keys(dialogue.presents).filter((p) => !used.has(p));
  if (unused.length > 0) {
    throw new Error(`dialogue for presents the script never offers: ${unused.join(", ")}`);
  }
  for (const reaction of REACTIONS) {
    if (!out.includes(`Label(${reaction}Gift)`)) {
      throw new Error(`script has no Label(${reaction}Gift); name it in Meta() with LabelName`);
    }
  }
  return { text: out.join("\n"), handlers: used.size };
}

// --- main -----------------------------------------------------------------------------------

async function loadDialogue(characterName: string): Promise<GiftDialogue> {
  const moduleUrl = new URL(`./gift-dialogue/${characterName.toLowerCase()}.ts`, import.meta.url);
  let loaded: { dialogue?: GiftDialogue };
  try {
    loaded = await import(moduleUrl.href);
  } catch (error) {
    throw new Error(`no dialogue table for ${characterName} (${moduleUrl.pathname}): ${errorMessage(error)}`);
  }
  if (loaded.dialogue === undefined) {
    throw new Error(`${moduleUrl.pathname} does not export \`dialogue\``);
  }
  return loaded.dialogue;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args.includes("-h") || args.includes("--help")) {
    showUsage();
    process.exit(args.length === 0 ? 0 : 1);
  }

  const dialogue = await loadDialogue(args[0]);
  const character = dialogue.character;
  const name = Character[character];
  const flatName = `e08_${String(character).padStart(3, "0")}_000`;

  const scriptPath = await findModScript(MOD_SCRIPT_DIR, flatName);
  if (scriptPath === null) {
    throw new Error(
      `${name}'s gift script ${flatName} is not in ${MOD_SCRIPT_DIR}; run \`pnpm select ${flatName}.linscript\` first`,
    );
  }

  const emitter: Emitter = {
    character,
    spriteIds: spriteTable(character),
    voices: voiceTable(character),
    makotoVoices: voiceTable(Character.Makoto),
  };

  const source = await readFile(scriptPath, "utf8");
  const bom = source.startsWith("﻿") ? "﻿" : "";
  const result = rewrite(source.slice(bom.length), dialogue, emitter);
  await writeFile(scriptPath, bom + result.text, "utf8");

  console.log(`Wrote ${result.handlers} present handlers to ${scriptPath}`);
}

main().catch((error: unknown) => {
  console.error(`Error: ${errorMessage(error)}`);
  process.exit(1);
});
