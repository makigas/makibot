import { Message } from "discord.js";
import { Hook } from "../lib/hook";
import Member from "../lib/member";
import { createToast } from "../lib/response";
import Server from "../lib/server";
import applyWarn from "../lib/warn";

/*
 * CSGO bots (and other well known scammers)
 */

const TOKENS = [
  // Different variations of steamcommunity.
  /steamcommmunlity.com/,
  /steamcconuunity.co/,
  /steamcomminutiu.ru/,
  /steamcomminytiy.ru/,
  /steamcommnuntiy.com/,
  /steamcommunityu.com/,
  /steamcommunlty.pro/,
  /steamcommuntry.ru/,
  /steamcommunytiu.com/,
  /steamcomnmuituy.com/,
  /steancommuniit.ru/,
  /steancomunnity.ru/,
  /stearmcommunitty.ru/,
  /stearmcommunity.ru/,
  /stearncommunytiy.ru/,
  /stearncormmunity.com/,
  /stearncormunsity.com/,
  /stermccommunitty.ru/,
  /stiemcommunitty.ru/,
  /steamcommrnunity.com/,
  /steamcommunity.link/,

  // There is this CSGO scam-bot
  /https:\/\/prnt.sc\//,
  /i will accept all trades/,
  /i'm tired of csgo/,

  // No one will give you nitro for free
  /dlscord.gifts/,
  /dlscord.help/,
  /dlscord.info/,
  /dlscord.ink/,
  /dlscord.pro/,
  /dlscord.nitro/,
  /discortnitosteam.online/,

  // Update
  /rust-way.com/,
  /twitch.rust-ltd.com/,
  /:\/\/discord-nitro./,
  /discorcl.link/,
  /discorcl.click/,
  /discordapp.click/,
  /discordapp.link/,

  // I don't have time for this shit
  /discorcl.[a-z]/,
  /dlscord.[a-z]/,
  /discordapp.[abd-z]/,

  // risky, but i think worth
  /get 3 months/,
  /get 1 month/,
  /3 months of discord nitro/,
  /.ru\//,
  /.ru.com\//,
];

export default class CsgoService implements Hook {
  name = "csgo";

  private async handleMatch(message: Message, member: Member): Promise<void> {
    /* Warn and mute the participant. */
    await applyWarn(message.guild, {
      duration: 86400 * 1000 * 7,
      user: message.author,
      reason: "Una cadena de texto prohibida por el sistema antispam ha sido interceptada",
      message,
    });
    await member.setMuted(true);

    /* Delete the original message with a tombstone. */
    const toast = createToast({
      title: "Mensaje interceptado como spam",
      description:
        "Se ha eliminado un mensaje que ha sido considerado como antispam por el sistema.",
      severity: "error",
      target: message.author,
    });
    await message.channel.send({ embeds: [toast] });
    await message.delete();
  }

  async onMessageCreate(message: Message): Promise<void> {
    if (message.guild) {
      const server = new Server(message.guild);
      const member = await server.member(message.author.id);
      if (message.author.bot || member.moderator) {
        return;
      }

      const content = message.cleanContent.toLowerCase();
      if (TOKENS.some((token) => token.test(content))) {
        /* We have a match! */
        return this.handleMatch(message, member);
      }
    }
  }
}
