import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { JobChatService } from "./job-chat.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { SendMessageDto } from "./dto/send-message.dto";

@Controller("job-chat")
export class JobChatController {
  constructor(private readonly jobChatService: JobChatService) {}

  @Post("session")
  createSession(@Body() _body: CreateSessionDto) {
    return this.jobChatService.createSession();
  }

  @Get("session/:id")
  getSession(@Param("id") id: string) {
    return this.jobChatService.getSession(id);
  }

  @Post("message")
  sendMessage(@Body() body: SendMessageDto) {
    if (!body || typeof body !== "object") {
      throw new BadRequestException("Request body must be a JSON object");
    }

    if (!body.sessionId) {
      throw new BadRequestException("sessionId is required");
    }

    if (!body.message) {
      throw new BadRequestException("message is required");
    }

    return this.jobChatService.handleMessage(body.sessionId, body.message);
  }
}