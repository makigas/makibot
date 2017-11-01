import * as Commando from 'discord.js-commando';

export = class ActivityCommand extends Commando.Command {

    constructor(client: Commando.CommandoClient) {
        super(client, {
            name: 'activity',
            memberName: 'activity',
            group: 'admin',
            description: 'Ajusta las opciones de actividad del bot',
            args: [
                { key: 'activity', type: 'string', prompt: 'Actividad a establecer.', default: '' }
            ]
        });
    }

    run(msg: Commando.CommandMessage, { activity }: { activity: string }) {
        if (msg.client.isOwner(msg.author)) {
            if (activity == '') {
                return msg.client.settings.remove('BotActivity')
                    .then(() => msg.client.settings.remove('BotActivity'))
                    .then(() => msg.channel.send('Eliminada actividad del bot'));
            } else {
                return msg.client.settings.set('BotActivity', activity)
                    .then(() => msg.client.user.setGame(activity))
                    .then(() => msg.channel.send('Actividad del bot actualizada'));
            }
        } else {
            return msg.reply('No estás en el archivo sudoers. Este incidente será reportado :oncoming_police_car:');
        }
    }
}
