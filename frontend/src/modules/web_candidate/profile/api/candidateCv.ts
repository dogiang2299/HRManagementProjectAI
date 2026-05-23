import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";

export type CandidateCvSourceType = "UPLOADED_FILE" | "AI_GENERATED";
export type CandidateCvStatus = "DRAFT" | "COMPLETED" | "ARCHIVED";

export type CandidateCvListItem = {
  id: string;
  title?: string | null;
  source_type: CandidateCvSourceType;
  status: CandidateCvStatus;
  is_primary: boolean;
  file_name?: string | null;
  file_url?: string | null;
  desired_position?: string | null;
  years_experience?: number | null;
  created_at: string;
  updated_at: string;
};

export type CandidateCvDetail = CandidateCvListItem & {
  candidate_id: string;
  file_url?: string | null;
  raw_text?: string | null;
  structured_data?: Record<string, any> | null;
  summary?: string | null;
};

export type CandidateCvApplicationLink = {
  id: string;
  title?: string | null;
  source_type?: CandidateCvSourceType;
  status?: CandidateCvStatus;
  is_primary?: boolean;
  file_url?: string | null;
  file_name?: string | null;
  desired_position?: string | null;
  years_experience?: number | null;
  raw_text?: string | null;
  summary?: string | null;
  structured_data?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
};

export type CandidateCvChatMessage = {
  id: string;
  cv_id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  created_at: string;
};

export type CandidateCvAiChatResponse = {
  cv: CandidateCvDetail;
  assistantMessage: string;
  messages: CandidateCvChatMessage[];
};

const CANDIDATE_CV_QUERY_KEY = ["candidate-cv-list"];
const candidateCvDetailKey = (id?: string) => ["candidate-cv-detail", id];
const candidateCvMessagesKey = (id?: string) => ["candidate-cv-messages", id];

const unwrapData = <T,>(response: any): T => {
  return (response?.data?.data ?? response?.data) as T;
};

export const useGetMyCandidateCvs = () => {
  return useQuery({
    queryKey: CANDIDATE_CV_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get("/candidate-cvs/me");
      const payload = unwrapData<CandidateCvListItem[]>(response);
      return (Array.isArray(payload) ? payload : []) as CandidateCvListItem[];
    },
    staleTime: 10_000,
  });
};

export const useGetCandidateCvDetail = (id?: string) => {
  return useQuery({
    queryKey: candidateCvDetailKey(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await apiClient.get(`/candidate-cvs/${id}`);
      return unwrapData<CandidateCvDetail>(response);
    },
  });
};

export const useGetCandidateCvMessages = (id?: string) => {
  return useQuery({
    queryKey: candidateCvMessagesKey(id),
    enabled: Boolean(id),
    refetchInterval: 8_000,
    queryFn: async () => {
      const response = await apiClient.get(`/candidate-cvs/${id}/messages`);
      const payload = unwrapData<CandidateCvChatMessage[]>(response);
      return Array.isArray(payload) ? payload : [];
    },
  });
};

export const useCreateAiDraftCv = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/candidate-cvs/ai-draft", {});
      return unwrapData<CandidateCvDetail>(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CANDIDATE_CV_QUERY_KEY });
    },
  });
};

export const useUpdateCandidateCv = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title?: string;
      structured_data?: Record<string, any>;
      raw_text?: string;
      summary?: string;
      desired_position?: string;
      years_experience?: number | null;
    }) => {
      const response = await apiClient.patch(`/candidate-cvs/${id}`, payload);
      return unwrapData<CandidateCvDetail>(response);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CANDIDATE_CV_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: candidateCvDetailKey(id) }),
      ]);
    },
  });
};

export const useCompleteCandidateCv = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch(`/candidate-cvs/${id}/complete`);
      return unwrapData<CandidateCvDetail>(response);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CANDIDATE_CV_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: candidateCvDetailKey(id) }),
      ]);
    },
  });
};

export const useCandidateCvAiChat = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const response = await apiClient.post(`/candidate-cvs/${id}/ai-chat`, { message });
      return unwrapData<CandidateCvAiChatResponse>(response);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: candidateCvDetailKey(id) }),
        queryClient.invalidateQueries({ queryKey: candidateCvMessagesKey(id) }),
        queryClient.invalidateQueries({ queryKey: CANDIDATE_CV_QUERY_KEY }),
      ]);
    },
  });
};

export const useSetPrimaryCv = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/candidate-cvs/${id}/set-primary`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CANDIDATE_CV_QUERY_KEY });
    },
  });
};

export const useSetPrimaryCvById = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch(`/candidate-cvs/${id}/set-primary`);
      return unwrapData<CandidateCvDetail>(response);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CANDIDATE_CV_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: candidateCvDetailKey(id) }),
      ]);
    },
  });
};

export const useArchiveCv = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/candidate-cvs/${id}/archive`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CANDIDATE_CV_QUERY_KEY });
    },
  });
};

export const deleteCandidateCv = async (id: string) => {
  const res = await apiClient.delete(`/candidate-cvs/${id}`);
  return res.data?.data ?? res.data;
};

export const useDeleteCandidateCv = (
  config?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCandidateCv(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CANDIDATE_CV_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: candidateCvDetailKey(undefined) }),
      ]);
    },
    ...config,
  });
};
