import path from "path";
import { Client, CloseEvent, Intents } from "discord.js";

import ConfigSchema from "./ConfigSchema";
import { getDatabase, getKarmaDatabase } from "./settings";
import { HookManager } from "./lib/hook";
import { KarmaDatabase, openKarmaDatabase } from "./lib/karma/database";
import { SettingProvider } from "./lib/provider";
import { InteractionManager } from "./lib/interaction";
import { ModerationRepository, newModRepository } from "./lib/modlog/database";
import logger from "./lib/logger";

export default class Makibot extends Client {
  private _karma: KarmaDatabase;

  private _provider: SettingProvider;

  private _hooks: HookManager;
  private _interactions: InteractionManager;

  private _modrepo: ModerationRepository;

  public get manager(): HookManager {
    return this._hooks;
  }

  public constructor() {
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

    this.on("ready", () => {
      logger.info(`Logged in successfully as ${this.user.tag}.`);
    });

    this.once("ready", () => {
      if (process.env.VERSION_TAG) {
        this.user.setActivity({ name: process.env.VERSION_TAG });
      }
      getDatabase()
        .then(async (db) => {
          this._modrepo = await newModRepository(db);
          this._provider = new SettingProvider(db);
          return this._provider.init();
        })
        .then(() => {
          getKarmaDatabase()
            .then((dbFile) => openKarmaDatabase(dbFile))
            .then((db) => (this._karma = db));
        })
        .then(() => {
          this._hooks = new HookManager(path.join(__dirname, "hooks"), this);
          this._interactions = new InteractionManager(path.join(__dirname, "interactions"), this);
        })
        .catch(console.log);
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

    this.login(ConfigSchema.token).catch(({ code }) => {
      logger.error(code);
    });
  }

  get karma(): KarmaDatabase {
    return this._karma;
  }

  get provider(): SettingProvider {
    return this._provider;
  }

  get modrepo(): ModerationRepository {
    return this._modrepo;
  }

  shutdown(exitCode = 0): void {
    logger.info("The bot was asked to shutdown.");
    this.destroy();
    logger.info("Good night!");
    process.exit(exitCode);
  }
}
