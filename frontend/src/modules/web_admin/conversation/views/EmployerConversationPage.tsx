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
import { FiBriefcase, FiMail, FiMessageCircle, FiPhone, FiSearch, FiSend, FiUser } from 'react-icons/fi';
import { useAuthStore } from '../../../auth/store/auth.store';
import { resolveCompanyLogoUrl } from '../../../../utils/companyLogo';
import type { ChatConversation, ChatMessage } from '../api/conversation.api';
import {
  useConversationMessages,
  useEmployerConversations,
  useMarkConversationAsRead,
  useSendConversationMessage,
} from '../api/conversation.hooks';

const primary = '#334371';

const getRoleValues = (user: unknown) => {
  const currentUser = user as any;
  const roleItems = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const rawRoles = [
    ...roleItems.flatMap((item: any) => [
      typeof item === 'string' ? item : '',
      item?.role,
      item?.role?.name_role,
      item?.role?.role_code,
      item?.name_role,
      item?.role_code,
      item?.name,
    ]),
    currentUser?.role,
    currentUser?.role?.name_role,
    currentUser?.role?.role_code,
    currentUser?.actorRole,
    currentUser?.actor_role,
  ];

  return rawRoles
    .filter((role) => typeof role === 'string' && role.trim())
    .map((role) => role.trim().toLowerCase());
};

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

const getCandidateName = (item?: ChatConversation) => {
  if (!item) return 'Candidate';
  return item.candidate?.candidate_name || item.candidate?.email || item.candidate?.phone_number || 'Candidate';
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

const getCompanyName = (item?: ChatConversation) => {
  if (!item) return 'Company';
  return item.company?.full_name || item.company?.acronym_name || 'Company';
};

function ConversationRow({ item, active, onClick }: { item: ChatConversation; active: boolean; onClick: () => void }) {
  const candidateName = getCandidateName(item);
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
      <Avatar size="md" name={candidateName} src={item.candidate?.avatar_file || undefined} bg="#EEF2FF" color={primary} />
      <Box minW={0} flex="1">
        <HStack justify="space-between" align="start">
          <Text fontSize="sm" fontWeight="800" color="#1F2937" noOfLines={1}>{candidateName}</Text>
          <Text fontSize="11px" color="#94A3B8" whiteSpace="nowrap">{formatTime(item.last_message_at || item.created_at)}</Text>
        </HStack>
        <Text mt="2px" fontSize="xs" color="#64748B" noOfLines={1}>{jobTitle}</Text>
        <HStack mt={1.5} justify="space-between" spacing={2}>
          <Text fontSize="xs" color="#94A3B8" noOfLines={1} flex="1">{item.last_message || 'The candidate has applied, so you can start the conversation'}</Text>
          {item.employer_unread_count > 0 ? (
            <Badge borderRadius="full" bg="#16A34A" color="white" px={2}>{item.employer_unread_count}</Badge>
          ) : null}
        </HStack>
      </Box>
    </Flex>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isMine = message.sender_type === 'EMPLOYER';
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
        <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.7">{message.content}</Text>
        <HStack mt={1.5} justify="flex-end" spacing={2}>
          <Text fontSize="10px" color={isMine ? 'whiteAlpha.700' : '#94A3B8'}>{statusLabel}</Text>
          <Text fontSize="10px" color={isMine ? 'whiteAlpha.700' : '#94A3B8'}>{formatTime(message.created_at)}</Text>
        </HStack>
      </Box>
    </Flex>
  );
}

