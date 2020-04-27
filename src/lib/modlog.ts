import { RichEmbedOptions, GuildMember, RichEmbed, Message } from "discord.js";

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

abstract class ModlogEvent {
  public toDiscordEmbed(): RichEmbed {
    const options: RichEmbedOptions = {
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
    return new RichEmbed(options);
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

export class LeaveModlogEvent extends ModlogEvent {
  constructor(private member: GuildMember) {
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
      {
        name: "Se unió al servidor",
        value: this.member.joinedAt.toUTCString(),
      },
    ];
  }
}

export class WarnModlogEvent extends ModlogEvent {
  constructor(private member: GuildMember, private reason: string, private message: Message) {
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
      fields.push({
        name: "Fecha del mensaje",
        value: this.message.createdAt.toISOString(),
      });
    }
    return fields;
  }
}
