import { GuildMember, Snowflake } from "discord.js";
import express from "express";

import { MiddlewareLocals as GuildMiddlewareLocals } from "./guild";

import Member from "../../member";
import Makibot from "../../../Makibot";
import { getLevelV1, getLevelV2 } from "../../karma";

export interface MiddlewareLocals extends GuildMiddlewareLocals {
  guildMember: GuildMember;
  member: Member;
}

type RouterRequest<ReqBody = {}, ResBody = {}> = express.Request<
  {
    member: Snowflake;
    guild: Snowflake;
  },
  ResBody,
  ReqBody,
  {},
  MiddlewareLocals
>;

export default function memberMiddleware(makibot: Makibot): express.Router {
  const router = express.Router({ mergeParams: true });

  /* Add a middleware for extracting the member from the request object. */
  router.use((req: RouterRequest, res, next) => {
    const guildMember = res.locals.guild.members.cache.find((m) => m.id == req.params.member);
    if (guildMember) {
      const member = new Member(guildMember);
      res.locals = { ...res.locals, guildMember, member };
      next();
    } else {
      res.status(404).contentType("text/plain").send("Member Not Found");
    }
  });

  router.get("/", (req: RouterRequest, res) => {
    const { guildMember, member } = res.locals;

    res.json({
      tag: guildMember.user.tag,
      moderator: member.moderator,
      status: {
        verified: member.verified,
        warned: member.warned,
        helper: member.helper,
        canPostLinks: member.canPostLinks,
      },
    });
  });

  router.get("/karma", async (req: RouterRequest, res) => {
    const karmaStats = await res.locals.member.getKarma();

    res.json({
      level: karmaStats.level,
      points: karmaStats.points,
      offset: karmaStats.offset,
      db: {
        totalCount: karmaStats.total,
        messageCount: karmaStats.messages,
        upvoteCount: karmaStats.upvotes,
        downvoteCount: karmaStats.downvotes,
        starCount: karmaStats.stars,
        heartCount: karmaStats.hearts,
        waveCount: karmaStats.waves,
      },
    });
  });

  router.patch("/karma", async (req: RouterRequest<{ offset: string }>, res) => {
    const offset = parseInt(req.body.offset);
    if (isNaN(offset) || offset < 0) {
      res.status(400).contentType("text/plain").send("Offset must be a positive number");
    } else {
      /* Generation. */
      const karmagen = res.locals.member.tagbag.tag("karma:ver").get<string>("v1");
      const levelFormulas = {
        v1: getLevelV1,
        v2: getLevelV2,
      };
      const getLevel = levelFormulas[karmagen];

      /* Bump the offset. */
      await res.locals.member.tagbag.tag("karma:offset").set(offset);

      /* Level that the member should have based on the new karma count. */
      const totalPoints = await makibot.karma.count(req.params.member);
      const expectedLevel = getLevel(offset + totalPoints);

      /* Test if level has to be updated. */
      const currentLevel = res.locals.member.tagbag.tag("karma:level");
      if (currentLevel.get(0) != expectedLevel) {
        await currentLevel.set(expectedLevel);

        /* Test if highest level has to be updated. */
        const highScoreLevel = res.locals.member.tagbag.tag("karma:max");
        if (highScoreLevel.get(0) < expectedLevel) {
          await highScoreLevel.set(expectedLevel);
        }

        /* Update tier presence. */
        res.locals.member.setCrew(currentLevel.get(0));
      }

      res.json({
        offset: offset,
        points: offset + totalPoints,
        level: currentLevel.get(0),
      });
    }
  });

  return router;
}
