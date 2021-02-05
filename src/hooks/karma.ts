import { Message } from "discord.js";
import { Hook } from "../lib/hook";
import { KarmaDatabase, openKarmaDatabase } from "../lib/karma/database";
import Makibot from "../Makibot";
import { getKarmaDatabase } from "../settings";

export default class KarmaService implements Hook {
  name = "karma";

  private karma: KarmaDatabase;

  constructor(bot: Makibot) {
    getKarmaDatabase()
      .then((dbFile) => {
        openKarmaDatabase(dbFile)
          .then((db) => {
            this.karma = db;
            bot.on("message", (msg) => this.onReceivedMessage(msg));
            bot.on("messageDelete", (msg) => this.onDeletedMessage(msg));
          })
          .catch((e) => {
            console.error(e);
          });
      })
      .catch((e) => {
        console.error(e);
      });
  }

  private async onReceivedMessage(message: Message): Promise<void> {
    const lastMinutePoints = await this.karma.count(message.author.id, {
      kind: "message",
      seconds: 60,
    });
    if (lastMinutePoints > 0) {
      return;
    }
    await this.karma.action({
      actorId: message.id,
      actorType: "Message",
      kind: "message",
      points: 1,
      target: message.author.id,
    });
  }

  private async onDeletedMessage(message: Message) {
    await this.karma.undoAction({ actorId: message.id, actorType: "Message" });
  }
}
