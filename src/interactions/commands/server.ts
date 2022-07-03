import { channelMention, SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
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
        cmd.setName("view-settings").setDescription("View current server settings")
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
                { name: "Pinboard", value: "webhook:pinboard" }
              )
              .setRequired(true)
          )
          .addStringOption((o) =>
            o.setName("url").setDescription("The URL to assign").setRequired(false)
          )
      )
      .addSubcommandGroup((cmd) =>
        cmd
          .setName("thread-channels")
          .setDescription("Channels where communication happens in a thread")
          .addSubcommand((cmd) =>
            cmd.setName("list").setDescription("View current thread channels")
          )
          .addSubcommand((cmd) =>
            cmd
              .setName("add")
              .setDescription("Add a thread channel")
              .addChannelOption((o) =>
                o
                  .setName("channel")
                  .setDescription("The channel to add to the list")
                  .setRequired(true)
              )
          )
          .addSubcommand((cmd) =>
            cmd
              .setName("remove")
              .setDescription("Remove a thread channel")
              .addChannelOption((o) =>
                o
                  .setName("channel")
                  .setDescription("The channel to remove from the list")
                  .setRequired(true)
              )
          )
      )
      .addSubcommandGroup((cmd) =>
        cmd
          .setName("link-channels")
          .setDescription("Channels where communication happens in a thread")
          .addSubcommand((cmd) =>
            cmd.setName("list").setDescription("View current thread channels")
          )
          .addSubcommand((cmd) =>
            cmd
              .setName("add")
              .setDescription("Add a thread channel")
              .addChannelOption((o) =>
                o
                  .setName("channel")
                  .setDescription("The channel to add to the list")
                  .setRequired(true)
              )
          )
          .addSubcommand((cmd) =>
            cmd
              .setName("remove")
              .setDescription("Remove a thread channel")
              .addChannelOption((o) =>
                o
                  .setName("channel")
                  .setDescription("The channel to remove from the list")
                  .setRequired(true)
              )
          )
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

    const subcommandGroupName = command.options.getSubcommandGroup();
    switch (subcommandGroupName) {
      case "thread-channels":
        return this.manageThreadChannels(server, command);
      case "link-channels":
        return this.manageLinkChannels(server, command);
    }
  }

  private async getThreadChannels(server: Server): Promise<MessageEmbed> {
    const channels = (await server.getThreadChannels()).map((s) => channelMention(s));
    const toast = createToast({
      title: "Thread channels",
      description: channels.join("\n"),
      severity: "info",
    });
    return toast;
  }

  private async manageThreadChannels(server: Server, command: CommandInteraction): Promise<void> {
    const subcommand = command.options.getSubcommand();
    const channel = command.options.getChannel("channel", false);
    switch (subcommand) {
      case "list": {
        const toast = await this.getThreadChannels(server);
        return command.reply({
          embeds: [toast],
          ephemeral: true,
        });
      }
      case "add": {
        await server.addThreadChannel(channel.id);
        const toast = await this.getThreadChannels(server);
        return command.reply({
          embeds: [toast],
          ephemeral: true,
        });
      }
      case "remove": {
        await server.deleteThreadChannel(channel.id);
        const toast = await this.getThreadChannels(server);
        return command.reply({
          embeds: [toast],
          ephemeral: true,
        });
      }
    }
  }

  private async getLinkChannels(server: Server): Promise<MessageEmbed> {
    const channels = (await server.getLinkChannels()).map((s) => channelMention(s));
    const toast = createToast({
      title: "Link channels",
      description: channels.join("\n"),
      severity: "info",
    });
    return toast;
  }

  private async manageLinkChannels(server: Server, command: CommandInteraction): Promise<void> {
    const subcommand = command.options.getSubcommand();
    const channel = command.options.getChannel("channel", false);
    switch (subcommand) {
      case "list": {
        const toast = await this.getLinkChannels(server);
        return command.reply({
          embeds: [toast],
          ephemeral: true,
        });
      }
      case "add": {
        await server.addLinkChannel(channel.id);
        const toast = await this.getLinkChannels(server);
        return command.reply({
          embeds: [toast],
          ephemeral: true,
        });
      }
      case "remove": {
        await server.deleteLinkChannel(channel.id);
        const toast = await this.getLinkChannels(server);
        return command.reply({
          embeds: [toast],
          ephemeral: true,
        });
      }
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
      pinboard: await server.tagbag.tag("webhook:pinboard").get("(none)"),
    };

    const webhookToast = createToast({
      title: "Webhooks",
      description: [
        `**Webhooks settings**`,
        `**Default modlog**: ${webhooks.default}`,
        `**Sensible modlog**: ${webhooks.sensible}`,
        `**Delete modlog**: ${webhooks.delete}`,
        `**Public modlog**: ${webhooks.public}`,
        `**Pinboard**: ${webhooks.pinboard}`,
      ].join("\n"),
      severity: "info",
    });

    return command.reply({
      embeds: [webhookToast],
      ephemeral: true,
    });
  }
}
