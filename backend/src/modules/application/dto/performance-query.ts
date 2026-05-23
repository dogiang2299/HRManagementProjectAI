export type ApplicationPerformancePeriod = "month" | "quarter" | "ytd";
export type ApplicationPerformanceScope = "all" | "tech" | "operations";

export class ApplicationPerformanceQueryDto {
  period?: ApplicationPerformancePeriod;
  scope?: ApplicationPerformanceScope;
}
