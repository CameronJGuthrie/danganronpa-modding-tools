import { skills } from "../data/skill-data";
import { FunctionName, LinscriptFunction } from "../enum/function";
import { isSkill, Skill } from "../enum/skill";

export const unlockSkill: LinscriptFunction = {
  name: FunctionName.UnlockSkill,
  opcode: "0x0E",
  parameters: [
    {
      name: "skillId",
      values: Skill
    },
    {
      name: "value",
      description: "always 1"
    }
  ],
  decorations: ([skill, _value]) => {
    if (!isSkill(skill)) {
      return `Unknown skill: ${skill}`;
    }

    return `Unlock ${skills[skill]}`
  }
}