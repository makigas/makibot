import Commando from 'discord.js-commando';

export default class ActivityCommand extends Commando.Command {

    /** @param {Commando.CommandoClient} client - Client instance. */
    constructor(client) {
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

    /**
   * @param {Commando.CommandMessage} msg – Sent message.
   * @param {Object} argv - Provided arguments.
   * @param {string} argv.activity - Activity string to set for this bot.
   */
    async run(msg, { activity }) {
        if (msg.client.isOwner(msg.author)) {
            if (activity == '') {
                return msg.client.settings.remove('BotActivity')
                    .then(() => msg.client.settings.remove('BotActivity'))
                    .then(() => msg.channel.send('Eliminada actividad del bot'))
                    .catch(console.error);
            } else {
                return msg.client.settings.set('BotActivity', activity)
                    .then(() => msg.client.user.setGame(activity))
                    .then(() => msg.channel.send('Actividad del bot actualizada'))
                    .catch(console.error);
            }
        } else {
            return msg.reply('No estás en el archivo sudoers. Este incidente será reportado :oncoming_police_car:');
        }
    }
}
