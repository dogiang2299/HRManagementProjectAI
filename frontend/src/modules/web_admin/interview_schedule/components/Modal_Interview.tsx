import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import theme from "../../../../theme";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import {
  SCHEDULE_TYPE_DISPLAY,
  ScheduleType,
  type ScheduleTypeType,
} from "../../../../constant";
import { useAuthStore } from "../../../auth/store/auth.store";
import { useGetCompanies } from "../../inform_company/api/get_company";
import { useGetApplication } from "../api/get_application";
import {
  type CreateInterviewScheduleDto,
  useCreateInterviewSchedule,
} from "../api/create";
import { useUpdateInterviewSchedule } from "../api/update";
import type { IInterviewScheduleDetail } from "../types";
import EmailModal, {
  type EmailRecipient,
} from "../../candidate/components/EmailModal";
import {
  addMinutesToTime,
  formatDateToInputDate,
  formatDateToInputTime,
  getInitials,
} from "../utils";

export interface IInterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  data?: IInterviewScheduleDetail;
  fixedRecruitmentId?: string;
  onSubmit?: (payload: CreateInterviewScheduleDto) => Promise<void> | void;
  onSuccess?: () => void;
}

type InterviewScheduleFormValues = {
  interview_date: string;
  start_time: string;
  time_duration: number;
  is_simultaneous: boolean;
  interview_room: string;
  schedule_type: ScheduleTypeType | "";
  meeting_link: string;
  note: string;
  send_email_candidate: boolean;
};

const fieldProps = {
  size: "md" as const,
  bg: "white",
  borderColor: "gray.200",
  borderRadius: "10px",
  _hover: { borderColor: "gray.300" },
  _focusVisible: {
    borderColor: "blue.400",
    boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
  },
};

const labelProps = {
  mb: 1.5,
  fontWeight: 600,
  color: "gray.700",
};

const safeString = (value?: string | null) => value ?? "";

const getCompanyDisplayName = (company: {
  full_name?: string | null;
  acronym_name?: string | null;
  short_address?: string | null;
  address?: string | null;
}) => {
  const name = company.full_name || company.acronym_name || "Unnamed company";
  const address = company.short_address || company.address || "";

  if (!address || address === name) {
    return name;
  }

  return `${name} - ${address}`;
};

const normalizeTypeToken = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const toScheduleTypeValue = (rawType?: string | null): ScheduleTypeType | "" => {
  const raw = rawType?.trim();
  if (!raw) {
    return "";
  }

  const normalizedRaw = normalizeTypeToken(raw);

  const enumMatch = (Object.values(ScheduleType) as ScheduleTypeType[]).find(
    (type) => normalizeTypeToken(type) === normalizedRaw,
  );

  if (enumMatch) {
    return enumMatch;
  }

  const displayMatch = (Object.entries(SCHEDULE_TYPE_DISPLAY) as Array<
    [ScheduleTypeType, string]
  >).find(([, label]) => normalizeTypeToken(label) === normalizedRaw);

  if (displayMatch) {
    return displayMatch[0];
  }

  return "";
};

const scheduleTypeOptions = (Object.values(ScheduleType) as ScheduleTypeType[]).map(
  (value) => ({
    id: value,
    name: SCHEDULE_TYPE_DISPLAY[value],
  }),
);

const normalizeApplicationStatus = (value?: string | null) =>
  (value ?? "").trim().toLowerCase();

type InterviewEmailDraft = {
  recipients: EmailRecipient[];
  subject: string;
  body: string;
  contextLabel: string;
};

