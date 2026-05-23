import { useMemo, useState, type ReactNode } from "react";
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle } from "react-icons/fi";
import { useUpdateJob } from "../../job/api/update";
import type { IJob, IJobCandidates } from "../../job/types";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import BaseTable, { type BaseTableState, DefaultTableState, type HeaderTable } from "../../../../components/common/BaseTable";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { type JobStatusType, JOB_STATUS } from "../../../../constant";
import theme from "../../../../theme";
type JobCandidateProps = {
  jobCandidates?: IJobCandidates[];
  jobs?: IJob[];
  employeeId?: string;
  toolbarRight?: ReactNode;
  showCandidates?: boolean;
  onAddClick?: () => void;
  onViewClick?: (job: IJob) => void;
  onEditClick?: (job: IJob) => void;
  onDeleteClick?: (job: IJob) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canToggleStatus?: boolean;
};

type JobFilterTab = "in_progress" | "completed";

const normalizeJobStatus = (status?: string | null, isActive?: boolean): JobStatusType => {
  // Keep legacy compatibility for old DB values while enforcing canonical values in UI behavior.
  if (isActive === false) return JOB_STATUS.COMPLETED;
  const normalized = (status || "").trim().toLowerCase();
  if (!normalized) return JOB_STATUS.IN_PROGRESS;

  const completedStatuses = [
    "completed",
    "done",
    "closed",
    "inactive",
    "not suitable",
    "passed",
  ];

  return completedStatuses.includes(normalized)
    ? JOB_STATUS.COMPLETED
    : JOB_STATUS.IN_PROGRESS;
};

