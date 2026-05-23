import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_APPLICATION, URL_API_RECRUITEMENT_INFOR } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { DashboardOverviewData } from "../types";

const REC_PAGE_SIZE = 100;

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeText = (value?: string | null) => (value || "").trim().toLowerCase();

const normalizeApplicationStatus = (status?: string | null): string => {
  const normalized = normalizeText(status).replace(/[_-]+/g, " ");

  if (normalized.includes("applied")) return "Applied";
  if (normalized.includes("in contact") || normalized.includes("contacted")) return "Contacted";
  if (normalized.includes("interview")) return "Interviewing";
  if (normalized.includes("waiting response")) return "Waiting Response";
  if (normalized.includes("accepted") || normalized === "closed" || normalized.includes("pass")) return "Accepted";
  if (normalized.includes("rejected") || normalized.includes("not suitable") || normalized.includes("fail")) return "Rejected";

  return "Applied";
};

const toRecruitmentBadgeStatus = (
  status?: string | null,
  isActive?: boolean,
): "Active" | "Reviewing" | "Paused" => {
  const normalized = normalizeText(status);

  if (["public", "internal", "active", "open"].includes(normalized)) return "Active";
  if (["draft", "reviewing", "review"].includes(normalized)) return "Reviewing";
  if (["closed", "stop_receiving", "paused", "inactive"].includes(normalized)) return "Paused";

  return isActive ? "Active" : "Paused";
};

const formatCount = (value: number) => value.toLocaleString("vi-VN");

const formatMillion = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return `${value.toFixed(1)}`;
};

const getMonthLabels = () => ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const fetchAllRecruitments = async () => {
  const rows: any[] = [];

  let page = 1;
  let totalPages = 1;

  do {
    const res = await apiClient.get(URL_API_RECRUITEMENT_INFOR, {
      params: {
        pages: page,
        items_per_pages: REC_PAGE_SIZE,
      },
    });

    const payload = res.data ?? {};
    const list = Array.isArray(payload?.data) ? payload.data : [];
    rows.push(...list);

    const totalItems = toNumber(payload?.total_items ?? rows.length);
    totalPages = Math.max(1, Math.ceil(totalItems / REC_PAGE_SIZE));
    page += 1;
  } while (page <= totalPages);

  return rows;
};

