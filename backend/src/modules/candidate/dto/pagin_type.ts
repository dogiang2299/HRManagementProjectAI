import { Candidate } from '@prisma/client';

export type CandidateApplicationsSummary = {
  total_applications: number;
  distinct_positions: number;
  distinct_job_posts: number;
  distinct_companies: number;
};

export type CandidateListItem = Candidate & {
  statusApplication?: unknown[];
  applications_summary?: CandidateApplicationsSummary | null;
};

export class CandidatePaginType {
  data!: CandidateListItem[];
  current_pages!: number;
  items_per_pages!: number;
  total_items!: number;
}
