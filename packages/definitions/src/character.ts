export enum Character {
  Makoto = 0,
  Taka = 1,
  Byakuya = 2,
  Mondo = 3,
  Leon = 4,
  Hifumi = 5,
  Hiro = 6,
  Sayaka = 7,
  Kyoko = 8,
  Aoi = 9,
  Toko = 10,
  Sakura = 11,
  Celeste = 12,
  Mukuro = 13,
  Chihiro = 14,
  Monokuma = 15,
  Junko = 16,
  AlterEgo = 17,
  GenocideJill = 18,
  Headmaster = 19,
  MakotoMom = 20,
  MakotoDad = 21,
  MakotoSister = 22,
  Narrator = 23,
  TakaMondo = 24,
  DaiyaOwada = 25,
  Unknown = 30,
  Blank = 31,
  Usami = 33,
  MonokumaBackup = 34,
  MonokumaBackupR = 35,
  MonokumaBackupL = 36,
  MonokumaBackupM = 37,
}

const validCharacterSet = new Set(Object.values(Character).filter((x) => typeof x === "number"));

export function isCharacter(characterId: number): characterId is Character {
  return validCharacterSet.has(characterId);
}
