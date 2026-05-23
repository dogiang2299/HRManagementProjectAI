import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Delete,
} from "@nestjs/common";
import { extractActorFromRequest } from "src/common/utils/request-actor.util";
import { CandidateCvService } from "./candidate-cv.service";
import { CreateAiDraftDto } from "./dto/create-ai-draft.dto";
import { UpdateCandidateCvDto } from "./dto/update-candidate-cv.dto";

@Controller("candidate-cvs")
export class CandidateCvController {
  constructor(private readonly candidateCvService: CandidateCvService) {}

  @Get("me")
  findMine(@Req() req: any) {
    return this.candidateCvService.findMine(extractActorFromRequest(req));
  }

  @Post("ai-draft")
  createAiDraft(@Body() body: CreateAiDraftDto, @Req() req: any) {
    return this.candidateCvService.createAiDraft(body, extractActorFromRequest(req));
  }

  @Patch(":id/complete")
  complete(@Param("id") id: string, @Req() req: any) {
    return this.candidateCvService.complete(id, extractActorFromRequest(req));
  }

  @Patch(":id/set-primary")
  setPrimary(@Param("id") id: string, @Req() req: any) {
    return this.candidateCvService.setPrimary(id, extractActorFromRequest(req));
  }

  @Patch(":id/archive")
  archive(@Param("id") id: string, @Req() req: any) {
    return this.candidateCvService.archive(id, extractActorFromRequest(req));
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() body: UpdateCandidateCvDto,
    @Req() req: any,
  ) {
    return this.candidateCvService.update(id, body, extractActorFromRequest(req));
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.candidateCvService.remove(id, extractActorFromRequest(req));
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: any) {
    return this.candidateCvService.findOne(id, extractActorFromRequest(req));
  }
}