const formatInterviewDateTimeForEmail = (value?: string | Date | null) => {
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

const buildInterviewEmailBody = (params: {
  mode: "add" | "edit";
  jobTitle: string;
  interviewTime?: string | null;
  duration?: number | null;
  location?: string | null;
  room?: string | null;
  scheduleType?: string | null;
  meetingLink?: string | null;
  note?: string | null;
}) => {
  const actionText =
    params.mode === "edit" ? "cập nhật lịch phỏng vấn" : "sắp xếp lịch phỏng vấn";
  const details = [
    params.interviewTime ? `- Thời gian: ${params.interviewTime}` : "",
    params.duration ? `- Thời lượng: ${params.duration} phút` : "",
    params.location ? `- Địa điểm: ${params.location}` : "",
    params.room ? `- Phòng: ${params.room}` : "",
    params.scheduleType ? `- Hình thức: ${params.scheduleType}` : "",
    params.meetingLink ? `- Link phỏng vấn: ${params.meetingLink}` : "",
  ].filter(Boolean);

  const lines: Array<string | null> = [
    "Chào bạn,",
    "",
    `Nhà tuyển dụng đã ${actionText} cho vị trí ${params.jobTitle}.`,
    "",
    details.length ? "Thông tin lịch phỏng vấn:" : null,
    ...details,
    params.note ? "" : null,
    params.note ? `Ghi chú: ${params.note}` : null,
    "",
    "Vui lòng kiểm tra thông tin và phản hồi đúng hạn.",
    "Trân trọng.",
  ];

  return lines.filter((line): line is string => line !== null).join("\n");
};

export default function InterviewScheduleModal({
  isOpen,
  onClose,
  mode = "add",
  data,
  fixedRecruitmentId,
  onSubmit,
  onSuccess,
}: IInterviewScheduleModalProps) {
  const notify = useNotify();
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const isAdminOrEmployee = hasAnyRole([
    RECRUIT_BASE_ROLE.Admin,
    RECRUIT_BASE_ROLE.Employee,
  ]);
  const isEmployer = hasAnyRole([RECRUIT_BASE_ROLE.Employer]);
  const canChooseInterviewLocation = isAdminOrEmployee && !isEmployer;
  const { mutateAsync: createInterview } = useCreateInterviewSchedule();
  const { mutateAsync: updateInterview } = useUpdateInterviewSchedule();

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [selectedRecruitmentID, setSelectedRecruitmentID] = useState("");
  const [selectedLocationID, setSelectedLocationID] = useState("");
  const [candidatePickerValue, setCandidatePickerValue] = useState("");
  const [selectedCandidateIDs, setSelectedCandidateIDs] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState<InterviewEmailDraft | null>(null);

  const {
    data: applicationRes,
    isLoading: isApplicationLoading,
    isError,
  } = useGetApplication({
    pages: 1,
    limit: 100,
  });

  const { data: companiesRes, isLoading: isCompaniesLoading } = useGetCompanies(
    {
      page: 1,
      limit: 500,
      search: "",
    },
    {
      enabled: canChooseInterviewLocation && isOpen,
    },
  );

  const defaultValues = useMemo<InterviewScheduleFormValues>(
    () => ({
      interview_date: "",
      start_time: "",
      time_duration: 30,
      is_simultaneous: true,
      interview_room: "",
      schedule_type: "",
      meeting_link: "",
      note: "",
      send_email_candidate: true,
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InterviewScheduleFormValues>({
    mode: "onChange",
    defaultValues,
  });

  const interviewDate = watch("interview_date");
  const startTime = watch("start_time");
  const duration = watch("time_duration");
  const isSimultaneous = watch("is_simultaneous");
  const scheduleType = watch("schedule_type");

  const applications = useMemo(() => applicationRes?.data ?? [], [applicationRes?.data]);

  const recruitmentOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();

    applications.forEach((app) => {
      if (!app.recruitment_infor_id || map.has(app.recruitment_infor_id)) {
        return;
      }

      const recruitment = app.recruitment_infor;
      map.set(app.recruitment_infor_id, {
        value: app.recruitment_infor_id,
        label:
          recruitment?.post_title ||
          recruitment?.internal_title ||
          recruitment?.positionPost?.name_post ||
          "Untitled Job",
      });
    });

    return Array.from(map.values());
  }, [applications]);

  const companyLocationOptions = useMemo(() => {
    const options = (companiesRes?.data ?? []).map((company) => ({
      id: company.id,
      name: getCompanyDisplayName(company),
    }));

    if (
      selectedLocationID &&
      !options.some((option) => option.id === selectedLocationID)
    ) {
      const legacyLocation =
        mode === "edit" ? safeString(data?.interview_location).trim() : "";

      if (legacyLocation) {
        return [
          {
            id: selectedLocationID,
            name: legacyLocation,
          },
          ...options,
        ];
      }
    }

    return options;
  }, [companiesRes?.data, data?.interview_location, mode, selectedLocationID]);

  const selectedLocationOption = useMemo(
    () =>
      companyLocationOptions.find((option) => option.id === selectedLocationID),
    [companyLocationOptions, selectedLocationID],
  );

  const selectedCompanyLocationId = useMemo(() => {
    const companies = companiesRes?.data ?? [];
    return companies.some((company) => company.id === selectedLocationID)
      ? selectedLocationID
      : "";
  }, [companiesRes?.data, selectedLocationID]);

  const autoWorkLocation = useMemo(() => {
    if (!selectedRecruitmentID) {
      return "";
    }

    const selectedApp = applications.find(
      (app) => app.recruitment_infor_id === selectedRecruitmentID,
    );

    const recruitment = selectedApp?.recruitment_infor;
    return (
      recruitment?.workLocation?.full_name ||
      recruitment?.workLocation?.acronym_name ||
      recruitment?.department?.full_name ||
      recruitment?.department?.acronym_name ||
      ""
    );
  }, [applications, selectedRecruitmentID]);

  const selectedWorkLocation = canChooseInterviewLocation
    ? selectedLocationOption?.name || ""
    : autoWorkLocation;

  const candidateOptions = useMemo(() => {
    return applications
      .filter(
        (app) =>
          app.recruitment_infor_id === selectedRecruitmentID &&
          normalizeApplicationStatus(app.status) === "interviewing",
      )
      .map((app) => ({
        id: app.candidate?.id || app.candidate_id,
        name: app.candidate?.candidate_name || "Unnamed Candidate",
      }));
  }, [applications, selectedRecruitmentID]);

  const availableCandidateOptions = useMemo(() => {
    return candidateOptions.filter(
      (candidate) => !selectedCandidateIDs.includes(candidate.id),
    );
  }, [candidateOptions, selectedCandidateIDs]);

  const selectedCandidates = useMemo(() => {
    return candidateOptions.filter((candidate) =>
      selectedCandidateIDs.includes(candidate.id),
    );
  }, [candidateOptions, selectedCandidateIDs]);

  const selectedRecruitmentTitle = useMemo(() => {
    const selectedOption = recruitmentOptions.find(
      (item) => item.value === selectedRecruitmentID,
    );

    return selectedOption?.label || "vị trí ứng tuyển";
  }, [recruitmentOptions, selectedRecruitmentID]);

  const selectedEmailRecipients = useMemo<EmailRecipient[]>(() => {
    return selectedCandidateIDs.map((candidateId) => {
      const application = applications.find(
        (app) =>
          app.recruitment_infor_id === selectedRecruitmentID &&
          (app.candidate?.id || app.candidate_id) === candidateId,
      );

      return {
        candidateId,
        candidateName:
          application?.candidate?.candidate_name ||
          selectedCandidates.find((candidate) => candidate.id === candidateId)?.name ||
          null,
        candidateEmail: application?.candidate?.email || null,
      };
    });
  }, [
    applications,
    selectedCandidateIDs,
    selectedCandidates,
    selectedRecruitmentID,
  ]);

  const endTime = useMemo(() => {
    return addMinutesToTime(interviewDate, startTime, duration);
  }, [interviewDate, startTime, duration]);

  const isExternalOnlineInterview =
    scheduleType === ScheduleType.ExternalOnlineInterview;

  const closeAndResetScheduleModal = () => {
    onClose();
    reset(defaultValues);
    setSelectedRecruitmentID("");
    setSelectedLocationID("");
    setCandidatePickerValue("");
    setSelectedCandidateIDs([]);
  };

  const closeEmailModalAfterSave = () => {
    setEmailDraft(null);
    closeAndResetScheduleModal();
  };

  useEffect(() => {
    register("schedule_type", {
      required: "Schedule type is required",
    });
  }, [register]);

  const getCandidateTime = (index: number) => {
    if (isSimultaneous) {
      return {
        start: startTime,
        end: endTime,
      };
    }

    const startOffset = index * duration;
    const start = addMinutesToTime(interviewDate, startTime, startOffset);
    const end = addMinutesToTime(interviewDate, startTime, startOffset + duration);

    return {
      start,
      end,
    };
  };

  const handleRecruitmentChange = (value: string) => {
    if (fixedRecruitmentId) {
      return;
    }

    setSelectedRecruitmentID(value);

    // Auto-set location from the selected job posting's work_location_id
    if (canChooseInterviewLocation && value) {
      const selectedApp = applications.find(
        (app) => app.recruitment_infor_id === value,
      );
      const workLocationId = selectedApp?.recruitment_infor?.work_location_id;
      setSelectedLocationID(workLocationId || "");
    } else if (canChooseInterviewLocation) {
      setSelectedLocationID("");
    }

    setCandidatePickerValue("");
    setSelectedCandidateIDs([]);
  };

  const handleRemoveCandidate = (candidateId: string) => {
    setSelectedCandidateIDs((prev) => prev.filter((id) => id !== candidateId));
  };

  const onFormSubmit = async (values: InterviewScheduleFormValues) => {
    if (!selectedRecruitmentID) {
      notify({ message: "Please select a job posting", type: "warning" });
      return;
    }

    if (selectedCandidateIDs.length === 0) {
      notify({ message: "Please select at least one candidate", type: "warning" });
      return;
    }

    if (!selectedWorkLocation.trim()) {
      notify({ message: "Please select an interview location", type: "warning" });
      return;
    }

    setIsSubmittingForm(true);

    const payload: CreateInterviewScheduleDto = {
      recruitment_infor_id: selectedRecruitmentID,
      interview_date: values.interview_date || null,
      interview_location: selectedWorkLocation || null,
      company_id:
        canChooseInterviewLocation && selectedCompanyLocationId
          ? selectedCompanyLocationId
          : undefined,
      interview_room: values.interview_room.trim() || null,
      time_duration: Number(values.time_duration) || 0,
      type_schedule: values.schedule_type || null,
      times:
        values.interview_date && values.start_time
          ? `${values.interview_date}T${values.start_time}:00`
          : null,
      meeting_link: isExternalOnlineInterview
        ? values.meeting_link.trim() || null
        : null,
      note: values.note.trim() || null,
      candidate_ids: selectedCandidateIDs,
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else if (mode === "edit") {
        if (!data?.id) {
          notify({ message: "Interview schedule id is missing", type: "error" });
          return;
        }

        await updateInterview({
          id: data.id,
          data: payload,
        });
      } else {
        await createInterview(payload);
      }

      notify({
        message:
          mode === "edit"
            ? "Interview schedule updated successfully"
            : "Interview schedule created successfully",
        type: "success",
      });

      onSuccess?.();
      const scheduleLabel =
        SCHEDULE_TYPE_DISPLAY[values.schedule_type as ScheduleTypeType] ||
        values.schedule_type ||
        "";
      const interviewTime = formatInterviewDateTimeForEmail(payload.times);
      const emailSubject = `${
        mode === "edit" ? "Cập nhật lịch phỏng vấn" : "Thư mời phỏng vấn"
      } - ${selectedRecruitmentTitle}`;

      setEmailDraft({
        recipients: selectedEmailRecipients,
        subject: emailSubject,
        body: buildInterviewEmailBody({
          mode,
          jobTitle: selectedRecruitmentTitle,
          interviewTime,
          duration: payload.time_duration,
          location: payload.interview_location,
          room: payload.interview_room,
          scheduleType: scheduleLabel,
          meetingLink: payload.meeting_link,
          note: payload.note,
        }),
        contextLabel: selectedRecruitmentTitle,
      });
    } catch (error: unknown) {
      const rawMessage = (error as { response?: { data?: { message?: unknown } } })
        ?.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : typeof rawMessage === "string"
          ? rawMessage
          : "An error occurred while saving interview schedule";

      notify({ message, type: "error" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const getScheduleCompanyId = (schedule?: IInterviewScheduleDetail) => {
    const scheduleLike = schedule as
      | (IInterviewScheduleDetail & {
          InforCompany?: { id?: string | null } | null;
        })
      | undefined;

    return (
      scheduleLike?.company_id ||
      scheduleLike?.company?.id ||
      scheduleLike?.InforCompany?.id ||
      ""
    );
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "edit" && data) {
      const interviewDateFromData = data.interview_date
        ? formatDateToInputDate(new Date(data.interview_date))
        : "";
      const startTimeFromData = data.times
        ? formatDateToInputTime(new Date(data.times))
        : "";

      reset({
        interview_date: interviewDateFromData,
        start_time: startTimeFromData,
        time_duration: data.time_duration || 30,
        is_simultaneous: true,
        interview_room: safeString(data.interview_room),
        schedule_type: toScheduleTypeValue(data.type_schedule),
        meeting_link: safeString(data.meeting_link),
        note: safeString(data.note),
        send_email_candidate: true,
      });

      setCandidatePickerValue("");
      setSelectedLocationID(
        getScheduleCompanyId(data) || safeString(data.interview_location).trim(),
      );
      setSelectedCandidateIDs(data.candidates?.map((item) => item.candidate_id) ?? []);
      return;
    }

    const now = new Date();

    reset({
      ...defaultValues,
      interview_date: formatDateToInputDate(now),
      start_time: formatDateToInputTime(now),
    });

    setSelectedRecruitmentID("");
    setSelectedLocationID("");
    setCandidatePickerValue("");
    setSelectedCandidateIDs([]);
  }, [isOpen, mode, data, defaultValues, reset]);

  useEffect(() => {
    if (!isOpen || !fixedRecruitmentId || mode !== "add") {
      return;
    }

    setSelectedRecruitmentID(fixedRecruitmentId);
    if (canChooseInterviewLocation) {
      setSelectedLocationID("");
    }
    setCandidatePickerValue("");
    setSelectedCandidateIDs([]);
  }, [canChooseInterviewLocation, fixedRecruitmentId, isOpen, mode]);

  useEffect(() => {
    if (!isExternalOnlineInterview) {
      setValue("meeting_link", "");
    }
  }, [isExternalOnlineInterview, setValue]);

  useEffect(() => {
    if (!candidatePickerValue) {
      return;
    }

    setSelectedCandidateIDs((prev) => {
      if (prev.includes(candidatePickerValue)) {
        return prev;
      }

      return [...prev, candidatePickerValue];
    });

    setCandidatePickerValue("");
  }, [candidatePickerValue]);

  useEffect(() => {
    if (!isOpen || mode !== "edit" || selectedRecruitmentID) {
      return;
    }

    if (selectedCandidateIDs.length === 0 || applications.length === 0) {
      return;
    }

    const matchedApplication = applications.find((app) =>
      selectedCandidateIDs.includes(app.candidate?.id || app.candidate_id),
    );

    if (matchedApplication?.recruitment_infor_id) {
      setSelectedRecruitmentID(matchedApplication.recruitment_infor_id);
    }
  }, [
    applications,
    isOpen,
    mode,
    selectedCandidateIDs,
    selectedRecruitmentID,
  ]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
        <ModalOverlay />

        <ModalContent
          maxW="1080px"
          my={8}
          borderRadius="18px"
          maxH="85vh"
          overflow="hidden"
          display="flex"
          flexDirection="column"
          boxShadow="0 24px 80px rgba(15, 23, 42, 0.18)"
        >
        <ModalHeader
          textAlign="center"
          px={6}
          py={5}
          fontSize="23px"
          fontWeight="800"
          lineHeight="1.1"
          flexShrink={0}
        >
          {mode === "edit" ? "UPDATE INTERVIEW SCHEDULE" : "SCHEDULE INTERVIEW"}
        </ModalHeader>
        <ModalCloseButton top={5} right={5} />

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          noValidate
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <ModalBody p={0} flex="1" minH={0} overflowY="auto">
            <Grid templateColumns={{ base: "1fr", lg: "1.15fr 0.85fr" }}>
              <GridItem px={6} py={2} bg="white">
                <VStack spacing={3} align="stretch">
                  <FormControl isRequired>
                    <FormLabel sx={labelProps}>Job Posting</FormLabel>
                    <SearchCombobox
                      value={selectedRecruitmentID}
                      onChange={handleRecruitmentChange}
                      isLoading={isApplicationLoading}
                      size="md"
                      isDisabled={!!fixedRecruitmentId && mode === "add"}
                      options={recruitmentOptions.map((item) => ({
                        id: item.value,
                        name: item.label,
                      }))}
                      placeholder={
                        fixedRecruitmentId && mode === "add"
                          ? "Job posting is preselected from recruitment detail"
                          : "Select job posting..."
                      }
                    />
                    {isError && (
                      <Text mt={1} fontSize="m" color="red.500">
                        Failed to load job postings from applications.
                      </Text>
                    )}
                  </FormControl>

                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }}
                    gap={3.5}
                  >
                    <FormControl isRequired isInvalid={!!errors.interview_date}>
                      <FormLabel sx={labelProps}>Date</FormLabel>
                      <Input
                        type="date"
                        {...register("interview_date", {
                          required: "Date is required",
                        })}
                        {...fieldProps}
                      />
                      <FormErrorMessage>{errors.interview_date?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.start_time}>
                      <FormLabel sx={labelProps}>Start Time</FormLabel>
                      <Input
                        type="time"
                        {...register("start_time", {
                          required: "Start time is required",
                        })}
                        {...fieldProps}
                      />
                      <FormErrorMessage>{errors.start_time?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.time_duration}>
                      <FormLabel sx={labelProps}>Duration (minutes)</FormLabel>
                      <Input
                        type="number"
                        min={15}
                        step={15}
                        {...register("time_duration", {
                          required: "Duration is required",
                          valueAsNumber: true,
                          min: {
                            value: 15,
                            message: "Duration must be at least 15 minutes",
                          },
                        })}
                        {...fieldProps}
                      />
                      <FormErrorMessage>{errors.time_duration?.message}</FormErrorMessage>
                    </FormControl>
                  </Grid>

                  <Checkbox colorScheme="blue" size="md" {...register("is_simultaneous")}>
                    <Text fontWeight="500" color="gray.700">
                      Candidates join simultaneously
                    </Text>
                  </Checkbox>

                  <Grid
                    templateColumns={{ base: "1fr", md: "1.35fr 0.85fr" }}
                    gap={3.5}
                  >
                    <FormControl isRequired>
                      <FormLabel sx={labelProps}>Location</FormLabel>
                      {canChooseInterviewLocation ? (
                        <SearchCombobox
                          value={selectedLocationID}
                          onChange={setSelectedLocationID}
                          isLoading={isCompaniesLoading}
                          isDisabled={!selectedRecruitmentID}
                          options={companyLocationOptions}
                          placeholder={!selectedRecruitmentID ? "Select job posting first" : "Search and select interview location..."}
                          size="md"
                          inputHeight="40px"
                          fontSize="sm"
                        />
                      ) : (
                        <Input
                          value={selectedWorkLocation}
                          placeholder={
                            selectedRecruitmentID
                              ? "No work location found"
                              : "Select job posting first"
                          }
                          isReadOnly
                          {...fieldProps}
                        />
                      )}
                    </FormControl>

                    <FormControl>
                      <FormLabel sx={labelProps}>Room</FormLabel>
                      <Input
                        placeholder="Enter room name"
                        {...register("interview_room")}
                        {...fieldProps}
                      />
                    </FormControl>
                  </Grid>

                  <FormControl isRequired isInvalid={!!errors.schedule_type}>
                    <FormLabel sx={labelProps}>Schedule Type</FormLabel>
                    <SearchCombobox
                      value={scheduleType}
                      onChange={(value) => {
                        setValue("schedule_type", toScheduleTypeValue(value), {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }}
                      options={scheduleTypeOptions}
                      placeholder="Select schedule type"
                      size="md"
                      inputHeight="40px"
                      fontSize="sm"
                    />
                    <FormErrorMessage>{errors.schedule_type?.message}</FormErrorMessage>
                  </FormControl>

                  {isExternalOnlineInterview && (
                    <FormControl isRequired isInvalid={!!errors.meeting_link}>
                      <FormLabel sx={labelProps}>Meeting Link (URL)</FormLabel>
                      <Input
                        type="url"
                        placeholder="https://meet.google.com/..."
                        {...register("meeting_link", {
                          validate: (value) => {
                            if (!isExternalOnlineInterview) {
                              return true;
                            }

                            if (!value.trim()) {
                              return "Meeting link is required";
                            }

                            try {
                              new URL(value);
                              return true;
                            } catch {
                              return "Meeting link must be a valid URL";
                            }
                          },
                        })}
                        {...fieldProps}
                      />
                      <FormErrorMessage>{errors.meeting_link?.message}</FormErrorMessage>
                    </FormControl>
                  )}

                  <FormControl>
                    <FormLabel sx={labelProps}>Notes for Candidate</FormLabel>
                    <Textarea
                      placeholder="Example: Candidate should bring a personal laptop or arrive 10 minutes early"
                      maxH="92px"
                      resize="vertical"
                      {...register("note")}
                      {...fieldProps}
                    />
                  </FormControl>

                </VStack>
              </GridItem>

              <GridItem borderLeft="1px solid" borderColor="gray.200" px={6}>
                <VStack align="stretch" spacing={3} h="full">
                  <Text
                    fontSize="md"
                    fontWeight="800"
                    letterSpacing="0.02em"
                    color="gray.800"
                  >
                    Candidate
                  </Text>

                  {!selectedRecruitmentID ? (
                    <Text color="gray.500" lineHeight="1.7">
                      Please select a job posting first.
                    </Text>
                  ) : (
                    <>
                      <FormControl>
                        <FormLabel sx={labelProps}>Select Candidate</FormLabel>
                        <SearchCombobox
                          value={candidatePickerValue}
                          onChange={setCandidatePickerValue}
                          isLoading={isApplicationLoading}
                          options={availableCandidateOptions.map((candidate) => ({
                            id: candidate.id,
                            name: candidate.name,
                          }))}
                          placeholder="Search and select candidate..."
                          isClearable
                          size="md"
                        />
                      </FormControl>

                      {selectedCandidates.length === 0 ? (
                        <Box
                          borderWidth="1px"
                          borderStyle="dashed"
                          borderColor="gray.300"
                          borderRadius="md"
                          px={4}
                          py={5}
                          bg="gray.50"
                        >
                          <Text color="gray.500">No candidate selected yet.</Text>
                        </Box>
                      ) : (
                        <Box
                          bg="gray.50"
                          borderWidth="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          overflow="hidden"
                        >
                          <Grid templateColumns="1.4fr 0.9fr 40px">
                            <Box
                              px={5}
                              py={4}
                              borderBottom="1px solid"
                              borderColor="gray.200"
                            >
                              <Text fontWeight="800" fontSize="15px">
                                Full name
                              </Text>
                            </Box>

                            <Box
                              px={5}
                              py={4}
                              borderBottom="1px solid"
                              borderColor="gray.200"
                            >
                              <Text fontWeight="800" fontSize="15px">
                                Time
                              </Text>
                            </Box>

                            <Box
                              borderBottom="1px solid"
                              borderColor="gray.200"
                            />

                            {selectedCandidates.map((candidate, index) => (
                              <Fragment key={candidate.id}>
                                <Box px={5} py={4} bg="white">
                                  <HStack spacing={4}>
                                    <Box
                                      w="40px"
                                      h="40px"
                                      rounded="full"
                                      bg={theme.colors.primary}
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      fontWeight="800"
                                      fontSize="16px"
                                      color="white"
                                    >
                                      {getInitials(candidate.name)}
                                    </Box>

                                    <Text fontWeight="700" fontSize="15px">
                                      {candidate.name}
                                    </Text>
                                  </HStack>
                                </Box>

                                <Box
                                  px={5}
                                  py={4}
                                  bg="white"
                                  display="flex"
                                  alignItems="center"
                                >
                                  <Text fontWeight="500" fontSize="15px">
                                    {(() => {
                                      const time = getCandidateTime(index);
                                      return time.start && time.end
                                        ? `${time.start} - ${time.end}`
                                        : "--:--";
                                    })()}
                                  </Text>
                                </Box>

                                <Box
                                  px={3}
                                  py={4}
                                  bg="white"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <IconButton
                                    aria-label="Remove candidate"
                                    icon={<CloseIcon boxSize={2.5} />}
                                    size="sm"
                                    variant="ghost"
                                    color="gray.500"
                                    onClick={() => handleRemoveCandidate(candidate.id)}
                                    _hover={{ bg: "red.50", color: "red.500" }}
                                  />
                                </Box>
                              </Fragment>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </>
                  )}
                </VStack>
              </GridItem>
            </Grid>
          </ModalBody>

          <ModalFooter
            bg="#FCFCFD"
            borderTop="1px solid"
            borderColor="gray.200"
            px={6}
            py={4}
            flexShrink={0}
          >
            <HStack w="full" justify="flex-end" spacing={3}>
              <Button
                variant="ghost"
                onClick={onClose}
                fontWeight="600"
                minW="88px"
              >
                CANCEL
              </Button>
              <Button
                bg={theme.colors.primary}
                color="white"
                type="submit"
                isLoading={isSubmitting || isSubmittingForm}
                px={6}
                minW="112px"
                borderRadius="10px"
                fontWeight="700"
              >
                {mode === "edit" ? "UPDATE" : "SAVE"}
              </Button>
            </HStack>
          </ModalFooter>
        </form>
        </ModalContent>
      </Modal>

      <EmailModal
        isOpen={Boolean(emailDraft)}
        onClose={closeEmailModalAfterSave}
        recipients={emailDraft?.recipients ?? []}
        recruitmentInforId={selectedRecruitmentID}
        contextLabel={emailDraft?.contextLabel}
        defaultSubject={emailDraft?.subject}
        defaultBody={emailDraft?.body}
      />
    </>
  );
}