const fetchAllApplications = async () => {
  const res = await apiClient.get(URL_API_APPLICATION);
  const payload = res.data?.data ?? res.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

export const getDashboardOverview = async (): Promise<DashboardOverviewData> => {
  const [recruitments, applications] = await Promise.all([
    fetchAllRecruitments(),
    fetchAllApplications(),
  ]);

  const totalRecruitments = recruitments.length;
  const totalApplications = applications.length;

  const applicationStatusBuckets: Record<string, number> = {
    Applied: 0,
    Reviewing: 0,
    Contacted: 0,
    Interviewing: 0,
    "Waiting Response": 0,
    Accepted: 0,
    Rejected: 0,
  };

  const monthLabels = getMonthLabels();
  const monthCounts = new Array(12).fill(0) as number[];
  const currentYear = new Date().getFullYear();

  const applicationCountByRecruitment = new Map<string, number>();
  const acceptedCountByRecruitment = new Map<string, number>();

  applications.forEach((item: any) => {
    const statusLabel = normalizeApplicationStatus(item?.status);
    applicationStatusBuckets[statusLabel] = (applicationStatusBuckets[statusLabel] || 0) + 1;

    const recruitmentId = item?.recruitment_infor_id;
    if (recruitmentId) {
      applicationCountByRecruitment.set(
        recruitmentId,
        (applicationCountByRecruitment.get(recruitmentId) || 0) + 1,
      );

      if (statusLabel === "Accepted") {
        acceptedCountByRecruitment.set(
          recruitmentId,
          (acceptedCountByRecruitment.get(recruitmentId) || 0) + 1,
        );
      }
    }

    const createdAt = item?.created_at ? new Date(item.created_at) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime()) && createdAt.getFullYear() === currentYear) {
      monthCounts[createdAt.getMonth()] += 1;
    }
  });

  const acceptedCandidates = applicationStatusBuckets.Accepted || 0;

  const costBucket = new Map<string, number>();
  let totalCost = 0;

  recruitments.forEach((rec: any) => {
    const costs = Array.isArray(rec?.recruitmentCosts) ? rec.recruitmentCosts : [];

    costs.forEach((cost: any) => {
      const amount = toNumber(cost?.amount);
      if (!amount) return;

      totalCost += amount;
      const type = (cost?.cost_type || "Other").trim() || "Other";
      costBucket.set(type, (costBucket.get(type) || 0) + amount);
    });
  });

  const activeRecruitments = recruitments.filter((rec: any) =>
    toRecruitmentBadgeStatus(rec?.status, rec?.is_active) === "Active",
  ).length;

  const avgApplicationsPerRole = totalRecruitments > 0 ? totalApplications / totalRecruitments : 0;
  const hiringRate = totalApplications > 0 ? (acceptedCandidates / totalApplications) * 100 : 0;
  const avgCostPerAccepted = acceptedCandidates > 0 ? totalCost / acceptedCandidates : 0;

  const statCards = [
    {
      title: "Total Recruitments",
      value: formatCount(totalRecruitments),
      change: "Live",
      note: `${formatCount(activeRecruitments)} campaigns active`,
    },
    {
      title: "Total Applications",
      value: formatCount(totalApplications),
      change: "Live",
      note: `Average ${avgApplicationsPerRole.toFixed(1)} candidates per role`,
    },
    {
      title: "Accepted Candidates",
      value: formatCount(acceptedCandidates),
      change: "Live",
      note: `Hiring rate ${hiringRate.toFixed(1)}% overall`,
    },
    {
      title: "Recruitment Cost",
      value: formatMillion(totalCost),
      change: "Live",
      note: `Average ${formatMillion(avgCostPerAccepted)} per accepted candidate`,
    },
  ];

  const applicationStatusData = [
    { name: "Applied", value: applicationStatusBuckets.Applied || 0 },
    { name: "Reviewing", value: applicationStatusBuckets.Reviewing || 0 },
    { name: "Contacted", value: applicationStatusBuckets.Contacted || 0 },
    { name: "Interviewing", value: applicationStatusBuckets.Interviewing || 0 },
    { name: "Waiting Response", value: applicationStatusBuckets["Waiting Response"] || 0 },
    { name: "Accepted", value: applicationStatusBuckets.Accepted || 0 },
    { name: "Rejected", value: applicationStatusBuckets.Rejected || 0 },
  ];

  const applicationTrendData = monthLabels.map((month, index) => ({
    month,
    applications: monthCounts[index],
  }));

  const recruitmentCostData = Array.from(costBucket.entries())
    .map(([type, amount]) => ({ type, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const planByPosition = new Map<string, { position: string; plan: number; hired: number }>();

  recruitments.forEach((rec: any) => {
    const position =
      rec?.positionPost?.name_post ||
      rec?.post_title ||
      rec?.internal_title ||
      "Unassigned";

    const plans = Array.isArray(rec?.recruitmentPlans) ? rec.recruitmentPlans : [];

    const planFromTotalNeeded = toNumber(rec?.total_needed);
    const planFromParents = plans.reduce((sum: number, parent: any) => {
      const fromParent = toNumber(parent?.total_real_number);
      const fromBatches = Array.isArray(parent?.recruitmentPlanChildBatches)
        ? parent.recruitmentPlanChildBatches.reduce(
            (batchSum: number, batch: any) => batchSum + toNumber(batch?.number_recruitment),
            0,
          )
        : 0;

      return sum + fromParent + fromBatches;
    }, 0);

    const plan = planFromTotalNeeded || planFromParents;
    const hired = acceptedCountByRecruitment.get(rec?.id) || 0;

    if (!planByPosition.has(position)) {
      planByPosition.set(position, { position, plan: 0, hired: 0 });
    }

    const existing = planByPosition.get(position)!;
    existing.plan += plan;
    existing.hired += hired;
  });

  const planProgressData = Array.from(planByPosition.values())
    .filter((item) => item.plan > 0 || item.hired > 0)
    .sort((a, b) => b.plan - a.plan)
    .slice(0, 5);

  const recentRecruitments = [...recruitments]
    .sort((a: any, b: any) => {
      const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 8)
    .map((item: any) => ({
      code: item?.recruitment_code || "-",
      title: item?.post_title || item?.internal_title || "Untitled recruitment listing",
      department:
        item?.department?.full_name ||
        item?.department_name ||
        "Unspecified department",
      applications: applicationCountByRecruitment.get(item?.id) || 0,
      status: toRecruitmentBadgeStatus(item?.status, item?.is_active),
    }));

  return {
    statCards,
    applicationStatusData,
    applicationTrendData,
    recruitmentCostData,
    planProgressData,
    recentRecruitments,
    updatedAt: new Date().toISOString(),
  };
};

export const useDashboardOverview = (
  config?: Omit<
    UseQueryOptions<DashboardOverviewData, Error, DashboardOverviewData, ["dashboard-overview"]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
    staleTime: 60 * 1000,
    ...config,
  });
};
