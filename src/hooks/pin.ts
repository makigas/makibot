import * as Commando from 'discord.js-commando';
import * as Discord from 'discord.js';
import Hook from './hook';

export default class PinService implements Hook {

    private client: Commando.CommandoClient;

    constructor(client: Commando.CommandoClient) {
        this.client = client;

        this.client.on('messageReactionAdd', (reaction, user) => this.messageReactionAdd(reaction, user));
        this.client.on('messageReactionRemove', (reaction, user) => this.messageReactionRemove(reaction, user));
        this.client.on('messageReactionRemoveAll', (message) => this.messageReactionRemoveAll(message));

        this.client.guilds.forEach(guild => {
            // Cache recent messages per server.
            guild.channels.forEach(channel => {
                if (channel.type == 'text') {
                    (<Discord.TextChannel> channel).fetchMessages({ limit: 100 }).catch(console.error);
                }
            })
        });

        console.log('Pin hook registered.');
    }

    private messageReactionAdd(reaction: Discord.MessageReaction, user: Discord.User) {
        let channel = reaction.message.channel;
        if (channel.type == 'text') {
            let guild = (<Discord.TextChannel> channel).guild;
            let trigger: string = this.getTriggerEmoji(guild);
            if (reaction.emoji.name == trigger) {
                this.sendReact(reaction.message);
            }
        }
    }

    private sendReact(message: Discord.Message) {
        // I can only react to messages sent through guild text channels.
        if (message.channel.type != 'text') {
            return;
        }

        // Get the pinboard channel.
        let pinboard = this.getPinboardChannel(message.guild);
        let pinchannel = <Discord.TextChannel> message.guild.channels.get(pinboard);
        let srcchannel = <Discord.TextChannel> message.channel;

        // Build an embed with the message information.
        let embed = new Discord.RichEmbed();
        embed.setAuthor(message.author.tag, message.author.avatarURL);
        embed.setTitle(srcchannel.name);
        embed.setFooter(message.id);
        embed.setDescription(message.content);
        embed.setTimestamp(new Date(message.createdTimestamp));

        // Find something to attach if available.
        if (this.getEmbedThumbnail(message)) {
            embed.setImage(this.getEmbedThumbnail(message));
        } else if (this.getAttachedImage(message)) {
            embed.setImage(this.getAttachedImage(message));
        }else if (this.getAttachedSomething(message)) {
            let file = this.getAttachedSomething(message);
            embed.addField(file.filename, file.url);
        }

        // Send this embed.
        pinchannel.send(this.getTriggerEmoji(message.guild), { embed: embed });
    }

    /**
     * Get an URL to an embed thumbnail for this message, if available.
     * @return an URL to an embed or null if no embed has thumbnails.
     */
    private getEmbedThumbnail(message: Discord.Message): string {
        let withThumbnails = message.embeds.filter(e => e.thumbnail);
        if (withThumbnails.length > 0) {
            return withThumbnails[0].url;
        } else {
            return null;
        }
    }

    /**
     * Get an URL to an image attached to this message, if available.
     * @return an URL to an image attached to the message or null if no images.
     */
    private getAttachedImage(message: Discord.Message): string {
        let attachedImages = message.attachments.filter(a => a.width != null && a.height != null);
        if (attachedImages.size > 0) {
            return attachedImages.first().url;
        } else {
            return null;
        }
    }

    /**
     * Get a descriptor to an attachment added to this file.
     * @return an attachment addded to this file or null if no attachments.
     */
    private getAttachedSomething(message: Discord.Message): Discord.MessageAttachment {
        if (message.attachments.size > 0) {
            return message.attachments.first();
        } else {
            return null;
        }
    }

    private messageReactionRemove(reaction: Discord.MessageReaction, user: Discord.User) {
        console.log(`${user.tag} unreacted to ${reaction.message.id} with emoji ${reaction.emoji.name}`);
    }

    private messageReactionRemoveAll(message: Discord.Message) {
        console.log(`Reactions to message ${message.id} were deleted.`);
    }

    /**
     * Recupera el emoji que, al ser aplicado como reacción, dispara el evento.
     * @return el emoji que haya establecido un administrador, o ⭐ (0x2B50)
     */
    private getTriggerEmoji(server: Discord.Guild): string {
        return this.client.provider.get(server, 'Pin.Emoji', '\u2b50');
    }

    /**
     * Recupera el canal al que enviar el mensaje.
     * @return Snowflake
     */
    private getPinboardChannel(server: Discord.Guild): string {
        return this.client.provider.get(server, 'Pin.Pinboard', '377143070745165824');
    }
}
