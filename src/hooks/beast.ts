import { Message } from "discord.js";
import { Hook } from "../lib/hook";
import Member from "../lib/member";
import logger from "../lib/logger";

// Timeouts an user if they send a message with no text and four images uploaded as attachment.
export default class MrbeastService implements Hook {
  name = "beast";

  async onMessageCreate(message: Message): Promise<void> {
    if (await isProbablyCompromisedMessage(message)) {
      logger.info("[beast] found a compromised account - applying preventive timeout");
      await applyTimeout(message);
    }
  }
}

async function isProbablyCompromisedMessage(msg: Message) {
  if (msg.cleanContent.length != 0) {
    return false;
  }
  const attachments = msg.attachments.map((attachment) => attachment.name);
  // TODO: imagine using tesseract to actually detect words from the images and see if there are keywords like "airdrop" or that stuff
  if (
    attachments.length < 4 ||
    !attachments.every((at) => at?.endsWith(".jpg") || at?.endsWith(".png"))
  ) {
    return false;
  }

  if (msg.inGuild() && msg.member) {
    const member = new Member(msg.member);
    const karma = await member.getKarma();
    const timeSinceLastInteraction = Date.now() - karma.last;
    console.log({ timeSinceLastInteraction });
    return timeSinceLastInteraction > 86400 * 1000 * 28;
  } else {
    return false;
  }
}

async function applyTimeout(msg: Message) {
  if (msg.inGuild()) {
    await msg.delete();

    const now = Date.now();
    const oneHour = now + 3600_000;
    msg.member?.disableCommunicationUntil(oneHour);
  }
}
