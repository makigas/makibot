import * as chai from "chai";
import { GuildMember, Message } from "discord.js";
import "mocha";
import { assert as sinonAssert, SinonStub, stub } from "sinon";

import MrbeastService from "../../src/hooks/beast";

const expect = chai.expect;

interface FakeMember {
  member: GuildMember;
  timeout: SinonStub;
}

interface FakeMessage {
  message: Message;
  deleteMessage: SinonStub;
}

interface FakeMessageOptions {
  channelId: string;
  timestamp: number;
  member: GuildMember;
  attachments?: number;
  bot?: boolean;
  guildId?: string;
  userId?: string;
}

function fakeMember(): FakeMember {
  const timeout = stub().resolves();
  const member = {
    disableCommunicationUntil: timeout,
  } as unknown as GuildMember;
  return { member, timeout };
}

function fakeMessage({
  channelId,
  timestamp,
  member,
  attachments = 1,
  bot = false,
  guildId = "guild-1",
  userId = "user-1",
}: FakeMessageOptions): FakeMessage {
  const deleteMessage = stub().resolves();
  const message = {
    attachments: { size: attachments },
    author: {
      bot,
      id: userId,
      tag: `${userId}#0001`,
    },
    channel: { id: channelId },
    createdTimestamp: timestamp,
    delete: deleteMessage,
    guild: { id: guildId },
    id: `${channelId}-${timestamp}`,
    inGuild: () => true,
    member,
  } as unknown as Message;
  return { message, deleteMessage };
}

async function observe(service: MrbeastService, messages: FakeMessage[]): Promise<void> {
  for (const { message } of messages) {
    await service.onMessageCreate(message);
  }
}

describe("MrbeastService", () => {
  it("timeouts the member and deletes a three-channel attachment burst", async () => {
    const service = new MrbeastService();
    const { member, timeout } = fakeMember();
    const messages = [
      fakeMessage({ channelId: "one", timestamp: 1_000, member }),
      fakeMessage({ channelId: "two", timestamp: 2_000, member }),
      fakeMessage({ channelId: "three", timestamp: 3_000, member }),
    ];

    await observe(service, messages);

    sinonAssert.calledOnce(timeout);
    expect(timeout.firstCall.args[1]).to.equal("Spam de adjuntos en varios canales");
    messages.forEach(({ deleteMessage }) => {
      sinonAssert.calledOnce(deleteMessage);
    });
  });

  it("does not trigger with only two distinct channels", async () => {
    const service = new MrbeastService();
    const { member, timeout } = fakeMember();
    const messages = [
      fakeMessage({ channelId: "one", timestamp: 1_000, member }),
      fakeMessage({ channelId: "two", timestamp: 2_000, member }),
    ];

    await observe(service, messages);

    sinonAssert.notCalled(timeout);
    messages.forEach(({ deleteMessage }) => {
      sinonAssert.notCalled(deleteMessage);
    });
  });

  it("counts channels rather than messages", async () => {
    const service = new MrbeastService();
    const { member, timeout } = fakeMember();
    const messages = [
      fakeMessage({ channelId: "one", timestamp: 1_000, member }),
      fakeMessage({ channelId: "one", timestamp: 1_500, member }),
      fakeMessage({ channelId: "two", timestamp: 2_000, member }),
      fakeMessage({ channelId: "two", timestamp: 2_500, member }),
    ];

    await observe(service, messages);

    sinonAssert.notCalled(timeout);
  });

  it("resets the burst after a gap longer than two seconds", async () => {
    const service = new MrbeastService();
    const { member, timeout } = fakeMember();
    const messages = [
      fakeMessage({ channelId: "one", timestamp: 1_000, member }),
      fakeMessage({ channelId: "two", timestamp: 3_001, member }),
      fakeMessage({ channelId: "three", timestamp: 4_000, member }),
    ];

    await observe(service, messages);

    sinonAssert.notCalled(timeout);
    messages.forEach(({ deleteMessage }) => {
      sinonAssert.notCalled(deleteMessage);
    });
  });

  it("tracks different users independently", async () => {
    const service = new MrbeastService();
    const firstMember = fakeMember();
    const secondMember = fakeMember();
    const messages = [
      fakeMessage({
        channelId: "one",
        timestamp: 1_000,
        member: firstMember.member,
        userId: "first",
      }),
      fakeMessage({
        channelId: "two",
        timestamp: 1_500,
        member: secondMember.member,
        userId: "second",
      }),
      fakeMessage({
        channelId: "three",
        timestamp: 2_000,
        member: firstMember.member,
        userId: "first",
      }),
    ];

    await observe(service, messages);

    sinonAssert.notCalled(firstMember.timeout);
    sinonAssert.notCalled(secondMember.timeout);
  });

  it("tracks different guilds independently", async () => {
    const service = new MrbeastService();
    const firstMember = fakeMember();
    const secondMember = fakeMember();
    const messages = [
      fakeMessage({
        channelId: "one",
        timestamp: 1_000,
        guildId: "first",
        member: firstMember.member,
      }),
      fakeMessage({
        channelId: "two",
        timestamp: 1_500,
        guildId: "second",
        member: secondMember.member,
      }),
      fakeMessage({
        channelId: "three",
        timestamp: 2_000,
        guildId: "first",
        member: firstMember.member,
      }),
    ];

    await observe(service, messages);

    sinonAssert.notCalled(firstMember.timeout);
    sinonAssert.notCalled(secondMember.timeout);
  });

  it("ignores bots and messages without attachments", async () => {
    const service = new MrbeastService();
    const { member, timeout } = fakeMember();
    const messages = [
      fakeMessage({ channelId: "one", timestamp: 1_000, member, bot: true }),
      fakeMessage({ channelId: "two", timestamp: 1_500, member, attachments: 0 }),
      fakeMessage({ channelId: "three", timestamp: 2_000, member, bot: true }),
    ];

    await observe(service, messages);

    sinonAssert.notCalled(timeout);
    messages.forEach(({ deleteMessage }) => {
      sinonAssert.notCalled(deleteMessage);
    });
  });

  it("continues mitigation when deleting one message fails", async () => {
    const service = new MrbeastService();
    const { member, timeout } = fakeMember();
    const messages = [
      fakeMessage({ channelId: "one", timestamp: 1_000, member }),
      fakeMessage({ channelId: "two", timestamp: 2_000, member }),
      fakeMessage({ channelId: "three", timestamp: 3_000, member }),
    ];
    messages[0].deleteMessage.rejects(new Error("Already deleted"));

    await observe(service, messages);

    sinonAssert.calledOnce(timeout);
    messages.forEach(({ deleteMessage }) => {
      sinonAssert.calledOnce(deleteMessage);
    });
  });
});
