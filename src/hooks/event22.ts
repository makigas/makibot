import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import { GuildMember, Presence, WebhookClient } from "discord.js";
import Member from "../lib/member";
import logger from "../lib/logger";
import Server from "../lib/server";

function getActivities(member: GuildMember): string[] {
  return member.presence.activities.map((a) => a.name);
}

export default class Event22Service implements Hook {
  name = "event22";

  private activity: string | null;

  private webhook: string | null;

  constructor(client: Makibot) {
    this.activity = process.env.EVENT_22_ACTIVITY;
    this.webhook = process.env.EVENT_22_WEBHOOK;
    if (this.activity && this.webhook) {
      logger.debug("[event22] catching presence updates");
      client.on("presenceUpdate", this.presenceUpdate.bind(this));
    } else {
      logger.debug("[event22] missing configuration criteria");
    }
  }

  private async presenceUpdate(oldPre: Presence, newPre: Presence): Promise<void> {
    const oldAct = oldPre.activities.map((a) => a.name);
    const newAct = newPre.activities.map((a) => a.name);

    // Log the event, which will come handy for debug purposes at the moment.
    const name = newPre.user.tag;
    console.log({ name, oldAct, newAct });

    const playingLol = newAct.find((a) => a === this.activity);
    if (playingLol) {
      const member = new Member(newPre.member);
      const server = new Server(newPre.guild);
      const tag = member.tagbag.tag("event:20221228");
      const triggered = await tag.get(false);
      if (!triggered) {
        await tag.set(true);
        const client = new WebhookClient({ url: this.webhook });
        client.send(`\`${newPre.user.tag}\` ha abierto ${this.activity} 👀.`);
      } else {
        logger.debug(`[event22] ${newPre.user.tag} uses it again`);
      }
    }
  }
}
