import Commando from "discord.js-commando";
import Discord from "discord.js";

import Makibot from "../../Makibot";

interface ActivityCommandArguments {
  presence?: string;
}

export = class PresenceCommand extends Commando.Command {
  constructor(client: Makibot) {
    super(client, {
      name: "presence",
      memberName: "presence",
      group: "admin",
      description: "Ajusta la presencia del bot",
      ownerOnly: true,
      args: [{ key: "presence", type: "string", prompt: "Estado del bot.", default: "" }],
    });
  }

  run(msg: Commando.CommandMessage, args: ActivityCommandArguments) {
    let presence = <Discord.PresenceStatus>args.presence.toLowerCase();
    switch (presence) {
      case "online":
      case "idle":
      case "dnd":
      case "invisible":
        return msg.client.settings
          .set("BotPresence", presence)
          .then(_ => msg.client.user.setStatus(presence))
          .then(_ => msg.reply("Estado de presencia del bot modificado."));
      default:
        return msg.reply("Estados de presencia válidos: <online|idle|dnd|invisible>");
    }
  }
};
