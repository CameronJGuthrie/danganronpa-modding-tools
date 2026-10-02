import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

import { animationInstruction } from "./animation.instruction";
import { cameraFlashInstruction } from "./camera-flash.instruction";
import { characterInstruction } from "./character.instruction";
import { givePresentInstruction } from "./give-present.instruction";
import { gotoInstruction } from "./goto.instruction";
import { ifFlagInstruction } from "./if-flag.instruction";
import { ifFreeTimeEventInstruction } from "./if-free-time-event.instruction";
import { ifInstruction } from "./if.instruction";
import { ifRelationshipInstruction } from "./if-relationship.instruction";
import { labelInstruction } from "./label.instruction";
import { labelNameInstruction } from "./label-name.instruction";
import { loadMapInstruction } from "./load-map.instruction";
import { loadScriptInstruction } from "./load-script.instruction";
import { loadSpriteInstruction } from "./load-sprite.instruction";
import { metaInstruction } from "./meta.instruction";
import { movieInstruction } from "./movie.instruction";
import { musicInstruction } from "./music.instruction";
import { objectInstruction } from "./object.instruction";
import { objectStateInstruction } from "./object-state.instruction";
import { onCharacterInstruction } from "./on-character.instruction";
import { onObjectInstruction } from "./on-object.instruction";
import { optionInstruction } from "./option.instruction";
import { postProcessingEffectInstruction } from "./post-processing-effect.instruction";
import { rawTextInstruction } from "./raw-text.instruction";
import { receivePresentInstruction } from "./receive-present.instruction";
import { returnInstruction } from "./return.instruction";
import { runScriptInstruction } from "./run-script.instruction";
import { screenFadeInstruction } from "./screen-fade.instruction";
import { screenFlashInstruction } from "./screen-flash.instruction";
import { setFlagInstruction } from "./set-flag.instruction";
import { setOptionInstruction } from "./set-option.instruction";
import { setUiInstruction } from "./set-ui.instruction";
import { setVariableInstruction } from "./set-variable.instruction";
import { showBackgroundInstruction } from "./show-background.instruction";
import { soundBInstruction } from "./sound-b.instruction";
import { soundInstruction } from "./sound.instruction";
import { speakerInstruction } from "./speaker.instruction";
import { spriteFlashInstruction } from "./sprite-flash.instruction";
import { spriteInstruction } from "./sprite.instruction";
import { stopScriptInstruction } from "./stop-script.instruction";
import { studentRelationshipInstruction } from "./student-relationship.instruction";
import { studentReportInfoInstruction } from "./student-report-info.instruction";
import { studentTitleEntryInstruction } from "./student-title-entry.instruction";
import { textInstruction } from "./text.instruction";
import { textStyleInstruction } from "./text-style.instruction";
import { trialCameraInstruction } from "./trial-camera.instruction";
import { truthBulletFlagInstruction } from "./truth-bullet-flag.instruction";
import { unlockSkillInstruction } from "./unlock-skill.instruction";
import { voiceInstruction } from "./voice.instruction";
import { waitFrameInstruction } from "./wait-frame.instruction";
import { waitInputInstruction } from "./wait-input.instruction";
import { waitInstruction } from "./wait.instruction";

/** Every instruction keyed by its name, so lookups are type-checked against the enum. */
export const instructions: Readonly<Record<LinscriptInstructionName, Readonly<LinscriptInstruction>>> = {
  [LinscriptInstructionName.Animation]: animationInstruction,
  [LinscriptInstructionName.CameraFlash]: cameraFlashInstruction,
  [LinscriptInstructionName.Character]: characterInstruction,
  [LinscriptInstructionName.GivePresent]: givePresentInstruction,
  [LinscriptInstructionName.Goto]: gotoInstruction,
  [LinscriptInstructionName.If]: ifInstruction,
  [LinscriptInstructionName.IfFlag]: ifFlagInstruction,
  [LinscriptInstructionName.IfFreeTimeEvent]: ifFreeTimeEventInstruction,
  [LinscriptInstructionName.IfRelationship]: ifRelationshipInstruction,
  [LinscriptInstructionName.Label]: labelInstruction,
  [LinscriptInstructionName.LabelName]: labelNameInstruction,
  [LinscriptInstructionName.LoadMap]: loadMapInstruction,
  [LinscriptInstructionName.LoadScript]: loadScriptInstruction,
  [LinscriptInstructionName.LoadSprite]: loadSpriteInstruction,
  [LinscriptInstructionName.Meta]: metaInstruction,
  [LinscriptInstructionName.Movie]: movieInstruction,
  [LinscriptInstructionName.Music]: musicInstruction,
  [LinscriptInstructionName.Object]: objectInstruction,
  [LinscriptInstructionName.ObjectState]: objectStateInstruction,
  [LinscriptInstructionName.OnCharacter]: onCharacterInstruction,
  [LinscriptInstructionName.OnObject]: onObjectInstruction,
  [LinscriptInstructionName.Option]: optionInstruction,
  [LinscriptInstructionName.PostProcessingEffect]: postProcessingEffectInstruction,
  [LinscriptInstructionName.RawText]: rawTextInstruction,
  [LinscriptInstructionName.ReceivePresent]: receivePresentInstruction,
  [LinscriptInstructionName.Return]: returnInstruction,
  [LinscriptInstructionName.RunScript]: runScriptInstruction,
  [LinscriptInstructionName.ScreenFade]: screenFadeInstruction,
  [LinscriptInstructionName.ScreenFlash]: screenFlashInstruction,
  [LinscriptInstructionName.SetFlag]: setFlagInstruction,
  [LinscriptInstructionName.SetOption]: setOptionInstruction,
  [LinscriptInstructionName.SetUI]: setUiInstruction,
  [LinscriptInstructionName.SetVariable]: setVariableInstruction,
  [LinscriptInstructionName.ShowBackground]: showBackgroundInstruction,
  [LinscriptInstructionName.Sound]: soundInstruction,
  [LinscriptInstructionName.SoundB]: soundBInstruction,
  [LinscriptInstructionName.Speaker]: speakerInstruction,
  [LinscriptInstructionName.Sprite]: spriteInstruction,
  [LinscriptInstructionName.SpriteFlash]: spriteFlashInstruction,
  [LinscriptInstructionName.StopScript]: stopScriptInstruction,
  [LinscriptInstructionName.StudentRelationship]: studentRelationshipInstruction,
  [LinscriptInstructionName.StudentReportInfo]: studentReportInfoInstruction,
  [LinscriptInstructionName.StudentTitleEntry]: studentTitleEntryInstruction,
  [LinscriptInstructionName.Text]: textInstruction,
  [LinscriptInstructionName.TextStyle]: textStyleInstruction,
  [LinscriptInstructionName.TrialCamera]: trialCameraInstruction,
  [LinscriptInstructionName.TruthBulletFlag]: truthBulletFlagInstruction,
  [LinscriptInstructionName.UnlockSkill]: unlockSkillInstruction,
  [LinscriptInstructionName.Voice]: voiceInstruction,
  [LinscriptInstructionName.Wait]: waitInstruction,
  [LinscriptInstructionName.WaitFrame]: waitFrameInstruction,
  [LinscriptInstructionName.WaitInput]: waitInputInstruction,
};
