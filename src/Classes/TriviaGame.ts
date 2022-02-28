import {
  Collection,
  CollectorFilter,
  CommandInteraction,
  Guild,
  GuildMember,
  InteractionReplyOptions,
  MessageComponentInteraction,
  TextBasedChannel,
} from "discord.js";
import {
  getQuestions,
  TriviaCategoryName,
  TriviaQuestion,
  TriviaQuestionDifficulty,
  TriviaQuestionType,
} from "easy-trivia";
import TriviaManager from "./TriviaManager";
import {
  TriviaGameOptions,
  TriviaGameOptionsStrict,
  TriviaPlayer,
} from "../Typings/interfaces";
import EmbedGenerator from "./EmbedGenerator";
import { TriviaPlayers } from "../Typings/types";
import CanvasGenerator from "./CanvasGenerator";
import {
  buttonRowChoicesBoolean,
  buttonRowChoicesMultiple,
  buttonRowQueue,
} from "../Components/messageActionRows";
import { promisify } from "util";

const wait = promisify(setTimeout);
async function reply(
  int: MessageComponentInteraction,
  obj: InteractionReplyOptions
) {
  if (int.replied) {
    await int.followUp(obj);
  } else {
    await int.reply(obj);
  }
}

export default class TriviaGame {
  public readonly manager: TriviaManager;
  public readonly interaction: CommandInteraction;
  public readonly channel: TextBasedChannel;
  public readonly guild: Guild;
  public readonly hostMember: GuildMember;
  private readonly embeds: EmbedGenerator;
  private readonly canvas: CanvasGenerator;
  public readonly players: TriviaPlayers;
  public readonly options: TriviaGameOptionsStrict;
  private questions: TriviaQuestion[] = [];

  public static readonly defaults: TriviaGameOptionsStrict = {
    minPlayerCount: 1,
    maxPlayerCount: 50,
    timePerQuestion: 20_000,
    triviaCategory: null as unknown as TriviaCategoryName,
    questionAmount: 10,
    questionDifficulty: null as unknown as TriviaQuestionDifficulty,
    questionType: null as unknown as TriviaQuestionType,
    queueTime: 15_000,
  };

  constructor(
    interaction: CommandInteraction,
    manager: TriviaManager,
    options?: TriviaGameOptions
  ) {
    this.manager = manager;
    this.interaction = interaction;
    this.channel = interaction.channel as TextBasedChannel;
    this.guild = interaction.guild as Guild;
    this.players = new Collection();
    this.hostMember = interaction.member as GuildMember;
    this.options = options
      ? Object.assign(TriviaGame.defaults, options)
      : TriviaGame.defaults;
    this.embeds = new EmbedGenerator(this);
    this.canvas = new CanvasGenerator(this);
  }

  static buttonRows = {
    boolean: buttonRowChoicesBoolean,
    multiple: buttonRowChoicesMultiple,
    queue: buttonRowQueue,
  };

  start(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        this.manager.validator.validateDiscordStructures(this);
        this.manager.validator.validateGameOptions(this.options);

        this.manager.games.set(this.channel.id, this);

        await this.interaction.reply({
          content: "Game has been started",
          ephemeral: true,
        });

        await this.startComponentCollector();
      } catch (err) {
        reject(err);
      }
    });
  }

  end() {
    this.manager.games.delete(this.channel.id);
  }

  private async beginGameLoop() {
    for await (const question of this.questions) {
      await this.channel.send({
        content: "**Preparing the next question...**",
      });

      await wait(5000);
      await this.emitQuestion(question);
    }
  }

  private async emitQuestion(question: TriviaQuestion): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.channel.send({
        embeds: [this.embeds.question(question)],
        components: [TriviaGame.buttonRows[question.type]],
      });

      const filter: CollectorFilter<[MessageComponentInteraction<"cached">]> = (
        i
      ) => this.players.has(i.user.id);
      const collector = this.channel.createMessageComponentCollector({
        filter,
        time: this.options.timePerQuestion,
      });

      collector.on("collect", async (i) => {
        const player = this.players.get(i.user.id)!;
        const member = await this.guild.members.fetch(i.user.id);

        if (question.checkAnswer(question.allAnswers[Number(i.customId)])) {
          player.points++;
        }

        await this.channel.send({
          content: `**${
            member.displayName || i.user.username
          }** has locked in!`,
        });
      });

      collector.on("end", async () => {
        await this.channel.send({
          embeds: [this.embeds.leaderboardUpdate(this)],
        });

        await wait(5000);
        resolve();
      });
    });
  }

  private async initializeGame() {
    const {
      questionAmount: amount,
      questionDifficulty: difficulty,
      questionType: type,
    } = this.options;

    this.questions = await getQuestions({
      amount,
      difficulty: difficulty as TriviaQuestionDifficulty,
      type: type as TriviaQuestionType,
    });

    await this.channel.send({
      embeds: [this.embeds.gameStart()],
    });

    await this.beginGameLoop();
  }

  private async startComponentCollector() {
    const queueMessage = await this.channel.send({
      embeds: [this.embeds.gameQueueStart()],
      components: [TriviaGame.buttonRows.queue],
    });

    const collector = this.channel.createMessageComponentCollector({
      time: this.options.queueTime,
    });

    collector.on("collect", async (int) => {
      if (this.players.has(int.user.id)) {
        const inQueueAlready: InteractionReplyOptions = {
          content: "**You are already in the queue**",
          ephemeral: true,
        };

        await reply(int, inQueueAlready);
      } else {
        const member = await this.guild.members.fetch(int.user.id);
        if (!member) {
          reply(int, {
            content: "Failed to enter you into the queue, please try again",
            ephemeral: true,
          });

          return;
        }

        const joinedQueue: InteractionReplyOptions = {
          content: "Successfully joined queue",
          ephemeral: true,
        };

        await reply(int, joinedQueue);

        const player: TriviaPlayer = Object.assign(member, {
          points: 0,
          hasAnswered: false,
          isCorrect: false,
          leaderboardPosition: {
            previous: 0,
            current: 0,
          },
        });

        this.players.set(player.id, player);

        await this.channel.send({
          content: `**${player.displayName}** has joined in!`,
        });

        if (this.players.size === this.options.maxPlayerCount) {
          collector.stop("Game has reached set maximum player capacity");
        }
      }
    });

    collector.on("end", async () => {
      if (queueMessage.deletable) {
        queueMessage.delete().catch((_) => null);
      }

      if (
        collector.endReason ||
        this.players.size >= this.options.minPlayerCount
      ) {
        await this.initializeGame();
      } else {
        this.end();

        await this.channel.send({
          content: "Game failed to meet minimum player requirements",
        });
      }
    });
  }
}
