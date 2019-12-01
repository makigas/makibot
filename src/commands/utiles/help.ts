import Commando from "discord.js-commando";
import { Message } from "discord.js";

import Makibot from "../../Makibot";

export = class HelpCommand extends Commando.Command {
  constructor(client: Makibot) {
    super(client, {
      name: "help",
      memberName: "help",
      group: "utiles",
      description: "Muestra la lista de comandos disponibles.",
    });
  }

  async run(msg: Commando.CommandMessage): Promise<Message | Message[]> {
    /* if this user is owner, [s]he can see additional commands. */
    let owner = msg.client.isOwner(msg.author);
    return msg.channel.send(this.groupsString(msg.client.registry, owner));
  }

  private groupsString(registry: Commando.CommandRegistry, includeAdmin: boolean): string {
    let info = (g: Commando.CommandGroup) => `__${g.name}__\n${this.commandsString(g)}`;
    let groups = registry.groups;
    if (!includeAdmin) {
      /* If an owner has not sent this message, don't include admin group. */
      groups = groups.filter((g: Commando.CommandGroup) => g.id != "admin");
    }
    return groups.map(info).join("\n\n");
  }

  private commandsString(group: Commando.CommandGroup): string {
    let info = (c: Commando.Command) => `**${c.name}**: ${c.description}`;
    return group.commands.map(info).join("\n");
  }
};
