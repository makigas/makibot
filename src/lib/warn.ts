import { Guild, Message, RichEmbedOptions, TextChannel, User } from "discord.js";
import Server from "./server";

/**
 * Information that describes why the warn is being issued. This information
 * may be logged into the private modlog for other mods to consume, and some
 * public information may be sent to the public modlog channel.
 */
export interface WarnPayload {
  /** The user that will receive the warn. */
  user: User;

  /** Optionally, the message that caused the warn to be applied. */
  message?: Message;

  /** The reason on why the warn was issued. */
  reason?: string;
}

const messages = [
  "si sigues comportándote así en este servidor, serás echado",
  "desde moderación encontramos inapropiada esa actitud",
  "¿te has leído las normas de este servidor? No lo tenemos claro",
  "en este servidor no se tolera ese tipo de comportamiento",
];

export default function applyWarn(guild: Guild, { user, message, reason }: WarnPayload) {
  // Get the member behind this user.
  const memberToWarn = guild.member(user);
  const server = new Server(guild);

  // Assert the command can work.
  if (!server.warnRole) {
    throw new ReferenceError("This server lacks a warn role");
  }

  // Warn the user.
  memberToWarn.addRole(server.warnRole);

  // Remove this user from the helpers role if they were.
  if (server.helperRole) {
    memberToWarn.removeRole(server.helperRole);
  }

  // Send a message to the public modlog.
  const embed: RichEmbedOptions = {
    title: `Se llamó la atención a ${memberToWarn.user.tag}`,
    color: 16545847,
    description: reason ? `**Razón**: ${reason}` : null,
    author: {
      name: memberToWarn.user.tag,
      icon_url: memberToWarn.user.avatarURL,
    },
    footer: {
      text: "Mensaje de moderación automático",
    },
  };

  const publicModlog = server.publicModlogChannel;
  if (publicModlog) {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const warnMessage = `<@${memberToWarn.id}>: ${randomMessage}`;
    publicModlog.send(warnMessage, { embed });
  }
}
