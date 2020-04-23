import { Guild, Message, RichEmbedOptions, TextChannel, User } from "discord.js";

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

  // Warn this user.
  const warnRoleName = process.env.WARN_ROLE || "warn";
  const warnRole = guild.roles.find("name", warnRoleName);
  memberToWarn.addRole(warnRole);

  // Remove this user from the helpers role if they were.
  const helperRoleName = process.env.HELPER_ROLE || "helpers";
  const helperRole = guild.roles.find("name", helperRoleName);
  memberToWarn.removeRole(helperRole);

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

  const modlogChannelName = process.env.PUBLIC_MODLOG_CHANNEL || "modlog";
  const modlogChannel = guild.channels.find("name", modlogChannelName);
  if (modlogChannel.type === "text") {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const message = `<@${memberToWarn.id}>: ${randomMessage}`;
    (<TextChannel>modlogChannel).send(message, { embed });
  }
}
