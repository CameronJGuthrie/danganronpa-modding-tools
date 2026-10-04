import { defineEnum, type EnumValue } from "./enum.ts";

/**
 * The background music tracks, by the id the `Music` opcode plays. Names are the track titles from
 * `data/music-data.ts` as identifiers, without the OST numbers; where two ids share a title the
 * second gets `_2`. 255 is the engine's "stop music" id.
 */
export const Music = defineEnum({
  Danganronpa: 0,
  DanganRonpa: 1,
  SaiseiRebuild: 2,
  BeautifulDead: 3,
  BeautifulMorning: 4,
  LivingToTheFullest: 5,
  WeeklyDespairMagazine: 6,
  DespairSyndrome: 7,
  MrMonokumasLesson: 8,
  GoodbyeDespairSchool: 9,
  BeautifulDays: 10,
  JunkFoodForADashingYouth: 11,
  NewWorldOrder: 12,
  MrMonokumasExtracurricularLesson: 13,
  Box15: 14,
  Box16: 15,
  Distrust: 16,
  TrialUnderground: 17,
  TrialDawnEdition: 18,
  ClassTrialTurbulentEdition: 19,
  ClassTrialSolarEdition: 20,
  DiscussionBreak: 21,
  DiscussionHeatUp: 22,
  DiscussionMixEdge: 23,
  Guitar: 24,
  FlashingAnagram: 25,
  ClimaxReasoning: 26,
  ClimaxReturn: 27,
  GoodbyeDespairSchool_2: 28,
  MTB: 29,
  SuperMTB: 30,
  SuperFinalMTB: 31,
  DespairSyndrome_2: 32,
  AllAllApologies: 33,
  DesireForExecution: 34,
  PianoBacktrack: 35,
  WelcomeDespairSchool: 36,
  Stop: 255,
});
export type Music = EnumValue<typeof Music>;

const musicIds: ReadonlySet<number> = new Set(Object.values(Music).filter((v): v is Music => typeof v === "number"));

export function isMusic(id: number): id is Music {
  return musicIds.has(id);
}
