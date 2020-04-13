import { User, RichEmbedOptions, GuildMember, GuildChannel, TextChannel } from "discord.js";
import Commando from "discord.js-commando";

import Makibot from "../../Makibot";

interface WarnCommandArguments {
  target: User;
  reason: string;
}

const messages = [
  "si sigues comportándote así en este servidor, serás echado",
  "desde moderación encontramos inapropiada esa actitud",
  "¿te has leído las normas de este servidor? No lo tenemos claro",
  "en este servidor no se tolera ese tipo de comportamiento",
];

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

    // Get the member behind this user.
    const memberToWarn = msg.guild.member(args.target);

    // Warn this user.
    const warnRoleName = process.env.WARN_ROLE || "warn";
    const warnRole = msg.guild.roles.find("name", warnRoleName);
    memberToWarn.addRole(warnRole);

    // Remove this user from the helpers role if they were.
    const helperRoleName = process.env.HELPER_ROLE || "helpers";
    const helperRole = msg.guild.roles.find("name", helperRoleName);
    memberToWarn.removeRole(helperRole);

    // Send a message to the public modlog.
    const embed: RichEmbedOptions = {
      title: `Se llamó la atención a ${memberToWarn.user.tag}`,
      color: 16545847,
      description: args.reason ? `**Razón**: ${args.reason}` : null,
      author: {
        name: memberToWarn.user.tag,
        icon_url: memberToWarn.user.avatarURL,
      },
      footer: {
        text: "Mensaje de moderación automático",
      },
    };

    const modlogChannelName = process.env.PUBLIC_MODLOG_CHANNEL || "modlog";
    const modlogChannel = msg.guild.channels.find("name", modlogChannelName);
    if (modlogChannel.type === "text") {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const message = `<@${memberToWarn.id}>: ${randomMessage}`;
      (<TextChannel>modlogChannel).send(message, { embed });
    }

    return Promise.resolve([]);
  }
};
