import { Message } from "discord.js";
import Server from "./server";
import { WastebinModlogEvent } from "./modlog";

export default function applyWastebin(message: Message): void {
  /* Delete the message. */
  message.delete();

  /* Log the deletion event. */
  const server = new Server(message.guild);
  if (server.modlogChannel) {
    server.modlogChannel
      .send(new WastebinModlogEvent(message).toDiscordEmbed())
      .catch((e) => console.error(`Cannot delete message: ${e}`));
  }
}
