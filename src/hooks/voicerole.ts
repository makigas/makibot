import { Hook } from "../lib/hook";
import Makibot from "../Makibot";
import VoiceRole from "discordjs-voicerole";
import logger from "../lib/logger";
import { VoiceState } from "discord.js";

function tag(voice: VoiceState): string {
  return `${voice.member.user.tag}(${voice.member.id})`;
}

function channel(voice: VoiceState): string {
  return `${voice.channel.name}(${voice.channel.id})`;
}

export default class VoiceRoleService implements Hook {
  name = "voice-role";

  allowsRestart = true;

  private voicerole: VoiceRole;

  constructor(private client: Makibot) {
    const voiceRoleConfig = client.provider.get(null, "voiceroles", {});
    this.voicerole = new VoiceRole(voiceRoleConfig);
    this.client.on("voiceStateUpdate", (oldState, newState) =>
      this.triggerVoiceStateUpdate(oldState, newState)
    );
  }

  triggerVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void {
    if (oldState.member.id != newState.member.id) {
      logger.error(`Unexpected condition: ${tag(oldState)} != ${tag(newState)}`);
      return;
    }
    if (oldState.channelId && newState.channelId) {
      logger.debug(
        `Member ${tag(oldState)} changes channel: ${channel(oldState)} => ${channel(newState)}`
      );
    } else if (!oldState.channelId) {
      logger.debug(`Member ${tag(newState)} connected from ${channel(newState)}`);
    } else if (!newState.channelId) {
      logger.debug(`Member ${tag(oldState)} disconnected from ${channel(oldState)}`);
    }
    this.voicerole.trigger(oldState, newState);
  }

  restart(): void {
    const voiceRoleConfig = this.client.provider.get(null, "voiceroles", {});
    this.voicerole = new VoiceRole(voiceRoleConfig);
  }
}
