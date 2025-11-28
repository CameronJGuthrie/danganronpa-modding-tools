import { UserInterface } from "../enum/user-interface";


export const userInterfaceConfiguration: Record<UserInterface, string> = {
  [UserInterface.Textbox]: "Textbox",
  [UserInterface.Name]: "Name",
  [UserInterface.HUD]: "HUD",
  [UserInterface.Minimap]: "Minimap",
  [UserInterface.BlackBackground]: "Black Background",
  [UserInterface.TextboxOnly]: "Textbox Only",
  [UserInterface.ClassTrial]: "Class Trial",
  [UserInterface.BustUp]: "Bust-up",
  [UserInterface.MovieBackground]: "Movie Background",
  [UserInterface.Save]: "Save",
  [UserInterface.Rumble]: "Rumble",
  [UserInterface.CameraPan]: "Camera Pan",
  [UserInterface.CameraLook]: "Camera Look",
  [UserInterface.Investigate]: "Investigate",
  [UserInterface.ChooseOption]: "Choose Option",
  [UserInterface.ChoosePresent]: "Choose Present",
  [UserInterface.BleepText]: "Bleep Text",
  [UserInterface.CameraZoom]: "Camera Zoom",
  [UserInterface.CameraCharacter]: "Camera Character",
  [UserInterface.CameraSubarea]: "Camera Subarea",
  [UserInterface.PanicTalkAction]: "Panic Talk Action",
  [UserInterface.ChooseEvidence]: "Choose Evidence",
  [UserInterface.ChoosePerson]: "Choose Person",
  [UserInterface.MonoMonoMachine]: "Mono Mono Machine",
  [UserInterface.VendingMachine]: "Vending Machine",
  [UserInterface.IslandMode]: "Island Mode",
  [UserInterface.Minimal]: "Minimal",
  [UserInterface.LogicDive]: "Logic Dive",
  [UserInterface.SplitScreen]: "Split Screen",
};

const set = new Set(Object.values(UserInterface).filter(v => typeof v === "number"));

export function isUserInterface(interfaceId: number): interfaceId is UserInterface {
  return set.has(interfaceId);
}
