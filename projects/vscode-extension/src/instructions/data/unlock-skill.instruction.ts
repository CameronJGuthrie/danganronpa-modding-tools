import { Bool, isSkill, LinscriptInstructionName, Skill, skills } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const unlockSkillInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.UnlockSkill,
  description: "Unlocks a skill for the player; the shipped scripts only ever pass True.",
  parameters: [
    {
      name: "skill",
      names: Skill,
    },
    {
      name: "unlocked",
      description: "True in every shipped script",
      names: Bool,
    },
  ],
  decorations: ([skill, _value]) => {
    if (!isSkill(skill)) {
      return `Unknown skill: ${skill}`;
    }

    return `Unlock ${skills[skill]}`;
  },
};
