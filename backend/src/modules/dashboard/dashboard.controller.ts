import { Controller, Get, Query, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(@Query('companyId') companyId?: string, @Req() req?: any) {
    const actor = extractActorFromRequest(req);
    return this.dashboardService.getOverview(companyId, actor as any);
  }
}
