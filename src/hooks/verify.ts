import Hook from './hook';
import { CommandoClient } from 'discord.js-commando'
import { GuildMember, Message, Channel, TextChannel, Guild, Role } from 'discord.js';

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
        this.role = process.env.NEWBIE_ROLE;
        this.token = process.env.VERIFY_TOKEN;

        client.on('guildMemberAdd', (member) => this.markMemberAsNew(member));
        client.on('message', (message) => this.handleMessage(message));
    }

    private markMemberAsNew(member: GuildMember) {
        this.getNewbieRole(member.guild)
            .then(role => member.addRole(role))
            .catch(err => console.error(err));
    }

    private handleMessage(message: Message) {
        // Reject this message if it's not a validation message.
        if (!this.isVerificationMessage(message)) {
            console.log(`DEBUG: Not a message for us: ${message.id}`);
            return;
        }
        if (!this.isVerificationChannel(message.channel)) {
            console.log(`DEBUG: Not a message for us: ${message.id}`);
            return;
        }

        // It's a validation message. Approve this user.
        this.getNewbieRole(message.guild)
            .then(role => message.member.removeRole(role))
            .then(member => member.send(VerifyService.ACCEPTED))
    }

    /** Returns true if the given channel is the channel to validate accounts. */
    private isVerificationChannel(channel: Channel): boolean {
        return channel.type == 'text' && (<TextChannel> channel).name == this.channel;
    }

    /** Returns true if the given message is a validation message. */
    private isVerificationMessage(message: Message) {
        let cleanToken = this.token.toLowerCase().trim();
        let inputToken = message.content.toLowerCase().trim();
        return cleanToken === inputToken;
    }

    /**
     * Fetches the role that should be given to new users.
     * @param guild the guild to extract the role from.
     */
    private getNewbieRole(guild: Guild): Promise<Role> {
        return new Promise((resolve, reject) => {
            let role = guild.roles.find('name', this.role);
            if (role) {
                resolve(role);
            } else {
                reject(`Role ${this.role} not found in guild ${guild.name}.`);
            }
        });
    }
}
