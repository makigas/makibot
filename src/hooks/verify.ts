import { Message } from "discord.js";

import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import Server from "../lib/server";
import { VerifyModlogEvent } from "../lib/modlog";
import Member from "../lib/member";
import logger from "../lib/logger";

/* The message that will be replied to members that type the token during cooldown period. */
const TOO_SOON = [
  "%s, es correcto, pero tal como dicen las normas no se puede validar tu cuenta hasta que lleves",
  "unos minutos, por seguridad.\n(Tiempo restante: %t segundos. Gracias por mantenerte a la espera.)",
].join(" ");

/* The message that will be replied to members that successfully validate their accounts. */
const ACCEPTED = "Gracias por verificar tu cuenta, %s. Ya puedes explorar el resto de canales del servidor.";

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
  const member = new Member(message.member);
  const cleanContent = content
    .replace("%s", `<@${member.id}>`)
    .replace("%t", `${Math.trunc(member.cooldownSeconds / 1000)}`);
  return message.channel.send(cleanContent);
}

/**
 * The verify service allows a server to force users to validate themselves by
 * typing a token into a particular channel in order to have them a permission
 * applied.
 */
export default class VerifyService implements Hook {
  name = "verify";

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
          logger.debug(`[verify] handling verification for ${message.member.user.tag}`);
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
