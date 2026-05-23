import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { CloseIcon } from "@chakra-ui/icons";
import { Controller, useForm } from "react-hook-form";
import { useGetEmployee } from "../../employee/api/get_employee";
import { useGetCandidate } from "../../candidate/api/get";
import { useCreateJob, type CreateJobDTO } from "../api/create";
import { useUpdateJob } from "../api/update";
import type { IJob } from "../types";
import theme from "../../../../theme";
import LabelItem from "../../../../components/common/Label";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { type JobStatusType, JOB_STATUS_VALUES, JOB_STATUS } from "../../../../constant";
import { useAuthStore } from "../../../auth/store/auth.store";
interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "view";
  data?: IJob;
  onSuccess?: () => void;
  fixedCandidates?: Array<{ id: string; name: string }>;
  lockCandidateSelection?: boolean;
}

type JobFormValues = {
  name_job: string;
  description_job: string;
  type_job: string;
  result_job: string;
  employee_id: string;
  deadline: string;
  remind_enabled: boolean;
  remind_before_minutes: number;
  status: JobStatusType;
};

const JOB_TYPE_OPTIONS = ["Send email", "Interview", "Follow-up", "Other"];
const RESULT_OPTIONS = [...JOB_STATUS_VALUES];
const REMIND_OPTIONS = [15, 30, 60, 120, 240];
const LABEL_FONT_SIZE = "15px";
const CONTROL_SIZE = "md";

const toDatetimeLocalInput = (value?: string | Date | null) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const toIsoDateTime = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const safeString = (value?: string | null) => value ?? "";

