/* eslint-disable @typescript-eslint/no-var-requires */
import requireAll from "require-all";
import Makibot from "../Makibot";
import logger from "./logger";

export interface Hook {
  /* The identifier of the hook. */
  name: string;

  /** Allows restart? */
  allowsRestart?: boolean;

  /** Callback to ask the hook to restart itself. */
  restart?: () => void;
}

export class HookManager {
  private watchdog: { [name: string]: Hook } = {};

  constructor(path: string, client: Makibot) {
    logger.debug("[hooks] registering services...");
    const hooks = requireAll({
      dirname: path,
      filter: /^([^.].*)\.[jt]s$/,
    });

    Object.values(hooks).forEach((hook) => {
      if (hook.default && typeof hook.default === "function") {
        /* close ES module resolution. */
        hook = hook.default;
      }

      const instance: Hook = new hook(client);
      if (instance.allowsRestart) {
        this.watchdog[instance.name] = instance;
      }
      logger.debug(`[hooks] registering service ${instance.name}`);
    });
    logger.debug("[hooks] finished registering services");
  }

  restart(name) {
    logger.debug(`[hooks] restarting service ${name}...`);
    this.watchdog[name]?.restart();
  }
}
