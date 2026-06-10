import type { SkillStatusType } from "../../../../../constant";

export interface ISkill {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  unit_id?: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  inforCompany?: {
    id: string;
    full_name?: string | null;
    acronym_name?: string | null;
  } | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: ISkill[];
}

export type SkillTaxonomyMapping = {
  id: string;
  taxonomy_group: string;
  taxonomy_subgroup?: string | null;
  taxonomy_group_node_id?: string | null;
  taxonomy_subgroup_node_id?: string | null;
  source?: string | null;
};

export type TaxonomySkill = Omit<ISkill, "aliases"> & {
  aliases?: string[];
  taxonomy_group?: string | null;
  taxonomy_subgroup?: string | null;
  taxonomy_group_node_id?: string | null;
  taxonomy_subgroup_node_id?: string | null;
  taxonomyMappings?: SkillTaxonomyMapping[];
  scope?: string | null;
  source?: string | null;
};

export type SkillTaxonomySubgroup = {
  id?: string | null;
  name: string;
  skillCount: number;
  skills: TaxonomySkill[];
};

export type SkillTaxonomyGroup = {
  id?: string | null;
  name: string;
  skillCount: number;
  subgroups: SkillTaxonomySubgroup[];
};

export type SkillTaxonomyTreeResponse = {
  totalSkills: number;
  mappedSkillCount: number;
  missingSkillCount: number;
  groups: SkillTaxonomyGroup[];
};

export type SkillTaxonomyOptions = {
  groups: { id: string; name: string }[];
  subgroups: { id: string; name: string; group_id: string | null }[];
  subgroupsByGroup: Record<string, { id: string; name: string }[]>;
};

export type SkillTaxonomyPayload = {
  name: string;
  description?: string | null;
  aliases?: string[];
  taxonomy_group_node_id: string;
  taxonomy_subgroup_node_id: string;
  is_active: boolean;
};

export interface SkillFormValues {
  name: string;
  description: string;
  aliases: string;
  taxonomy_group: string;
  taxonomy_subgroup: string;
  status: SkillStatusType;
  parent_id: string;
  unit_id: string;
}
