import { logger } from "@sentry/utils";
import { Hook } from "../lib/hook";
import { applyAction } from "../lib/modlog/actions";
import { notifyModlog } from "../lib/modlog/notifications";
import { ModEvent, ModEventType } from "../lib/modlog/types";
import Makibot from "../Makibot";

function castRevertType(event: ModEvent): ModEventType {
  const types = {
    WARN: "UNWARN",
    MUTE: "UNMUTE",
    TIMEOUT: "UNTIMEOUT",
  };
  return types[event.type];
}

function revertEvent(event: ModEvent): ModEvent {
  return {
    createdAt: new Date(),
    expired: false,
    guild: event.guild,
    type: castRevertType(event),
    mod: event.mod,
    reason: "(expiración automática)",
    target: event.target,
    expiresAt: null,
  };
}

export default class ModService implements Hook {
  name = "moderation";

  constructor(private client: Makibot) {
    setInterval(() => this.cleanExpired(), 10000);
    this.cleanExpired();
  }

  async cleanExpired(): Promise<void> {
    const expired = await this.client.modrepo.retrieveExpired();
    expired.forEach(async (event) => {
      const reverseEvent = revertEvent(event);
      try {
        const persisted = await applyAction(this.client, reverseEvent);
        await notifyModlog(this.client, persisted);
      } catch (e) {
        logger.warn("[mod] cannot automatically clean event", e);
        this.client.modrepo.evict(event.id);
      }
    });
  }
}
