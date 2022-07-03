import { tokenToDate } from "datetoken";
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
import { ContextMenuCommandBuilder, userMention } from "@discordjs/builders";
import type { MessageContextMenuInteractionHandler } from "../../lib/interaction";
import Member from "../../lib/member";
import { applyAction } from "../../lib/modlog/actions";
import { notifyModlog } from "../../lib/modlog/notifications";
import { ModEvent, ModEventType } from "../../lib/modlog/types";
import { createToast } from "../../lib/response";
import Server from "../../lib/server";
import Makibot from "../../Makibot";
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

/** List of actions that a moderator can take against a message. */
const ACTION_OPTIONS: MessageSelectOptionData[] = [
  { label: "Avisar amistosamente (sin represaliar)", value: "remind" },
  { label: "Aplicar warn (60 minutos)", value: "warn.hour" },
  { label: "Aplicar warn (24 horas)", value: "warn.day" },
  { label: "Aplicar warn (7 días)", value: "warn.week" },
  { label: "Echar (podrá volver a entrar)", value: "kick" },
  { label: "Banear (no podrá volver a entrar)", value: "ban" },
];

/** List of actions that a non-moderator can take against a message. */
const ALERT_OPTIONS: MessageSelectOptionData[] = [
  { label: "Reporte normal: avisar a moderadores", value: "mods" },
  { label: "Reporte sensible: avisar sólo a administradores", value: "admin" },
];

const DELETE_OPTIONS: MessageSelectOptionData[] = [
  { label: "Conservar mensaje", value: "keep" },
  { label: "Eliminar mensaje", value: "delete" },
];

interface ReportForm {
  /** Current value of the reason select. */
  reason: string;

  /** Current value of the action select. */
  action: string;

  /** Current value of the alert select. */
  alert: string;

  /** Whether to delete the message as well. */
  delete: string;
}

function castModEventType(action: string): ModEventType {
  const types = {
    "warn.hour": "WARN",
    "warn.day": "WARN",
    "warn.week": "WARN",
    kick: "KICK",
    ban: "BAN",
  };
  return types[action] || null;
}

