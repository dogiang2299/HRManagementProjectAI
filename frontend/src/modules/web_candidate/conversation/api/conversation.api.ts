import apiClient from '../../../../lib/api';

export type ChatSide = 'CANDIDATE' | 'EMPLOYER';

export type ChatConversation = {
  id: string;
  application_id: string;
  candidate_id: string;
  employer_id: string;
  recruitment_infor_id: string;
  company_id?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  candidate_unread_count: number;
  employer_unread_count: number;
  created_at: string;
  candidate?: {
    id: string;
    candidate_name?: string | null;
    avatar_file?: string | null;
    email?: string | null;
    phone_number?: string | null;
  };
  employer?: {
    id: string;
    employee_name?: string | null;
    avatar?: string | null;
    email_account?: string | null;
    phone_account?: string | null;
    company_id?: string | null;
  } | null;
  company?: {
    id: string;
    full_name?: string | null;
    acronym_name?: string | null;
    image_logo?: string | null;
    address?: string | null;
  } | null;
  recruitment_infor?: {
    id: string;
    recruitment_code?: string | null;
    post_title?: string | null;
    internal_title?: string | null;
    type_of_job?: string | null;
    salary_from?: number | null;
    salary_to?: number | null;
    salary_currency?: string | null;
    positionPost?: { id?: string; name_post?: string | null } | null;
    department?: { id: string; full_name?: string | null; acronym_name?: string | null; image_logo?: string | null } | null;
    workLocation?: { id: string; full_name?: string | null; acronym_name?: string | null; image_logo?: string | null } | null;
  };
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_type: ChatSide;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
};

export const conversationApi = {
  getCandidateConversations: async () => {
    const res = await apiClient.get<ChatConversation[]>('/conversations/candidate');
    return res.data;
  },
  getEmployerConversations: async () => {
    const res = await apiClient.get<ChatConversation[]>('/conversations/employer');
    return res.data;
  },
  openByApplication: async (applicationId: string) => {
    const res = await apiClient.post<ChatConversation>(`/conversations/application/${applicationId}/open`);
    return res.data;
  },
  getMessages: async (conversationId: string) => {
    const res = await apiClient.get<ChatMessage[]>(`/conversations/${conversationId}/messages`);
    return res.data;
  },
  sendMessage: async (conversationId: string, content: string) => {
    const res = await apiClient.post<ChatMessage>(`/conversations/${conversationId}/messages`, { content });
    return res.data;
  },
  markAsRead: async (conversationId: string) => {
    const res = await apiClient.patch<ChatConversation>(`/conversations/${conversationId}/read`);
    return res.data;
  },
};
