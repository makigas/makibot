import { Message } from "discord.js";
import { Command, CommandoMessage } from "discord.js-commando";
import Makibot from "../../Makibot";
import { AutoRoleConfiguration } from "../../lib/autorole";

interface AddAutoRoleCommandArguments {
  message: string;
  emoji: string;
  role: string;
}

export default class AddAutoRoleCommand extends Command {
  constructor(client: Makibot) {
    super(client, {
      name: "addautorole",
      memberName: "addautorole",
      group: "admin",
      description: "Configure a new autorole relationship",
      ownerOnly: true,
      guildOnly: false,
      args: [
        { key: "message", type: "string", prompt: "Message snowflake", default: "" },
        { key: "emoji", type: "string", prompt: "Emoji to use", default: "" },
        { key: "role", type: "string", prompt: "Role snowflake", default: "" },
      ],
    });
  }

  async run(msg: CommandoMessage, args: AddAutoRoleCommandArguments): Promise<Message | Message[]> {
    /* Build AutoRole configuration objects. */
    const prevConf: AutoRoleConfiguration[] = this.client.provider.get(
      "global",
      "autorole:config",
      []
    );
    const newAutoRole: AutoRoleConfiguration = {
      messageId: args.message,
      reaction: args.emoji,
      roleId: args.role,
    };

    /* It is not possible to have two roles for the same messageId and reaction. */
    const cleanPrevConf = prevConf.filter(
      (conf) => conf.messageId != newAutoRole.messageId || conf.reaction != newAutoRole.reaction
    );

    /* Set the new configuration including the new role to assign. */
    const newConf = [...cleanPrevConf, newAutoRole];
    return this.client.provider.set("global", "autorole:config", newConf).then(() => {
      this.client.emit("makibot:restart", "autorole");
      return msg.reply("Ajustes guardados correctamente");
    });
  }
}
