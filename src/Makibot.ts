import path from "path";
import { Client, Intents, WSEventType } from "discord.js";

import ConfigSchema from "./ConfigSchema";
import { getDatabase, getKarmaDatabase } from "./settings";
import AntiRaid from "./lib/antiraid";
import { HookManager } from "./lib/hook";
import { KarmaDatabase, openKarmaDatabase } from "./lib/karma/database";
import { handleInteraction } from "./lib/interaction";
import { SettingProvider } from "./lib/provider";

export default class Makibot extends Client {
  readonly antiraid: AntiRaid;

  private _karma: KarmaDatabase;

  private _provider: SettingProvider;

  private _manager: HookManager;

  public get manager(): HookManager {
    return this._manager;
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
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
      partials: ["MESSAGE", "REACTION"],
    });

    this.antiraid = new AntiRaid(this);

    this.on("ready", () => console.log(`Logged in successfully as ${this.user.tag}.`));

    this.ws.on("INTERACTION_CREATE" as WSEventType, (interaction) => {
      handleInteraction(this, interaction);
    });

    this.once("ready", () => {
      getDatabase()
        .then((db) => {
          this._provider = new SettingProvider(db, this);
          return this._provider.init();
        })
        .then(() => {
          getKarmaDatabase()
            .then((dbFile) => openKarmaDatabase(dbFile))
            .then((db) => (this._karma = db));
        })
        .then(() => {
          this._manager = new HookManager(path.join(__dirname, "hooks"), this);
        })
        .then(() => {
          // Init the antiraid engine.
          this.antiraid.init();
        })
        .catch(console.log);
    });

    this.on("shardDisconnect", () => {
      console.error(`The bot has been disconnected.`);
      this.shutdown(1);
    });

    this.login(ConfigSchema.token);
  }

  get karma(): KarmaDatabase {
    return this._karma;
  }

  get provider(): SettingProvider {
    return this._provider;
  }

  shutdown(exitCode = 0): void {
    console.log("The bot was asked to shutdown.");
    this.destroy();
    console.log("Good night!");
    process.exit(exitCode);
  }
}
