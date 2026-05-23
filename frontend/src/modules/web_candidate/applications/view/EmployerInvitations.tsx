import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiInbox,
  FiMapPin,
  FiMessageCircle,
  FiShield,
  FiX,
} from "react-icons/fi";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  acceptContactRequest,
  declineContactRequest,
  useGetMyApplications,
  type CandidateMyApplicationRecord,
} from "../../job/api/applyJob";
import { APPLICATION_STATUS } from "../../../../constant";
import { formatSalary, type IJobItem } from "../../job/types/job";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";
import { ensureConversationForApplication } from "../api/getMyApplications";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { candidateConversationUrl } from "../../../../routes/urls";
import { useCandidateConversations } from "../../conversation/api/conversation.hooks";
import apiClient from "../../../../lib/api";

type InvitationJobView = {
  applicationId: string;
  status: string;
  appliedAt?: string;
  job: IJobItem;
};

type CandidateNotificationItem = {
  id: string;
  type?: string;
  title?: string;
  content?: string | null;
  is_read?: boolean;
  created_at?: string;
  related_type?: string | null;
  related_id?: string | null;
};

const formatNotificationTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const isInterviewNotification = (notification?: CandidateNotificationItem | null) => {
  const text = `${notification?.title || ""} ${notification?.content || ""}`.toLowerCase();
  return text.includes("phỏng vấn") || text.includes("interview");
};

const mapApplicationToJob = (
  item: CandidateMyApplicationRecord,
): InvitationJobView | null => {
  const rec = item?.recruitment_infor;
  if (!rec?.id) return null;

  return {
    applicationId: item.id,
    status: item.status,
    appliedAt: item.applied_at || item.created_at || undefined,
    job: {
      id: rec.id,
      recruitment_code: rec.recruitment_code,
      internal_title: rec.internal_title,
      post_title: rec.post_title,
      salary_from: rec.salary_from,
      salary_to: rec.salary_to,
      salary_currency: rec.salary_currency,
      rank_name: rec.rank?.name_rank || null,
      department: rec.department
        ? {
            id: rec.department.id,
            full_name: rec.department.full_name,
            acronym_name: rec.department.acronym_name,
            image_logo: rec.department.image_logo,
            address: rec.department.address,
            short_address: rec.department.short_address,
          }
        : null,
      workLocation: rec.workLocation
        ? {
            id: rec.workLocation.id,
            full_name: rec.workLocation.full_name,
            acronym_name: rec.workLocation.acronym_name,
            address: rec.workLocation.address,
            short_address: rec.workLocation.short_address,
          }
        : null,
    },
  };
};

