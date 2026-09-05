import { Character } from "../enum/character";

export type CharacterMeta = {
  /* A short way of printing this character's name in the editor */
  name: string;
  /* The name that shows in the game's user interface when that character speaks */
  speakerText: string;
  /* The color to print this character's text in within the editor */
  color: string;
};

export const characterData: Readonly<Record<Character, CharacterMeta>> = {
  [Character.Makoto]: {
    name: "Makoto",
    speakerText: "Makoto Naegi",
    color: "#848484",
  },
  [Character.Taka]: {
    name: "Taka",
    speakerText: "Kiyotaka Ishimaru",
    color: "#eeff00",
  },
  [Character.Byakuya]: {
    name: "Byakuya",
    speakerText: "Byakuya Togami",
    color: "#d3d3d3",
  },
  [Character.Mondo]: {
    name: "Mondo",
    speakerText: "Mondo Owada",
    color: "#cd9f21",
  },
  [Character.Leon]: {
    name: "Leon",
    speakerText: "Leon Kuwata",
    color: "#ff9d00",
  },
  [Character.Hifumi]: {
    name: "Hifumi",
    speakerText: "Hifumi Yamada",
    color: "#ff00ea",
  },
  [Character.Hiro]: {
    name: "Hiro",
    speakerText: "Yasuhiro Hagakure",
    color: "#a0562e",
  },
  [Character.Sayaka]: {
    name: "Sayaka",
    speakerText: "Sayaka Maizono",
    color: "#506799",
  },
  [Character.Kyoko]: {
    name: "Kyoko",
    speakerText: "Kyoko Kirigiri",
    color: "#e190ff",
  },
  [Character.Aoi]: {
    name: "Aoi",
    speakerText: "Aoi Asahina",
    color: "#b0001a",
  },
  [Character.Toko]: {
    name: "Toko",
    speakerText: "Toko Fukawa",
    color: "#924d9b",
  },
  [Character.Sakura]: {
    name: "Sakura",
    speakerText: "Sakura Oogami",
    color: "#fff75e",
  },
  [Character.Celeste]: {
    name: "Celeste",
    speakerText: "Celeste Ludenberg",
    color: "#ff0000",
  },
  [Character.Mukuro]: {
    name: "Mukuro",
    speakerText: "Junko Enoshima",
    color: "#ff7ac8",
  },
  [Character.Chihiro]: {
    name: "Chihiro",
    speakerText: "Chihiro Fujisaki",
    color: "#a2ff86",
  },
  [Character.Monokuma]: {
    name: "Monokuma",
    speakerText: "Monokuma",
    color: "#484848",
  },
  [Character.Junko]: {
    name: "Junko",
    speakerText: "Junko Enoshima",
    color: "#00f2ff",
  },
  [Character.AlterEgo]: {
    name: "Alter Ego",
    speakerText: "Alter Ego",
    color: "#056208",
  },
  [Character.GenocideJill]: {
    name: "Genocide Jill",
    speakerText: "Genocide Jill",
    color: "#924d9b",
  },
  [Character.Headmaster]: {
    name: "Headmaster",
    speakerText: "Headmaster",
    color: "#808080",
  },
  [Character.MakotoMom]: {
    name: "Makoto's Mom",
    speakerText: "Makoto's Mom",
    color: "#848484",
  },
  [Character.MakotoDad]: {
    name: "Makoto's Dad",
    speakerText: "Makoto's Dad",
    color: "#848484",
  },
  [Character.MakotoSister]: {
    name: "Makoto's Sister",
    speakerText: "Makoto's Sister",
    color: "#848484",
  },
  [Character.Narrator]: {
    name: "Narrator",
    speakerText: "Narrator",
    color: "#ffffff",
  },
  [Character.TakaMondo]: {
    name: "Kiyotaka-Mondo",
    speakerText: "Kiyotaka-Mondo",
    color: "#eeff00",
  },
  [Character.DaiyaOwada]: {
    name: "Daiya Owada",
    speakerText: "Daiya Owada",
    color: "#cd9f21",
  },
  // Character's 26 through 29 are all 'Makoto Naegi' for some reason...
  [Character.Unknown]: {
    name: "???",
    speakerText: "???",
    color: "#808080",
  },
  [Character.Blank]: {
    name: "<Blank>",
    speakerText: "",
    color: "#808080",
  },
  [Character.Usami]: {
    name: "Usami",
    speakerText: "Usami",
    color: "#ffb6c1",
  },
  [Character.MonokumaBackup]: {
    name: "Monokuma Backup",
    speakerText: "Monokuma Backup",
    color: "#484848",
  },
  [Character.MonokumaBackupR]: {
    name: "Monokuma Backup (R)",
    speakerText: "Monokuma Backup (R)",
    color: "#484848",
  },
  [Character.MonokumaBackupL]: {
    name: "Monokuma Backup (L)",
    speakerText: "Monokuma Backup (L)",
    color: "#484848",
  },
  [Character.MonokumaBackupM]: {
    name: "Monokuma Backup (M)",
    speakerText: "Monokuma Backup (M)",
    color: "#484848",
  },
} as const;
