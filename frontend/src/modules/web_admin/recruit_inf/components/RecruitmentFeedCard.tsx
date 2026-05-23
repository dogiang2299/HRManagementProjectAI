import {
  Button,
  Box,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import type { IRecruitmentInfor } from "../types";
import {
  FiChevronDown,
  FiClock,
  FiCopy,
  FiDollarSign,
  FiEdit2,
  FiExternalLink,
  FiMoreVertical,
  FiShare2,
  FiTrash2,
} from "react-icons/fi";
import Metric from "./Metric";
import { ActivityDot } from "./ActivityDot";
import {
  buildRecruitmentActivities,
  RECRUITMENT_ACTIVITY_DISPLAY,
} from "../utils";
import { useNavigate } from "react-router-dom";
import { useDeleteRecInform } from "../api/delete";
import { useUpdateRecInform } from "../api/update";
import {
  daysLeft,
  formatCompactMoney,
  formatDateShort,
  formatDeadlineBadge,
} from "../../../../types";
import { ModalConfirm } from "../../../../components/common/ModalConfirm";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import {
  type RecruitmentStatusType,
  RecruitmentStatus,
} from "../../../../constant";
import {
  recruitmentInforAddUrl,
  recruitmentInforDetailUrl,
  recruitmentInforUrl,
} from "../../../../routes/urls";
import ShareLinkModal from "./ShareLinkModal";
import { formatWorkTypeLabel } from "../../../../utils/formatText";

type StatusOption = {
  value: RecruitmentStatusType;
  label: string;
  description: string;
  dotColor: string;
  borderColor: string;
  textColor: string;
  confirmTitle?: string;
  confirmDescription?: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: RecruitmentStatus.Draft,
    label: "Draft",
    description: "Draft posting. Visible internally and not yet published.",
    dotColor: "gray.500",
    borderColor: "gray.300",
    textColor: "gray.600",
  },
  {
    value: RecruitmentStatus.Public,
    label: "Public",
    description: "Visible publicly on configured recruitment channels.",
    dotColor: "green.400",
    borderColor: "green.400",
    textColor: "green.500",
  },
  {
    value: RecruitmentStatus.Internal,
    label: "Internal",
    description:
      "Accessible via direct link but hidden from recruitment channels.",
    dotColor: "blue.400",
    borderColor: "blue.400",
    textColor: "blue.500",
    confirmTitle: "Change recruitment status",
    confirmDescription:
      "This posting will be hidden from the website and configured recruitment channels. Only internal members can view it via direct link. Do you want to continue?",
  },
  {
    value: RecruitmentStatus.StopReceiving,
    label: "Stop Receiving",
    description:
      "This posting will be removed from recruitment channels. Applications will be disabled.",
    dotColor: "red.400",
    borderColor: "red.300",
    textColor: "red.500",
    confirmTitle: "Change recruitment status",
    confirmDescription:
      "This posting will be removed from configured recruitment channels. Candidates can no longer apply. Do you want to continue?",
  },
  {
    value: RecruitmentStatus.Closed,
    label: "Closed",
    description: "This recruitment posting has been completed.",
    dotColor: "gray.500",
    borderColor: "gray.300",
    textColor: "gray.700",
    confirmTitle: "Change recruitment status",
    confirmDescription:
      "This posting will be closed and will no longer accept new applications. Do you want to continue?",
  },
];

