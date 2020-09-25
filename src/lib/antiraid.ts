import Makibot from "../Makibot";

export default class AntiRaid {
  constructor(private client: Makibot) {}

  async init(): Promise<void> {
    await this.syncPresence();
  }

  get raidMode(): boolean {
    return this.client.provider.get("global", "raidmode", false);
  }

  async setRaidMode(enabled: boolean): Promise<void> {
    await this.client.provider.set("global", "raidmode", enabled);
    await this.syncPresence();
  }

  private async syncPresence(): Promise<void> {
    await this.client.user.setPresence({
      status: this.raidMode ? "dnd" : "online",
    });
  }
}
