import {
  BaseCommandInteraction,
  Guild,
  GuildMember,
  InteractionCollector,
  InteractionReplyOptions,
  MessageActionRow,
  MessageComponentInteraction,
  MessageSelectMenu,
  MessageButton,
  MessageSelectOptionData,
  SelectMenuInteraction,
  Snowflake,
  ButtonInteraction,
} from "discord.js";

function getHelperRolesList(guild: Guild): string[] {
  return guild.roles.cache
    .filter((role) => role.name.startsWith("Helper/"))
    .map((role) => role.name);
}

function createDropdown(member: GuildMember): MessageSelectMenu {
  const rolesList = getHelperRolesList(member.guild);
  const memberRoles = member.roles.cache.map((role) => role.name);
  const options = rolesList.map<MessageSelectOptionData>((role) => ({
    label: role.replace("Helper/", ""),
    value: role,
    default: memberRoles.includes(role),
  }));
  return new MessageSelectMenu({
    customId: "helper:update",
    placeholder: "Definir roles de helper",
    minValues: 0,
    maxValues: rolesList.length,
    options,
  });
}

function difference(a: string[], b: string[]): string[] {
  return a.filter((i) => !b.includes(i));
}

class HelperManager {
  private menuCollector: InteractionCollector<SelectMenuInteraction>;
  private buttonCollector: InteractionCollector<ButtonInteraction>;

  constructor(
    private interaction: BaseCommandInteraction | MessageComponentInteraction,
    private member: GuildMember,
    private parentId: Snowflake
  ) {
    this.menuCollector = this.interaction.channel.createMessageComponentCollector({
      componentType: "SELECT_MENU",
      filter: (event) => event.message.id === this.parentId,
    });
    this.menuCollector.on("collect", this.handleMenuCollector.bind(this));

    this.buttonCollector = this.interaction.channel.createMessageComponentCollector({
      componentType: "BUTTON",
      filter: (event) => event.message.id === this.parentId,
    });
    this.buttonCollector.on("collect", this.handleButtonCollector.bind(this));
  }

  render(): InteractionReplyOptions {
    return {
      content:
        "Si te pones los roles de los temas que controlas, la gente que necesite ayuda te podría mencionar con un ping para llamar tu atención:",
      components: [
        new MessageActionRow({
          components: [createDropdown(this.member)],
        }),
        new MessageActionRow({
          components: [
            new MessageButton({
              customId: "helper:delete",
              label: "Quítame todo",
              style: "DANGER",
            }),
          ],
        }),
      ],
    };
  }

  private async handleMenuCollector(event: SelectMenuInteraction): Promise<void> {
    /* Set and unset roles that should not apply here. */
    await this.member.roles.add(
      difference(event.values, this.currentMemberRoles).map((r) =>
        this.member.guild.roles.cache.find((p) => p.name === r)
      )
    );
    await this.member.roles.remove(
      difference(this.currentMemberRoles, event.values).map((r) =>
        this.member.guild.roles.cache.find((p) => p.name === r)
      )
    );

    /* Update the message. */
    await event.update(this.render());
  }

  private async handleButtonCollector(event: ButtonInteraction): Promise<void> {
    await this.member.roles.remove(
      this.currentMemberRoles.map((r) => this.member.guild.roles.cache.find((p) => p.name === r))
    );
    await event.update(this.render());
  }

  private get currentMemberRoles(): string[] {
    const acceptableRoles = getHelperRolesList(this.member.guild);
    return this.member.roles.cache
      .map((role) => role.name)
      .filter((r) => acceptableRoles.includes(r));
  }
}

export async function startHelperManager(
  interaction: BaseCommandInteraction | MessageComponentInteraction
): Promise<void> {
  const message = await interaction.deferReply({ ephemeral: true, fetchReply: true });
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const manager = new HelperManager(interaction, member, message.id);
  await interaction.editReply(manager.render());
}
