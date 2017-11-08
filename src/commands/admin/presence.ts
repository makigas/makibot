import * as Commando from 'discord.js-commando';
import * as Discord from 'discord.js';

interface ActivityCommandArguments {
    presence?: string;
}

export = class PresenceCommand extends Commando.Command {

    constructor(client: Commando.CommandoClient) {
        super(client, {
            name: 'presence',
            memberName: 'presence',
            group: 'admin',
            description: 'Ajusta la presencia del bot',
            args: [
                { key: 'presence', type: 'string', prompt: 'Estado del bot.', default: '' }
            ]
        });
    }

    run(msg: Commando.CommandMessage, args: ActivityCommandArguments) {
        if (msg.client.isOwner(msg.author)) {
            let presence = <Discord.PresenceStatus> args.presence.toLowerCase();
            switch (presence) {
                case 'online':
                case 'idle':
                case 'dnd':
                case 'invisible':
                    return msg.client.settings.set('BotPresence', presence)
                        .then(_ => msg.client.user.setStatus(presence))
                        .then(_ => msg.reply('Estado de presencia del bot modificado.'));
                default:
                    return msg.reply('Estados de presencia válidos: <online|idle|dnd|invisible>');
            }
        } else {
            return msg.reply('No estás en el archivo sudoers. Este incidente será reportado :oncoming_police_car:');
        }
    }
}
