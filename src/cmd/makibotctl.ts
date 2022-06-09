import { REST } from "@discordjs/rest";
import { RESTGetAPIApplicationGuildCommandsResult, Routes } from "discord-api-types/v9";
import path from "path";
import * as yargs from "yargs";
import Client from "../lib/http/client";
import { CommandInteractionHandler, ContextMenuInteractionHandler } from "../lib/interaction";
import { requireAllModules } from "../lib/utils/loader";

const client = new Client();

const makibotctl = yargs;

makibotctl.command(
  "healthcheck",
  "check the status of the bot",
  () => ({}),
  () => {
    client
      .healthcheck()
      .then((outcome) => {
        if (outcome) {
          console.log("The bot is alive");
          process.exit(0);
        } else {
          console.log("The bot is not healthy");
          process.exit(1);
        }
      })
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
  }
);

makibotctl.command<{ app: string; local?: string }>(
  "deploy-commands <app> [local]",
  "deploy global commands for this application",
  () => ({}),
  (argv) => {
    if (!process.env.BOT_TOKEN) {
      console.error("Please, provide the bot token in the BOT_TOKEN env variable");
      process.exit(1);
    }

    /* Compose the payloads for commands and menus. */
    const commandsDir = path.join(__dirname, "../interactions/commands");
    const menusDir = path.join(__dirname, "../interactions/menus");

    const commandPayloads = requireAllModules(commandsDir).map((HandlerClass) => {
      if (typeof HandlerClass == "function") {
        const handler = new (HandlerClass as {
          new (): CommandInteractionHandler;
        })();
        return handler.build().toJSON();
      }
    });
    const menuPayloads = requireAllModules(menusDir).map((HandlerClass) => {
      if (typeof HandlerClass == "function") {
        const handler = new (HandlerClass as {
          new (): ContextMenuInteractionHandler;
        })();
        return handler.build().toJSON();
      }
    });
    const payloads = [...commandPayloads, ...menuPayloads];

    /* Send the payloads. */
    const restClient = new REST({ version: "9" });
    restClient.setToken(process.env.BOT_TOKEN);
    if (argv.local) {
      restClient
        .put(Routes.applicationGuildCommands(argv.app, argv.local), { body: payloads })
        .then(() => {
          console.log("Done");
          process.exit(0);
        })
        .catch(() => {
          process.exit(1);
        });
    } else {
      restClient
        .put(Routes.applicationCommands(argv.app), { body: payloads })
        .then(() => {
          console.log("Done");
          process.exit(0);
        })
        .catch(() => {
          process.exit(1);
        });
    }
  }
);

makibotctl.command<{ app: string; local: string }>(
  "clean-local-commands <app> <local>",
  "Remove deployed commands for a local guild",
  () => ({}),
  async (argv) => {
    const restClient = new REST({ version: "9" });
    restClient.setToken(process.env.BOT_TOKEN);

    /* Fetch the commands. */
    restClient
      .get(Routes.applicationGuildCommands(argv.app, argv.local))
      .then(async (commands: RESTGetAPIApplicationGuildCommandsResult) => {
        for (const command of commands) {
          console.log(`Deleting local command ${command.name}`);
          await restClient.delete(Routes.applicationGuildCommand(argv.app, argv.local, command.id));
        }
      });
  }
);

makibotctl.command(
  "guilds",
  "list all the guilds the bot is in",
  () => ({}),
  async () => {
    const guilds = await client.guilds();
    guilds.forEach((guild) => console.log(`${guild.id} | ${guild.name}`));
    process.exit(0);
  }
);

makibotctl.command<{ guild: string }>(
  "get-config <guild>",
  "get the config for a guild",
  () => ({}),
  async (argv) => {
    client
      .guildSettings(argv.guild)
      .then((settings) => {
        console.log(settings);
        process.exit(0);
      })
      .catch((err) => {
        console.error(`Error: ${err}`);
        process.exit(1);
      });
  }
);

makibotctl.command<{ guild: string; key: string }>(
  "get-tag <guild> <key>",
  "get a preference from the setting provider",
  () => ({}),
  async (argv) => {
    client
      .getProviderSetting(argv.guild, argv.key)
      .then((value) => {
        console.log(value);
        process.exit(0);
      })
      .catch((e) => {
        console.error("Error: " + e);
        process.exit(1);
      });
  }
);

