import { CommandInteraction, CacheType, MessageEmbed } from "discord.js";
import { CommandInteractionHandler } from "../../lib/interaction";
import axios, { AxiosResponse } from "axios";
import { createToast } from "../../lib/response";
import logger from "../../lib/logger";

/*
Videos API
Command: `/makigas video [q]
Resquest: https://www.makigas.es/videos.json?q=:q


BBS API
Command: `/makigas bbs [q]`
https://bbs.makigas.es/api/discussions?filter[q]=:q


https://discord.com/api/v9/applications/{application.id}/commands
-H "autorization: Bot {bot token}"

End point body:
{
   "name": "makigas",
   "type": 1,
   "description": "Buscador de makigas",
   "options": [
      {
         "name": "busqueda",
         "description": "Tipo de búsqueda",
         "type": 3,
         "required": true,
         "choices": [
            {
               "name": "Vídeo",
               "value": "video"
            },
            {
               "name": "BBS",
               "value": "bbs"
            }
         ]
      },
      {
         "name": "q",
         "description": "¿Qué deseas buscar?",
         "type": 3,
         "required": true
      }
   ]
}

*/

const MAX_SEARCH_RESULT_VIDEOAPI = 3;
const MAX_SEARCH_RESULT_BBSAPI = 5;

//Typing the "makigas.es/videos.json" api
class VideoAPI {
  public videos: Video[];
}

class Video {
  public title: string;
  public description: string;
  public _links: {
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

//Typing the "bbs.makigas.es/api/discussions?filter[q]={q}" api

class BBSAPI {
  data: BBS[];
}

class BBS {
  attributes: {
    title: string;
    slug: string;
  };
}

export default class SearchMakigasESCommand implements CommandInteractionHandler {
  name = "makigas";

  async handle(command: CommandInteraction<CacheType>): Promise<void> {
    return this.command(command);
  }

  command(command: CommandInteraction) {
    const searchType = command.options.getString("busqueda", true);
    const query = command.options.getString("q", true);

    if (searchType == "video") {
      return this.requestVideo(command, query);
    }

    return this.requestBBS(command, query);
  }

  requestBBS(command: CommandInteraction, query: string) {
    const url = `https://bbs.makigas.es/api/discussions?filter[q]=${query}`;
    this.request(url)
      .then((res: AxiosResponse<BBSAPI, void>) => {
        const discussions = res.data.data;
        if (discussions.length == 0) {
          command.reply({
            embeds: [this.createToastNoResults()],
          });
          return;
        }
        const embeds = discussions.slice(0, MAX_SEARCH_RESULT_BBSAPI).map(this.createToastsBBS);

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

  createToastsBBS(bbs: BBS): MessageEmbed {
    return createToast({
      title: bbs.attributes.title,
      description: `https://bbs.makigas.es/d/${bbs.attributes.slug}`,
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
