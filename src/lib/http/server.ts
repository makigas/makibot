import express from "express";
import Makibot from "../../Makibot";

import guildMiddleware from "./middlewares/guild";

/**
 * Creates a server factory used to spawn servers. The server has endpoints
 * to be consumed by the monitoring services. Keep the memory footprint of the
 * endpoints simple and cool.
 */
export default function serverFactory(makibot: Makibot): express.Express {
  const app = express();

  app.use(express.json());

  /*
   * GET /healthcheck
   * Used to poke the server status. Metrics ingestion will be interested in
   * the pings of the application. Docker will be interested on whether the
   * service actually works or not.
   * Returns: HTTP 200 when the server is ready, HTTP 503 otherwise.
   */
  app.get("/healthcheck", (req, res) => {
    res.contentType("text/plain");
    if (makibot.ws.status === 0) {
      res.status(200).send(`MAKIBOT OK, PING ${makibot.ws.ping}`);
    } else {
      res.status(503).send(`MAKIBOT KO, SERVICE UNAVAILABLE`);
    }
  });

  app.get("/guilds", (req, res) => {
    res.json(
      makibot.guilds.cache.map((guild) => ({
        id: guild.id,
        name: guild.name,
      })),
    );
  });

  app.use("/guilds/:guild", guildMiddleware(makibot));

  return app;
}