makibotctl.command<{ guild: string; key: string; value: string }>(
  "put-tag <guild> <key> <value>",
  "update or set a preference from the setting provider",
  () => ({}),
  async (argv) => {
    client
      .setProviderSetting(argv.guild, argv.key, argv.value)
      .then(() => {
        console.log("OK");
        process.exit(0);
      })
      .catch((e) => {
        console.error("Error: " + e);
        process.exit(1);
      });
  }
);

makibotctl.command<{ guild: string; key: string }>(
  "delete-tag <guild> <key>",
  "delete a preference from the setting provider",
  () => ({}),
  async (argv) => {
    client
      .deleteProviderSetting(argv.guild, argv.key)
      .then(() => {
        console.log("OK");
        process.exit(0);
      })
      .catch((e) => {
        console.error("Error: " + e);
        process.exit(1);
      });
  }
);

makibotctl.command<{ guild: string; key: string; value: string }>(
  "set-config <guild> <key> <value>",
  "update the configuration for a specific guild",
  () => ({}),
  async (argv) => {
    client
      .setSetting(argv.guild, argv.key, argv.value)
      .then(() => {
        process.exit(0);
      })
      .catch((err) => {
        console.error(`Error: ${err}`);
        process.exit(1);
      });
  }
);

makibotctl.command<{ guild: string; member: string }>(
  "get-karma <guild> <member>",
  "get the karma information for a specific member",
  () => ({}),
  async (argv) => {
    try {
      const karma = await client.getKarma(argv.guild, argv.member);
      console.log("Points: " + karma.points);
      console.log("Offset: " + karma.offset);
      console.log("Level: " + karma.level);
      process.exit(0);
    } catch (e) {
      console.error(`Error: ${e}`);
      process.exit(1);
    }
  }
);

makibotctl.command<{ guild: string; member: string; offset: number }>(
  "set-karma-offset <guild> <member> <offset>",
  "tune the karma offset for a specific user and update levels",
  () => ({}),
  async (argv) => {
    try {
      const karma = await client.setKarmaOffset(argv.guild, argv.member, argv.offset);
      console.log("Points: " + karma.points);
      console.log("Offset: " + karma.offset);
      console.log("Level: " + karma.level);
      process.exit(0);
    } catch (e) {
      console.error(`Error: ${e}`);
      process.exit(1);
    }
  }
);

makibotctl.command<{ guild: string; operation: "add" | "delete" | "list"; value?: string }>(
  "trusted-roles <guild> <operation> [value]",
  "manage trusted roles",
  () => ({}),
  async (argv) => {
    switch (argv.operation) {
      case "list": {
        const channels = await client.listTrustedRoles(argv.guild);
        channels.forEach((channel) => console.log(channel));
        break;
      }
      case "add": {
        await client.addTrustedRole(argv.guild, argv.value);
        break;
      }
      case "delete": {
        await client.deleteTrustedRole(argv.guild, argv.value);
        break;
      }
    }
  }
);

makibotctl.command<{ guild: string; operation: "add" | "delete" | "list"; value?: string }>(
  "thread-channels <guild> <operation> [value]",
  "manage thread only channels",
  () => ({}),
  async (argv) => {
    switch (argv.operation) {
      case "list": {
        const channels = await client.listThreadChannels(argv.guild);
        channels.forEach((channel) => console.log(channel));
        break;
      }
      case "add": {
        await client.addThreadChannel(argv.guild, argv.value);
        break;
      }
      case "delete": {
        await client.deleteThreadChannel(argv.guild, argv.value);
        break;
      }
    }
  }
);

makibotctl.command<{ guild: string; operation: "add" | "delete" | "list"; value?: string }>(
  "link-channels <guild> <operation> [value]",
  "manage link only channels",
  () => ({}),
  async (argv) => {
    switch (argv.operation) {
      case "list": {
        const channels = await client.listLinkChannels(argv.guild);
        channels.forEach((channel) => console.log(channel));
        break;
      }
      case "add": {
        await client.addLinkChannel(argv.guild, argv.value);
        break;
      }
      case "delete": {
        await client.deleteLinkChannel(argv.guild, argv.value);
        break;
      }
    }
  }
);

makibotctl.help().argv;
