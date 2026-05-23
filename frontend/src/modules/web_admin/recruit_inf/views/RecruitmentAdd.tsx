import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  ButtonGroup,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
  Button,
} from "@chakra-ui/react";
import {
  FiCalendar,
  FiChevronDown,
  FiDollarSign,
  FiEdit3,
} from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import TabInformation, {
  type RecruitmentInfoFormState,
} from "../components/tabs/TabInformation";
import TabExecutionPlan, {
  type RecruitmentPlanFormState,
} from "../components/tabs/TabPlanRecruitemnt";
import TabRecruitmentCost, {
  type RecruitmentCostFormState,
  type RecruitmentCostItemForm,
} from "../components/tabs/TabCostRecruitment";
import theme from "../../../../theme";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { type RecruitmentStatusType, RecruitmentStatus, RECRUITMENT_STATUS_DISPLAY } from "../../../../constant";
import { recruitmentInforDetailUrl, recruitmentInforUrl } from "../../../../routes/urls";
import { useCreateRecInform } from "../api/create";
import { useUpdateRecInform } from "../api/update";
import { useRecInformID } from "../api/get";
import type { IRecruitmentInfor } from "../types";

type TabId =
  | "information"
  | "execution-plan"
  | "application-form"
  | "career-page"
  | "recruitment-channels"
  | "workflow"
  | "committee"
  | "costs";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
}

const TAB_CONFIG: TabConfig[] = [
  { id: "information",    label: "Recruitment Information", icon: FiEdit3,      enabled: true  },
  { id: "execution-plan", label: "Execution Plan",          icon: FiCalendar,   enabled: true  },
  { id: "costs",          label: "Recruitment Costs",       icon: FiDollarSign, enabled: true  },
];

