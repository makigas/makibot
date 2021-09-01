import { Message, NewsChannel, TextChannel } from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { quoteMessage } from "../lib/response";

function permalink(content: string): RegExpMatchArray {
  const regex = /discord\.com\/channels\/([0-9]+)\/([0-9]+)\/([0-9]+)/;
  return content.match(regex);
}

export default class QuoteService implements Hook {
  name = "quote";

  async onMessageCreate(originalMessage: Message): Promise<void> {
    {
      const ids = permalink(originalMessage.cleanContent);
      if (ids) {
        try {
          const [guildId, channelId, messageId] = ids.slice(1);
          if (originalMessage.guild || originalMessage.guild.id === guildId) {
            const channel = originalMessage.guild.channels.cache.get(channelId);
            if (channel) {
              switch (channel.type) {
                case "GUILD_TEXT": {
                  const message = await (channel as TextChannel).messages.fetch(messageId);
                  if (message) {
                    originalMessage.channel.send(quoteMessage(message));
                  }
                  break;
                }
                case "GUILD_NEWS": {
                  const message = await (channel as NewsChannel).messages.fetch(messageId);
                  if (message) {
                    originalMessage.channel.send(quoteMessage(message));
                  }
                  break;
                }
              }
            }
          }
        } catch (e) {
          logger.error("[quote] cannot send message", e);
        }
      }
    }
  }
}
