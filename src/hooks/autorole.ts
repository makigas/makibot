import { Hook } from "../lib/hook";
import AutoRole from "../lib/autorole";
import Makibot from "../Makibot";

export default class AutoRoleService implements Hook {
  name = "autorole";

  allowsRestart = true;

  private autorole: AutoRole;

  constructor(private client: Makibot) {
    this.restart();
  }

  restart(): void {
    /* Don't keep two AutoRole instances if one was previously instantiated. */
    this.autorole?.teardown();

    /* Start a new AutoRole. */
    const config = this.client.provider.get("global", "autorole:config", []);
    this.autorole = new AutoRole(this.client, config);
  }
}
