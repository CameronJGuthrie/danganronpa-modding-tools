import { defineEnum, type EnumValue } from "./enum.ts";

/**
 * The first argument of the `Mode(...)` sugar, which stands for the UI toggles that start a
 * character's lines followed by `Speaker(...)`. `Speaking` and `Thinking` are the `UiVisibility`
 * byte they give the Thinking interface (`Speaking` hides the thought box and `Thinking` shows it),
 * and both show the name plate. `System` hides the name plate for unattributed text such as sound
 * effects and tutorial prompts; its value is source-only and never written to a `SetUI`.
 */
export const Mode = defineEnum({
  Speaking: 0,
  Thinking: 1,
  System: 2,
});
export type Mode = EnumValue<typeof Mode>;
