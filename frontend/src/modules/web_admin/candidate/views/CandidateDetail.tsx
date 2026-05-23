import { useCallback, useMemo, useRef, useState, useEffect, type ChangeEvent } from "react";
import {
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  Input,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { useDebounce } from "use-debounce";
import type { ICandidate, ICandidateExperience } from "../types";
import { useCandidateByID } from "../api/get";
import { useupdateCandidate } from "../api/update";
import { useUploadCandidateAvatar } from "../api/upload_avatar";
import { useCreateApplication } from "../api/create_application";
import { usePotentialTypes } from "../api/potential_type";

import InfoRow from "../components/InforRow";
import CandidateAuditLog from "../components/CandidateAuditLog";
import JobCandidate from "../components/JobCandidate";
import ReviewCandidate from "../components/ReviewCandidate";
import Stars from "../components/Star";
import CandidateCvTab, {
  type CandidateCvTabHandle,
} from "../components/CandidateCVTabs";
import UpdateStatus from "../components/UpdateStatus";
import EmailModal from "../components/EmailModal";
import { useEmailLogs } from "../api/email_logs";
import { FiUploadCloud } from "react-icons/fi";
import { BsThreeDotsVertical } from "react-icons/bs";
import theme from "../../../../theme";
import { useGetInform } from "../../recruit_inf/api/get";
import type { IRecruitmentInfor } from "../../recruit_inf/types";
import { useUpdateApplicationStatus } from "../api/update_status";
import { getApplicationStatusIndex, getApplicationStatusLabel } from "../utils";
import JobModal from "../../job/components/JobModal";
import type { IJob } from "../../job/types";
import { useDeleteJob } from "../../job/api/delete";
import { ModalConfirm } from "../../../../components/common/ModalConfirm";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { APPLICATION_STATUS_STEPS } from "../../../../constant";
import { BASE_URL } from "../../../../constant/config";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import { candidateUrl } from "../../../../routes/urls";
import { formatDateShort, formatMonth } from "../../../../types";
import { useAuthStore } from "../../../auth/store/auth.store";
import formatBadgeLabel from "../../../../utils/formatText";
import { useGetCandidateApplications } from '../api/get_applications';
import type { IApplycation } from '../types';
export default function CandidateDetail() {
  const notify = useNotify();
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);
  const canManageCandidate = hasAnyRole([RECRUIT_BASE_ROLE.Admin, RECRUIT_BASE_ROLE.Employee]);
  const canManageApplicationStatus = hasAnyRole([
    RECRUIT_BASE_ROLE.Admin,
    RECRUIT_BASE_ROLE.Employee,
    RECRUIT_BASE_ROLE.Employer,
  ]);
  const canNotifyCandidate = hasAnyRole([
    RECRUIT_BASE_ROLE.Admin,
    RECRUIT_BASE_ROLE.Employee,
    RECRUIT_BASE_ROLE.Employer,
  ]);
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const candidateId = paramId ?? "";
  const cvTabRef = useRef<CandidateCvTabHandle | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const pickFile = () => {
    if (!canManageCandidate) return;
    cvTabRef.current?.pickFile();
  };
  const {
    data: candidate,
    isLoading,
    isError,
    refetch,
  } = useCandidateByID(candidateId, { enabled: !!candidateId });

  const updateStatusMutation = useUpdateApplicationStatus({
    onSuccess: () => {
      refetch();
    },
  });

  const updateCandidateMutation = useupdateCandidate({
    config: {
      onSuccess: () => {
        refetch();
        notify({
          type: "success",
          message: "Updated successfully",
          description: "Candidate has been moved to talent pool.",
        });
      },
      onError: (error: Error) => {
        notify({
          type: "error",
          message: "Move failed",
          description: error?.message || "Unable to move candidate to talent pool.",
        });
      },
    },
  });

  const {
    data: potentialTypeRes,
    isLoading: isPotentialTypeLoading,
  } = usePotentialTypes();

  const uploadAvatarMutation = useUploadCandidateAvatar({
    onSuccess: () => {
      refetch();
      notify({
        type: "success",
        message: "Avatar updated",
        description: "Candidate avatar has been uploaded successfully.",
      });
    },
    onError: (error) => {
      notify({
        type: "error",
        message: "Upload failed",
        description: error.message || "Unable to upload avatar.",
      });
    },
  });

  const onClose = useCallback(() => {
    navigate(candidateUrl, { replace: true });
  }, [navigate]);

  const appliedDate = useMemo(
    () => formatDateShort((candidate as ICandidate | undefined)?.date_applied),
    [candidate],
  );
  const dob = useMemo(
    () => formatDateShort((candidate as ICandidate | undefined)?.date_of_birth),
    [candidate],
  );

  const latestApplication = useMemo(
    () => (candidate as ICandidate | undefined)?.statusApplication?.[0],
    [candidate],
  );

  // applications state from dedicated API
  const [candidateApplicationsResponse, setCandidateApplicationsResponse] = useState<null | any>(null);
  const [applications, setApplications] = useState<IApplycation[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<IApplycation | null>(null);

  const applicationsQuery = useGetCandidateApplications(candidateId);

  useEffect(() => {
    const res = applicationsQuery.data;
    if (res) {
      setCandidateApplicationsResponse(res);
      const list = Array.isArray(res.applications) ? res.applications : [];
      setApplications(list);
    }

    if (applicationsQuery.error) {
      console.error('Failed to load candidate applications', applicationsQuery.error);
      setCandidateApplicationsResponse(null);
      setApplications([]);
    }
  }, [applicationsQuery.data, applicationsQuery.error]);

  // choose default selected application when applications load or candidate changes
  useEffect(() => {
    const list = applications;
    if (!list || list.length === 0) {
      setSelectedApplicationId(null);
      setSelectedApplication(null);
      return;
    }

    // preference: keep existing selectedApplicationId if present and exists in list
    if (selectedApplicationId) {
      const found = list.find((a) => a.id === selectedApplicationId);
      if (found) {
        setSelectedApplication(found);
        return;
      }
    }

    // next preference: existing application context from candidate (legacy)
    const legacyId = latestApplication?.id;
    if (legacyId) {
      const found = list.find((a) => a.id === legacyId);
      if (found) {
        setSelectedApplicationId(found.id);
        setSelectedApplication(found);
        return;
      }
    }

    // fallback: first application
    setSelectedApplicationId(list[0].id);
    setSelectedApplication(list[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications, candidateId, latestApplication]);

  const MAX_BADGES = 6;

  const appCount = applications?.length ?? 0;
  const companyCount =
    candidateApplicationsResponse?.company_count ?? candidateApplicationsResponse?.companyCount ?? 0;
  const isAdminOrEmployee = hasAnyRole([RECRUIT_BASE_ROLE.Admin, RECRUIT_BASE_ROLE.Employee]);
  const isEmployerRole = hasAnyRole([RECRUIT_BASE_ROLE.Employer]);
  const applicationsSubtitle = isAdminOrEmployee
    ? `${appCount} applications · ${companyCount} companies`
    : isEmployerRole
    ? `${appCount} applications in your company`
    : `${appCount} applications`;

  const renderApplicationCard = (app: IApplycation | null) => {
    if (!app) return null;
    const ri = app.recruitment_infor || ({} as any);
    const title = ri.post_title || ri.internal_title || 'Untitled job';
    const companyName = ri.company?.name || ri.department?.full_name || '';
    const location = ri.workLocation?.full_name || null;
    const rank = ri.rank ? ri.rank.name_rank : null;
    const jobType = ri.job_type || null;
    const status = app.status || '';

    const statusStyle = (() => {
      const key = (status || '').toLowerCase();
      if (key.includes('applied')) return { bg: '#EEF4FF', color: '#3538CD' };
      if (key.includes('contact')) return { bg: '#F4F3FF', color: '#5925DC' };
      if (key.includes('interview')) return { bg: '#FFF7ED', color: '#C2410C' };
      if (key.includes('waiting')) return { bg: '#FFFAEB', color: '#B54708' };
      if (key.includes('accept')) return { bg: '#ECFDF3', color: '#027A48' };
      if (key.includes('reject')) return { bg: '#FEF3F2', color: '#B42318' };
      return { bg: 'gray.100', color: 'gray.700' };
    })();

    return (
      <VStack align="stretch" spacing={2}>
        <Box>
          <Text fontWeight="600" color="#334371">{title}</Text>
          {companyName && <Text fontSize="sm" color="gray.600">{companyName}</Text>}
        </Box>
        <HStack spacing={3}>
          {location && <Text fontSize="xs" color="gray.500">{location}</Text>}
          {jobType && <Text fontSize="xs" color="gray.500">{jobType}</Text>}
          {rank && <Text fontSize="xs" color="gray.500">{rank}</Text>}
        </HStack>
        <HStack justify="space-between" align="center">
          <Box>
            <Box px={2} py={1} borderRadius="md" bg={statusStyle.bg} color={statusStyle.color} display="inline-block" fontWeight={600} fontSize="sm">{status}</Box>
            <Box mt={1}>
              <Text fontSize="xs" color="gray.500">Applied at {app.applied_at ? formatDateShort(app.applied_at) : 'Applied date updating'}</Text>
              {app.reapply_count ? <Text fontSize="xs" color="gray.500">Reapplied {app.reapply_count} times</Text> : null}
            </Box>
          </Box>
          {/* <Box>
            <Button size="sm" onClick={openStatusModal} isDisabled={!canManageApplicationStatus}>Update status</Button>
          </Box> */}
        </HStack>
        <Box>
          <Text fontSize="sm" fontWeight="600">Cover letter</Text>
          {app.cover_letter ? (
            <Text fontSize="sm" color="gray.700" noOfLines={isCoverExpanded ? undefined : 3} mt={1}>{app.cover_letter}</Text>
          ) : (
            <Text fontSize="sm" color="gray.500" mt={1}>The candidate has not entered a cover letter.</Text>
          )}
          {app.cover_letter && <Button size="xs" variant="link" mt={1} onClick={() => setIsCoverExpanded((s) => !s)}>{isCoverExpanded ? 'Collapse' : 'View more'}</Button>}
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="600">Note</Text>
          <Text fontSize="sm" color="gray.600" mt={1}>{app.note ?? 'No notes yet.'}</Text>
        </Box>
      </VStack>
    );
  };

  const applicationTitle = useMemo(() => {
    return (
      selectedApplication?.recruitment_infor?.post_title ||
      selectedApplication?.recruitment_infor?.internal_title ||
      "No job posting yet"
    );
  }, [selectedApplication]);

  const applicationStatus = selectedApplication?.status
    ? getApplicationStatusLabel(selectedApplication.status)
    : "No status yet";

  const hasSelectedApplication = Boolean(selectedApplication);
  const applicationCv = selectedApplication?.candidate_cv ?? null;
  const hasApplicationCv = Boolean(applicationCv?.file_url || applicationCv?.file_name);
  const applicationPreviewLabel = hasApplicationCv
    ? "CV used for this application"
    : "Current / primary CV";
  const applicationPreviewFileName = hasSelectedApplication
    ? hasApplicationCv
      ? applicationCv?.file_name || null
      : candidate?.cv_file || null
    : candidate?.cv_file || null;
  const applicationPreviewUrl = hasSelectedApplication
    ? hasApplicationCv
      ? applicationCv?.file_url || null
      : (candidate?.cv_file ? `/uploads/cv/${candidate.cv_file}` : null)
    : null;
  const activeCvStructuredData = hasSelectedApplication ? applicationCv?.structured_data ?? null : null;
  const activeCvRawText = hasSelectedApplication ? applicationCv?.raw_text ?? null : null;
  const activeCvSummary = hasSelectedApplication ? applicationCv?.summary ?? null : null;
  const activeCvDesiredPosition = hasSelectedApplication ? applicationCv?.desired_position ?? null : null;
  const activeCvYearsExperience = hasSelectedApplication ? applicationCv?.years_experience ?? null : null;

  const parseStructuredTextList = useCallback((value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const typedItem = item as Record<string, unknown>;
          return (
            (typeof typedItem.name === "string" && typedItem.name.trim()) ||
            (typeof typedItem.skill_name === "string" && typedItem.skill_name.trim()) ||
            (typeof typedItem.title === "string" && typedItem.title.trim()) ||
            (typeof typedItem.position === "string" && typedItem.position.trim()) ||
            (typeof typedItem.value === "string" && typedItem.value.trim()) ||
            ""
          );
        }
        return "";
      })
      .filter(Boolean);
  }, []);

  const activeCandidateExperiences = useMemo(() => {
    if (hasSelectedApplication) {
      if (!applicationCv) return [];

      const structuredSources = [
        (activeCvStructuredData as Record<string, unknown> | null)?.work_experience,
        (activeCvStructuredData as Record<string, unknown> | null)?.workExperience,
        (activeCvStructuredData as Record<string, unknown> | null)?.experience,
        (activeCvStructuredData as Record<string, unknown> | null)?.experiences,
        (activeCvStructuredData as Record<string, unknown> | null)?.employment_history,
      ];

      for (const source of structuredSources) {
        if (!Array.isArray(source) || source.length === 0) continue;

        const parsed = source
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const typedItem = item as Record<string, unknown>;
            const companyName =
              (typeof typedItem.company_name === "string" && typedItem.company_name.trim()) ||
              (typeof typedItem.company === "string" && typedItem.company.trim()) ||
              (typeof typedItem.organization === "string" && typedItem.organization.trim()) ||
              (typeof typedItem.employer === "string" && typedItem.employer.trim()) ||
              "";
            const position =
              (typeof typedItem.position === "string" && typedItem.position.trim()) ||
              (typeof typedItem.title === "string" && typedItem.title.trim()) ||
              (typeof typedItem.role === "string" && typedItem.role.trim()) ||
              "";
            const fromMonth =
              (typeof typedItem.from_month === "string" && typedItem.from_month.trim()) ||
              (typeof typedItem.start_date === "string" && typedItem.start_date.trim()) ||
              (typeof typedItem.from === "string" && typedItem.from.trim()) ||
              "";
            const toMonth =
              (typeof typedItem.to_month === "string" && typedItem.to_month.trim()) ||
              (typeof typedItem.end_date === "string" && typedItem.end_date.trim()) ||
              (typeof typedItem.to === "string" && typedItem.to.trim()) ||
              "";
            const jobDescription =
              (typeof typedItem.job_description === "string" && typedItem.job_description.trim()) ||
              (typeof typedItem.description === "string" && typedItem.description.trim()) ||
              (typeof typedItem.summary === "string" && typedItem.summary.trim()) ||
              "";

            if (!companyName && !position && !fromMonth && !toMonth && !jobDescription) {
              return null;
            }

            return {
              id: `${companyName || position || "experience"}-${fromMonth || toMonth || Math.random()}`,
              company_name: companyName,
              position,
              from_month: fromMonth,
              to_month: toMonth,
              job_description: jobDescription,
              is_active: true,
            };
          })
          .filter(Boolean) as ICandidateExperience[];

        if (parsed.length > 0) {
          return parsed;
        }
      }

      return [];
    }

    return (candidate?.candidateExperiences ?? []).filter((exp) => exp.is_active !== false);
  }, [activeCvStructuredData, applicationCv?.id, hasSelectedApplication, candidate?.candidateExperiences]);

  const activeCandidateSkills = useMemo(() => {
    if (hasSelectedApplication) {
      if (!applicationCv) return [];

      const structured = activeCvStructuredData as Record<string, unknown> | null;
      const structuredSkillSources = [
        structured?.skills,
        structured?.skill_names,
        structured?.matched_skills,
        structured?.skill_tags,
        structured?.keywords,
      ];

      for (const source of structuredSkillSources) {
        const parsed = parseStructuredTextList(source);
        if (parsed.length > 0) return parsed;
      }

      return [];
    }

    const structured = activeCvStructuredData as Record<string, unknown> | null;
    const structuredSkillSources = [
      structured?.skills,
      structured?.skill_names,
      structured?.matched_skills,
      structured?.skill_tags,
      structured?.keywords,
    ];

    for (const source of structuredSkillSources) {
      const parsed = parseStructuredTextList(source);
      if (parsed.length > 0) return parsed;
    }

    return candidate?.candidate_skills?.map((skill) => skill.skill_name).filter(Boolean) ?? [];
  }, [activeCvStructuredData, applicationCv?.id, hasSelectedApplication, candidate?.candidate_skills, parseStructuredTextList]);

  const activeCvMetadataSummary = useMemo(() => {
    if (hasSelectedApplication && !applicationCv) {
      return [];
    }

    const parts: string[] = [];

    if (activeCvDesiredPosition) parts.push(activeCvDesiredPosition);
    if (activeCvYearsExperience !== null && activeCvYearsExperience !== undefined) {
      parts.push(`${activeCvYearsExperience} years experience`);
    }
    if (activeCvSummary) parts.push(activeCvSummary);

    return parts;
  }, [activeCvDesiredPosition, activeCvYearsExperience, activeCvSummary, applicationCv?.id, hasSelectedApplication]);

  const [isCoverExpanded, setIsCoverExpanded] = useState(false);

  const avatarUrl = useMemo(() => {
    if (!candidate?.avatar_file) return undefined;
    return `${BASE_URL}/uploads/avatar/${candidate.avatar_file}`;
  }, [candidate?.avatar_file]);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isTalentPoolModalOpen, setIsTalentPoolModalOpen] = useState(false);
  const [selectedPotentialTypeId, setSelectedPotentialTypeId] = useState<string>("");
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobModalMode, setJobModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedJob, setSelectedJob] = useState<IJob | undefined>(undefined);
  const [isDeleteJobOpen, setIsDeleteJobOpen] = useState(false);
  const [deleteJobTarget, setDeleteJobTarget] = useState<IJob | undefined>(undefined);
  const { mutateAsync: deleteJob, isPending: isDeletingJob } = useDeleteJob();
  

  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [selectedRecruitmentId, setSelectedRecruitmentId] = useState("");
  const [assigningNote, setAssigningNote] = useState("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [debouncedJobSearch] = useDebounce(jobSearch, 300);

  const {
    data: emailLogsRes,
    isLoading: isLoadingEmailLogs,
    refetch: refetchEmailLogs,
  } = useEmailLogs(candidateId, {
    page: 1,
    limit: 20,
    applicationId: selectedApplication?.id,
    recruitmentInforId: selectedApplication?.recruitment_infor_id,
  });

  const formatEmailLogDate = (dateString: string) => {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const { data: recruitmentRes, isLoading: isLoadingRecruitments } = useGetInform({
    pages: 1,
    limit: 100,
    search: debouncedJobSearch,
  });

  const createApplicationMutation = useCreateApplication({
    config: {
      onSuccess: () => {
        notify({
          type: "success",
          message: "Candidate moved",
          description: "Candidate has been assigned to the selected job posting.",
        });
        setShowAssignPanel(false);
        setSelectedRecruitmentId("");
        setAssigningNote("");
        refetch();
      },
      onError: (error) => {
        const err = error as {
          response?: { data?: { message?: string | string[] } };
          message?: string;
        };

        const raw = err?.response?.data?.message ?? err?.message ?? "Failed to assign candidate.";
        const message = Array.isArray(raw) ? raw.join(", ") : raw;

        notify({
          type: "error",
          message: "Assign failed",
          description: message,
        });
      },
    },
  });

  const recruitmentOptions = useMemo(() => {
    const list = recruitmentRes?.data ?? [];
    return list.filter((item) => item.is_active !== false);
  }, [recruitmentRes]);

  const recruitmentComboOptions = recruitmentOptions.map((item: IRecruitmentInfor) => {
    return {
      id: item.id,
      name: item.post_title || item.internal_title || "Untitled posting",
    };
  });

  const hasApplication = Boolean(selectedApplication?.id);

  const currentStageIndex = useMemo(
    () => getApplicationStatusIndex(selectedApplication?.status),
    [selectedApplication],
  );

  const openStatusModal = () => {
    if (!selectedApplication?.id) return;
    setIsStatusModalOpen(true);
  };

const handleSubmitStatus = async (newStatus: string) => {
  if (!selectedApplication?.id) return;

  updateStatusMutation.mutate(
    {
      id: selectedApplication.id,
      data: {
        status: newStatus,
      },
    },
    {
      onSuccess: () => {
        setIsStatusModalOpen(false);
      },
    },
  );
};


  const potentialTypeOptions = useMemo(
    () => potentialTypeRes?.data ?? [],
    [potentialTypeRes],
  );

  const lockedJobCandidates = useMemo(
    () => [
      {
        id: candidateId,
        name: candidate?.candidate_name ?? candidate?.email ?? candidate?.phone_number ?? "Candidate",
      },
    ],
    [candidateId, candidate?.candidate_name, candidate?.email, candidate?.phone_number],
  );

  const openTalentPoolModal = () => {
    setSelectedPotentialTypeId((candidate as ICandidate | undefined)?.potential_type_id ?? "");
    setIsTalentPoolModalOpen(true);
  };

  const handleMoveToTalentPool = () => {
    if (!selectedPotentialTypeId) {
      notify({
        type: "warning",
        message: "Potential type is required",
        description: "Please select a potential type before moving this candidate.",
      });
      return;
    }

    updateCandidateMutation.mutate(
      {
        id: candidateId,
        data: {
          is_potential: true,
          potential_type_id: selectedPotentialTypeId,
        },
      },
      {
        onSuccess: () => {
          setIsTalentPoolModalOpen(false);
        },
      },
    );
  };

  const handleAssignCandidate = () => {
    if (!candidateId || !selectedRecruitmentId) {
      notify({
        type: "warning",
        message: "Job posting is required",
        description: "Please select a job posting before assigning this candidate.",
      });
      return;
    }

    createApplicationMutation.mutate({
      candidate_id: candidateId,
      recruitment_infor_id: selectedRecruitmentId,
      note: assigningNote.trim() || undefined,
    });
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExt = ["jpg", "jpeg", "png", "webp"];
    const maxSizeMb = 5;

    if (!ext || !allowedExt.includes(ext)) {
      notify({
        type: "warning",
        message: "Invalid file",
        description: "Only .jpg, .jpeg, .png, .webp files are allowed.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      notify({
        type: "warning",
        message: "File too large",
        description: `Maximum file size is ${maxSizeMb}MB.`,
      });
      event.target.value = "";
      return;
    }

    uploadAvatarMutation.mutate({
      candidateId,
      file,
      currentAvatarFile: candidate?.avatar_file ?? null,
    });

    event.target.value = "";
  };

  const openAddJobModal = () => {
    setSelectedJob(undefined);
    setJobModalMode("add");
    setIsJobModalOpen(true);
  };

  const openViewJobModal = (job: IJob) => {
    setSelectedJob(job);
    setJobModalMode("view");
    setIsJobModalOpen(true);
  };

  const syncSelectedApplicationByRecruitmentId = (recruitmentInforId?: string | null) => {
    if (!recruitmentInforId) return;

    const matchedApplication = applications.find((item) => item.recruitment_infor?.id === recruitmentInforId);
    if (!matchedApplication) return;

    setSelectedApplicationId(matchedApplication.id);
    setSelectedApplication(matchedApplication);
  };

  const openEditJobModal = (job: IJob) => {
    setSelectedJob(job);
    setJobModalMode("edit");
    setIsJobModalOpen(true);
  };

  const openDeleteJobModal = (job: IJob) => {
    setDeleteJobTarget(job);
    setIsDeleteJobOpen(true);
  };

  const handleDeleteJob = async () => {
    if (!deleteJobTarget?.id) return;

    try {
      await deleteJob(deleteJobTarget.id);
      notify({
        type: "success",
        message: "Deleted successfully",
        description: `Job "${deleteJobTarget.name_job || "Untitled job"}" has been removed.`,
      });
      setIsDeleteJobOpen(false);
      setDeleteJobTarget(undefined);
      refetch();
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

  // main tabs
  const [mainTab, setMainTab] = useState(0);
  const [profileSubTab, setProfileSubTab] = useState(0);

  if (!candidateId) {
    return (
      <Center p={10}>
        <Text color="red.500">Candidate ID not found.</Text>
      </Center>
    );
  }
  return (
    <Modal isOpen={true} onClose={onClose} isCentered size="6xl">
      <ModalOverlay />
      <ModalContent maxW="1250px" h="90vh" overflow="hidden">
        <ModalCloseButton zIndex={2} onClick={onClose} />

        <ModalBody p={0} h="100%">
          {isLoading ? (
            <Center h="100%">
              <Spinner size="xl" />
            </Center>
          ) : isError || !candidate ? (
            <Center h="100%" flexDir="column" gap={3} p={6}>
              <Text color="red.500" fontWeight="600">
                Failed to load candidate info.
              </Text>
              <HStack>
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
                <Button onClick={onClose} background="#334371" color="white">
                  Back
                </Button>
                </HStack>
              </Center>
            ) : (
 
            <Flex h="100%">
              {/* LEFT PANE */}
              <Box
                w="420px"
                borderRight="1px solid"
                borderColor="gray.200"
                p={4}
                overflowY="auto"
              >
                <HStack spacing={3} align="flex-start">
                  {canManageCandidate && (
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      style={{ display: "none" }}
                      onChange={handleAvatarChange}
                    />
                  )}

                 <Avatar
                      bg="#334371"
                      color="white"
                      name={candidate.candidate_name ?? ""}
                      src={avatarUrl}
                    />

                  <Box minW={0} flex="1">
                    <HStack spacing={2}>
                      <Text fontWeight="700" noOfLines={1}>
                        {candidate.candidate_name ?? "N/A"}
                      </Text>
                    </HStack>

                    <Text fontSize="sm" color="gray.600">
                      Applied date {appliedDate || "-"}
                    </Text>

                    <Box mt={2}>
                      <Stars value={0} />
                    </Box>
                  </Box>

              
                </HStack>

                <Divider my={3} />

                {/* APPLICATION INFORMATION */}
{/* APPLICATION INFORMATION */}
<Text fontWeight="700" mb={2}>
  APPLICATION INFORMATION
</Text>

<Box
  border="1px solid"
  borderColor="gray.200"
  borderRadius="md"
  p={3}
  w="100%"
>
  <VStack align="stretch" spacing={3} w="100%">
    <HStack justify="space-between" align="flex-start" w="100%">
      <Text fontSize="sm" color="gray.600" flex="1">
        {applicationsSubtitle}
      </Text>

      {hasApplication && canManageApplicationStatus && (
        <Flex alignItems="center" gap={1} flexShrink={0}>
          <Button
            size="sm"
            bg="#334371"
            color="white"
            onClick={openStatusModal}
            isDisabled={!selectedApplication?.id}
            _hover={{ bg: "#2b3760" }}
            _active={{ bg: "#253050" }}
          >
            UPDATE
          </Button>

          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              icon={<BsThreeDotsVertical />}
              variant="ghost"
              size="sm"
              aria-label="Options"
            />

            <MenuList w="fit-content" minW="unset">
              <MenuItem fontSize="sm" onClick={openTalentPoolModal}>
                Move to Talent Pool
              </MenuItem>

              <MenuItem
                color="red"
                fontSize="sm"
                onClick={() => handleSubmitStatus("Rejected")}
              >
                Reject Candidate
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      )}
    </HStack>

    {appCount > 1 ? (
      <>
        <Box w="100%">
          <SearchCombobox
            value={selectedApplicationId ?? ""}
            onChange={(v) => {
              setSelectedApplicationId(v || null);
              const found = applications.find((a) => a.id === v);
              setSelectedApplication(found || null);
            }}
            options={applications.map((a) => {
              const ri = a.recruitment_infor || ({} as any);
              const title =
                ri.post_title ||
                ri.internal_title ||
                ri.title ||
                "Untitled job";
              const company =
                ri.company?.name ||
                ri.company?.company_name ||
                ri.department?.full_name ||
                "";
              const label = [title, company, a.status]
                .filter(Boolean)
                .join(" · ");

              return {
                id: a.id,
                name: label,
              };
            })}
            placeholder="Search applications"
            isClearable
            zIndex={3000}
          />
        </Box>

        <Box w="100%">
          {renderApplicationCard(selectedApplication)}
        </Box>
      </>
    ) : appCount === 1 ? (
      <Box w="100%">
        {renderApplicationCard(applications[0] || null)}
      </Box>
    ) : (
      <Box
        w="100%"
        border="1px dashed"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
        bg="gray.50"
      >
        <Text fontSize="sm" color="gray.600">
          {isEmployerRole
            ? "This candidate has not applied to your company’s jobs."
            : "This candidate has not applied to any job yet."}
        </Text>
      </Box>
    )}

    {!hasApplication && canManageCandidate && (
      <Box pt={2} w="100%">
        <Button
          size="sm"
          bg="#334371"
          color="white"
          borderRadius="full"
          px={4}
          fontWeight="600"
          _hover={{ bg: "#2b3760" }}
          _active={{ bg: "#253050" }}
          onClick={() => setShowAssignPanel((prev) => !prev)}
          isLoading={createApplicationMutation.isPending}
        >
          {showAssignPanel ? "Close Assign Panel" : "Assign to Job"}
        </Button>

        {showAssignPanel && (
          <Box
            mt={3}
            w="100%"
            p={4}
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            boxShadow="sm"
          >
            <VStack spacing={3} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={1}>
                  Assign to job posting
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Select a job posting to attach this candidate.
                </Text>
              </Box>

              <SearchCombobox
                value={selectedRecruitmentId}
                onChange={setSelectedRecruitmentId}
                options={recruitmentComboOptions}
                placeholder={
                  isLoadingRecruitments
                    ? "Loading job postings..."
                    : "Search and select job posting"
                }
                isDisabled={isLoadingRecruitments}
                isClearable
                zIndex={3000}
              />

              <Input
                size="sm"
                placeholder="Optional note"
                value={assigningNote}
                onChange={(e) => setAssigningNote(e.target.value)}
                bg="white"
                borderColor="gray.200"
                _hover={{ borderColor: "gray.300" }}
                _focus={{
                  borderColor: "#334371",
                  boxShadow: "0 0 0 1px #334371",
                }}
              />

              <HStack justify="flex-end" pt={1}>
                <Button
                  size="sm"
                  variant="ghost"
                  color="gray.600"
                  onClick={() => {
                    setShowAssignPanel(false);
                    setSelectedRecruitmentId("");
                    setAssigningNote("");
                    setJobSearch("");
                  }}
                >
                  Cancel
                </Button>

                <Button
                  size="sm"
                  bg="#334371"
                  color="white"
                  px={4}
                  borderRadius="md"
                  _hover={{ bg: "#2b3760" }}
                  _active={{ bg: "#253050" }}
                  onClick={handleAssignCandidate}
                  isLoading={createApplicationMutation.isPending}
                  isDisabled={!selectedRecruitmentId}
                >
                  Assign Candidate
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}
      </Box>
    )}
  </VStack>
</Box>

                <Divider my={4} />

                {/* PERSONAL INFORMATION */}
                <Text fontWeight="700" mb={2}>
                  PERSONAL INFORMATION
                </Text>

                <VStack align="stretch" spacing={3}>
                  <InfoRow
                    label="Phone Number"
                    value={candidate.phone_number ?? ""}
                  />
                  <InfoRow
                    label="Email"
                    value={
                      <Text fontSize="sm" color={theme.colors.primary} noOfLines={1}>
                        {candidate.email ?? "-"}
                      </Text>
                    }
                  />
                  <InfoRow label="Date of Birth" value={dob} />
                  <InfoRow label="Gender" value={candidate.gender ?? ""} />
                  <InfoRow label="Address" value={candidate.address ?? ""} />
                </VStack>

                {hasSelectedApplication ? (
                  applicationCv ? (
                    (activeCvMetadataSummary.length > 0 || activeCvRawText) ? (
                      <Box mt={4} p={3} border="1px solid" borderColor="gray.200" borderRadius="md" bg="gray.50">
                        <Text fontWeight="700" mb={2} fontSize="sm">
                          CV Summary
                        </Text>

                        <VStack align="stretch" spacing={2}>
                          {activeCvMetadataSummary.length > 0 ? (
                            activeCvMetadataSummary.map((item, index) => (
                              <Text key={`${item}-${index}`} fontSize="sm" color="gray.700">
                                {item}
                              </Text>
                            ))
                          ) : null}

                          {!activeCvMetadataSummary.length && activeCvRawText ? (
                            <Text fontSize="sm" color="gray.700" noOfLines={4}>
                              {activeCvRawText}
                            </Text>
                          ) : null}
                        </VStack>
                      </Box>
                    ) : null
                  ) : (
                    <Box mt={4} p={3} border="1px dashed" borderColor="gray.200" borderRadius="md" bg="gray.50">
                      <Text fontWeight="700" mb={1} fontSize="sm">
                        CV Summary
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        This application has no CV attached.
                      </Text>
                    </Box>
                  )
                ) : (
                  (activeCvMetadataSummary.length > 0 || activeCvRawText) ? (
                    <Box mt={4} p={3} border="1px solid" borderColor="gray.200" borderRadius="md" bg="gray.50">
                      <Text fontWeight="700" mb={2} fontSize="sm">
                        CV Summary
                      </Text>

                      <VStack align="stretch" spacing={2}>
                        {activeCvMetadataSummary.length > 0 ? (
                          activeCvMetadataSummary.map((item, index) => (
                            <Text key={`${item}-${index}`} fontSize="sm" color="gray.700">
                              {item}
                            </Text>
                          ))
                        ) : null}

                        {!activeCvMetadataSummary.length && activeCvRawText ? (
                          <Text fontSize="sm" color="gray.700" noOfLines={4}>
                            {activeCvRawText}
                          </Text>
                        ) : null}
                      </VStack>
                    </Box>
                  ) : null
                )}

                <Divider my={4} />

                {/* WORK EXPERIENCE */}
                <Text fontWeight="700" mb={2}>
                  WORK EXPERIENCE
                </Text>

                <Stack spacing={4}>
                  {hasSelectedApplication && !applicationCv ? (
                    <Text fontSize="sm" color="gray.500">
                      No CV work experience available for this application.
                    </Text>
                  ) : activeCandidateExperiences.length ? (
                    activeCandidateExperiences.map((exp, idx, arr) => {
                      const from = exp.from_month ? formatMonth(exp.from_month) : "-";
                      const to = exp.to_month ? formatMonth(exp.to_month) : "Present";
                      const isLast = idx === arr.length - 1;

                      return (
                        <Flex key={exp.id ?? `${exp.position}-${idx}`} gap={1} align="flex-start">
                          <Box w="120px" flexShrink={0} pt="1px">
                            <Text fontSize="sm" color="gray.600" fontWeight="600">
                              {from}
                            </Text>
                            <Text justifyContent={"center"} alignItems={"center"}>
                              –
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {to}
                            </Text>
                          </Box>

                          <Box flex="1" pb={isLast ? 0 : 2}>
                            <Text fontWeight="600" color="gray.800">
                              {exp.position || "Position not updated"}
                            </Text>

                            <Text fontSize="sm" color="gray.600" fontWeight="600" mt="2px">
                              {exp.company_name || "Organization name not updated"}
                            </Text>

                            {exp.job_description ? (
                              <Box mt={2}>
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-line">
                                  {exp.job_description}
                                </Text>
                              </Box>
                            ) : (
                              <Text fontSize="sm" color="gray.500" mt={2}>
                                (No description yet)
                              </Text>
                            )}
                          </Box>
                        </Flex>
                      );
                    })
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      No work experience yet.
                    </Text>
                  )}
                </Stack>
                <Divider my={4} />

                {/* CANDIDATE SKILLS */}
                <Text fontWeight="700" mb={2}>
                  CANDIDATE SKILLS
                </Text>

                {hasSelectedApplication && !applicationCv ? (
                  <Text fontSize="sm" color="gray.500">
                    No CV skills available for this application.
                  </Text>
                ) : activeCandidateSkills.length > 0 ? (
                  <Wrap spacing={2}>
                    {activeCandidateSkills.slice(0, MAX_BADGES).map((skillName, index) => (
                      <WrapItem key={`${skillName}-${index}`}>
                        <Box
                          px={3}
                          py={1}
                          bg="green.50"
                          color="green.700"
                          borderRadius="999px"
                          fontSize="sm"
                          fontWeight={600}
                        >
                          {formatBadgeLabel(skillName)}
                        </Box>
                      </WrapItem>
                    ))}

                    {activeCandidateSkills.length > MAX_BADGES && (
                      <WrapItem>
                        <Box px={3} py={1} bg="gray.100" color="gray.700" borderRadius="999px" fontSize="sm">
                          +{activeCandidateSkills.length - MAX_BADGES}
                        </Box>
                      </WrapItem>
                    )}
                  </Wrap>
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    No skills have been extracted from the CV yet.
                  </Text>
                )}
              </Box>

              {/* RIGHT PANE */}
              <Box flex="1" overflow="hidden">
                <Tabs
                  index={mainTab}
                  onChange={setMainTab}
                  variant="enclosed"
                  h="100%"
                  display="flex"
                  flexDirection="column"
                >
                  <Box
                    px={4}
                    pt={3}
                  >
                    <TabList whiteSpace="nowrap">
                      <Tab fontSize={"14"} color={"#334371"} fontWeight={"700"}>
                        CANDIDATE PROFILE
                      </Tab>
                      <Tab fontSize={"14"} color={"#334371"} fontWeight={"700"}>
                        EMAIL
                      </Tab>
                      <Tab fontSize={"14"} color={"#334371"} fontWeight={"700"}>
                        REVIEWS
                      </Tab>
                      <Tab fontSize={"14"} color={"#334371"} fontWeight={"700"}>
                        JOBS
                      </Tab>
                      <Tab fontSize={"14"} color={"#334371"} fontWeight={"700"}>
                        HISTORY
                      </Tab>
                    </TabList>
                  </Box>

                  <TabPanels flex="1" overflow="hidden">
                    {/* CANDIDATE PROFILE */}
                    <TabPanel p={0} h="100%">
                      <Tabs
                        index={profileSubTab}
                        onChange={setProfileSubTab}
                        h="100%"
                        display="flex"
                        flexDirection="column"
                      >
                        <HStack px={4} py={3} justify="space-between">
                          <TabList>
                            <Tab
                              fontWeight="600"
                              _hover={{ color: "#334371" }}
                              _selected={{
                                color: "#334371",
                                borderBottom: "2px solid #334371",
                              }}
                            >
                              Candidate CV
                            </Tab>
                          </TabList>

                          {canManageCandidate && (
                            <Button
                              onClick={pickFile}
                              leftIcon={<FiUploadCloud />}
                              size="sm"
                            >
                              UPLOAD CV
                            </Button>
                          )}
                        </HStack>

                        <TabPanels flex="1">
                          <TabPanel p={0}>
                            <Box h="100%" p={4}>
                              <CandidateCvTab
                                ref={cvTabRef}
                                candidateId={candidateId}
                                cvFile={applicationPreviewFileName}
                                cvUrl={applicationPreviewUrl}
                                previewLabel={applicationPreviewLabel}
                                onUploaded={refetch}
                              />
                            </Box>
                          </TabPanel>
                        </TabPanels>
                      </Tabs>
                    </TabPanel>

                    {/* EMAIL */}
                    <TabPanel p={4} h="100%" overflow="auto">
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between" align="center">
                          <Box>
                            <Text fontWeight="700" mb={1}>
                              Email
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {selectedApplication
                                ? `Related to ${applicationTitle}`
                                : "Select an application to view related messages."}
                            </Text>
                          </Box>
                          {canNotifyCandidate && (
                            <Button
                              bg="#334371"
                              color="white"
                              size="sm"
                              h="36px"
                              px={4}
                              borderRadius="8px"
                              onClick={() => setIsEmailModalOpen(true)}
                              _hover={{ opacity: 0.92 }}
                            >
                              COMPOSE
                            </Button>
                          )}
                        </HStack>

                        {!selectedApplication ? (
                          <Text fontSize="sm" color="gray.500">
                            Select an application to view related messages.
                          </Text>
                        ) : isLoadingEmailLogs ? (
                          <Center py={8}>
                            <Spinner size="sm" />
                          </Center>
                        ) : emailLogsRes?.data && emailLogsRes.data.length > 0 ? (
                          <Box overflowX="auto" border="1px solid" borderColor="#E6ECF5" borderRadius="12px">
                            <Box px={4} py={3} borderBottom="1px solid" borderColor="#E6ECF5" bg="#f8fafc">
                              <Text fontWeight="700" fontSize="sm">
                                Email History
                              </Text>
                            </Box>
                            <VStack align="stretch" spacing={0} divider={<Divider m={0} />}>
                              {emailLogsRes.data.map((log) => (
                                <Box key={log.id} px={4} py={3}>
                                  <HStack justify="space-between" align="start" spacing={4}>
                                    <Box flex="1" minW={0}>
                                      <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                                        {log.subject || "(No subject)"}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500" mt={1}>
                                        {formatEmailLogDate(log.created_at)}
                                      </Text>
                                    </Box>
                                    <Text
                                      fontSize="xs"
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                      bg={log.status === "sent" ? "green.50" : "red.50"}
                                      color={log.status === "sent" ? "green.700" : "red.700"}
                                      fontWeight="600"
                                      whiteSpace="nowrap"
                                    >
                                      {log.status === "sent" ? "Sent" : "Failed"}
                                    </Text>
                                  </HStack>
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        ) : (
                          <Text fontSize="sm" color="gray.500">
                            No email history yet. Send your first email above.
                          </Text>
                        )}

                        <EmailModal
                          isOpen={isEmailModalOpen}
                          onClose={() => setIsEmailModalOpen(false)}
                          candidateId={candidateId}
                          candidateEmail={candidate?.email ?? undefined}
                          applicationId={selectedApplication?.id ?? undefined}
                          recruitmentInforId={selectedApplication?.recruitment_infor_id ?? undefined}
                          contextLabel={selectedApplication ? applicationTitle : undefined}
                          onSent={() => {
                            refetchEmailLogs();
                            refetch();
                          }}
                        />
                      </VStack>
                    </TabPanel>

                    {/* REVIEWS */}
                    <TabPanel p={4} h="100%" overflow="auto">
                      {selectedApplication ? (
                        <ReviewCandidate
                          candidateId={candidateId}
                          applicationId={selectedApplication.id}
                          canCreateReview={canNotifyCandidate}
                          canEditReview={canManageCandidate}
                          canDeleteReview={canManageCandidate}
                        />
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          Select an application to view related reviews.
                        </Text>
                      )}
                    </TabPanel>

                    {/* JOBS */}
                    <TabPanel p={4} h="100%" overflow="auto">
                      <JobCandidate
                        jobCandidates={candidate.jobCandidates ?? []}
                        onAddClick={openAddJobModal}
                        onViewClick={(job) => {
                          openViewJobModal(job);
                          syncSelectedApplicationByRecruitmentId(job.id);
                        }}
                        onEditClick={openEditJobModal}
                        onDeleteClick={openDeleteJobModal}
                        canAdd={canManageCandidate}
                        canEdit={canManageCandidate}
                        canDelete={canManageCandidate}
                        canToggleStatus={canManageCandidate}
                      />
                    </TabPanel>

                    {/* HISTORY */}
                    <TabPanel p={4} h="100%" overflow="auto">
                      {selectedApplication ? (
                        <CandidateAuditLog
                          candidateId={candidateId}
                          applicationId={selectedApplication.id}
                        />
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          Select an application to view related history.
                        </Text>
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>

      <Modal
        isOpen={isTalentPoolModalOpen}
        onClose={() => setIsTalentPoolModalOpen(false)}
        isCentered
        size="sm"
      >
        <ModalOverlay bg="blackAlpha.300" />
        <ModalContent>
          <ModalHeader textAlign="center">MOVE TO TALENT POOL</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" color="gray.600">
                Select a potential type for this candidate.
              </Text>
              <Select
                placeholder={isPotentialTypeLoading ? "Loading potential types..." : "Select potential type"}
                value={selectedPotentialTypeId}
                onChange={(e) => setSelectedPotentialTypeId(e.target.value)}
                isDisabled={isPotentialTypeLoading}
              >
                {potentialTypeOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              <Button
                variant="ghost"
                onClick={() => setIsTalentPoolModalOpen(false)}
              >
                CANCEL
              </Button>
              <Button
                background="#334371"
                color="white"
                onClick={handleMoveToTalentPool}
                isLoading={updateCandidateMutation.isPending}
              >
                SAVE
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <UpdateStatus
  isOpen={isStatusModalOpen}
  onClose={() => setIsStatusModalOpen(false)}
  currentStatus={selectedApplication?.status}
  onUpdate={handleSubmitStatus}
  isLoading={updateStatusMutation.isPending}
/>

      {canManageCandidate && (
        <JobModal
          isOpen={isJobModalOpen}
          onClose={() => {
            setIsJobModalOpen(false);
            setSelectedJob(undefined);
          }}
          mode={jobModalMode}
          data={selectedJob}
          fixedCandidates={lockedJobCandidates}
          lockCandidateSelection
          onSuccess={() => {
            setIsJobModalOpen(false);
            setSelectedJob(undefined);
            refetch();
          }}
        />
      )}

      {canManageCandidate && (
        <ModalConfirm
          open={isDeleteJobOpen}
          setOpen={setIsDeleteJobOpen}
          title="Delete job"
          message={`Are you sure you want to delete "${deleteJobTarget?.name_job || "this job"}"?`}
          titleButton="Delete"
          onClick={handleDeleteJob}
          confirmButtonProps={{ isLoading: isDeletingJob }}
        />
      )}
    </Modal>
  );
}