export default function RecruitmentFeedCard({
  item,
}: {
  item: IRecruitmentInfor;
}) {
  const navigate = useNavigate();
  const notify = useNotify();
  const { mutateAsync: deleteRecInform, isPending: isDeleting } =
    useDeleteRecInform();
  const { mutateAsync: updateRecInform, isPending: isUpdatingStatus } =
    useUpdateRecInform();
  const [pendingStatus, setPendingStatus] =
    useState<RecruitmentStatusType | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.600", "gray.300");
  const title = useColorModeValue("gray.900", "white");
  const hoverBg = useColorModeValue("gray.50", "gray.750");

  const left = daysLeft(item.application_deadline);
  const deadLineValue = formatDeadlineBadge(item.application_deadline);
  const deadlineTone = left != null && left < 0 ? "red.500" : undefined;
  const detailPath = recruitmentInforDetailUrl.replace(":id", item.id);
  const editPath = `${recruitmentInforAddUrl}?mode=edit&id=${item.id}`;
  const meta = [
    item.department_name ?? item.department?.full_name ?? "No department",
    item.work_location_name ?? item.workLocation?.full_name ?? "No location",
    formatWorkTypeLabel(item.type_of_job) || "-",
  ].join(" • ");

  const latestActivities = (
    item.activities?.length ? item.activities : buildRecruitmentActivities(item)
  ).slice(0, 2);

  const currentStatusOption = useMemo(
    () =>
      STATUS_OPTIONS.find((option) => option.value === item.status) ??
      STATUS_OPTIONS[0],
    [item.status],
  );

  const canShareAndViewPosting =
    item.status === RecruitmentStatus.Public ||
    item.status === RecruitmentStatus.Internal;

  const availableStatusOptions = useMemo(
    () =>
      STATUS_OPTIONS.filter((option) => {
        if (option.value === item.status) return false;

        // Only allow DRAFT status transitions when the posting is already Draft.
        if (
          option.value === RecruitmentStatus.Draft &&
          item.status !== RecruitmentStatus.Draft
        ) {
          return false;
        }

        return true;
      }),
    [item.status],
  );

  const [isShareOpen, setIsShareOpen] = useState(false);
const [shareLink, setShareLink] = useState("");

const handleOpenShareModal = () => {
  const link = `${window.location.origin}${detailPath}`;
  setShareLink(link);
  setIsShareOpen(true);
};

  const handleDelete = async () => {
    try {
      await deleteRecInform(item.id);
      notify({ message: "Recruitment posting deleted", type: "success" });
      setIsDeleteConfirmOpen(false);
      navigate(recruitmentInforUrl);
    } catch (err: any) {
      const msg = Array.isArray(err?.response?.data?.message)
        ? err.response.data.message.join(", ")
        : err?.response?.data?.message ||
          "Failed to delete recruitment posting";
      notify({ message: msg, type: "error" });
    }
  };

  const applyStatusChange = async (nextStatus: RecruitmentStatusType) => {
    try {
      await updateRecInform({
        id: item.id,
        data: { status: nextStatus },
      });
      notify({ message: "Status updated successfully", type: "success" });
      setPendingStatus(null);
    } catch (err: any) {
      const msg = Array.isArray(err?.response?.data?.message)
        ? err.response.data.message.join(", ")
        : err?.response?.data?.message || "Failed to update status";
      notify({ message: msg, type: "error" });
    }
  };

  const handleStatusSelect = async (nextStatus: RecruitmentStatusType) => {
    const option = STATUS_OPTIONS.find((status) => status.value === nextStatus);
    if (!option) return;

    if (option.confirmDescription) {
      setPendingStatus(nextStatus);
      return;
    }

    await applyStatusChange(nextStatus);
  };

  const pendingStatusOption = pendingStatus
    ? (STATUS_OPTIONS.find((option) => option.value === pendingStatus) ?? null)
    : null;

  const handleDuplicatePosting = async (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      `${recruitmentInforAddUrl}?mode=duplicate&id=${encodeURIComponent(item.id)}`,
    );
  };

  return (
    <Box
      bg={bg}
      border={"1px solid"}
      borderColor={border}
      borderRadius={"7px"}
      px={4}
      py={3}
      _hover={{ bg: hoverBg }}
      transition="background 0.12s ease"
      cursor="pointer"
      role="link"
      tabIndex={0}
      onClick={() => navigate(detailPath)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(detailPath);
        }
      }}
    >
      <Flex align={"start"} gap={3}>
        <Box minW={0} flex={1}>
          <HStack spacing={2} minW={0}>
            <Text fontSize="md" fontWeight="800" color={title} noOfLines={1}>
              {item.internal_title || "Untitled recruitment"}
            </Text>
            {item.recruitment_code && (
              <Text fontSize="sm" color={subtle} whiteSpace="nowrap">
                • {item.recruitment_code}
              </Text>
            )}
          </HStack>
          <Text fontSize="sm" color={subtle} noOfLines={1} mt={0.5}>
            {meta}
          </Text>
        </Box>
        <HStack spacing={2}>
          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              onClick={(e) => e.stopPropagation()}
              size="sm"
              variant="outline"
              rightIcon={<FiChevronDown />}
              borderColor={currentStatusOption.borderColor}
              color={currentStatusOption.textColor}
              fontWeight="600"
              isLoading={isUpdatingStatus}
              loadingText={currentStatusOption.label}
              h="36px"
              px={3}
              borderRadius="7px"
              _hover={{ bg: "transparent" }}
              _active={{ bg: "transparent" }}
            >
              <HStack spacing={2}>
                <Box
                  boxSize="10px"
                  borderRadius="full"
                  bg={currentStatusOption.dotColor}
                />
                <Text fontSize="sm">{currentStatusOption.label}</Text>
              </HStack>
            </MenuButton>
            <MenuList w="320px" maxW="320px" py={1.5}>
              {availableStatusOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  borderRadius="7px"
                  py={2.5}
                  alignItems="flex-start"
                  whiteSpace="normal"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleStatusSelect(option.value);
                  }}
                >
                  <HStack align="start" spacing={3}>
                    <Box
                      mt="7px"
                      boxSize="10px"
                      borderRadius="7px"
                      bg={option.dotColor}
                      flexShrink={0}
                    />
                    <Box maxW="250px">
                      <Text fontSize="sm" fontWeight="700" lineHeight="1.2">
                        {option.label}
                      </Text>
                      <Text
                        mt={1}
                        fontSize="sm"
                        color="gray.500"
                        whiteSpace="normal"
                      >
                        {option.description}
                      </Text>
                    </Box>
                  </HStack>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu placement="bottom-end" autoSelect={false}>
            <MenuButton
              as={IconButton}
              aria-label="More actions"
              icon={<FiMoreVertical />}
              onClick={(e) => e.stopPropagation()}
              variant="ghost"
              size="sm"
              borderRadius="7px"
              color="gray.600"
              bg="white"
              h={"34px"}
              border="1px solid"
              borderColor="gray.200"
              _hover={{
                bg: "gray.50",
                borderColor: "gray.300",
                color: "gray.800",
              }}
              _active={{ bg: "gray.100" }}
              _expanded={{ bg: "gray.100", borderColor: "gray.300" }}
            />

            <MenuList
              p={2}
              minW="180px"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.200"
              boxShadow="0 10px 30px rgba(15, 23, 42, 0.10)"
              bg="white"
            >
              <MenuItem
                icon={<Icon as={FiEdit2} boxSize={4} color="gray.500" />}
                borderRadius="lg"
                fontSize="sm"
                fontWeight="500"
                color="gray.700"
                px={3}
                py={2.5}
                _hover={{ bg: "gray.50", color: "gray.900" }}
                _focus={{ bg: "gray.50" }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(editPath);
                }}
              >
                Edit posting
              </MenuItem>

              <MenuItem
                icon={<Icon as={FiCopy} boxSize={4} color="gray.500" />}
                borderRadius="lg"
                fontSize="sm"
                fontWeight="500"
                color="gray.700"
                px={3}
                py={2.5}
                _hover={{ bg: "gray.50", color: "gray.900" }}
                _focus={{ bg: "gray.50" }}
                onClick={handleDuplicatePosting}
              >
                Duplicate posting
              </MenuItem>

              {canShareAndViewPosting && (
                <>
                  <MenuItem
                icon={<Icon as={FiShare2} boxSize={4} color="gray.500" />}
                borderRadius="lg"
                fontSize="sm"
                fontWeight="500"
                color="gray.700"
                px={3}
                py={2.5}
                _hover={{ bg: "gray.50", color: "gray.900" }}
                _focus={{ bg: "gray.50" }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleOpenShareModal();
                }}
                >
                Share link
                </MenuItem>

                

                  <Box my={2} borderTop="1px solid" borderColor="gray.100" />
                </>
              )}

              <MenuItem
                icon={<Icon as={FiTrash2} boxSize={4} color="red.500" />}
                borderRadius="lg"
                fontSize="sm"
                fontWeight="600"
                color="red.600"
                px={3}
                py={2.5}
                _hover={{ bg: "red.50", color: "red.700" }}
                _focus={{ bg: "red.50" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteConfirmOpen(true);
                }}
                isDisabled={isDeleting}
              >
                Delete posting
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      <HStack spacing={6} mt={3} flexWrap={"wrap"}>
        <Metric
          icon={<FiClock />}
          label="Deadline"
          value={deadLineValue}
          tone={deadlineTone}
        />
        <Metric
          icon={<FiDollarSign />}
          label="Cost"
          value={formatCompactMoney(item.total_cost, item.cost_currency)}
        />
        {item.updated_at && (
          <Text fontSize="sm" color={subtle}>
            Updated <b>{formatDateShort(item.updated_at)}</b>
          </Text>
        )}
      </HStack>
      <Divider mt={3} mb={3} opacity={0.5} />

      <VStack align={"stretch"} spacing={2}>
        {latestActivities.length > 0 ? (
          latestActivities.map((activity, idx) => (
            <Flex key={`${activity.type}-${activity.at ?? "-"}-${idx}`} gap={3}>
              <ActivityDot muted={idx > 0} />
              <Box minW={0} flex={1}>
                <Text fontSize="sm" noOfLines={1}>
                  {activity.text}
                </Text>
                <Text fontSize="xs" color={subtle} mt={0.5}>
                  {RECRUITMENT_ACTIVITY_DISPLAY[activity.type]}
                  {activity.at ? ` • ${formatDateShort(activity.at)}` : ""}
                </Text>
              </Box>
            </Flex>
          ))
        ) : (
          <Text fontSize="sm" color={subtle}>
            No recent activity yet.
          </Text>
        )}
      </VStack>

      <ModalConfirm
        open={Boolean(pendingStatusOption)}
        setOpen={(open) => {
          if (!open) setPendingStatus(null);
        }}
        title={pendingStatusOption?.confirmTitle}
        message={pendingStatusOption?.confirmDescription}
        titleButton="Yes"
        cancelButtonText="No"
        onClick={() => {
          if (!pendingStatus) return;
          void applyStatusChange(pendingStatus);
        }}
        confirmButtonProps={{
          isLoading: isUpdatingStatus,
          background: "#ef4444",
          _hover: { background: "#dc2626" },
        }}
        cancelButtonProps={{
          background: "transparent",
          _hover: { background: "gray.100" },
        }}
      />

      <ModalConfirm
        open={isDeleteConfirmOpen}
        setOpen={setIsDeleteConfirmOpen}
        title="Delete recruitment posting"
        message="This will remove the posting from the recruitment list. Do you want to continue?"
        titleButton="Delete"
        cancelButtonText="Cancel"
        onClick={() => {
          void handleDelete();
        }}
        confirmButtonProps={{
          isLoading: isDeleting,
          background: "#ef4444",
          _hover: { background: "#dc2626" },
        }}
        cancelButtonProps={{
          background: "transparent",
          _hover: { background: "gray.100" },
        }}
      />
      <ShareLinkModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            shareLink={shareLink}
            />
    </Box>
  );
}
