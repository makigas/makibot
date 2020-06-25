import express from "express";
import Makibot from "../../Makibot";

/**
 * Creates a server factory used to spawn servers. The server has endpoints
 * to be consumed by the monitoring services. Keep the memory footprint of the
 * endpoints simple and cool.
 */
export default function serverFactory(makibot: Makibot): express.Express {
  const app = express();

  /*
   * GET /healthcheck
   * Used to poke the server status. Metrics ingestion will be interested in
   * the pings of the application. Docker will be interested on whether the
   * service actually works or not.
   * Returns: HTTP 200 when the server is ready, HTTP 503 otherwise.
   */
  app.get("/healthcheck", (req, res) => {
    res.contentType("text/plain");
    if (makibot.status === 0) {
      res.status(200).send(`MAKIBOT OK, PING ${makibot.ping}`);
    } else {
      res.status(503).send(`MAKIBOT KO, SERVICE UNAVAILABLE`);
    }
  });

  return app;
}
