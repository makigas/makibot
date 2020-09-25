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

const NOTIFY = "(Se ha retenido el mensaje de %s porque se ha detectado un enlace de invitación.)";

export default class AntispamService implements Hook {
  private client: Makibot;

  constructor(client: Makibot) {
    this.client = client;

    this.client.on("message", (message) => this.message(message));
  }

  private async message(message: Message): Promise<void> {
    if (containsInvite(message) && !isAllowed(message)) {
      const server = new Server(message.guild);

      /* Send message to the modlog. */
      server
        .logModlogEvent(new WastebinModlogEvent(message))
        .catch((e) => console.error(`Error during wastebin handler: ${e}`));

      const channel = message.channel;
      if (server.captchasChannel?.id === channel.id) {
        /* On the captchas channel, the protocol is to automatically ban the member. */
        await message.delete();
        await message.member.ban({
          reason: "Spam",
        });
      } else {
        await message.delete();
        await channel.send(NOTIFY.replace("%s", `<@${message.member.id}>`));
      }
    }
  }
}