export default function EmployerInvitations() {
  const notify = useNotify();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedApplicationId = searchParams.get("application_id");
  const notificationId = searchParams.get("notification_id");
  const { data: conversationsData } = useCandidateConversations();
  const {
    data: contactedData,
    isLoading: isLoadingContacted,
    isError: isContactedError,
    refetch: refetchContacted,
  } = useGetMyApplications(APPLICATION_STATUS.CONTACTED);
  const { data: interviewingData } = useGetMyApplications(
    APPLICATION_STATUS.INTERVIEWING,
    {
      enabled: Boolean(selectedApplicationId),
    },
  );
  const notificationDetailQuery = useQuery({
    queryKey: ["candidate-notification-detail", notificationId],
    enabled: Boolean(notificationId),
    queryFn: async () => {
      const response = await apiClient.get(`/notifications/${notificationId}`);
      return (response.data?.data ?? response.data) as CandidateNotificationItem;
    },
  });

  const isLoading = isLoadingContacted;
  const isError = isContactedError;

  const selectedApplication = useMemo(() => {
    if (!selectedApplicationId) return null;

    const applications = [
      ...(Array.isArray(contactedData) ? contactedData : []),
      ...(Array.isArray(interviewingData) ? interviewingData : []),
    ];

    return (
      applications
        .map(mapApplicationToJob)
        .find((item): item is InvitationJobView =>
          Boolean(item && item.applicationId === selectedApplicationId),
        ) || null
    );
  }, [contactedData, interviewingData, selectedApplicationId]);

  const pendingInvitations = useMemo(() => {
    if (!Array.isArray(contactedData)) return [] as InvitationJobView[];

    return contactedData.flatMap((item) => {
      // Only show invitations that have NOT been accepted yet
      if (item.connection_accepted) return [];
      const mapped = mapApplicationToJob(item);
      return mapped ? [mapped] : [];
    });
  }, [contactedData]);

  const chattedApplicationIds = useMemo(() => {
    if (!Array.isArray(conversationsData)) return new Set<string>();

    return new Set(
      conversationsData
        .filter((item) => Boolean(item.last_message || item.last_message_at))
        .map((item) => item.application_id)
        .filter((id): id is string => Boolean(id)),
    );
  }, [conversationsData]);

  const acceptedConnections = useMemo(() => {
    if (!Array.isArray(contactedData)) return [] as InvitationJobView[];

    // Show accepted invitations that have not had any chat messages yet.
    return contactedData.flatMap((item) => {
      if (!item.connection_accepted) return [];
      if (chattedApplicationIds.has(item.id)) return [];
      const mapped = mapApplicationToJob(item);
      return mapped ? [mapped] : [];
    });
  }, [contactedData, chattedApplicationIds]);

  const handleAccept = async (applicationId: string) => {
    try {
      setProcessingId(applicationId);
      await acceptContactRequest(applicationId);

      notify({
        message: "Invitation accepted",
        description: "Redirecting to conversation...",
        type: "success",
        duration: 2,
      });

      await refetchContacted();
      
      // Auto-navigate to conversation page
      navigate(`${candidateConversationUrl}?application_id=${applicationId}`);
    } catch (error: any) {
      notify({
        message: "Unable to accept invitation",
        description: error?.message || "Please try again.",
        type: "error",
        duration: 3,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (applicationId: string) => {
    try {
      setProcessingId(applicationId);
      await declineContactRequest(applicationId);

      notify({
        message: "Invitation declined",
        description: "This employer will not be able to message you.",
        type: "info",
        duration: 3,
        
      });

      await refetchContacted();
    } catch (error: any) {
      notify({
        message: "Unable to decline invitation",
        description: error?.message || "Please try again.",
        type: "error",
        duration: 3,
        
      });
    } finally {
      setProcessingId(null);
    }
  };

 const handleStartChat = async (applicationId: string) => {
  try {
    setProcessingId(applicationId);

    await ensureConversationForApplication(applicationId);

    navigate(`${candidateConversationUrl}?application_id=${applicationId}`);
  } catch (error: any) {
    notify({
      message: "Unable to open chat",
      description: error?.message || "Please try again.",
      type: "error",
      duration: 3,
      
    });
  } finally {
    setProcessingId(null);
  }
};

  const renderNotificationDetail = () => {
    if (!notificationId && !selectedApplicationId) {
      return null;
    }

    const notification = notificationDetailQuery.data;
    const interviewNotification = isInterviewNotification(notification);
    const jobTitle =
      selectedApplication?.job.post_title ||
      selectedApplication?.job.internal_title ||
      "Recruitment news";
    const companyName = selectedApplication?.job.department?.full_name || "Updating";
    const location =
      selectedApplication?.job.workLocation?.short_address ||
      selectedApplication?.job.workLocation?.full_name ||
      "Updating";

    return (
      <Box
        mb={5}
        p={{ base: 5, md: 6 }}
        borderRadius="22px"
        bg="white"
        border="1px solid"
        borderColor="rgba(51, 67, 113, 0.18)"
        boxShadow="0 14px 38px rgba(15, 23, 42, 0.07)"
      >
        <HStack align="start" spacing={3}>
          <Flex
            w="44px"
            h="44px"
            minW="44px"
            borderRadius="16px"
            bg="rgba(51, 67, 113, 0.10)"
            color="#334371"
            align="center"
            justify="center"
          >
            <Icon as={FiCalendar} boxSize={5} />
          </Flex>

          <Box flex="1" minW={0}>
            <Badge
              bg="rgba(51, 67, 113, 0.10)"
              color="#334371"
              borderRadius="full"
              px={3}
              py={1}
              fontSize="12px"
              fontWeight="700"
            >
              {interviewNotification ? "Interview invitation" : "Employer notification"}
            </Badge>

            <Heading mt={3} fontSize={{ base: "lg", md: "xl" }} color="#1F2937">
              {notification?.title ||
                (interviewNotification ? "Interview invitation detail" : "Notification detail")}
            </Heading>

            {notificationDetailQuery.isLoading ? (
              <HStack mt={4} color="#6B7280">
                <Spinner size="sm" />
                <Text fontSize="sm">Loading invitation detail...</Text>
              </HStack>
            ) : notificationDetailQuery.isError ? (
              <Text mt={4} color="#6B7280" fontSize="sm">
                Unable to load this notification detail.
              </Text>
            ) : (
              <>
                {notification?.created_at && (
                  <Text mt={2} color="#8A94A6" fontSize="sm" fontWeight="600">
                    {formatNotificationTime(notification.created_at)}
                  </Text>
                )}

                <Text mt={4} color="#374151" fontSize="md" lineHeight="1.8" whiteSpace="pre-line">
                  {notification?.content ||
                    "The employer has sent you an update about this application."}
                </Text>
              </>
            )}

            {selectedApplication && (
              <Box
                mt={5}
                p={4}
                borderRadius="16px"
                bg="#F8FAFC"
                border="1px solid"
                borderColor="#E5E7EB"
              >
                <Text fontSize="sm" fontWeight="800" color="#1F2937">
                  {jobTitle}
                </Text>
                <HStack mt={2} spacing={3} flexWrap="wrap" color="#6B7280" fontSize="sm">
                  <HStack spacing={1.5}>
                    <Icon as={FiBriefcase} boxSize={3.5} />
                    <Text>{companyName}</Text>
                  </HStack>
                  <HStack spacing={1.5}>
                    <Icon as={FiMapPin} boxSize={3.5} />
                    <Text>{location}</Text>
                  </HStack>
                </HStack>
              </Box>
            )}
          </Box>
        </HStack>
      </Box>
    );
  };

  const renderJobCard = (
    item: InvitationJobView,
    variant: "pending" | "accepted",
  ) => {
    const title = item.job.post_title || item.job.internal_title || "Recruitment news";
    const companyName = item.job.department?.full_name || "Updating";
    const location =
      item.job.workLocation?.short_address ||
      item.job.workLocation?.full_name ||
      "Updating";
    const salary = formatSalary(
      item.job.salary_from,
      item.job.salary_to,
      item.job.salary_currency,
    );
    const isProcessing = processingId === item.applicationId;

    return (
      <LinkBox
        key={`${variant}-${item.applicationId}`}
        position="relative"
        bg="white"
        border="1px solid"
        borderColor={variant === "accepted" ? "rgba(51, 67, 113, 0.16)" : "#E5E7EB"}
        borderRadius="20px"
        px={{ base: 3.5, md: 4 }}
        py={{ base: 3.5, md: 4 }}
        boxShadow={
          variant === "accepted"
            ? "0 10px 28px rgba(51, 67, 113, 0.08)"
            : "0 1px 2px rgba(16,24,40,0.04)"
        }
        transition="all 0.2s ease"
        overflow="hidden"
        _before={{
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          bg: "#334371",
          opacity: variant === "accepted" ? 1 : 0.75,
        }}
        _hover={{
          boxShadow: "0 12px 28px rgba(51,67,113,0.14)",
          transform: "translateY(-2px)",
        }}
      >
        <Flex gap={3.5} align="stretch">
          <Flex
            w={{ base: "72px", md: "82px" }}
            h={{ base: "72px", md: "82px" }}
            minW={{ base: "72px", md: "82px" }}
            bg="white"
            border="1px solid"
            borderColor="#E5E7EB"
            borderRadius="14px"
            align="center"
            justify="center"
            overflow="hidden"
            p={2}
          >
            <Image
              src={resolveCompanyLogoUrl(item.job.department?.image_logo)}
              alt={companyName}
              objectFit="contain"
              w="78%"
              h="78%"
            />
          </Flex>

          <Flex flex="1" direction="column" minW={0}>
            <Flex justify="space-between" align="start" gap={3}>
              <Box minW={0} flex="1">
                {variant === "accepted" && (
                  <Badge
                    mb={2}
                    bg="rgba(51, 67, 113, 0.10)"
                    color="#334371"
                    borderRadius="full"
                  >
                    Accepted
                  </Badge>
                )}

                <LinkOverlay as={RouterLink} to={`/it-job/jobs/${item.job.id}`}>
                  <Text
                    fontSize="md"
                    fontWeight="700"
                    color="#1F2937"
                    lineHeight="1.35"
                    noOfLines={2}
                    _hover={{ color: "#334371" }}
                  >
                    {title}
                  </Text>
                </LinkOverlay>

                <Text
                  mt="2px"
                  color="#6B7280"
                  fontSize="sm"
                  fontWeight="500"
                  textTransform="uppercase"
                  noOfLines={1}
                >
                  {companyName}
                </Text>
              </Box>

              <Text
                color="#334371"
                fontSize={{ base: "sm", md: "md" }}
                fontWeight="700"
                lineHeight="1.2"
                whiteSpace="nowrap"
              >
                {salary}
              </Text>
            </Flex>

            <HStack spacing={2} mt={3} flexWrap="wrap">
              <Tag
                px={3}
                py={1.5}
                borderRadius="999px"
                bg="#F3F5F7"
                color="#4B5563"
                fontSize="sm"
                fontWeight="500"
              >
                <HStack spacing={1.5}>
                  <Icon as={FiMapPin} boxSize={3.5} color="#6B7280" />
                  <Text>{location}</Text>
                </HStack>
              </Tag>

              <Tag
                px={3}
                py={1.5}
                borderRadius="999px"
                bg="rgba(51, 67, 113, 0.10)"
                color="#334371"
                fontSize="sm"
                fontWeight="700"
              >
                {variant === "accepted" ? "Chat enabled" : "Pending response"}
              </Tag>
            </HStack>

            <Flex
              mt={4}
              justify="space-between"
              align={{ base: "stretch", md: "center" }}
              gap={3}
              direction={{ base: "column", md: "row" }}
            >
              <Text fontSize="sm" color="#6B7280" fontWeight="500">
                {variant === "accepted"
                  ? "You accepted this invitation. You can now start a conversation with this employer."
                  : "Accepting this invitation will allow the employer to contact you."}
              </Text>

              {variant === "pending" ? (
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    leftIcon={<FiCheck />}
                    bg="#334371"
                    color="white"
                    borderRadius="999px"
                    isLoading={isProcessing}
                    onClick={(event) => {
                      event.preventDefault();
                      handleAccept(item.applicationId);
                    }}
                    _hover={{ bg: "#28365C" }}
                  >
                    Accept
                  </Button>

                  <Button
                    size="sm"
                    leftIcon={<FiX />}
                    variant="outline"
                    color="#334371"
                    borderColor="rgba(51, 67, 113, 0.32)"
                    borderRadius="999px"
                    isLoading={isProcessing}
                    onClick={(event) => {
                      event.preventDefault();
                      handleDecline(item.applicationId);
                    }}
                    _hover={{ bg: "rgba(51, 67, 113, 0.06)" }}
                  >
                    Decline
                  </Button>
                </HStack>
              ) : (
                <Button
                  size="sm"
                  leftIcon={<FiMessageCircle />}
                  bg="#334371"
                  color="white"
                  borderRadius="999px"
                  isLoading={isProcessing}
                  onClick={(event) => {
                    event.preventDefault();
                    handleStartChat(item.applicationId);
                  }}
                  _hover={{ bg: "#28365C" }}
                >
                  Start chat
                </Button>
              )}
            </Flex>
          </Flex>
        </Flex>
      </LinkBox>
    );
  };

  return (
    <Box minH="100vh" py={{ base: 5, md: 7 }}>
      <Container maxW="1220px">
        <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={{ base: 5, xl: 8 }}>
          <Box gridColumn={{ base: "span 1", xl: "span 8" }}>
            <Box
              mb={5}
              p={{ base: 5, md: 6 }}
              borderRadius="24px"
              bg="linear-gradient(135deg, #F8FAFF 0%, #FFFFFF 100%)"
              border="1px solid"
              borderColor="rgba(51, 67, 113, 0.12)"
              boxShadow="0 18px 50px rgba(15, 23, 42, 0.06)"
            >
              <HStack spacing={3} align="start">
                <Flex
                  w="44px"
                  h="44px"
                  minW="44px"
                  borderRadius="16px"
                  bg="#334371"
                  color="white"
                  align="center"
                  justify="center"
                >
                  <Icon as={FiMessageCircle} boxSize={5} />
                </Flex>

                <Box>
                  <Heading fontSize={{ base: "lg", md: "xl" }} color="#1F2937">
                    Career Opportunity Invitation
                  </Heading>

                  <VStack align="stretch" spacing={2} mt={3}>
                    <Text fontSize="sm" color="#4B5563" lineHeight="1.8">
                      Employers have been impressed with your profile and
                      proactively sent you exclusive career opportunities.
                    </Text>
                    <Text fontSize="sm" color="#4B5563" lineHeight="1.8">
                      Please click Accept to allow the employer to contact you
                      and discuss further details.
                    </Text>
                    <Text fontSize="sm" color="#4B5563" lineHeight="1.8">
                      If you feel the opportunity is not suitable or you're not
                      ready, click Decline.
                    </Text>
                    <Text fontSize="sm" color="#4B5563" lineHeight="1.8">
                      Timely responses will help you receive better
                      recommendations and maintain a professional profile.
                    </Text>
                  </VStack>
                </Box>
              </HStack>
            </Box>

            {renderNotificationDetail()}

            <Flex justify="space-between" align="center" mb={4}>
              <Box>
                <Heading fontSize={{ base: "md", md: "lg" }} color="#1F2937">
                  Pending invitations
                </Heading>
                <Text color="#6B7280" fontSize="sm" mt={1}>
                  Total {pendingInvitations.length} pending invitation(s).
                </Text>
              </Box>
            </Flex>

            {isLoading ? (
              <Flex align="center" justify="center" py={16}>
                <Spinner size="lg" color="#334371" />
              </Flex>
            ) : isError ? (
              <Box bg="white" borderRadius="18px" border="1px solid" borderColor="#E5E7EB" p={6}>
                <Text color="#6B7280">Unable to load employer invitations.</Text>
              </Box>
            ) : (
              <>
                {pendingInvitations.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    {pendingInvitations.map((item) => renderJobCard(item, "pending"))}
                  </VStack>
                ) : (
                  <Box bg="white" borderRadius="18px" border="1px solid" borderColor="#E5E7EB" p={8}>
                    <Flex direction="column" align="center" justify="center" py={10}>
                      <Icon as={FiInbox} boxSize={10} color="#9CA3AF" />
                      <Text color="#374151" fontSize="md" fontWeight="700" mt={3}>
                        No pending invitations
                      </Text>
                      <Text color="#6B7280" fontSize="sm" mt={1} textAlign="center">
                        When employers request to connect with you, their invitations will appear here.
                      </Text>
                    </Flex>
                  </Box>
                )}

                {acceptedConnections.length > 0 && (
                  <Box mt={8}>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Box>
                        <Heading fontSize={{ base: "md", md: "lg" }} color="#1F2937">
                          Accepted connections
                        </Heading>
                        <Text color="#6B7280" fontSize="sm" mt={1}>
                          These employers can now contact you and continue the conversation.
                        </Text>
                      </Box>
                    </Flex>

                    <VStack spacing={4} align="stretch">
                      {acceptedConnections.map((item) => renderJobCard(item, "accepted"))}
                    </VStack>
                  </Box>
                )}
              </>
            )}
          </Box>

          <Box gridColumn={{ base: "span 1", xl: "span 4" }} display={{ base: "none", xl: "block" }}>
            <Box position="sticky" top="88px">
              <VStack align="stretch" spacing={4}>
                <Box
                  borderRadius="24px"
                  bg="linear-gradient(135deg, #F4F6FB 0%, #FFFFFF 60%, #EEF2FA 100%)"
                  border="1px solid"
                  borderColor="rgba(51, 67, 113, 0.14)"
                  boxShadow="0 18px 50px rgba(51, 67, 113, 0.10)"
                  p={6}
                  overflow="hidden"
                  position="relative"
                >
                  <Box
                    position="absolute"
                    right="-34px"
                    top="-34px"
                    w="120px"
                    h="120px"
                    borderRadius="full"
                    bg="rgba(51, 67, 113, 0.08)"
                  />

                  <VStack align="stretch" spacing={4} position="relative">
                    <Badge
                      w="fit-content"
                      bg="rgba(51, 67, 113, 0.10)"
                      color="#334371"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="12px"
                      fontWeight="700"
                    >
                      Privacy first
                    </Badge>

                    <Heading fontSize="xl" color="#1F2937" lineHeight="1.4">
                      You decide who can contact you
                    </Heading>

                    <Text fontSize="sm" color="#5B6476" lineHeight="1.8">
                      Employers can only message you after you accept their invitation.
                      Declined invitations will not open a chat.
                    </Text>

                    <VStack align="stretch" spacing={3}>
                      <HStack align="start" spacing={3}>
                        <Flex
                          w="30px"
                          h="30px"
                          minW="30px"
                          borderRadius="12px"
                          bg="rgba(51, 67, 113, 0.10)"
                          color="#334371"
                          align="center"
                          justify="center"
                        >
                          <Icon as={FiShield} boxSize={4} />
                        </Flex>
                        <Text fontSize="sm" color="#4B5563">
                          Your profile stays protected until you agree.
                        </Text>
                      </HStack>

                      <HStack align="start" spacing={3}>
                        <Flex
                          w="30px"
                          h="30px"
                          minW="30px"
                          borderRadius="12px"
                          bg="rgba(51, 67, 113, 0.10)"
                          color="#334371"
                          align="center"
                          justify="center"
                        >
                          <Icon as={FiBriefcase} boxSize={4} />
                        </Flex>
                        <Text fontSize="sm" color="#4B5563">
                          Review the job details before accepting.
                        </Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </Box>

                <SimpleGrid columns={2} spacing={3}>
                  <Box
                    borderRadius="20px"
                    bg="linear-gradient(135deg, #334371 0%, #4A5A8A 100%)"
                    color="white"
                    p={4}
                    boxShadow="0 14px 34px rgba(51, 67, 113, 0.24)"
                  >
                    <Text fontSize="xs" opacity={0.8} fontWeight="700">
                      Pending
                    </Text>
                    <Text fontSize="3xl" fontWeight="800" lineHeight="1.1" mt={2}>
                      {pendingInvitations.length}
                    </Text>
                    <Text fontSize="xs" opacity={0.85} mt={2}>
                      Employer invitation(s)
                    </Text>
                  </Box>

                  <Box
                    borderRadius="20px"
                    bg="linear-gradient(135deg, #F4F6FB 0%, #FFFFFF 100%)"
                    border="1px solid"
                    borderColor="rgba(51, 67, 113, 0.16)"
                    p={4}
                  >
                    <Text fontSize="xs" color="#334371" fontWeight="700">
                      Accepted
                    </Text>
                    <Text fontSize="2xl" fontWeight="800" color="#334371" mt={2}>
                      {acceptedConnections.length}
                    </Text>
                    <Text fontSize="xs" color="#5B6476" mt={2}>
                      Chat-enabled connection(s)
                    </Text>
                  </Box>
                </SimpleGrid>

                <Box
                  borderRadius="24px"
                  bg="linear-gradient(135deg, #F7F8FC 0%, #FFFFFF 100%)"
                  border="1px solid"
                  borderColor="rgba(51, 67, 113, 0.14)"
                  boxShadow="0 14px 36px rgba(51, 67, 113, 0.08)"
                  p={5}
                >
                  <VStack align="stretch" spacing={4}>
                    <HStack spacing={3}>
                      <Flex
                        w="38px"
                        h="38px"
                        minW="38px"
                        borderRadius="14px"
                        bg="rgba(51, 67, 113, 0.10)"
                        color="#334371"
                        align="center"
                        justify="center"
                      >
                        <Icon as={FiMessageCircle} boxSize={5} />
                      </Flex>

                      <Box>
                        <Text fontWeight="800" color="#1F2937">
                          Response quality matters
                        </Text>
                        <Text fontSize="sm" color="#6B7280">
                          Quick responses improve your candidate credibility.
                        </Text>
                      </Box>
                    </HStack>

                    <VStack align="stretch" spacing={3}>
                      {[
                        ["Review job details", "Step 1"],
                        ["Accept if interested", "Step 2"],
                        ["Start conversation", "Step 3"],
                      ].map(([text, step]) => (
                        <HStack key={step} justify="space-between">
                          <Text fontSize="sm" color="#4B5563">
                            {text}
                          </Text>
                          <Badge bg="rgba(51, 67, 113, 0.10)" color="#334371" borderRadius="full">
                            {step}
                          </Badge>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Box>

                <Box
                  borderRadius="24px"
                  bg="white"
                  border="1px solid"
                  borderColor="rgba(51, 67, 113, 0.12)"
                  boxShadow="0 14px 34px rgba(51, 67, 113, 0.06)"
                  p={5}
                >
                  <VStack align="stretch" spacing={4}>
                    <HStack spacing={3}>
                      <Flex
                        w="38px"
                        h="38px"
                        minW="38px"
                        borderRadius="14px"
                        bg="rgba(51, 67, 113, 0.10)"
                        color="#334371"
                        align="center"
                        justify="center"
                      >
                        <Icon as={FiCheck} boxSize={5} />
                      </Flex>

                      <Box>
                        <Text fontWeight="800" color="#1F2937">
                          Before accepting
                        </Text>
                        <Text fontSize="sm" color="#6B7280">
                          Make sure the opportunity matches your goal.
                        </Text>
                      </Box>
                    </HStack>

                    <VStack align="stretch" spacing={2}>
                      {[
                        "Position matches your career direction",
                        "Location and job type are suitable",
                        "Salary range is acceptable",
                        "You are ready to discuss next steps",
                      ].map((text) => (
                        <HStack key={text} align="start" spacing={2}>
                          <Icon as={FiCheck} boxSize={4} color="#334371" mt="2px" />
                          <Text fontSize="sm" color="#4B5563">
                            {text}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Box>
              </VStack>
            </Box>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
