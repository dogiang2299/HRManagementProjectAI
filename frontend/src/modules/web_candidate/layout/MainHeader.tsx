import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Link as ChakraLink,
  Text,
  Icon,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiBookmark,
  FiCheckSquare,
  FiChevronRight,
  FiMessageCircle,
  FiSearch,
  FiThumbsUp,
} from "react-icons/fi";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NavItem } from "./MegaMenu";
import type { MainHeaderProps } from "./type";
import { useGetPositionGroups } from "./api/get";
import theme from "../../../theme";
import CandidateProfileMenu from "./components/CandidateProfile";
import {
  candidateAppliedJobsUrl,
  candidateCareerUrl,
  candidateConversationUrl,
  candidateHomeUrl,
  candidateCreateCvUrl,
  candidateCvListUrl,
  candidateEmployeeContactCandidate,
} from "../../../routes/urls";
import SimpleJobDropdown from "./components/SimpleJobDropdown.tsx";
import { useCandidateConversations } from "../conversation/api/conversation.hooks";
import apiClient from "../../../lib/api";

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

const buildApplicationNotificationUrl = (item: CandidateNotificationItem) => {
  const params = new URLSearchParams();

  if (item.related_id) {
    params.set("application_id", item.related_id);
  }

  if (item.id) {
    params.set("notification_id", item.id);
  }

  const query = params.toString();
  return query
    ? `${candidateEmployeeContactCandidate}?${query}`
    : candidateEmployeeContactCandidate;
};

