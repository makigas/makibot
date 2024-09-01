import { MessageEmbed, User } from "discord.js";

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
