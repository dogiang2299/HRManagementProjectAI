import { useEffect, useState } from "react";
import {
  IconButton,
  Box,
  Button,
  Checkbox,
  FormControl,
  Grid,
  GridItem,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@chakra-ui/icons";
import { useGetCompanies } from "../../../inform_company/api/get_company";
import RichTextEditorField from "../../../../../components/common/RichTextEditorField";
import SearchCombobox from "../../../../../components/common/SearchCombobox";
import { useGetEmployee } from "../../../employee/api/get_employee";
import { useGetPositionPosts } from "../../../setting/position_post/api/get";
import AddPositionModal from "../../../setting/position_post/components/AddPositionModal";
import { useGetRanks } from "../../../setting/rank/api/get";
import RankModal from "../../../setting/rank/components/RankModal";
import { useGetCompanySkills, useGlobalSearchSkills } from "../../../setting/skill/api/get";
import type { ISkill } from "../../../setting/skill/types";
import { Currency, EXPERIENCE_TYPE_OPTIONS, type ExperienceType } from "../../types";

const TYPE_OF_JOB_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Hybrid",
  "Remote",
] as const;

const EXPERIENCE_HELPER_TEXT: Record<ExperienceType, string> = {
  none: "No experience required",
  exact: "Exact years",
  range: "Range",
  above: "Above",
  below: "Below",
  flexible: "Flexible (preferred)",
};

