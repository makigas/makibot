import { Message, TextChannel } from "discord.js";
import Tag from "../lib/tag";
import Makibot from "../Makibot";
import Hook from "./hook";

const STALE_HOURS = 24;

const TOMBSTONE_TEXT = `👻 _[un mensaje ha sido borrado]_ 👻
    (por eso este canal te sale como no leído)`;

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
  return new Tag(provider, `tombstone:${channel.id}`, channel.guild);
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
  constructor(client: Makibot) {
    client.on("messageDelete", (message) => this.onMessageDelete(message));
    client.on("message", (message) => this.onMessageCreate(message));
  }

  private async onMessageCreate(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;

    /* Discard messages not sent to a guild. */
    if (!message.channel || message.channel.type != "text") {
      return;
    }

    /* Delete the tombstone and tag if present. */
    const tombstone = await getTombstone(channel);
    if (tombstone) {
      await tombstone.delete();
      tombstoneTag(channel).delete();
    }
  }

  private async onMessageDelete(message: Message): Promise<void> {
    const channel = message.channel as TextChannel;

    /* Discard messages not sent to a guild. */
    if (!message.channel || message.channel.type != "text") {
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
      const tombstone = await channel.send(TOMBSTONE_TEXT);
      tombstoneTag(channel).set(tombstone.id);
    }
  }
}
