import { Command } from 'discord.js-commando';

export default class HelpCommand extends Command {

  /** @param {Commando.CommandoClient} client - Client instance. */
  constructor(client) {
    super(client, {
      name: 'help',
      memberName: 'help',
      group: 'utiles',
      description: 'Muestra la lista de comandos disponibles.'
    });
  }

  async run(msg) {
    msg.channel.send(this._allGroups(msg.client));
  }

  _allGroups(client) {
    return client.registry.groups
      .map(g => `__${g.name}__\n${this._allCommands(g)}\n`)
      .join('\n');
  }

  _allCommands(group) {
    return group.commands
      .map(c => `**${c.name}**: ${c.description}`)
      .join('\n');
  }
}
