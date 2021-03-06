import { Message, User } from "discord.js";
import { Command, CommandoMessage } from "discord.js-commando";
import Member from "../../lib/member";
import Makibot from "../../Makibot";

interface KarmaArguments {
  member: User;
}

export default class KarmaCommand extends Command {
  constructor(client: Makibot) {
    super(client, {
      name: "karma",
      memberName: "karma",
      group: "karma",
      description: "Get the karma of a member",
      ownerOnly: true,
      guildOnly: true,
      args: [{ key: "member", type: "user", prompt: "Target", default: null }],
    });
  }

  async run(msg: CommandoMessage, { member }: KarmaArguments): Promise<Message | Message[]> {
    const karma = (this.client as Makibot).karma;

    /* Get the pointed member. */
    const target = await msg.guild.member(member);
    const gm = new Member(target);

    const offset = gm.tagbag.tag("karma:offset").get(0);
    const count = await karma.count(member.id);
    const totalKarma = offset + count;

    const currentLevel = gm.tagbag.tag("karma:level").get(1);

    return msg.channel.send(
      `${member.tag} has ${totalKarma} points. (DB = ${count}, Offset = ${offset}, Level = ${currentLevel})`
    );
  }
}
