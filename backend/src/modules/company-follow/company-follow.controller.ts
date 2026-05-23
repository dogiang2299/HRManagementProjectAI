import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { CompanyFollowService } from "./company-follow.service";
import { extractActorFromRequest } from "src/common/utils/request-actor.util";

@Controller("company-follow")
export class CompanyFollowController {
  constructor(private readonly companyFollowService: CompanyFollowService) {}

  private getActorEmployeeId(req: any) {
    const actor = extractActorFromRequest(req);

    if (!actor?.actorEmployeeId) {
      throw new UnauthorizedException("Unauthorized");
    }

    return actor.actorEmployeeId;
  }

  @Post(":companyId")
  followCompany(
    @Param("companyId") companyId: string,
    @Req() req: any,
  ) {
    const employeeId = this.getActorEmployeeId(req);
    return this.companyFollowService.followCompanyByEmployee(employeeId, companyId);
  }

  @Delete(":companyId")
  unfollowCompany(
    @Param("companyId") companyId: string,
    @Req() req: any,
  ) {
    const employeeId = this.getActorEmployeeId(req);
    return this.companyFollowService.unfollowCompanyByEmployee(employeeId, companyId);
  }

  @Get(":companyId/status")
  getFollowStatus(
    @Param("companyId") companyId: string,
    @Req() req: any,
  ) {
    const employeeId = this.getActorEmployeeId(req);
    return this.companyFollowService.getFollowStatusByEmployee(employeeId, companyId);
  }

  @Get(":companyId/count")
  getFollowerCount(@Param("companyId") companyId: string) {
    return this.companyFollowService.getFollowerCount(companyId);
  }

  @Get(":companyId/summary")
  getFollowSummary(
    @Param("companyId") companyId: string,
    @Req() req: any,
  ) {
    const employeeId = this.getActorEmployeeId(req);
    return this.companyFollowService.getFollowSummaryByEmployee(employeeId, companyId);
  }
}