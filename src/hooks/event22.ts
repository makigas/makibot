import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import { Presence, WebhookClient } from "discord.js";
import Member from "../lib/member";
import logger from "../lib/logger";

function validPresence(pre: Presence): boolean {
  return pre && pre.activities && Array.isArray(pre.activities);
}

export default class Event22Service implements Hook {
  name = "event22";

  private activity: string | null;

  private webhook: string | null;

  private enabled: boolean;

  constructor(client: Makibot) {
    this.activity = process.env.EVENT_22_ACTIVITY;
    this.webhook = process.env.EVENT_22_WEBHOOK;
    this.enabled = !!process.env.EVENT_22_ENABLED;
    if (this.activity && this.webhook) {
      logger.info("[event22] catching presence updates");
      client.on("presenceUpdate", this.presenceUpdate.bind(this));
    } else {
      logger.info("[event22] missing configuration criteria");
    }
  }

  private async presenceUpdate(oldPre: Presence, newPre: Presence): Promise<void> {
    if (!validPresence(oldPre) || !validPresence(newPre)) {
      // Invalid presence object, specially after bot restarts
      return;
    }

    const oldAct = oldPre.activities.map((a) => a.name);
    const newAct = newPre.activities.map((a) => a.name);

    const isMatchingBefore = oldAct.find((a) => a === this.activity);
    const isMatchingNow = newAct.find((a) => a === this.activity);
    if (!isMatchingBefore && isMatchingNow) {
      const member = new Member(newPre.member);
      const tag = member.tagbag.tag("event:20221228");
      const triggered = await tag.get(false);
      if (!triggered) {
        if (Math.random() < 0.25) {
          await tag.set(this.enabled);
          const client = new WebhookClient({ url: this.webhook });
          client.send(`\`${newPre.user.tag}\` ha abierto ${this.activity} 👀.`);
        } else {
          logger.info(`[event22] ${newPre.user.tag} uses it, but math does not match`);
        }
      } else {
        logger.info(`[event22] ${newPre.user.tag} uses it again`);
      }
    } else if (isMatchingBefore && !isMatchingNow) {
      logger.info(`[event22] ${newPre.user.tag} closes it`);
    }
  }
}
