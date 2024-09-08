import { Hook } from "../lib/hook";
import logger from "../lib/logger";
import { notifyModlog, ModEvent } from "../lib/modlog";
import Makibot from "../Makibot";

function revertEvent(event: ModEvent): ModEvent {
  return {
    createdAt: new Date(),
    expired: false,
    guild: event.guild,
    type: "UNTIMEOUT",
    mod: event.mod,
    reason: "(expiración automática)",
    target: event.target,
  };
}

/**
 * This service logs timeouts that expire naturally. Back in the days, this
 * service also dealt with other kinds of moderation events, but the modlog
 * feature of this bot is now passive, so this is all it does. The reason
 * why it marks it anyway is because Discord doesn't notify bots when
 * timeouts expire naturally, only they do if a mod forces the timeout to
 * expire, so we manually have to purge the database periodically.
 */
export default class TimeoutsService implements Hook {
  name = "timeouts";

  constructor(private client: Makibot) {
    setInterval(() => this.cleanExpired(), 10000);
    this.cleanExpired();
  }

  async cleanExpired(): Promise<void> {
    const expired = await this.client.modrepo.retrieveExpired();
    expired.forEach(async (event) => {
      const reverseEvent = revertEvent(event);
      try {
        if (event.id) {
          await this.client.modrepo.evict(event.id);
        }
        const persisted = await this.client.modrepo.persistEvent(reverseEvent);
        await notifyModlog(this.client, persisted);
      } catch (e) {
        logger.warn("[mod] cannot automatically clean event", e);
        if (event.id) {
          this.client.modrepo.evict(event.id);
        }
      }
    });
  }
}