export default function MainHeader({
  logoSrc,
  isLoggedIn = false,
  user = null,
  onLoginClick,
  onRegisterClick,
  onRecruiterClick,
  onLogout,
}: MainHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openJobMenu, setOpenJobMenu] = useState(false);

  const isJobsActive =
    location.pathname.startsWith("/it-job/jobs") ||
    location.pathname === "/" ||
    location.pathname === candidateHomeUrl;
  const isCVActive =
    location.pathname.startsWith("/it-job/create-cv") ||
    location.pathname.startsWith("/it-job/my-cv") ||
    location.pathname.startsWith(candidateCvListUrl);
  const isCareerActive = location.pathname.startsWith(candidateCareerUrl);
  const isBlogActive = location.pathname.startsWith("/it-job/blogs");
  const { data } = useGetPositionGroups();
  const groups = data?.data ?? [];
  const candidateConversationsQuery = useCandidateConversations(isLoggedIn);
  const queryClient = useQueryClient();
  const messageUnreadCount = useMemo(() => {
    const conversations = candidateConversationsQuery.data || [];
    return conversations.reduce(
      (sum, item) => sum + Number(item?.candidate_unread_count || 0),
      0,
    );
  }, [candidateConversationsQuery.data]);

  const notificationUnreadQuery = useQuery({
    queryKey: ["notification-unread-count"],
    enabled: isLoggedIn,
    refetchInterval: 10000,
    staleTime: 5000,
    queryFn: async () => {
      const response = await apiClient.get("/notifications/me/unread-count");
      return Number(
        response?.data?.data?.count ??
          response?.data?.count ??
          response?.data?.data?.unreadCount ??
          response?.data?.unreadCount ??
          0,
      );
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ["notification-list"],
    enabled: isLoggedIn,
    refetchInterval: 15000,
    staleTime: 5000,
    queryFn: async () => {
      const response = await apiClient.get("/notifications/me", {
        params: { page: 1, limit: 20 },
      });
      const payload = response?.data?.data ?? response?.data;
      if (Array.isArray(payload)) return payload as CandidateNotificationItem[];
      if (Array.isArray(payload?.items))
        return payload.items as CandidateNotificationItem[];
      return [] as CandidateNotificationItem[];
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notification-list"] }),
        queryClient.invalidateQueries({
          queryKey: ["notification-unread-count"],
        }),
      ]);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/notifications/me/read-all");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notification-list"] }),
        queryClient.invalidateQueries({
          queryKey: ["notification-unread-count"],
        }),
      ]);
    },
  });

  const notifications = notificationsQuery.data || [];
  const notificationCount = Math.max(
    notificationUnreadQuery.data || 0,
    notifications.filter((item) => !item.is_read).length,
  );

  const handleNotificationClick = (item: CandidateNotificationItem) => {
    if (!item) return;

    if (!item.is_read) {
      markNotificationReadMutation.mutate(item.id);
    }

    if (item.type === "CHAT_MESSAGE") {
      navigate(candidateConversationUrl);
      return;
    }

    if (item.type === "APPLICATION_STATUS") {
      navigate(buildApplicationNotificationUrl(item));
    }
  };

  return (
    <Box
      as="header"
      bg="white"
      position="sticky"
      top={0}
      zIndex={999}
      borderBottom="1px solid"
      borderColor="gray.200"
      boxShadow="0 2px 10px rgba(15, 23, 42, 0.04)"
    >
      <Flex h="72px" px={8} align="center" justify="space-between" w="100%">
        <HStack spacing={10} align="center" flex="1" minW={0}>
          <ChakraLink
            as={RouterLink}
            to={candidateHomeUrl}
            _hover={{ textDecoration: "none" }}
            flexShrink={0}
          >
            <Image
              src={logoSrc}
              alt="Logo"
              h={{ base: "42px", md: "48px" }}
              w="auto"
              maxW={{ base: "132px", md: "150px" }}
              objectFit="contain"
            />
          </ChakraLink>

          <HStack spacing={8} align="center" minW={0}>
            <Box
              position="relative"
              onMouseEnter={() => setOpenJobMenu(true)}
              onMouseLeave={() => setOpenJobMenu(false)}
            >
              <NavItem
                label="Jobs"
                to={candidateHomeUrl}
                active={isJobsActive}
                hasDropdown
              />

              <SimpleJobDropdown
                isOpen={openJobMenu}
                groups={groups}
                onClose={() => setOpenJobMenu(false)}
                quickLinks={[
                  {
                    label: "Find jobs",
                    to: "/it-job",
                    icon: FiSearch,
                  },
                  {
                    label: "Saved jobs",
                    to: "/it-job/saved-jobs",
                    icon: FiBookmark,
                  },
                  {
                    label: "Applied jobs",
                    to: "/it-job/applied-jobs",
                    icon: FiCheckSquare,
                  },
                  
                ]}
              />
            </Box>
            <NavItem
              label="Create CV"
              to={isLoggedIn ? candidateCvListUrl : candidateCreateCvUrl}
              active={isCVActive}
            />

            <NavItem
              label="Career Handbook"
              to="/it-job/blogs"
              active={isBlogActive}
            />
          </HStack>
        </HStack>
        {!isLoggedIn ? (
          <HStack spacing={3} flexShrink={0} flexWrap="wrap" justify="flex-end">
            <Button
              variant="outline"
              borderColor={theme.colors.candidate.primary}
              color={theme.colors.candidate.primary}
              bg="white"
              fontSize="15px"
              fontWeight="700"
              borderRadius="999px"
              px={6}
              h="44px"
              _hover={{ bg: "#F5F7FB" }}
              onClick={onRegisterClick}
            >
              Register
            </Button>

            <Button
              bg={theme.colors.candidate.primary}
              color="white"
              fontWeight="700"
              fontSize="15px"
              borderRadius="999px"
              px={6}
              h="44px"
              _hover={{ bg: "#2A365D" }}
              onClick={onLoginClick}
            >
              Log in
            </Button>

            <Button
              bg="#F3F4F6"
              color="#1F2937"
              fontWeight="700"
              borderRadius="999px"
              px={6}
              h="44px"
              fontSize="15px"
              whiteSpace="normal"
              _hover={{ bg: "#E5E7EB" }}
              onClick={onRecruiterClick}
            >
              Post jobs & find resumes
            </Button>
          </HStack>
        ) : (
          <HStack spacing={2.5} flexShrink={0}>
            <Box position="relative">
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  aria-label="Notification"
                  icon={<FiBell />}
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg="#F5F5F5"
                  color="#2F4358"
                  fontSize="18px"
                  _hover={{ bg: "#ECEFF3" }}
                  _active={{ bg: "#ECEFF3" }}
                />
                <MenuList w="360px" p={0} maxH="460px" overflowY="auto">
                  <Box
                    px={4}
                    py={3}
                    borderBottom="1px solid"
                    borderColor="gray.100"
                  >
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="700" color="gray.800">
                        Notifications
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="#2F4358"
                        fontWeight="600"
                        isDisabled={notificationCount === 0}
                        isLoading={markAllReadMutation.isPending}
                        onClick={() => markAllReadMutation.mutate()}
                      >
                        Mark all as read
                      </Button>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {notificationCount > 0
                        ? `${notificationCount} unread notifications`
                        : "No unread notifications"}
                    </Text>
                  </Box>

                  {notificationsQuery.isLoading && (
                    <HStack
                      py={6}
                      justify="center"
                      color="gray.500"
                      spacing={2}
                    >
                      <Spinner size="sm" />
                    </HStack>
                  )}

                  {!notificationsQuery.isLoading &&
                    notifications.length === 0 && (
                      <Box py={8} textAlign="center">
                        <Text fontSize="sm" color="gray.500">
                          You do not have any notifications yet
                        </Text>
                      </Box>
                    )}

                  {notifications.map((item) => (
                    <MenuItem
                      key={item.id}
                      py={3}
                      px={4}
                      alignItems="flex-start"
                      whiteSpace="normal"
                      bg={item.is_read ? "white" : "#F5F8FF"}
                      _hover={{ bg: "#EDF2F7" }}
                      borderBottom="1px solid"
                      borderColor="gray.50"
                      onClick={() => handleNotificationClick(item)}
                    >
                      <Box w="full">
                        <HStack
                          justify="space-between"
                          align="start"
                          spacing={3}
                        >
                          <Text
                            fontSize="sm"
                            fontWeight="700"
                            color="gray.800"
                            noOfLines={1}
                          >
                            {item.title || "Notification"}
                          </Text>
                          {!item.is_read && (
                            <Box
                              mt={1}
                              boxSize="8px"
                              borderRadius="full"
                              bg="#ED1B2F"
                              flexShrink={0}
                            />
                          )}
                        </HStack>
                        {item.content && (
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            mt={1}
                            noOfLines={2}
                          >
                            {item.content}
                          </Text>
                        )}
                        <Text fontSize="xs" color="gray.400" mt={2}>
                          {formatNotificationTime(item.created_at)}
                        </Text>
                      </Box>
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
              {notificationCount > 0 && (
                <Flex
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  minW="18px"
                  h="18px"
                  px={1}
                  borderRadius="full"
                  bg="#EB5A57"
                  color="white"
                  align="center"
                  justify="center"
                  fontSize="10px"
                  fontWeight="700"
                  border="2px solid white"
                  lineHeight="1"
                >
                  {notificationCount}
                </Flex>
              )}
            </Box>

            <Box position="relative">
              <IconButton
                aria-label="Messages"
                icon={<FiMessageCircle />}
                w="40px"
                h="40px"
                borderRadius="full"
                bg="#F5F5F5"
                color="#2F4358"
                fontSize="18px"
                _hover={{ bg: "#ECEFF3" }}
                _active={{ bg: "#ECEFF3" }}
                onClick={() => navigate(candidateConversationUrl)}
              />
              {messageUnreadCount > 0 && (
                <Flex
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  minW="18px"
                  h="18px"
                  px={1}
                  borderRadius="full"
                  bg="#EB5A57"
                  color="white"
                  align="center"
                  justify="center"
                  fontSize="10px"
                  fontWeight="700"
                  border="2px solid white"
                  lineHeight="1"
                >
                  {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
                </Flex>
              )}
            </Box>

            <Box w="1px" h="26px" bg="#E4E7EC" mx={1} />

            <Button
              variant="ghost"
              h="40px"
              px={2}
              borderRadius="12px"
              _hover={{ bg: "#F8FAFC" }}
              onClick={onRecruiterClick}
            >
              <VStack spacing={1.5} align="start">
                <Text
                  fontSize="12px"
                  color="#7B8794"
                  fontWeight="500"
                  lineHeight="1.1"
                >
                  Are you a recruiter?
                </Text>
                <HStack spacing={1}>
                  <Text
                    fontSize="sm"
                    color="#2F4358"
                    fontWeight="700"
                    lineHeight="1.1"
                  >
                    Apply now
                  </Text>
                  <Icon as={FiChevronRight} color="#2F4358" boxSize={3.5} />
                </HStack>
              </VStack>
            </Button>

            <CandidateProfileMenu
              user={{
                id: user?.id,
                fullName: user?.employee_name,
                email: user?.email,
                avatar: user?.avatar,
              }}
              onLogout={onLogout ?? (() => {})}
            />
          </HStack>
        )}{" "}
      </Flex>
    </Box>
  );
}