export default function RecruitmentAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notify = useNotify();
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const { mutateAsync: createRecInform, isPending: isCreating } = useCreateRecInform();
  const { mutateAsync: updateRecInform, isPending: isUpdating } = useUpdateRecInform();

  const mode = searchParams.get("mode");
  const sourceRecruitmentId = searchParams.get("id") || "";
  const isEditMode = mode === "edit" && !!sourceRecruitmentId;
  const isDuplicateMode = mode === "duplicate" && !!sourceRecruitmentId;

  const { data: sourceData } = useRecInformID(sourceRecruitmentId, {
    enabled: isEditMode || isDuplicateMode,
  });

  const [activeTab, setActiveTab] = useState<TabId>("information");
  const [publishStatus, setPublishStatus] = useState<RecruitmentStatusType>(
    RecruitmentStatus.Public,
  );
  const [infoForm, setInfoForm] = useState<RecruitmentInfoFormState | null>(null);
  const [planForm, setPlanForm] = useState<RecruitmentPlanFormState | null>(null);
  const [costForm, setCostForm] = useState<RecruitmentCostFormState | null>(null);

  const sourceRecruitment = useMemo<IRecruitmentInfor | null>(() => {
    if (!sourceData) return null;
    const payload = (sourceData as any)?.data ?? sourceData;
    const raw = payload?.data ?? payload;
    return (raw as IRecruitmentInfor) ?? null;
  }, [sourceData]);

  const isEditingDraft =
    isEditMode && sourceRecruitment?.status === RecruitmentStatus.Draft;

  const canSaveDraft = !isEditMode || isEditingDraft;
  const formInstanceKey = `${mode || "add"}-${sourceRecruitmentId || "new"}-${sourceRecruitment?.id || "loading"}`;

  // ── colours (all hooks at top level) ──
  const bg             = useColorModeValue("white",    "gray.800");
  const borderColor    = useColorModeValue("gray.200", "gray.700");
  const activeBg       = useColorModeValue("blue.50",  "#334371");
  const activeTxt      = useColorModeValue("blue.600", "blue.200");
  const activeBorder   = useColorModeValue("blue.500", "blue.400");
  const disabledTxt    = useColorModeValue("gray.400", "gray.600");
  const normalTxt      = useColorModeValue("gray.700", "gray.200");
  const hoverBg        = useColorModeValue("gray.50",  "gray.750");
  const subtleTxt      = useColorModeValue("gray.500", "gray.400");

  const parseNumber = (value?: string) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };

  const parseSkillLevel = (value?: string) => {
    const n = Number(value || 1);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(5, Math.round(n)));
  };

  const monthToDate = (monthValue?: string) => {
    if (!monthValue) return undefined;
    return `${monthValue}-01`;
  };

  const toDateInput = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const toMonthInput = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 7);
  };

  const duplicateBatchTitle = (title?: string | null) => {
    const value = title?.trim() || "";
    if (!value) return "";
    if (value.toLowerCase().includes("copy")) return value;
    return `${value} (Copy)`;
  };

  const buildErrorMessage = (err: any) => {
    const d = err?.response?.data;
    if (Array.isArray(d?.message)) return d.message.join(", ");
    if (typeof d?.message === "string") return d.message;
    if (typeof d?.error === "string") return d.error;
    if (typeof err?.message === "string") return err.message;
    return "An error occurred while saving the recruitment posting";
  };

  useLayoutEffect(() => {
    if (isDuplicateMode) {
      setPublishStatus(RecruitmentStatus.Draft);
      return;
    }

    if (isEditMode && sourceRecruitment?.status) {
      setPublishStatus(sourceRecruitment.status);
      return;
    }

    setPublishStatus(RecruitmentStatus.Public);
  }, [isDuplicateMode, isEditMode, sourceRecruitment?.status]);

  const initialInfoForm = useMemo<RecruitmentInfoFormState | null>(() => {
    if (!sourceRecruitment) return null;

    const experienceType = (sourceRecruitment as any)?.experience_type || "none";
    const experienceMin = sourceRecruitment?.experience_min;
    const experienceMax = sourceRecruitment?.experience_max;
    const initialSkills = (sourceRecruitment.recruitmentSkills ?? [])
      .map((item) => ({
        skill_id: item.skill_id || item.skill?.id || "",
        skill_name: item.skill?.name || "Selected skill",
        parent_name: item.skill?.parent?.name || "",
        level: String(item.level ?? 3),
        is_required: item.is_required ?? true,
      }))
      .filter((item) => Boolean(item.skill_id));

    const resolveExperienceLabel = () => {
      if ((sourceRecruitment as any)?.experience_label) {
        return (sourceRecruitment as any).experience_label;
      }

      if (experienceType === "none") return "No experience required";
      if (experienceType === "exact") return `Exactly ${experienceMin || 1} year${(experienceMin || 1) > 1 ? "s" : ""} of experience`;
      if (experienceType === "range") return `${experienceMin || 1} - ${experienceMax || Math.max(experienceMin || 1, 2)} years of experience`;
      if (experienceType === "above") return `Above ${experienceMin || 3} years of experience`;
      if (experienceType === "below") return `Below ${experienceMax || 2} years of experience`;
      if (experienceType === "flexible") return "Flexible experience, preferred only";
      return "No experience required";
    };

    return {
      internal_title: sourceRecruitment.internal_title || "",
      post_title: sourceRecruitment.post_title || "",
      department_id: sourceRecruitment.department_id || "",
      rank_id: sourceRecruitment.rank_id || "",
      position_post_id: (sourceRecruitment as any)?.position_post_id || "",
      type_of_job: sourceRecruitment.type_of_job || "",
      experience_type: experienceType,
      experience_min: String(experienceMin ?? 0),
      experience_max: String(experienceMax ?? 0),
      experience_label: resolveExperienceLabel(),
      application_deadline: toDateInput(sourceRecruitment.application_deadline),
      total_needed: String(sourceRecruitment.total_needed || 1),
      salary_from: String(sourceRecruitment.salary_from || 0),
      salary_to: String(sourceRecruitment.salary_to || 0),
      salary_currency: sourceRecruitment.salary_currency || "VND",
      auto_near: false,
      skills: initialSkills,
      description_post: (sourceRecruitment as any)?.positionPost?.description_post || "",
      requirements_post: (sourceRecruitment as any)?.positionPost?.requirements_post || "",
      benefits_post: (sourceRecruitment as any)?.positionPost?.benefits_post || "",
      benefit_more: (() => {
        const bm = (sourceRecruitment as any)?.positionPost?.benefit_more || {};
        return {
          competitive_salary: bm.competitive_salary || "",
          professional_environment: bm.professional_environment || "",
          training_and_development: bm.training_and_development || "",
          career_opportunities: bm.career_opportunities || "",
          allowances_and_welfare: bm.allowances_and_welfare || "",
        };
      })(),
      contact_person_id: sourceRecruitment.contact_person_id || "",
      contact_phone: (sourceRecruitment as any)?.contactPerson?.phone_account || "",
      contact_email: (sourceRecruitment as any)?.contactPerson?.email_account || "",
    };
  }, [sourceRecruitment]);

  const initialPlanForm = useMemo<RecruitmentPlanFormState | null>(() => {
    if (!sourceRecruitment) return null;

    const firstPlan = sourceRecruitment.recruitmentPlans?.[0];
    const batches = firstPlan?.recruitmentPlanChildBatches || [];

    return {
      total_real_number: String(firstPlan?.total_real_number || sourceRecruitment.total_needed || 1),
      monthly_target: toMonthInput(firstPlan?.monthly_target),
      expected_deadline: toDateInput(firstPlan?.expected_deadline),
      split_target_by_recruiter: false,
      plan_by_batches: batches.length > 0,
      batches: batches.map((batch) => ({
        localId: batch.id,
        batches_title: isDuplicateMode
          ? duplicateBatchTitle(batch.batches_title)
          : batch.batches_title || "",
        from_date: toDateInput(batch.from_date),
        to_date: toDateInput(batch.to_date),
        number_recruitment: String(batch.number_recruitment || 1),
        monthly_target: toMonthInput(batch.monthly_target),
        split_target_by_recruiter: false,
      })),
    };
  }, [sourceRecruitment]);

  const initialCostItems = useMemo<RecruitmentCostItemForm[]>(() => {
    if (!sourceRecruitment?.recruitmentCosts?.length) return [];

    return sourceRecruitment.recruitmentCosts.map((cost) => ({
      localId: cost.id,
      cost_type: cost.cost_type || "",
      amount: String(cost.amount || ""),
    }));
  }, [sourceRecruitment]);

  const initialCostForm = useMemo<RecruitmentCostFormState | null>(() => {
    if (!sourceRecruitment) return null;

    return {
      currency: sourceRecruitment.recruitmentCosts?.[0]?.currency || "VND",
      items: initialCostItems,
    };
  }, [sourceRecruitment, initialCostItems]);

  const validateBaseInfo = (form: RecruitmentInfoFormState | null) => {
    if (!form) return "Please fill in recruitment information";
    if (!form.internal_title.trim()) return "Please enter an internal title";
    if (!form.post_title.trim()) return "Please enter a posting title";
    if (!form.department_id) return "Please select a company branch";
    if (!form.rank_id) return "Please select a rank";
    if (!form.position_post_id) return "Please select a recruitment position";
    if (!form.experience_type) return "Please select an experience type";
    if (!form.application_deadline) return "Please select an application deadline";
    return null;
  };

  const baseInfoError = validateBaseInfo(infoForm);
  const isBaseInfoCompleted = !baseInfoError;

  const handleTabChange = (tabId: TabId) => {
    const requiresBaseInfo = tabId === "execution-plan" || tabId === "costs";
    if (requiresBaseInfo && !isBaseInfoCompleted) {
      notify({
        message:
          baseInfoError ||
          "Please complete Recruitment Information before configuring execution plan and costs",
        type: "warning",
      });
      setActiveTab("information");
      return;
    }

    setActiveTab(tabId);
  };

  const submitRecruitment = async (status: RecruitmentStatusType) => {
    const validationError = validateBaseInfo(infoForm);
    if (validationError) {
      setActiveTab("information");
      notify({ message: validationError, type: "warning" });
      return;
    }

    if (!infoForm) return;

    const planBatches = (planForm?.plan_by_batches ? planForm.batches : [])
      .filter(
        (item) =>
          item.batches_title.trim() ||
          item.from_date ||
          item.to_date ||
          item.number_recruitment.trim() ||
          item.monthly_target,
      )
      .map((item) => ({
        batches_title: item.batches_title.trim() || undefined,
        from_date: item.from_date || undefined,
        to_date: item.to_date || undefined,
        number_recruitment: parseNumber(item.number_recruitment),
        monthly_target: monthToDate(item.monthly_target),
      }));

    const hasPlanValue = Boolean(
      planForm?.total_real_number?.trim() ||
      planForm?.monthly_target ||
      planForm?.expected_deadline ||
      planBatches.length,
    );

    const planPayload = hasPlanValue
      ? [
          {
            total_real_number: parseNumber(planForm?.total_real_number),
            monthly_target: monthToDate(planForm?.monthly_target),
            expected_deadline: planForm?.expected_deadline || undefined,
            batches: planBatches.length ? planBatches : undefined,
          },
        ]
      : undefined;

    const experienceType = infoForm.experience_type || "none";
    const experienceMin = infoForm.experience_min.trim();
    const experienceMax = infoForm.experience_max.trim();
    const resolvedExperienceMin =
      experienceType === "none"
        ? 0
        : experienceMin
          ? Number(experienceMin)
          : experienceType === "above"
            ? Number(experienceMin || 3)
            : experienceType === "below"
              ? undefined
              : experienceType === "range"
                ? Number(experienceMin || 1)
                : Number(experienceMin || 1);
    const resolvedExperienceMax =
      experienceType === "none"
        ? 0
        : experienceType === "exact"
          ? Number(experienceMin || 1)
          : experienceType === "range"
            ? Number(experienceMax || Number(experienceMin || 1) + 1)
            : experienceType === "below"
              ? Number(experienceMax || 2)
              : experienceType === "flexible"
                ? undefined
                : undefined;

    const normalizedExactMin =
      experienceType === "exact" ? Number(experienceMin || 1) : resolvedExperienceMin;
    const normalizedExactMax =
      experienceType === "exact" ? Number(experienceMin || 1) : resolvedExperienceMax;

    const resolvedExperienceLabel =
      infoForm.experience_label ||
      (experienceType === "none"
        ? "No experience required"
        : experienceType === "exact"
          ? `Exactly ${resolvedExperienceMin || 1} years of experience`
          : experienceType === "range"
            ? `${resolvedExperienceMin || 1} - ${resolvedExperienceMax || Number(resolvedExperienceMin || 1) + 1} years of experience`
            : experienceType === "above"
              ? `Above ${resolvedExperienceMin || 3} years of experience`
              : experienceType === "below"
                ? `Below ${resolvedExperienceMax || 2} years of experience`
                : "Flexible experience, preferred only");

            const safeCostItems = Array.isArray(costForm?.items) ? costForm.items : [];
            const costCurrency = costForm?.currency || "VND";

    try {
      const finalStatus = isDuplicateMode ? RecruitmentStatus.Draft : status;
      const payload = {
        internal_title: infoForm.internal_title.trim(),
        post_title: infoForm.post_title.trim(),
        department_id: infoForm.department_id,
        rank_id: infoForm.rank_id,
        // Use selected department as work location as requested.
        work_location_id: infoForm.department_id,
        type_of_job: infoForm.type_of_job || undefined,
        experience_type: experienceType,
        experience_min: normalizedExactMin,
        experience_max: normalizedExactMax,
        experience_label: resolvedExperienceLabel,
        application_deadline: infoForm.application_deadline || undefined,
        total_needed: parseNumber(infoForm.total_needed),
        salary_from: parseNumber(infoForm.salary_from),
        salary_to: parseNumber(infoForm.salary_to),
        salary_currency: infoForm.salary_currency || undefined,
        position_post_id: infoForm.position_post_id,
        contact_person_id: infoForm.contact_person_id || undefined,
        skills: infoForm.skills
          .filter((item) => item.skill_id)
          .map((item) => ({
            skill_id: item.skill_id,
            level: parseSkillLevel(item.level),
            is_required: item.is_required,
          })),
        status: finalStatus,
        is_active: true,
        other_costs: safeCostItems
          .filter((item) => item.cost_type.trim() || item.amount.trim())
          .map((item) => ({
            cost_type: item.cost_type.trim() || undefined,
            amount: item.amount.trim() ? Number(item.amount) : undefined,
            currency: costCurrency,
          })),
        plan: planPayload,
      };

      let created: IRecruitmentInfor | null = null;

      if (isEditMode && sourceRecruitmentId) {
        await updateRecInform({
          id: sourceRecruitmentId,
          data: payload,
        });
      } else {
        created = await createRecInform(payload);
      }

      setPublishStatus(finalStatus);
      notify({
        message:
          isEditMode
            ? "Recruitment posting updated successfully"
            : isDuplicateMode
              ? "Duplicate posting saved as draft"
              : "Recruitment posting saved successfully",
        type: "success",
      });

      if (isEditMode && sourceRecruitmentId) {
        navigate(recruitmentInforDetailUrl.replace(":id", sourceRecruitmentId));
      } else if (created?.id) {
        navigate(recruitmentInforDetailUrl.replace(":id", created.id));
      } else {
        navigate(recruitmentInforUrl);
      }
    } catch (err: any) {
      notify({ message: buildErrorMessage(err), type: "error" });
    }
  };

  const handleSaveAndPublish = async (statusOverride?: RecruitmentStatusType) => {
    if (isDuplicateMode) {
      await submitRecruitment(RecruitmentStatus.Draft);
      return;
    }

    // For draft postings, default UPDATE keeps draft unless user explicitly chooses a publish status.
    const finalStatus =
      statusOverride ??
      (isEditingDraft ? RecruitmentStatus.Draft : RecruitmentStatus.Public);
    await submitRecruitment(finalStatus);
  };

  const handleSaveDraft = async () => {
    if (!canSaveDraft) {
      notify({
        message:
          "Save Draft is only available for new postings or postings that are already in Draft.",
        type: "warning",
      });
      return;
    }

    await submitRecruitment(RecruitmentStatus.Draft);
  };

  const handleInfoFormChange = useCallback((form: RecruitmentInfoFormState) => {
    setInfoForm(form);
  }, []);

  const handleCostFormChange = useCallback((form: RecruitmentCostFormState) => {
    setCostForm(form);
  }, []);

  const handlePlanFormChange = useCallback((form: RecruitmentPlanFormState) => {
    setPlanForm(form);
  }, []);

