import { useMemo } from "react";
import { Box, Button, Flex, HStack, Icon, Spinner, Text, VStack } from "@chakra-ui/react";
import { FiCheck, FiClock, FiEdit2, FiFileText, FiTrash2, FiUploadCloud, FiUserPlus } from "react-icons/fi";
import { BsBriefcase } from "react-icons/bs";
import { useCandidateAuditLogs } from "../api/audit_log";
import type { ICandidateAuditLog } from "../types";

type CandidateAuditLogProps = {
  candidateId: string;
  applicationId?: string;
};

type AuditContent = {
  summary: string;
  details: string[];
};

const formatDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const getActorName = (item: ICandidateAuditLog) => {
  if (item.actorEmployee?.employee_name) return item.actorEmployee.employee_name;
  if (item.actor_role) return item.actor_role;
  return item.actor_type || "System";
};

const getTimelineStyle = (action: string) => {
  const key = (action || "").toUpperCase();

  if (key.includes("CREATED")) return { icon: FiUserPlus, bg: "#ec4899" };
  if (key.includes("UPDATED")) return { icon: FiEdit2, bg: "#0ea5e9" };
  if (key.includes("DELETED") || key.includes("DEACTIVATED")) return { icon: FiTrash2, bg: "#ef4444" };
  if (key.includes("CV") || key.includes("UPLOAD")) return { icon: FiUploadCloud, bg: "#8b5cf6" };
  if (key.includes("APPLICATION")) return { icon: FiFileText, bg: "#84cc16" };
  if (key.includes("JOB")) return { icon: BsBriefcase, bg: "#f97316" };
  if (key.includes("REVIEW")) return { icon: FiCheck, bg: "#22c55e" };
  return { icon: FiClock, bg: "#64748b" };
};

const toText = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
};

const formatScore = (value: number) => {
  const fixed = value.toFixed(1);
  return fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
};

const reviewLabel = (rating: number) => (rating >= 3 ? "Suitable" : "Not Suitable");

const formatReviewResult = (rating: number) => `${reviewLabel(rating)} (${formatScore(rating)} points)`;

const normalizeJobStatus = (status: string) => {
  const key = status.trim().toLowerCase();
  if (key === "completed" || key === "active" || key === "done") return "completed";
  if (key === "pending" || key === "inactive" || key === "todo") return "pending";
  return key;
};

const getJobStatusLabel = (status: string) => {
  const normalized = normalizeJobStatus(status);
  if (normalized === "completed") return "Completed";
  if (normalized === "pending") return "Pending";
  return status;
};

const getApplicationStageLabel = (status?: string | null) => {
  const key = (status || "").trim().toLowerCase();
  if (!key) return "";

  const map: Record<string, string> = {
    applied: "Applied",
    "in contact": "In Contact",
    "waiting response": "Waiting Response",
    closed: "Closed",
    "not suitable": "Not Suitable",
  };

  return map[key] ?? status ?? "";
};

const getRecruitmentTitle = (metadata?: Record<string, any> | null) => {
  if (!metadata) return "";
  return (
    toText(metadata.recruitment_post_title) ||
    toText(metadata.recruitment_internal_title) ||
    ""
  );
};

