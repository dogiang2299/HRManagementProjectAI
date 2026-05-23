export type RecruitmentCostPeriod = "month" | "quarter" | "ytd";
export type RecruitmentCostScope = "all" | "tech" | "operations";

export class RecruitmentCostQueryDto {
  period?: RecruitmentCostPeriod;
  scope?: RecruitmentCostScope;
}
