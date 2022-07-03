import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";

export default class LockdownCommand implements CommandInteractionHandler {
  name = "lift";

  build() {
    return new SlashCommandBuilder()
      .setName("lift")
      .setDescription("Elimina un bloqueo previamente puesto servidor o canal")
      .setDefaultPermission(false)
      .addSubcommand((i) => i.setName("server").setDescription("Activa todo el servidor"))
      .addSubcommand((i) => i.setName("channel").setDescription("Activa este canal"));
  }

  async handleGuild(event: CommandInteraction): Promise<void> {
    const server = new Server(event.guild);
    try {
      if (event.options.getSubcommand() === "server") {
        /* Lock the entire server. */
        await server.liftLockdown();
      } else if (event.options.getSubcommand() === "channel") {
        /* Lock this channel. */
        await server.liftLockdown(event.channelId);
      }
      return event.reply({
        embeds: [
          createToast({
            title: "Acción llevada a cabo correctamente",
            description: "He desbloqueado el accesoor",
            severity: "success",
          }),
        ],
        ephemeral: true,
      });
    } catch (e) {
      return event.reply({
        embeds: [
          createToast({
            title: "No he podido llevar a cabo la acción",
            description: e,
            severity: "error",
          }),
        ],
        ephemeral: true,
      });
    }
  }
}
