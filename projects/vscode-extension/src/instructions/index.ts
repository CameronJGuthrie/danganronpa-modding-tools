import { LinscriptInstructionName } from "linscript-definitions";
import { musicInstruction } from "./audio/music.instruction";
import { soundInstruction } from "./audio/sound.instruction";
import { soundBInstruction } from "./audio/sound-b.instruction";
import { voiceInstruction } from "./audio/voice.instruction";
import { givePresentInstruction } from "./data/give-present.instruction";
import { receivePresentInstruction } from "./data/receive-present.instruction";
import { setFlagInstruction } from "./data/set-flag.instruction";
import { setVariableInstruction } from "./data/set-variable.instruction";
import { studentRelationshipInstruction } from "./data/student-relationship.instruction";
import { studentReportInfoInstruction } from "./data/student-report-info.instruction";
import { studentTitleEntryInstruction } from "./data/student-title-entry.instruction";
import { truthBulletFlagInstruction } from "./data/truth-bullet-flag.instruction";
import { unlockSkillInstruction } from "./data/unlock-skill.instruction";
import { rawTextInstruction } from "./dialogue/raw-text.instruction";
import { modeInstruction } from "./dialogue/mode.instruction";
import { speakerInstruction } from "./dialogue/speaker.instruction";
import { textInstruction } from "./dialogue/text.instruction";
import { textStyleInstruction } from "./dialogue/text-style.instruction";
import { waitInstruction } from "./dialogue/wait.instruction";
import { waitFrameInstruction } from "./dialogue/wait-frame.instruction";
import { waitInputInstruction } from "./dialogue/wait-input.instruction";
import { animationInstruction } from "./effect/animation.instruction";
import { cameraFlashInstruction } from "./effect/camera-flash.instruction";
import { movieInstruction } from "./effect/movie.instruction";
import { postProcessingEffectInstruction } from "./effect/post-processing-effect.instruction";
import { screenFadeInstruction } from "./effect/screen-fade.instruction";
import { screenFlashInstruction } from "./effect/screen-flash.instruction";
import { setUiInstruction } from "./effect/set-ui.instruction";
import { spriteInstruction } from "./effect/sprite.instruction";
import { spriteFlashInstruction } from "./effect/sprite-flash.instruction";
import { trialCameraInstruction } from "./effect/trial-camera.instruction";
import { gotoInstruction } from "./flow/goto.instruction";
import { ifInstruction } from "./flow/if.instruction";
import { ifFlagInstruction } from "./flow/if-flag.instruction";
import { ifFreeTimeEventInstruction } from "./flow/if-free-time-event.instruction";
import { ifRelationshipInstruction } from "./flow/if-relationship.instruction";
import { labelInstruction } from "./flow/label.instruction";
import { loadScriptInstruction } from "./flow/load-script.instruction";
import { returnInstruction } from "./flow/return.instruction";
import { runScriptInstruction } from "./flow/run-script.instruction";
import { stopScriptInstruction } from "./flow/stop-script.instruction";
import { onCharacterInstruction } from "./handlers/on-character.instruction";
import { onObjectInstruction } from "./handlers/on-object.instruction";
import { optionInstruction } from "./handlers/option.instruction";
import { setOptionInstruction } from "./handlers/set-option.instruction";
import type { LinscriptInstruction } from "./linscript-instruction";
import { characterInstruction } from "./meta/character.instruction";
import { labelNameInstruction } from "./meta/label-name.instruction";
import { metaInstruction } from "./meta/meta.instruction";
import { objectInstruction } from "./meta/object.instruction";
import { loadMapInstruction } from "./scene/load-map.instruction";
import { mapCharacterInstruction } from "./scene/map-character.instruction";
import { mapClearAllInstruction } from "./scene/map-clear-all.instruction";
import { mapClearCharacterStatusInstruction } from "./scene/map-clear-character-status.instruction";
import { mapClearPositionsInstruction } from "./scene/map-clear-positions.instruction";
import { mapIconsInstruction } from "./scene/map-icons.instruction";
import { objectStateInstruction } from "./scene/object-state.instruction";
import { showBackgroundInstruction } from "./scene/show-background.instruction";
import { timeInstruction } from "./scene/time.instruction";

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
  [LinscriptInstructionName.MapCharacter]: mapCharacterInstruction,
  [LinscriptInstructionName.MapClearAll]: mapClearAllInstruction,
  [LinscriptInstructionName.MapClearCharacterStatus]: mapClearCharacterStatusInstruction,
  [LinscriptInstructionName.MapClearPositions]: mapClearPositionsInstruction,
  [LinscriptInstructionName.MapIcons]: mapIconsInstruction,
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
  [LinscriptInstructionName.Mode]: modeInstruction,
  [LinscriptInstructionName.Speaker]: speakerInstruction,
  [LinscriptInstructionName.Sprite]: spriteInstruction,
  [LinscriptInstructionName.SpriteFlash]: spriteFlashInstruction,
  [LinscriptInstructionName.StopScript]: stopScriptInstruction,
  [LinscriptInstructionName.StudentRelationship]: studentRelationshipInstruction,
  [LinscriptInstructionName.StudentReportInfo]: studentReportInfoInstruction,
  [LinscriptInstructionName.StudentTitleEntry]: studentTitleEntryInstruction,
  [LinscriptInstructionName.Text]: textInstruction,
  [LinscriptInstructionName.TextStyle]: textStyleInstruction,
  [LinscriptInstructionName.Time]: timeInstruction,
  [LinscriptInstructionName.TrialCamera]: trialCameraInstruction,
  [LinscriptInstructionName.TruthBulletFlag]: truthBulletFlagInstruction,
  [LinscriptInstructionName.UnlockSkill]: unlockSkillInstruction,
  [LinscriptInstructionName.Voice]: voiceInstruction,
  [LinscriptInstructionName.Wait]: waitInstruction,
  [LinscriptInstructionName.WaitFrame]: waitFrameInstruction,
  [LinscriptInstructionName.WaitInput]: waitInputInstruction,
};
