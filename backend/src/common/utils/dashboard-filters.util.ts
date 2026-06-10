import { ForbiddenException } from '@nestjs/common';

export type DashboardReportPeriod = 'month' | 'quarter' | 'ytd';
export type DashboardReportScope = 'all' | 'tech' | 'operations';

export function getDashboardPeriodStart(period: DashboardReportPeriod): Date {
  const now = new Date();

  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  if (period === 'quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
  }

  return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function isDashboardScopeMatch(
  scope: DashboardReportScope,
  department?: {
    full_name?: string | null;
    acronym_name?: string | null;
  } | null,
): boolean {
  if (scope === 'all') return true;

  const label =
    `${department?.full_name || ''} ${department?.acronym_name || ''}`
      .trim()
      .toLowerCase();

  if (scope === 'tech') {
    return (
      label.includes('tech') ||
      label.includes('it') ||
      label.includes('engineering')
    );
  }

  return (
    label.includes('operation') ||
    label.includes('ops') ||
    label.includes('hr') ||
    label.includes('finance')
  );
}

export function buildRecruitmentCompanyWhere(companyId?: string) {
  if (!companyId) return {};

  return {
    OR: [
      { department_id: companyId },
      { work_location_id: companyId },
      { positionPost: { is: { unit_id: companyId } } },
      { contactPerson: { is: { company_id: companyId } } },
    ],
  };
}

export function resolveDashboardCompanyId(
  actor?: any,
  requestedCompanyId?: string,
): string | undefined {
  const roles = getActorRoles(actor).map((role) => role.toLowerCase());
  const isEmployer = roles.includes('employer');

  if (isEmployer) {
    if (!actor?.company_id) {
      throw new ForbiddenException('No company_id for employer');
    }
    return String(actor.company_id);
  }

  const normalized = requestedCompanyId?.trim();
  return normalized || undefined;
}

function getActorRoles(actor?: any): string[] {
  if (!actor) return [];
  if (Array.isArray(actor.roles)) {
    return actor.roles.filter((role: unknown) => typeof role === 'string') as string[];
  }
  if (typeof actor.actorRole === 'string') {
    return [actor.actorRole];
  }
  return [];
}

export function isAcceptedApplicationStatus(status?: string | null): boolean {
  const normalized = (status || '').trim().toLowerCase();
  return (
    normalized === 'accepted' ||
    normalized.includes('accept') ||
    normalized.includes('pass')
  );
}
