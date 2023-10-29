import {
  Message,
  MessageAttachment,
  MessageEmbed,
  MessageOptions,
  NewsChannel,
  TextChannel,
  User,
  ThreadChannel,
} from "discord.js";

function permalink(message: Message): string {
  /* Leave the switch open in case threads use a different permalink system. */
  const { channel, guild } = message;
  switch (channel.type) {
    case "DM":
      return `https://discord.com/channels/@me/${channel.id}/${message.id}`;
    case "GUILD_NEWS":
    case "GUILD_NEWS_THREAD":
    case "GUILD_PUBLIC_THREAD":
    case "GUILD_TEXT":
      /* There must be a guild - Discord.js doesn't support group DM. */
      return `https://discord.com/channels/${guild.id}/${channel.id}/${message.id}`;
  }
}

function embedDescription(message: Message): string {
  const url = permalink(message);
  switch (message.channel.type) {
    case "DM":
      /* The embed will be seen by the user, thus present the name of the bot. */
      return `[${message.client.user.username}](${url}) -- ${message.cleanContent}`;
    case "GUILD_TEXT":
      return `[#${(message.channel as TextChannel).name}](${url}) -- ${message.cleanContent}`;
    case "GUILD_NEWS":
      return `[#${(message.channel as NewsChannel).name}](${url}) -- ${message.cleanContent}`;
    case "GUILD_NEWS_THREAD":
    case "GUILD_PUBLIC_THREAD":
      return `[#${(message.channel as ThreadChannel).name}](${url}) -- ${message.cleanContent}`;
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
  quote.setFooter({
    text: message.author.username,
    iconURL: message.author.avatarURL(),
  });
  quote.setTimestamp(message.editedTimestamp || message.createdTimestamp);

  /* Attachments. */
  const files: MessageAttachment[] = [];
  message.attachments.forEach((attachment) => files.push(attachment));

  return {
    allowedMentions: {},
    embeds: [quote],
    files,
  };
}

const SEVERITIES = {
  info: {
    color: 0x0d6efd,
  },
  success: {
    color: 0x198754,
  },
  error: {
    color: 0xdc3545,
  },
  warning: {
    color: 0xffc107,
  },
};

type Severity = keyof typeof SEVERITIES;

interface NotificationOptions {
  title: string;
  description?: string;
  severity?: Severity;
  target?: User;
  thumbnail?: string;
}

export function createToast(options: NotificationOptions): MessageEmbed {
  const embed = new MessageEmbed();
  if (options.target) {
    embed.setAuthor({
      name: options.title,
      iconURL: options.target.avatarURL(),
    });
  } else {
    embed.setAuthor({
      name: options.title,
    });
  }
  if (options.description) {
    embed.setDescription(options.description);
  }
  if (options.thumbnail) {
    embed.setThumbnail(options.thumbnail);
  }
  embed.setColor(SEVERITIES[options.severity || "warning"].color);
  return embed;
}
