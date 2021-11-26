import { Router } from "express";
import Makibot from "../../../Makibot";

export default function voiceRoleMiddleware(makibot: Makibot): Router {
  function getConfig() {
    return makibot.provider.get(null, "voiceroles", {});
  }

  const router = Router();

  router.get("/", (req, res) => {
    res.json(getConfig());
  });

  router.post("/", async (req, res) => {
    const channelId = req.body.channel;
    const roleId = req.body.role;

    if (!channelId || !roleId) {
      return res.status(400).send("Invalid parameters");
    }

    const config = getConfig();
    const prevConfig = config[channelId];
    let newConfig;

    if (!prevConfig) {
      /* Channel is new. */
      newConfig = { ...config, [channelId]: [roleId] };
    } else {
      /* Channel already existed. */
      if (Array.isArray(prevConfig)) {
        newConfig = { ...config, [channelId]: [...prevConfig, roleId] };
      } else {
        newConfig = { ...config, [channelId]: [prevConfig, roleId] };
      }
    }

    await makibot.provider.set(null, "voiceroles", newConfig);
    this.makibot.manager.restart("voice-role");
    return res.status(204).send("");
  });

  router.delete("/", async (req, res) => {
    const channelId = req.body.channel;
    const roleId = req.body.role;

    if (!channelId || !roleId) {
      return res.status(400).send("Invalid parameters");
    }

    const config = getConfig();
    const prevConfig = config[channelId];
    let newConfig: object;

    if (prevConfig) {
      /* The role to be removed was the only one in use. */
      if (!Array.isArray(prevConfig) && prevConfig == roleId) {
        /* Remove it. */
        newConfig = { ...config, [channelId]: [] };
      } else if (Array.isArray(prevConfig)) {
        /* This is a list of roles. Just make sure that we don't use the one to be removed. */
        const newRoles = prevConfig.filter((x) => x != roleId);
        newConfig = { ...config, [channelId]: newRoles };
      } else {
        /* Nothing to change. */
        newConfig = config;
      }
    } else {
      /* Nothing to change. */
      newConfig = config;
    }

    await this.makibot.provider.set(null, "voiceroles", newConfig);
    this.makibot.manager.restart("voice-role");
    return res.status(204).send("");
  });

  return router;
}
