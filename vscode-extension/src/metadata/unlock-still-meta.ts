import { skills } from "../data/skill-data";
import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";
import { isSkill, Skill } from "../enum/skill";

export const unlockSkillMeta: OpcodeMeta = {
  name: OpcodeName.UnlockSkill,
  opcode: "0x0E",
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
