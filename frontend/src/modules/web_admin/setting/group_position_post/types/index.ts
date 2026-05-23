export interface IGroupPositionPost {
  id: string;
  name_group: string;
  slug?: string | null;
  description?: string | null;
  unit_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  inforCompany?: {
    id: string;
    full_name?: string | null;
    acronym_name?: string | null;
  } | null;
  positions?: Array<{
    id: string;
    name_post?: string | null;
    position_code?: string | null;
    is_active?: boolean;
  }>;
}

export interface GroupPositionPostFormValues {
  name_group: string;
  slug: string;
  description: string;
  unit_id: string;
}
