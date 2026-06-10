import type {
  DashboardReportPeriod,
  DashboardReportScope,
} from '../../../common/utils/dashboard-filters.util';

export class DashboardOverviewQueryDto {
  companyId?: string;
  period?: DashboardReportPeriod;
  scope?: DashboardReportScope;
}
