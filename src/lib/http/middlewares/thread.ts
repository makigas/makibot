import express from "express";
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

export default function threadOnlyChannels(): express.Router {
  const router = express.Router({ mergeParams: true });

  /* List all the thread channels. */
  router.get("/", async (req: RouterRequest<unknown, { channels: string[] }>, res) => {
    const value = await res.locals.server.threadChannelManager.get();
    return res.status(200).json({ channels: value });
  });

  router.post("/", async (req: RouterRequest<{ id: string }>, res) => {
    await res.locals.server.threadChannelManager.add(req.body.id);
    return res.status(202).send("OK");
  });

  router.delete("/:id", async (req: RouterRequest<{ id: string }>, res) => {
    await res.locals.server.threadChannelManager.delete(req.body.id);
    return res.status(200).send("OK");
  });

  return router;
}
