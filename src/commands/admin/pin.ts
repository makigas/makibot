import Commando from "discord.js-commando";

import Makibot from "../../Makibot";
import Server from "../../lib/server";
import { Message } from "discord.js";

/**
 * pin allows users to pin messages into a pinboard. To pin a message, simply
 * react to the message with the given emoji (a star by default). Whenever
 * that reaction is added to a message, an embed with the contents of that
 * message is transferred into the channel designed as the pinboard.
 *
 * Additionally, an operator may use this command to change the following
 * settings:
 *
 *
 */
interface PinCommandArguments {
  option: string;
  value: string;
}

export = class PinCommand extends Commando.Command {
  constructor(client: Makibot) {
    super(client, {
      name: "pin",
      memberName: "pin",
      group: "admin",
      description: "Ajusta las opciones del tablón",
      ownerOnly: true,
      guildOnly: true,
      args: [
        { key: "option", type: "string", prompt: "Opción a modificar.", default: "" },
        { key: "value", type: "string", prompt: "Valor a establecer", default: "" },
      ],
    });
  }

  async run(msg: Commando.CommandMessage, args: PinCommandArguments): Promise<Message | Message[]> {
    const server = new Server(msg.guild);
    switch (args.option) {
      case "emoji":
        await server.settings.setPinEmoji(args.value);
        return msg.reply("Cambiaste el emoji de reacción.");
      case "pinboard":
        await server.settings.setPinPinboard(args.value);
        return msg.reply("Cambiaste el canal de destino.");
      default:
        return msg.reply("Subcomandos: emoji, pinboard");
    }
  }
};
