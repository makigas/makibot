import Commando from "discord.js-commando";

import Makibot from "../../Makibot";

interface ActivityCommandArguments {
  activity?: string;
}

export = class ActivityCommand extends Commando.Command {
  constructor(client: Makibot) {
    super(client, {
      name: "activity",
      memberName: "activity",
      group: "admin",
      description: "Ajusta las opciones de actividad del bot",
      ownerOnly: true,
      args: [{ key: "activity", type: "string", prompt: "Actividad a establecer.", default: "" }],
    });
  }

  run(msg: Commando.CommandMessage, args: ActivityCommandArguments) {
    if (args.activity == "") {
      return msg.client.settings
        .remove("BotActivity")
        .then(() => msg.client.settings.remove("BotActivity"))
        .then(() => msg.channel.send("Eliminada actividad del bot"));
    } else {
      return msg.client.settings
        .set("BotActivity", args.activity)
        .then(() => msg.client.user.setGame(args.activity))
        .then(() => msg.channel.send("Actividad del bot actualizada"));
    }
  }
};
