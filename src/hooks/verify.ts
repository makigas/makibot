import { GuildMember, Message } from "discord.js";

import Hook from "./hook";
import Makibot from "../Makibot";
import Server from "../lib/server";
import { VerifyModlogEvent } from "../lib/modlog";

const TOO_SOON =
  "%s, te he entendido, pero tienes que esperar un par de minutos para poder ser aprobado.";

const COOLDOWN_MINUTES = 5;

function requiresCooldown(member: GuildMember): boolean {
  const minutesSinceJoined = Date.now() - member.joinedAt.getTime();
  return minutesSinceJoined < 60 * 1000 * COOLDOWN_MINUTES;
}

/**
 * The verify service allows a server to force users to validate themselves by
 * typing a token into a particular channel in order to have them a permission
 * applied.
 */
export default class VerifyService implements Hook {
  private static ACCEPTED: string = [
    "Enhorabuena, has verificado tu cuenta en este servidor. Ahora puedes ver",
    "el resto de canales. Recuerda que al haber firmado el código de conducta,",
    "entiendes que publicar mensajes que lo incumplan puede acarrear un warn,",
    "un kick o un ban.",
  ].join(" ");

  private token: string;

  constructor(client: Makibot) {
    this.token = process.env.VERIFY_TOKEN;
    client.on("message", (message) => this.handleMessage(message));
  }

  private handleMessage(message: Message): void {
    if (!this.isVerificationMessage(message)) {
      /* Not a message to validate the account. Bail out. */
      return;
    }

    const server = new Server(message.guild);
    const channel = server.captchasChannel;
    if (!channel) {
      throw new ReferenceError(`Captchas text channel not found in guild ${message.guild.name}!`);
    }
    if (message.channel.id != channel.id) {
      /* Not a message sent to the verification channel. Bail out. */
      return;
    }

    const role = server.verifiedRole;
    if (!role) {
      throw new ReferenceError(`Verification role not found in guild ${message.guild.name}!`);
    }

    if (requiresCooldown(message.member)) {
      const messageBody = TOO_SOON.replace("%s", `<@${message.member.id}>`);
      message.channel.send(messageBody);
      return;
    }

    message.member
      .addRole(role)
      .then((member) => member.send(VerifyService.ACCEPTED))
      .catch((e) => console.error(e));

    /* Log the verify attempt. */
    if (server.modlogChannel) {
      server.modlogChannel
        .send(new VerifyModlogEvent(message.member).toDiscordEmbed())
        .catch((e) => console.error(`Error: ${e}`));
    }
  }

  /** Returns true if the given message is a validation message. */
  private isVerificationMessage(message: Message): boolean {
    const cleanToken = this.token.toLowerCase().trim();
    const inputToken = message.content.toLowerCase().trim();
    return cleanToken === inputToken;
  }
}
