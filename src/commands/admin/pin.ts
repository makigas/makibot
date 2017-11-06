import * as Commando from 'discord.js-commando'
import * as Discord from 'discord.js'

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

    constructor(client: Commando.CommandoClient) {
        super(client, {
            name: 'pin',
            memberName: 'pin',
            group: 'admin',
            description: 'Ajusta las opciones del tablón',
            args: [
                { key: 'option', type: 'string', prompt: 'Opción a modificar.', default: '' },
                { key: 'value', type: 'string', prompt: 'Valor a establecer', default: '' }
            ]
        });
    }

    async run(msg: Commando.CommandMessage, args: PinCommandArguments) {
        if (msg.client.isOwner(msg.author)) {
            switch (args.option) {
                case 'emoji':
                    await this.client.provider.set(msg.guild, 'Pin.Emoji', args.value);
                    return msg.reply('Cambiaste el emoji de reacción.');
                case 'pinboard':
                    await this.client.provider.set(msg.guild, 'Pin.Pinboard', args.value);
                    return msg.reply('Cambiaste el canal de destino.');
                default:
                    return msg.reply('Subcomandos: emoji, pinboard');
            }
        } else {
            return msg.reply('No estás en el archivo sudoers. Este incidente será reportado :oncoming_police_car:');
        }
    }
}
