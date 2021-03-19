import { Message, User } from "discord.js";
import { Command } from "discord.js-commando";
import { CommandoMessage } from "discord.js-commando";
import { getLevel } from "../../lib/karma";
import Member from "../../lib/member";
import Makibot from "../../Makibot";

interface SetKarmaArguments {
  member: User;
  count: number;
}

export default class SetKarmaCommand extends Command {
  constructor(client: Makibot) {
    super(client, {
      name: "setkarma",
      memberName: "setkarma",
      group: "karma",
      description: "Set the fixed karma of a member (backlog...)",
      ownerOnly: true,
      guildOnly: true,
      args: [
        { key: "member", type: "user", prompt: "Target", default: "" },
        { key: "count", type: "integer", prompt: "Amount", default: "" },
      ],
    });
  }

  async run(
    msg: CommandoMessage,
    { member, count }: SetKarmaArguments
  ): Promise<Message | Message[]> {
    const karma = (this.client as Makibot).karma;

    const gm = new Member(msg.member);

    /* Set the karma offset. */
    await gm.tagbag.tag("karma:offset").set(count);
    const totalPoints = await karma.count(member.id);

    /* Just so that the bot does not spam, silently bump levels and max. */
    const expectedLevel = getLevel(count + totalPoints);
    const currentLevel = gm.tagbag.tag("karma:level");
    if (currentLevel.get(0) != expectedLevel) {
      currentLevel.set(expectedLevel);
      const highScoreLevel = gm.tagbag.tag("karma:max");
      if (highScoreLevel.get(0) < expectedLevel) {
        highScoreLevel.set(expectedLevel);
      }
    }

    /* Update presence in the tiers. */
    gm.setCrew(currentLevel.get(0));

    return msg.reply(
      `Karma adjusted to ${count} (total: ${totalPoints}, new level: ${currentLevel.get(0)})`
    );
  }
}
