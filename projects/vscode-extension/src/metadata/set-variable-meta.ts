import {
  Arithmetic,
  arithmaticConfiguraiton,
  isArithmetic,
  isVariable,
  LinscriptInstructionName,
  Variable,
  variables,
} from "linscript-definitions";
import { variableData } from "../data/variable-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const setVariableMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.SetVariable,
  hexcode: "0x33",
  parameters: [
    {
      name: "address",
      values: Variable,
    },
    {
      name: "arithmetic",
      values: Arithmetic,
    },
    {
      name: "value",
      description: "16 bit value",
    },
  ] as const,
  decorations([address, arithmetic, value]) {
    if (!isVariable(address)) {
      return `Unknown address: ${address}`;
    }
    if (!isArithmetic(arithmetic)) {
      return `Unknown arithmetic: ${arithmetic}`;
    }
    const variableDetail = variableData[address];
    const variableName = variables[address] || `var ${address}`;

    // Try the formatter, then the values, then just 'var 123' if neither of those found
    const variableValue = variableDetail?.formatter?.(value) ?? variableDetail?.[value] ?? value;

    const joiner = arithmetic === Arithmetic.Assign || arithmetic === Arithmetic.Add ? "to" : "from";

    let valueColor: string = "";
    switch (variableValue) {
      case "Daytime":
        valueColor = "#e3d211ff";
        break;
      case "Nighttime":
        valueColor = "#4b8fd7ff";
        break;
      case "Morning":
        valueColor = "#dfe87aff";
        break;
      case "Midnight":
        valueColor = "#4b65d7ff";
        break;
      case "Time Unknown":
        valueColor = "#14a166ff";
        break;
    }

    return [
      { contentText: `${arithmaticConfiguraiton[arithmetic].name}` },
      { contentText: ` ${variableValue}`, color: valueColor },
      { contentText: ` ${joiner}` },
      { contentText: ` ${variableName}` },
    ];
  },
};
