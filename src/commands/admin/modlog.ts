import { Message } from "discord.js";
import { Command, CommandMessage } from "discord.js-commando";

import Server from "../../lib/server";
import Makibot from "../../Makibot";

interface ModlogCommandArguments {
  option: string;
  value: string;
}

export = class ModlogCommand extends Command {
  constructor(client: Makibot) {
    super(client, {
      name: "modlog",
      memberName: "modlog",
      group: "admin",
      description: "Ajusta las opciones del sistema de moderación",
      ownerOnly: true,
      guildOnly: true,
      args: [
        { key: "option", type: "string", prompt: "Opción a modificar", default: "" },
        { key: "value", type: "string", prompt: "Valor a establecer", default: "" },
      ],
    });
  }

  async run(msg: CommandMessage, args: ModlogCommandArguments): Promise<Message | Message[]> {
    const server = new Server(msg.guild);
    switch (args.option) {
      case "webhookId":
        await server.settings.setModlogWebhookId(args.value);
        return msg.reply("Cambiaste el ID del webhook");
      case "webhookToken":
        await server.settings.setModlogWebhookToken(args.value);
        return msg.reply("Cambiaste el token del webhook");
      default:
        return msg.reply("Subcomandos: webhookId, webhookToken");
    }
  }
};
