import { Injectable } from "@nestjs/common";
import { JobChatSessionService } from "./services/job-chat-session.service";
import { JobChatParserService } from "./services/job-chat-parser.service";
import { JobChatMatcherService } from "./services/job-chat-matcher.service";

@Injectable()
export class JobChatService {
  constructor(
    private readonly sessionService: JobChatSessionService,
    private readonly parserService: JobChatParserService,
    private readonly matcherService: JobChatMatcherService,
  ) {}

  createSession() {
    const firstStep = "ask_position" as const;
    const firstMessage = this.parserService.getBotQuestion(firstStep);

    return this.sessionService.createSession(firstMessage, firstStep);
  }

  getSession(sessionId: string) {
    return this.sessionService.getSession(sessionId);
  }

async handleMessage(sessionId: string, message: string) {
  let session = this.sessionService.appendUserMessage(sessionId, message);

  const extracted = this.parserService.extractAllFromMessage(message);

  const hasNewCriteria =
    !!extracted.desiredPosition ||
    !!extracted.location ||
    !!extracted.jobType ||
    ((extracted.salaryMin !== null && extracted.salaryMin !== undefined) ||
      (extracted.salaryMax !== null && extracted.salaryMax !== undefined)) ||
    extracted.skills.length > 0 ||
    (extracted.experienceYears !== null &&
      extracted.experienceYears !== undefined);

  session.profile = this.parserService.mergeExtractedDataIntoProfile(
    session.profile,
    session.step,
    message,
  );

  // Nếu session đã completed mà user vẫn nhắn thêm tiêu chí mới
  // thì coi như họ đang chỉnh lại điều kiện và chạy lại flow
  if (session.step === "completed" && hasNewCriteria) {
    session.step = "confirm";
    session = this.sessionService.saveSession(session);

    session = this.sessionService.appendBotMessage(
      sessionId,
      "I have updated your preferences. Let me suggest the most suitable jobs again.",
    );

    const recommendations = await this.matcherService.recommendJobs(
      session.profile,
    );

    session.step = "completed";
    session = this.sessionService.saveSession(session);

    if (recommendations.length === 0) {
      session = this.sessionService.appendBotMessage(
        sessionId,
        "I haven't found any jobs that match your updated criteria. You can try expanding your search by adjusting the position, location, or salary range.",
      );
    } else {
      session = this.sessionService.appendBotMessage(
        sessionId,
        `I found ${recommendations.length} jobs that might be a good fit for your updated preferences.`
      );
    }

    return {
      session,
      recommendations,
    };
  }

  const nextStep = this.parserService.getNextStep(session.profile);
  session.step = nextStep;
  session = this.sessionService.saveSession(session);

  if (nextStep === "confirm") {
    session = this.sessionService.appendBotMessage(
      sessionId,
      this.parserService.getBotQuestion("confirm"),
    );

    const recommendations = await this.matcherService.recommendJobs(
      session.profile,
    );

    session.step = "completed";
    session = this.sessionService.saveSession(session);

    if (recommendations.length === 0) {
      session = this.sessionService.appendBotMessage(
        sessionId,
        "I haven't found any jobs that match your updated criteria. You can try expanding your search by adjusting the position, location, or salary range.",
      );
    } else {
      session = this.sessionService.appendBotMessage(
        sessionId,
        `I found ${recommendations.length} jobs that might be a good fit for your updated preferences.`,
      );
    }

    return {
      session,
      recommendations,
    };
  }

  const nextQuestion = this.parserService.getBotQuestion(nextStep);
  session = this.sessionService.appendBotMessage(sessionId, nextQuestion);

  return {
    session,
    recommendations: [],
  };
};
}