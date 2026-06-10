import { Controller, Get, Query, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewQueryDto } from './dto/overview-query.dto';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(@Query() query: DashboardOverviewQueryDto, @Req() req?: any) {
    const actor = extractActorFromRequest(req);
    return this.dashboardService.getOverview(query, actor as any);
  }
}