const normalizeJobStatus = (value?: string | null): JobStatusType => {
  const normalized = safeString(value).trim().toLowerCase();

  if (
    [
      "completed",
      "done",
      "closed",
      "inactive",
    ].includes(normalized)
  ) {
    return JOB_STATUS.COMPLETED;
  }

  return JOB_STATUS.IN_PROGRESS;
};
const EMPTY_CANDIDATES: Array<{ id: string; name: string }> = [];
export default function JobModal({
  isOpen,
  onClose,
  mode,
  data,
  onSuccess,
  fixedCandidates = EMPTY_CANDIDATES,
  lockCandidateSelection = false,
}: JobModalProps) {
  const notify = useNotify();
  const { mutateAsync: createJob } = useCreateJob();
  const { mutateAsync: updateJob } = useUpdateJob();
  const isViewMode = mode === "view";
  
  const isEmployer = useAuthStore((s) => s.hasAnyRole(["Employer"]));
  const companyId = useAuthStore((s) => (s.user as any)?.company_id as string | undefined);

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [candidatePickerValue, setCandidatePickerValue] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  const { data: employeeRes } = useGetEmployee({ page: 1, limit: 200, sortBy: "created_at", sortOrder: "desc" });
  const { data: candidateRes, isLoading: isCandidateLoading } = useGetCandidate({
    page: 1,
    limit: 500,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const defaultValues = useMemo<JobFormValues>(
    () => ({
      name_job: "",
      description_job: "",
      type_job: JOB_TYPE_OPTIONS[0],
      result_job: RESULT_OPTIONS[0],
      employee_id: "",
      deadline: "",
      remind_enabled: false,
      remind_before_minutes: 30,
      status: JOB_STATUS.IN_PROGRESS,
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    mode: "onChange",
    defaultValues,
  });

  const remindEnabled = watch("remind_enabled");

  const employeeOptions = useMemo(
    () =>
      (employeeRes?.data ?? []).map((employee) => ({
        id: employee.id,
        name: employee.employee_name || employee.email_account || employee.phone_account,
      })),
    [employeeRes?.data],
  );

  const candidateOptions = useMemo(
    () =>
      (candidateRes?.data ?? []).map((candidate) => ({
        id: candidate.id,
        name: candidate.candidate_name || candidate.email || candidate.phone_number || "Unnamed candidate",
      })),
    [candidateRes?.data],
  );

  const mergedCandidateOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    fixedCandidates.forEach((candidate) => {
      if (candidate.id) {
        map.set(candidate.id, candidate);
      }
    });

    candidateOptions.forEach((candidate) => {
      if (candidate.id && !map.has(candidate.id)) {
        map.set(candidate.id, candidate);
      }
    });

    return Array.from(map.values());
  }, [fixedCandidates, candidateOptions]);

  const availableCandidateOptions = useMemo(
    () =>
      mergedCandidateOptions.filter((item) => !selectedCandidateIds.includes(item.id || "")),
    [mergedCandidateOptions, selectedCandidateIds],
  );

  const selectedCandidates = useMemo(
    () => mergedCandidateOptions.filter((item) => selectedCandidateIds.includes(item.id || "")),
    [mergedCandidateOptions, selectedCandidateIds],
  );

  useEffect(() => {
    if (!candidatePickerValue) return;

    setSelectedCandidateIds((prev) => {
      if (prev.includes(candidatePickerValue)) return prev;
      return [...prev, candidatePickerValue];
    });

    setCandidatePickerValue("");
  }, [candidatePickerValue]);

  useEffect(() => {
    if (!isOpen) return;

    const lockedCandidateIds = fixedCandidates.map((candidate) => candidate.id).filter(Boolean);

    if ((mode === "edit" || mode === "view") && data) {
      reset({
        name_job: safeString(data.name_job),
        description_job: safeString(data.description_job),
        type_job: safeString(data.type_job) || JOB_TYPE_OPTIONS[0],
        result_job: normalizeJobStatus(data.result_job ?? data.status),
        employee_id: safeString(data.employee_id),
        deadline: toDatetimeLocalInput(data.deadline),
        remind_enabled: Boolean(data.remind_enabled),
        remind_before_minutes: Number(data.remind_before_minutes ?? 30),
        status: normalizeJobStatus(data.result_job ?? data.status),
      });

      setSelectedCandidateIds(
        lockCandidateSelection && lockedCandidateIds.length
          ? lockedCandidateIds
          : (data.jobCandidates?.map((item) => item.candidate_id) ?? [])
      );
      setCandidatePickerValue("");
      return;
    }

    reset(defaultValues);
    setSelectedCandidateIds(lockCandidateSelection ? lockedCandidateIds : []);
    setCandidatePickerValue("");
  }, [isOpen, mode, data, reset, defaultValues, fixedCandidates, lockCandidateSelection]);

  const handleRemoveCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) => prev.filter((id) => id !== candidateId));
  };

  const onSubmit = async (values: JobFormValues) => {
    if (isViewMode) return;

    setIsSubmittingForm(true);
    const lockedCandidateIds = fixedCandidates.map((candidate) => candidate.id).filter(Boolean);
    const candidateIds = lockCandidateSelection ? lockedCandidateIds : selectedCandidateIds;

    const normalizedStatusFromResult = normalizeJobStatus(values.result_job);

    const payload: CreateJobDTO = {
      name_job: values.name_job.trim() || null,
      description_job: values.description_job.trim() || null,
      type_job: values.type_job.trim() || null,
      result_job: normalizedStatusFromResult,
      employee_id: values.employee_id,
      deadline: toIsoDateTime(values.deadline),
      remind_enabled: Boolean(values.remind_enabled),
      remind_before_minutes: values.remind_enabled ? Number(values.remind_before_minutes || 30) : null,
      status: normalizedStatusFromResult,
      candidate_ids: candidateIds,
      ...(isEmployer && companyId ? { company_id: companyId } : {}),
    };

    try {
      if (mode === "add") {
        await createJob({ ...payload, is_active: true });
        notify({ message: "Job created successfully", type: "success" });
      } else {
        if (!data?.id) return;
        await updateJob({ id: data.id, data: payload });
        notify({ message: "Job updated successfully", type: "success" });
      }

      onSuccess?.();
      reset(defaultValues);
      setSelectedCandidateIds([]);
      onClose();
    } catch (error: any) {
      const rawMessage = error?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : typeof rawMessage === "string"
          ? rawMessage
          : "An error occurred while saving job";
      notify({ message, type: "error" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent
        maxW={{ base: "95%", md: "700px" }}
        w="100%"
        borderRadius="18px"
        maxH="85vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        <ModalHeader color={theme.colors.primary} textAlign="center" fontWeight={700} fontSize="lg" py={4} flexShrink={0}>
          {mode === "add" ? "ADD JOB" : mode === "edit" ? "UPDATE JOB" : "VIEW JOB"}
        </ModalHeader>

        <ModalCloseButton />

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <ModalBody pb={4} px={{ base: 4, md: 6 }} flex="1" minH={0} overflowY="auto">
            <Text fontWeight={700} mb={2}>
              Job information
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {mode === "edit" && (
                <FormControl>
                  <LabelItem label="Job code (Auto)" fontSize={LABEL_FONT_SIZE} />
                  <Input value={data?.job_code ?? "-"} isReadOnly bg="gray.50" borderColor="#d4d4d8cc" size={CONTROL_SIZE} />
                </FormControl>
              )}

              <FormControl isInvalid={!!errors.name_job}>
                <LabelItem label="Job name" required fontSize={LABEL_FONT_SIZE} />
                <Input
                  placeholder="Enter job name"
                  borderColor="#d4d4d8cc"
                  size={CONTROL_SIZE}
                  isReadOnly={isViewMode}
                  {...register("name_job", {
                    required: "Job name is required",
                    maxLength: { value: 200, message: "Max 200 characters" },
                  })}
                />
                <FormErrorMessage>{errors.name_job?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.type_job}>
                <LabelItem label="Job type" required fontSize={LABEL_FONT_SIZE} />
                <Select
                  borderColor="#d4d4d8cc"
                  size={CONTROL_SIZE}
                  isDisabled={isViewMode}
                  {...register("type_job", { required: "Job type is required" })}
                >
                  {JOB_TYPE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.type_job?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <LabelItem label="Execution result" fontSize={LABEL_FONT_SIZE} />
                <Select borderColor="#d4d4d8cc" size={CONTROL_SIZE} isDisabled={isViewMode} {...register("result_job")}>
                  {RESULT_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isInvalid={!!errors.employee_id}>
                <LabelItem label="Assignee" required fontSize={LABEL_FONT_SIZE} />
                <Controller
                  name="employee_id"
                  control={control}
                  rules={{ required: "Assignee is required" }}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value || ""}
                      onChange={field.onChange}
                      options={employeeOptions}
                      size={CONTROL_SIZE}
                      placeholder="Select assignee..."
                      isDisabled={isViewMode}
                    />
                  )}
                />
                <FormErrorMessage>{errors.employee_id?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <LabelItem label="Deadline" fontSize={LABEL_FONT_SIZE} />
                <Input
                  type="datetime-local"
                  borderColor="#d4d4d8cc"
                  size={CONTROL_SIZE}
                  isReadOnly={isViewMode}
                  {...register("deadline")}
                />
              </FormControl>
            </SimpleGrid>

            <FormControl mt={4} isInvalid={!!errors.description_job}>
              <LabelItem label="Description" fontSize={LABEL_FONT_SIZE} />
              <Textarea
                placeholder="Enter description"
                borderColor="#d4d4d8cc"
                size={CONTROL_SIZE}
                minH="120px"
                resize="vertical"
                isReadOnly={isViewMode}
                {...register("description_job", {
                  maxLength: { value: 2000, message: "Max 2000 characters" },
                })}
              />
              <FormErrorMessage>{errors.description_job?.message}</FormErrorMessage>
            </FormControl>

            <Text fontWeight={700} mt={5} mb={2}>
              Related candidates
            </Text>

            <VStack align="stretch" spacing={3}>
              {!lockCandidateSelection && !isViewMode && (
                <SearchCombobox
                  value={candidatePickerValue}
                  onChange={setCandidatePickerValue}
                  options={availableCandidateOptions}
                  isLoading={isCandidateLoading}
                  size={CONTROL_SIZE}
                  placeholder="Search and add candidates..."
                  isClearable
                />
              )}

              {selectedCandidates.length > 0 ? (
                <HStack spacing={2} flexWrap="wrap">
                  {selectedCandidates.map((candidate) => (
                    <HStack
                      key={candidate.id}
                      spacing={1}
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="full"
                      px={3}
                      py={1}
                      bg="gray.50"
                    >
                      <Text fontSize="md" maxW="260px" noOfLines={1}>
                        {candidate.name}
                      </Text>
                      {!lockCandidateSelection && !isViewMode && (
                        <IconButton
                          aria-label="Remove candidate"
                          icon={<CloseIcon boxSize={2} />}
                          size="xs"
                          variant="ghost"
                          onClick={() => handleRemoveCandidate(candidate.id || "")}
                        />
                      )}
                    </HStack>
                  ))}
                </HStack>
              ) : (
                <Box border="1px dashed" borderColor="gray.300" borderRadius="md" px={3} py={2}>
                  <Text fontSize="md" color="gray.500">
                    No related candidates selected.
                  </Text>
                </Box>
              )}
            </VStack>

            <Text fontWeight={700} mt={5} mb={2}>
              Reminder
            </Text>

            <VStack align="stretch" spacing={3}>
              <Checkbox colorScheme="blue" fontSize="md" isDisabled={isViewMode} {...register("remind_enabled")}>Remind before deadline</Checkbox>

              {remindEnabled && (
                <FormControl>
                  <Select borderColor="#d4d4d8cc" size={CONTROL_SIZE} isDisabled={isViewMode} {...register("remind_before_minutes", { valueAsNumber: true })}>
                    {REMIND_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {`Before ${item} minutes`}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter flexShrink={0} borderTop="1px solid" borderColor="#E2E8F0">
            <Button size={CONTROL_SIZE} mr={3} onClick={onClose}>
              {isViewMode ? "CLOSE" : "CANCEL"}
            </Button>
            {!isViewMode && (
              <Button bg={theme.colors.primary} color={theme.colors.white} type="submit" isLoading={isSubmitting || isSubmittingForm} size={CONTROL_SIZE}>
                {mode === "add" ? "ADD" : "UPDATE"}
              </Button>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
