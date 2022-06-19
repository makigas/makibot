import { Client, GuildChannel, Message, Snowflake } from "discord.js";
import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { quoteMessage } from "../lib/response";

/* To process the output of the RegexpMatchArray function. */
type MessageReference = [guild: Snowflake, channel: Snowflake, message: Snowflake];

export function parseMessageReference(content: string): MessageReference | null {
  const regexp = /discord\.com\/channels\/([0-9]+)\/([0-9]+)\/([0-9]+)/;
  const test = content.match(regexp);
  if (test) {
    /* The first item will be the parse itself, so let's get to the groups. */
    const [guild, channel, message] = test.slice(1);
    return [guild, channel, message];
  }
  return null;
}

function fetchMessage(client: Client, reference: MessageReference): Promise<Message> {
  const [guildId, channelId, messageId] = reference;
  return client.guilds
    .fetch(guildId)
    .then((guild) => guild.channels.fetch(channelId))
    .then((channel) => {
      if (channel.isText()) {
        return channel.messages.fetch(messageId);
      } else {
        return null;
      }
    });
}

export default class QuoteService implements Hook {
  name = "quote";

  async onMessageCreate(message: Message): Promise<void> {
    const reference = parseMessageReference(message.content);
    if (reference && reference[0] === message.guild.id) {
      try {
        const referenced = await fetchMessage(message.client, reference);

        /* Check permissions for this channel. */
        if (referenced.channel.type === "GUILD_TEXT") {
          const guildChannel = referenced.channel as GuildChannel;
          const permissions = await guildChannel.permissionsFor(guildChannel.guild.roles.everyone);
          if (!permissions.has("VIEW_CHANNEL")) {
            logger.info(
              `[quote] skipping quote of ${message.id} because ${referenced.channel.name} is not public`
            );
            return;
          }
        }

        if (referenced) {
          await message.channel.send(quoteMessage(referenced));
        }
      } catch (e) {
        logger.error("[quote] cannot send message", e);
      }
    }
  }
}
