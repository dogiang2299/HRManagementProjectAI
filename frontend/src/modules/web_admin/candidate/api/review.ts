import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { ICandidateReview } from "../types";
import apiClient from "../../../../lib/api";

export type CandidateReviewResponse = {
  average: number;
  count: number;
  items: ICandidateReview[];
};

export type CandidateReviewParams = {
  applicationId?: string;
};

export type CreateCandidateReviewDTO = {
  rating: number;
  comment?: string;
};

export type UpdateCandidateReviewDTO = Partial<CreateCandidateReviewDTO>;

export const getCandidateReviews = async (candidateId: string): Promise<CandidateReviewResponse> => {
  const res = await apiClient.get(`candidate/${candidateId}/reviews`);
  const payload = res.data?.data ?? res.data;

  return {
    average: Number(payload?.average ?? 0),
    count: Number(payload?.count ?? 0),
    items: Array.isArray(payload?.items) ? payload.items : [],
  };
};

export const useCandidateReviews = (
  candidateId: string,
  params: CandidateReviewParams = {},
  config?: Omit<
    UseQueryOptions<
      CandidateReviewResponse,
      Error,
      CandidateReviewResponse,
      [string, string, CandidateReviewParams]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["candidate-reviews", candidateId, params],
    enabled: !!candidateId,
    queryFn: () => getCandidateReviews(candidateId),
    ...config,
  });
};

export const createCandidateReview = async (
  candidateId: string,
  data: CreateCandidateReviewDTO,
): Promise<ICandidateReview> => {
  const res = await apiClient.post(`candidate/${candidateId}/reviews`, data);
  const payload = res.data?.data ?? res.data;
  const raw = payload?.data ?? payload;
  return raw as ICandidateReview;
};

export const updateCandidateReview = async (
  reviewId: string,
  data: UpdateCandidateReviewDTO,
): Promise<ICandidateReview> => {
  const res = await apiClient.patch(`reviews/${reviewId}`, data);
  const payload = res.data?.data ?? res.data;
  const raw = payload?.data ?? payload;
  return raw as ICandidateReview;
};

export const deleteCandidateReview = async (reviewId: string): Promise<ICandidateReview> => {
  const res = await apiClient.delete(`reviews/${reviewId}`);
  const payload = res.data?.data ?? res.data;
  const raw = payload?.data ?? payload;
  return raw as ICandidateReview;
};

type UseCreateCandidateReviewOptions = {
  candidateId: string;
  config?: Omit<UseMutationOptions<ICandidateReview, Error, CreateCandidateReviewDTO>, "mutationFn">;
};

export const useCreateCandidateReview = ({
  candidateId,
  config,
}: UseCreateCandidateReviewOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: (data: CreateCandidateReviewDTO) => createCandidateReview(candidateId, data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["candidate-reviews", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs", candidateId] });
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

type UseUpdateCandidateReviewOptions = {
  candidateId: string;
  config?: Omit<
    UseMutationOptions<
      ICandidateReview,
      Error,
      { reviewId: string; data: UpdateCandidateReviewDTO }
    >,
    "mutationFn"
  >;
};

export const useUpdateCandidateReview = ({
  candidateId,
  config,
}: UseUpdateCandidateReviewOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: ({ reviewId, data }: { reviewId: string; data: UpdateCandidateReviewDTO }) =>
      updateCandidateReview(reviewId, data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["candidate-reviews", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs", candidateId] });
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

type UseDeleteCandidateReviewOptions = {
  candidateId: string;
  config?: Omit<UseMutationOptions<ICandidateReview, Error, string>, "mutationFn">;
};

export const useDeleteCandidateReview = ({
  candidateId,
  config,
}: UseDeleteCandidateReviewOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: (reviewId: string) => deleteCandidateReview(reviewId),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["candidate-reviews", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs", candidateId] });
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
