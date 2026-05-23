export type ReportTabKey = 
| "dashboard"
| "performance"
| "cost"
| "plan"
| "rejected"
| "settings";

export type DashboardStatCard = {
	title: string;
	value: string;
	change: string;
	note: string;
};

export type DashboardApplicationStatusItem = {
	name: string;
	value: number;
};

export type DashboardTrendItem = {
	month: string;
	applications: number;
};

export type DashboardCostItem = {
	type: string;
	amount: number;
};

export type DashboardPlanProgressItem = {
	position: string;
	plan: number;
	hired: number;
};

export type DashboardRecruitmentItem = {
	code: string;
	title: string;
	department: string;
	applications: number;
	status: "Active" | "Reviewing" | "Paused";
};

export type DashboardOverviewData = {
	statCards: DashboardStatCard[];
	applicationStatusData: DashboardApplicationStatusItem[];
	applicationTrendData: DashboardTrendItem[];
	recruitmentCostData: DashboardCostItem[];
	planProgressData: DashboardPlanProgressItem[];
	recentRecruitments: DashboardRecruitmentItem[];
	updatedAt: string;
};

export type DashboardPeriod = "month" | "quarter" | "ytd";
export type DashboardScope = "all" | "tech" | "operations";

export type DashboardPerformancePipelineItem = {
	key: string;
	label: string;
	count: number;
	conversionFromPrevious: number | null;
};

export type DashboardPerformanceRecruiterItem = {
	id: string;
	name: string;
	total: number;
	inProgress: number;
	accepted: number;
	rejected: number;
	acceptRate: number;
};

export type DashboardPerformancePositionItem = {
	name: string;
	total: number;
	accepted: number;
	rejected: number;
	acceptRate: number;
};

export type DashboardPerformanceTrendItem = {
	month: string;
	total: number;
	accepted: number;
	rejected: number;
};

export type DashboardPerformanceData = {
	generatedAt: string;
	period: DashboardPeriod;
	scope: DashboardScope;
	totals: {
		totalApplications: number;
		inProgress: number;
		accepted: number;
		rejected: number;
		acceptRate: number;
	};
	pipeline: DashboardPerformancePipelineItem[];
	byRecruiter: DashboardPerformanceRecruiterItem[];
	byPosition: DashboardPerformancePositionItem[];
	trend: DashboardPerformanceTrendItem[];
};

export type DashboardCostByTypeItem = {
	type: string;
	amount: number;
	sharePercent: number;
};

export type DashboardCostByDepartmentItem = {
	department: string;
	amount: number;
	recruitments: number;
	accepted: number;
	costPerAccepted: number;
};

export type DashboardCostByRecruiterItem = {
	recruiter: string;
	amount: number;
	recruitments: number;
	accepted: number;
	costPerAccepted: number;
};

export type DashboardCostTrendItem = {
	month: string;
	cost: number;
	accepted: number;
	costPerAccepted: number;
};

export type DashboardTopCostRecruitmentItem = {
	code: string;
	title: string;
	department: string;
	amount: number;
	accepted: number;
	costPerAccepted: number;
	status: string;
};

export type DashboardCostData = {
	generatedAt: string;
	period: DashboardPeriod;
	scope: DashboardScope;
	totals: {
		totalCost: number;
		totalRecruitmentsWithCost: number;
		totalAccepted: number;
		costPerAccepted: number;
	};
	byType: DashboardCostByTypeItem[];
	byDepartment: DashboardCostByDepartmentItem[];
	byRecruiter: DashboardCostByRecruiterItem[];
	trend: DashboardCostTrendItem[];
	topRecruitments: DashboardTopCostRecruitmentItem[];
};

// ─── Plan types ──────────────────────────────────────────────────────────────

export type DashboardPlanRecruitmentItem = {
	id: string;
	code: string;
	title: string;
	department: string;
	recruiter: string;
	position: string;
	planned: number;
	hired: number;
	remaining: number;
	fillRate: number;
	deadline: string | null;
	status: string;
};

export type DashboardPlanDepartmentItem = {
	department: string;
	recruitments: number;
	planned: number;
	hired: number;
	fillRate: number;
};

export type DashboardPlanPositionItem = {
	position: string;
	recruitments: number;
	planned: number;
	hired: number;
	fillRate: number;
};

export type DashboardPlanActiveBatchItem = {
	title: string;
	recruitmentTitle: string;
	fromDate: string | null;
	toDate: string | null;
	target: number;
	daysLeft: number;
};

export type DashboardPlanChannelItem = {
	channel: string;
	postCount: number;
};

export type DashboardPlanTrendItem = {
	month: string;
	planned: number;
	hired: number;
};

export type DashboardPlanData = {
	generatedAt: string;
	period: DashboardPeriod;
	scope: DashboardScope;
	totals: {
		totalRecruitments: number;
		totalPlanned: number;
		totalHired: number;
		totalRemaining: number;
		fillRate: number;
	};
	byRecruitment: DashboardPlanRecruitmentItem[];
	byDepartment: DashboardPlanDepartmentItem[];
	byPosition: DashboardPlanPositionItem[];
	activeBatches: DashboardPlanActiveBatchItem[];
	postingChannels: DashboardPlanChannelItem[];
	trend: DashboardPlanTrendItem[];
};

// ─── Rejected types ───────────────────────────────────────────────────────────

export type DashboardRejectedRecruiterItem = {
	id: string;
	name: string;
	total: number;
	rejected: number;
	rejectionRate: number;
};

export type DashboardRejectedPositionItem = {
	position: string;
	total: number;
	rejected: number;
	rejectionRate: number;
};

export type DashboardRejectedDepartmentItem = {
	department: string;
	total: number;
	rejected: number;
	rejectionRate: number;
};

export type DashboardRejectedTrendItem = {
	month: string;
	total: number;
	rejected: number;
};

export type DashboardRecentRejectedItem = {
	candidateId: string;
	candidateCode: string;
	candidateName: string;
	email: string;
	phone: string;
	position: string;
	department: string;
	recruiter: string;
	note: string | null;
	rejectedAt: string;
};

export type DashboardRejectedData = {
	generatedAt: string;
	period: DashboardPeriod;
	scope: DashboardScope;
	totals: {
		totalInPeriod: number;
		totalRejected: number;
		rejectionRate: number;
	};
	byRecruiter: DashboardRejectedRecruiterItem[];
	byPosition: DashboardRejectedPositionItem[];
	byDepartment: DashboardRejectedDepartmentItem[];
	trend: DashboardRejectedTrendItem[];
	recentRejected: DashboardRecentRejectedItem[];
};