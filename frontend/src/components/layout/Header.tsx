import {
  Flex,
  Text,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Box,
  HStack,
  Avatar,
  IconButton,
  Tooltip,
  Center,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { useAuthStore } from "../../modules/auth/store/auth.store";
import { FiArrowLeft, FiBell, FiGrid, FiMessageCircle } from "react-icons/fi";
import type { MenuMode } from "../../types";
import { logo } from "../../assets/logo";
import { useNavigate } from "react-router-dom";
import { candidateAppliedJobsUrl, conversationsUrl, candidateEmployeeContactCandidate } from "../../routes/urls";
import { resolveCompanyLogoUrl } from "../../utils/companyLogo";
import { useMemo } from "react";
import { useEmployerConversations } from "../../modules/web_admin/conversation/api/conversation.hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../lib/api";

type HeaderProps = {
  menuMode: MenuMode,
  canUseAdminMenu: boolean;
  onToggleMenuMode: () => void;
}

type HeaderNotificationItem = {
  id: string;
  type?: string;
  title?: string;
  content?: string | null;
  is_read?: boolean;
  created_at?: string;
  related_type?: string | null;
  related_id?: string | null;
};

const getRoleValues = (user: unknown) => {
  const currentUser = user as any;
  const roleItems = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const rawRoles = [
    ...roleItems.flatMap((item: any) => [
      typeof item === "string" ? item : "",
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
    .filter((role) => typeof role === "string" && role.trim())
    .map((role) => role.trim().toLowerCase());
};

const resolveReminderTab = (item: HeaderNotificationItem) => {
  const text = `${item.title || ""} ${item.content || ""}`.toUpperCase();
  if (text.includes("WAITING_RESPONSE") || text.includes("CHỜ") || text.includes("PHẢN HỒI")) {
    return "WAITING_RESPONSE";
  }
  if (text.includes("INTERVIEWING") || text.includes("PHỎNG VẤN")) {
    return "INTERVIEWING";
  }
  if (text.includes("CONTACTED") || text.includes("LIÊN HỆ")) {
    return "CONTACTED";
  }
  if (text.includes("APPLIED") || text.includes("ỨNG TUYỂN")) {
    return "APPLIED";
  }
  return null;
};

const formatNotificationTime = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
};

export default function Header({menuMode, canUseAdminMenu,onToggleMenuMode}: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const normalizedRoles = useMemo(() => getRoleValues(user), [user]);
  const isAdmin = normalizedRoles.includes("admin");
  const isEmployee = normalizedRoles.includes("employee");
  const isEmployer = normalizedRoles.includes("employer");
  const canAccessEmployerConversation = isEmployer;
  const messageLabel = "Candidate inbox";

  const employerConversationsQuery = useEmployerConversations(
    Boolean(user?.id) && !isAdmin && !isEmployee && canAccessEmployerConversation,
  );
  const messageUnreadCount = useMemo(() => {
    const conversations = employerConversationsQuery.data || [];
    return conversations.reduce(
      (sum, item) => sum + Number(item?.employer_unread_count || 0),
      0,
    );
  }, [employerConversationsQuery.data]);
  const notificationUnreadQuery = useQuery({
    queryKey: ["notification-unread-count"],
    enabled: Boolean(user?.id),
    refetchInterval: 10000,
    staleTime: 5000,
    queryFn: async () => {
      const res = await apiClient.get("/notifications/me/unread-count");
      return Number(res.data?.data?.unreadCount ?? res.data?.unreadCount ?? 0);
    },
  });
  const notificationUnreadCount = notificationUnreadQuery.data || 0;
  const notificationsQuery = useQuery({
    queryKey: ["notification-list"],
    enabled: Boolean(user?.id),
    refetchInterval: 15000,
    staleTime: 5000,
    queryFn: async () => {
      const res = await apiClient.get("/notifications/me", {
        params: { page: 1, limit: 8 },
      });
      const payload = res.data?.data ?? res.data;
      return (payload?.items || []) as HeaderNotificationItem[];
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notification-list"] }),
        queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] }),
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
        queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] }),
      ]);
    },
  });

  const handleNotificationClick = (item: HeaderNotificationItem) => {
    if (!item) return;

    if (!item.is_read) {
      markNotificationReadMutation.mutate(item.id);
    }

    if (item.type === "NEW_APPLICATION") {
      if (item.related_type === "RECRUITMENT_INFOR" && item.related_id) {
        navigate(`/recinform/${item.related_id}?tab=APPLIED`);
      } else {
        navigate("/recinform");
      }
      return;
    }

    if (item.type === "APPLICATION_REMINDER") {
      if (item.related_type === "RECRUITMENT_INFOR" && item.related_id) {
        const tab = resolveReminderTab(item);
        navigate(tab ? `/recinform/${item.related_id}?tab=${tab}` : `/recinform/${item.related_id}`);
      } else {
        navigate("/recinform");
      }
      return;
    }

    if (item.type === "CHAT_MESSAGE") {
      if (canAccessEmployerConversation) {
        navigate(conversationsUrl);
      }
      return;
    }

    if (item.type === "APPLICATION_STATUS") {
      const tab = resolveReminderTab(item);
      if (tab === "CONTACTED") {
        navigate(candidateEmployeeContactCandidate);
      } else {
        navigate(candidateAppliedJobsUrl);
      }
    }
  };

  // const displayRoles = Array.isArray(user?.roles)
  //   ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.role)).join(', ')
  //   : '';

    const displayRoles = Array.isArray(user?.roles)
  ? user.roles
      .map((r: any) => {
        if (typeof r === "string") return r;

        // Common case: r.role is a role object
        if (typeof r?.role === "string") return r.role;
        return r?.role?.name_role || r?.name_role || r?.name || r?.role?.role_code || "";
      })
      .filter(Boolean)
      .join(", ")
  : "";

  const hasAdminOrEmployeeRole = isAdmin || isEmployee;
  const hasEmployerRole = isEmployer;

  const employerCompanyName =
    (user as any)?.inforCompany?.full_name ||
    (user as any)?.company?.full_name ||
    (user as any)?.department?.full_name ||
    (user as any)?.company_name ||
    user?.work_unit ||
    "Employer";

  const brandTitle = hasAdminOrEmployeeRole
    ? "Information Technology Tool"
    : hasEmployerRole
      ? employerCompanyName
      : "Information Technology Tool";

  const companyLogoSrc =
    resolveCompanyLogoUrl(
      (user as any)?.inforCompany?.image_logo ||
        (user as any)?.company?.image_logo ||
        (user as any)?.department?.image_logo ||
        undefined,
    ) || logo;

  return (
    <Flex
      align="center"
      justify="space-between"
      bg="white"
      py={4}
      pr={4}
      pl={canUseAdminMenu ? 2  : 0}
      boxShadow="sm"
      position="fixed"
      top={0}
      left={1.5}
      right={0}
      zIndex={120}
    >
      <Flex align="center" gap={3} minW={0}>
        {canUseAdminMenu ? (
          <IconButton
            aria-label="Toggle menu"
            icon={menuMode === "admin" ? <FiArrowLeft size={20} /> : <FiGrid size={20} />}
            variant="ghost"
            size="md"
            onClick={onToggleMenuMode}
          />
        ) : null}

        <Image
          src={companyLogoSrc}
          alt={brandTitle}
          boxSize="32px"
          objectFit="contain"
          flexShrink={0}
        />

        <Text fontSize="xl" fontWeight="600" lineHeight="1" noOfLines={1}>
          {brandTitle}
        </Text>
      </Flex>
      <Flex gap={4} align="center">
        {canAccessEmployerConversation ? (
          <Tooltip label={messageLabel} hasArrow>
            <Box position="relative">
              <IconButton
                aria-label={messageLabel}
                icon={<FiMessageCircle />}
                variant="ghost"
                colorScheme="gray"
                onClick={() => navigate(conversationsUrl)}
              />
              {messageUnreadCount > 0 ? (
                <Center
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  minW="18px"
                  h="18px"
                  px={1}
                  borderRadius="full"
                  bg="#E53935"
                  color="white"
                  fontSize="10px"
                  fontWeight="700"
                  border="2px solid white"
                >
                  {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
                </Center>
              ) : null}
            </Box>
          </Tooltip>
        ) : null}

        <Menu placement="bottom-end">
          <Tooltip label="Labels" hasArrow>
            <Box position="relative">
              <MenuButton
                as={IconButton}
                aria-label="Notifications"
                icon={<FiBell />}
                variant="ghost"
                colorScheme="gray"
              />
              {notificationUnreadCount > 0 ? (
                <Center
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  minW="18px"
                  h="18px"
                  px={1}
                  borderRadius="full"
                  bg="#E53935"
                  color="white"
                  fontSize="10px"
                  fontWeight="700"
                  border="2px solid white"
                >
                  {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
                </Center>
              ) : null}
            </Box>
          </Tooltip>
          <MenuList w="360px" p={0} maxH="460px" overflowY="auto">
            <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
              <HStack justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="700" color="gray.800">Notifications</Text>
                <Button
                  size="xs"
                  variant="ghost"
                  color="#334371"
                  fontWeight="600"
                  isDisabled={notificationUnreadCount === 0}
                  isLoading={markAllReadMutation.isPending}
                  onClick={() => markAllReadMutation.mutate()}
                >
                  Mark all as read
                </Button>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                {notificationUnreadCount > 0
                  ? `${notificationUnreadCount} unread notifications`
                  : "No unread notifications"}
              </Text>
            </Box>

            {notificationsQuery.isLoading ? (
              <Center py={8}><Spinner size="sm" color="#334371" /></Center>
            ) : (notificationsQuery.data || []).length > 0 ? (
              <VStack align="stretch" spacing={0}>
                {(notificationsQuery.data || []).map((item) => (
                  <MenuItem
                    key={item.id}
                    py={3}
                    px={4}
                    alignItems="flex-start"
                    bg={item.is_read ? "white" : "#F8FAFC"}
                    borderBottom="1px solid"
                    borderColor="gray.50"
                    onClick={() => handleNotificationClick(item)}
                  >
                    <Box minW={0} w="100%">
                      <HStack justify="space-between" align="start" spacing={2}>
                        <Text noOfLines={1} fontSize="sm" fontWeight={item.is_read ? "600" : "700"} color="gray.800">
                          {item.title || "New notification"}
                        </Text>
                        {!item.is_read ? (
                          <Box mt="6px" boxSize="8px" borderRadius="full" bg="#2563EB" flexShrink={0} />
                        ) : null}
                      </HStack>
                      <Text mt={1} noOfLines={2} fontSize="xs" color="gray.600">
                        {item.content || "You have a new notification."}
                      </Text>
                      <Text mt={1.5} fontSize="11px" color="gray.400">
                        {formatNotificationTime(item.created_at)}
                      </Text>
                    </Box>
                  </MenuItem>
                ))}
              </VStack>
            ) : (
              <Center py={8} px={4}>
                <Text fontSize="sm" color="gray.500">No notifications yet.</Text>
              </Center>
            )}
          </MenuList>
        </Menu>

        <Menu>
          <MenuButton>
            <HStack spacing={2}>
              <Avatar
                size="sm"
                name={user?.employee_name ?? undefined}
                bg="#E4E4E7"
                color="#070707"
              />
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                {user?.employee_name}
              </Text>
            </HStack>
          </MenuButton>
          <MenuList>
            <Box px={3} py={2}>
              <Text fontWeight="bold">{user?.employee_name}</Text>
              <Text fontSize="sm" color="gray.500">
                {user?.email}
              </Text>
              <Text fontSize="sm" color="gray.400">
                Roles: {displayRoles}
              </Text>
            </Box>
            <MenuItem onClick={logout} color="red.500">
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
}
