import axios, { AxiosInstance } from "axios";
import { ServerJSONSchema } from "../server";
import { SettingsJSONSchema } from "../settings";

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
}
