import { defineEnum, type EnumValue } from "./enum.ts";

/**
 * The second argument of `ObjectState(object, visibility, interaction)`: whether the room model's
 * object is drawn. Tested in game (chapter 1 scene 11, Makoto's room): `Invisible` removes the
 * golden sword, `Visible` puts the torn wall paper back and its `OnObject` handler works again.
 * Scene entry scripts remove every object the scene has not reached yet, and pickups remove
 * themselves from inside their own handler.
 */
export const ObjectVisibility = defineEnum({
  Invisible: 0,
  Visible: 1,
});
export type ObjectVisibility = EnumValue<typeof ObjectVisibility>;

/**
 * The third argument of `ObjectState(object, visibility, interaction)`: whether the object can be
 * examined. Tested in game: a `Visible` object placed as `NonInteractable` cannot be clicked even
 * when the script has an `OnObject` handler for it. The shipped scripts only use it for fixtures
 * such as the dorm nameplates and the pool lockers.
 */
export const ObjectInteraction = defineEnum({
  Interactable: 0,
  NonInteractable: 1,
});
export type ObjectInteraction = EnumValue<typeof ObjectInteraction>;
