import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

@Injectable()
export class JobChatKnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(JobChatKnowledgeService.name);

  async onModuleInit() {
    // Sau này bạn có thể load:
    // - skill mapping clean
    // - occupation taxonomy
    // - processed job profiles
    this.logger.log("JobChatKnowledgeService initialized");
  }
}