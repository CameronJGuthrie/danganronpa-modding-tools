import { truthBulletFlags } from "../data/truth-bullet-data";
import { type OpcodeMeta, OpcodeName } from "../enum/opcode";
import { isTruthBullet, TruthBullet } from "../enum/truth-bullet";

export const truthBulletFlag: OpcodeMeta = {
  name: OpcodeName.TruthBulletFlag,
  opcode: "0x0C",
  parameters: [
    {
      name: "flagId",
      values: truthBulletFlags,
    },
    {
      name: "state",
      values: {
        0: "Reset",
        1: "Unlock",
        2: "Update",
      },
    },
  ] as const,
  decorations([flagId, operation]) {
    if (!isTruthBullet(flagId)) {
      return `Unknown truth bullet: ${flagId}`;
    }
    if (flagId === TruthBullet.Reset) {
      return `Reset All Truth Bullets`;
    }

    const flagName = truthBulletFlags[flagId];

    let operationName: string;
    if (operation === 0) {
      operationName = "Reset";
    } else if (operation === 1) {
      operationName = "Unlock";
    } else {
      operationName = "Update";
    }

    return `${operationName} Truth Bullet: ${flagName}`;
  },
};
