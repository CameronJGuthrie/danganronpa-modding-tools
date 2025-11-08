import { Character } from "../../enum/character";
import { AlterEgoSprite } from "./AlterEgo";
import { AoiSprite } from "./Aoi";
import { ByakuyaSprite } from "./Byakuya";
import { CelesteSprite } from "./Celeste";
import { ChihiroSprite } from "./Chihiro";
import { HifumiSprite } from "./Hifumi";
import { HiroSprite } from "./Hiro";
import { JunkoSprite } from "./Junko";
import { KiyotakaSprite } from "./Kiyotaka";
import { KyokoSprite } from "./Kyoko";
import { LeonSprite } from "./Leon";
import { MakotoSprite } from "./Makoto";
import { MondoSprite } from "./Mondo";
import { MonokumaSprite } from "./Monokuma";
import { MukuroSprite } from "./Mukuro";
import { SakuraSprite } from "./Sakura";
import { SayakaSprite } from "./Sayaka";
import { TokoSprite } from "./Toko";

export const sprites: Record<Character, { [spriteId: number]: string } | undefined> = {
  [Character.Makoto]: MakotoSprite,
  [Character.Taka]: KiyotakaSprite,
  [Character.Byakuya]: ByakuyaSprite, // unfinished
  [Character.Mondo]: MondoSprite,
  [Character.Leon]: LeonSprite,
  [Character.Hifumi]: HifumiSprite,
  [Character.Hiro]: HiroSprite,
  [Character.Sayaka]: SayakaSprite,
  [Character.Kyoko]: KyokoSprite,
  [Character.Aoi]: AoiSprite,
  [Character.Toko]: TokoSprite, // unfinished
  [Character.Sakura]: SakuraSprite,
  [Character.Celeste]: CelesteSprite,
  [Character.Mukuro]: MukuroSprite,
  [Character.Chihiro]: ChihiroSprite, // these can be improved, he is crying in most of these and I gave them similar names
  [Character.Junko]: MonokumaSprite,
  [Character.Monokuma]: JunkoSprite,
  [Character.AlterEgo]: AlterEgoSprite,
  [Character.GenocideJill]: undefined,
  [Character.Headmaster]: undefined,
  [Character.MakotoMom]: undefined,
  [Character.MakotoDad]: undefined,
  [Character.MakotoSister]: undefined,
  [Character.Narrator]: undefined,
  [Character.TakaMondo]: undefined,
  [Character.DaiyaOwada]: undefined,
  [Character.Unknown]: undefined,
  [Character.Blank]: undefined,
  [Character.Usami]: undefined,
  [Character.MonokumaBackup]: undefined,
  [Character.MonokumaBackupR]: undefined,
  [Character.MonokumaBackupL]: undefined,
  [Character.MonokumaBackupM]: undefined,
};
