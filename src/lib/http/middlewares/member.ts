import { GuildMember } from "discord.js";
import express from "express";

import { MiddlewareLocals as GuildMiddlewareLocals } from "./guild";

import Member from "../../Member";
import Makibot from "../../../Makibot";
import { getLevel } from "../../karma";

export interface MiddlewareLocals extends GuildMiddlewareLocals {
  guildMember: GuildMember;
  member: Member;
}

type RouterRequest<ReqBody = {}, ResBody = {}> = express.Request<
  {
    member: string;
    guild: string;
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
        trusted: member.trusted,
        warned: member.warned,
        helper: member.helper,
        canPostLinks: member.canPostLinks,
      },
    });
  });

  router.get("/karma", async (req: RouterRequest, res) => {
    const totalCount = await makibot.karma.count(req.params.member);
    const messageCount = await makibot.karma.count(req.params.member, { kind: "message" });
    const upvoteCount = await makibot.karma.count(req.params.member, { kind: "upvote" });
    const downvoteCount = await makibot.karma.count(req.params.member, { kind: "downvote" });
    const starCount = await makibot.karma.count(req.params.member, { kind: "star" });

    const offset = res.locals.member.tagbag.tag("karma:offset").get(0);
    const level = res.locals.member.tagbag.tag("karma:level").get(0);
    const points = totalCount + offset;

    res.json({
      level,
      points,
      offset,
      db: {
        totalCount,
        messageCount,
        upvoteCount,
        downvoteCount,
        starCount,
      },
    });
  });

  router.patch("/karma", async (req: RouterRequest<{ offset: string }>, res) => {
    const offset = parseInt(req.body.offset);
    if (isNaN(offset) || offset < 0) {
      res.status(400).contentType("text/plain").send("Offset must be a positive number");
    } else {
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
