import type { CommandInteraction, Message, MessageType, InteractionType } from 'discord.js';
const replyCommand:CommandInteraction = null as unknown as CommandInteraction;
const replyMessage:Message = null as unknown as Message;

export type DiscordComponentResolvable = CommandInteraction | Message;
export type DiscordComponentResolvableEnum = InteractionType.ApplicationCommand | MessageType;
export type CommandInteractionReply = typeof replyCommand.reply;
export type MessageReply = typeof replyMessage.reply;