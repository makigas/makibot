import Hook from './hook';
import { CommandoClient } from 'discord.js-commando'
import { Message, TextChannel, Guild, Role } from 'discord.js';

/**
 * The verify service allows a server to force users to validate themselves by
 * typing a token into a particular channel in order to have them a permission
 * applied.
 */
export default class VerifyService implements Hook {

    private static ACCEPTED: string = [
        'Enhorabuena, has verificado tu cuenta en este servidor. Ahora puedes ver',
        'el resto de canales. Recuerda que al haber firmado el código de conducta,',
        'entiendes que publicar mensajes que lo incumplan puede acarrear un warn,',
        'un kick o un ban.'
    ].join(' ');

    private channel: string;

    private token: string;

    private role: string;

    constructor(client: CommandoClient) {
        this.channel = process.env.VERIFY_CHANNEL;
        this.role = process.env.VERIFY_ROLE;
        this.token = process.env.VERIFY_TOKEN;
        client.on('message', (message) => this.handleMessage(message));
    }

    private handleMessage(message: Message) {
        if (!this.isVerificationMessage(message)) {
            /* Not a message to validate the account. Bail out. */
            console.error('Not a verification message');
            return;
        }

        let channel = this.getVerificationChannel(message.guild);
        if (message.channel.id != channel.id) {
            console.error('Not in the verification channel');
            /* Not a message sent to the verification channel. Bail out. */
            return;
        }

        let role = this.getVerificationRole(message.guild);
        message.member.addRole(role)
            .then(member => member.send(VerifyService.ACCEPTED))
            .catch(e => console.error(e));
    }

    /** Returns the associated role to verified accounts on this guild. */
    private getVerificationRole(guild: Guild): Role {
        let role = guild.roles.find('name', this.role);
        if (!role) {
            throw new ReferenceError(`Role ${this.role} not found in guild ${guild.name}!`);
        }
        return role;
    }

    /** Returns the associated channel to verify accounts on this guild. */
    private getVerificationChannel(guild: Guild): TextChannel {
        let channel = guild.channels.find('name', this.channel);
        if (!channel) {
            throw new ReferenceError(`Channel ${this.channel} not found in guild ${guild.name}!`);
        }
        if (channel.type != 'text') {
            throw new ReferenceError(`Channel ${this.channel} is not a text channel!`);
        }
        return <TextChannel> channel;
    }

    /** Returns true if the given message is a validation message. */
    private isVerificationMessage(message: Message) {
        let cleanToken = this.token.toLowerCase().trim();
        let inputToken = message.content.toLowerCase().trim();
        return cleanToken === inputToken;
    }
}
