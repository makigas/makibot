import { Message } from "discord.js";
import { Command, CommandMessage } from "discord.js-commando";

import AntiRaid from "../../lib/antiraid";
import Member from "../../lib/member";
import Makibot from "../../Makibot";

interface RaidCommandArguments {
  command?: string;
}

export = class RaidCommand extends Command {
  private antiraid: AntiRaid;

  constructor(client: Makibot) {
    super(client, {
      name: "raid",
      memberName: "raid",
      group: "moderation",
      description: "Activa o desactiva la protección de raids",
      args: [
        {
          key: "command",
          type: "string",
          prompt: "¿Operación?",
          default: "status",
        },
      ],
    });
    this.antiraid = client.antiraid;
  }

  async run(msg: CommandMessage, { command }: RaidCommandArguments): Promise<Message> {
    // Must be mod to run this command.
    const author = new Member(msg.member);
    if (author.moderator) {
      const operation = command.toLowerCase().trim();
      if (operation == "on") {
        await this.antiraid.setRaidMode(true);
        return msg.channel.send("Modo antiraid ha sido habilitado");
      } else if (operation == "off") {
        await this.antiraid.setRaidMode(false);
        return msg.channel.send("Modo antiraid ha sido desactivado");
      } else if (operation == "status") {
        if (this.antiraid.raidMode) {
          return msg.channel.send("El modo antiraid está activo");
        } else {
          return msg.channel.send("El modo antiraid está inactivo");
        }
      } else {
        return msg.channel.send("Uso: raid [on|off|status]");
      }
    }
  }
};