const SKILL_LEVEL_LABELS: Record<number, string> = {
  1: "Basic",
  2: "Junior",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

const SKILL_PAGE_SIZE = 5;
type SkillSearchMode = "company" | "global";

const buildSalaryPreview = (form: FormState) => {
  const fromValue = Number(form.salary_from || 0);
  const toValue = Number(form.salary_to || 0);
  const currency = form.salary_currency || "VND";

  const from = fromValue.toLocaleString("en-US");
  const to = toValue.toLocaleString("en-US");

  if (fromValue <= 0 && toValue <= 0) {
    return "Agreement";
  }

  if (fromValue > 0 && toValue <= 0) {
    return `From ${from} ${currency}`;
  }

  if (fromValue <= 0 && toValue > 0) {
    return `Up to ${to} ${currency}`;
  }

  return `From ${from} ${currency} to ${to} ${currency}`;
};
const buildExperienceLabel = (form: FormState) => {
  const min = Number(form.experience_min || 0);
  const max = Number(form.experience_max || 0);

  switch (form.experience_type) {
    case "none":
      return "No experience required";
    case "exact":
      return `Exactly ${min || 1} year${(min || 1) > 1 ? "s" : ""} of experience`;
    case "range":
      return `${min || 1} - ${max || Math.max(min || 1, 2)} years of experience`;
    case "above":
      return `Above ${min || 3} years of experience`;
    case "below":
      return `Below ${max || 2} years of experience`;
    case "flexible":
      return `Flexible experience, preferred only`;
    default:
      return "No experience required";
  }
};

/* ── helpers ── */
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const titleColor = useColorModeValue("#1F2937", "gray.100");
  const subtle = useColorModeValue("gray.500", "gray.400");

  return (
    <Box mb={4}>
      <Text fontWeight="700" fontSize="md" color={titleColor} letterSpacing="0.1px">
        {title}
      </Text>

      {subtitle && (
        <Text fontSize="sm" color={subtle} mt={0.5}>
          {subtitle}
        </Text>
      )}
    </Box>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  const c = useColorModeValue("gray.700", "gray.200");

  return (
    <Text fontSize="sm" fontWeight="600" color={c} mb={1}>
      {label}
      {required && (
        <Text as="span" color="red.500" ml={1}>
          *
        </Text>
      )}
    </Text>
  );
}

/* ── form state ── */
export type RecruitmentSkillForm = {
  skill_id: string;
  skill_name: string;
  parent_name?: string;
  level: string;
  is_required: boolean;
};

type FormState = {
  internal_title: string;
  post_title: string;
  department_id: string;
  rank_id: string;
  position_post_id: string;
  type_of_job: string;
  experience_type: ExperienceType | "";
  experience_min: string;
  experience_max: string;
  experience_label: string;
  application_deadline: string;
  total_needed: string;
  salary_from: string;
  salary_to: string;
  salary_currency: string;
  auto_near: boolean;
  skills: RecruitmentSkillForm[];
  description_post: string;
  requirements_post: string;
  benefits_post: string;
  benefit_more: {
    competitive_salary: string;
    professional_environment: string;
    training_and_development: string;
    career_opportunities: string;
    allowances_and_welfare: string;
  };
  contact_person_id: string;
  contact_phone: string;
  contact_email: string;
};

export type RecruitmentInfoFormState = FormState;

interface TabThongTinProps {
  onFormChange?: (form: RecruitmentInfoFormState) => void;
  initialForm?: RecruitmentInfoFormState | null;
}

const INIT: FormState = {
  internal_title: "",
  post_title: "",
  department_id: "",
  rank_id: "",
  position_post_id: "",
  type_of_job: "",
  experience_type: "none",
  experience_min: "0",
  experience_max: "0",
  experience_label: "No experience required",
  application_deadline: "",
  total_needed: "1",
  salary_from: "0",
  salary_to: "0",
  salary_currency: "VND",
  auto_near: false,
  skills: [],
  description_post: "",
  requirements_post: "",
  benefits_post: "",
  benefit_more: {
    competitive_salary: "",
    professional_environment: "",
    training_and_development: "",
    career_opportunities: "",
    allowances_and_welfare: "",
  },
  contact_person_id: "",
  contact_phone: "",
  contact_email: "",
};

/* ── main component ── */
export default function TabThongTin({ onFormChange, initialForm }: TabThongTinProps) {
  const [form, setForm] = useState<FormState>(INIT);
  const [skillPickerValue, setSkillPickerValue] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [skillSearchMode, setSkillSearchMode] = useState<SkillSearchMode>("company");
  const [skillPage, setSkillPage] = useState(1);
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderC = useColorModeValue("rgba(226, 232, 240, 0.65)", "gray.700");
  const subtle = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("white", "gray.800");
  const inputBorder = useColorModeValue("rgba(203, 213, 225, 0.75)", "gray.600");
  const inputHoverBorder = useColorModeValue("#94A3B8", "gray.500");
  const sectionTitleColor = useColorModeValue("#1F2937", "gray.100");
  const buttonHoverBg = useColorModeValue("gray.50", "gray.700");
  const buttonActiveBg = useColorModeValue("gray.100", "gray.600");
  const primary = "#334371";

  const commonFieldSx = {
    bg: inputBg,
    borderColor: inputBorder,
    borderRadius: "6px",
    fontSize: "sm",
    minH: "40px",
    _hover: {
      borderColor: inputHoverBorder,
    },
    _focus: {
      borderColor: primary,
      boxShadow: "0 0 0 1px rgba(51, 67, 113, 0.28)",
    },
    _focusVisible: {
      borderColor: primary,
      boxShadow: "0 0 0 1px rgba(51, 67, 113, 0.28)",
    },
  };

  const sectionCardProps = {
    bg: cardBg,
    border: "1px solid",
    borderColor: borderC,
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
    p: { base: 3.5, md: 4 },
  };

  /* data sources */
  const { data: companyData } = useGetCompanies({ limit: 300 });
  const { data: rankData, refetch: refetchRanks } = useGetRanks({
    items_per_pages: 300,
    unit_id: form.department_id || undefined,
  }, {
    enabled: Boolean(form.department_id),
  });

  const { data: positionData, refetch: refetchPositions } = useGetPositionPosts(
    {
      items_per_pages: 300,
    },
    {
      enabled: true,
    }
  );

  const normalizedSkillSearch = skillSearch.trim();
  const {
    data: companySkillData = [],
    isFetching: isCompanySkillFetching,
  } = useGetCompanySkills(normalizedSkillSearch, {
    enabled: Boolean(form.department_id),
  });

  const {
    data: globalSkillData = [],
    isFetching: isGlobalSkillFetching,
  } = useGlobalSearchSkills(normalizedSkillSearch, 20, {
    enabled:
      Boolean(form.department_id) &&
      skillSearchMode === "global" &&
      Boolean(normalizedSkillSearch),
  });

  const { data: employeeData } = useGetEmployee({ limit: 300 });

  const companies = companyData?.data ?? [];
  const ranks = rankData?.data ?? [];
  const positions = positionData?.data ?? [];
  const skills = skillSearchMode === "global" ? globalSkillData : companySkillData;
  const employees = employeeData?.data ?? [];

  const departmentOptions = companies
    .map((item) => ({
      id: item.id,
      name: item.full_name ?? item.acronym_name ?? "",
    }))
    .filter((item) => Boolean(item.name));

  const rankOptions = ranks
    .map((item) => ({ id: item.id, name: item.name_rank ?? "" }))
    .filter((item) => Boolean(item.name));

  const positionOptions = positions
    .map((item) => ({ id: item.id, name: item.name_post ?? "" }))
    .filter((item) => Boolean(item.name));

  const formatSkillName = (skill?: ISkill | null) => {
    if (!skill) return "";
    return [skill.name, skill.parent?.name].filter(Boolean).join(" · ");
  };

  const skillOptions = skills
    .map((item) => ({
      id: item.id,
      name: formatSkillName(item),
    }))
    .filter((item) => Boolean(item.name));

  const isSkillFetching =
    skillSearchMode === "global" ? isGlobalSkillFetching : isCompanySkillFetching;
  const skillTotalPages = Math.max(1, Math.ceil(form.skills.length / SKILL_PAGE_SIZE));
  const skillPageStart = (skillPage - 1) * SKILL_PAGE_SIZE;
  const pagedSkills = form.skills.slice(skillPageStart, skillPageStart + SKILL_PAGE_SIZE);

  const selectedCompanyName =
    departmentOptions.find((c) => c.id === form.department_id)?.name ?? "";

  const typeOfJobOptions = TYPE_OF_JOB_OPTIONS.map((item) => ({
    id: item,
    name: item,
  }));

  const experienceTypeOptions = EXPERIENCE_TYPE_OPTIONS.map((item) => ({
    id: item.value,
    name: item.label,
  }));

  const currencyOptions = Currency.map((item) => ({
    id: item.code,
    name: `${item.flag} ${item.name} (${item.code})`,
  }));

  const contactOptions = employees
    .filter((item) => {
      return (item.roles ?? []).some(
        (employeeRole) => employeeRole.role?.name_role === "Employee",
      );
    })
    .map((item) => ({ id: item.id, name: item.employee_name ?? "" }))
    .filter((item) => Boolean(item.name));

  useEffect(() => {
    setForm((prev) => {
      const nextLabel = buildExperienceLabel(prev);
      if (prev.experience_label === nextLabel) return prev;
      return { ...prev, experience_label: nextLabel };
    });
  }, [form.experience_type, form.experience_min, form.experience_max]);

  const handleExperienceTypeChange = (value: string) => {
    const nextType = value as ExperienceType | "";

    setForm((prev) => {
      let nextMin = prev.experience_min;
      let nextMax = prev.experience_max;

      if (nextType === "none") {
        nextMin = "0";
        nextMax = "0";
      }

      if (nextType === "exact" && !nextMin) {
        nextMin = "1";
      }

      if (nextType === "exact") {
        nextMax = nextMin || "1";
      }

      if (nextType === "range") {
        if (!nextMin) nextMin = "1";
        if (!nextMax) nextMax = String(Number(nextMin || 1) + 1);
      }

      if (nextType === "above" && !nextMin) {
        nextMin = "3";
        nextMax = "";
      }

      if (nextType === "below" && !nextMax) {
        nextMin = "";
        nextMax = "2";
      }

      if (nextType === "flexible") {
        nextMin = prev.experience_min || "";
        nextMax = prev.experience_max || "";
      }

      const draft = {
        ...prev,
        experience_type: nextType,
        experience_min: nextMin,
        experience_max: nextMax,
      };

      return {
        ...draft,
        experience_label: buildExperienceLabel(draft),
      };
    });
  };

  /* Auto-fill job content when selecting a position */
  useEffect(() => {
    if (!form.position_post_id) return;
    const found = positions.find((p) => p.id === form.position_post_id);
    if (!found) return;

    const bm = (found as any).benefit_more || {};
    setForm((prev) => ({
      ...prev,
      description_post: found.description_post ?? "",
      requirements_post: found.requirements_post ?? "",
      benefits_post: found.benefits_post ?? "",
      benefit_more: {
        competitive_salary: bm.competitive_salary ?? "",
        professional_environment: bm.professional_environment ?? "",
        training_and_development: bm.training_and_development ?? "",
        career_opportunities: bm.career_opportunities ?? "",
        allowances_and_welfare: bm.allowances_and_welfare ?? "",
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.position_post_id]);

  /* Auto-fill contact details when selecting an employee */
  useEffect(() => {
    if (!form.contact_person_id) return;
    const found = employees.find((e) => e.id === form.contact_person_id);
    if (!found) return;

    setForm((prev) => ({
      ...prev,
      contact_phone: found.phone_account ?? found.phone_unit ?? "",
      contact_email: found.email_account ?? found.email ?? "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.contact_person_id]);

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSkillSelect = (skillId: string) => {
    if (!skillId) {
      setSkillPickerValue("");
      return;
    }

    const found = skills.find((item) => item.id === skillId);
    const isDuplicate = form.skills.some((item) => item.skill_id === skillId);

    setForm((prev) => {
      if (prev.skills.some((item) => item.skill_id === skillId)) return prev;

      return {
        ...prev,
        skills: [
          ...prev.skills,
          {
            skill_id: skillId,
            skill_name: found?.name || "Selected skill",
            parent_name: found?.parent?.name || "",
            level: "3",
            is_required: true,
          },
        ],
      };
    });

    if (!isDuplicate) {
      setSkillPage(Math.max(1, Math.ceil((form.skills.length + 1) / SKILL_PAGE_SIZE)));
    }

    setSkillPickerValue("");
    setSkillSearch("");
    setSkillSearchMode("company");
  };

  const updateSkill = (
    skillId: string,
    patch: Partial<Pick<RecruitmentSkillForm, "level" | "is_required">>,
  ) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.map((item) =>
        item.skill_id === skillId ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeSkill = (skillId: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item.skill_id !== skillId),
    }));
  };

  const handleSkillSearchChange = (keyword: string) => {
    setSkillSearch(keyword);
    setSkillSearchMode("company");
  };

  const salaryPreview = buildSalaryPreview(form);

  useEffect(() => {
    onFormChange?.(form);
  }, [form, onFormChange]);

  useEffect(() => {
    if (!initialForm) return;
    setForm(initialForm);
    setSkillPickerValue("");
    setSkillPage(1);
  }, [initialForm]);

  useEffect(() => {
    setSkillSearch("");
    setSkillSearchMode("company");
  }, [form.department_id]);

  useEffect(() => {
    setSkillPage((prev) => Math.min(prev, skillTotalPages));
  }, [skillTotalPages]);

  return (
    <Box minH="100%" py={0}>
      <VStack spacing={4} align="stretch">
        {/* ──────────── 1. GENERAL INFORMATION ──────────── */}
        <Box {...sectionCardProps}>
          <SectionHeader title="General Information" />

          <VStack spacing={4} align="stretch">
            {/* Internal title */}
            <FormControl>
              <FieldLabel label="Internal title" required />
              <Text fontSize="sm" color={subtle} mb={1.5}>
                Title shown in internal system features and reports
              </Text>
              <Input
                {...commonFieldSx}
                h="40px"
                placeholder="Enter internal title..."
                value={form.internal_title}
                onChange={(e) => set("internal_title", e.target.value)}
              />
            </FormControl>

            {/* Posting title */}
            <FormControl>
              <FieldLabel label="Posting title" required />
              <Text fontSize="sm" color={subtle} mb={1.5}>
                Title shown on recruitment channels (Website, Facebook, LinkedIn, ...)
              </Text>
              <Input
                {...commonFieldSx}
                h="40px"
                placeholder="Enter posting title..."
                value={form.post_title}
                onChange={(e) => set("post_title", e.target.value)}
              />
            </FormControl>

            {/* Branch + Rank */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <GridItem>
                <FieldLabel label="Company branch" required />
                <SearchCombobox
                  value={form.department_id}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      department_id: value,
                      rank_id: "",
                      position_post_id: "",
                      description_post: "",
                      requirements_post: "",
                      benefits_post: "",
                      skills: [],
                    }))
                  }
                  options={departmentOptions}
                  placeholder="Select branch"
                  size="md"
                  fontSize="sm"
                />
              </GridItem>

              <GridItem>
                <FieldLabel label="Rank" />
                <HStack align="stretch" spacing={2}>
                  <Box flex={1}>
                    <SearchCombobox
                      value={form.rank_id}
                      onChange={(value) => set("rank_id", value)}
                      options={rankOptions}
                      placeholder={
                        form.department_id
                          ? "Select rank"
                          : "Please select a company branch first"
                      }
                      isDisabled={!form.department_id}
                      size="md"
                      fontSize="sm"
                    />
                  </Box>
                  <IconButton
                    aria-label="Add rank"
                    icon={<AddIcon boxSize={3} />}
                    h="40px"
                    minW="40px"
                    size="md"
                    variant="outline"
                    borderRadius="6px"
                    borderColor={inputBorder}
                    bg={inputBg}
                    _hover={{
                      bg: buttonHoverBg,
                      borderColor: inputHoverBorder,
                    }}
                    _active={{
                      bg: buttonActiveBg,
                    }}
                    onClick={() => setIsRankModalOpen(true)}
                  />
                </HStack>
              </GridItem>
            </Grid>

            {/* Recruitment position */}
            <FormControl>
              <FieldLabel label="Recruitment position" required />
              <HStack align="stretch" spacing={2}>
                <Box flex={1}>
                  <SearchCombobox
                    value={form.position_post_id}
                    onChange={(value) => set("position_post_id", value)}
                    options={positionOptions}
                    placeholder={
                      form.department_id
                        ? "Select recruitment position"
                        : "Please select a company branch first"
                    }
                    isDisabled={!form.department_id}
                    size="md"
                    fontSize="sm"
                  />
                </Box>

                <IconButton
                  aria-label="Add recruitment position"
                  icon={<AddIcon boxSize={3} />}
                  h="40px"
                  minW="40px"
                  size="md"
                  variant="outline"
                  borderRadius="6px"
                  borderColor={inputBorder}
                  bg={inputBg}
                  _hover={{
                    bg: buttonHoverBg,
                    borderColor: inputHoverBorder,
                  }}
                  _active={{
                    bg: buttonActiveBg,
                  }}
                  onClick={() => setIsPositionModalOpen(true)}
                />
              </HStack>

              {form.position_post_id && (
                <Box
                  mt={2}
                  px={3}
                  py={2}
                  borderRadius="6px"
                  bg="rgba(51, 67, 113, 0.04)"
                  border="1px solid rgba(51, 67, 113, 0.08)"
                >
                  <Text fontSize="sm" color={primary}>
                    Description, requirements, and benefits were auto-filled from
                    this position. You can still edit them below.
                  </Text>
                </Box>
              )}
            </FormControl>

            {/* Employment type + Deadline + Quantity */}
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4}>
              <GridItem>
                <FieldLabel label="Employment type" required />
                <SearchCombobox
                  value={form.type_of_job}
                  onChange={(value) => set("type_of_job", value)}
                  options={typeOfJobOptions as { id?: string; name?: string }[]}
                  placeholder="Select employment type"
                  size="md"
                  
                  fontSize="sm"
                />
              </GridItem>
              <GridItem>
                <FieldLabel label="Application deadline" required />
                <Input
                  {...commonFieldSx}
                  h="40px"
                  type="date"
                  value={form.application_deadline}
                  onChange={(e) => set("application_deadline", e.target.value)}
                />
              </GridItem>
              <GridItem>
                <FieldLabel label="Openings shown on website" required />
                <NumberInput
                  min={1}
                  value={form.total_needed}
                  onChange={(v) => set("total_needed", v)}
                >
                  <NumberInputField {...commonFieldSx} h="40px" />
                </NumberInput>
              </GridItem>
            </Grid>

<Grid
  templateColumns={{
    base: "1fr",
    md: "1.1fr 0.75fr 0.75fr 1.5fr",
  }}
  gap={4}
>
  <GridItem>
    <FieldLabel label="Experience type" required />
    <SearchCombobox
      value={form.experience_type}
      onChange={handleExperienceTypeChange}
      options={experienceTypeOptions}
      placeholder="Select experience type"
      size="md"
      fontSize="sm"
    />
  </GridItem>

  <GridItem>
    <FieldLabel label="Experience min" />
    <NumberInput
      min={0}
      value={form.experience_min}
      onChange={(value) => set("experience_min", value)}
    >
      <NumberInputField {...commonFieldSx} h="40px" />
    </NumberInput>
  </GridItem>

  <GridItem>
    <FieldLabel label="Experience max" />
    <NumberInput
      min={0}
      value={form.experience_max}
      onChange={(value) => set("experience_max", value)}
    >
      <NumberInputField {...commonFieldSx} h="40px" />
    </NumberInput>
  </GridItem>

  <GridItem>
    <FieldLabel label="Experience label" />
    <Input
      {...commonFieldSx}
      h="40px"
      value={form.experience_label}
      isReadOnly
    />
    <Text fontSize="xs" color={subtle} mt={1.5}>
      {EXPERIENCE_HELPER_TEXT[(form.experience_type || "none") as ExperienceType]}
    </Text>
  </GridItem>
</Grid>

            {/* Salary */}
            <Box>
          
              <Grid
                templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }}
                gap={4}
                alignItems="end"
              >
                <GridItem>
                  <FieldLabel label="Salary From" />
                  <NumberInput
                    min={0}
                    value={form.salary_from}
                    onChange={(v) => set("salary_from", v)}
                  >
                    <NumberInputField {...commonFieldSx} h="40px" />
                  </NumberInput>
                </GridItem>

                <GridItem>
                  <FieldLabel label="Salary To" />
                  <NumberInput
                    min={0}
                    value={form.salary_to}
                    onChange={(v) => set("salary_to", v)}
                  >
                    <NumberInputField {...commonFieldSx} h="40px" />
                  </NumberInput>
                </GridItem>

                <GridItem>
                  <FieldLabel label="Currency" />
                  <SearchCombobox
                    value={form.salary_currency}
                    onChange={(value) => set("salary_currency", value)}
                    options={currencyOptions}
                    placeholder="Select currency"
                    size="md"
                    fontSize="sm"
                  />
                </GridItem>
              </Grid>

              <Text fontSize="xs" color={subtle} mt={2}>
                Display text: "{salaryPreview}"
              </Text>
            </Box>

            {/* Recruitment skills */}
            <FormControl>
              <FieldLabel label="Recruitment skills" />
              <Text fontSize="sm" color={subtle} mb={1.5}>
                Add the skills needed for this posting. Level uses 1-5 from Basic to Expert.
              </Text>

              <SearchCombobox
                value={skillPickerValue}
                onChange={handleSkillSelect}
                options={skillOptions}
                isAsync
                onSearchChange={handleSkillSearchChange}
                isLoading={isSkillFetching}
                placeholder={
                  form.department_id
                    ? "Search and add skill"
                    : "Please select a company branch first"
                }
                isDisabled={!form.department_id}
                size="md"
                fontSize="sm"
              />

              {form.department_id && normalizedSkillSearch ? (
                <HStack mt={2} spacing={3} align="center" flexWrap="wrap">
                  {skillSearchMode === "company" ? (
                    <>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => setSkillSearchMode("global")}
                      >
                        Search global skills
                      </Button>
                      <Text fontSize="xs" color={subtle}>
                        Searching this company's active skills first.
                      </Text>
                    </>
                  ) : (
                    <>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setSkillSearchMode("company")}
                      >
                        Back to company skills
                      </Button>
                      <Text fontSize="xs" color={subtle}>
                        Global selections are saved to this company after the job is submitted.
                      </Text>
                    </>
                  )}
                </HStack>
              ) : null}

              {form.skills.length > 0 && (
                <Box
                  mt={3}
                  border="1px solid"
                  borderColor={inputBorder}
                  borderRadius="8px"
                  overflow="hidden"
                  bg={inputBg}
                >
                  <Grid
                    templateColumns="minmax(0, 1fr) 120px 120px 44px"
                    gap={3}
                    px={3}
                    py={2}
                    bg="gray.50"
                    display={{ base: "none", md: "grid" }}
                  >
                    <Text fontSize="xs" fontWeight="700" color={subtle}>
                      Skill
                    </Text>
                    <Text fontSize="xs" fontWeight="700" color={subtle}>
                      Level
                    </Text>
                    <Text fontSize="xs" fontWeight="700" color={subtle}>
                      Required
                    </Text>
                    <Box />
                  </Grid>

                  {pagedSkills.map((item, index) => {
                    const levelNumber = Number(item.level || 1);

                    return (
                      <Grid
                        key={item.skill_id}
                        templateColumns={{
                          base: "1fr",
                          md: "minmax(0, 1fr) 120px 120px 44px",
                        }}
                        gap={{ base: 2.5, md: 3 }}
                        alignItems={{ base: "stretch", md: "center" }}
                        px={3}
                        py={3}
                        borderTop={index === 0 ? "0" : "1px solid"}
                        borderColor={inputBorder}
                      >
                        <Box minW={0}>
                          <Text fontSize="sm" fontWeight="700" color={sectionTitleColor} noOfLines={1}>
                            {item.skill_name}
                          </Text>
                          {item.parent_name && (
                            <Text fontSize="xs" color={subtle} mt={0.5} noOfLines={1}>
                              {item.parent_name}
                            </Text>
                          )}
                        </Box>

                        <Box>
                          <Text
                            display={{ base: "block", md: "none" }}
                            fontSize="xs"
                            fontWeight="700"
                            color={subtle}
                            mb={1}
                          >
                            Level
                          </Text>
                          <NumberInput
                            min={1}
                            max={5}
                            value={item.level}
                            onChange={(value) => updateSkill(item.skill_id, { level: value })}
                          >
                            <NumberInputField {...commonFieldSx} h="36px" />
                          </NumberInput>
                          <Text fontSize="xs" color={subtle} mt={1}>
                            {SKILL_LEVEL_LABELS[levelNumber] || "Level"}
                          </Text>
                        </Box>

                        <Checkbox
                          isChecked={item.is_required}
                          onChange={(e) =>
                            updateSkill(item.skill_id, {
                              is_required: e.target.checked,
                            })
                          }
                          fontSize="sm"
                          fontWeight="600"
                          color={sectionTitleColor}
                        >
                          Required
                        </Checkbox>

                        <IconButton
                          aria-label={`Remove ${item.skill_name}`}
                          icon={<CloseIcon boxSize={2.5} />}
                          h="36px"
                          minW="36px"
                          size="sm"
                          variant="ghost"
                          borderRadius="6px"
                          color="gray.500"
                          _hover={{ bg: "red.50", color: "red.500" }}
                          onClick={() => removeSkill(item.skill_id)}
                        />
                      </Grid>
                    );
                  })}

                  {form.skills.length > SKILL_PAGE_SIZE && (
                    <HStack
                      justify="space-between"
                      px={3}
                      py={2}
                      borderTop="1px solid"
                      borderColor={inputBorder}
                      bg="gray.50"
                      spacing={3}
                    >
                      <Text fontSize="xs" color={subtle} fontWeight="600">
                        Showing {skillPageStart + 1}-
                        {Math.min(skillPageStart + SKILL_PAGE_SIZE, form.skills.length)} of{" "}
                        {form.skills.length} skills
                      </Text>

                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Previous skill page"
                          icon={<ChevronLeftIcon boxSize={5} />}
                          h="32px"
                          minW="32px"
                          size="sm"
                          variant="outline"
                          borderRadius="6px"
                          borderColor={inputBorder}
                          bg={inputBg}
                          isDisabled={skillPage <= 1}
                          onClick={() => setSkillPage((prev) => Math.max(1, prev - 1))}
                        />
                        <Text fontSize="xs" color={sectionTitleColor} fontWeight="700" minW="52px" textAlign="center">
                          {skillPage}/{skillTotalPages}
                        </Text>
                        <IconButton
                          aria-label="Next skill page"
                          icon={<ChevronRightIcon boxSize={5} />}
                          h="32px"
                          minW="32px"
                          size="sm"
                          variant="outline"
                          borderRadius="6px"
                          borderColor={inputBorder}
                          bg={inputBg}
                          isDisabled={skillPage >= skillTotalPages}
                          onClick={() => setSkillPage((prev) => Math.min(skillTotalPages, prev + 1))}
                        />
                      </HStack>
                    </HStack>
                  )}
                </Box>
              )}
            </FormControl>
          </VStack>
        </Box>

        {/* ──────────── 2. JOB DESCRIPTION ──────────── */}
        <Box {...sectionCardProps}>
          <SectionHeader title="Job Description" />

          <VStack spacing={4} align="stretch">
            <Box>
              <RichTextEditorField
                label="General job description"
                required
                value={form.description_post || ""}
                onChange={(value) => set("description_post", value)}
                placeholder="Enter job description..."
                minHeight="160px"
              />
            </Box>

            <Box>
              <RichTextEditorField
                label="Job requirements"
                required
                value={form.requirements_post || ""}
                onChange={(value) => set("requirements_post", value)}
                placeholder="Enter job requirements..."
                minHeight="160px"
              />
            </Box>

            <Box>
              <RichTextEditorField
                label="Benefits"
                value={form.benefits_post || ""}
                onChange={(value) => set("benefits_post", value)}
                placeholder="Benefits candidates will receive if selected..."
                minHeight="140px"
              />
            </Box>

            <Box>
              <Text fontWeight="700" fontSize="sm" color="#334155" mb={3}>Benefit details</Text>
              <VStack spacing={3} align="stretch">
                <RichTextEditorField
                  label="Competitive salary"
                  value={form.benefit_more?.competitive_salary || ""}
                  onChange={(value) => setForm((prev) => ({ ...prev, benefit_more: { ...prev.benefit_more, competitive_salary: value } }))}
                  placeholder="Describe salary & compensation..."
                  minHeight="120px"
                />
                <RichTextEditorField
                  label="Professional environment"
                  value={form.benefit_more?.professional_environment || ""}
                  onChange={(value) => setForm((prev) => ({ ...prev, benefit_more: { ...prev.benefit_more, professional_environment: value } }))}
                  placeholder="Describe work environment..."
                  minHeight="120px"
                />
                <RichTextEditorField
                  label="Training & development"
                  value={form.benefit_more?.training_and_development || ""}
                  onChange={(value) => setForm((prev) => ({ ...prev, benefit_more: { ...prev.benefit_more, training_and_development: value } }))}
                  placeholder="Describe training programs..."
                  minHeight="120px"
                />
                <RichTextEditorField
                  label="Career opportunities"
                  value={form.benefit_more?.career_opportunities || ""}
                  onChange={(value) => setForm((prev) => ({ ...prev, benefit_more: { ...prev.benefit_more, career_opportunities: value } }))}
                  placeholder="Describe career growth paths..."
                  minHeight="120px"
                />
                <RichTextEditorField
                  label="Allowances & welfare"
                  value={form.benefit_more?.allowances_and_welfare || ""}
                  onChange={(value) => setForm((prev) => ({ ...prev, benefit_more: { ...prev.benefit_more, allowances_and_welfare: value } }))}
                  placeholder="Describe allowances, insurance, welfare..."
                  minHeight="120px"
                />
              </VStack>
            </Box>
          </VStack>
        </Box>

        {/* ──────────── 3. CONTACT INFORMATION ──────────── */}
        <Box {...sectionCardProps}>
          <SectionHeader
            title="Contact Information"
            subtitle="This information will be shown on the recruitment post as the candidate contact point"
          />

          <VStack spacing={4} align="stretch">
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr"  }} gap={4}>
              <GridItem>
                <FieldLabel label="Contact person" />
                <SearchCombobox
                  value={form.contact_person_id}
                  onChange={(value) => set("contact_person_id", value)}
                  options={contactOptions}
                  placeholder="Select contact person"
                  size="md"
                  fontSize="sm"
                />
              </GridItem>
                            <GridItem>
                <FieldLabel label="Phone number" />
                <Input
                  {...commonFieldSx}
                  h="40px"
                  placeholder="Contact phone number"
                  value={form.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)}
                />
              </GridItem>

              <GridItem>
                <FieldLabel label="Email" />
                <Input
                  {...commonFieldSx}
                  h="40px"
                  placeholder="Contact email"
                  value={form.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                />
              </GridItem>

            </Grid>

          </VStack>
        </Box>

        <RankModal
          isOpen={isRankModalOpen}
          onClose={() => setIsRankModalOpen(false)}
          mode="add"
          onSuccess={() => {
            void refetchRanks();
          }}
        />

        <AddPositionModal
          isOpen={isPositionModalOpen}
          onClose={() => setIsPositionModalOpen(false)}
          companyId={form.department_id}
          companyName={selectedCompanyName}
          onSuccess={async (newId) => {
            await refetchPositions();
            setForm((prev) => ({ ...prev, position_post_id: newId }));
          }}
        />
      </VStack>
    </Box>
  );
}