export default function EmployerConversationPage() {
  const currentUser = useAuthStore((state) => state.user);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [content, setContent] = useState('');
  const normalizedRoles = useMemo(() => getRoleValues(currentUser), [currentUser]);
  const isAdmin = normalizedRoles.includes('admin');
  const isEmployee = normalizedRoles.includes('employee');
  const isEmployerRole = normalizedRoles.includes('employer');
  const canReply = isEmployee || isEmployerRole;
  const messagePlaceholder = isEmployee ? 'Enter a support message...' : 'Enter a message for the candidate...';

  const pageText = useMemo(() => {
    const isAdminOrStaff = isAdmin || isEmployee;

    if (isAdminOrStaff) {
      return {
        title: 'Conversation management',
        subtitle: 'Support and monitor conversations between candidates and recruiters',
      };
    }

    if (isEmployerRole) {
      return {
        title: 'Candidate inbox',
        subtitle: 'Chat with candidates who applied to your company job postings',
      };
    }

    return {
      title: 'Candidate Inbox',
      subtitle: 'Manage conversations with candidates who have applied for job postings',
    };
  }, [isAdmin, isEmployee, isEmployerRole]);

  const conversationsQuery = useEmployerConversations();
  const conversations = conversationsQuery.data || [];
  const markReadMutation = useMarkConversationAsRead();

  useEffect(() => {
    if (!selectedId && conversations[0]?.id) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  const filteredConversations = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((item) => `${getCandidateName(item)} ${getJobTitle(item)} ${getCompanyName(item)} ${item.last_message || ''}`.toLowerCase().includes(q));
  }, [conversations, keyword]);

  const selectedConversation = conversations.find((item) => item.id === selectedId) || conversations[0];
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
    if (isAdmin || !canReply || !clean || !selectedConversation?.id || sendMutation.isPending) return;
    setContent('');
    sendMutation.mutate(clean);
  };

  return (
    <Box minH="calc(100vh - 200px)">
      <Flex h="calc(100vh - 150px)" bg="white" borderRadius="28px" overflow="hidden" boxShadow="0 22px 70px rgba(15,23,42,0.10)" border="1px solid #E5E7EB">
        <Box w={{ base: '100%', md: '390px' }} mt={5}  borderRight="1px solid #E5E7EB" display={{ base: selectedConversation ? 'none' : 'block', md: 'block' }}>
          <Box p={5} borderBottom="1px solid #EEF2F7" bg="linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 100%)">
            <Text fontSize="2xl" fontWeight="900" color={primary}>{pageText.title}</Text>
            <Text mt={1} fontSize="sm" color="#64748B">{pageText.subtitle}</Text>
            <InputGroup mt={4}>
              <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="#94A3B8" /></InputLeftElement>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Find candidates, job postings..." borderRadius="999px" bg="white" borderColor="#E5E7EB" />
            </InputGroup>
          </Box>

          <VStack align="stretch" spacing={1} py={3} overflowY="auto" h="calc(100% - 150px)">
            {conversationsQuery.isLoading ? (
              <Center py={12}><Spinner color={primary} /></Center>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((item) => <ConversationRow key={item.id} item={item} active={item.id === selectedConversation?.id} onClick={() => setSelectedId(item.id)} />)
            ) : (
              <Center py={14} px={6} textAlign="center">
                <VStack spacing={3}>
                  <Icon as={FiMessageCircle} fontSize="42px" color="#CBD5E1" />
                  <Text color="#64748B" fontSize="sm">No conversation has been possible with the candidate yet.</Text>
                </VStack>
              </Center>
            )}
          </VStack>
        </Box>

        <Flex  mt={7} flex="1" direction="column" bg="linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 100%)">
          {!selectedConversation ? (
            <Center flex="1"><VStack spacing={3}><Icon as={FiMessageCircle} fontSize="58px" color="#CBD5E1" /><Text color="#64748B">No conversations yet</Text></VStack></Center>
          ) : (
            <>
              <Flex px={6} py={4} bg="white" borderBottom="1px solid #E5E7EB" align="center" justify="space-between">
                <HStack spacing={3} minW={0}>
                  <Avatar size="md" name={getCandidateName(selectedConversation)} src={selectedConversation.candidate?.avatar_file || undefined} />
                  <Box minW={0}>
                    <Text fontWeight="900" color="#1F2937" noOfLines={1}>{getCandidateName(selectedConversation)}</Text>
                    <HStack spacing={2} mt={1} color="#64748B">
                      <Icon as={FiBriefcase} fontSize="13px" />
                      <Text fontSize="sm" noOfLines={1}>{getJobTitle(selectedConversation)}</Text>
                    </HStack>
                  </Box>
                </HStack>
                <HStack spacing={3} display={{ base: 'none', lg: 'flex' }}>
                  <Badge bg="#EEF2FF" color={primary} borderRadius="full" px={3} py={1}>{getCompanyName(selectedConversation)}</Badge>
                  <Avatar size="sm" name={getCompanyName(selectedConversation)} src={resolveCompanyLogoUrl(selectedConversation.company?.image_logo || undefined) || undefined} />
                </HStack>
              </Flex>

              <Flex flex="1" overflow="hidden">
                <Box flex="1" overflowY="auto" px={{ base: 4, md: 8 }} py={6}>
                  {messagesQuery.isLoading ? (
                    <Center h="100%"><Spinner color={primary} /></Center>
                  ) : orderedMessages.length > 0 ? (
                    <VStack align="stretch" spacing={4}>
                      {orderedMessages.map((message) => <MessageBubble key={message.id} message={message} />)}
                      <div ref={bottomRef} />
                    </VStack>
                  ) : (
                    <Center h="100%"><VStack spacing={3} textAlign="center"><Icon as={FiMessageCircle} fontSize="52px" color="#CBD5E1" /><Text fontWeight="800" color="#1F2937">Start a conversation with the candidate</Text><Text color="#64748B" fontSize="sm">Send interview information, request a CV update, or respond to the application.</Text></VStack></Center>
                  )}
                </Box>

                <Box w="280px" borderLeft="1px solid #E5E7EB" bg="white" p={5} display={{ base: 'none', xl: 'block' }}>
                  <VStack align="stretch" spacing={4}>
                    <Center><Avatar size="xl" name={getCandidateName(selectedConversation)} src={selectedConversation.candidate?.avatar_file || undefined} /></Center>
                    <Box textAlign="center">
                      <Text fontWeight="900" color="#1F2937">{getCandidateName(selectedConversation)}</Text>
                      <Text fontSize="sm" color="#64748B" mt={1}>The candidate has applied.</Text>
                    </Box>
                    <VStack align="stretch" spacing={3} fontSize="sm" color="#475569">
                      <HStack><Icon as={FiMail} color={primary} /><Text noOfLines={1}>{selectedConversation.candidate?.email || 'No email'}</Text></HStack>
                      <HStack><Icon as={FiPhone} color={primary} /><Text>{selectedConversation.candidate?.phone_number || 'No phone number'}</Text></HStack>
                      <HStack align="start"><Icon as={FiUser} color={primary} mt={1} /><Text>{getJobTitle(selectedConversation)}</Text></HStack>
                    </VStack>
                  </VStack>
                </Box>
              </Flex>

              {isAdmin ? (
                <Box p={5} bg="white" borderTop="1px solid #E5E7EB">
                  <Box border="1px solid #E5E7EB" bg="#F8FAFC" borderRadius="18px" px={4} py={3}>
                    <Text fontSize="sm" color="#475569" fontWeight="600">
                      Admins can only monitor conversations. Support staff or recruiters can reply to candidates.
                    </Text>
                  </Box>
                </Box>
              ) : canReply ? (
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
                      placeholder={messagePlaceholder}
                      minH="52px"
                      maxH="120px"
                      resize="none"
                      borderRadius="18px"
                      bg="#F8FAFC"
                      borderColor="#E5E7EB"
                    />
                    <IconButton aria-label="send" icon={<FiSend />} h="52px" w="56px" borderRadius="18px" bg={primary} color="white" isLoading={sendMutation.isPending} _hover={{ bg: '#26345F' }} onClick={handleSend} />
                  </Flex>
                </Box>
              ) : null}
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
