import {
  Arithmetic,
  arithmaticConfiguraiton,
  isArithmetic,
  isStudent,
  LinscriptInstructionName,
  Student,
} from "linscript-definitions";
import { characterData } from "../data/character-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const studentTitleEntryMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.StudentTitleEntry,
  hexcode: "0x0F",
  parameters: [
    {
      name: "student",
      description: "The student whose title entry changes; only ids 0-15 have a report card",
      names: Student,
    },
    {
      name: "operation",
      names: Arithmetic,
    },
    {
      name: "value",
      description: "The value to set, add, or remove from the student title",
    },
  ] as const,
  decorations([student, op, value]) {
    if (!isStudent(student)) {
      return `Unknown student: ${student} (valid ids are 0-15)`;
    }
    if (!isArithmetic(op)) {
      return `Unknown arithmetic: ${op}`;
    }
    const joiner = op === Arithmetic.Add || op === Arithmetic.Assign ? "to" : "from";

    return [
      {
        contentText: `${arithmaticConfiguraiton[op].name} ${value} ${joiner} `,
      },
      {
        contentText: characterData[student].name,
        color: characterData[student].color,
      },
      { contentText: ` student title entry` },
    ];
  },
};
