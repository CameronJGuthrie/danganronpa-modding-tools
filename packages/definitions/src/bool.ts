import { defineEnum, type EnumValue } from "./enum.ts";

/** A byte that is only ever 0 or 1, written as `False` / `True` in `.linscript`. */
export const Bool = defineEnum({
  False: 0,
  True: 1,
});
export type Bool = EnumValue<typeof Bool>;
