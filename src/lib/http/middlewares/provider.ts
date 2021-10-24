import express from "express";

import Makibot from "../../../Makibot";
import { MiddlewareLocals as GuildMiddlewareLocals } from "./guild";

type RouterRequest<ReqBody = unknown, ResBody = unknown> = express.Request<
  {
    tag: string;
  },
  ResBody,
  ReqBody,
  unknown,
  GuildMiddlewareLocals
>;

export default function providerMiddleware(makibot: Makibot): express.Router {
  const router = express.Router({ mergeParams: true });

  router.get("/", (req: RouterRequest, res) => {
    const value = makibot.provider.get(res.locals.guild.id, req.params.tag, undefined);
    if (typeof value === "undefined") {
      res.status(404).contentType("text/plain").send("tag not found");
    } else {
      res.status(200).contentType("application/json").json(value);
    }
  });

  router.put("/", async (req: RouterRequest<{ value: unknown }>, res) => {
    if (req.body.value) {
      await makibot.provider.set(res.locals.guild.id, req.params.tag, req.body.value);
      return res.status(204).contentType("text/plain").send();
    } else {
      return res.status(400).contentType("text/plain").send("invalid body");
    }
  });

  router.delete("/", async (req: RouterRequest, res) => {
    await makibot.provider.remove(res.locals.guild.id, req.params.tag);
    return res.status(204).contentType("text/plain").send();
  });

  return router;
}
