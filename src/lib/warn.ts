import { Guild, Message, MessageEmbedOptions, User } from "discord.js";
import Server from "./server";
import { WarnModlogEvent } from "./modlog";
import Member from "./member";

const WARN_DURATION = 86400 * 1000 * 7;

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

function notifyModlog(
  server: Server,
  member: Member,
  textMessage: string,
  title: string,
  reason: string = null
) {
  const publicModlog = server.publicModlogChannel;
  if (publicModlog) {
    const embed: MessageEmbedOptions = {
      title: title,
      color: 16545847,
      description: reason ? `**Razón**: ${reason}` : null,
      author: {
        name: member.usertag,
        iconURL: member.avatar,
      },
      footer: {
        text: "Mensaje de moderación automático",
      },
    };
    publicModlog.send({ content: textMessage, embeds: [embed] });
  }
}

export function notifyPublicModlog(
  server: Server,
  member: Member,
  textMessage: string,
  reason: string
) {
  notifyModlog(server, member, textMessage, `Se llamó la atención a ${member.usertag}`, reason);
}

export function notifyWarnExpiration(server: Server, member: Member) {
  const message = `La llamada de atención de <@${member.id}> ha expirado`;
  const embedTitle = `La llamada de atención de ${member.usertag} ha expirado`;
  notifyModlog(server, member, message, embedTitle);
}

export async function removeWarn(server: Server, member: Member): Promise<void> {
  const warnList = server.tagbag.tag("warns");
  const activeWarns = warnList.get({});
  if (activeWarns[member.id]) {
    delete activeWarns[member.id];
    warnList.set(activeWarns);
  }

  await member.setWarned(false);
  await notifyWarnExpiration(server, member);
}

export default async function applyWarn(
  guild: Guild,
  { user, message, reason }: WarnPayload
): Promise<void> {
  // Get the member behind this user.
  const memberToWarn = await guild.members.fetch(user);
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

  // Store the expiration date for this warn in the server tag.
  const warnList = server.tagbag.tag("warns");
  const activeWarns = warnList.get({});
  activeWarns[user.id] = Date.now() + WARN_DURATION;
  warnList.set(activeWarns);
  setTimeout(async () => removeWarn(server, member), WARN_DURATION);

  // Send a message to the public modlog.
  const warnMessage = PROMPT_MESSAGE.replace("%s", `<@${memberToWarn.id}>`);
  notifyPublicModlog(server, member, warnMessage, null);

  server
    .logModlogEvent(new WarnModlogEvent(memberToWarn, reason, message))
    .catch((e) => console.error(`Error during warn: ${e}`));
}
