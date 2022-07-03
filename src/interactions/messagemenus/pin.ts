import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { MessageContextMenuInteraction, CacheType, GuildChannel } from "discord.js";
import { MessageContextMenuInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";
import Makibot from "../../Makibot";

const privateChannelError = createToast({
  title: "No se puede enviar mensaje al corcho",
  description: "El canal en el que has usado este comando es privado",
  severity: "error",
});

const invalidChannelError = createToast({
  title: "No se puede enviar mensaje al corcho",
  description: "El canal en el que has usado este comando no es de tipo válido",
  severity: "error",
});

const noPinboardError = createToast({
  title: "No se puede enviar el mensaje al corcho",
  description: "Parece que el bot no está configurado en este servidor",
  severity: "error",
});

const alreadyPinnedError = createToast({
  title: "No se puede enviar el mensaje al corcho",
  description: "Este mensaje ya fue mandado al corcho en el pasado",
  severity: "error",
});

const pinboardSuccess = createToast({
  title: "Mensaje enviado al corcho",
  description: "El mensaje ahora está visible en el canal de corcho",
  severity: "success",
});

export default class PinMessageMenu implements MessageContextMenuInteractionHandler {
  name = "Enviar al corcho";

  build(): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder().setName("Enviar al corcho").setType(3);
  }

  async handleGuild(event: MessageContextMenuInteraction<CacheType>): Promise<void> {
    const server = new Server(event.guild);
    const makibot = event.client as Makibot;
    const channel = event.channel;
    const message = await channel.messages.fetch(event.targetMessage.id);

    if (channel.type === "GUILD_TEXT" || channel.type === "GUILD_PUBLIC_THREAD") {
      const guildChannel = message.channel as GuildChannel;
      const permissions = await channel.permissionsFor(guildChannel.guild.roles.everyone);
      if (!permissions.has("VIEW_CHANNEL")) {
        return event.reply({
          embeds: [privateChannelError],
          ephemeral: true,
        });
      } else {
        const pinTag = server.tagbag.tag(`pin:${message.id}`);
        const pinnedMessageId = await pinTag.get(null);
        if (pinnedMessageId) {
          return event.reply({
            embeds: [alreadyPinnedError],
            ephemeral: true,
          });
        } else {
          const result = await server.sendToPinboard(message);
          if (result) {
            // Mark the original message to prevent sending it again.
            await pinTag.set(result);

            // Award karma to the original author.
            makibot.karma.action({
              actorId: message.id,
              actorType: "Message",
              kind: "star",
              points: 3,
              originatorId: result,
              target: message.author.id,
            });

            return event.reply({
              embeds: [pinboardSuccess],
              ephemeral: true,
            });
          } else {
            return event.reply({
              embeds: [noPinboardError],
              ephemeral: true,
            });
          }
        }
      }
    } else {
      return event.reply({
        embeds: [invalidChannelError],
        ephemeral: true,
      });
    }
  }
}
