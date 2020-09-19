import express from "express";
import Makibot from "../../Makibot";
import Server from "../server";

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
    if (makibot.status === 0) {
      res.status(200).send(`MAKIBOT OK, PING ${makibot.ping}`);
    } else {
      res.status(503).send(`MAKIBOT KO, SERVICE UNAVAILABLE`);
    }
  });

  app.get("/guilds", (req, res) => {
    res.json(
      makibot.guilds.map((guild) => ({
        id: guild.id,
        name: guild.name,
      }))
    );
  });

  app.get("/guilds/:guild", (req, res) => {
    const guild = makibot.guilds.find((g) => g.id == req.params.guild);
    if (guild) {
      const server = new Server(guild);
      res.json(server.toJSON());
    } else {
      res.status(404).contentType("text/plain").send("Not Found");
    }
  });

  app.get("/guilds/:guild/settings", (req, res) => {
    const guild = makibot.guilds.find((g) => g.id == req.params.guild);
    if (!guild) {
      return res.status(404).contentType("text/plain").send("Not Found");
    }

    const server = new Server(guild);
    return res.json(server.settings.toJSON());
  });

  app.patch("/guilds/:guild/settings", (req, res) => {
    const guild = makibot.guilds.find((g) => g.id == req.params.guild);
    if (!guild) {
      return res.status(404).contentType("text/plain").send("Not Found");
    }

    const server = new Server(guild);
    Object.keys(req.body).forEach((prop) => {
      switch (prop) {
        case "pin.pinboard":
          server.settings.setPinPinboard(req.body["pin.pinboard"]);
          break;
        case "pin.emoji":
          server.settings.setPinEmoji(req.body["pin.emoji"]);
          break;
      }
    });
    res.status(200).json(server.settings.toJSON());
  });

  return app;
}
