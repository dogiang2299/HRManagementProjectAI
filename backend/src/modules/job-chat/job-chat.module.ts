import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { JobChatController } from "./job-chat.controller";
import { JobChatService } from "./job-chat.service";
import { JobChatSessionService } from "./services/job-chat-session.service";
import { JobChatParserService } from "./services/job-chat-parser.service";
import { JobChatMatcherService } from "./services/job-chat-matcher.service";
import { JobChatKnowledgeService } from "./services/job-chat-knowledge.service";

@Module({
  controllers: [JobChatController],
  providers: [
    PrismaService,
    JobChatService,
    JobChatSessionService,
    JobChatParserService,
    JobChatMatcherService,
    JobChatKnowledgeService,
  ],
  exports: [JobChatService],
})
export class JobChatModule {}