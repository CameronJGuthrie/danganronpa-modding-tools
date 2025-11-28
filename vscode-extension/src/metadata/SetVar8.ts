import { characterConfiguration } from "../data/character-data";
import { flagDataByFlagGroup, RESET_FLAGS } from "../data/flag-data";
import { isCharacter } from "../enum/character";
import { FlagGroup, flagGroups, isFlagGroup } from "../enum/flag-group";
import { OpcodeName, OpcodeMeta } from "../enum/opcode";

// A better name for this would be setFlag
export const setVar8: OpcodeMeta = {
  name: OpcodeName.SetVar8,
  opcode: "0x26",
  parameters: [
    {
      name: "flagGroup"
    },
    {
      name: "offset",
    },
    {
      name: "value",
      description: "0 or 1",
    },
  ] as const,
  decorations([group, offset, value]) {
    if (!isFlagGroup(group)) {
      return `Unknown flag group: ${group}`;
    }
    const addressValue = flagDataByFlagGroup[group]?.[offset]?.name ?? `${offset}`;

    let color = '#796d00ff';

    if (offset === RESET_FLAGS) {
      return [
        { contentText: `Reset ${flagGroups[group]}`, color: color }
      ];
    }

    if ((group === FlagGroup.CharacterDead || group === FlagGroup.CharacterInvestigated) && isCharacter(offset)) {
      color = characterConfiguration[offset].color;
    }

    let flagEmoji = '🏳️';
    if (group === FlagGroup.CharacterDead) {
      flagEmoji = '🏴';
    }

    const tfColor = value ? "#188233" : "#a52626";
    const tfText = value ? " = True" : " = False";

    return [
      { contentText: `${flagEmoji} ${flagGroups[group]} `, color: tfColor },
      { contentText: `→ ${addressValue}`, color: color },
      { contentText: tfText, color: tfColor }
    ];
  },
};