function castExpirationDate(action: string): Date {
  const tokens = {
    "warn.hour": "now+h",
    "warn.day": "now+d",
    "warn.week": "now+w",
  };
  return tokens[action] ? tokenToDate(tokens[action]) : null;
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
    this.form = { action: null, alert: null, reason: null, delete: "keep" };
    this.setUpMenuCollector();
    this.setUpButtonCollector();
  }

  private get cleanReason(): string {
    return REASON_OPTIONS.find((r) => r.value === this.form.reason).label;
  }

  private buildModEvent(): ModEvent {
    return {
      guild: this.interaction.guildId,
      target: this.target.id,
      mod: this.reporter.id,
      type: castModEventType(this.form.action),
      reason: this.cleanReason,
      createdAt: new Date(),
      expiresAt: castExpirationDate(this.form.action),
      expired: false,
    };
  }

  private selectDispatchers: {
    [customId: string]: (menu: SelectMenuInteraction) => void | Promise<void>;
  } = {
    "report:reason": (menu) => {
      this.form.reason = menu.values[0];
    },
    "report:alert": (menu) => {
      this.form.alert = menu.values[0];
    },
    "report:action": (menu) => {
      this.form.action = menu.values[0];
    },
    "report:delete": (menu) => {
      this.form.delete = menu.values[0];
    },
  };

  private buttonDispatchers: {
    [customId: string]: (btn: ButtonInteraction) => void | Promise<void>;
  } = {
    "report:send": async (button) => {
      if (this.sudo) {
        await this.dispatchAction();
      } else {
        await this.dispatchAlert();
      }
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

  private async dispatchAction(): Promise<void> {
    if (this.form.action === "remind") {
      await this.sendReminder();
    } else {
      const event = this.buildModEvent();
      const persistedEvent = await applyAction(this.interaction.client as Makibot, event);
      if (persistedEvent.type !== "BAN" && persistedEvent.type !== "KICK") {
        await notifyModlog(this.interaction.client as Makibot, persistedEvent);
      }
    }
    if (this.form.delete === "delete") {
      await this.message.delete();
    }
  }

  private async sendReminder(): Promise<void> {
    await this.message.reply({
      content: [
        `Hola ${userMention(this.target.id)}, me han pedido que te recuerde amistosamente`,
        "que las normas de este servidor están para cumplirlas. Si te continúas",
        "comportando de forma inapropiada, podrían echarte de este servidor.",
      ].join(" "),
      embeds: [
        createToast({
          title: this.cleanReason,
          severity: "warning",
        }),
      ],
    });
  }

  private async dispatchAlert(): Promise<void> {
    const targets = {
      mods: "default",
      admin: "sensible",
    };
    const target = targets[this.form.alert];
    proposeReport(this.interaction.client as Makibot, this.message, this.cleanReason, target);
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

  get sudo() {
    /* Only moderators can moderate a message directly. Non mods can alert to mods. */
    return this.reporter.moderator;
  }

  get privilegedTarget() {
    return this.target.user.bot || this.target.moderator;
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

  get reasonSelectMenu(): MessageSelectMenu {
    return new MessageSelectMenu({
      customId: "report:reason",
      placeholder: "¿Qué problema existe?",
      options: REASON_OPTIONS.map((reason) => ({
        ...reason,
        default: this.form.reason === reason.value,
      })),
    });
  }

  get alertSelectMenu(): MessageSelectMenu {
    return new MessageSelectMenu({
      customId: "report:alert",
      placeholder: "¿A quién hay que informar?",
      options: ALERT_OPTIONS.map((alert) => ({
        ...alert,
        default: this.form.alert === alert.value,
      })),
    });
  }

  get actionSelectMenu(): MessageSelectMenu {
    return new MessageSelectMenu({
      customId: "report:action",
      placeholder: "¿Qué acción tomar?",
      options: ACTION_OPTIONS.map((action) => ({
        ...action,
        default: this.form.action === action.value,
      })),
    });
  }

  get deleteSelectMenu(): MessageSelectMenu {
    return new MessageSelectMenu({
      customId: "report:delete",
      placeholder: "¿Eliminar mensaje?",
      options: DELETE_OPTIONS.map((del) => ({
        ...del,
        default: this.form.delete === del.value,
      })),
    });
  }

  get validForm(): boolean {
    return !!this.form.reason && (this.sudo ? !!this.form.action : !!this.form.alert);
  }

  renderForm(): InteractionReplyOptions {
    const reason = new MessageActionRow({ components: [this.reasonSelectMenu] });
    const action = new MessageActionRow({ components: [this.actionSelectMenu] });
    const alert = new MessageActionRow({ components: [this.alertSelectMenu] });
    const del = new MessageActionRow({ components: [this.deleteSelectMenu] });
    const buttons = new MessageActionRow({
      type: "ACTION_ROW",
      components: [
        new MessageButton({
          customId: "report:send",
          label: "Enviar",
          style: "PRIMARY",
          disabled: !this.validForm,
        }),
        new MessageButton({
          customId: "report:cancel",
          label: "Cancelar",
          style: "DANGER",
        }),
      ],
    });
    const components = this.sudo ? [reason, action, del, buttons] : [reason, alert, buttons];
    return {
      content: "Gestionar un problema con este mensaje",
      components: components.map((c) => new MessageActionRow(c)),
    };
  }
}

export default class ModRequestCommand implements MessageContextMenuInteractionHandler {
  name = "Aplicar o pedir moderación";

  build() {
    return new ContextMenuCommandBuilder().setName("Aplicar o pedir moderación").setType(3);
  }

  async handleGuild(interaction: MessageContextMenuInteraction): Promise<void> {
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
