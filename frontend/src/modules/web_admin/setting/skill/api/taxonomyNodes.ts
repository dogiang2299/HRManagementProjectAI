import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_SKILLS } from "../../../../../constant/config";

export type TaxonomyNodeRecord = {
  id: string;
  name: string;
  parent_id?: string | null;
  node_type: "GROUP" | "SUBGROUP";
  is_active: boolean;
  sort_order?: number;
  description?: string | null;
  skillCount?: number;
};

export type TaxonomyNodeCatalogGroup = TaxonomyNodeRecord & {
  subgroups: TaxonomyNodeRecord[];
};

export type TaxonomyNodeCatalogResponse = {
  groups: TaxonomyNodeCatalogGroup[];
};

export const getTaxonomyNodesCatalog = async (): Promise<TaxonomyNodeCatalogResponse> => {
  const res = await apiClient.get(`${URL_API_SKILLS}/taxonomy-nodes/catalog`);
  return {
    groups: Array.isArray(res.data?.groups) ? res.data.groups : [],
  };
};

export const useGetTaxonomyNodesCatalog = () =>
  useQuery({
    queryKey: ["skills", "taxonomy-nodes-catalog"],
    queryFn: getTaxonomyNodesCatalog,
  });

export type CreateTaxonomyNodePayload = {
  node_type: "GROUP" | "SUBGROUP";
  name: string;
  parent_id?: string;
  description?: string;
  sort_order?: number;
};

export type UpdateTaxonomyNodePayload = {
  name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
};

export const createTaxonomyNode = async (payload: CreateTaxonomyNodePayload) => {
  const res = await apiClient.post(`${URL_API_SKILLS}/taxonomy-nodes`, payload);
  return res.data;
};

export const updateTaxonomyNode = async (
  nodeId: string,
  payload: UpdateTaxonomyNodePayload,
) => {
  const res = await apiClient.put(`${URL_API_SKILLS}/taxonomy-nodes/${nodeId}`, payload);
  return res.data;
};

export const softDeleteTaxonomyNode = async (nodeId: string) => {
  const res = await apiClient.delete(`${URL_API_SKILLS}/taxonomy-nodes/${nodeId}`);
  return res.data;
};

export const useTaxonomyNodeMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["skills", "taxonomy-nodes-catalog"] }),
      queryClient.invalidateQueries({ queryKey: ["skills", "taxonomy-options"] }),
      queryClient.invalidateQueries({ queryKey: ["skills", "taxonomy-tree"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createTaxonomyNode,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ nodeId, payload }: { nodeId: string; payload: UpdateTaxonomyNodePayload }) =>
      updateTaxonomyNode(nodeId, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: softDeleteTaxonomyNode,
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
};
