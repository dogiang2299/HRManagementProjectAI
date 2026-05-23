import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from './conversation.api';

export const useCandidateConversations = (enabled = true) => {
  return useQuery({
    queryKey: ['candidate-conversations'],
    queryFn: conversationApi.getCandidateConversations,
    enabled,
    refetchInterval: 12000,
  });
};

export const useConversationMessages = (conversationId?: string) => {
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    enabled: !!conversationId,
    queryFn: () => conversationApi.getMessages(conversationId as string),
    refetchInterval: conversationId ? 7000 : false,
  });
};

export const useOpenConversationByApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) => conversationApi.openByApplication(applicationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['candidate-conversations'] });
    },
  });
};

export const useSendConversationMessage = (conversationId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) throw new Error('Conversation is required');
      return conversationApi.sendMessage(conversationId, content);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['candidate-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['employer-conversations'] });
    },
  });
};

export const useMarkConversationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => conversationApi.markAsRead(conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['candidate-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['employer-conversations'] });
    },
  });
};
