import { Character } from "../../enum/character";
import { alterEgoSprite } from "./alter-ego-sprite-data";
import { hinaSprite } from "./hina-sprite-data";
import { byakuyaSprite } from "./byakuya-sprite-data";
import { celesteSprite } from "./celeste-sprite-data";
import { chihiroSprite } from "./chihiro-sprite-data";
import { hifumiSprite } from "./hifumi-sprite-data";
import { hiroSprite } from "./hiro-sprite-data";
import { junkoSprite } from "./junko-sprite-data";
import { kiyotakaSprite } from "./kiyotaka-sprite-data";
import { kyokoSprite } from "./kyoko-sprite-data";
import { leonSprite } from "./leon-sprite-data";
import { makotoSprite } from "./makoto-sprite-data";
import { mondoSprite } from "./mondo-sprite-data";
import { monokumaSprite } from "./monokuma-sprite-data";
import { mukuroSprite } from "./mukuro-sprite-data";
import { sakuraSprite } from "./sakura-sprite-data";
import { sayakaSprite } from "./sayaka-sprite-data";
import { tokoSprite } from "./toko-sprite-data";

export const sprites: Record<Character, { [spriteId: number]: string } | undefined> = {
  [Character.Makoto]: makotoSprite,
  [Character.Taka]: kiyotakaSprite,
  [Character.Byakuya]: byakuyaSprite, // unfinished
  [Character.Mondo]: mondoSprite,
  [Character.Leon]: leonSprite,
  [Character.Hifumi]: hifumiSprite,
  [Character.Hiro]: hiroSprite,
  [Character.Sayaka]: sayakaSprite,
  [Character.Kyoko]: kyokoSprite,
  [Character.Aoi]: hinaSprite,
  [Character.Toko]: tokoSprite, // unfinished
  [Character.Sakura]: sakuraSprite,
  [Character.Celeste]: celesteSprite,
  [Character.Mukuro]: mukuroSprite,
  [Character.Chihiro]: chihiroSprite, // these can be improved, he is crying in most of these and I gave them similar names
  [Character.Junko]: monokumaSprite,
  [Character.Monokuma]: junkoSprite,
  [Character.AlterEgo]: alterEgoSprite,
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
