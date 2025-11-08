import { Chapter } from "../../enum/chapter";
import { Character } from "../../enum/character";

export type VoiceMeta = {
  index: number;
}
export type ChapterVoiceLines = Record<Chapter, { [voiceLineId: number]: string; metadata: VoiceMeta } | undefined>;
export type CharacterVoiceLinesByChapter = Record<Character, ChapterVoiceLines | undefined>;