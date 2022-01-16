import { Message, MessageEmbed, PartialMessage, Snowflake } from "discord.js";
import { Hook } from "../lib/hook";
import Member from "../lib/member";
import { createToast } from "../lib/response";
import { ModEvent } from "../lib/modlog/types";
import { modEventBuilder } from "../lib/modlog/actions";

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
      "Por favor, ponte de acuerdo y no envíes un mismo mensaje a varios canales.",
      "\n\n",
      "Hacerlo es confuso para la gente que te está intentando echar una mano,",
      "¿no crees? Por favor, manten la conversación donde la empezaste o",
      "elimina antes el viejo hilo si quieres empezar aquí.",
    ].join(" "),
  });
}

function generateRepeatingToast(message: Message): MessageEmbed {
  return createToast({
    title: `@${message.member.user.username}, te hemos dicho que no hagas flooding`,
    severity: "error",
    target: message.member.user,
    description: [
      "Por favor, ponte de acuerdo y no envíes un mismo mensaje a varios canales.",
      "\n\n",
      "Hacerlo es confuso para la gente que te está intentando echar una mano,",
      "¿no crees? Por favor, manten la conversación donde la empezaste o",
      "elimina antes el viejo hilo si quieres empezar aquí.",
      "\n\n",
      "Este es el **segundo aviso** que se te da.",
    ].join(" "),
  });
}

function generateMuteToast(message: Message): MessageEmbed {
  return createToast({
    title: `Todo tiene un límite, @${message.member.user.username}`,
    severity: "error",
    target: message.member.user,
    description: [
      "Por favor, ponte de acuerdo y no envíes un mismo mensaje a varios canales.",
      "\n\n",
      "Hacerlo es confuso para la gente que te está intentando echar una mano,",
      "¿no crees? Por favor, manten la conversación donde la empezaste o",
      "elimina antes el viejo hilo si quieres empezar aquí.",
      "\n\n",
      "Este es el **tercer aviso** que se te da, tu cuenta recibirá mute.",
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

function isRecentlySaid(message: Message): boolean {
  const member = new Member(message.member);
  const history: AntifloodHistory = member.tagbag.tag("antiflood:history2").get({});
  const normalized = normalize(message.cleanContent);
  if (normalized in history) {
    const when = history[normalized].expires;
    const where = history[normalized].channel;
    return Date.now() - when < 3600_000 && where != message.channelId;
  }
  return false;
}

async function handleFlood(member: Member, message: Message): Promise<ModEvent> {
  const alertCounter = await raisePing(member);
  if (alertCounter === 1) {
    const toast = generateFirstToast(message);
    await message.channel.send({ embeds: [toast] });
    return modEventBuilder(message, "DELETE", "Mensaje duplicado");
  } else if (alertCounter === 2) {
    const toast = generateRepeatingToast(message);
    await message.channel.send({ embeds: [toast] });
    return modEventBuilder(message, "DELETE", "Mensaje duplicado");
  } else if (alertCounter >= 3) {
    const toast = generateMuteToast(message);
    await message.channel.send({ embeds: [toast] });
    return modEventBuilder(message, "MUTE", "Mensaje duplicado demasiadas veces");
  }
}

function isExceptionable(member: Member, message: Message): boolean {
  return message.author.bot || member.moderator || words(message.cleanContent).length <= 3;
}

async function trackMessageInHistory(message: Message): Promise<void> {
  const member = new Member(message.member);
  const tag = member.tagbag.tag("antiflood:history2");
  const history = tag.get({});
  const normalized = normalize(message.cleanContent);
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

export default class AntifloodService implements Hook {
  name = "antiflood";

  async onMessageDestroy(message: PartialMessage): Promise<void> {
    if (!message.member || !message.member.guild) {
      /* Webhooks will trigger this. */
      return;
    }
    const member = new Member(message.member);

    /* Do not delete messages from history if they tripped antispam. */
    if (member.tagbag.tag("antiflood:floods").get([]).indexOf(message.id) === -1) {
      const normalized = normalize(message.cleanContent);

      /* Forget about the message. */
      const tag = member.tagbag.tag("antiflood:history2");
      const history: AntifloodHistory = tag.get({});
      delete history[normalized];
      await tag.set(cleanHistory(history));
    }
  }

  async onPremoderateMessage(message: Message): Promise<ModEvent | null> {
    const member = new Member(message.member);
    const tripsFlood = isRecentlySaid(message);
    trackMessageInHistory(message);
    if (tripsFlood && !isExceptionable(member, message)) {
      await rememberFloodedMessage(message);
      return handleFlood(member, message);
    }
    return null;
  }
}

async function rememberFloodedMessage(message: Message): Promise<void> {
  const member = new Member(message.member);
  const tag = member.tagbag.tag("antiflood:floods");
  await tag.set([...tag.get([]), message.id]);
}
