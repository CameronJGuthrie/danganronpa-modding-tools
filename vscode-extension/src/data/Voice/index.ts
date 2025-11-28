import { Character } from "../../enum/character";
import { CharacterVoiceLinesByChapter } from "./types";

import { byakuyaVoiceLines } from "./byakuya-voice-lines";
import { celesteVoiceLines } from "./celeste-voice-lines";
import { chihiroVoiceLines } from "./chihiro-voice-lines";
import { genocideJillVoiceLines } from "./genocide-jill-voice-lines";
import { hifumiVoiceLines } from "./hifumi-voice-lines";
import { hinaVoiceLines } from "./hina-voice-lines";
import { hiroVoiceLines } from "./hiro-voice-lines";
import { junkoVoiceLines } from "./junko-voice-lines";
import { kyokoVoiceLines } from "./kyoko-voice-lines";
import { leonVoiceLines } from "./leon-voice-lines";
import { makotoVoiceLines } from "./makoto-voice-lines";
import { mondoVoiceLines } from "./mondo-voice-lines";
import { monokumaVoiceLines } from "./monokuma-voice-lines";
import { mukuroVoiceLines } from "./mukuro-voice-lines";
import { sakuraVoiceLines } from "./sakura-voice-lines";
import { sayakaVoiceLines } from "./sayaka-voice-lines";
import { takaVoiceLines } from "./taka-voice-lines";
import { tokoVoiceLines } from "./toko-voice-lines";
import { usamiVoiceLines } from "./usami-voice-lines";

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
  [Character.MonokumaBackupM]: undefined
};
