import { Character } from "../../enum/character";
import { ByakuyaVoice } from "./Byakuya";
import { CelesteVoice } from "./Celeste";
import { ChihiroVoice } from "./Chihiro";
import { GenocideJillVoice } from "./GenocideJill";
import { HifumiVoice } from "./Hifumi";
import { HinaVoice } from "./Hina";
import { HiroVoice } from "./Hiro";
import { JunkoVoice } from "./Junko";
import { KyokoVoice } from "./Kyoko";
import { LeonVoice } from "./Leon";
import { MakotoVoice } from "./Makoto";
import { MondoVoice } from "./Mondo";
import { MonokumaVoice } from "./Monokuma";
import { MukuroVoice } from "./Mukuro";
import { SakuraVoice } from "./Sakura";
import { SayakaVoice } from "./Sayaka";
import { TakaVoice } from "./Taka";
import { TokoVoice } from "./Toko";
import { CharacterVoiceLinesByChapter } from "./types";
import { UsamiVoice } from "./Usami";

export const voiceLinesByCharacterByChapter: CharacterVoiceLinesByChapter = {
  [Character.Makoto]: MakotoVoice,
  [Character.Taka]: TakaVoice,
  [Character.Byakuya]: ByakuyaVoice,
  [Character.Mondo]: MondoVoice,
  [Character.Leon]: LeonVoice,
  [Character.Hifumi]: HifumiVoice,
  [Character.Hiro]: HiroVoice,
  [Character.Sayaka]: SayakaVoice,
  [Character.Kyoko]: KyokoVoice,
  [Character.Aoi]: HinaVoice,
  [Character.Toko]: TokoVoice,
  [Character.Sakura]: SakuraVoice,
  [Character.Celeste]: CelesteVoice,
  [Character.Mukuro]: MukuroVoice,
  [Character.Chihiro]: ChihiroVoice,
  [Character.Junko]: JunkoVoice,
  [Character.Monokuma]: MonokumaVoice,
  [Character.AlterEgo]: undefined,
  [Character.GenocideJill]: GenocideJillVoice,
  [Character.Headmaster]: undefined,
  [Character.MakotoMom]: undefined,
  [Character.MakotoDad]: undefined,
  [Character.MakotoSister]: undefined,
  [Character.Narrator]: undefined,
  [Character.TakaMondo]: undefined,
  [Character.DaiyaOwada]: undefined,
  [Character.Unknown]: undefined,
  [Character.Blank]: undefined,
  [Character.Usami]: UsamiVoice,
  [Character.MonokumaBackup]: undefined,
  [Character.MonokumaBackupR]: undefined,
  [Character.MonokumaBackupL]: undefined,
  [Character.MonokumaBackupM]: undefined
};
