import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

import { animationMeta } from "./animation-meta";
import { autoTextMeta } from "./auto-text-meta";
import { cameraFlashMeta } from "./camera-flash-meta";
import { changeUiMeta } from "./change-ui-meta";
import { checkCharacterMeta } from "./check-character-opcode-meta";
import { checkObjectMeta } from "./check-object-opcode-meta";
import { endOfJumpMeta } from "./end-of-jump-meta";
import { evaluateFlagMeta } from "./evaluate-flag-opcode-meta";
import { evaluateFreeTimeEventMeta } from "./evaluate-free-time-event-meta";
import { evaluateMeta } from "./evaluate-meta";
import { evaluateRelationshipMeta } from "./evaluate-relationship-meta";
import { gotoMeta } from "./goto-meta";
import { ifTrueMeta } from "./if-true-meta";
import { labelMeta } from "./label-meta";
import { loadMapMeta } from "./load-map-meta";
import { loadScriptMeta } from "./load-script-meta";
import { loadSpriteMeta } from "./load-sprite-meta";
import { movieMeta } from "./movie-meta";
import { musicMeta } from "./music-meta";
import { objectStateMeta } from "./object-state-meta";
import { postProcessingEffectMeta } from "./post-processing-effect-meta";
import { presentMeta } from "./present-meta";
import { restartScriptMeta } from "./restart-script-meta";
import { runScriptMeta } from "./run-script-meta";
import { screenFadeMeta } from "./screen-fade-meta";
import { screenFlashMeta } from "./screen-flash-meta";
import { setOptionMeta } from "./set-option-meta";
import { setVar8Meta } from "./set-var-8-meta";
import { setVar16Meta } from "./set-var-16-meta";
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
import { trialCameraMeta } from "./trial-camera-meta";
import { truthBulletFlagMeta } from "./truth-bullet-flag-meta";
import { unlockSkillMeta } from "./unlock-still-meta";
import { voiceMeta } from "./voice-meta";
import { waitFrameMeta } from "./wait-frame-meta";
import { waitInputMeta } from "./wait-input-meta";

/** Opcode metadata keyed by opcode name, so lookups are type-checked against the enum. */
export const metadata: Readonly<Record<LinscriptInstructionName, Readonly<LinscriptInstructionMeta>>> = {
  [LinscriptInstructionName.Animation]: animationMeta,
  [LinscriptInstructionName.AutoText]: autoTextMeta,
  [LinscriptInstructionName.CameraFlash]: cameraFlashMeta,
  [LinscriptInstructionName.ChangeUI]: changeUiMeta,
  [LinscriptInstructionName.CheckCharacter]: checkCharacterMeta,
  [LinscriptInstructionName.CheckObject]: checkObjectMeta,
  [LinscriptInstructionName.EndOfJump]: endOfJumpMeta,
  [LinscriptInstructionName.Evaluate]: evaluateMeta,
  [LinscriptInstructionName.EvaluateFlag]: evaluateFlagMeta,
  [LinscriptInstructionName.EvaluateFreeTimeEvent]: evaluateFreeTimeEventMeta,
  [LinscriptInstructionName.EvaluateRelationship]: evaluateRelationshipMeta,
  [LinscriptInstructionName.Goto]: gotoMeta,
  [LinscriptInstructionName.IfTrue]: ifTrueMeta,
  [LinscriptInstructionName.Label]: labelMeta,
  [LinscriptInstructionName.LoadMap]: loadMapMeta,
  [LinscriptInstructionName.LoadScript]: loadScriptMeta,
  [LinscriptInstructionName.LoadSprite]: loadSpriteMeta,
  [LinscriptInstructionName.Movie]: movieMeta,
  [LinscriptInstructionName.Music]: musicMeta,
  [LinscriptInstructionName.ObjectState]: objectStateMeta,
  [LinscriptInstructionName.PostProcessingEffect]: postProcessingEffectMeta,
  [LinscriptInstructionName.Present]: presentMeta,
  [LinscriptInstructionName.RestartScript]: restartScriptMeta,
  [LinscriptInstructionName.RunScript]: runScriptMeta,
  [LinscriptInstructionName.ScreenFade]: screenFadeMeta,
  [LinscriptInstructionName.ScreenFlash]: screenFlashMeta,
  [LinscriptInstructionName.SetOption]: setOptionMeta,
  [LinscriptInstructionName.SetVar16]: setVar16Meta,
  [LinscriptInstructionName.SetVar8]: setVar8Meta,
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
  [LinscriptInstructionName.TrialCamera]: trialCameraMeta,
  [LinscriptInstructionName.TruthBulletFlag]: truthBulletFlagMeta,
  [LinscriptInstructionName.UnlockSkill]: unlockSkillMeta,
  [LinscriptInstructionName.Voice]: voiceMeta,
  [LinscriptInstructionName.WaitFrame]: waitFrameMeta,
  [LinscriptInstructionName.WaitInput]: waitInputMeta,
};
