import express from "express";

import Makibot from "../../../Makibot";
import { ReactionRoleConfiguration } from "discordjs-reaction-role";

export default function autorolesMiddleware(makibot: Makibot): express.Router {
  const router = express.Router();

  router.get("/", (req, res) => {
    const config: ReactionRoleConfiguration[] = makibot.provider.get(
      "global",
      "autorole:config",
      []
    );

    res.json(config);
  });

  router.post("/", async (req, res) => {
    if (req.body.message && req.body.role && req.body.emoji) {
      const newAutoRole: ReactionRoleConfiguration = {
        messageId: req.body.message,
        reaction: req.body.emoji,
        roleId: req.body.role,
      };

      /* It is not possible to have two roles for the same messageId and reaction. */
      const prevConf: ReactionRoleConfiguration[] = makibot.provider.get(
        "global",
        "autorole:config",
        []
      );
      const cleanPrevConf = prevConf.filter(
        (conf) => conf.messageId != newAutoRole.messageId || conf.reaction != newAutoRole.reaction
      );

      /* Set the new configuration including the new role to assign. */
      const newConf = [...cleanPrevConf, newAutoRole];
      await makibot.provider.set("global", "autorole:config", newConf);
      makibot.manager.restart("autorole");
      return res.status(204).send("");
    } else {
      return res.status(400).send("Error");
    }
  });

  router.delete("/", async (req, res) => {
    if (req.body.emoji && req.body.message) {
      const prevConf: ReactionRoleConfiguration[] = makibot.provider.get(
        "global",
        "autorole:config",
        []
      );
      const cleanConf = prevConf.filter(
        (conf) => conf.messageId != req.body.message || conf.reaction != req.body.emoji
      );
      await makibot.provider.set("global", "autorole:config", cleanConf);
      makibot.manager.restart("autorole");
      return res.status(204).send("");
    } else {
      return res.status(400).send("Error");
    }
  });

  return router;
}
