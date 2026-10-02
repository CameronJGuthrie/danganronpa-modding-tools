import { Character } from "../../character.ts";
import { alterEgoSprite } from "./alter-ego-sprite-data.ts";
import { byakuyaSprite } from "./byakuya-sprite-data.ts";
import { celesteSprite } from "./celeste-sprite-data.ts";
import { chihiroSprite } from "./chihiro-sprite-data.ts";
import { hifumiSprite } from "./hifumi-sprite-data.ts";
import { hinaSprite } from "./hina-sprite-data.ts";
import { hiroSprite } from "./hiro-sprite-data.ts";
import { junkoSprite } from "./junko-sprite-data.ts";
import { kiyotakaSprite } from "./kiyotaka-sprite-data.ts";
import { kyokoSprite } from "./kyoko-sprite-data.ts";
import { leonSprite } from "./leon-sprite-data.ts";
import { makotoSprite } from "./makoto-sprite-data.ts";
import { mondoSprite } from "./mondo-sprite-data.ts";
import { monokumaSprite } from "./monokuma-sprite-data.ts";
import { mukuroSprite } from "./mukuro-sprite-data.ts";
import { sakuraSprite } from "./sakura-sprite-data.ts";
import { sayakaSprite } from "./sayaka-sprite-data.ts";
import { tokoSprite } from "./toko-sprite-data.ts";

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
