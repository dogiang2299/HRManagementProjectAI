import { APPLICATION_STATUS_STEPS } from "../../../../constant";
import type { ICandidate } from "../types";

type CandidateWithApplications = ICandidate & {
	applications?: unknown[];
	applications_summary?: {
		totalApplications?: number;
		total_applications?: number;
		distinctPositions?: number;
		distinct_positions?: number;
		distinctJobPosts?: number;
		distinct_job_posts?: number;
		distinctCompanies?: number;
		distinct_companies?: number;
	} | null;
};

type ApplicationLike = {
	id?: string;
	status?: string | null;
	applied_at?: string | Date | null;
	created_at?: string | Date | null;
	recruitment_infor?: {
		id?: string | null;
		post_title?: string | null;
		internal_title?: string | null;
		recruitment_code?: string | null;
		positionPost?: { name_post?: string | null } | null;
		position?: { name?: string | null } | null;
		position_name?: string | null;
		company?: {
			id?: string | null;
			name?: string | null;
			company_name?: string | null;
		} | null;
		company_id?: string | null;
	} | null;
};

export type CandidateApplicationSummary = {
	totalApplications: number;
	distinctPositions: number;
	distinctJobPosts: number;
	distinctCompanies: number;
};

const rejectedIndex = APPLICATION_STATUS_STEPS.findIndex(
	(step) => step.value === "rejected",
);

const acceptedIndex = APPLICATION_STATUS_STEPS.findIndex(
	(step) => step.value === "accepted",
);

const contactedIndex = APPLICATION_STATUS_STEPS.findIndex(
	(step) => step.value === "contacted",
);

export const EXTRA_STATUS_TO_INDEX: Record<string, number> = {
	"not suitable": rejectedIndex,
	"closed": acceptedIndex,
	"in contact": contactedIndex,
};

export const normalizeStatus = (value?: string) => {
	if (!value) return "";
	return value.trim().toLowerCase();
};

export const getApplicationStatusIndex = (status?: string) => {
	const normalized = normalizeStatus(status);
	if (!normalized) return -1;

	const fromSteps = APPLICATION_STATUS_STEPS.findIndex(
		(step) => normalizeStatus(step.value) === normalized,
	);

	if (fromSteps >= 0) return fromSteps;
	return EXTRA_STATUS_TO_INDEX[normalized] ?? -1;
};

export const getNextApplicationStatus = (status?: string) => {
	const currentIndex = getApplicationStatusIndex(status);
	if (currentIndex < 0) return APPLICATION_STATUS_STEPS[0].value;
	const nextIndex = Math.min(currentIndex + 1, APPLICATION_STATUS_STEPS.length - 1);
	return APPLICATION_STATUS_STEPS[nextIndex].value;
};

export const getPrevApplicationStatus = (status?: string) => {
	const currentIndex = getApplicationStatusIndex(status);
	if (currentIndex < 0) return APPLICATION_STATUS_STEPS[0].value;
	const prevIndex = Math.max(currentIndex - 1, 0);
	return APPLICATION_STATUS_STEPS[prevIndex].value;
};

const parseRating = (value: number | string | undefined | null) => {
	const numeric = Number(value ?? 0);
	return Number.isFinite(numeric) ? numeric : 0;
};

const parseTimestamp = (value?: string | Date | null) => {
	if (!value) return 0;
	const time = new Date(value).getTime();
	return Number.isFinite(time) ? time : 0;
};

export const getCandidateApplications = (candidate: ICandidate) => {
	if (Array.isArray(candidate.statusApplication)) {
		return candidate.statusApplication as ApplicationLike[];
	}

	const candidateAny = candidate as CandidateWithApplications;
	if (Array.isArray(candidateAny.applications)) {
		return candidateAny.applications as ApplicationLike[];
	}

	return [] as ApplicationLike[];
};

export const getLatestCandidateApplication = (candidate: ICandidate) => {
	const applications = getCandidateApplications(candidate);
	if (!applications.length) return null;

	const sorted = [...applications].sort((a, b) => {
		const aApplied = parseTimestamp(a.applied_at);
		const bApplied = parseTimestamp(b.applied_at);
		if (aApplied !== bApplied) return bApplied - aApplied;

		const aCreated = parseTimestamp(a.created_at);
		const bCreated = parseTimestamp(b.created_at);
		return bCreated - aCreated;
	});

	return sorted[0] ?? null;
};

