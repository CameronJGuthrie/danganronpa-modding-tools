import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { OpcodeName } from "../enum/opcode";

type TmLanguagePattern = {
  match: string;
  name: string;
};

type TmLanguage = {
  scopeName: string;
  patterns: TmLanguagePattern[];
};

const opcodeNames = [
  ...Object.values(OpcodeName),
  "LoadMap", // TODO: create metadata
  "ObjectState", // TODO: create metadata
  "RestartScript", // TODO: create metadata
  "SetOption", // TODO: create metadata
  "StopScript", // TODO: create metadata
  "TrialCamera", // TODO: create metadata
  "Type", // TODO: create metadata
  "WaitFrame", // TODO: create metadata
  "WaitInput", // TODO: create metadata
];

const tmLanguage: TmLanguage = {
  scopeName: "source.linscript",
  patterns: [
    {
      match: "\\b0x[0-9A-Fa-f]+\\b",
      name: "constant.numeric.hex.linscript",
    },
    {
      match: '"(?:[^"\\\\]|\\\\.)*"',
      name: "string.quoted.double.linscript",
    },
    {
      match: `\\b(${opcodeNames.join("|")})\\b`,
      name: "entity.name.function.linscript",
    },
    {
      match: "\\b(Textless|Text)\\b",
      name: "constant.language.linscript",
    },
  ],
};

// Output to src directory (not out) since the grammar file is in src/syntaxes
const outputPath = join(__dirname, "../../src/syntaxes/linscript.tmLanguage.json");

writeFileSync(outputPath, `${JSON.stringify(tmLanguage, null, 2)}\n`);

console.log(`Generated ${outputPath}`);
console.log(`Included ${opcodeNames.length} opcodes`);
