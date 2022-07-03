import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";

export default class LockdownCommand implements CommandInteractionHandler {
  name = "lockdown";

  build() {
    return new SlashCommandBuilder()
      .setName("lockdown")
      .setDescription("Impide enviar mensajes al servidor o canal")
      .setDefaultPermission(false)
      .addSubcommand((i) => i.setName("server").setDescription("Bloquea todo el servidor"))
      .addSubcommand((i) => i.setName("channel").setDescription("Bloquea este canal"));
  }

  async handleGuild(event: CommandInteraction): Promise<void> {
    const server = new Server(event.guild);
    try {
      if (event.options.getSubcommand() === "server") {
        /* Lock the entire server. */
        await server.lockdown();
      } else if (event.options.getSubcommand() === "channel") {
        /* Lock this channel. */
        await server.lockdown(event.channelId);
      }
      return event.reply({
        embeds: [
          createToast({
            title: "Acción llevada a cabo correctamente",
            description: "He bloqueado el acceso",
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
