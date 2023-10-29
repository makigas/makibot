import {
  BaseCommandInteraction,
  ButtonInteraction,
  GuildMember,
  InteractionCollector,
  InteractionReplyOptions,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
  Snowflake,
} from "discord.js";

/**
 * Note: this is a very specific list for the use cases of this server. If you are taking
 * this code, you should probably change this with the list of roles that you are using
 * for your server...
 */
const ROLE_DEFINITIONS = [
  {
    label: "Anuncios",
    description: "Te menciono cuando tenga algo que anunciar",
    emoji: "📰",
  },
  {
    label: "Vídeos",
    description: "Te menciono cuando suba vídeo",
    emoji: "📼",
  },
  {
    label: "Archivo",
    description: "Muestra los canales del servidor que han sido archivados",
    emoji: "💾",
  },
];

/**
 * Build a dropdown menu that can be added to an action row, with the list of roles.
 * It is required to provide the guild member, because this will be used in order to scan
 * the roles the member is already in, to mark them as selected.
 * @param member the guild member used to build the menu
 */
function createDropdown(member: GuildMember): MessageSelectMenu {
  const memberRoles = member.roles.cache.map((role) => role.name);
  const options = ROLE_DEFINITIONS.map<MessageSelectOptionData>((roleDefinition) => ({
    ...roleDefinition,
    value: roleDefinition.label,
    default: memberRoles.includes(roleDefinition.label),
  }));
  return new MessageSelectMenu({
    customId: "roles:update",
    placeholder: "Definir algún rol",
    minValues: 0,
    maxValues: ROLE_DEFINITIONS.length,
    options,
  });
}

function difference(a: string[], b: string[]): string[] {
  return a.filter((i) => !b.includes(i));
}

class RoleManager {
  private menuCollector: InteractionCollector<SelectMenuInteraction>;
  private buttonCollector: InteractionCollector<ButtonInteraction>;

  constructor(
    private interaction: BaseCommandInteraction | MessageComponentInteraction,
    private member: GuildMember,
    private parentId: Snowflake,
  ) {
    this.menuCollector = this.interaction.channel.createMessageComponentCollector({
      componentType: "SELECT_MENU",
      filter: (event) => event.message.id === this.parentId,
    });
    this.menuCollector.on("collect", this.handleCollector.bind(this));

    this.buttonCollector = this.interaction.channel.createMessageComponentCollector({
      componentType: "BUTTON",
      filter: (event) => event.message.id === this.parentId,
    });
    this.buttonCollector.on("collect", this.handleButtonCollector.bind(this));
  }

  render(): InteractionReplyOptions {
    return {
      content: "Utiliza el menú desplegable para añadir o quitar roles.",
      components: [
        new MessageActionRow({
          components: [createDropdown(this.member)],
        }),
        new MessageActionRow({
          components: [
            new MessageButton({
              customId: "roles:delete",
              label: "Quítame todo",
              style: "DANGER",
            }),
          ],
        }),
      ],
    };
  }

  private async handleCollector(event: SelectMenuInteraction): Promise<void> {
    /* Set and unset roles that should not apply here. */
    await this.member.roles.add(
      difference(event.values, this.currentMemberRoles).map((r) =>
        this.member.guild.roles.cache.find((p) => p.name === r),
      ),
    );
    await this.member.roles.remove(
      difference(this.currentMemberRoles, event.values).map((r) =>
        this.member.guild.roles.cache.find((p) => p.name === r),
      ),
    );

    /* Update the message. */
    await event.update(this.render());
  }

  private async handleButtonCollector(event: ButtonInteraction): Promise<void> {
    await this.member.roles.remove(
      this.currentMemberRoles.map((r) => this.member.guild.roles.cache.find((p) => p.name === r)),
    );
    await event.update(this.render());
  }

  private get currentMemberRoles(): string[] {
    const acceptableRoles = ROLE_DEFINITIONS.map((r) => r.label);
    return this.member.roles.cache
      .map((role) => role.name)
      .filter((r) => acceptableRoles.includes(r));
  }
}

export async function startRoleManager(
  interaction: BaseCommandInteraction | MessageComponentInteraction,
): Promise<void> {
  const message = await interaction.deferReply({ ephemeral: true, fetchReply: true });
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const manager = new RoleManager(interaction, member, message.id);
  await interaction.editReply(manager.render());
}
