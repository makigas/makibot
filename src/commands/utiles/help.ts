import * as Commando from 'discord.js-commando';

export = class HelpCommand extends Commando.Command {

    constructor(client: Commando.CommandoClient) {
        super(client, {
            name: 'help',
            memberName: 'help',
            group: 'utiles',
            description: 'Muestra la lista de comandos disponibles.'
        });
    }

    async run(msg: Commando.CommandMessage) {
        return msg.channel.send(this.groupsString(msg.client.registry));
    }

    private groupsString(registry: Commando.CommandRegistry) {
        let info = (g: Commando.CommandGroup) => `__${g.name}__\n${this.commandsString(g)}`;
        return registry.groups.map(info).join('\n\n');
    }

    private commandsString(group: Commando.CommandGroup) {
        let info = (c: Commando.Command) => `**${c.name}**: ${c.description}`;
        return group.commands.map(info).join('\n');
    }
}
