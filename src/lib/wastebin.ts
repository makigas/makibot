import { Message } from "discord.js";
import Server from "./server";
import { newWastebinModlogEvent } from "./modlog";

export default async function applyWastebin(message: Message): Promise<void> {
  /* Delete the message. */
  await message.delete();

  /* Log the deletion event. */
  try {
    const server = new Server(message.guild);
    await server.logModlogEvent(newWastebinModlogEvent(message), "modlog");
  } catch (e) {
    console.error(`Error during wastebin handler: ${e}`);
  }
}
