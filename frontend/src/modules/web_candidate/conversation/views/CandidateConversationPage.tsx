import {
  Avatar,
  Badge,
  Box,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiBriefcase, FiMessageCircle, FiSearch, FiSend } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { resolveCompanyLogoUrl } from '../../../../utils/companyLogo';
import type { ChatConversation, ChatMessage } from '../api/conversation.api';
import {
  useCandidateConversations,
  useConversationMessages,
  useMarkConversationAsRead,
  useOpenConversationByApplication,
  useSendConversationMessage,
} from '../api/conversation.hooks';

const primary = '#334371';

const formatTime = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(d);
};

const getCompanyName = (item?: ChatConversation) => {
  if (!item) return 'Recruiter';
  return (
    item.company?.full_name ||
    item.company?.acronym_name ||
    item.employer?.employee_name ||
    'Recruiter'
  );
};

const getJobTitle = (item?: ChatConversation) => {
  if (!item) return 'Job posting';
  return (
    item.recruitment_infor?.post_title ||
    item.recruitment_infor?.internal_title ||
    item.recruitment_infor?.positionPost?.name_post ||
    'Job posting'
  );
};

const getLogo = (item?: ChatConversation) => {
  return resolveCompanyLogoUrl(item?.company?.image_logo || item?.recruitment_infor?.department?.image_logo || undefined);
};

