import * as Commando from 'discord.js-commando';
import { Client, Guild, Role } from 'discord.js';

interface HelperCommandArguments {
    mode: boolean
}

export = class HelperCommand extends Commando.Command {

    constructor(client: Commando.CommandoClient) {
        super(client, {
            name: 'helper',
            group: 'utiles',
            memberName: 'helper',
            description: 'Te mete o te quita del rol de helpers.',
            examples: ['helper true', 'helper false'],
            args: [
                { key: 'mode', type: 'boolean', prompt: '¿Quieres entrar o salir del rol helpers?.', default: '' }
            ]
        });
    }

    async run(msg: Commando.CommandMessage, args: HelperCommandArguments) {
        // Get the helper role name from ENV.
        let roleName = process.env.HELPER_ROLE || 'helpers';
        if (!msg.guild.roles.find('name', roleName)) {
            let message = [
                'Oh, oh. Parece que este bot no está bien configurado.',
                `¿Hay algún admin que pueda crear un rol llamado "${roleName}"?`
            ].join('\n');
            return msg.channel.send(message);
        }

        let role = msg.guild.roles.find('name', roleName);

        // Act on behalf of what the user wants.
        if (args.mode) {
            // Add the user to this role unless they're already in.
            if (msg.member.roles.has(role.id)) {
                return msg.reply(`Ya formabas parte del rol ${roleName}.`);
            } else {
                return msg.member.addRole(role)
                    .then(member => msg.reply(`Ahora estás en el rol ${roleName}.`))
                    .catch(e => msg.reply(`No puedo satisfacer tu orden porque ${e}.`));
            }
        } else {
            // Remove the user from this role unless they're never in.
            if (msg.member.roles.has(role.id)) {
                return msg.member.removeRole(role)
                    .then(member => msg.reply(`Ya no formas parte del rol ${roleName}.`))
                    .catch(e => msg.reply(`No puedo satisfacer tu orden porque ${e}.`));
            } else {
                return msg.reply(`Nunca has formado parte del rol ${roleName}.`);
            }
        }
    }
}
