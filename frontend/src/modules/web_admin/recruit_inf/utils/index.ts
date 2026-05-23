import { formatDateShort, formatCompactMoney } from "../../../../types";
import type {
	IRecruitmentActivity,
	IRecruitmentCosts,
	IRecruitmentInfor,
	IRecruitmentPlanChildBatch,
	IRecruitmentPlanChildPosted,
	IRecruitmentPlanParent,
	RecruitmentActivityType,
} from "../types";

export const RECRUITMENT_ACTIVITY_DISPLAY: Record<RecruitmentActivityType, string> = {
	PLAN_UPDATED: "Plan updated",
	POSTED_TO_BOARD: "Posted to board",
	COST_ADDED: "Cost added",
};

const toDateMillis = (value?: string | null) => {
	if (!value) return 0;
	const date = new Date(value);
	const millis = date.getTime();
	return Number.isFinite(millis) ? millis : 0;
};

const toSafeNumber = (value: unknown) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const buildPlanParentActivity = (
	plan: IRecruitmentPlanParent,
	fallbackAt?: string | null,
): IRecruitmentActivity | null => {
	const target = toSafeNumber(plan.total_real_number);
	const hasTarget = target > 0;
	const monthText = plan.monthly_target ? ` for ${formatDateShort(plan.monthly_target)}` : "";
	const deadlineText = plan.expected_deadline
		? `, deadline ${formatDateShort(plan.expected_deadline)}`
		: "";

	if (!hasTarget && !plan.monthly_target && !plan.expected_deadline) {
		return null;
	}

	const targetText = hasTarget ? `target ${target}` : "target updated";
	return {
		type: "PLAN_UPDATED",
		text: `Plan updated: ${targetText}${monthText}${deadlineText}`,
		at: plan.monthly_target ?? plan.expected_deadline ?? fallbackAt,
	};
};

const buildBatchActivity = (
	batch: IRecruitmentPlanChildBatch,
	fallbackAt?: string | null,
): IRecruitmentActivity | null => {
	const hasDates = Boolean(batch.from_date || batch.to_date);
	const hasTarget = toSafeNumber(batch.number_recruitment) > 0;
	const hasTitle = Boolean(batch.batches_title?.trim());

	if (!hasDates && !hasTarget && !hasTitle) {
		return null;
	}

	const title = batch.batches_title?.trim() || "Batch";
	const dateText = hasDates
		? ` (${formatDateShort(batch.from_date)} - ${formatDateShort(batch.to_date)})`
		: "";
	const targetText = hasTarget ? `, target ${toSafeNumber(batch.number_recruitment)}` : "";

	return {
		type: "PLAN_UPDATED",
		text: `Batch updated: ${title}${dateText}${targetText}`,
		at: batch.from_date ?? batch.to_date ?? fallbackAt,
	};
};

const buildPostedActivity = (
	posted: IRecruitmentPlanChildPosted,
	fallbackAt?: string | null,
): IRecruitmentActivity | null => {
	const board = posted.job_board?.trim();
	const hasDate = Boolean(posted.posted_date || posted.expiration_date);

	if (!board && !hasDate) {
		return null;
	}

	const boardText = board || "job board";
	const expireText = posted.expiration_date
		? ` (expires ${formatDateShort(posted.expiration_date)})`
		: "";

	return {
		type: "POSTED_TO_BOARD",
		text: `Posted to ${boardText}${expireText}`,
		at: posted.posted_date ?? posted.expiration_date ?? fallbackAt,
	};
};

const buildCostActivity = (
	cost: IRecruitmentCosts,
	fallbackCurrency?: string | null,
	fallbackAt?: string | null,
): IRecruitmentActivity | null => {
	const amount = toSafeNumber(cost.amount);
	if (amount <= 0) return null;

	const costType = cost.cost_type?.trim();
	const money = formatCompactMoney(amount, cost.currency ?? fallbackCurrency ?? "VND");

	return {
		type: "COST_ADDED",
		text: `Cost added: ${money}${costType ? ` (${costType})` : ""}`,
		at: fallbackAt,
	};
};

export const buildRecruitmentActivities = (item: IRecruitmentInfor): IRecruitmentActivity[] => {
	const activities: IRecruitmentActivity[] = [];
	const fallbackAt = item.updated_at ?? item.created_at ?? null;

	for (const plan of item.recruitmentPlans ?? []) {
		const parentActivity = buildPlanParentActivity(plan, fallbackAt);
		if (parentActivity) activities.push(parentActivity);

		for (const batch of plan.recruitmentPlanChildBatches ?? []) {
			const batchActivity = buildBatchActivity(batch, fallbackAt);
			if (batchActivity) activities.push(batchActivity);
		}

		for (const posted of plan.recruitmentPlanChildPosteds ?? []) {
			const postedActivity = buildPostedActivity(posted, fallbackAt);
			if (postedActivity) activities.push(postedActivity);
		}
	}

	for (const cost of item.recruitmentCosts ?? []) {
		const costActivity = buildCostActivity(cost, item.cost_currency, fallbackAt);
		if (costActivity) activities.push(costActivity);
	}

	return activities
		.sort((a, b) => toDateMillis(b.at ?? null) - toDateMillis(a.at ?? null))
		.slice(0, 8);
};
