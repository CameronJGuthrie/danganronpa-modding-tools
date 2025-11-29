import type { OpcodeMeta } from "../types/opcode-meta";

import { animationMeta } from "./animation-meta";
import { changeUiMeta } from "./change-ui-meta";
import { checkCharacterMeta } from "./check-character-opcode-meta";
import { checkObjectMeta } from "./check-object-opcode-meta";
import { evaluateMeta } from "./evaluate-meta";
import { evaluateFlagMeta } from "./evaluate-flag-opcode-meta";
import { evaluateFreeTimeEventMeta } from "./evaluate-free-time-event-meta";
import { evaluateRelationshipMeta } from "./evaluate-relationship-meta";
import { gotoMeta } from "./goto-meta";
import { ifTrueMeta } from "./if-true-meta";
import { labelMeta } from "./label-meta";
import { loadScriptMeta } from "./load-script-meta";
import { loadSpriteMeta } from "./load-sprite-meta";
import { movieMeta } from "./movie-meta";
import { musicMeta } from "./music-meta";
import { postProcessingEffectMeta } from "./post-processing-effect-meta";
import { presentMeta } from "./present-meta";
import { runScriptMeta } from "./run-script-meta";
import { screenFadeMeta } from "./screen-fade-meta";
import { screenFlashMeta } from "./screen-flash-meta";
import { setVar8Meta } from "./set-var-8-meta";
import { setVar16Meta } from "./set-var-16-meta";
import { showBackgroundMeta } from "./show-background-meta";
import { soundMeta } from "./sound-meta";
import { soundBMeta } from "./sound-b-meta";
import { speakerMeta } from "./speaker-meta";
import { spriteMeta } from "./sprite-meta";
import { spriteFlashMeta } from "./sprite-flash-meta";
import { studentRelationshipMeta } from "./student-relationship-meta";
import { studentReportInfoMeta } from "./student-report-info-meta";
import { studentTitleEntryMeta } from "./student-title-entry-meta";
import { textStyleMeta } from "./text-style-meta";
import { truthBulletFlagMeta } from "./truth-bullet-flag-meta";
import { unlockSkillMeta } from "./unlock-still-meta";
import { voiceMeta } from "./voice-meta";

export const metadata: Readonly<OpcodeMeta>[] = [
  animationMeta,
  changeUiMeta,
  checkCharacterMeta,
  checkObjectMeta,
  evaluateMeta,
  evaluateFlagMeta,
  evaluateFreeTimeEventMeta,
  evaluateRelationshipMeta,
  gotoMeta,
  ifTrueMeta,
  labelMeta,
  loadScriptMeta,
  loadSpriteMeta,
  movieMeta,
  musicMeta,
  postProcessingEffectMeta,
  presentMeta,
  runScriptMeta,
  screenFadeMeta,
  screenFlashMeta,
  setVar8Meta,
  setVar16Meta,
  showBackgroundMeta,
  soundMeta,
  soundBMeta,
  speakerMeta,
  spriteMeta,
  spriteFlashMeta,
  studentRelationshipMeta,
  studentReportInfoMeta,
  studentTitleEntryMeta,
  textStyleMeta,
  truthBulletFlagMeta,
  unlockSkillMeta,
  voiceMeta,
];