export const getCandidateApplicationSummary = (
	candidate: ICandidate,
): CandidateApplicationSummary => {
	const candidateAny = candidate as CandidateWithApplications;
	const providedSummary = candidateAny.applications_summary;

	if (providedSummary) {
		return {
			totalApplications:
				providedSummary.totalApplications ?? providedSummary.total_applications ?? 0,
			distinctPositions:
				providedSummary.distinctPositions ?? providedSummary.distinct_positions ?? 0,
			distinctJobPosts:
				providedSummary.distinctJobPosts ?? providedSummary.distinct_job_posts ?? 0,
			distinctCompanies:
				providedSummary.distinctCompanies ?? providedSummary.distinct_companies ?? 0,
		};
	}

	const applications = getCandidateApplications(candidate);

	const positionSet = new Set<string>();
	const jobPostSet = new Set<string>();
	const companySet = new Set<string>();

	for (const app of applications) {
		const recruitmentInfor = app?.recruitment_infor;
		if (!recruitmentInfor) continue;

		const positionName =
			recruitmentInfor.positionPost?.name_post ??
			recruitmentInfor.position?.name ??
			recruitmentInfor.position_name ??
			null;
		if (positionName) {
			positionSet.add(String(positionName).trim().toLowerCase());
		}

		const jobPostKey =
			recruitmentInfor.id ??
			recruitmentInfor.post_title ??
			recruitmentInfor.internal_title ??
			recruitmentInfor.recruitment_code ??
			null;
		if (jobPostKey) {
			jobPostSet.add(String(jobPostKey).trim().toLowerCase());
		}

		const companyKey =
			recruitmentInfor.company?.id ??
			recruitmentInfor.company_id ??
			recruitmentInfor.company?.company_name ??
			recruitmentInfor.company?.name ??
			null;
		if (companyKey) {
			companySet.add(String(companyKey).trim().toLowerCase());
		}
	}

	return {
		totalApplications: applications.length,
		distinctPositions: positionSet.size,
		distinctJobPosts: jobPostSet.size,
		distinctCompanies: companySet.size,
	};
};

export const getCandidateRecruitmentPosition = (candidate: ICandidate) => {
	const latest = getLatestCandidateApplication(candidate);
	return latest?.recruitment_infor?.positionPost?.name_post ?? "-";
};

export const getCandidateRecruitmentPost = (candidate: ICandidate) => {
	const latest = getLatestCandidateApplication(candidate);
	return (
		latest?.recruitment_infor?.post_title ??
		latest?.recruitment_infor?.internal_title ??
		latest?.recruitment_infor?.recruitment_code ??
		"-"
	);
};

export const getCandidateAppliedDate = (candidate: ICandidate) => {
	const latest = getLatestCandidateApplication(candidate);
	return latest?.created_at ?? candidate.date_applied ?? null;
};

export const getCandidateAverageRating = (candidate: ICandidate) => {
	const reviews = candidate.reviewCandidate ?? [];
	if (!reviews.length) {
		return { average: 0, count: 0 };
	}

	const total = reviews.reduce((acc, item) => acc + parseRating(item.rating), 0);
	const average = Math.round((total / reviews.length) * 10) / 10;

	return { average, count: reviews.length };
};

export const getApplicationStatusLabel = (status?: string | null) => {
	const normalized = normalizeStatus(status ?? "");
	if (!normalized) return "-";

	const match = APPLICATION_STATUS_STEPS.find(
		(step) => normalizeStatus(step.value) === normalized,
	);

	return match?.label ?? status?.trim() ?? "-";
};

export const getApplicationStatusBadgeStyle = (status?: string | null) => {
  const normalized = normalizeStatus(status ?? "");

  switch (normalized) {
    case "applied":
      return { bg: "#E4E7F2", color: "#334371" };

    case "reviewing":
      return { bg: "#DCE6FA", color: "#2F4DB8" };

    case "contacted":
      return { bg: "#D9EFFF", color: "#2B6CB0" };

    case "interviewing":
      return { bg: "#E6E0FA", color: "#553C9A" };

    case "waiting_response":
      return { bg: "#FFECCF", color: "#B7791F" };

    case "accepted":
      return { bg: "#DDF5E9", color: "#2F855A" };

    case "rejected":
      return { bg: "#FADADD", color: "#C53030" };

    default:
      return { bg: "#E4E7F2", color: "#334371" };
  }
};