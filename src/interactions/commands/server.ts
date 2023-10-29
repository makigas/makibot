import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";

export default class ServerCommand implements CommandInteractionHandler {
  name = "server";

  build() {
    return new SlashCommandBuilder()
      .setName("server")
      .setDescription("Get or modify server settings")
      .setDefaultPermission(false)
      .addSubcommand((cmd) =>
        cmd.setName("view-settings").setDescription("View current server settings"),
      )
      .addSubcommand((cmd) =>
        cmd
          .setName("set-webhook")
          .setDescription("Set a specific webhook")
          .addStringOption((o) =>
            o
              .setName("type")
              .setDescription("The type of webhook to set")
              .addChoices(
                { name: "Default modlog", value: "webhook:defaultmod" },
                { name: "Sensible modlog", value: "webhook:sensiblemod" },
                { name: "Delete modlog", value: "webhook:deletemod" },
                { name: "Public modlog", value: "webhook:publicmod" },
              )
              .setRequired(true),
          )
          .addStringOption((o) =>
            o.setName("url").setDescription("The URL to assign").setRequired(false),
          ),
      );
  }

  handleGuild(command: CommandInteraction): Promise<void> {
    const server = new Server(command.guild);
    const subcommandName = command.options.getSubcommand();
    switch (subcommandName) {
      case "view-settings":
        return this.handleViewSettings(server, command);
      case "set-webhook":
        return this.setWebhook(server, command);
    }
  }

  private async setWebhook(server: Server, command: CommandInteraction): Promise<void> {
    const type = command.options.getString("type", true);
    const url = command.options.getString("url");

    const tag = server.tagbag.tag(type);
    if (url) {
      await tag.set(url);
    } else {
      await tag.delete();
    }
    const toast = createToast({
      title: "Webhook modified",
      severity: "info",
    });
    return command.reply({
      embeds: [toast],
      ephemeral: true,
    });
  }

  private async handleViewSettings(server: Server, command: CommandInteraction): Promise<void> {
    const webhooks = {
      default: await server.tagbag.tag("webhook:defaultmod").get("(none)"),
      sensible: await server.tagbag.tag("webhook:sensiblemod").get("(none)"),
      delete: await server.tagbag.tag("webhook:deletemod").get("(none)"),
      public: await server.tagbag.tag("webhook:publicmod").get("(none)"),
    };

    const webhookToast = createToast({
      title: "Webhooks",
      description: [
        `**Webhooks settings**`,
        `**Default modlog**: ${webhooks.default}`,
        `**Sensible modlog**: ${webhooks.sensible}`,
        `**Delete modlog**: ${webhooks.delete}`,
        `**Public modlog**: ${webhooks.public}`,
      ].join("\n"),
      severity: "info",
    });

    return command.reply({
      embeds: [webhookToast],
      ephemeral: true,
    });
  }
}
