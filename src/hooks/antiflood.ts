import { Message, MessageEmbed, PartialMessage, Snowflake } from "discord.js";
import { Hook } from "../lib/hook";
import Member from "../lib/member";
import { createToast } from "../lib/response";
import applyWarn from "../lib/warn";
import logger from "../lib/logger";

interface AntifloodData {
  channel: Snowflake;
  message: Snowflake;
  expires: number;
}

interface AntifloodHistory {
  [message: string]: AntifloodData;
}

function generateFirstToast(message: Message): MessageEmbed {
  return createToast({
    title: `@${message.member.user.username}, no hagas flooding`,
    severity: "warning",
    target: message.member.user,
    description: [
      "Ponte de acuerdo y elige un canal en el que mandar tu mensaje.",
      "No mandes el mismo mensaje a múltiples canales porque puede ser",
      "confuso para las personas que te pueden estar intentando echar",
      "una mano, ¿no crees?",
      "\n\n",
      "Tendrás que borrar el mensaje del otro canal si quieres mandarlo",
      "aquí, o esperar una hora para que el mensaje se enfríe.",
    ].join(" "),
  });
}

function generateRepeatingToast(message: Message): MessageEmbed {
  return createToast({
    title: `@${message.member.user.username}, te hemos dicho que no hagas flooding`,
    severity: "error",
    target: message.member.user,
    description: [
      "Has faltado varias veces a esta norma. Si vuelves a copiar y pegar un",
      "mensaje en otro canal en vez de simplemente mantener la conversación",
      "en un único canal, se te SILENCIARÁ.",
    ].join(" "),
  });
}

function generateMuteToast(message: Message): MessageEmbed {
  return createToast({
    title: `Todo tiene un límite, @${message.member.user.username}`,
    severity: "error",
    target: message.member.user,
    description: [
      "Se te ha pedido en varias ocasiones que no copies y pegues un mensaje",
      "en múltiples canales, pero claramente se ve que tienes algún problema",
      "de comprensión lectora.",
    ].join(" "),
  });
}

function normalize(message: string): string {
  return message.replace(/\s+/g, "").toLowerCase();
}

/** Returns the words that form a message. */
function words(message: string): string[] {
  return message.trim().replace(/\s+/g, " ").split(" ");
}

function cleanHistory(history: AntifloodHistory): AntifloodHistory {
  const threshold = Date.now() - 3600_000;
  return Object.entries(history).reduce((prev, [k, v]) => {
    if (v.expires >= threshold) {
      prev[k] = v;
    }
    return prev;
  }, {});
}

/**
 * This function will remember that this member is going to be pinged
 * about its flood history, and then it will return the amount of pings
 * that this person has received in the last 7 days. This function
 * will always return a positive number since as a side effect it
 * remembers this call, so at least one event will be returned.
 *
 * @param member the member to log the ping event.
 */
async function raisePing(member: Member): Promise<number> {
  /* There is a tag per user that will remember this. */
  const tag = member.tagbag.tag("antiflood:pings");
  const pings: number[] = tag.get([]);

  /* Clean pings older than 7 days. */
  const now = Math.floor(Date.now() / 1000);
  const recentPings = pings.filter((ping) => ping >= now - 86400 * 7);
  recentPings.push(now);
  await tag.set(recentPings);

  /* Return the number of pings received this week. */
  return recentPings.length;
}

export default class AntifloodService implements Hook {
  name = "antiflood";

  async onMessageDestroy(message: PartialMessage): Promise<void> {
    if (!message.member || !message.member.guild) {
      /* Webhooks will trigger this. */
      return;
    }
    const member = new Member(message.member);
    const normalized = normalize(message.cleanContent);

    /* Forget about the message. */
    const tag = member.tagbag.tag("antiflood:history2");
    const history: AntifloodHistory = tag.get({});
    delete history[normalized];
    await tag.set(cleanHistory(history));
  }

  async onMessageCreate(message: Message): Promise<void> {
    if (!message.member || !message.member.guild) {
      /* Webhooks will trigger this. */
      return;
    }
    const member = new Member(message.member);
    const normalized = normalize(message.cleanContent);

    /* Some cases that are allowed. */
    if (message.author.bot || member.moderator) {
      return;
    }
    if (words(message.cleanContent).length <= 3) {
      return;
    }

    /* Test if the message was posted recently. */
    const tag = member.tagbag.tag("antiflood:history2");
    const history: AntifloodHistory = tag.get({});
    if (normalized in history) {
      const when = history[normalized].expires;
      if (Date.now() - when < 3600_000) {
        const alertCounter = await raisePing(member);
        if (alertCounter === 1) {
          const toast = generateFirstToast(message);
          await message.channel.send({ embeds: [toast] });
          await message.delete();
        } else if (alertCounter === 2) {
          const toast = generateRepeatingToast(message);
          await message.channel.send({ embeds: [toast] });
          await message.delete();
        } else if (alertCounter >= 3) {
          if (member.muted) {
            await message.member.ban({
              reason: "Antispam",
            });
          } else {
            await member.setMuted(true);

            /* Delete the original message since the member has been muted. */
            try {
              const originalChannel = await message.guild.channels.fetch(
                history[normalized].channel
              );
              if (originalChannel.isText()) {
                const originalMessage = await originalChannel.messages.fetch(
                  history[normalized].message
                );
                if (originalMessage) {
                  originalMessage.delete();
                }
              }
            } catch (e) {
              logger.error("[antiflood] i cannot delete the message, i'm so sorry");
            }

            const toast = generateMuteToast(message);
            await message.channel.send({ embeds: [toast] });
            await message.delete();

            /* Then warn + mute the member. */
            await applyWarn(message.guild, {
              user: message.author,
              message: message,
              reason: "El sistema antiflood ha saltado varias veces",
              duration: 86400 * 1000,
            });
          }
        }
      }
    }

    /* Update the history for this user. */
    const newTag: AntifloodHistory = {
      ...cleanHistory(history),
      [normalized]: {
        channel: message.channel.id,
        message: message.id,
        expires: Date.now(),
      },
    };
    tag.set(newTag);
  }
}
