import Hook from './hook';
import { CommandoClient } from 'discord.js-commando'
import { Guild, GuildMember, TextChannel } from 'discord.js';

export default class LeaveService implements Hook {

    private client: CommandoClient;

    constructor(client: CommandoClient) {
        this.client = client;
        this.client.on('guildMemberRemove', (member) => this.memberLeft(member));
    }

    private memberLeft(member: GuildMember) {
        let modlog = this.getModlog(member.guild);
        let user = member.user.tag;
        let message = `:x: ${user} ha ${this.leftMessage()}. ${this.reaction()}.`;
        modlog.send(message)
            .then(msg => console.log(`Enviado mensaje: ${msg}.`))
            .catch(e => console.error(`Error: ${e}`));
    }

    /* Send an unfunny joke in the style of the unfunny join messages sent by Discord. */
    private leftMessage(): string {
        let messages = [
            'abandonado el servidor',
            'hecho un sinpa',
            'salido por la puerta de atrás',
            'decidido escapar de aquí',
            'hecho :wq',
            'dicho adiós',
            'sufrido un Segmentation Fault',
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /* Send an unfunny joke in the style of the unfunny join messages sent by Discord. */
    private reaction(): string {
        let reactions = [
            'Huh',
            'Meh',
            'Hasta otra',
            'Ya volverá',
            'Sayonara',
            'Press F to pay respect',
            'Bye'
        ];
        return reactions[Math.floor(Math.random() * reactions.length)];
    }

    private getModlog(guild: Guild): TextChannel {
        /* If a modlog ID is not registered, there is no modlog. */
        if (!process.env.MODLOG) {
            return null;
        }

        /* Find a guild channel with such ID. */
        if (guild.channels.exists('id', process.env.MODLOG)) {
            let channel = guild.channels.find('id', process.env.MODLOG);
            return (channel.type == 'text') ?  <TextChannel> channel : null;
        } else {
            return null;
        }
    }

}
