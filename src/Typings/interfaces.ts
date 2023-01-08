import { ButtonStyle, GuildMember, ColorResolvable } from "discord.js";
import {
  CategoryNameType,
  QuestionDifficulties,
  QuestionDifficultyType,
  QuestionTypes,
  QuestionTypeType,
} from "open-trivia-db";
import TriviaGame from "../Classes/TriviaGame";
import { CustomQuestion, Leaderboard } from "./types";

/**
 * Decoration options for embeds and buttons.
 */
export interface DecorationOptions {
  buttonStyle: ButtonStyle;
  embedColor: ColorResolvable;
  embedImage: string;
  embedThumbnail: string;
}

/**
 * The options for a game's configuration.
 */
export interface GameOptions {
  queueTime: number;
  maxPlayerCount: number;
  maxPoints: number;
  minPlayerCount: number;
  minPoints: number;
  timeBetweenRounds: number;
  timePerQuestion: number;
  streakDefinitionLevel: number;
  pointsPerSteakAmount: number;
  maximumStreakBonus: number;
  showAnswers: boolean;
}

/**
 * Represents a game's data.
 */
export interface GameData {
  questions: GameQuestion[];
  category: CategoryNameType | number | null;
  difficulty: QuestionDifficultyType | null;
  amount: number;
  timeEnd: number | null;
  players: Leaderboard;
}

/**
 * The options for a game's question configuration.
 */
export interface GameQuestionOptions extends Record<string, any> {
  amount: number;
  category?: CategoryNameType | number;
  difficulty?: QuestionDifficultyType | QuestionDifficulties;
  type?: QuestionTypeType;
  customQuestions?: CustomQuestion[] | null;
}

/**
 * Represents a trivia question.
 */
export interface GameQuestion {
  value: string;
  category: string;
  difficulty: QuestionDifficultyType;
  type: QuestionTypes | QuestionTypeType;
  correctAnswer: string;
  incorrectAnswers: string[];
  allAnswers: string[];
  checkAnswer: (str: string) => boolean;
}

/**
 * Represents a player's data.
 */
export interface Player {
  points: number;
  hasAnswered: boolean;
  isCorrect: boolean;
  correctAnswerStreak: number;
  game: TriviaGame;
  member: GuildMember;
}
