import { defineEnum, type EnumValue } from "./enum.ts";

/**
 * The argument of the `Time(...)` sugar, which stands for `SetVariable(Time, =, value)`: the time
 * of day the game displays for the current scene. Each value is the Time variable's value.
 */
export const TimeOfDay = defineEnum({
  Day: 0,
  Night: 1,
  Morning: 2,
  Midnight: 3,
  Unknown: 4,
});
export type TimeOfDay = EnumValue<typeof TimeOfDay>;
