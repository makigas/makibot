import { Message, PartialMessage, TextChannel } from "discord.js";
import Tag from "../lib/tag";
import Makibot from "../Makibot";
import { Hook } from "../lib/hook";
import { createToast } from "../lib/response";

const STALE_HOURS = 24;

/**
 * Fetch the tag that may yield to the ID of a message acting as a tombstone
 * message for the given text channel. Note that there is no guarantee that
 * a tombstone will actually exist, but this function will yield the tag
 * anyway so that caller can get, set or delete the tombstone ID.
 *
 * @param channel the channel to fetch the tombstone ID
 */
function tombstoneTag(channel: TextChannel): Tag {
  const provider = (channel.client as Makibot).provider;
  return new Tag(provider, `tombstone:${channel.id}`, { guild: channel.guild });
}

/**
 * If available, this function returns the handle for a tombstone message.
 * Otherwise, it will return null. The tombstone message is a previously
 * sent message containing a tombstone.
 *
 * @param channel the channel to fetch the tombstone for
 */
async function getTombstone(channel: TextChannel): Promise<Message | null> {
  const tombstone = tombstoneTag(channel),
    id = tombstone.get(null);
  if (!id) {
    return null;
  }

  /* Fetch the tombstone message. */
  try {
    return channel.messages.fetch(id);
  } catch (e) {
    /* For some reason couldn't fetch it. */
    await tombstone.delete();
    return null;
  }
}

export default class TombstoneService implements Hook {
  name = "tombstone";

  async onMessageCreate(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;

    /* Discard messages not sent to a guild. */
    if (!message.channel || message.channel.type != "GUILD_TEXT") {
      return;
    }

    /* Delete the tombstone and tag if present. */
    try {
      const tombstone = await getTombstone(channel);
      if (tombstone) {
        await tombstone.delete();
      }
    } catch (e) {
      /* Message not found, let's ignore it. */
    } finally {
      tombstoneTag(channel).delete();
    }
  }

  async onMessageDestroy(message: PartialMessage): Promise<void> {
    const channel = message.channel as TextChannel;

    /* Discard messages not sent to a guild. */
    if (!message.channel || message.channel.type != "GUILD_TEXT") {
      return;
    }

    /* Discard a message if it is actually a tombstone. */
    if (tombstoneTag(channel).get(null) === message.id) {
      await tombstoneTag(channel).delete();
      return;
    }

    /* Fetch the now latest message in that channel and check if it's stale. */
    const messages = await message.channel.messages.fetch({ limit: 1 });
    const staleness = STALE_HOURS * 3600 * 1000;
    if (messages.first().createdTimestamp < Date.now() - staleness) {
      /* It is. Send a tombstone. */
      const toast = createToast({
        title: "Un mensaje ha sido eliminado",
        description: [
          `Como el mensaje que tengo justo encima tiene más de 24 horas, mando`,
          `esta notificación para no confundir a quienes vean que hay mensajes nuevos`,
          `en este canal y no los encuentren.`,
        ].join(" "),
        severity: "info",
        thumbnail: `https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/282/ghost_1f47b.png`,
      });
      const tombstone = await message.channel.send({ embeds: [toast] });
      tombstoneTag(channel).set(tombstone.id);
    }
  }
}
