import { Message } from "discord.js";
import { Command, CommandGroup, CommandoMessage, CommandoRegistry } from "discord.js-commando";

import Makibot from "../../Makibot";

export default class HelpCommand extends Command {
  constructor(client: Makibot) {
    super(client, {
      name: "help",
      memberName: "help",
      group: "utiles",
      description: "Muestra la lista de comandos disponibles.",
    });
  }

  async run(msg: CommandoMessage): Promise<Message | Message[]> {
    /* if this user is owner, [s]he can see additional commands. */
    const owner = msg.client.isOwner(msg.author);
    return msg.channel.send(this.groupsString(msg.client.registry, owner));
  }

  private groupsString(registry: CommandoRegistry, includeAdmin: boolean): string {
    const info = (g: CommandGroup) => `__${g.name}__\n${this.commandsString(g)}`;
    let groups = registry.groups;
    if (!includeAdmin) {
      /* If an owner has not sent this message, don't include admin group. */
      groups = groups.filter((g: CommandGroup) => g.id != "admin");
    }
    return groups.map(info).join("\n\n");
  }

  private commandsString(group: CommandGroup): string {
    const info = (c: Command) => `**${c.name}**: ${c.description}`;
    return group.commands.map(info).join("\n");
  }
}
