import {
  MessageEmbedOptions,
  GuildMember,
  MessageEmbed,
  Message,
  TextChannel,
  User,
  PartialGuildMember,
  PartialMessage,
} from "discord.js";
import { channelMention, userMention } from "@discordjs/builders";
import humanizeDuration from "humanize-duration";
import { getReportReason, ModReport } from "./modlog/report";

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export abstract class ModlogEvent {
  public toDiscordEmbed(): MessageEmbed {
    const options: MessageEmbedOptions = {
      color: this.color(),
      footer: {
        icon_url:
          "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/page-with-curl_1f4c3.png",
        text: "Mensaje de moderación automática",
      },
      author: {
        name: this.title(),
        icon_url: this.icon(),
      },
      fields: this.fields(),
    };
    return new MessageEmbed(options);
  }

  abstract title(): string;

  abstract icon(): string;

  abstract color(): number;

  abstract fields(): EmbedField[];
}

export class JoinModlogEvent extends ModlogEvent {
  constructor(private member: GuildMember) {
    super();
  }

  title(): string {
    return "Nuevo miembro del servidor";
  }

  icon(): string {
    return "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/bright-button_1f506.png";
  }

  color(): number {
    return 0xfeaf40;
  }

  fields(): EmbedField[] {
    return [
      {
        name: "Handle",
        value: this.member.user.tag,
      },
      {
        name: "ID",
        value: this.member.user.id,
      },
      {
        name: "Se unió a Discord",
        value: this.member.user.createdAt.toUTCString(),
      },
    ];
  }
}

export class VerifyModlogEvent extends ModlogEvent {
  constructor(private member: GuildMember) {
    super();
  }

  title(): string {
    return "Miembro ha sido verificado";
  }

  icon(): string {
    return "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/248/check-box-with-check_2611.png";
  }

  color(): number {
    return 0x5a7702;
  }

  fields(): EmbedField[] {
    return [
      {
        name: "Handle",
        value: this.member.user.tag,
      },
      {
        name: "ID",
        value: this.member.user.id,
      },
      {
        name: "Se unió a Discord",
        value: this.member.user.createdAt.toUTCString(),
      },
      {
        name: "Se unió al servidor",
        value: this.member.joinedAt ? this.member.joinedAt.toUTCString() : "!!",
      },
    ];
  }
}

export class LeaveModlogEvent extends ModlogEvent {
  constructor(private member: PartialGuildMember) {
    super();
  }

  title(): string {
    return "Abandono del servidor";
  }

  icon(): string {
    return "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/cross-mark_274c.png";
  }

  color(): number {
    return 0xdd3247;
  }

  fields(): EmbedField[] {
    return [
      {
        name: "Handle",
        value: this.member.user.tag,
      },
      {
        name: "ID",
        value: this.member.user.id,
      },
      {
        name: "Se unió a Discord",
        value: this.member.user.createdAt.toUTCString(),
      },
    ];
  }
}

export class BanModlogEvent extends ModlogEvent {
  constructor(private user: User) {
    super();
  }

  title(): string {
    return "Miembro ha sido baneado";
  }

  icon(): string {
    return "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/248/hammer_1f528.png";
  }

  color(): number {
    return 0x3a3737;
  }

  fields(): EmbedField[] {
    return [
      {
        name: "Handle",
        value: this.user.tag,
      },
      {
        name: "ID",
        value: this.user.id,
      },
      {
        name: "Se unió a Discord",
        value: this.user.createdAt.toUTCString(),
      },
    ];
  }
}

export class WarnModlogEvent extends ModlogEvent {
  constructor(
    private member: GuildMember,
    private reason: string,
    private duration: number,
    private message: Message
  ) {
    super();
  }

  title(): string {
    return "Se ha aplicado un warn";
  }

  icon(): string {
    return "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/247/warning_26a0.png";
  }

  color(): number {
    return 0x9b59b6;
  }

  fields(): EmbedField[] {
    const fields: EmbedField[] = [];
    fields.push({
      name: "Usuario",
      value: this.member.user.tag,
    });
    fields.push({
      name: "Duración",
      value: humanizeDuration(this.duration, {
        language: "es",
        fallbacks: ["en"],
      }),
    });
    if (this.reason) {
      fields.push({
        name: "Razón",
        value: this.reason,
      });
    }
    if (this.message) {
      fields.push({
        name: "Mensaje",
        value: this.message.cleanContent,
      });
      if (this.message.channel.type == "GUILD_TEXT") {
        const textChannel = this.message.channel as TextChannel;
        fields.push({
          name: "Canal",
          value: `#${textChannel.name}`,
        });
      }
      fields.push({
        name: "Fecha del mensaje",
        value: this.message.createdAt.toISOString(),
      });
      fields.push({
        name: "URL",
        value: `https://discord.com/channels/${this.message.guild.id}/${this.message.channel.id}/${this.message.id}`,
      });
    }
    return fields;
  }
}

export class ReportModlogEvent extends ModlogEvent {
  constructor(private report: ModReport) {
    super();
  }

  title(): string {
    return "Se ha alertado sobre un mensaje inapropiado";
  }

  icon(): string {
    return "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/twitter/282/triangular-flag_1f6a9.png";
  }

  color(): number {
    return 0xde2a42;
  }

  fields(): EmbedField[] {
    return [
      {
        name: "Usuario",
        value: userMention(this.report.message.author.id) + " " + this.report.message.author.id,
      },
      {
        name: "Mensaje",
        value: this.report.message.content,
      },
      {
        name: "Canal",
        value: channelMention(this.report.report.channel),
      },
      {
        name: "Razón",
        value: getReportReason(this.report.interaction.reason[0]),
      },
    ];
  }
}

export class WastebinModlogEvent extends ModlogEvent {
  constructor(private message: Message | PartialMessage) {
    super();
  }

  title(): string {
    return "Se ha eliminado un mensaje";
  }

  icon(): string {
    return "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/248/wastebasket_1f5d1.png";
  }

  color(): number {
    return 0x9b9b9b;
  }

  fields(): EmbedField[] {
    const fields: EmbedField[] = [];
    fields.push({
      name: "Usuario",
      value: this.message.author.tag,
    });
    fields.push({
      name: "Mensaje",
      value: this.message.cleanContent,
    });
    fields.push({
      name: "Message UID",
      value: this.message.id,
    });
    if (this.message.channel.type == "GUILD_TEXT") {
      const textChannel = this.message.channel as TextChannel;
      fields.push({
        name: "Canal",
        value: `#${textChannel.name}`,
      });
    }
    fields.push({
      name: "Fecha del mensaje",
      value: this.message.createdAt.toISOString(),
    });
    return fields;
  }
}
