import express from "express";
import Makibot from "../../../Makibot";
import { MiddlewareLocals as GuildMiddlewareLocals } from "./guild";

type RouterRequest<ReqBody = unknown, ResBody = unknown> = express.Request<
  {
    id: string;
  },
  ResBody,
  ReqBody,
  unknown,
  GuildMiddlewareLocals
>;

export default function linkOnlyChannels(makibot: Makibot): express.Router {
  const router = express.Router({ mergeParams: true });

  /* List all the thread channels. */
  router.get("/", async (req: RouterRequest<unknown, { channels: string[] }>, res) => {
    const value: string[] = await res.locals.server.tagbag.tag("linkchannels").get([]);
    return res.status(200).json({ channels: value });
  });

  router.post("/", async (req: RouterRequest<{ channel: string }>, res) => {
    const value: string[] = await res.locals.server.tagbag.tag("linkchannels").get([]);
    const newValue = [...new Set([...value, req.body.channel])];
    await res.locals.server.tagbag.tag("linkchannels").set(newValue);
    return res.status(202).send("OK");
  });

  router.delete("/:id", async (req: RouterRequest<{ id: string }>, res) => {
    const oldValue: string[] = await res.locals.server.tagbag.tag("linkchannels").get([]);
    const newValue = oldValue.filter((channel) => channel != req.params.id);
    await res.locals.server.tagbag.tag("linkchannels").set(newValue);
    return res.status(200).send("OK");
  });

  return router;
}
