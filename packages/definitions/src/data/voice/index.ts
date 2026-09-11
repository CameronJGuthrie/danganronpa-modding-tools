import { type Chapter } from "../../chapter.ts";
import { Character } from "../../character.ts";

import { byakuyaVoiceLines } from "./byakuya-voice-lines.ts";
import { celesteVoiceLines } from "./celeste-voice-lines.ts";
import { chihiroVoiceLines } from "./chihiro-voice-lines.ts";
import { genocideJillVoiceLines } from "./genocide-jill-voice-lines.ts";
import { hifumiVoiceLines } from "./hifumi-voice-lines.ts";
import { hinaVoiceLines } from "./hina-voice-lines.ts";
import { hiroVoiceLines } from "./hiro-voice-lines.ts";
import { junkoVoiceLines } from "./junko-voice-lines.ts";
import { kyokoVoiceLines } from "./kyoko-voice-lines.ts";
import { leonVoiceLines } from "./leon-voice-lines.ts";
import { makotoVoiceLines } from "./makoto-voice-lines.ts";
import { mondoVoiceLines } from "./mondo-voice-lines.ts";
import { monokumaVoiceLines } from "./monokuma-voice-lines.ts";
import { mukuroVoiceLines } from "./mukuro-voice-lines.ts";
import { sakuraVoiceLines } from "./sakura-voice-lines.ts";
import { sayakaVoiceLines } from "./sayaka-voice-lines.ts";
import { takaVoiceLines } from "./taka-voice-lines.ts";
import { tokoVoiceLines } from "./toko-voice-lines.ts";
import { usamiVoiceLines } from "./usami-voice-lines.ts";

export const voiceLinesByCharacterByChapter: CharacterVoiceLinesByChapter = {
  [Character.Makoto]: makotoVoiceLines,
  [Character.Taka]: takaVoiceLines,
  [Character.Byakuya]: byakuyaVoiceLines,
  [Character.Mondo]: mondoVoiceLines,
  [Character.Leon]: leonVoiceLines,
  [Character.Hifumi]: hifumiVoiceLines,
  [Character.Hiro]: hiroVoiceLines,
  [Character.Sayaka]: sayakaVoiceLines,
  [Character.Kyoko]: kyokoVoiceLines,
  [Character.Aoi]: hinaVoiceLines,
  [Character.Toko]: tokoVoiceLines,
  [Character.Sakura]: sakuraVoiceLines,
  [Character.Celeste]: celesteVoiceLines,
  [Character.Mukuro]: mukuroVoiceLines,
  [Character.Chihiro]: chihiroVoiceLines,
  [Character.Junko]: junkoVoiceLines,
  [Character.Monokuma]: monokumaVoiceLines,
  [Character.AlterEgo]: undefined,
  [Character.GenocideJill]: genocideJillVoiceLines,
  [Character.Headmaster]: undefined,
  [Character.MakotoMom]: undefined,
  [Character.MakotoDad]: undefined,
  [Character.MakotoSister]: undefined,
  [Character.Narrator]: undefined,
  [Character.TakaMondo]: undefined,
  [Character.DaiyaOwada]: undefined,
  [Character.Unknown]: undefined,
  [Character.Blank]: undefined,
  [Character.Usami]: usamiVoiceLines,
  [Character.MonokumaBackup]: undefined,
  [Character.MonokumaBackupR]: undefined,
  [Character.MonokumaBackupL]: undefined,
  [Character.MonokumaBackupM]: undefined,
};

export type VoiceMeta = {
  index: number;
};
export type ChapterVoiceLines = Record<Chapter, { [voiceLineId: number]: string; metadata: VoiceMeta } | undefined>;
export type CharacterVoiceLinesByChapter = Record<Character, ChapterVoiceLines | undefined>;
