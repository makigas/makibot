import { User, Message } from "discord.js";
import Commando from "discord.js-commando";

import Makibot from "../../Makibot";
import applyWarn from "../../lib/warn";
import Server from "../../lib/server";

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

  run(msg: Commando.CommandMessage, { reason, target }: WarnCommandArguments): Promise<Message[]> {
    const author = msg.member;
    const server = new Server(msg.guild);
    const modRole = server.modsRole;
    const authorIsMod = modRole.members.exists("id", author.id);
    const targetIsMod = modRole.members.exists("id", target.id);
    if (!authorIsMod || targetIsMod) {
      return Promise.resolve([]);
    }

    // The issuer of the command is authorized to warn this user.
    applyWarn(msg.guild, { user: target, reason: reason });

    return Promise.resolve([]);
  }
};
