import { CommandInteraction, CacheType, MessageEmbed } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import axios, { AxiosResponse } from "axios";
import { createToast } from "../../lib/response";
import logger from "../../lib/logger";
import { SlashCommandBuilder } from "@discordjs/builders";

/*
Videos API
Command: `/makigas video [q]
Resquest: https://www.makigas.es/videos.json?q=:q


Foro API
Command: `/makigas foro [q]`
https://foro.makigas.es/api/discussions?filter[q]=:q
*/

const MAX_SEARCH_RESULT_VIDEOAPI = 3;
const MAX_SEARCH_RESULT_FOROAPI = 5;

//Typing the "makigas.es/videos.json" api
interface VideoAPI {
  videos: Video[];
}

interface Video {
  title: string;
  description: string;
  _links: {
    self: {
      href: string;
    };
    shortlink: {
      href: string;
    };
    icon: {
      href: string;
      type: string;
      sizes: string;
    };
  };
}

//Typing the "foro.makigas.es/api/discussions?filter[q]={q}" api

interface ForoAPI {
  data: Foro[];
}

interface Foro {
  attributes: {
    title: string;
    slug: string;
  };
}

export default class SearchMakigasESCommand implements CommandInteractionHandler {
  name = "makigas";

  build() {
    return new SlashCommandBuilder()
      .setName("makigas")
      .setDescription("Buscador de makigas")
      .addStringOption((o) =>
        o
          .setName("busqueda")
          .setDescription("Tipo de búsqueda")
          .setChoices({ name: "Vídeo", value: "video" }, { name: "Foro", value: "foro" })
          .setRequired(true),
      )
      .addStringOption((o) =>
        o.setName("q").setDescription("¿Qué deseas buscar?").setRequired(true),
      );
  }

  async handle(command: CommandInteraction<CacheType>): Promise<void> {
    const searchType = command.options.getString("busqueda", true);
    const query = command.options.getString("q", true);

    if (searchType == "video") {
      return this.requestVideo(command, query);
    }

    return this.requestForo(command, query);
  }

  requestForo(command: CommandInteraction, query: string) {
    const url = `https://foro.makigas.es/api/discussions?filter[q]=${query}`;
    this.request(url)
      .then((res: AxiosResponse<ForoAPI, void>) => {
        const discussions = res.data.data;
        if (discussions.length == 0) {
          command.reply({
            embeds: [this.createToastNoResults()],
          });
          return;
        }
        const embeds = discussions.slice(0, MAX_SEARCH_RESULT_FOROAPI).map(this.createToastForo);

        command.reply({
          embeds,
        });
      })
      .catch((err) => {
        command.reply({
          embeds: [this.createToastError()],
        });
        logger.error(err);
      });
  }

  requestVideo(command: CommandInteraction, query: string) {
    const url = `https://makigas.es/videos.json?q=${query}`;
    this.request(url)
      .then((res: AxiosResponse<VideoAPI, void>) => {
        const videos = res.data.videos;
        if (videos.length == 0) {
          command.reply({
            embeds: [this.createToastNoResults()],
          });
          return;
        }
        const embeds = videos.slice(0, MAX_SEARCH_RESULT_VIDEOAPI).map(this.createToastsVideo);

        command.reply({
          embeds,
        });
      })
      .catch((err) => {
        command.reply({
          embeds: [this.createToastError()],
        });
        logger.error(err);
      });
  }

  request(url: string) {
    return axios.get(url);
  }

  createToastNoResults(): MessageEmbed {
    return createToast({
      title: "Sin resultados",
      description: "No se encontraron resultados",
    });
  }

  createToastsVideo(video: Video): MessageEmbed {
    return createToast({
      title: video.title,
      description: `${video.description} \n https://makigas.es${video._links.shortlink.href}`,
      severity: "success",
      thumbnail: video._links.icon.href,
    });
  }

  createToastForo(foro: Foro): MessageEmbed {
    return createToast({
      title: foro.attributes.title,
      description: `https://foro.makigas.es/d/${foro.attributes.slug}`,
      severity: "success",
    });
  }

  createToastError(): MessageEmbed {
    return createToast({
      title: "Error",
      description: "No se logró obtener los datos en este momento",
      severity: "error",
    });
  }
}
