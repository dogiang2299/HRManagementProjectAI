export type ApplicationRejectedPeriod = "month" | "quarter" | "ytd";
export type ApplicationRejectedScope = "all" | "tech" | "operations";

export class ApplicationRejectedQueryDto {
  period?: ApplicationRejectedPeriod;
  scope?: ApplicationRejectedScope;
}
