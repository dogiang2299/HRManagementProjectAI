import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
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
import { FaEdit, FaEye, FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import { useDebounce } from "use-debounce";
import BaseTable, {
  DefaultTableState,
  type BaseTableState,
  type HeaderTable,
} from "../../../../components/common/BaseTable";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { PaginationBar } from "../../../../components/common/PaginationBar";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { formatDateShort } from "../../../../types";
import { useGetPotentialCandidates } from "../api/get";
import { useCreateCandidate } from "../../candidate/api/create";
import { usePotentialTypes } from "../../candidate/api/potential_type";
import { useupdateCandidate } from "../../candidate/api/update";
import { useUploadCandidateAvatar } from "../../candidate/api/upload_avatar";
import { useUploadCandidateCv } from "../../candidate/api/upload_cv";
import CandidateCreateModal from "../../candidate/components/CandidateModal";
import type { ICandidate, CandidateCreatePayload } from "../../candidate/types";
import { getCandidateRecruitmentPosition, getCandidateRecruitmentPost, getCandidateAppliedDate, getCandidateAverageRating, getLatestCandidateApplication, getApplicationStatusLabel, getApplicationStatusBadgeStyle } from "../../candidate/utils";
import { useAuthStore } from "../../../auth/store/auth.store";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";

const RatingStars = ({ value }: { value: number }) => {
  const normalized = Math.max(0, Math.min(5, Math.round(value * 2) / 2));

  return (
    <HStack spacing={0.5}>
      {Array.from({ length: 5 }, (_, idx) => {
        const starIndex = idx + 1;
        const full = normalized >= starIndex;
        const half = normalized >= starIndex - 0.5 && normalized < starIndex;
        const icon = full ? FaStar : half ? FaStarHalfAlt : FaRegStar;

        return <Icon key={starIndex} as={icon} boxSize="12px" color="yellow.400" />;
      })}
    </HStack>
  );
};

export function Potential() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const navigate = useNavigate();
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const isEmployer = hasAnyRole([RECRUIT_BASE_ROLE.Employer]) && !hasAnyRole([RECRUIT_BASE_ROLE.Admin, RECRUIT_BASE_ROLE.Employee]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [selectedPotentialTypeId, setSelectedPotentialTypeId] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCandidate, setSelectedCandidate] = useState<ICandidate | undefined>(undefined);

  const [tableState] = useState<Partial<BaseTableState>>({
    ...DefaultTableState,
    page_size: 5,
    sort_order: "desc",
    sort_by: "created_at",
  });

  const { data: potentialTypeRes, isLoading: isPotentialTypeLoading } = usePotentialTypes();
  const createCandidateMutation = useCreateCandidate();
  const updateCandidateMutation = useupdateCandidate();
  const uploadCvMutation = useUploadCandidateCv();
  const uploadAvatarMutation = useUploadCandidateAvatar();

  const { data: potentialRes, isLoading, refetch } = useGetPotentialCandidates({
    pages: page,
    limit,
    search: debouncedSearch,
    potential_type_id: selectedPotentialTypeId || undefined,
  });

  const rows = useMemo(() => potentialRes?.data ?? [], [potentialRes?.data]);
  const pagination = potentialRes?.pagination ?? {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 5,
  };

  const potentialTypeOptions = potentialTypeRes?.data ?? [];
  const potentialTypeSelectOptions = potentialTypeOptions.map((item) => ({
    value: item.id,
    label: (item.name ?? "").toUpperCase(),
  }));

  const columns: HeaderTable[] = [
    { name: "Candidate", key: "candidate_name" },
    { name: "Contact", key: "contact", disableSort: true },
    { name: "Potential Type", key: "potential_type", disableSort: true },
    { name: "Recruitment Position", key: "recruitment_position", disableSort: true },
    { name: "Job Post", key: "recruitment_post", disableSort: true },
    { name: "Rating", key: "rating", disableSort: true },
    { name: "Status", key: "status", disableSort: true },
  ];

  const customRows = {
    candidate_name: (_: any, row: ICandidate) => (
      <Box>
        <Text fontWeight="600">{row.candidate_name || "N/A"}</Text>
        <Text fontSize="sm" color="gray.500">
          {row.candidate_code || ""}
        </Text>
      </Box>
    ),
    contact: (_: any, row: ICandidate) => (
      <Box>
        <Text fontSize="sm">{row.phone_number || ""}</Text>
        <Text fontSize="sm" color="gray.500">
          {row.email || ""}
        </Text>
      </Box>
    ),
    potential_type: (_: any, row: ICandidate) => (
      <Badge borderRadius="full" px={3} py={1} colorScheme="purple" textTransform="none">
        {(row.potential?.name || "Uncategorized").toUpperCase()}
      </Badge>
    ),
    recruitment_position: (_: any, row: ICandidate) => (
      <Text fontSize="sm">{getCandidateRecruitmentPosition(row)}</Text>
    ),
    recruitment_post: (_: any, row: ICandidate) => (
      <Text fontSize="sm">{getCandidateRecruitmentPost(row)}</Text>
    ),
    date_applied: (_: any, row: ICandidate) => (
      <Text fontSize="sm">{formatDateShort(getCandidateAppliedDate(row))}</Text>
    ),
    rating: (_: any, row: ICandidate) => {
      const { average, count } = getCandidateAverageRating(row);
      if (!count) return <Text fontSize="sm" color="gray.500">-</Text>;

      return (
        <Box>
          <HStack justify="center" spacing={1}>
            <RatingStars value={average} />
          </HStack>
        </Box>
      );
    },
    status: (_: any, row: ICandidate) => {
      const latestApplication = getLatestCandidateApplication(row);
      const status = latestApplication?.status;
      const statusLabel = getApplicationStatusLabel(status);
      const badgeStyle = getApplicationStatusBadgeStyle(status);

      return (
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
      );
    },
  };

  const getErrorMessage = (error: unknown) => {
    const e = error as { response?: { data?: { message?: unknown } }; message?: string };
    const msg = e?.response?.data?.message ?? e?.message;

    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string" && msg.trim()) return msg;
    return "An unexpected error occurred.";
  };

  const handleSubmitCandidate = async (payload: CandidateCreatePayload) => {
    const { cv_file, avatar_file, ...candidateData } = payload;

    const normalizedData = {
      ...candidateData,
      is_potential: true,
      potential_type_id: candidateData.potential_type_id || selectedPotentialTypeId || null,
    };

    if (!normalizedData.potential_type_id) {
      notify({
        type: "warning",
        message: "Missing potential type",
        description: "Potential type is required for potential candidates.",
      });
      return;
    }

    try {
      if (modalMode === "edit" && selectedCandidate?.id) {
        const updated = await updateCandidateMutation.mutateAsync({
          id: selectedCandidate.id,
          data: normalizedData,
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
          description: "Potential candidate has been updated successfully.",
        });
      } else {
        const created = await createCandidateMutation.mutateAsync(normalizedData);

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
          description: "Potential candidate has been created successfully.",
        });
      }

      setModalOpen(false);
      setSelectedCandidate(undefined);

      // Reset list conditions so newly created/updated potential candidates are visible immediately.
      setPage(1);
      setSearchQuery("");
      setSelectedPotentialTypeId("");
      await queryClient.invalidateQueries({ queryKey: ["potential-candidates"] });
      await refetch();
    } catch (error) {
      notify({
        type: "error",
        message: modalMode === "edit" ? "Update failed" : "Create failed",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Flex align="center" gap={4} wrap="wrap">
        {!isEmployer && (
          <Button
            bg="#334371"
            color="white"
            _hover={{ bg: "#233055" }}
            onClick={() => {
              setModalMode("add");
              setSelectedCandidate(undefined);
              setModalOpen(true);
            }}
          >
            ADD
          </Button>
        )}

        <Spacer />

        <InputGroup
          flex={{ base: "1 1 100%", md: "1 1 0" }}
          minW={{ base: "100%", md: "320px" }}
          maxW={{ base: "100%", md: "420px" }}
        >
          <InputLeftElement pointerEvents="none">
            <SearchIcon />
          </InputLeftElement>
          <Input
            placeholder="Search by name, code, email, phone"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            h="40px"
          />
        </InputGroup>

        <Box
          flex={{ base: "1 1 100%", md: "1 1 0" }}
          minW={{ base: "100%", md: "250px" }}
          maxW={{ base: "100%", md: "250px" }}
        >
          <SearchCombobox
            value={selectedPotentialTypeId}
            onChange={(value) => {
              setSelectedPotentialTypeId(value);
              setPage(1);
            }}
            options={potentialTypeOptions.map((item) => ({
              id: item.id,
              name: (item.name ?? ""),
            }))}
            placeholder={isPotentialTypeLoading ? "Loading potential types..." : "Filter by potential type"}
            isDisabled={isPotentialTypeLoading}
            isClearable
            size="md"
            zIndex={3000}
          />
        </Box>
      </Flex>

      <Box
        overflowY="auto"
        border="1px solid #E2E8F0"
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
          data={rows}
          tableState={tableState}
          customRows={customRows}
          isLoading={isLoading}
          renderRowActions={(row: ICandidate & { id: string }) => (
            <HStack spacing={2} justify="center">
              <Tooltip label="View details" hasArrow>
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
              {!isEmployer && (
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
            </HStack>
          )}
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

      <CandidateCreateModal
        isOpen={modalOpen}
        mode={modalMode}
        data={selectedCandidate}
        forcePotential
        potentialTypeOptions={potentialTypeSelectOptions}
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
    </VStack>
  );
}
