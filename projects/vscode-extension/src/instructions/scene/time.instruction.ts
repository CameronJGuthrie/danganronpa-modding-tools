import { LinscriptInstructionName, TimeOfDay } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

const LABELS: Record<number, string> = {
  [TimeOfDay.Day]: "☀️ Day",
  [TimeOfDay.Night]: "🌙 Night",
  [TimeOfDay.Morning]: "🌅 Morning",
  [TimeOfDay.Midnight]: "🌑 Midnight",
  [TimeOfDay.Unknown]: "❓ Time unknown",
};

/** Source-only sugar for `SetVariable(Time, Assign, value)`: the time of day shown for the scene. */
export const timeInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Time,
  sugar: true,
  selfDescribing: true,
  description: "Sets the time of day displayed for the scene; sugar for SetVariable(Time, =, value).",
  parameters: [
    {
      name: "timeOfDay",
      names: TimeOfDay,
    },
  ] as const,
  decorations([timeOfDay]) {
    return LABELS[timeOfDay] ?? `Unknown time ${timeOfDay}`;
  },
};
