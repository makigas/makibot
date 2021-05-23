import { Guild, GuildMember, Message, MessageEmbedOptions, User } from "discord.js";
import Server from "./server";
import { WarnModlogEvent } from "./modlog";
import Member from "./member";

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

const PROMPT_MESSAGE = "Amonestación automática impuesta hacia %s.";

export function notifyPublicModlog(server: Server, member: GuildMember, textMessage: string, reason: string) {
  const publicModlog = server.publicModlogChannel;
  if (publicModlog) {
    const embed: MessageEmbedOptions = {
      title: `Se llamó la atención a ${member.user.tag}`,
      color: 16545847,
      description: reason ? `**Razón**: ${reason}` : null,
      author: {
        name: member.user.tag,
        iconURL: member.user.avatarURL(),
      },
      footer: {
        text: "Mensaje de moderación automático",
      },
    };
    publicModlog.send(textMessage, { embed });
  }
}

export default async function applyWarn(
  guild: Guild,
  { user, message, reason }: WarnPayload
): Promise<void> {
  // Get the member behind this user.
  const memberToWarn = guild.member(user);
  const server = new Server(guild);

  // Assert the command can work.
  if (!server.warnRole) {
    throw new ReferenceError("This server lacks a warn role");
  }

  // Warn the user and make it a regular member.
  const member = new Member(memberToWarn);
  await member.setWarned(true);
  if (member.helper) {
    member.setHelper(false);
  }

  // Send a message to the public modlog.
  const warnMessage = PROMPT_MESSAGE.replace("%s", `<@${memberToWarn.id}>`);
  notifyPublicModlog(server, memberToWarn, warnMessage, null);

  server
    .logModlogEvent(new WarnModlogEvent(memberToWarn, reason, message))
    .catch((e) => console.error(`Error during warn: ${e}`));
}