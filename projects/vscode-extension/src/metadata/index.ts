import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

import { animationMeta } from "./animation-meta";
import { cameraFlashMeta } from "./camera-flash-meta";
import { endOfJumpMeta } from "./end-of-jump-meta";
import { givePresentMeta } from "./give-present-meta";
import { gotoMeta } from "./goto-meta";
import { ifFlagMeta } from "./if-flag-meta";
import { ifFreeTimeEventMeta } from "./if-free-time-event-meta";
import { ifMeta } from "./if-meta";
import { ifRelationshipMeta } from "./if-relationship-meta";
import { labelMeta } from "./label-meta";
import { loadMapMeta } from "./load-map-meta";
import { loadScriptMeta } from "./load-script-meta";
import { loadSpriteMeta } from "./load-sprite-meta";
import { movieMeta } from "./movie-meta";
import { musicMeta } from "./music-meta";
import { objectStateMeta } from "./object-state-meta";
import { onCharacterMeta } from "./on-character-meta";
import { onObjectMeta } from "./on-object-meta";
import { postProcessingEffectMeta } from "./post-processing-effect-meta";
import { receivePresentMeta } from "./receive-present-meta";
import { rawTextMeta } from "./raw-text-meta";
import { restartScriptMeta } from "./restart-script-meta";
import { runScriptMeta } from "./run-script-meta";
import { screenFadeMeta } from "./screen-fade-meta";
import { screenFlashMeta } from "./screen-flash-meta";
import { setFlagMeta } from "./set-flag-meta";
import { setOptionMeta } from "./set-option-meta";
import { setUiMeta } from "./set-ui-meta";
import { setVariableMeta } from "./set-variable-meta";
import { showBackgroundMeta } from "./show-background-meta";
import { soundBMeta } from "./sound-b-meta";
import { soundMeta } from "./sound-meta";
import { speakerMeta } from "./speaker-meta";
import { spriteFlashMeta } from "./sprite-flash-meta";
import { spriteMeta } from "./sprite-meta";
import { stopScriptMeta } from "./stop-script-meta";
import { studentRelationshipMeta } from "./student-relationship-meta";
import { studentReportInfoMeta } from "./student-report-info-meta";
import { studentTitleEntryMeta } from "./student-title-entry-meta";
import { textMeta } from "./text-meta";
import { textStyleMeta } from "./text-style-meta";
import { thenMeta } from "./then-meta";
import { trialCameraMeta } from "./trial-camera-meta";
import { truthBulletFlagMeta } from "./truth-bullet-flag-meta";
import { unlockSkillMeta } from "./unlock-still-meta";
import { voiceMeta } from "./voice-meta";
import { waitFrameMeta } from "./wait-frame-meta";
import { waitInputMeta } from "./wait-input-meta";
import { waitMeta } from "./wait-meta";

/** Opcode metadata keyed by opcode name, so lookups are type-checked against the enum. */
export const metadata: Readonly<Record<LinscriptInstructionName, Readonly<LinscriptInstructionMeta>>> = {
  [LinscriptInstructionName.Animation]: animationMeta,
  [LinscriptInstructionName.CameraFlash]: cameraFlashMeta,
  [LinscriptInstructionName.EndOfJump]: endOfJumpMeta,
  [LinscriptInstructionName.GivePresent]: givePresentMeta,
  [LinscriptInstructionName.Goto]: gotoMeta,
  [LinscriptInstructionName.If]: ifMeta,
  [LinscriptInstructionName.IfFlag]: ifFlagMeta,
  [LinscriptInstructionName.IfFreeTimeEvent]: ifFreeTimeEventMeta,
  [LinscriptInstructionName.IfRelationship]: ifRelationshipMeta,
  [LinscriptInstructionName.Label]: labelMeta,
  [LinscriptInstructionName.LoadMap]: loadMapMeta,
  [LinscriptInstructionName.LoadScript]: loadScriptMeta,
  [LinscriptInstructionName.LoadSprite]: loadSpriteMeta,
  [LinscriptInstructionName.Movie]: movieMeta,
  [LinscriptInstructionName.Music]: musicMeta,
  [LinscriptInstructionName.ObjectState]: objectStateMeta,
  [LinscriptInstructionName.OnCharacter]: onCharacterMeta,
  [LinscriptInstructionName.OnObject]: onObjectMeta,
  [LinscriptInstructionName.PostProcessingEffect]: postProcessingEffectMeta,
  [LinscriptInstructionName.RawText]: rawTextMeta,
  [LinscriptInstructionName.ReceivePresent]: receivePresentMeta,
  [LinscriptInstructionName.RestartScript]: restartScriptMeta,
  [LinscriptInstructionName.RunScript]: runScriptMeta,
  [LinscriptInstructionName.ScreenFade]: screenFadeMeta,
  [LinscriptInstructionName.ScreenFlash]: screenFlashMeta,
  [LinscriptInstructionName.SetFlag]: setFlagMeta,
  [LinscriptInstructionName.SetOption]: setOptionMeta,
  [LinscriptInstructionName.SetUI]: setUiMeta,
  [LinscriptInstructionName.SetVariable]: setVariableMeta,
  [LinscriptInstructionName.ShowBackground]: showBackgroundMeta,
  [LinscriptInstructionName.Sound]: soundMeta,
  [LinscriptInstructionName.SoundB]: soundBMeta,
  [LinscriptInstructionName.Speaker]: speakerMeta,
  [LinscriptInstructionName.Sprite]: spriteMeta,
  [LinscriptInstructionName.SpriteFlash]: spriteFlashMeta,
  [LinscriptInstructionName.StopScript]: stopScriptMeta,
  [LinscriptInstructionName.StudentRelationship]: studentRelationshipMeta,
  [LinscriptInstructionName.StudentReportInfo]: studentReportInfoMeta,
  [LinscriptInstructionName.StudentTitleEntry]: studentTitleEntryMeta,
  [LinscriptInstructionName.Text]: textMeta,
  [LinscriptInstructionName.TextStyle]: textStyleMeta,
  [LinscriptInstructionName.Then]: thenMeta,
  [LinscriptInstructionName.TrialCamera]: trialCameraMeta,
  [LinscriptInstructionName.TruthBulletFlag]: truthBulletFlagMeta,
  [LinscriptInstructionName.UnlockSkill]: unlockSkillMeta,
  [LinscriptInstructionName.Voice]: voiceMeta,
  [LinscriptInstructionName.Wait]: waitMeta,
  [LinscriptInstructionName.WaitFrame]: waitFrameMeta,
  [LinscriptInstructionName.WaitInput]: waitInputMeta,
};
