import { Guild } from "discord.js";
import express from "express";

import Makibot from "../../../Makibot";
import Server from "../../server";
import memberMiddleware from "./member";
import providerMiddleware from "./provider";
import voiceRoleMiddleware from "./voiceroles";

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
  router.get("/", async (req, res) => {
    res.json(await res.locals.server.toJSON());
  });

  router.use("/members/:member", memberMiddleware(makibot));
  router.use("/roles/voices", voiceRoleMiddleware(makibot));
  router.use("/provider/:tag", providerMiddleware(makibot));

  /* Print current settings for the server. */
  router.get("/settings", async (req, res) => {
    res.json(await res.locals.server.settings.toJSON());
  });

  /* Patch settings for the server. */
  // eslint-disable-next-line @typescript-eslint/ban-types
  router.patch("/settings", async (req: express.Request<{}, {}, {}, {}, MiddlewareLocals>, res) => {
    const { server } = res.locals;

    const settings: { [prop: string]: (value: string) => Promise<void> } = {
      "pin.pinboard": (value) => server.settings.setPinPinboard(value),
      "pin.emoji": (value) => server.settings.setPinEmoji(value),
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
    res.status(200).json(await server.settings.toJSON());
  });

  return router;
}