const buildAuditContent = (item: ICandidateAuditLog): AuditContent => {
  const action = (item.action || "").toUpperCase();
  const metadata = item.metadata ?? {};

  if (action === "CANDIDATE_REVIEW_CREATED") {
    const rating = toNumber(metadata.rating);
    const comment = toText(metadata.comment);

    return {
      summary: rating !== null ? `reviewed the candidate: ${formatReviewResult(rating)}` : "reviewed the candidate",
      details: comment ? [`Review content: ${comment}`] : [],
    };
  }

  if (action === "CANDIDATE_REVIEW_UPDATED") {
    const oldRating = toNumber(metadata.old_rating);
    const newRating = toNumber(metadata.new_rating ?? metadata.rating);
    const oldComment = toText(metadata.old_comment);
    const newComment = toText(metadata.new_comment);
    const details: string[] = [];

    let summary = "updated candidate review";
    if (oldRating !== null && newRating !== null && oldRating !== newRating) {
      summary = `updated candidate review: from ${formatReviewResult(oldRating)} to ${formatReviewResult(newRating)}`;
    } else if (newRating !== null) {
      summary = `updated candidate review: ${formatReviewResult(newRating)}`;
    }

    if (oldComment && newComment && oldComment !== newComment) {
      details.push(`Review content: from ${oldComment} to ${newComment}`);
    } else if (newComment) {
      details.push(`Review content: ${newComment}`);
    }

    return { summary, details };
  }

  if (action === "CANDIDATE_REVIEW_DELETED") {
    return {
      summary: "deleted candidate review",
      details: [],
    };
  }

  if (action === "JOB_UPDATED_FOR_CANDIDATE") {
    const oldStatusRaw = toText(metadata.old_status || metadata.status);
    const newStatusRaw = toText(metadata.new_status || metadata.status);
    const oldStatus = oldStatusRaw ? normalizeJobStatus(oldStatusRaw) : "";
    const newStatus = newStatusRaw ? normalizeJobStatus(newStatusRaw) : "";
    const oldJobName = toText(metadata.old_job_name);
    const newJobName = toText(metadata.new_job_name || metadata.job_name);
    const jobName = newJobName || oldJobName || "cong viec";

    if (oldStatus && newStatus && oldStatus !== newStatus) {
      if (newStatus === "completed") {
        return { summary: `completed job ${jobName}`, details: [] };
      }
      if (oldStatus === "completed" && newStatus === "pending") {
        return { summary: `reopened job ${jobName}`, details: [] };
      }
      return {
        summary: `updated job status ${jobName}`,
        details: [`Status: from ${getJobStatusLabel(oldStatusRaw)} to ${getJobStatusLabel(newStatusRaw)}`],
      };
    }

    if (oldJobName && newJobName && oldJobName !== newJobName) {
      return {
        summary: `updated job`,
        details: [`Job name: from ${oldJobName} to ${newJobName}`],
      };
    }

    return {
      summary: `updated job ${jobName}`,
      details: [],
    };
  }

  if (action === "JOB_CREATED_FOR_CANDIDATE") {
    const jobName = toText(metadata.job_name) || "job";
    return { summary: `added job ${jobName}`, details: [] };
  }

  if (action === "JOB_DELETED_FOR_CANDIDATE") {
    const jobName = toText(metadata.job_name) || "job";
    return { summary: `removed job ${jobName}`, details: [] };
  }

  if (action === "APPLICATION_STATUS_UPDATED") {
    const fromStatus = getApplicationStageLabel(toText(metadata.from_status));
    const toStatus = getApplicationStageLabel(toText(metadata.to_status));
    const recruitmentTitle = getRecruitmentTitle(metadata);
    const details: string[] = [];

    const summary = toStatus
      ? `moved candidate to stage ${toStatus}${recruitmentTitle ? ` in recruitment ${recruitmentTitle}` : ""}`
      : "updated application status";

    if (fromStatus && toStatus && fromStatus !== toStatus) {
      details.push(`Application status: from ${fromStatus} to ${toStatus}`);
    }

    return { summary, details };
  }

  if (action === "APPLICATION_CREATED") {
    const recruitmentTitle = getRecruitmentTitle(metadata);
    return {
      summary: recruitmentTitle
        ? `added candidate to recruitment ${recruitmentTitle}`
        : "added candidate to application flow",
      details: [],
    };
  }

  if (action === "APPLICATION_DELETED") {
    const recruitmentTitle = getRecruitmentTitle(metadata);
    return {
      summary: recruitmentTitle
        ? `removed candidate from recruitment ${recruitmentTitle}`
        : "removed candidate from application flow",
      details: [],
    };
  }

  if (action === "CANDIDATE_MOVED_TO_TALENT_POOL") {
    const potentialTypeName = toText(metadata.potential_type_name_after);
    return {
      summary: "moved candidate to talent pool",
      details: potentialTypeName ? [`Potential type: ${potentialTypeName}`] : [],
    };
  }

  if (action === "CANDIDATE_REMOVED_FROM_TALENT_POOL") {
    return {
      summary: "removed candidate from talent pool",
      details: [],
    };
  }

  return {
    summary: toText(item.message) || "updated candidate information",
    details: [],
  };
};

export default function CandidateAuditLog({ candidateId, applicationId }: CandidateAuditLogProps) {
  const { data, isLoading, isError, refetch } = useCandidateAuditLogs(candidateId, {
    page: 1,
    limit: 100,
    applicationId,
  });

  const groupedByDate = useMemo(() => {
    const source = data?.data ?? [];
    return source.reduce<Record<string, ICandidateAuditLog[]>>((acc, item) => {
      const key = formatDate(item.created_at);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [data]);

  const dates = useMemo(() => Object.keys(groupedByDate), [groupedByDate]);

  if (isLoading) {
    return (
      <Flex minH="260px" align="center" justify="center">
        <Spinner />
      </Flex>
    );
  }

  if (isError) {
    return (
      <VStack align="stretch" spacing={3}>
        <Text color="red.500" fontWeight="600">
          Failed to load candidate history.
        </Text>
        <Button w="fit-content" size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </VStack>
    );
  }

  if (!dates.length) {
    return (
      <Box>
        <Text color="gray.500" fontSize="sm">
          No activity history yet.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={3}>
      <Box fontSize={'sm'} border="1px solid" borderColor="gray.200" borderRadius="md" p={0} maxH="100%" overflowY="auto">
        {dates.map((dateKey) => (
          <Box key={dateKey}>
            <Box px={4} py={3} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
              <Text fontWeight="700">{dateKey}</Text>
            </Box>

            {groupedByDate[dateKey].map((item) => {
              const style = getTimelineStyle(item.action);
              const content = buildAuditContent(item);
              return (
                <Flex
                  key={item.id}
                  px={4}
                  py={4}
                  align="flex-start"
                  justify="space-between"
                  borderBottom="1px solid"
                  borderColor="gray.100"
                  gap={3}
                >
                  <HStack align="flex-start" spacing={3} flex="1" minW={0}>
                    <Flex
                      w="34px"
                      h="34px"
                      minW="34px"
                      borderRadius="full"
                      bg={style.bg}
                      align="center"
                      justify="center"
                      color="white"
                    >
                      <Icon as={style.icon} boxSize={4} />
                    </Flex>

                    <Box minW={0}>
                      <Text fontSize="sm" color="gray.800" lineHeight="1.5">
                        <Text as="span" fontWeight="700">
                          {getActorName(item)}
                        </Text>{" "}
                        {content.summary}
                      </Text>

                      {content.details.map((detail, index) => (
                        <Text key={`${item.id}-${index}`} mt={1} color="gray.500" fontSize="xs">
                          {detail}
                        </Text>
                      ))}
                    </Box>
                  </HStack>

                  <Text color="gray.500" fontSize="sm" minW="44px" textAlign="right">
                    {formatTime(item.created_at)}
                  </Text>
                </Flex>
              );
            })}
          </Box>
        ))}
      </Box>
    </VStack>
  );
}
