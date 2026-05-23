import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';
import { ConversationService } from './conversation.service';
import { SendConversationMessageDto } from './dto/send-conversation-message.dto';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get('candidate')
  getCandidateConversations(@Req() req: any) {
    return this.conversationService.getCandidateConversations(extractActorFromRequest(req));
  }

  @Get('employer')
  getEmployerConversations(@Req() req: any) {
    return this.conversationService.getEmployerConversations(extractActorFromRequest(req));
  }

  @Post('application/:applicationId/open')
  openByApplication(@Param('applicationId') applicationId: string, @Req() req: any) {
    return this.conversationService.ensureConversationForApplication(
      applicationId,
      extractActorFromRequest(req),
    );
  }

  @Get(':conversationId/messages')
  getMessages(@Param('conversationId') conversationId: string, @Req() req: any) {
    return this.conversationService.getMessages(conversationId, extractActorFromRequest(req));
  }

  @Post(':conversationId/messages')
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendConversationMessageDto,
    @Req() req: any,
  ) {
    return this.conversationService.sendMessage(
      conversationId,
      dto.content,
      extractActorFromRequest(req),
    );
  }

  @Patch(':conversationId/read')
  markAsRead(@Param('conversationId') conversationId: string, @Req() req: any) {
    return this.conversationService.markAsRead(conversationId, extractActorFromRequest(req));
  }
}
