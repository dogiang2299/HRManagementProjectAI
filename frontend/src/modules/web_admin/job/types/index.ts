import type { JobStatusType } from "../../../../constant";
import type { IEmployee } from "../../employee/types";

export interface IJob {
	id: string;
	job_code?: string | null;
	name_job?: string | null;
	description_job?: string | null;
	type_job?: string | null;
	result_job?: string | null;
	employee_id?: string | null;
	company_id?: string | null;
	deadline?: string | Date | null;
	remind_enabled?: boolean | null;
	remind_before_minutes?: number | null;
	status?: JobStatusType | string | null;
	is_active?: boolean;
	created_at?: string | Date | null;
	updated_at?: string | Date | null;

	employee?: Pick<IEmployee, "id" | "employee_name"> | null;
	jobCandidates?: IJobCandidates[];
}

export interface IJobCandidates {
	id: string;
	job_id: string;
	candidate_id: string;
	job?: IJob | null;
	candidate?: {
		id?: string;
		candidate_name?: string | null;
		statusApplication?: Array<{
			id?: string;
			recruitment_infor?: {
				id?: string;
				post_title?: string | null;
				internal_title?: string | null;
				department?: {
					id?: string;
					full_name?: string | null;
					acronym_name?: string | null;
				} | null;
			} | null;
		}>;
	} | null;
}

export type IJobCandidate = IJobCandidates;
