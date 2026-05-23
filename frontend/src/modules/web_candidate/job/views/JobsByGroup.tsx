import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  Image,
  Radio,
  RadioGroup,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Pagination from "../../../../components/common/Pagination";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import emptySearchIllustration from "../../../../assets/blueoc.svg";
import ITJobInfoSection from "../../home/components/ITJobInfoSection";
import { useAuthStore } from "../../../auth/store/auth.store";
import { useGetCareerOptions } from "../../profile/api/getProfile";
import { useToggleSaveJob } from "../api/saveJob";
import { useGetJobs as useGetGroupJobs } from "../api/getGroupJobs";
import { useGetJobs as useGetRecruitmentJobs } from "../api/getJobs";
import { formatSalary, type IRecruitmentInfor } from "../types/job";
import SalaryFilterSection from "../components/SalaryFilterSection";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";
import {
  convertCustomSalaryInputToRaw,
  doesJobMatchSalaryFilter,
  type SalarySelectionCurrency,
} from "../utils/salaryFilter";
import { formatWorkTypeLabel } from "../../../../utils/formatText";
import { FiBookmark, FiSliders } from "react-icons/fi";
import CandidateLoginModal from "../../auth/components/CandidateLoginModal";

const TYPE_OF_JOB_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Hybrid",
  "Remote",
] as const;

const JOBS_PER_PAGE = 10;

const EXPERIENCE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "none", label: "Not required" },
  { value: "under_1", label: "Under 1 year" },
  { value: "year_1", label: "one year" },
  { value: "years_2_3", label: "2-3 years" },
  { value: "years_4_5", label: "4-5 years" },
  { value: "above_5", label: "Over 5 years" },
] as const;

type ExperienceFilterValue = (typeof EXPERIENCE_FILTER_OPTIONS)[number]["value"];
type ExperienceType = "none" | "exact" | "range" | "above" | "below" | "flexible";

type FilterSidebarProps = {
  selectedGroupId: string;
  onGroupChange: (value: string) => void;
  groupOptions: { id?: string; name?: string }[];
  selectedExperienceFilter: ExperienceFilterValue;
  onExperienceFilterChange: (value: ExperienceFilterValue) => void;
  selectedCurrency: SalarySelectionCurrency;
  onSelectedCurrencyChange: (value: SalarySelectionCurrency) => void;
  selectedSalaryOption: string;
  onSelectedSalaryOptionChange: (value: string) => void;
  customSalaryFrom: string;
  customSalaryTo: string;
  onCustomSalaryFromChange: (value: string) => void;
  onCustomSalaryToChange: (value: string) => void;
  onApplyCustomRange: () => void;
  selectedRankId: string;
  onRankChange: (value: string) => void;
  rankOptions: { id?: string; name?: string }[];
  selectedTypeOfJob: string;
  onTypeOfJobChange: (value: string) => void;
  onClear: () => void;
};

type RealJobCardProps = {
  job: IRecruitmentInfor;
};

const normalize = (value?: string | null) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

const normalizeJobType = (value?: string | null) =>
  normalize((value || "").replace(/[\-_]+/g, " "));

const getDaysLeft = (date?: string | null) => {
  if (!date) return null;

  const deadline = new Date(date);
  if (Number.isNaN(deadline.getTime())) return null;

  const now = new Date();
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const endDate = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate(),
  ).getTime();

  return Math.ceil((endDate - startToday) / (1000 * 60 * 60 * 24));
};

const formatPostedDate = (date?: string | null) => {
  if (!date) return "Updating";

  const postedDate = new Date(date);
  if (Number.isNaN(postedDate.getTime())) return "Updating";

  return postedDate.toLocaleDateString("vi-VN");
};

const isExperienceNone = (job: IRecruitmentInfor) => {
  const type = normalize(job.experience_type) as ExperienceType | "";
  const min = typeof job.experience_min === "number" ? job.experience_min : null;
  const max = typeof job.experience_max === "number" ? job.experience_max : null;

  if (type === "none") return true;
  if (!type && min === null && max === null) return true;
  return false;
};

