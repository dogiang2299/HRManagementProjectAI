export type RecruitmentPlanPeriod = "month" | "quarter" | "ytd";
export type RecruitmentPlanScope = "all" | "tech" | "operations";

export class RecruitmentPlanQueryDto {
  period?: RecruitmentPlanPeriod;
  scope?: RecruitmentPlanScope;
}
