import { Message, User } from "discord.js";
import { Command, CommandMessage } from "discord.js-commando";

import Makibot from "../../Makibot";
import applyWarn from "../../lib/warn";
import Server from "../../lib/server";
import Member from "../../lib/member";

interface WarnCommandArguments {
  target: User;
  reason: string;
}

export = class WarnCommand extends Command {
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

  run(msg: CommandMessage, { reason, target }: WarnCommandArguments): Promise<Message | Message[]> {
    const author = new Member(msg.member);
    const server = new Server(msg.guild);

    if (!author.moderator) {
      return Promise.resolve([]);
    }
    if (!target) {
      return msg.reply("Usage: !warn <member> [reason]");
    }
    if (server.member(target)?.moderator) {
      return Promise.resolve([]);
    }

    // The issuer of the command is authorized to warn this user.
    applyWarn(msg.guild, { user: target, reason: reason });

    return Promise.resolve([]);
  }
};
