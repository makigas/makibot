import express from "express";

import Makibot from "../../../Makibot";

export default function antiraidMiddleware(makibot: Makibot): express.Router {
  const router = express.Router();

  router.get("/", (req, res) => {
    const antiraid = makibot.antiraid.raidMode;
    res.json({ antiraid });
  });

  router.post("/", async (req, res) => {
    try {
      await makibot.antiraid.setRaidMode(true);
      res.json({
        accepted: true,
        newMode: makibot.antiraid.raidMode,
      });
    } catch (e) {
      res.status(500).contentType("text/plain").send(`Error: ${e}`);
    }
  });

  router.delete("/", async (req, res) => {
    try {
      await makibot.antiraid.setRaidMode(false);
      res.json({
        accepted: true,
        newMode: makibot.antiraid.raidMode,
      });
    } catch (e) {
      res.status(500).contentType("text/plain").send(`Error: ${e}`);
    }
  });

  return router;
}