const matchExperienceYear = (job: IRecruitmentInfor, year: number) => {
  const type = normalize(job.experience_type) as ExperienceType | "";
  const min = typeof job.experience_min === "number" ? job.experience_min : null;
  const max = typeof job.experience_max === "number" ? job.experience_max : null;

  if (type === "none") return false;

  if (type === "exact") {
    if (min !== null) return year === min;
    if (max !== null) return year === max;
    return false;
  }

  if (type === "range") {
    if (min !== null && max !== null) return year >= min && year <= max;
    if (min !== null) return year >= min;
    if (max !== null) return year <= max;
    return false;
  }

  if (type === "above") {
    if (min !== null) return year >= min;
    return false;
  }

  if (type === "below") {
    if (max !== null) return year <= max;
    return false;
  }

  if (type === "flexible") {
    if (min !== null && max !== null) return year >= min && year <= max;
    if (min !== null) return year >= min;
    if (max !== null) return year <= max;
    return true;
  }

  if (min !== null && max !== null) return year >= min && year <= max;
  if (min !== null) return year >= min;
  if (max !== null) return year <= max;

  return false;
};

const matchesExperienceFilter = (
  job: IRecruitmentInfor,
  selectedExperienceFilter: ExperienceFilterValue,
) => {
  if (selectedExperienceFilter === "all") return true;
  if (selectedExperienceFilter === "none") return isExperienceNone(job);
  if (isExperienceNone(job)) return false;

  if (selectedExperienceFilter === "under_1") {
    return matchExperienceYear(job, 0);
  }

  if (selectedExperienceFilter === "year_1") {
    return matchExperienceYear(job, 1);
  }

  if (selectedExperienceFilter === "years_2_3") {
    return matchExperienceYear(job, 2) || matchExperienceYear(job, 3);
  }

  if (selectedExperienceFilter === "years_4_5") {
    return matchExperienceYear(job, 4) || matchExperienceYear(job, 5);
  }

  if (selectedExperienceFilter === "above_5") {
    return matchExperienceYear(job, 6);
  }

  return true;
};

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box w="full">
      <Text fontSize="15px" fontWeight="700" color="#1E293B" mb={3}>
        {title}
      </Text>
      {children}
    </Box>
  );
}

