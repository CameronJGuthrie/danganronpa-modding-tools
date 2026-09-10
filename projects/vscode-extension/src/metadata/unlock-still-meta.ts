import { isSkill, LinscriptInstructionName, Skill } from "linscript-definitions";
import { skills } from "../data/skill-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const unlockSkillMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.UnlockSkill,
  hexcode: "0x0E",
  parameters: [
    {
      name: "skillId",
      values: Skill,
    },
    {
      name: "value",
      description: "always 1",
    },
  ],
  decorations: ([skill, _value]) => {
    if (!isSkill(skill)) {
      return `Unknown skill: ${skill}`;
    }

    return `Unlock ${skills[skill]}`;
  },
};
