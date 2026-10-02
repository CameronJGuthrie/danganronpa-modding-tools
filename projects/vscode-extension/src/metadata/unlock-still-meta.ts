import { isSkill, LinscriptInstructionName, Skill, skills } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const unlockSkillMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.UnlockSkill,
  description: "Unlocks a skill for the player; the value is always 1.",
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
