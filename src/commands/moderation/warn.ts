import { User, RichEmbedOptions, GuildMember, GuildChannel, TextChannel } from "discord.js";
import Commando from "discord.js-commando";

import Makibot from "../../Makibot";
import applyWarn from "../../lib/warn";

interface WarnCommandArguments {
  target: User;
  reason: string;
}

export = class WarnCommand extends Commando.Command {
  constructor(client: Makibot) {
    super(client, {
      name: "warn",
      group: "moderation",
      memberName: "warn",
      description: "Permite aplicar warnings",
      examples: ["warn @johndoe", "warn @johndoe spam"],
      args: [
        {
          key: "target",
          type: "user",
          prompt: "Target a quien aplicar el warn",
          default: "",
        },
        {
          key: "reason",
          type: "string",
          prompt: "¿Alguna razón concreta?",
          default: "",
        },
      ],
    });
  }

  private isMod(user: GuildMember): boolean {
    const modsRoleName = process.env.MODS_ROLE || "mods";
    return user.roles.exists("name", modsRoleName);
  }

  run(msg: Commando.CommandMessage, args: WarnCommandArguments) {
    if (!this.isMod(msg.member)) {
      return Promise.resolve([]);
    }

    // The issuer of the command is authorized to warn this user.
    applyWarn(msg.guild, { user: args.target, reason: args.reason });

    return Promise.resolve([]);
  }
};