function FilterSidebar({
  selectedGroupId,
  onGroupChange,
  groupOptions,
  selectedExperienceFilter,
  onExperienceFilterChange,
  selectedCurrency,
  onSelectedCurrencyChange,
  selectedSalaryOption,
  onSelectedSalaryOptionChange,
  customSalaryFrom,
  customSalaryTo,
  onCustomSalaryFromChange,
  onCustomSalaryToChange,
  onApplyCustomRange,
  selectedRankId,
  onRankChange,
  rankOptions,
  selectedTypeOfJob,
  onTypeOfJobChange,
  onClear,
}: FilterSidebarProps) {
  return (
    <Box
      bg="white"
      borderRadius="20px"
      border="1px solid"
      borderColor="#E2E8F0"
      boxShadow="0 8px 24px rgba(15, 23, 42, 0.04)"
      p={4}
      position={{ base: "static", lg: "sticky" }}
      top="88px"
    >
      <VStack align="stretch" spacing={5}>
        <HStack spacing={2}>
          <Icon as={FiSliders} color="#334371" boxSize={5} />
          <Text fontSize="15px" fontWeight="800" color="#334371" lineHeight="1">
            Advanced filtering
          </Text>
        </HStack>


        <Divider borderColor="#E2E8F0" />

        <FilterSection title="Experience">
          <RadioGroup
            value={selectedExperienceFilter}
            onChange={(value) => onExperienceFilterChange(value as ExperienceFilterValue)}
          >
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2.5}>
              {EXPERIENCE_FILTER_OPTIONS.map((item) => (
                <Radio
                  key={item.value}
                  value={item.value}
                  colorScheme="green"
                  size="sm"
                  sx={{
                    ".chakra-radio__control[data-checked]": {
                      bg: "#334371",
                      borderColor: "#334371",
                    },
                  }}
                >
                  <Text fontSize="15px" color="#334155">
                    {item.label}
                  </Text>
                </Radio>
              ))}
            </SimpleGrid>
          </RadioGroup>
        </FilterSection>

        <Divider borderColor="#E2E8F0" />

        <SalaryFilterSection
          selectedCurrency={selectedCurrency}
          onSelectedCurrencyChange={onSelectedCurrencyChange}
          selectedSalaryOption={selectedSalaryOption}
          onSelectedSalaryOptionChange={onSelectedSalaryOptionChange}
          customSalaryFrom={customSalaryFrom}
          customSalaryTo={customSalaryTo}
          onCustomSalaryFromChange={onCustomSalaryFromChange}
          onCustomSalaryToChange={onCustomSalaryToChange}
          onApplyCustomRange={onApplyCustomRange}
        />

        <FilterSection title="Field of work">
          <SearchCombobox
            value={selectedGroupId}
            onChange={onGroupChange}
            options={groupOptions}
            placeholder="All fields"
            size="sm"
          />
        </FilterSection>

        <Divider borderColor="#E2E8F0" />

        <FilterSection title="Rank">
          <RadioGroup value={selectedRankId} onChange={onRankChange}>
            <Stack spacing={2.5}>
              <Radio
                value=""
                colorScheme="green"
                size="md"
                    sx={{
                      ".chakra-radio__control[data-checked]": {
                        bg: "#334371",
                        borderColor: "#334371",
                      },
                    }}
              >
                <Text fontSize="15px" color="#334155">
                  All
                </Text>
              </Radio>

              {rankOptions.map((item) => (
                <Radio
                  key={item.id}
                  value={item.id || ""}
                  colorScheme="green"
                  size="md"
                  sx={{
                    ".chakra-radio__control[data-checked]": {
                      bg: "#334371",
                      borderColor: "#334371",
                    },
                  }}
                >
                  <Text fontSize="15px" color="#334155">
                    {item.name}
                  </Text>
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </FilterSection>

        <Divider borderColor="#E2E8F0" />

        <FilterSection title="Form of work">
          <RadioGroup value={selectedTypeOfJob} onChange={onTypeOfJobChange}>
            <Stack spacing={2.5}>
              <Radio
                value=""
                colorScheme="green"
                size="md"
                sx={{
                  ".chakra-radio__control[data-checked]": {
                    borderColor: "#334371",
                  },
                }}
              >
                <Text fontSize="15px" color="#334155">
                  All
                </Text>
              </Radio>

              {TYPE_OF_JOB_OPTIONS.map((typeValue) => (
                <Radio
                  key={typeValue}
                  value={typeValue}
                  colorScheme="green"
                  size="md"
                  sx={{
                    ".chakra-radio__control[data-checked]": {
                      bg: "#334371",
                      borderColor: "#334371",
                    },
                  }}
                >
                  <Text fontSize="15px" color="#334155">
                    {typeValue}
                  </Text>
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </FilterSection>

        <Button
          size="sm"
          borderRadius="14px"
          variant="ghost"
          color="#94A3B8"
          bg="#F8FAFC"
          _hover={{ bg: "#F1F5F9" }}
          onClick={onClear}
        >
          Clear filtering
        </Button>
      </VStack>
    </Box>
  );
}

export function RealJobCard({ job }: RealJobCardProps) {
  const navigate = useNavigate();
  const notify = useNotify();
  const toggleSaveJobMutation = useToggleSaveJob();
  const [savedLocal, setSavedLocal] = useState(false);
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);

  const roleNames = (authUser?.roles ?? [])
    .map((r: any) => r?.role?.name_role || r?.name_role || r?.name || "")
    .filter(Boolean);
  const isCandidateLoggedIn = Boolean(
    isAuthenticated && roleNames.includes(RECRUIT_BASE_ROLE.Candidate),
  );

  const saveJob = async () => {
    try {
      const res = await toggleSaveJobMutation.mutateAsync(job.id);
      setSavedLocal(Boolean(res?.saved));

      notify({
        message: res?.message || (res?.saved ? "Job posting saved" : "The job posting has been unsaved"),
        type: "success",
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Cannot save information at this time";
      notify({
        message: "An error occurred",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        type: "error",
      });
    }
  };

  const ensureCandidateLogin = () => {
    if (isCandidateLoggedIn) return true;

    notify({
      message: "Please log in",
      description: "You need to log in to your candidate account to save information.",
      type: "warning",
    });
    onLoginOpen();
    return false;
  };

  const handleSaveJobClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!ensureCandidateLogin()) return;
    await saveJob();
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/it-job/jobs/${job.id}`);
  };

  const title = job.post_title || job.internal_title || "Recruitment news";
  const companyName = job.department?.full_name || job.department?.acronym_name || "The company is updating";
  const companyLogo = resolveCompanyLogoUrl(job.department?.image_logo);

  const location =
    job.workLocation?.short_address ||
    job.work_location_name ||
    job.department?.short_address ||
    "Location is updating";

  const salary = formatSalary(job.salary_from, job.salary_to, job.salary_currency);
  const postedDateText = formatPostedDate(job.created_at);

  const daysLeft = getDaysLeft(job.application_deadline);
  const deadlineText =
    daysLeft === null
      ? "Deadline is being updated"
      : `${daysLeft} days left to expire`;

  const rankText = job.rank?.name_rank || "Level is updating";
  const typeText = formatWorkTypeLabel(job.type_of_job) || "Form is updating";

  return (
    <>
    <Box
      role="group"
      position="relative"
                          bg="white"
                          border="1px solid"
                          borderColor="#E5E7EB"
                          borderRadius="20px"
                          px={{ base: 3.5, md: 4 }}
                          py={{ base: 3.5, md: 4 }}
                          boxShadow="0 1px 2px rgba(16,24,40,0.04)"
                          transition="all 0.2s ease"
                          overflow="hidden"
                          _before={{
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: "4px",
                            bg: "#334371",
                            opacity: 0.75,
                          }}
                          _hover={{
                            boxShadow: "0 12px 28px rgba(51,67,113,0.14)",
                            transform: "translateY(-2px)",
                          }}
    >
      <Flex gap={3} align="stretch">
        <Box
          minW={{ base: "72px", md: "88px" }}
          maxW={{ base: "72px", md: "88px" }}
          h={{ base: "72px", md: "88px" }}
          borderRadius="14px"
          border="1px solid #E2E8F0"
          bg="white"
          overflow="hidden"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Image
            src={companyLogo}
            alt={companyName}
            objectFit="contain"
            w="100%"
            h="100%"
          />
        </Box>

        <Flex flex="1" direction="column" minW={0}>
          <Flex justify="space-between" gap={3} align="start">
            <Box flex="1" minW={0}>
              <Text
                fontSize="15px"
                fontWeight="700"
                color="#243B53"
                noOfLines={2}
                lineHeight="1.45"
                cursor="pointer"
                _hover={{ color: "#2B6CB0" }}
                onClick={() => navigate(`/it-job/jobs/${job.id}`)}
              >
                {title}
              </Text>

              <Text
                mt={1.5}
                fontSize="14px"
                color="#7B8794"
                fontWeight="600"
                textTransform="uppercase"
                noOfLines={1}
                letterSpacing="0.02em"
              >
                {companyName}
              </Text>
            </Box>

            <Text
              whiteSpace="nowrap"
              fontSize="14.5px"
              fontWeight="700"
              color="#334371"
            >
              {salary}
            </Text>
          </Flex>

          <HStack mt={2.5} spacing={1.5} flexWrap="wrap">
            <Badge
              px={2.5}
              py={1}
              borderRadius="999px"
              bg="#F1F5F9"
              color="#334155"
              fontSize="sm"
              fontWeight="600"
              textTransform="none"
            >
              {location}
            </Badge>
            <Badge
              px={2.5}
              py={1}
              borderRadius="999px"
              bg="#F1F5F9"
              color="#334155"
              fontSize="sm"
              fontWeight="600"
              textTransform="none"
            >
              {rankText}
            </Badge>
            <Badge
              px={2.5}
              py={1}
              borderRadius="999px"
              bg="#F1F5F9"
              color="#334155"
              fontSize="sm"
              fontWeight="600"
              textTransform="none"
            >
              {typeText}
            </Badge>
          </HStack>

          <Divider my={2.5} borderColor="#E5E7EB" />

          <Flex
            justify="space-between"
            align={{ base: "start", md: "center" }}
            gap={2}
            direction={{ base: "column", md: "row" }}
          >
            <HStack spacing={2} flexWrap="wrap">
              <Text
                fontSize="sm"
                color="#7B8794"
                whiteSpace="nowrap"
                fontWeight="600"
              >
                Date posted: {postedDateText}
              </Text>

              <Text
                fontSize="sm"
                color="#7B8794"
                whiteSpace="nowrap"
                fontWeight="600"
              >
                • {deadlineText}
              </Text>
            </HStack>

            <HStack spacing={2.5}>
              <Button
                size="sm"
                h="32px"
                borderRadius="999px"
                variant="outline"
                borderColor="#CBD5E1"
                bg="white"
                color="#334155"
                _hover={{ bg: "#F1F5F9", borderColor: "#94A3B8" }}
                px={3.5}
                onClick={handleApplyClick}
                transition="all 0.2s ease"
              >
                Apply
              </Button>

              <Flex
                as="button"
                type="button"
                w="32px"
                h="32px"
                borderRadius="full"
                border="1.5px solid #334371"
                align="center"
                justify="center"
                color={savedLocal ? "white" : "#334371"}
                bg={savedLocal ? "#334371" : "white"}
                cursor="pointer"
                _hover={{ bg: savedLocal ? "#243B53" : "#EEF2FF" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={handleSaveJobClick}
              >
                <Icon as={FiBookmark} boxSize={4} fill={savedLocal ? "currentColor" : "none"} />
              </Flex>
            </HStack>
          </Flex>
        </Flex>
      </Flex>
    </Box>
    <CandidateLoginModal
      isOpen={isLoginOpen}
      onClose={onLoginClose}
      onSuccess={saveJob}
    />
    </>
  );
}

export default function JobsByGroup() {
  const { groupId = "", locationId = "" } = useParams();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [selectedLocationId, setSelectedLocationId] = useState(locationId);
  const [selectedExperienceFilter, setSelectedExperienceFilter] =
    useState<ExperienceFilterValue>("all");
  const [selectedCurrency, setSelectedCurrency] = useState<SalarySelectionCurrency>("all");
  const [selectedSalaryOption, setSelectedSalaryOption] = useState("all");
  const [customSalaryFrom, setCustomSalaryFrom] = useState("");
  const [customSalaryTo, setCustomSalaryTo] = useState("");
  const [appliedCustomSalaryFrom, setAppliedCustomSalaryFrom] = useState("");
  const [appliedCustomSalaryTo, setAppliedCustomSalaryTo] = useState("");
  const [selectedRankId, setSelectedRankId] = useState("");
  const [selectedTypeOfJob, setSelectedTypeOfJob] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const notify = useNotify();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [groupId, locationId]);

  useEffect(() => {
    setSelectedGroupId(groupId);
    setSelectedLocationId(locationId);
  }, [groupId, locationId]);

  const { data: groupsData } = useGetGroupJobs({
    pages: 1,
    limit: 300,
    search: "",
    status: "active",
  });

  const { data: careerOptionsData } = useGetCareerOptions();

  const { data: jobsData, isLoading } = useGetRecruitmentJobs({
    pages: 1,
    limit: 500,
    search: "",
    status: "PUBLIC",
  });

  const resetFilters = () => {
    setSearchValue("");
    setSelectedGroupId(groupId);
    setSelectedLocationId(locationId);
    setSelectedExperienceFilter("all");
    setSelectedCurrency("all");
    setSelectedSalaryOption("all");
    setCustomSalaryFrom("");
    setCustomSalaryTo("");
    setAppliedCustomSalaryFrom("");
    setAppliedCustomSalaryTo("");
    setSelectedRankId("");
    setSelectedTypeOfJob("");
  };

  const handleCurrencyChange = (value: SalarySelectionCurrency) => {
    setSelectedCurrency(value);
    setSelectedSalaryOption("all");
    setCustomSalaryFrom("");
    setCustomSalaryTo("");
    setAppliedCustomSalaryFrom("");
    setAppliedCustomSalaryTo("");
  };

  const handleApplyCustomSalaryRange = () => {
    if (selectedCurrency === "all") {
      notify({
        message: "Please select currency",
        description: "You need to select VND, USD or EUR before entering the salary range.",
        type: "warning",
      });
      return;
    }

    if (!customSalaryFrom.trim() || !customSalaryTo.trim()) {
      notify({
        message: "Lack of salary range",
        description: "Please enter the full From and To.",
        type: "warning",
      });
      return;
    }

    const rawFrom = convertCustomSalaryInputToRaw(customSalaryFrom, selectedCurrency);
    const rawTo = convertCustomSalaryInputToRaw(customSalaryTo, selectedCurrency);

    if (rawFrom === null || rawTo === null) {
      notify({
        message: "Invalid salary range",
        description: "The entered value must be a valid number.",
        type: "error",
      });
      return;
    }

    if (rawFrom > rawTo) {
      notify({
        message: "Invalid salary range",
        description: "The From value must be less than or equal to To.",
        type: "error",
      });
      return;
    }

    setSelectedSalaryOption("custom");
    setAppliedCustomSalaryFrom(customSalaryFrom.trim());
    setAppliedCustomSalaryTo(customSalaryTo.trim());
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    appliedCustomSalaryFrom,
    appliedCustomSalaryTo,
    searchValue,
    selectedCurrency,
    selectedExperienceFilter,
    selectedGroupId,
    selectedRankId,
    selectedSalaryOption,
    selectedTypeOfJob,
  ]);

  const groupOptions = useMemo(
    () => [
      { id: "", name: "All fields" },
      ...(groupsData?.data ?? [])
        .map((item) => ({ id: item.id ?? "", name: item.name_group ?? "" }))
        .filter((item) => Boolean(item.id) && Boolean(item.name)),
    ],
    [groupsData?.data],
  );

  const rankOptions = useMemo(
    () =>
      (careerOptionsData?.ranks ?? [])
        .map((item) => {
          const name = item.name?.trim() ?? "";
          return { id: item.id ?? "", name };
        })
        .filter((item) => Boolean(item.id) && Boolean(item.name)),
    [careerOptionsData?.ranks],
  );

  const realJobs = useMemo(() => {
    const list = (jobsData?.data ?? []) as IRecruitmentInfor[];

    return list.filter((job) => {
      const daysLeft = getDaysLeft(job.application_deadline);
      if (daysLeft === null || daysLeft < 0) return false;

      const matchesGroup =
        !selectedGroupId ||
        job.position_post_id === selectedGroupId ||
        job.positionPost?.id === selectedGroupId ||
        job.positionPost?.group?.id === selectedGroupId;

      const matchesLocation =
        !selectedLocationId ||
        job.work_location_id === selectedLocationId ||
        job.workLocation?.id === selectedLocationId;

      const matchesRank =
        !selectedRankId ||
        job.rank_id === selectedRankId ||
        job.rank?.id === selectedRankId;

      const matchesType =
        !selectedTypeOfJob || normalizeJobType(job.type_of_job) === normalizeJobType(selectedTypeOfJob);
      const matchesExperience = matchesExperienceFilter(job, selectedExperienceFilter);
      const matchesSalary = doesJobMatchSalaryFilter(job, {
        selectedCurrency,
        selectedSalaryOption,
        appliedCustomSalaryFrom,
        appliedCustomSalaryTo,
      });

      const keyword = normalize(searchValue);
      if (!keyword) {
        return matchesGroup && matchesLocation && matchesRank && matchesType && matchesExperience && matchesSalary;
      }

      const haystack = [
        job.post_title,
        job.internal_title,
        job.department?.full_name,
        job.department?.acronym_name,
        job.positionPost?.name_post,
        job.positionPost?.group?.name_group,
      ]
        .map((value) => normalize(value))
        .join(" ");

      return (
        matchesGroup &&
        matchesLocation &&
        matchesRank &&
        matchesType &&
        matchesExperience &&
        matchesSalary &&
        haystack.includes(keyword)
      );
    });
  }, [
    appliedCustomSalaryFrom,
    appliedCustomSalaryTo,
    jobsData?.data,
    selectedCurrency,
    selectedExperienceFilter,
    selectedGroupId,
    selectedLocationId,
    selectedRankId,
    selectedSalaryOption,
    selectedTypeOfJob,
    searchValue,
  ]);

  const suggestedJobs = useMemo(() => {
    const list = (jobsData?.data ?? []) as IRecruitmentInfor[];
    const availableJobs = list.filter((job) => {
      const daysLeft = getDaysLeft(job.application_deadline);
      return daysLeft !== null && daysLeft >= 0;
    });

    return [...availableJobs].sort(() => Math.random() - 0.5).slice(0, 10);
  }, [jobsData?.data]);

  const totalPages = Math.max(1, Math.ceil(realJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    return realJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);
  }, [currentPage, realJobs]);

  const firstVisibleJob = realJobs.length ? (currentPage - 1) * JOBS_PER_PAGE + 1 : 0;
  const lastVisibleJob = Math.min(currentPage * JOBS_PER_PAGE, realJobs.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const activeGroupName = useMemo(() => {
    if (!groupId) return null;
    const found = (groupsData?.data ?? []).find((g) => g.id === groupId);
    return found?.name_group || null;
  }, [groupId, groupsData?.data]);

  return (
    <Box
      w="full"
      px={{ base: 3, md: 15, xl: 130 }}
      mx="auto"
      pt={{ base: 4, md: 6 }}
      pb={{ base: 8, md: 10 }}
      
    >
      {/* Breadcrumb */}
      <HStack spacing={2} mb={4} fontSize="sm" color="#64748B" fontWeight="600">
        <Text
          cursor="pointer"
          _hover={{ color: "#334371" }}
          onClick={() => navigate("/it-job/jobs")}
        >
          Home page
        </Text>
        {activeGroupName && (
          <>
            <Text color="#94A3B8">›</Text>
            <Text color="#334371" fontWeight="700">{activeGroupName}</Text>
          </>
        )}
      </HStack>

      <Flex gap={{ base: 4, xl: 6 }} align="start" direction={{ base: "column", xl: "row" }}>
        <Box w={{ base: "full", xl: "320px" }} flexShrink={0}>
          <FilterSidebar
            selectedGroupId={selectedGroupId}
            onGroupChange={setSelectedGroupId}
            groupOptions={groupOptions}
            selectedExperienceFilter={selectedExperienceFilter}
            onExperienceFilterChange={setSelectedExperienceFilter}
            selectedCurrency={selectedCurrency}
            onSelectedCurrencyChange={handleCurrencyChange}
            selectedSalaryOption={selectedSalaryOption}
            onSelectedSalaryOptionChange={setSelectedSalaryOption}
            customSalaryFrom={customSalaryFrom}
            customSalaryTo={customSalaryTo}
            onCustomSalaryFromChange={setCustomSalaryFrom}
            onCustomSalaryToChange={setCustomSalaryTo}
            onApplyCustomRange={handleApplyCustomSalaryRange}
            selectedRankId={selectedRankId}
            onRankChange={setSelectedRankId}
            rankOptions={rankOptions}
            selectedTypeOfJob={selectedTypeOfJob}
            onTypeOfJobChange={setSelectedTypeOfJob}
            onClear={resetFilters}
          />
        </Box>

        <Box flex="1" minW={0}>
          <VStack align="stretch" spacing={4}>
            {isLoading ? (
              <Flex
                minH="280px"
                align="center"
                justify="center"
                bg="white"
                borderRadius="20px"
                border="1px solid #E2E8F0"
              >
                <Spinner size="lg" color="#334371" />
              </Flex>
            ) : realJobs.length > 0 ? (
              <VStack align="stretch" spacing={4}>
                {paginatedJobs.map((job) => (
                  <RealJobCard key={job.id} job={job} />
                ))}

             

                {totalPages > 1 ? (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                ) : null}
              </VStack>
            ) : (
              <VStack align="stretch" spacing={4}>
                <Box
                  bg="#F3F4F6"
                  borderRadius="16px"
                  p={{ base: 5, md: 6 }}
                >
                  <Flex direction="column" align="center" justify="center" textAlign="center" gap={3}>
                    <Image
                      src={emptySearchIllustration}
                      alt="No suitable job found"
                      w={{ base: "88px", md: "110px" }}
                      h={{ base: "88px", md: "110px" }}
                      objectFit="contain"
                    />

                    <Text
                      color="#2F4358"
                      fontSize="15px"
                      lineHeight="1.45"
                      maxW="980px"
                    >
                      Sorry, ITJob hasn't found a job that matches your criteria. Try changing{" "}
                      <Text as="span" fontWeight="700">
                        filter or keyword
                      </Text>{" "}
                      to expand search results.
                    </Text>

                    <Button
                      mt={0.5}
                      minW={{ base: "116px", md: "132px" }}
                      h={{ base: "36px", md: "40px" }}
                      borderRadius="999px"
                      bg="#ECECEC"
                      color="#C0392B"
                      fontSize="15px"
                      fontWeight="700"
                      _hover={{ bg: "#E3E3E3" }}
                      onClick={resetFilters}
                    >
                      Clear filtering
                    </Button>
                  </Flex>
                </Box>

                {suggestedJobs.length > 0 ? (
                  <Box>
                    <Text fontSize="15px" fontWeight="700" color="#334371" mb={3}>
                      Jobs you may be interested in
                    </Text>

                    <VStack align="stretch" spacing={4}>
                      {suggestedJobs.map((job) => (
                        <RealJobCard key={`suggested-${job.id}`} job={job} />
                      ))}
                    </VStack>
                  </Box>
                ) : null}
              </VStack>
            )}
          </VStack>
        </Box>
      </Flex>

      <Box mt={10}>
        <ITJobInfoSection />
      </Box>
    </Box>
  );
}
