import path from "path";
import { Client, CloseEvent, Intents } from "discord.js";

import { HookManager } from "./lib/hook";
import { KarmaDatabase } from "./lib/karma/database";
import { SettingProvider } from "./lib/provider";
import { InteractionManager } from "./lib/interaction";
import { ModerationRepository } from "./lib/modlog/database";
import logger from "./lib/logger";

export default class Makibot extends Client {
  /** The karma database contains the karma points and levels assigned to members. */
  readonly karma: KarmaDatabase;

  /** The provider stores configuration. */
  readonly provider: SettingProvider;

  /** The hook manager is a collection of event listeners for Discord.js. */
  readonly hooks: HookManager;

  /** The interactions manager is a collection of interaction handlers. */
  readonly interactions: InteractionManager;

  /** The moderation repository stores the modlog. */
  readonly modrepo: ModerationRepository;

  public constructor(
    modrepo: ModerationRepository,
    provider: SettingProvider,
    karma: KarmaDatabase
  ) {
    super({
      allowedMentions: {},
      intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
      partials: ["MESSAGE", "REACTION", "GUILD_MEMBER"],
    });

    this.modrepo = modrepo;
    this.provider = provider;
    this.karma = karma;
    this.hooks = new HookManager(path.join(__dirname, "hooks"), this);
    this.interactions = new InteractionManager(path.join(__dirname, "interactions"), this);

    this.on("ready", () => {
      if (process.env.VERSION_TAG) {
        this.user.setActivity({ name: process.env.VERSION_TAG });
      }
      logger.info(`Logged in successfully as ${this.user.tag}.`);
    });

    this.on("shardDisconnect", (e: CloseEvent) => {
      console.error(`The bot has been disconnected.`);
      console.error(`> Reason: ${e.reason} Code: ${e.code}`);
      if (e.code == 4014 /* DISALLOWED_INTENTS */) {
        console.error(
          `> Suggestion: Active the "Privileged Gateway Intents" in your control panel\n`
        );
      }
      this.shutdown(1);
    });
  }

  async connect(): Promise<void> {
    try {
      this.login(process.env.BOT_TOKEN);
    } catch (e) {
      logger.error(e.code);
    }
  }

  shutdown(exitCode = 0): void {
    logger.info("The bot was asked to shutdown.");
    this.destroy();
    logger.info("Good night!");
    process.exit(exitCode);
  }
}
