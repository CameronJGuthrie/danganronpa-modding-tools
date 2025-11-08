const Makoto = { id: 0, name: "Makoto" } as const;
const Kiyotaka = { id: 1, name: "Kiyotaka" } as const;
const Byakuya = { id: 2, name: "Byakuya" } as const;
const Mondo = { id: 3, name: "Mondo" } as const;
const Leon = { id: 4, name: "Leon" } as const;
const Hifumi = { id: 5, name: "Hifumi" } as const;
const Yasuhiro = { id: 6, name: "Yasuhiro" } as const;
const Sayaka = { id: 7, name: "Sayaka" } as const;
const Kyoko = { id: 8, name: "Kyoko" } as const;
const Aoi = { id: 9, name: "Aoi" } as const;
const Toko = { id: 10, name: "Toko" } as const;
const Sakura = { id: 11, name: "Sakura" } as const;
const Celeste = { id: 12, name: "Celeste" } as const;
const Mukuro = { id: 13, name: "Mukuro" } as const;
const Chihiro = { id: 14, name: "Chihiro" } as const;
const Monokuma = { id: 15, name: "Monokuma" } as const;
const Junko = { id: 16, name: "Junko" } as const;
const AlterEgo = { id: 17, name: "AlterEgo" } as const;

const characters: Record<Character["name"], Character> = {
  Makoto,
  Kiyotaka,
  Byakuya,
  Mondo,
  Leon,
  Hifumi,
  Yasuhiro,
  Sayaka,
  Kyoko,
  Aoi,
  Toko,
  Sakura,
  Celeste,
  Mukuro,
  Chihiro,
  Monokuma,
  Junko,
  AlterEgo,
};

export type Character =
  | typeof Makoto
  | typeof Kiyotaka
  | typeof Byakuya
  | typeof Mondo
  | typeof Leon
  | typeof Hifumi
  | typeof Yasuhiro
  | typeof Sayaka
  | typeof Kyoko
  | typeof Aoi
  | typeof Toko
  | typeof Sakura
  | typeof Celeste
  | typeof Mukuro
  | typeof Chihiro
  | typeof Monokuma
  | typeof Junko
  | typeof AlterEgo;

export function isCharacterName(name: string): name is Character["name"] {
  return Object.keys(characters).some((characterName) => characterName === name);
}

export function useCharacters(): Readonly<typeof characters> {
  return characters;
}
