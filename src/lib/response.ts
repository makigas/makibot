import {
  Message,
  MessageAttachment,
  MessageEmbed,
  MessageOptions,
  NewsChannel,
  TextChannel,
} from "discord.js";

function permalink(message: Message): string {
  /* Leave the switch open in case threads use a different permalink system. */
  const { channel, guild } = message;
  switch (channel.type) {
    case "dm":
      return `https://discord.com/channels/@me/${channel.id}/${message.id}`;
    case "news":
    case "text":
      /* There must be a guild - Discord.js doesn't support group DM. */
      return `https://discord.com/channels/${guild.id}/${channel.id}/${message.id}`;
  }
}

function embedDescription(message: Message): string {
  const url = permalink(message);
  switch (message.channel.type) {
    case "dm":
      /* The embed will be seen by the user, thus present the name of the bot. */
      return `[${message.client.user.username}](${url}) -- ${message.cleanContent}`;
    case "text":
      return `[#${(message.channel as TextChannel).name}](${url}) -- ${message.cleanContent}`;
    case "news":
      return `[#${(message.channel as NewsChannel).name}](${url}) -- ${message.cleanContent}`;
  }
}

/**
 * Builds a quote that embeds a message. This allows to "share" the
 * message again, verbatim, including the original contents, attached
 * files, and any original embeds part of the original message too.
 * @param message the message to quote
 */
export function quoteMessage(message: Message): MessageOptions {
  const quote = new MessageEmbed();
  quote.setDescription(embedDescription(message));
  quote.setFooter(message.author.username, message.author.avatarURL());
  quote.setTimestamp(message.editedTimestamp || message.createdTimestamp);

  /* Attachments. */
  const files: MessageAttachment[] = [];
  message.attachments.forEach((attachment) => files.push(attachment));

  return {
    disableMentions: "all",
    allowedMentions: {},
    embed: quote,
    files,
  };
}
