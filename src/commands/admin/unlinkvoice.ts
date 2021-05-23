import { Message } from "discord.js";
import { Command, CommandoMessage } from "discord.js-commando";
import Makibot from "../../Makibot";

interface LinkVoiceCommandArguments {
  channel: string;
  role: string;
}

export default class LinkVoiceCommand extends Command {
  constructor(client: Makibot) {
    super(client, {
      name: "unlinkvoice",
      memberName: "unlinkvoice",
      group: "admin",
      description: "Unlinks a voice channel with a role",
      ownerOnly: true,
      guildOnly: false,
      args: [
        { key: "channel", type: "string", prompt: "Channel snowflake", default: "" },
        { key: "role", type: "string", prompt: "Role snowflake", default: "" },
      ],
    });
  }

  get makibot(): Makibot {
    return this.client as Makibot;
  }

  async run(msg: CommandoMessage, args: LinkVoiceCommandArguments): Promise<Message | Message[]> {
    const prevState = this.client.provider.get(null, "voiceroles", {});
    const prevRoles = prevState[args.channel];
    let newState;

    if (prevRoles) {
      /* The role to be removed was the only one in use. */
      if (!Array.isArray(prevRoles) && prevRoles == args.role) {
        /* Remove it. */
        newState = { ...prevState, [args.channel]: [] };
      } else if (Array.isArray(prevRoles)) {
        /* This is a list of roles. Just make sure that we don't use the one to be removed. */
        const newRoles = prevRoles.filter((x) => x != args.role);
        newState = { ...prevState, [args.channel]: newRoles };
      } else {
        /* Nothing to change. */
        newState = prevState;
      }
    } else {
      /* Nothing to change. */
      newState = prevState;
    }
    console.log(newState);

    await this.makibot.provider.set(null, "voiceroles", newState);
    this.makibot.manager.restart("voice-role");
    return msg.reply("Roles have been updated");
  }
}
