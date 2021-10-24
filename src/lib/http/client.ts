import axios, { AxiosInstance } from "axios";
import { ServerJSONSchema } from "../server";
import { SettingsJSONSchema } from "../settings";

interface MemberKarmaJSON {
  level: number;
  points: number;
  offset: number;
}

/**
 * Consumes a Makibot HTTP Server. Mainly designed to be used with clankctl.
 */
export default class Client {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "http://localhost:8080",
    });
  }

  async healthcheck(): Promise<boolean> {
    try {
      const response = await this.client.get("/healthcheck");
      if (response.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  async getKarma(guild: string, member: string): Promise<MemberKarmaJSON> {
    const response = await this.client.get(`/guilds/${guild}/members/${member}/karma`);
    if (response.status !== 200) {
      throw new Error(`${response.statusText}: ${response.data}`);
    }
    return response.data as MemberKarmaJSON;
  }

  async setKarmaOffset(guild: string, member: string, offset: number): Promise<MemberKarmaJSON> {
    const payload = JSON.stringify({ offset });
    const response = await this.client.patch(`/guilds/${guild}/members/${member}/karma`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status !== 200) {
      throw new Error(`${response.statusText}: ${response.data}`);
    }
    return response.data as unknown as MemberKarmaJSON;
  }

  async raidModeStatus(): Promise<boolean> {
    const response = await this.client.get("/antiraid");
    if (response.status !== 200) {
      throw new Error(`${response.statusText}: ${response.data}`);
    }
    return (response.data as { antiraid: boolean }).antiraid;
  }

  async setRaidMode(mode: boolean): Promise<void> {
    if (mode) {
      const response = await this.client.post("/antiraid");
      if (response.status !== 200) {
        throw new Error(`${response.statusText}: ${response.data}`);
      }
    } else {
      const response = await this.client.delete("/antiraid");
      if (response.status !== 200) {
        throw new Error(`${response.statusText}: ${response.data}`);
      }
    }
  }

  async guilds(): Promise<Partial<ServerJSONSchema>[]> {
    const response = await this.client.get("/guilds");
    return response.data as Partial<ServerJSONSchema>[];
  }

  async guildInfo(id: string): Promise<ServerJSONSchema> {
    const response = await this.client.get("/guilds/" + id);
    if (response.status === 200) {
      return response.data as ServerJSONSchema;
    } else {
      throw new Error(`${response.statusText}: ${response.data}`);
    }
  }

  async guildSettings(guildId: string): Promise<SettingsJSONSchema> {
    const response = await this.client.get(`/guilds/${guildId}/settings`);
    if (response.status === 200) {
      return response.data as SettingsJSONSchema;
    } else {
      throw new Error(`${response.statusText}: ${response.data}`);
    }
  }

  async setSetting(guildId: string, name: string, value: string): Promise<void> {
    const payload = JSON.stringify({ [name]: value });
    const response = await this.client.patch(`/guilds/${guildId}/settings`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status !== 200) {
      throw new Error(`${response.statusText}: ${response.data}`);
    }
  }
  async getProviderSetting(guildId: string, tag: string): Promise<string> {
    const response = await this.client.get(`/guilds/${guildId}/provider/${tag}`);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`${response.statusText}: ${response.data}`);
    }
  }

  async setProviderSetting(guildId: string, tag: string, value: string): Promise<void> {
    const payload = { value };
    const response = await this.client.put(`/guilds/${guildId}/provider/${tag}`, payload);
    if (response.status !== 204) {
      throw new Error(`${response.statusText}: ${response.data}`);
    }
  }

  async deleteProviderSetting(guildId: string, tag: string): Promise<void> {
    const response = await this.client.delete(`/guilds/${guildId}/provider/${tag}`);
    if (response.status !== 204) {
      throw new Error(`${response.statusText}: ${response.data}`);
    }
  }
}
