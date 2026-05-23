import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Spacer,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import {
  FaEdit,
  FaEye,
  FaRegStar,
  FaStar,
  FaStarHalfAlt,
  FaTrash,
} from "react-icons/fa";

import { useGetCandidate } from "../api/get";
import { useDeleteCandidate } from "../api/delete";
import { useCreateCandidate } from "../api/create";
import { useupdateCandidate } from "../api/update";
import { useUploadCandidateCv } from "../api/upload_cv";
import { useUploadCandidateAvatar } from "../api/upload_avatar";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import type { CandidateCreatePayload, ICandidate } from "../types";
import {
  getApplicationStatusBadgeStyle,
  getApplicationStatusLabel,
  getCandidateApplicationSummary,
  getCandidateAppliedDate,
  getCandidateAverageRating,
  getCandidateRecruitmentPosition,
  getCandidateRecruitmentPost,
  getLatestCandidateApplication,
} from "../utils";
import CandidateCreateModal from "../components/CandidateModal";
import BaseTable, {
  type BaseTableState,
  DefaultTableState,
  type HeaderTable,
} from "../../../../components/common/BaseTable";
import { ButtonConfig } from "../../../../components/common/Button";
import { ModalConfirm } from "../../../../components/common/ModalConfirm";
import { PaginationBar } from "../../../../components/common/PaginationBar";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { formatDateShort } from "../../../../types";
import { APPLICATION_STATUS_VALUES } from "../../../../constant";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import { useAuthStore } from "../../../auth/store/auth.store";

const APPLICATION_STATUS_FILTER_ALL = "__all__";

const RatingStars = ({ value }: { value: number }) => {
  const normalized = Math.max(0, Math.min(5, Math.round(value * 2) / 2));

  return (
    <HStack spacing={0.5}>
      {Array.from({ length: 5 }, (_, idx) => {
        const starIndex = idx + 1;
        const full = normalized >= starIndex;
        const half = normalized >= starIndex - 0.5 && normalized < starIndex;
        const icon = full ? FaStar : half ? FaStarHalfAlt : FaRegStar;

        return (
          <Icon key={starIndex} as={icon} boxSize="12px" color="yellow.400" />
        );
      })}
    </HStack>
  );
};

