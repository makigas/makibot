import { hyperlink, channelMention, userMention, time } from "@discordjs/builders";
import { Snowflake, Message, PartialMessage, TextBasedChannels, User } from "discord.js";

/**
 * Formats an user as: `@mention (handle#1234, 123412341234)`.
 * @param resolvable the user to format
 * @returns the formatted string representation of the user
 */
export function userIdentifier(resolvable: Snowflake | User): string {
  if (typeof resolvable === "string") {
    /* We have a snowflake. */
    return `${userMention(resolvable)} (${resolvable})`;
  } else {
    /* We have an user. */
    return `${userMention(resolvable.id)} (${resolvable.tag}, ${resolvable.id})`;
  }
}

/**
 * Formats a date using the API v9 formatters.
 * @param date the date to format
 * @returns the formatted string representation of the date
 */
export function dateIdentifier(date: Date): string {
  return `${time(date, "F")} (${time(date, "R")})`;
}

/**
 * Formats a message as a link to the message itself using the message identifier.
 * @param message the message to format
 * @returns the formatted string representation of the message
 */
export function messageIdentifier(message: Message | PartialMessage): string {
  return hyperlink(message.id, message.url);
}

/**
 * Formats a channel as a link to the channel itself using the message identifier.
 * @param channel the channel to link.
 * @returns the formatted string representation of the channel
 */
export function channelIdentifier(channel: TextBasedChannels): string {
  return channelMention(channel.id);
}
