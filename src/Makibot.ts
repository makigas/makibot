import path from "path";

import Commando from "discord.js-commando";

import ConfigSchema from "./ConfigSchema";
import { getDatabase } from "./settings";
import PinService from "./hooks/pin";
import RosterService from "./hooks/roster";
import VerifyService from "./hooks/verify";

export default class Makibot extends Commando.CommandoClient {
  public constructor() {
    super({
      commandPrefix: "!",
      owner: ConfigSchema.owner,
      disableEveryone: true,
      unknownCommandResponse: false,
    });

    this.registry.registerDefaultTypes();
    this.registry.registerGroups([
      ["admin", "Administración"],
      ["fun", "Entretenimiento"],
      ["utiles", "Utilidad"],
    ]);
    this.registry.registerCommandsIn({
      dirname: path.join(__dirname, "commands"),
      filter: /^([^\.].*)\.[jt]s$/,
    });

    this.on("ready", () => console.log(`Logged in successfully as ${this.user.tag}.`));

    this.once("ready", () => {
      getDatabase()
        .then(db => this.setProvider(new Commando.SQLiteProvider(db)))
        .then(() => {
          // Reload presence using database values.
          this.user.setPresence({
            status: this.settings.get("BotPresence", "online"),
            game: { name: this.settings.get("BotActivity", null) },
          });

          // Register hooks.
          var pin = new PinService(this);
          var roster = new RosterService(this);

          if (process.env.VERIFY_CHANNEL && process.env.VERIFY_ROLE) {
            var verify = new VerifyService(this);
          }
        })
        .catch(console.log);
    });

    this.login(ConfigSchema.token);
  }

  shutdown() {
    console.log("The bot was asked to shutdown.");
    this.destroy().finally(() => {
      console.log("Good night!");
      process.exit(0);
    });
  }
}
