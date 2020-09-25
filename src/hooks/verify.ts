import { Message } from "discord.js";

import Hook from "./hook";
import Makibot from "../Makibot";
import Server from "../lib/server";
import { VerifyModlogEvent } from "../lib/modlog";
import Member from "../lib/member";

/* The message that will be replied to members that type the token during cooldown period. */
const TOO_SOON = [
  "%s, has dicho la palabra secreta correcta, pero para poder verificarte necesito",
  "que permanezcas unos minutos en el servidor antes de volver a intentar enviarla.",
  "(Esto también se avisa en las normas, ¿seguro que las has leído?)",
].join(" ");

/* The message that will be replied to members that successfully validate their accounts. */
const ACCEPTED = [
  "Gracias por verificar tu cuenta, %s. Ya puedes explorar el resto de canales del servidor.",
  "Recuerda que has confirmado que has leído las normas. No comportarse puede suponer una",
  "amonestación o una expulsión del servidor.",
].join(" ");

const MANUAL = [
  "Gracias por intentar verificar tu cuenta, %s. Desafortunadamente, la moderación de este",
  "servidor ha bloqueado la verificación automática en este momento, así que tendrás que",
  "esperar para recibir acceso manualmente. Disculpa las molestas.",
].join(" ");

/* Tests whether a message content is a valid verification token. */
function isVerificationMessage(message: Message): boolean {
  const clean: (string) => string = (t) => t.toLowerCase().trim().replace(/\s/g, "");
  return clean(process.env.VERIFY_TOKEN) === clean(message.cleanContent);
}

/* Escape the member name and submit a message to notify the user about the outcome. */
function sendOutcome(content: string, message: Message): Promise<Message> {
  const cleanContent = content.replace("%s", `<@${message.member.id}>`);
  return message.channel.send(cleanContent);
}

/**
 * The verify service allows a server to force users to validate themselves by
 * typing a token into a particular channel in order to have them a permission
 * applied.
 */
export default class VerifyService implements Hook {
  constructor(private client: Makibot) {
    client.on("message", (message) => this.handleMessage(message));
  }

  private async handleMessage(message: Message): Promise<void> {
    const server = new Server(message.guild);

    if (server.captchasChannel?.id == message.channel.id && isVerificationMessage(message)) {
      const member = new Member(message.member);
      if (member.cooldown) {
        /* Test if the bot can accept approves at this moment. */
        if (this.client.antiraid.raidMode) {
          await sendOutcome(MANUAL, message);
        } else {
        /* Send the message first, as setting the role may inhibit future events about the channel */
        await sendOutcome(ACCEPTED, message);
        await member.setVerification(true);
        await server.logModlogEvent(new VerifyModlogEvent(message.member));
        }
      } else {
        await sendOutcome(TOO_SOON, message);
      }
    }
  }
}
