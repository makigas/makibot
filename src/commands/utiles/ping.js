import Commando from 'discord.js-commando';

/**
 * This command is used to calculate the time taken for the bot to see and
 * react to a message. This is known as RTT. Executing `ping` should result
 * in the amount of milliseconds that takes a message to be delivered to the
 * bot to be written in the chat output.
 */
export default class PingCommand extends Commando.Command {

    /**
     * @param client {Commando.CommandoClient}
     */
    constructor(client) {
        super(client, {
            name: 'ping',
            memberName: 'ping',
            group: 'utiles',
            description: 'Determina el tiempo de reacción del bot.'
        });
    }

    /**
     * @param msg {Commando.CommandMessage}
     */
    async run(msg) {
        if (msg.editedTimestamp == null) {
            let sentMessage = await msg.channel.send('pong.');
            let rtt = sentMessage.createdTimestamp - msg.createdTimestamp;
            await sentMessage.edit('pong..');
            let hb = msg.client.ping;
            await sentMessage.edit(`pong... RTT = ${rtt}ms. HeartBeat = ${hb}ms.`);
        } else {
            return [];
        }
    }
}
