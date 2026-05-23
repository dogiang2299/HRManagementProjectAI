import type { RankStatusType } from "../../../../../constant";

export interface IRank {
  id: string;
  rank_code?: string | null;
  name_rank?: string | null;
  unit_id?: string | null;
  status?: RankStatusType | string | null;
  description?: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  rankUnit?: {
    id: string;
    full_name?: string | null;
    acronym_name?: string | null;
  } | null;
}

export interface RankFormValues {
  name_rank: string;
  unit_id: string;
  status: RankStatusType;
  description: string;
  is_active: boolean;
}
