import {
  Bool,
  Character,
  FlagGroup,
  flagGroups,
  isCharacter,
  isFlagGroup,
  LinscriptInstructionName,
  characterData,
  flagDataByFlagGroup,
  RESET_FLAGS,
} from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const setFlagMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.SetFlag,
  description:
    "Sets a boolean flag in a flag group, such as whether a character has been investigated or is dead. Read back with IfFlag.",
  parameters: [
    {
      name: "flagGroup",
      names: FlagGroup,
    },
    {
      name: "offset",
      namesBy: {
        argument: -1,
        tables: { [FlagGroup.CharacterInvestigated]: Character, [FlagGroup.CharacterDead]: Character },
      },
    },
    {
      name: "value",
      names: Bool,
      description: "True or False",
    },
  ] as const,
  decorations([group, offset, value]) {
    if (!isFlagGroup(group)) {
      return `Unknown flag group: ${group}`;
    }
    const addressValue = flagDataByFlagGroup[group]?.[offset]?.name ?? `${offset}`;

    let color = "#796d00ff";

    if (offset === RESET_FLAGS) {
      return [{ contentText: `Reset ${flagGroups[group]}`, color: color }];
    }

    if ((group === FlagGroup.CharacterDead || group === FlagGroup.CharacterInvestigated) && isCharacter(offset)) {
      color = characterData[offset].color;
    }

    let flagEmoji = "🏳️";
    if (group === FlagGroup.CharacterDead) {
      flagEmoji = "🏴";
    }

    const tfColor = value ? "#188233" : "#a52626";
    const tfText = value ? " = True" : " = False";

    return [
      { contentText: `${flagEmoji} ${flagGroups[group]} `, color: tfColor },
      { contentText: `→ ${addressValue}`, color: color },
      { contentText: tfText, color: tfColor },
    ];
  },
};
