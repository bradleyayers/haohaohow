import { Rating } from "@/util/fsrs";
import type { Interval } from "date-fns";

export enum PinyinInitialGroupId {
  Basic,
  _i,
  _u,
  _v,
  Null,
  Everything,
}

export enum MnemonicThemeId {
  AnimalSpecies,
  GreekMythologyCharacter,
  MythologyCharacter,
  WesternCultureFamousMen,
  WesternCultureFamousWomen,
  WesternMythologyCharacter,
}

export enum SrsType {
  Null,
  FsrsFourPointFive,
}

export interface SrsNullState {
  type: SrsType.Null;
}

export interface SrsFourPointFiveState {
  type: SrsType.FsrsFourPointFive;
  stability: number;
  difficulty: number;
}

export type SrsState = SrsNullState | SrsFourPointFiveState;

// TODO: "SkillUpcomingReview" maybe?
export interface SkillState {
  // TODO: this shoudl be "last reviewed"
  createdAt: Date;
  /** When null, it means it's never been reviewed. */
  srs: SrsState | null;
  due: Date;
}

export interface SkillRating {
  rating: Rating;
}

export enum SkillType {
  RadicalToEnglish = `RadicalToEnglish`,
  EnglishToRadical = `EnglishToRadical`,
  RadicalToPinyin = `RadicalToPinyin`,
  PinyinToRadical = `PinyinToRadical`,
  /**
   * When shown a hanzi word, write the english translation.
   */
  HanziWordToEnglish = `HanziWordToEnglish`,
  HanziWordToPinyinInitial = `HanziWordToPinyinInitial`,
  HanziWordToPinyinFinal = `HanziWordToPinyinFinal`,
  HanziWordToPinyinTone = `HanziWordToPinyinTone`,
  /**
   * When shown an english word, write the hanzi characters.
   */
  EnglishToHanzi = `EnglishToHanzi`,
  /**
   * Given a pinyin word, write the hanzi character.
   */
  PinyinToHanzi = `PinyinToHanzi`,
  ImageToHanzi = `ImageToHanzi`,
  /**
   * Given an initial like `p`, remember the name of the associated
   * character/actor/entity etc.
   */
  PinyinInitialAssociation = `PinyinInitialAssociation`,
  PinyinFinalAssociation = `PinyinFinalAssociation`,
}

export interface HanziSkill {
  type:
    | SkillType.HanziWordToEnglish
    | SkillType.HanziWordToPinyinInitial
    | SkillType.HanziWordToPinyinFinal
    | SkillType.HanziWordToPinyinTone
    | SkillType.EnglishToHanzi
    | SkillType.PinyinToHanzi
    | SkillType.ImageToHanzi;
  hanzi: string;
}

export interface RadicalNameSkill {
  type: SkillType.RadicalToEnglish | SkillType.EnglishToRadical;
  hanzi: string;
  name: string;
}

export interface RadicalPinyinSkill {
  type: SkillType.RadicalToPinyin | SkillType.PinyinToRadical;
  hanzi: string;
  pinyin: string;
}

export interface PinyinInitialAssociationSkill {
  type: SkillType.PinyinInitialAssociation;
  initial: string;
}

export interface PinyinFinalAssociationSkill {
  type: SkillType.PinyinFinalAssociation;
  final: string;
}

export type PinyinAssociationSkill =
  | PinyinInitialAssociationSkill
  | PinyinFinalAssociationSkill;

export type RadicalSkill = RadicalNameSkill | RadicalPinyinSkill;

/** Data that forms the unique key for a skill */
export type Skill = HanziSkill | RadicalSkill | PinyinAssociationSkill;

export enum QuestionFlagType {
  NewSkill,
  Overdue,
  PreviousMistake,
  WeakWord,
}

export interface QuestionFlagPreviousMistake {
  type: QuestionFlagType.PreviousMistake;
}

export interface QuestionFlagOverdue {
  type: QuestionFlagType.Overdue;
  interval: Interval;
}

export interface QuestionFlagWeakWord {
  type: QuestionFlagType.WeakWord;
}

export interface QuestionFlagNewSkill {
  type: QuestionFlagType.NewSkill;
}

export type QuestionFlag =
  | QuestionFlagWeakWord
  | QuestionFlagNewSkill
  | QuestionFlagOverdue
  | QuestionFlagPreviousMistake;

export enum QuestionType {
  MultipleChoice,
  OneCorrectPair,
}

export interface MultipleChoiceQuestion {
  type: QuestionType.MultipleChoice;
  prompt: string;
  answer: string;
  flag?: QuestionFlag;
  choices: readonly string[];
}

export interface SkillRating {
  skill: Skill;
  rating: Rating;
}

// export interface OneCorrectPairQuestionRadicalAnswer {
//   type: `radical`;
//   hanzi: string;
//   nameOrPinyin: string;
// }

// export interface OneCorrectPairQuestionWordAnswer {
//   type: `word`;
//   hanzi: string;
//   definition: string;
// }

export type OneCorrectPairQuestionChoice =
  | {
      type: `radical`;
      hanzi: string;
      skill?: Skill;
    }
  | {
      type: `hanzi`;
      hanzi: string;
      skill?: Skill;
    }
  | {
      type: `name`;
      english: string;
      skill?: Skill;
    }
  | {
      type: `pinyin`;
      pinyin: string;
      skill?: Skill;
    }
  | {
      type: `definition`;
      english: string;
      skill?: Skill;
    };

export interface OneCorrectPairQuestionAnswer {
  a: OneCorrectPairQuestionChoice;
  b: OneCorrectPairQuestionChoice;
}

export interface OneCorrectPairQuestion {
  type: QuestionType.OneCorrectPair;
  prompt: string;
  answer: OneCorrectPairQuestionAnswer;
  groupA: readonly OneCorrectPairQuestionAnswer[];
  groupB: readonly OneCorrectPairQuestionAnswer[];
  hint?: string;
  flag?: QuestionFlag;
}

export type Question = MultipleChoiceQuestion | OneCorrectPairQuestion;

export interface PinyinInitialAssociation {
  initial: string;
  name: string;
}

export interface PinyinFinalAssociation {
  final: string;
  name: string;
}