function ConversationRow({
  item,
  active,
  onClick,
}: {
  item: ChatConversation;
  active: boolean;
  onClick: () => void;
}) {
  const companyName = getCompanyName(item);
  const jobTitle = getJobTitle(item);

  return (
    <Flex
      role="button"
      onClick={onClick}
      gap={3}
      p={3}
      mx={3}
      borderRadius="18px"
      bg={active ? 'rgba(51,67,113,0.08)' : 'transparent'}
      border="1px solid"
      borderColor={active ? 'rgba(51,67,113,0.18)' : 'transparent'}
      _hover={{ bg: active ? 'rgba(51,67,113,0.08)' : '#F8FAFC' }}
      transition="0.18s ease"
      align="center"
    >
      <Avatar size="md" name={companyName} src={getLogo(item) || undefined} bg="#EEF2FF" color={primary} />
      <Box minW={0} flex="1">
        <HStack justify="space-between" align="start">
          <Text fontSize="sm" fontWeight="800" color="#1F2937" noOfLines={1}>
            {companyName}
          </Text>
          <Text fontSize="11px" color="#94A3B8" whiteSpace="nowrap">
            {formatTime(item.last_message_at || item.created_at)}
          </Text>
        </HStack>
        <Text mt="2px" fontSize="xs" color="#64748B" noOfLines={1}>
          {jobTitle}
        </Text>
        <HStack mt={1.5} justify="space-between" spacing={2}>
          <Text fontSize="xs" color="#94A3B8" noOfLines={1} flex="1">
            {item.last_message || 'Start a conversation with the recruiter'}
          </Text>
          {item.candidate_unread_count > 0 ? (
            <Badge borderRadius="full" bg="#16A34A" color="white" px={2}>
              {item.candidate_unread_count}
            </Badge>
          ) : null}
        </HStack>
      </Box>
    </Flex>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isMine = message.sender_type === 'CANDIDATE';
  const statusLabel = isMine
    ? message.is_read
      ? 'Read'
      : 'Unread'
    : message.is_read
      ? 'Delivered'
      : 'Unread';

  return (
    <Flex justify={isMine ? 'flex-end' : 'flex-start'}>
      <Box
        maxW="68%"
        px={4}
        py={3}
        borderRadius={isMine ? '20px 20px 6px 20px' : '20px 20px 20px 6px'}
        bg={isMine ? primary : 'white'}
        color={isMine ? 'white' : '#1F2937'}
        border="1px solid"
        borderColor={isMine ? primary : '#E5E7EB'}
        boxShadow={isMine ? '0 12px 28px rgba(51,67,113,0.18)' : '0 10px 24px rgba(15,23,42,0.06)'}
      >
        <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.7">
          {message.content}
        </Text>
        <HStack mt={1.5} justify="flex-end" spacing={2}>
          <Text fontSize="10px" color={isMine ? 'whiteAlpha.700' : '#94A3B8'}>
            {statusLabel}
          </Text>
          <Text fontSize="10px" color={isMine ? 'whiteAlpha.700' : '#94A3B8'}>
            {formatTime(message.created_at)}
          </Text>
        </HStack>
      </Box>
    </Flex>
  );
}

export default function CandidateConversationPage() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('application_id');
  const openedApplicationRef = useRef<string | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [selectedId, setSelectedId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [content, setContent] = useState('');

  const conversationsQuery = useCandidateConversations();
  const conversations = conversationsQuery.data || [];

  const openConversationMutation = useOpenConversationByApplication();
  const markReadMutation = useMarkConversationAsRead();

  useEffect(() => {
    if (!applicationId) return;

    const existed = conversations.find((item) => item.application_id === applicationId);
    if (existed) {
      openedApplicationRef.current = applicationId;
      setSelectedId(existed.id);
      return;
    }

    if (openedApplicationRef.current === applicationId || openConversationMutation.isPending) return;

    openedApplicationRef.current = applicationId;
    openConversationMutation.mutate(applicationId, {
      onSuccess: (conversation) => setSelectedId(conversation.id),
      onError: () => {
        openedApplicationRef.current = null;
      },
    });
  }, [applicationId, conversations.length, openConversationMutation.isPending]);

  useEffect(() => {
    if (applicationId) return;
    if (!selectedId && conversations[0]?.id) setSelectedId(conversations[0].id);
  }, [applicationId, conversations, selectedId]);

  const filteredConversations = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((item) => {
      return `${getCompanyName(item)} ${getJobTitle(item)} ${item.last_message || ''}`.toLowerCase().includes(q);
    });
  }, [conversations, keyword]);

  const selectedConversation =
    conversations.find((item) => item.id === selectedId) ||
    conversations.find((item) => item.application_id === applicationId) ||
    conversations[0];

  const messagesQuery = useConversationMessages(selectedConversation?.id);
  const messages = messagesQuery.data || [];
  const orderedMessages = useMemo(() => {
    return [...messages].sort((left, right) => {
      const leftTime = new Date(left.created_at || 0).getTime();
      const rightTime = new Date(right.created_at || 0).getTime();
      return leftTime - rightTime;
    });
  }, [messages]);
  const sendMutation = useSendConversationMessage(selectedConversation?.id);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    markReadMutation.mutate(selectedConversation.id);
  }, [selectedConversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [orderedMessages.length, selectedConversation?.id]);

  const handleSend = () => {
    const clean = content.trim();
    if (!clean || !selectedConversation?.id || sendMutation.isPending) return;
    setContent('');
    sendMutation.mutate(clean);
  };

  return (
    <Flex h="calc(100vh - 88px)" bg="#F6F8FB" overflow="hidden">
      <Box w={{ base: '100%', md: '380px' }} bg="white" borderRight="1px solid #E5E7EB" display={{ base: selectedConversation ? 'none' : 'block', md: 'block' }}>
        <Box p={5} borderBottom="1px solid #EEF2F7">
          <Text fontSize="2xl" fontWeight="900" color={primary}>
            Messages
          </Text>
          <Text mt={1} fontSize="sm" color="#64748B">
            Chat with recruiters after applying
          </Text>
          <InputGroup mt={4}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="#94A3B8" />
            </InputLeftElement>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search company or job posting..."
              borderRadius="999px"
              bg="#F8FAFC"
              borderColor="#EEF2F7"
            />
          </InputGroup>
        </Box>

        <VStack align="stretch" spacing={1} py={3} overflowY="auto" h="calc(100% - 150px)">
          {conversationsQuery.isLoading || openConversationMutation.isPending ? (
            <Center py={12}><Spinner color={primary} /></Center>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((item) => (
              <ConversationRow key={item.id} item={item} active={item.id === selectedConversation?.id} onClick={() => setSelectedId(item.id)} />
            ))
          ) : (
            <Center py={14} px={6} textAlign="center">
              <VStack spacing={3}>
                <Icon as={FiMessageCircle} fontSize="42px" color="#CBD5E1" />
                <Text color="#64748B" fontSize="sm">
                  No conversations yet. Click Message on an applied job to start.
                </Text>
              </VStack>
            </Center>
          )}
        </VStack>
      </Box>

      <Flex flex="1" direction="column" bg="linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 100%)">
        {!selectedConversation ? (
          <Center flex="1">
            <VStack spacing={3}>
              <Icon as={FiMessageCircle} fontSize="58px" color="#CBD5E1" />
              <Text color="#64748B" fontSize="md">You do not have any conversations yet</Text>
            </VStack>
          </Center>
        ) : (
          <>
            <Flex px={6} py={4} bg="white" borderBottom="1px solid #E5E7EB" align="center" justify="space-between">
              <HStack spacing={3} minW={0}>
                <Avatar size="md" name={getCompanyName(selectedConversation)} src={getLogo(selectedConversation) || undefined} />
                <Box minW={0}>
                  <Text fontWeight="900" color="#1F2937" noOfLines={1}>{getCompanyName(selectedConversation)}</Text>
                  <HStack spacing={2} mt={1} color="#64748B">
                    <Icon as={FiBriefcase} fontSize="13px" />
                    <Text fontSize="sm" noOfLines={1}>{getJobTitle(selectedConversation)}</Text>
                  </HStack>
                </Box>
              </HStack>
              <Badge bg="#DCFCE7" color="#16A34A" borderRadius="full" px={3} py={1}>Applied</Badge>
            </Flex>

            <Box ref={messageListRef} flex="1" overflowY="auto" px={{ base: 4, md: 8 }} py={6}>
              {messagesQuery.isLoading ? (
                <Center h="100%"><Spinner color={primary} /></Center>
              ) : orderedMessages.length > 0 ? (
                <VStack align="stretch" spacing={4}>
                  {orderedMessages.map((message) => <MessageBubble key={message.id} message={message} />)}
                  <div ref={bottomRef} />
                </VStack>
              ) : (
                <Center h="100%">
                  <VStack spacing={3} textAlign="center">
                    <Icon as={FiMessageCircle} fontSize="52px" color="#CBD5E1" />
                    <Text fontWeight="800" color="#1F2937">Start the conversation</Text>
                    <Text color="#64748B" fontSize="sm">Send a greeting or question about this position to the recruiter.</Text>
                  </VStack>
                </Center>
              )}
            </Box>

            <Box p={5} bg="white" borderTop="1px solid #E5E7EB">
              <Flex gap={3} align="end">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  minH="52px"
                  maxH="120px"
                  resize="none"
                  borderRadius="18px"
                  bg="#F8FAFC"
                  borderColor="#E5E7EB"
                />
                <IconButton
                  aria-label="send"
                  icon={<FiSend />}
                  h="52px"
                  w="56px"
                  borderRadius="18px"
                  bg={primary}
                  color="white"
                  isLoading={sendMutation.isPending}
                  _hover={{ bg: '#26345F' }}
                  onClick={handleSend}
                />
              </Flex>
            </Box>
          </>
        )}
      </Flex>
    </Flex>
  );
}
