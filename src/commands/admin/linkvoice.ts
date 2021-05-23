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
      name: "linkvoice",
      memberName: "linkvoice",
      group: "admin",
      description: "Links a voice channel with a role",
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

    if (!prevRoles) {
      /* Channel is new. */
      newState = { ...prevState, [args.channel]: [args.role] };
    } else if (Array.isArray(prevRoles)) {
      newState = { ...prevState, [args.channel]: [...prevRoles, args.role] };
    } else {
      newState = { ...prevState, [args.channel]: [prevRoles, args.role] };
    }

    console.log(newState);

    await this.makibot.provider.set(null, "voiceroles", newState);
    this.makibot.manager.restart("voice-role");
    return msg.reply("Roles have been updated");
  }
}
