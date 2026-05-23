import type { TypePotentialStatusType } from "../../../../../constant";

export interface ITypePotential {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  unit_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  inforCompany?: {
    id: string;
    full_name?: string | null;
    acronym_name?: string | null;
  } | null;
}

export interface TypePotentialFormValues {
  name: string;
  description: string;
  status: TypePotentialStatusType;
  unit_id: string;
}
