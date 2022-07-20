import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { SlashCommandBuilder } from "@discordjs/builders";
import { createToast } from "../../lib/response";

export default class BitrateCommand implements CommandInteractionHandler {
  name = "bitrate";

  build() {
    return new SlashCommandBuilder()
      .setName("bitrate")
      .setDescription("Ajusta el bitrate del canal de voz en el que te encuentras actualmente")
      .addSubcommand((i) => i.setName("status").setDescription("Comprueba el bitrate actual"))
      .addSubcommand((i) => i.setName("low").setDescription("Establece el bitrate a 16 kbps"))
      .addSubcommand((i) => i.setName("medium").setDescription("Establece el bitrate a 32 kbps"))
      .addSubcommand((i) => i.setName("high").setDescription("Establece el bitrate a 64 kbps"))
      .addSubcommand((i) => i.setName("ultra").setDescription("Establece el bitrate a 128 kbps"));
  }

  async handleGuild(event: CommandInteraction): Promise<void> {
    const userID = event.member.user.id;
    const member = await event.guild.members.fetch(userID);
    const channel = member.voice.channel;
    // it might actually be a stage channel, which doesn't support variable bitrate
    if (!channel || channel.type !== "GUILD_VOICE") {
      return event.reply({
        embeds: [
          createToast({
            title: "No estás en un chat de voz",
            description: "Para usar este comando debes estar en un chat de voz",
            severity: "error",
          }),
        ],
        ephemeral: true,
      });
    }
    try {
      if (event.options.getSubcommand() === "low") {
        await channel.setBitrate(16000);
      } else if (event.options.getSubcommand() === "medium") {
        await channel.setBitrate(32000);
      } else if (event.options.getSubcommand() === "high") {
        await channel.setBitrate(64000);
      } else if (event.options.getSubcommand() === "ultra") {
        await channel.setBitrate(128000); // he forced me
      }
      return event.reply({
        embeds: [
          createToast({
            title: "Bitrate",
            description: `El bitrate actual es ${channel.bitrate / 1000} kbps en ${channel.name}`,
            severity: "success",
          }),
        ],
      });
    } catch (e) {
      return event.reply({
        embeds: [
          createToast({
            title: "No he podido llevar a cabo la acción",
            description: e.toString(),
            severity: "error",
          }),
        ],
        ephemeral: true,
      });
    }
  }
}
