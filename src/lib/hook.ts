/* eslint-disable @typescript-eslint/no-var-requires */
import requireAll from "require-all";
import Makibot from "../Makibot";
import logger from "./logger";

export interface Hook {
  /* The identifier of the hook. */
  name: string;
}

export function registerHooks(path: string, client: Makibot): void {
  logger.debug("[hooks] registering services...");
  const hooks = requireAll({
    dirname: path,
    filter: /^([^\.].*)\.[jt]s$/,
  });
  Object.values(hooks).forEach((hook) => {
    if (hook.default && typeof hook.default === "function") {
      /* close ES module resolution. */
      hook = hook.default;
    }

    const instance: Hook = new hook(client);
    logger.debug(`[hooks] registering service ${instance.name}`);
  });
  logger.debug("[hooks] finished registering services");
}
