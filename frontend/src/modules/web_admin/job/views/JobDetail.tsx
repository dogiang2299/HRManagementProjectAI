import {
  Box,
  Button,
  Divider,
  Grid,
  GridItem,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeleteJob } from "../api/delete";
import { useJobByID } from "../api/get";
import JobModal from "../components/JobModal";
import type { IJob } from "../types";
import { ModalConfirm } from "../../../../components/common/ModalConfirm";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import  { jobsUrl } from "../../../../routes/urls";

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

const getCompanyName = (job: IJob) => {
  const department = job?.jobCandidates
    ?.flatMap((jc) => jc.candidate?.statusApplication || [])
    ?.find((app) => {
      const dep = app.recruitment_infor?.department;
      return !!(dep?.full_name || dep?.acronym_name);
    })
    ?.recruitment_infor?.department;

  return department?.full_name || department?.acronym_name || "Unknown company";
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Text fontSize="sm" color="gray.500" mb={1}>
      {label}
    </Text>
    <Text fontWeight={600}>{value || "-"}</Text>
  </Box>
);

export default function JobDetail() {
  const notify = useNotify();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const id = params.id || "";

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { mutateAsync: deleteJob, isPending: isDeleting } = useDeleteJob();

  const { data: job, isLoading, isError } = useJobByID(id);

  const candidateNames = useMemo(() => {
    const names = Array.from(
      new Set(
        (job?.jobCandidates || [])
          .map((item) => item.candidate?.candidate_name?.trim())
          .filter((name): name is string => !!name),
      ),
    );

    if (!names.length) return "No related candidates";
    return names.join(", ");
  }, [job?.jobCandidates]);

  const handleDelete = async () => {
    if (!job?.id) return;

    try {
      await deleteJob(job.id);
      notify({
        type: "success",
        message: "Deleted successfully",
        description: `Job "${job.name_job || "Untitled job"}" has been removed.`,
      });
      navigate(jobsUrl);
    } catch (error: any) {
      const rawMessage = error?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : typeof rawMessage === "string"
          ? rawMessage
          : "Could not delete this job.";

      notify({
        type: "error",
        message: "Delete failed",
        description: message,
      });
    }
  };

  if (isLoading) {
    return (
      <VStack py={10} spacing={3}>
        <Spinner size="lg" color="#334371" />
        <Text color="gray.600">Loading job details...</Text>
      </VStack>
    );
  }

  if (isError || !job) {
    return (
      <VStack py={10} spacing={3}>
        <Text color="red.500" fontWeight="600">
          Failed to load job details
        </Text>
        <Button size="sm" onClick={() => navigate(jobsUrl)}>
          Back to jobs
        </Button>
      </VStack>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={4} flexWrap="wrap" gap={3}>
        <VStack align="start" spacing={0}>
          <Text fontSize="2xl" fontWeight={700}>
            {job.name_job || "Untitled job"}
          </Text>
          <Text color="gray.500">Code: {job.job_code || "-"}</Text>
        </VStack>

        <HStack>
          <Button size="sm" variant="outline" onClick={() => navigate(jobsUrl)}>
            Back
          </Button>
          <Button size="sm" colorScheme="blue" onClick={() => setIsEditOpen(true)}>
            Edit
          </Button>
          <Button size="sm" colorScheme="red" onClick={() => setIsDeleteOpen(true)}>
            Delete
          </Button>
        </HStack>
      </HStack>

      <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={{ base: 4, md: 6 }} bg="white">
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }} gap={5}>
          <GridItem>
            <Field label="Status" value={job.status || "-"} />
          </GridItem>
          <GridItem>
            <Field label="Company" value={getCompanyName(job)} />
          </GridItem>
          <GridItem>
            <Field label="Job type" value={job.type_job || "-"} />
          </GridItem>
          <GridItem>
            <Field label="Execution result" value={job.result_job || "-"} />
          </GridItem>
          <GridItem>
            <Field label="Assignee" value={job.employee?.employee_name || "Unassigned"} />
          </GridItem>
          <GridItem>
            <Field label="Deadline" value={formatDateTime(job.deadline)} />
          </GridItem>
          <GridItem>
            <Field label="Reminder" value={job.remind_enabled ? "Enabled" : "Disabled"} />
          </GridItem>
          <GridItem>
            <Field
              label="Remind before"
              value={job.remind_enabled ? `${job.remind_before_minutes ?? 0} minutes` : "-"}
            />
          </GridItem>
        </Grid>

        <Divider my={5} />

        <Box mb={4}>
          <Text fontSize="sm" color="gray.500" mb={1}>
            Description
          </Text>
          <Text whiteSpace="pre-wrap">{job.description_job || "-"}</Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>
            Related candidates
          </Text>
          <Text whiteSpace="pre-wrap">{candidateNames}</Text>
        </Box>
      </Box>

      <JobModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        mode="edit"
        data={job}
        onSuccess={() => setIsEditOpen(false)}
      />

      <ModalConfirm
        open={isDeleteOpen}
        setOpen={setIsDeleteOpen}
        title="Delete job"
        message={`Are you sure you want to delete \"${job.name_job || "this job"}\"?`}
        titleButton="Delete"
        onClick={handleDelete}
        confirmButtonProps={{ isLoading: isDeleting }}
      />
    </Box>
  );
}