import { defineEnum, type EnumValue } from "./enum.ts";

/**
 * The first argument of the `Mode(...)` sugar, which stands for the `SetUI(Thinking, …)` toggle
 * followed by `Speaker(...)`. Each value is the `UiVisibility` byte the mode gives the Thinking
 * interface: `Speaking` hides the thought box and `Thinking` shows it.
 */
export const Mode = defineEnum({
  Speaking: 0,
  Thinking: 1,
});
export type Mode = EnumValue<typeof Mode>;
