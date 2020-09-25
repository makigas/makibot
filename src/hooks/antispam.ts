import { Message } from "discord.js";
import Member from "../lib/member";
import { WastebinModlogEvent } from "../lib/modlog";
import Server from "../lib/server";
import Makibot from "../Makibot";
import Hook from "./hook";

function containsInvite(message: Message): boolean {
  const tokens = ["discord.gg/", "discordapp.com/invite/", "discord.com/invite"];
  return tokens.some((token) => message.content.includes(token));
}

function isAllowed(message: Message): boolean {
  const member = new Member(message.member);
  return member.moderator;
}

export default class AntispamService implements Hook {
  private client: Makibot;

  constructor(client: Makibot) {
    this.client = client;

    this.client.on("message", (message) => this.message(message));
  }

  private async message(message: Message): Promise<void> {
    if (containsInvite(message) && !isAllowed(message)) {
      /* Handle invite. */
      const member = message.member.id;
      const channel = message.channel;
      await message.delete();
      await channel.send(
        "Se ha retenido automáticamente el mensaje de %s porque se ha detectado un enlace de invitación.".replace(
          "%s",
          `<@${member}>`
        )
      );

      /* Send message to the modlog. */
      const server = new Server(message.guild);
      server
        .logModlogEvent(new WastebinModlogEvent(message))
        .catch((e) => console.error(`Error during wastebin handler: ${e}`));
    }
  }
}
