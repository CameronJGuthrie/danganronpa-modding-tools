import { animation } from "./Animation";
import { changeUi } from "./ChangeUI";
import { checkCharacter } from "./CheckCharacter";
import { checkObject } from "./CheckObject";
import { evaluate } from "./Evaluate";
import { evaluateFlag } from "./EvaluateFlag";
import { evaluateFreeTimeEvent } from "./EvaluateFreeTimeEvent";
import { evaluateRelationship } from "./EvaluateRelationship";
import { goto } from "./Goto";
import { ifTrue } from "./IfTrue";
import { label } from "./Label";
import { loadScript } from "./LoadScript";
import { loadSprite } from "./LoadSprite";
import { movie } from "./Movie";
import { music } from "./Music";
import { postProcessingEffect } from "./PostProcessingEffect";
import { present } from "./Present";
import { runScript } from "./RunScript";
import { screenFade } from "./ScreenFade";
import { screenFlash } from "./ScreenFlash";
import { setVar8 } from "./SetVar8";
import { setVar16 } from "./SetVar16";
import { showBackground } from "./ShowBackground";
import { sound } from "./Sound";
import { soundB } from "./SoundB";
import { speaker } from "./Speaker";
import { sprite } from "./Sprite";
import { spriteFlash } from "./SpriteFlash";
import { studentRelationship } from "./StudentRelationship";
import { studentReportInfo } from "./StudentReportInfo";
import { studentTitleEntry } from "./StudentTitleEntry";
import { textStyle } from "./TextStyle";
import { truthBulletFlag } from "./TruthBulletFlag";
import { unlockSkill } from "./UnlockSkill";
import { voice } from "./Voice";
import { OpcodeMeta } from "../enum/opcode";

export const metadata: Readonly<OpcodeMeta>[] = [
  animation,
  changeUi,
  checkCharacter,
  checkObject,
  evaluate,
  evaluateFlag,
  evaluateFreeTimeEvent,
  evaluateRelationship,
  goto,
  ifTrue,
  label,
  loadScript,
  loadSprite,
  movie,
  music,
  postProcessingEffect,
  present,
  runScript,
  screenFade,
  screenFlash,
  setVar8,
  setVar16,
  showBackground,
  sound,
  soundB,
  speaker,
  sprite,
  spriteFlash,
  studentRelationship,
  studentReportInfo,
  studentTitleEntry,
  textStyle,
  truthBulletFlag,
  unlockSkill,
  voice,
];