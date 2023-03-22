import type {
  CommandInteraction,
  Message,
  InteractionType,
  ChatInputCommandInteraction,
  CacheType,
  Collection,
  Snowflake,
} from "discord.js";
import {
  BooleanString,
  IncorrectAnswers,
  QuestionDifficultyType,
} from "open-trivia-db";
import TriviaPlayer from "../Classes/TriviaPlayer";
const replyCommand: CommandInteraction = {} as CommandInteraction;
const replyMessage: Message = {} as Message;

/**
 * Represents a developer-made question.
 */
export type CustomQuestion<T extends "multiple" | "boolean"> = {
  category: string;
  type: T;
  difficulty: QuestionDifficultyType;
  value: string;
  correctAnswer: string | BooleanString;
  incorrectAnswers: T extends "multiple" ? IncorrectAnswers : BooleanString;
};

/**
 * A Discord command interaction or message.
 */
export type DiscordComponentResolvable =
  | CommandInteraction
  | ChatInputCommandInteraction<CacheType>
  | Message;

/**
 * Enums for `DiscordComponentResolvable`
 */
export type DiscordComponentResolvableEnum =
  | InteractionType.ApplicationCommand
  | InteractionType.MessageComponent;

/**
 * The type for the `reply()` function of a `CommandInteraction`,
 */
export type CommandInteractionReply = typeof replyCommand.reply;

/**
 * The type for the `reply()` function of a `Message`.
 */
export type MessageReply = typeof replyMessage.reply;

/**
 * Represents a game's leaderboard.
 */
export type Leaderboard = Collection<Snowflake, TriviaPlayer>;
