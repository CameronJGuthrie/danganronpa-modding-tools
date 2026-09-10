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

const opcodeNames = Object.values(LinscriptInstructionName);

const tmLanguage: TmLanguage = {
  scopeName: "source.linscript",
  patterns: [
    {
      match: "#.*$",
      name: "comment.line.number-sign.linscript",
    },
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
      // Named arguments such as Speaker(Makoto); listed after the opcodes so those win
      match: "\\b[A-Za-z_]\\w*\\b",
      name: "variable.other.enummember.linscript",
    },
  ],
};

// Output to src directory (not out) since the grammar file is in src/syntaxes
const outputPath = join(__dirname, "../../src/syntaxes/linscript.tmLanguage.json");

writeFileSync(outputPath, `${JSON.stringify(tmLanguage, null, 2)}\n`);

console.log(`Generated ${outputPath}`);
console.log(`Included ${opcodeNames.length} opcodes`);
