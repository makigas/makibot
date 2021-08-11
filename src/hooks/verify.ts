import { Message } from "discord.js";

import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import Server from "../lib/server";
import { VerifyModlogEvent } from "../lib/modlog";
import Member from "../lib/member";
import logger from "../lib/logger";
import { createToast } from "../lib/response";

/* Tests whether a message content is a valid verification token. */
function isVerificationMessage(message: Message): boolean {
  const clean: (string) => string = (t) => t.toLowerCase().trim().replace(/\s/g, "");
  return clean(process.env.VERIFY_TOKEN) === clean(message.cleanContent);
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
          const toast = createToast({
            title: "La validación es manual en este momento",
            description: [
              `@${message.member.user.username}, has escrito la contraseña correcta, pero`,
              "parece que en este momento un administrador ha bloqueado temporalmente la",
              "aprobación automática de nuevas cuentas para darles acceso al servidor.",
              "\n\n",
              "Un administrador te tiene que dar acceso manualmente. Gracias por tu paciencia...",
            ].join(" "),
            severity: "warning",
            target: message.member.user,
          });
          await message.channel.send({ embeds: [toast] });
        } else {
          /* Send the message first, as setting the role may inhibit future events about the channel */
          logger.debug(`[verify] handling verification for ${message.member.user.tag}`);
          const toast = createToast({
            title: `Gracias por verificar tu cuenta, @${message.member.user.username}`,
            description: [
              "Gracias por rellenar el captcha y demostrar que te has leído las normas.",
              "Ya tienes acceso a la lista de canales, que puedes ver en la barra lateral.",
            ].join(" "),
            severity: "success",
            target: message.member.user,
          });
          await message.channel.send({ embeds: [toast] });
          await member.setVerification(true);
          await server.logModlogEvent(new VerifyModlogEvent(message.member));
        }
      } else {
        const toast = createToast({
          title: `Todavía no puedes verificar tu cuenta, @${message.member.user.username}`,
          description: [
            "Estás muy cerca. La palabra secreta es correcta, pero no puedo dejarte entrar",
            "tan deprisa al servidor. Tienes que permanecer unos minutos en la sala de espera",
            "antes de poder intentarlo.",
            "\n\n",
            `Tiempo de espera para poder validar: ${Math.trunc(
              member.cooldownSeconds / 1000
            )} segundos`,
          ].join(" "),
          severity: "warning",
          target: message.member.user,
        });
        await message.channel.send({ embeds: [toast] });
      }
    }
  }
}
