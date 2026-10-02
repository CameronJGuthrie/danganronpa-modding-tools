import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { LinscriptInstructionName } from "linscript-definitions";

type TmLanguagePattern = {
  match: string;
  name: string;
};

type TmLanguage = {
  scopeName: string;
  patterns: TmLanguagePattern[];
};

const instructionNames = Object.values(LinscriptInstructionName);

const tmLanguage: TmLanguage = {
  scopeName: "source.linscript",
  patterns: [
    {
      match: "#.*$",
      name: "comment.line.number-sign.linscript",
    },
    {
      match: '"(?:[^"\\\\]|\\\\.)*"',
      name: "string.quoted.double.linscript",
    },
    {
      match: `\\b(${instructionNames.join("|")})\\b`,
      name: "entity.name.function.linscript",
    },
    {
      // Named arguments such as Speaker(Makoto); listed after the instructions so those win
      match: "\\b[A-Za-z_]\\w*\\b",
      name: "variable.other.enummember.linscript",
    },
  ],
};

// Output to src directory (not out) since the grammar file is in src/syntaxes
const outputPath = join(__dirname, "../../src/syntaxes/linscript.tmLanguage.json");

writeFileSync(outputPath, `${JSON.stringify(tmLanguage, null, 2)}\n`);

console.log(`Generated ${outputPath}`);
console.log(`Included ${instructionNames.length} instructions`);