const resetContentScrollTop = useCallback(() => {
  window.scrollTo({ top: 0, behavior: "auto" });

  const container = contentScrollRef.current;
  if (container) {
    container.scrollTo({ top: 0, behavior: "auto" });
  }

  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    if (container) {
      container.scrollTo({ top: 0, behavior: "auto" });
    }

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });

      if (container) {
        container.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 0);
  });
}, []);

  useLayoutEffect(() => {
  setActiveTab("information");
  resetContentScrollTop();
}, [mode, sourceRecruitmentId, resetContentScrollTop]);

  useLayoutEffect(() => {
  if (!sourceRecruitment) return;
  resetContentScrollTop();
}, [sourceRecruitment, resetContentScrollTop]);

  const duplicateSourceTitle =
    sourceRecruitment?.post_title ||
    sourceRecruitment?.internal_title ||
    "Untitled recruitment";

  const publishOptions: Array<{
    value: RecruitmentStatusType;
    label: string;
    description: string;
    dotColor: string;
  }> = [
    {
      value: RecruitmentStatus.Public,
      label: "Public",
      description: "Visible publicly on configured recruitment channels.",
      dotColor: "#6175AF",
    },
    {
      value: RecruitmentStatus.Internal,
      label: "Internal",
      description: "Accessible via direct link but hidden from recruitment channels.",
      dotColor: "#334371",
    },
  ];

  return (
    <Box display="flex" flexDirection="column" mx={-6} minH="calc(100vh - 70px)">
      {/* ── Body ── */}
      <Flex flex={1} overflow="hidden">

        {/* Left sidebar tabs */}
        <Box
          w="230px"
          borderRight="1px solid"
          borderColor={borderColor}
          flexShrink={0}
          py={3}
          overflowY="auto"
        >
          <VStack spacing={0} align="stretch">
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.id;
              const requiresBaseInfo = tab.id === "execution-plan" || tab.id === "costs";
              const isLocked = requiresBaseInfo && !isBaseInfoCompleted;

              const item = (
                <Flex
                  key={tab.id}
                  align="center"
                  gap={3}
                  px={4}
                  py={2.5}
                  cursor={tab.enabled ? "pointer" : "not-allowed"}
                  bg={isActive ? activeBg : "transparent"}
                  color={!tab.enabled || isLocked ? disabledTxt : isActive ? activeTxt : normalTxt}
                  fontWeight={isActive ? "600" : "500"}
                  borderLeft="3px solid"
                  borderLeftColor={isActive ? activeBorder : "transparent"}
                  opacity={!tab.enabled || isLocked ? 0.55 : 1}
                  _hover={tab.enabled && !isActive && !isLocked ? { bg: hoverBg } : {}}
                  transition="all 0.12s ease"
                  onClick={() => {
                    if (tab.enabled) handleTabChange(tab.id);
                  }}
                >
                  <Icon as={tab.icon} boxSize="18px" flexShrink={0} />
                  <Text fontSize="md" noOfLines={1}>{tab.label}</Text>
                </Flex>
              );

              if (tab.enabled && isLocked) {
                return (
                  <Tooltip
                    key={tab.id}
                    label="Complete Recruitment Information first"
                    placement="right"
                    hasArrow
                  >
                    <Box>{item}</Box>
                  </Tooltip>
                );
              }

              return tab.enabled ? (
                <Box key={tab.id}>{item}</Box>
              ) : (
                <Tooltip key={tab.id} label="Coming soon" placement="right" hasArrow>
                  <Box>{item}</Box>
                </Tooltip>
              );
            })}
          </VStack>
        </Box>

        {/* Content area */}
        <Box
          key={formInstanceKey}
          ref={contentScrollRef}
          flex={1}
          overflowY="auto"
          px={6}
          borderRadius={'sm'}
          sx={{ overflowAnchor: "none" }}
        >
          {isDuplicateMode && (
            <Box
              mt={4}
              mb={2}
              px={4}
              py={3}
              border="1px solid"
              borderColor="blue.200"
              bg="blue.50"
              borderRadius="md"
            >
              <Text fontSize="sm" color="blue.800" fontWeight="600">
                Created from existing posting: {duplicateSourceTitle}
              </Text>
            </Box>
          )}

          <Box display={activeTab === "information" ? "block" : "none"}>
            <TabInformation
              key={`${formInstanceKey}-info`}
              onFormChange={handleInfoFormChange}
              initialForm={initialInfoForm}
            />
          </Box>
          <Box display={activeTab === "execution-plan" ? "block" : "none"}>
            <TabExecutionPlan
              key={`${formInstanceKey}-plan`}
              onFormChange={handlePlanFormChange}
              initialForm={initialPlanForm}
            />
          </Box>
          <Box display={activeTab === "costs" ? "block" : "none"}>
            <TabRecruitmentCost
              key={`${formInstanceKey}-cost`}
              onFormChange={handleCostFormChange}
              initialForm={initialCostForm || undefined}
              initialItems={initialCostItems}
            />
          </Box>
        </Box>

        {/* Right action panel */}
        <Box
          w="220px"
          bg={bg}
          borderLeft="1px solid"
          borderColor={borderColor}
          p={4}
          flexShrink={0}
        >
          <VStack spacing={3} align="stretch">
            {isDuplicateMode ? (
              <Button
                w="100%"
                bg={theme.colors.primary}
                color={'white'}
                fontWeight="700"
                onClick={() => {
                  void handleSaveAndPublish();
                }}
                isLoading={isCreating || isUpdating}
                loadingText="Saving"
              >
                {isDuplicateMode ? "SAVE DUPLICATE" : "SAVE & PUBLISH"}
              </Button>
            ) : (
              <ButtonGroup isAttached  size="md" w="100%">
                <Button
                  flex={1}
                  bg={theme.colors.primary} color={'white'}
                  fontWeight="700"
                  onClick={() => handleSaveAndPublish()}
                  isLoading={isCreating || isUpdating}
                  loadingText="Saving"
                >
                  {isEditMode ? "UPDATE" : "ADD & PUBLISH"}
                </Button>

                <Menu placement="bottom-end">
                  <MenuButton
                  bg={theme.colors.primary} color={'white'}
                    as={IconButton}
                    aria-label="Publishing status options"
                    icon={<FiChevronDown />}
                    isDisabled={isCreating || isUpdating}
                  />
                  <MenuList minW="220px" maxW="260px" p={2}>
                    {publishOptions.map((option) => (
                      <MenuItem
                        key={option.value}
                        borderRadius="md"
                        py={3}
                        onClick={() => {
                          void handleSaveAndPublish(option.value);
                        }}
                      >
                        <HStack align="start" spacing={3}>
                          <Box
                            mt="7px"
                            boxSize="10px"
                            borderRadius="full"
                            bg={option.dotColor}
                            flexShrink={0}
                          />
                          <Box>
                            <Text fontSize="md" fontWeight="700" lineHeight="1.2">
                              {option.label}
                            </Text>
                            <Text mt={1} fontSize="md" color="gray.500" whiteSpace="normal">
                              {option.description}
                            </Text>
                          </Box>
                        </HStack>
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </ButtonGroup>
            )}

            {canSaveDraft && (
              <Button
                variant="outline"
                size="sm"
                w="100%"
                fontWeight="600"
                onClick={() => {
                  void handleSaveDraft();
                }}
                isLoading={(isCreating || isUpdating) && publishStatus === RecruitmentStatus.Draft}
                isDisabled={isCreating || isUpdating}
              >
                {isDuplicateMode ? "SAVE DUPLICATE (DRAFT)" : "SAVE (DRAFT)"}
              </Button>
            )}

            <Box pt={2}>
              <Text fontSize="xs" color={subtleTxt} fontWeight="600" mb={1}>
                Status
              </Text>
              <Text fontSize="sm" color={normalTxt}>
                {RECRUITMENT_STATUS_DISPLAY[publishStatus]}
              </Text>
            </Box>
          </VStack>
        </Box>

      </Flex>
    </Box>
  );
}
