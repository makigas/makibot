import Discord from "discord.js";

import Hook from "./hook";
import Makibot from "../Makibot";
import { getURL } from "../lib/message";
import Server from "../lib/server";
import logger from "../lib/logger";

export default class PinService implements Hook {
  private client: Makibot;

  constructor(client: Makibot) {
    this.client = client;

    this.client.on("messageReactionAdd", (reaction) => this.messageReactionAdd(reaction));
    this.client.on("messageReactionRemove", (reaction, user) =>
      this.messageReactionRemove(reaction, user)
    );
    this.client.on("messageReactionRemoveAll", (message) => this.messageReactionRemoveAll(message));

    this.client.guilds.forEach((guild) => {
      // Cache recent messages per server.
      guild.channels.forEach((channel) => {
        if (channel.type == "text") {
          (<Discord.TextChannel>channel).fetchMessages({ limit: 100 }).catch(console.error);
        }
      });
    });

    logger.debug("[hooks] hook started: pin");
  }

  private messageReactionAdd(reaction: Discord.MessageReaction): void {
    const channel = reaction.message.channel;
    if (channel.type == "text") {
      const server = new Server((channel as Discord.TextChannel).guild);
      const trigger = server.settings.pinEmoji;
      if (reaction.emoji.name == trigger && reaction.count == 1) {
        this.sendReact(reaction.message);
      }
    }
  }

  private sendReact(message: Discord.Message) {
    // I can only react to messages sent through guild text channels.
    if (message.channel.type != "text" || !message.guild) {
      return;
    }

    // Get the pinboard channel.
    const server = new Server(message.guild);
    const pinchannel = server.pinboardChannel;
    let srcchannel = <Discord.TextChannel>message.channel;

    if (pinchannel == null) {
      return;
    }

    // Build an embed with the message information.
    let embed = new Discord.RichEmbed();
    embed.setAuthor(message.author.tag, message.author.avatarURL);
    embed.setTitle(srcchannel.name);
    embed.setFooter(message.id);
    embed.setDescription(message.content);
    embed.setURL(getURL(message));
    embed.setTimestamp(new Date(message.createdTimestamp));

    // Find something to attach if available.
    if (this.getEmbedThumbnail(message)) {
      embed.setImage(this.getEmbedThumbnail(message));
    } else if (this.getAttachedImage(message)) {
      embed.setImage(this.getAttachedImage(message));
    } else if (this.getAttachedSomething(message)) {
      let file = this.getAttachedSomething(message);
      embed.addField(file.filename, file.url);
    }

    // Send this embed.
    let emoji = server.settings.pinEmoji;
    let url = getURL(message);
    pinchannel.send(`${emoji} :arrow_right: ${url}`, { embed: embed });
  }

  /**
   * Get an URL to an embed thumbnail for this message, if available.
   * @return an URL to an embed or null if no embed has thumbnails.
   */
  private getEmbedThumbnail(message: Discord.Message): string {
    let withThumbnails = message.embeds.filter((e) => e.thumbnail);
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
    let attachedImages = message.attachments.filter((a) => a.width != null && a.height != null);
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
    console.log(
      `${user.tag} unreacted to ${reaction.message.id} with emoji ${reaction.emoji.name}`
    );
  }

  private messageReactionRemoveAll(message: Discord.Message) {
    console.log(`Reactions to message ${message.id} were deleted.`);
  }
}
