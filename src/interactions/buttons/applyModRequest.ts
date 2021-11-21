import { ButtonInteraction, MessageActionRow, MessageButton, TextBasedChannels } from "discord.js";
import { ButtonInteractionHandler } from "../../lib/interaction";
import { getReportReason, ModReport } from "../../lib/modlog/report";
import Server from "../../lib/server";
import applyWarn from "../../lib/warn";
import { userMention } from "@discordjs/builders";
import { createToast } from "../../lib/response";

export default class CancelModRequest implements ButtonInteractionHandler {
  name = "applyModRequest";

  async handle(event: ButtonInteraction): Promise<void> {
    const server = new Server(event.guild);
    const tag = server.tagbag.tag("modrequest:" + event.message.interaction.id);
    const data: ModReport = tag.get();

    const member = await server.member(data.message.author.id);
    const channel = await event.guild.channels.fetch(data.report.channel);
    const message = await (channel as TextBasedChannels).messages.fetch(data.message.id);

    if (data.interaction.action[0] === "remind") {
      const reason = getReportReason(data.interaction.reason[0]);
      await event.update({
        content: "Se ha enviado una notificación pública. ¡Hemos terminado!",
        components: [],
      });
      await event.followUp({
        content: [
          `Hola ${userMention(member.id)}, me han pedido que te recuerde amistosamente`,
          "que las normas de este servidor están para cumplirlas. Si te continúas",
          "comportando de forma inapropiada, podrían echarte de este servidor.",
        ].join(" "),
        embeds: [
          createToast({
            title: reason,
            severity: "warning",
          }),
        ],
        ephemeral: false,
      });
      return;
    }
    if (data.interaction.action[0] === "kick") {
      await member.kick();
    } else if (data.interaction.action[0] === "ban") {
      await member.ban();
    } else if (data.interaction.action[0].startsWith("warn.")) {
      let duration;
      if (data.interaction.action[0] === "warn.week") {
        duration = 86400 * 1000 * 7;
      } else if (data.interaction.action[0] === "warn.day") {
        duration = 86400 * 1000;
      } else if (data.interaction.action[0] === "warn.hour") {
        duration = 3600 * 1000;
      }
      await applyWarn(event.guild, {
        user: member.user,
        duration,
        message,
        reason: getReportReason(data.interaction.reason[0]),
      });
    }

    await event.update({
      content: "Acción manejada correctamente.",
      components: [
        new MessageActionRow({
          components: [
            new MessageButton({
              customId: "deleteMessageModRequest",
              label: "Eliminar mensaje",
              style: "DANGER",
            }),
            new MessageButton({
              customId: "keepMessageModRequest",
              label: "Conservar mensaje",
              style: "SECONDARY",
            }),
          ],
        }),
      ],
    });
  }
}