const formatDeadline = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} - ${hh}:${min}`;
};

const isDueTodayOrOverdue = (value?: string | Date | null) => {
  if (!value) return false;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  // Compare by day (ignore hour/minute) so "today" is treated correctly.
  const deadlineDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return deadlineDate.getTime() <= today.getTime();
};

const shouldHighlightOverdue = (job: IJob) => {
  const completed = normalizeJobStatus(job.status, job.is_active) === JOB_STATUS.COMPLETED;
  if (completed) return false;
  return isDueTodayOrOverdue(job.deadline);
};

export const getJobCompanyName = (job: IJob) => {
  const department = job.jobCandidates
    ?.flatMap((jc) => jc.candidate?.statusApplication || [])
    ?.find((app) => {
      const dep = app.recruitment_infor?.department;
      return !!(dep?.full_name || dep?.acronym_name);
    })
    ?.recruitment_infor?.department;

  return department?.full_name || department?.acronym_name || "Unknown company";
};

const getCandidateSummary = (job: IJob) => {
  const names = Array.from(
    new Set(
      (job.jobCandidates || [])
        .map((jc) => jc.candidate?.candidate_name?.trim())
        .filter((name): name is string => !!name),
    ),
  );

  if (names.length === 0) {
    return "No candidates";
  }

  if (names.length <= 2) {
    return names.join(", ");
  }

  return `${names[0]}, ${names[1]} +${names.length - 2}`;
};

export default function JobCandidate({
  jobCandidates = [],
  jobs: directJobs,
  employeeId,
  toolbarRight,
  showCandidates = false,
  onAddClick,
  onViewClick,
  onEditClick,
  onDeleteClick,
  canAdd = true,
  canEdit = true,
  canDelete = true,
  canToggleStatus = true,
}: JobCandidateProps) {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<JobFilterTab>("in_progress");
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [tableState] = useState<Partial<BaseTableState>>({
    ...DefaultTableState,
    sort_by: "deadline",
    sort_order: "asc",
  });

  const updateJobMutation = useUpdateJob({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const jobs = useMemo(() => {
    if (directJobs?.length) {
      if (!employeeId) {
        return directJobs;
      }

      return directJobs.filter((job) => {
        const assignedEmployeeId = job.employee_id || job.employee?.id;
        return assignedEmployeeId === employeeId;
      });
    }

    const seen = new Set<string>();
    const rows: IJob[] = [];

    for (const relation of jobCandidates) {
      const job = relation.job;
      if (!job?.id) continue;
      if (seen.has(job.id)) continue;

      if (employeeId) {
        const assignedEmployeeId = job.employee_id || job.employee?.id;
        if (assignedEmployeeId !== employeeId) continue;
      }

      seen.add(job.id);
      rows.push(job);
    }

    return rows;
  }, [jobCandidates, directJobs, employeeId]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const normalizedStatus = normalizeJobStatus(job.status, job.is_active);
      return activeTab === "completed"
        ? normalizedStatus === JOB_STATUS.COMPLETED
        : normalizedStatus === JOB_STATUS.IN_PROGRESS;
    });
  }, [jobs, activeTab]);

  const columns: HeaderTable[] = [
    { name: "", key: "state", disableSort: true, headerStyle: { width: "56px" } },
    { name: "Job Name", key: "name_job" },
    ...(showCandidates ? [{ name: "Candidates", key: "candidates", disableSort: true } as HeaderTable] : []),
    { name: "Assignee", key: "assignee", disableSort: true },
    { name: "Deadline", key: "deadline" },
    { name: "Actions", key: "actions", disableSort: true, headerStyle: { width: "56px" } },
  ];

  const mappedRows = useMemo(() => {
    return filteredJobs.map((job) => ({
      ...job,
      state: "state",
      ...(showCandidates ? { candidates: "candidates" } : {}),
      assignee: job.employee?.employee_name || "Unassigned",
      actions: "actions",
    }));
  }, [filteredJobs]);

  const customRows = {
    state: (_: any, row: IJob) => (
      <IconButton
        aria-label="Job state"
        icon={<FiCheckCircle />}
        variant="ghost"
        color={normalizeJobStatus(row.status, row.is_active) === JOB_STATUS.COMPLETED ? "green.500" : "gray.500"}
        size="sm"
        isDisabled={!canToggleStatus}
        isLoading={updateJobMutation.isPending && updatingJobId === row.id}
        onClick={() => {
          if (!canToggleStatus) return;
          if (!row.id || updateJobMutation.isPending) return;

          const shouldMoveToInProgress = activeTab === "completed";
          const nextStatus = shouldMoveToInProgress
            ? JOB_STATUS.IN_PROGRESS
            : JOB_STATUS.COMPLETED;

          setUpdatingJobId(row.id);
          updateJobMutation.mutate(
            {
              id: row.id,
              data: {
                status: nextStatus,
              },
            },
            {
              onSuccess: () => {
                notify({
                  type: "success",
                  message: "Updated successfully",
                  description: `Job \"${row.name_job || "Untitled job"}\" has been moved to ${nextStatus.toUpperCase()}.`,
                });
              },
              onError: () => {
                notify({
                  type: "error",
                  message: "Update failed",
                  description: `Could not update status for job \"${row.name_job || "Untitled job"}\".`,
                });
              },
              onSettled: () => {
                setUpdatingJobId(null);
              },
            },
          );
        }}
      />
    ),
    name_job: (_: any, row: IJob) => (
      <Text
        fontWeight="600"
        color={shouldHighlightOverdue(row) ? "red.500" : "black"}
        noOfLines={1}
      >
        {row.name_job || "Untitled job"}
      </Text>
    ),
    candidates: (_: any, row: IJob) => (
      <Tooltip label={getCandidateSummary(row)} hasArrow>
        <Text noOfLines={1} maxW="260px" fontWeight="500">
          {getCandidateSummary(row)}
        </Text>
      </Tooltip>
    ),
    assignee: (_: any, row: IJob) => {
      const assigneeName = row.employee?.employee_name || "Unassigned";
      return (
        <HStack spacing={2} justify="center">
          <Avatar size="sm" name={assigneeName} bg="orange.400" color="white" />
          <Text noOfLines={1} maxW="180px">
            {assigneeName}
          </Text>
        </HStack>
      );
    },
    deadline: (_: any, row: IJob) => (
      <Text color={shouldHighlightOverdue(row) ? "red.500" : "black"} fontWeight="600">
        {formatDeadline(row.deadline)}
      </Text>
    ),
    actions: (_: any, row: IJob) => (
      <HStack spacing={0} justify="center">
        <Tooltip label="View" hasArrow>
          <IconButton
            aria-label="View job"
            icon={<FaEye />}
            size="sm"
            variant="ghost"
            color="gray.700"
            onClick={(e) => {
              e.stopPropagation();
              onViewClick?.(row);
            }}
          />
        </Tooltip>

        {canEdit && (
          <Tooltip label="Edit" hasArrow>
            <IconButton
              aria-label="Edit job"
              icon={<FaEdit />}
              size="sm"
              variant="ghost"
              color="blue.600"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick?.(row);
              }}
            />
          </Tooltip>
        )}

        {canDelete && (
          <Tooltip label="Delete" hasArrow>
            <IconButton
              aria-label="Delete job"
              icon={<FaTrash />}
              size="sm"
              variant="ghost"
              color="red.600"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick?.(row);
              }}
            />
          </Tooltip>
        )}
      </HStack>
    ),
  };

  return (
    <Box>
      <Flex
        justify="space-between"
        align="center"
        mb={4}
        gap={3}
        wrap={{ base: "wrap", lg: "nowrap" }}
      >
        {canAdd ? (
          <Button
            size="sm"
            background={theme.colors.primary}
            color="white"
            _hover={{ bg: theme.colors.primary }}
            onClick={onAddClick}
          >
            ADD
          </Button>
        ) : (
          <Box />
        )}

        <HStack spacing={2} ml="auto" flexWrap="wrap" justify="flex-end">
          <HStack spacing={1}>
          <Button
            size="sm"
            borderRadius="sm"
            variant={activeTab === "in_progress" ? "solid" : "outline"}
            background={activeTab === "in_progress" ? theme.colors.primary : "white"}
            color={activeTab === "in_progress" ? "white" : theme.colors.primary}
            borderColor={theme.colors.primary}
            _hover={{ bg: activeTab === "in_progress" ? theme.colors.primary : "gray.50" }}
            onClick={() => setActiveTab("in_progress")}
          >
            IN PROGRESS
          </Button>
          <Button
            size="sm"
            borderRadius="sm"
            variant={activeTab === "completed" ? "solid" : "outline"}
            background={activeTab === "completed" ? theme.colors.primary : "white"}
            color={activeTab === "completed" ? "white" : theme.colors.primary}
            borderColor={theme.colors.primary}
            _hover={{ bg: activeTab === "completed" ? theme.colors.primary : "gray.50" }}
            onClick={() => setActiveTab("completed")}
          >
            COMPLETED
          </Button>
          </HStack>
          {toolbarRight ?? null}
        </HStack>
      </Flex>

      <BaseTable
        columns={columns}
        data={mappedRows}
        tableState={tableState}
        customRows={customRows}
        hideCheckboxes
      />
    </Box>
  );
}
