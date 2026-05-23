import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  ChatMessage,
  ChatRole,
  ChatStep,
  JobChatSession,
} from "../job-chat.types";

@Injectable()
export class JobChatSessionService {
  private sessions = new Map<string, JobChatSession>();

  createMessage(role: ChatRole, text: string): ChatMessage {
    return {
      id: randomUUID(),
      role,
      text,
      createdAt: new Date().toISOString(),
    };
  }

  createSession(firstBotMessage: string, firstStep: ChatStep): JobChatSession {
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    const session: JobChatSession = {
      id: sessionId,
      step: firstStep,
      profile: {},
      messages: [this.createMessage("bot", firstBotMessage)],
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): JobChatSession {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException("Chat session not found");
    }

    return session;
  }

  saveSession(session: JobChatSession): JobChatSession {
    session.updatedAt = new Date().toISOString();
    this.sessions.set(session.id, session);
    return session;
  }

  appendUserMessage(sessionId: string, text: string): JobChatSession {
    const session = this.getSession(sessionId);
    session.messages.push(this.createMessage("user", text));
    return this.saveSession(session);
  }

  appendBotMessage(sessionId: string, text: string): JobChatSession {
    const session = this.getSession(sessionId);
    session.messages.push(this.createMessage("bot", text));
    return this.saveSession(session);
  }

  updateStep(sessionId: string, step: ChatStep): JobChatSession {
    const session = this.getSession(sessionId);
    session.step = step;
    return this.saveSession(session);
  }
}