import { Snowflake } from "discord-api-types/v9";
import {
  ButtonInteraction,
  ContextMenuInteraction,
  InteractionReplyOptions,
  Message,
  MessageActionRow,
  MessageButton,
  MessageContextMenuInteraction,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js";
import { ContextMenuCommandBuilder } from "@discordjs/builders";
import type { MessageContextMenuInteractionHandler } from "../../lib/interaction";
import Member from "../../lib/member";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";
import { proposeReport } from "../../lib/modlog/report";

/** List of reasons on why a message would be reported. */
const REASON_OPTIONS: MessageSelectOptionData[] = [
  { label: "Contiene spam", value: "spam" },
  { label: "Mensaje explícito o NSFW", value: "nsfw" },
  { label: "Enviado a varios canales a la vez", value: "flood" },
  { label: "En contra de las normas de Discord", value: "tos" },
  { label: "Copia y pega de enunciado o práctica", value: "copypaste" },
  { label: "Mensaje de calidad extremadamente baja", value: "lowquality" },
  { label: "Mensaje irrespetuoso o dañino", value: "unrespectful" },
];

/** List of actions that a non-moderator can take against a message. */
const ALERT_OPTIONS: MessageSelectOptionData[] = [
  { label: "Reporte normal: avisar a moderadores", value: "mods" },
  { label: "Reporte sensible: avisar sólo a administradores", value: "admin" },
];

class ReportForm {
  /** Current value on why the user is reporting this message. */
  reason: string | null;

  /** Current value on the target of the report itself. */
  alert: string | null;

  constructor() {
    this.reason = null;
    this.alert = null;
  }

  public get valid(): boolean {
    return this.reason != null && this.alert != null;
  }

  cleanReason(): string | null {
    return REASON_OPTIONS.find((r) => r.value === this.reason)?.label;
  }
}

class ModerationRequest {
  private readonly interaction: ContextMenuInteraction;
  private readonly parentId: Snowflake;
  private readonly reporter: Member;
  private readonly target: Member;
  private readonly message: Message;
  private readonly form: ReportForm;

  constructor(options: {
    message: Message;
    parentId: Snowflake;
    interaction: ContextMenuInteraction;
    reporter: Member;
    target: Member;
  }) {
    Object.assign(this, options);
    this.form = new ReportForm();
    this.setUpMenuCollector();
    this.setUpButtonCollector();
  }

  private selectDispatchers: {
    [customId: string]: (menu: SelectMenuInteraction) => void;
  } = {
    "report:reason": (menu) => {
      this.form.reason = menu.values[0];
    },
    "report:alert": (menu) => {
      this.form.alert = menu.values[0];
    },
  };

  private buttonDispatchers: {
    [customId: string]: (btn: ButtonInteraction) => Promise<void>;
  } = {
    "report:send": async (button) => {
      await this.dispatchAlert();
      return button.update({
        embeds: [
          createToast({
            title: "Reporte completado",
            description: "Se ha completado la operación de reporte. Gracias.",
            severity: "success",
          }),
        ],
        components: [],
      });
    },
    "report:cancel": (button) => {
      return button.update({
        embeds: [
          createToast({
            title: "Operación cancelada",
            description: "Has cancelado correctamente la operación.",
            severity: "info",
          }),
        ],
        components: [],
      });
    },
  };

  private async dispatchAlert(): Promise<void> {
    const targets = {
      mods: "default",
      admin: "sensible",
    };
    const target = targets[this.form.alert];
    proposeReport(this.message, this.form.cleanReason(), target);
  }

  private collectorFilter(item: SelectMenuInteraction | ButtonInteraction): boolean {
    return item.message.id === this.parentId;
  }

  /**
   * Set ups the collector required to process select menu events, which are
   * mainly used to update the value of the form object before sending it for
   * action.
   */
  private setUpMenuCollector(): void {
    const collector = this.interaction.channel.createMessageComponentCollector({
      componentType: "SELECT_MENU",
      filter: this.collectorFilter.bind(this),
    });
    collector.on("collect", (menu) => {
      const dispatcher = this.selectDispatchers[menu.customId];
      if (dispatcher) {
        dispatcher(menu);
      }
      return menu.update(this.renderForm());
    });
  }

  /**
   * Set ups the collector required to process the button events, which are
   * mainly used to perform actions such as sending a report or cancelling
   * a report operation.
   */
  private setUpButtonCollector(): void {
    const collector = this.interaction.channel.createMessageComponentCollector({
      componentType: "BUTTON",
      filter: this.collectorFilter.bind(this),
    });
    collector.on("collect", (button) => {
      const dispatcher = this.buttonDispatchers[button.customId];
      if (dispatcher) {
        return dispatcher(button);
      }
    });
  }

  get privilegedTarget() {
    return false; // return this.target.user.bot || this.target.moderator;
  }

  validate(): string {
    if (this.target.id === this.reporter.id) {
      return "No puedes reportar tus propios mensajes";
    }
    if (this.privilegedTarget) {
      return "No se pueden reportar los mensajes de esa cuenta";
    }
  }

  async start(): Promise<void> {
    await this.interaction.editReply(this.renderForm());
  }

  renderForm(): InteractionReplyOptions {
    const reason = new MessageActionRow({
      components: [
        new MessageSelectMenu({
          customId: "report:reason",
          placeholder: "¿Qué problema existe?",
          options: REASON_OPTIONS.map((reason) => ({
            ...reason,
            default: this.form.reason === reason.value,
          })),
        }),
      ],
    });
    const alert = new MessageActionRow({
      components: [
        new MessageSelectMenu({
          customId: "report:alert",
          placeholder: "¿A quién hay que informar?",
          options: ALERT_OPTIONS.map((alert) => ({
            ...alert,
            default: this.form.alert === alert.value,
          })),
        }),
      ],
    });
    const buttons = new MessageActionRow({
      type: "ACTION_ROW",
      components: [
        new MessageButton({
          customId: "report:send",
          label: "Enviar",
          style: "PRIMARY",
          disabled: !this.form.valid,
        }),
        new MessageButton({
          customId: "report:cancel",
          label: "Cancelar",
          style: "DANGER",
        }),
      ],
    });
    return {
      content: "¿Qué problema tiene este mensaje?",
      components: [reason, alert, buttons],
    };
  }
}

export default class ModRequestCommand implements MessageContextMenuInteractionHandler {
  name = "Avisar a moderación";

  build() {
    return new ContextMenuCommandBuilder().setName("Avisar a moderación").setType(3);
  }

  async handle(interaction: MessageContextMenuInteraction): Promise<void> {
    const parent = await interaction.deferReply({ ephemeral: true, fetchReply: true });
    const parentId = parent.id;

    /* I'm only extracting the parameters here to avoid promises. */
    const server = new Server(interaction.guild);
    const reporter = await server.member(interaction.user);
    const message = await interaction.channel.messages.fetch(interaction.targetMessage.id);
    const target = await server.member(message.author.id);

    const prompt = new ModerationRequest({ parentId, interaction, message, reporter, target });

    /* Make sure preconditions are valid. */
    const invalidReason = prompt.validate();
    if (invalidReason) {
      await interaction.editReply({
        embeds: [createToast({ title: invalidReason, severity: "error" })],
      });
    } else {
      await prompt.start();
    }
  }
}
