import { Message } from "discord.js";
import Server from "./server";
import { WastebinModlogEvent } from "./modlog";

export default function applyWastebin(message: Message): void {
  /* Delete the message. */
  message.delete();

  /* Log the deletion event. */
  const server = new Server(message.guild);
  server
    .logModlogEvent(new WastebinModlogEvent(message))
    .catch((e) => console.error(`Error during wastebin handler: ${e}`));
}
