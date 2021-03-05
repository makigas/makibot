import path from "path";
import { Intents } from "discord.js";
import { CommandoClient, SQLiteProvider } from "discord.js-commando";

import ConfigSchema from "./ConfigSchema";
import { getDatabase, getKarmaDatabase } from "./settings";
import AntiRaid from "./lib/antiraid";
import { HookManager } from "./lib/hook";
import { KarmaDatabase, openKarmaDatabase } from "./lib/karma/database";

export default class Makibot extends CommandoClient {
  readonly antiraid: AntiRaid;

  private _karma: KarmaDatabase;

  public constructor() {
    super({
      commandPrefix: "!",
      owner: ConfigSchema.owner,
      disableMentions: "everyone",
      ws: {
        intents: Intents.ALL,
      },
      partials: ["MESSAGE", "REACTION"],
    });

    this.antiraid = new AntiRaid(this);

    this.registry.registerDefaultTypes();
    this.registry.registerGroups([
      ["admin", "Administración"],
      ["moderation", "Moderación"],
      ["utiles", "Utilidad"],
    ]);
    this.registry.registerCommandsIn({
      dirname: path.join(__dirname, "commands"),
      filter: /^([^.].*)\.[jt]s$/,
    });

    this.on("ready", () => console.log(`Logged in successfully as ${this.user.tag}.`));

    this.once("ready", () => {
      getDatabase()
        .then((db) => this.setProvider(new SQLiteProvider(db)))
        .then(() => {
          getKarmaDatabase()
            .then((dbFile) => openKarmaDatabase(dbFile))
            .then((db) => (this._karma = db));
        })
        .then(() => {
          const manager = new HookManager(path.join(__dirname, "hooks"), this);
          this.on("makibot:restart", (name) => manager.restart(name));
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

  shutdown(exitCode = 0): void {
    console.log("The bot was asked to shutdown.");
    this.destroy();
    console.log("Good night!");
    process.exit(exitCode);
  }
}
