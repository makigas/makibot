import { Guild } from "discord.js";
import express from "express";

import Makibot from "../../../Makibot";
import Server from "../../server";
import autorolesMiddleware from "./autoroles";
import memberMiddleware from "./member";

export interface MiddlewareLocals {
  guild: Guild;
  server: Server;
}

export default function guildMiddleware(makibot: Makibot): express.Router {
  const router = express.Router({ mergeParams: true });

  /* Add a middleware for extracting the guild from the request object. */
  router.use((req, res, next) => {
    const guild = makibot.guilds.cache.find((g) => g.id == req.params.guild);
    if (guild) {
      const server = new Server(guild);
      res.locals = { ...res.locals, guild, server };
      next();
    } else {
      res.status(404).contentType("text/plain").send("Guild Not Found");
    }
  });

  /* Print information about the server. */
  router.get("/", (req, res) => {
    res.json(res.locals.server.toJSON());
  });

  router.use("/members/:member", memberMiddleware(makibot));
  router.use("/roles", autorolesMiddleware(makibot));

  /* Print current settings for the server. */
  router.get("/settings", (req, res) => {
    res.json(res.locals.server.settings.toJSON());
  });

  /* Patch settings for the server. */
  router.patch("/settings", async (req: express.Request<{}, {}, {}, {}, MiddlewareLocals>, res) => {
    const { server } = res.locals;

    const settings: { [prop: string]: (value: string) => Promise<void> } = {
      "pin.pinboard": (value) => server.settings.setPinPinboard(value),
      "pin.emoji": (value) => server.settings.setPinEmoji(value),
      "modlog.webhookId": (value) => server.settings.setModlogWebhookId(value),
      "modlog.webhookToken": (value) => server.settings.setModlogWebhookToken(value),
      "roles.crew": (value) => server.settings.setRoleCrewId(value),
      "roles.tier1": (value) => server.settings.addTier(2, value),
      "roles.tier2": (value) => server.settings.addTier(5, value),
      "roles.tier3": (value) => server.settings.addTier(10, value),
      "roles.tier4": (value) => server.settings.addTier(50, value),
    };

    /* Handle each setting given in the body. */
    const promises = Object.keys(req.body)
      .filter((key) => settings[key])
      .map((key) => settings[key](req.body[key]));
    await Promise.all(promises);
    res.status(200).json(server.settings.toJSON());
  });

  return router;
}
