import { userMention, time } from "@discordjs/builders";
import { APIMessage } from "discord-api-types";
import { WebhookClient } from "discord.js";

import type Makibot from "../../Makibot";
import Server from "../server";
import type { ModEvent } from "./types";

const TEMPLATES = {
  WARN: ":warning: Se llamó la atención a $TARGET$. Razón: `$REASON$`. Expira: $EXP$",
  UNWARN: ":ballot_box_with_check: Ha expirado la llamada de atención a $TARGET$",
  MUTE: ":mute: Se ha silenciado a $TARGET$. Razón: `$REASON$`. Expira: $EXP$",
  UNMUTE: ":speaker: Ha expirado el silencio a $TARGET$",
  KICK: ":athletic_shoe: Se echó a $TARGET$ del servidor, Razón: `$REASON$`.",
  BAN: ":hammer: Se baneó a $TARGET$ del servidor. Razón: `$REASON$`.",
};

/**
 * Converts an event into the formatted string that should be sent to the modlog.
 * @param event the event to transform into a string to be used in modlogs.
 * @returns the string to be sent to the proper modlog channel
 */
function composeModlogMessage(event: ModEvent) {
  const target = userMention(event.target);
  const reason = event.reason || "(no se especificó razón)";
  const expiration = event.expiresAt ? time(event.expiresAt, "R") : "manualmente";
  const eventId = event.id ? ` - [#${event.id}]` : "";
  return (
    TEMPLATES[event.type]
      .replace("$TARGET$", target)
      .replace("$REASON$", reason)
      .replace("$EXP$", expiration) + eventId
  );
}

/**
 * If the guild in which the event is defined has a public modlog, this
 * function will send
 * @param client the client (to fetch the guilds and parameters)
 * @param event the event to submit to the public modlog
 */
export async function notifyPublicModlog(
  client: Makibot,
  event: ModEvent
): Promise<APIMessage | null> {
  const message = composeModlogMessage(event);
  const guild = await client.guilds.fetch(event.guild);
  const server = new Server(guild);
  const webhookURL = server.tagbag.tag("webhook:publicmod").get(null);
  console.log({ webhookURL });
  if (webhookURL) {
    const webhookClient = new WebhookClient({ url: webhookURL });
    return webhookClient.send({ content: message });
  } else {
    return null;
  }
}
