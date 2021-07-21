import ReactionRole from "discordjs-reaction-role";

import { Hook } from "../lib/hook";
import Makibot from "../Makibot";

export default class AutoRoleService implements Hook {
  name = "autorole";

  allowsRestart = true;

  private autorole: ReactionRole;

  constructor(private client: Makibot) {
    this.restart();
  }

  restart(): void {
    /* Don't keep two AutoRole instances if one was previously instantiated. */
    this.autorole?.teardown();

    /* Start a new AutoRole. */
    const config = this.client.provider.get("global", "autorole:config", []);
    this.autorole = new ReactionRole(this.client, config);
  }
}