export function Candidates() {
  const notify = useNotify();
  const navigate = useNavigate();
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);
  const canManageCandidate = hasAnyRole([
    RECRUIT_BASE_ROLE.Admin,
    RECRUIT_BASE_ROLE.Employee,
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 1000);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const [applicationStatusFilter, setApplicationStatusFilter] = useState(
    APPLICATION_STATUS_FILTER_ALL,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCandidate, setSelectedCandidate] = useState<
    ICandidate | undefined
  >(undefined);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ICandidate | null>(null);

  const [tableState, setTableState] = useState<Partial<BaseTableState>>({
    ...DefaultTableState,
    page_size: 5,
    sort_order: "desc",
    sort_by: "created_at",
  });

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"activate" | "inactive" | null>(
    null,
  );

  const sortBy = tableState.sort_by;
  const sortOrder = tableState.sort_order;

  const statusOptions = useMemo(
    () => [
      { id: APPLICATION_STATUS_FILTER_ALL, name: "All statuses" },
      ...APPLICATION_STATUS_VALUES.map((status) => ({
        id: status,
        name: status,
      })),
    ],
    [],
  );

  const apiApplicationStatus =
    applicationStatusFilter === APPLICATION_STATUS_FILTER_ALL
      ? undefined
      : applicationStatusFilter;

  const { data: candidateRes, refetch } = useGetCandidate({
    pages: page,
    limit,
    search: debouncedSearch ?? "",
    status: apiApplicationStatus,
    sortBy,
    sortOrder,
  });
  const createCandidateMutation = useCreateCandidate();
  const updateCandidateMutation = useupdateCandidate();
  const uploadCvMutation = useUploadCandidateCv();
  const uploadAvatarMutation = useUploadCandidateAvatar();
  const deleteCandidateMutation = useDeleteCandidate();

  const items = Array.isArray(candidateRes?.data) ? candidateRes.data : [];
  const pagination = candidateRes?.pagination ?? {
    totalItems: 0,
    currentPage: 1,
    limit: 5,
    totalPages: 1,
  };

  useEffect(() => {
    setPage(1);
  }, [applicationStatusFilter, debouncedSearch]);

  const columns: HeaderTable[] = [
    { name: "Candidate", key: "candidate_name" },
    { name: "Contact", key: "contact", disableSort: true },
    {
      name: "Recruitment Position",
      key: "recruitment_position",
      disableSort: true,
    },
    { name: "Job Post", key: "recruitment_post", disableSort: true },
    { name: "Rating", key: "rating", disableSort: true },
    { name: "Status", key: "status", disableSort: true },
  ];

  const mappedItems = useMemo(() => {
    return items?.map((i) => ({ ...i })) ?? [];
  }, [items]);

  const selectedItems = (tableState.selected_items ?? []) as ICandidate[];
  const selectedIds = selectedItems.map((c) => c.id).filter(Boolean);
  const hasSelectedItems = selectedIds.length > 0;

  const customRows = {
    candidate_name: (_: any, row: ICandidate) => {
      return (
        <Box>
          <Text fontWeight="600">{row.candidate_name || "N/A"}</Text>
          <Text fontSize="sm" color="gray.500">
            {row.candidate_code || ""}
          </Text>
        </Box>
      );
    },

    contact: (_: any, row: ICandidate) => {
      return (
        <Box>
          <Text fontSize="sm">{row.phone_number || ""}</Text>
          <Text fontSize="sm" color="gray.500">
            {row.email || ""}
          </Text>
        </Box>
      );
    },
    recruitment_position: (_: any, row: ICandidate) => {
      const summary = getCandidateApplicationSummary(row);
      const morePositions = Math.max(0, summary.distinctPositions - 1);

      return (
        <VStack spacing={1} align="center">
          <Text fontSize="sm" textAlign="center">
            {getCandidateRecruitmentPosition(row)}
          </Text>

          {morePositions > 0 && (
            <Badge
              borderRadius="full"
              px={2}
              py={0.5}
              bg="#EEF2FF"
              color="#334371"
              fontSize="10px"
              fontWeight="700"
              textTransform="none"
            >
              +{morePositions} more
            </Badge>
          )}
        </VStack>
      );
    },
    recruitment_post: (_: any, row: ICandidate) => {
      const summary = getCandidateApplicationSummary(row);
      const morePosts = Math.max(0, summary.distinctJobPosts - 1);

      return (
        <VStack spacing={1} align="center">
          <Text fontSize="sm" textAlign="center" noOfLines={2}>
            {getCandidateRecruitmentPost(row)}
          </Text>

          {morePosts > 0 && (
            <Badge
              borderRadius="full"
              px={2}
              py={0.5}
              bg="#F8FAFC"
              color="#475569"
              fontSize="10px"
              fontWeight="700"
              textTransform="none"
            >
              +{morePosts} more posts
            </Badge>
          )}
        </VStack>
      );
    },
    date_applied: (_: any, row: ICandidate) => (
      <Text fontSize="sm">{formatDateShort(getCandidateAppliedDate(row))}</Text>
    ),
    rating: (_: any, row: ICandidate) => {
      const { average, count } = getCandidateAverageRating(row);
      if (!count)
        return (
          <Text fontSize="sm" color="gray.500">
            -
          </Text>
        );

      return (
        <Box>
          <HStack justify="center" spacing={1}>
            <RatingStars value={average} />
          </HStack>
        </Box>
      );
    },
    status: (_: any, row: ICandidate & { id: string }) => {
      const latestApplication = getLatestCandidateApplication(row);
      const summary = getCandidateApplicationSummary(row);
      const totalApplications = Number(summary.totalApplications ?? 0);

      const status = latestApplication?.status;
      const statusLabel = getApplicationStatusLabel(status);
      const badgeStyle = getApplicationStatusBadgeStyle(status);

      return (
        <VStack spacing={1} align="center">
          <Badge
            borderRadius="full"
            px={3}
            py={1}
            borderWidth="1px"
            borderStyle="solid"
            bg={badgeStyle.bg}
            color={badgeStyle.color}
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.4px"
            textTransform="uppercase"
          >
            {statusLabel === "-" ? "-" : statusLabel.toUpperCase()}
          </Badge>

          {totalApplications > 1 && (
            <Badge
              borderRadius="full"
              px={2}
              py={0.5}
              bg="#F1F5F9"
              color="#64748B"
              fontSize="10px"
              fontWeight="700"
              textTransform="none"
            >
              {totalApplications} applications
            </Badge>
          )}
        </VStack>
      );
    },
  };

  const getErrorMessage = (error: unknown) => {
    const e = error as {
      response?: { data?: { message?: unknown } };
      message?: string;
    };
    const msg = e?.response?.data?.message ?? e?.message;

    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string" && msg.trim()) return msg;
    return "An unexpected error occurred.";
  };

  const openBulkConfirm = (action: "activate" | "inactive") => {
    if (!hasSelectedItems) {
      notify({
        type: "warning",
        message: "No candidate selected",
        description: "Please select at least one candidate.",
      });
      return;
    }
    setBulkAction(action);
    setBulkConfirmOpen(true);
  };

  const runBulkAction = async () => {
    if (!bulkAction || !selectedIds.length) return;
    try {
      if (bulkAction === "activate") {
        await Promise.all(
          selectedIds.map((id) =>
            updateCandidateMutation.mutateAsync({
              id,
              data: { is_active: true },
            }),
          ),
        );
      } else if (bulkAction === "inactive") {
        await Promise.all(
          selectedIds.map((id) =>
            updateCandidateMutation.mutateAsync({
              id,
              data: { is_active: false },
            }),
          ),
        );
      }

      notify({
        type: "success",
        message: "Bulk action completed",
        description: `${selectedIds.length} candidate(s) updated.`,
      });
      setBulkConfirmOpen(false);
      setBulkAction(null);
      setTableState((prev) => ({ ...prev, selected_items: [] }));
      await refetch?.();
    } catch (err) {
      notify({
        type: "error",
        message: "Bulk action failed",
        description: getErrorMessage(err),
      });
    }
  };

  const handleSubmitCandidate = async (payload: CandidateCreatePayload) => {
    const { cv_file, avatar_file, ...candidateData } = payload;

    try {
      if (modalMode === "edit" && selectedCandidate?.id) {
        const updated = await updateCandidateMutation.mutateAsync({
          id: selectedCandidate.id,
          data: candidateData,
        });

        if (cv_file) {
          await uploadCvMutation.mutateAsync({
            candidateId: updated.id,
            file: cv_file,
            currentCvFile: selectedCandidate.cv_file ?? null,
          });
        }

        if (avatar_file) {
          await uploadAvatarMutation.mutateAsync({
            candidateId: updated.id,
            file: avatar_file,
            currentAvatarFile: selectedCandidate.avatar_file ?? null,
          });
        }

        notify({
          type: "success",
          message: "Updated",
          description: "Candidate has been updated successfully.",
        });
      } else {
        const created =
          await createCandidateMutation.mutateAsync(candidateData);

        if (cv_file) {
          await uploadCvMutation.mutateAsync({
            candidateId: created.id,
            file: cv_file,
            currentCvFile: created.cv_file ?? null,
          });
        }

        if (avatar_file) {
          await uploadAvatarMutation.mutateAsync({
            candidateId: created.id,
            file: avatar_file,
            currentAvatarFile: created.avatar_file ?? null,
          });
        }

        notify({
          type: "success",
          message: "Created",
          description: "Candidate has been created successfully.",
        });
      }

      setModalOpen(false);
      setSelectedCandidate(undefined);
      await refetch?.();
    } catch (error) {
      notify({
        type: "error",
        message: modalMode === "edit" ? "Update failed" : "Create failed",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <>
      <VStack align={"stretch"} spacing={4}>
        <Flex align={"center"} gap={4}>
          {canManageCandidate && (
            <ButtonConfig
              onClick={() => {
                setModalMode("add");
                setSelectedCandidate(undefined);
                setModalOpen(true);
              }}
            >
              ADD
            </ButtonConfig>
          )}

          {hasSelectedItems ? (
            <>
              <ButtonConfig onClick={() => openBulkConfirm("activate")}>
                BULK ACTIVE
              </ButtonConfig>
              <ButtonConfig
                onClick={() => openBulkConfirm("inactive")}
                styles={{ backgroundColor: "#718096" }}
              >
                BULK INACTIVE
              </ButtonConfig>
              <Text fontSize="sm" color="gray.600">
                Selected: {selectedIds.length}
              </Text>
            </>
          ) : null}

          <Spacer />

          <InputGroup w={{ base: "100%", md: "400px" }}>
            <InputLeftElement pointerEvents={"none"}>
              <SearchIcon />
            </InputLeftElement>
            <Input
              placeholder="Search by candidate name, code, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Box w={{ base: "100%", md: "200px" }}>
            <SearchCombobox
              value={applicationStatusFilter}
              onChange={setApplicationStatusFilter}
              options={statusOptions}
              placeholder="Filter by application status"
              isClearable
              size="md"
            />
          </Box>
        </Flex>

        <Box
          overflowY={"auto"}
          border={'1px solid #E2E8F0"'}
          sx={{
            table: { borderCollapse: "separate", borderSpacing: 0 },
            "& thead": {
              position: "sticky",
              top: 0,
              zIndex: 11,
              bg: "#334371",
              color: "white",
              backgroundClip: "padding-box",
              borderRight: "1px solid white",
            },
            "& thead th:last-child": { borderRight: "none" },
          }}
        >
          <BaseTable
            columns={columns}
            data={mappedItems}
            tableState={tableState}
            customRows={customRows}
            renderRowActions={(row: ICandidate & { id: string }) => {
              return (
                <HStack spacing={2} justify="center">
                  <Tooltip label="View" hasArrow>
                    <IconButton
                      aria-label="View candidate"
                      icon={<FaEye />}
                      size="sm"
                      variant="ghost"
                      color="gray.600"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/candidate/${row.id}`, {
                          state: { title: row.candidate_name ?? "Detail" },
                        });
                      }}
                    />
                  </Tooltip>

                  {canManageCandidate && (
                    <Tooltip label="Edit" hasArrow>
                      <IconButton
                        aria-label="Edit candidate"
                        icon={<FaEdit />}
                        size="sm"
                        variant="ghost"
                        color="blue.600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidate(row);
                          setModalMode("edit");
                          setModalOpen(true);
                        }}
                      />
                    </Tooltip>
                  )}

                  {canManageCandidate && (
                    <Tooltip label="Delete" hasArrow>
                      <IconButton
                        aria-label="Delete candidate"
                        icon={<FaTrash />}
                        size="sm"
                        variant="ghost"
                        color="red.600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(row);
                          setDeleteOpen(true);
                        }}
                      />
                    </Tooltip>
                  )}
                </HStack>
              );
            }}
          />
        </Box>

        <PaginationBar
          total={pagination.totalItems}
          page={page}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          onPerPageChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />

        {canManageCandidate && (
          <ModalConfirm
            open={deleteOpen}
            setOpen={setDeleteOpen}
            title="Delete Candidate"
            message={`Are you sure you want to delete "${deleteTarget?.candidate_name ?? ""}"? This action cannot be undone.`}
            titleButton="DELETE"
            cancelButtonText="CANCEL"
            confirmButtonProps={{ background: "#8B0000" }}
            onClick={async () => {
              if (!deleteTarget?.id) return;
              try {
                await deleteCandidateMutation.mutateAsync(deleteTarget.id);
                notify({
                  type: "success",
                  message: "Deleted",
                  description: "The candidate has been successfully deleted.",
                });
                setDeleteOpen(false);
                setDeleteTarget(null);
                await refetch?.();
              } catch (err) {
                notify({
                  type: "error",
                  message: "Delete failed",
                  description: getErrorMessage(err),
                });
              }
            }}
          />
        )}

        {canManageCandidate && (
          <ModalConfirm
            open={bulkConfirmOpen}
            setOpen={setBulkConfirmOpen}
            title={
              bulkAction === "activate"
                ? "Bulk activate candidates"
                : "Bulk inactivate candidates"
            }
            message={
              bulkAction === "activate"
                ? `Are you sure you want to activate ${selectedIds.length} selected candidate(s)?`
                : `Are you sure you want to move ${selectedIds.length} selected candidate(s) to inactive?`
            }
            titleButton={bulkAction === "activate" ? "ACTIVE" : "INACTIVE"}
            cancelButtonText="CANCEL"
            confirmButtonProps={{
              background: bulkAction === "inactive" ? "#718096" : undefined,
            }}
            onClick={runBulkAction}
          />
        )}

        {canManageCandidate && (
          <CandidateCreateModal
            isOpen={modalOpen}
            mode={modalMode}
            data={selectedCandidate}
            onClose={() => {
              setModalOpen(false);
              setSelectedCandidate(undefined);
            }}
            onSubmit={handleSubmitCandidate}
            isSubmitting={
              createCandidateMutation.isPending ||
              updateCandidateMutation.isPending ||
              uploadCvMutation.isPending ||
              uploadAvatarMutation.isPending
            }
          />
        )}
      </VStack>
    </>
  );
}
