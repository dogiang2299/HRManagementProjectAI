import {
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  SimpleGrid,
  Skeleton,
  Tag,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useState, type ElementType, type MouseEvent } from "react";
import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiClock,
  FiCloud,
  FiCode,
  FiCpu,
  FiDatabase,
  FiDollarSign,
  FiBookmark,
  FiInbox,
  FiLayers,
  FiMapPin,
  FiMonitor,
  FiPenTool,
  FiServer,
  FiShield,
  FiStar,
  FiUploadCloud,
  FiUser,
} from "react-icons/fi";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import theme from "../../../../theme";
import { useAuthStore } from "../../../auth/store/auth.store";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import formatBadgeLabel, { formatWorkTypeLabel } from "../../../../utils/formatText";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";
import { logo } from "../../../../assets/logo";
import {
  candidateLoginUrl,
  candidateMyCvUrl,
} from "../../../../routes/urls";
import CandidateLoginModal from "../../auth/components/CandidateLoginModal";
import { useGetMyCandidateProfile } from "../../profile/api/myCv";
import {
  useGetRecommendedJobs,
  type RecommendedJobItem,
} from "../api/getRecommendedJobs";
import { useCheckSavedJob, useToggleSaveJob } from "../api/saveJob";
import { formatSalary } from "../types/job";
import { translateRecommendationText } from "../utils";

const MAX_MATCHED_SKILLS = 3;
const MAX_MISSING_SKILLS = 3;

const WORK_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "full time": "Full-time",
  "part-time": "Part-time",
  "part time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  hybrid: "Hybrid",
  remote: "Remote",
};

const ACRONYM_SKILLS = new Set([
  "ai",
  "api",
  "aws",
  "bi",
  "c#",
  "c++",
  "ci/cd",
  "css",
  "cv",
  "gcp",
  "html",
  "ios",
  "jd",
  "js",
  "ml",
  "nlp",
  "qa",
  "sql",
  "ui",
  "ux",
]);

const INDUSTRY_ICON_RULES: Array<{
  keywords: string[];
  icon: ElementType;
  bg: string;
  color: string;
}> = [
  {
    keywords: ["data", "analytics", "business intelligence", "bi", "etl"],
    icon: FiDatabase,
    bg: "#EAF2FF",
    color: "#2563EB",
  },
  {
    keywords: ["ai", "machine learning", "ml", "deep learning", "computer vision", "nlp"],
    icon: FiCpu,
    bg: "#EEF2FF",
    color: "#4F46E5",
  },
  {
    keywords: ["frontend", "backend", "developer", "software", "engineer", "programmer"],
    icon: FiCode,
    bg: "#ECFDF5",
    color: "#047857",
  },
  {
    keywords: ["cloud", "devops", "sre", "infrastructure"],
    icon: FiCloud,
    bg: "#EFF6FF",
    color: "#0284C7",
  },
  {
    keywords: ["security", "cyber", "secops"],
    icon: FiShield,
    bg: "#FFF7ED",
    color: "#EA580C",
  },
  {
    keywords: ["product", "designer", "design", "ui", "ux"],
    icon: FiPenTool,
    bg: "#FDF2F8",
    color: "#DB2777",
  },
  {
    keywords: ["network", "system", "server"],
    icon: FiServer,
    bg: "#F1F5F9",
    color: "#334155",
  },
  {
    keywords: ["marketing", "growth", "sales", "business"],
    icon: FiBarChart2,
    bg: "#FFF7ED",
    color: "#C2410C",
  },
  {
    keywords: ["mobile", "android", "ios"],
    icon: FiMonitor,
    bg: "#F0FDFA",
    color: "#0F766E",
  },
];

const cleanText = (value?: string | null) => {
  const text = (value || "").trim();
  if (!text || text.toLowerCase() === "updating") return "";
  return text;
};

const getUnknownErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  };
  const message = maybeError.response?.data?.message ?? maybeError.message ?? fallback;

  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" && message.trim() ? message : fallback;
};

const getRoleName = (role: unknown) => {
  if (typeof role === "string") return role;

  const roleLike = role as {
    role?: { name_role?: string | null };
    name_role?: string | null;
    name?: string | null;
  };

  return roleLike.role?.name_role || roleLike.name_role || roleLike.name || "";
};

const toPercent = (score?: number | null) => {
  if (typeof score !== "number" || !Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score <= 1 ? score * 100 : score)));
};

const getOverallScore = (job: RecommendedJobItem) =>
  toPercent(job.match_detail?.overall?.score ?? job.score_breakdown?.finalScore);

const hasNumber = (value?: number | null): value is number =>
  typeof value === "number" && Number.isFinite(value);

const compactYear = (value: number) => `${value} ${value === 1 ? "year" : "years"}`;

const formatExperienceRequirement = (job: RecommendedJobItem) => {
  const type = cleanText(job.experience_type).toLowerCase();
  const min = hasNumber(job.experience_min) ? job.experience_min : null;
  const max = hasNumber(job.experience_max) ? job.experience_max : null;

  if (type === "none") return "No experience required";

  if (type === "exact") {
    const value = min ?? max;
    if (hasNumber(value)) {
      return value <= 0 ? "No experience required" : `${compactYear(value)} of experience`;
    }
  }

  if (type === "range") {
    if (hasNumber(min) && hasNumber(max)) {
      if (min <= 0 && max <= 0) return "No experience required";
      if (min === max) return `${compactYear(min)} of experience`;
      return `${min} - ${max} years`;
    }
    if (hasNumber(min)) return min <= 0 ? "No experience required" : `From ${compactYear(min)}`;
    if (hasNumber(max)) return max <= 0 ? "No experience required" : `Up to ${compactYear(max)}`;
  }

  if (type === "above") {
    if (hasNumber(min)) return min <= 0 ? "No experience required" : `${min}+ years of experience`;
  }

  if (type === "below") {
    if (hasNumber(max)) return max <= 0 ? "No experience required" : `Under ${compactYear(max)}`;
  }

  if (type === "flexible") return "Flexible experience";

  if (hasNumber(min) && hasNumber(max)) {
    if (min <= 0 && max <= 0) return "No experience required";
    if (min === max) return `${compactYear(min)} of experience`;
    return `${min} - ${max} years`;
  }

  if (hasNumber(min)) return min <= 0 ? "No experience required" : `${min}+ years of experience`;
  if (hasNumber(max)) return max <= 0 ? "No experience required" : `Up to ${compactYear(max)}`;

  return cleanText(job.experience_label) || "";
};

const formatJobTypeLabel = (value?: string | null) => {
  const text = cleanText(value);
  if (!text) return "";
  return WORK_TYPE_LABELS[text.toLowerCase()] || formatWorkTypeLabel(text);
};

const formatSkillLabel = (value?: string | null) => {
  const text = cleanText(value);
  if (!text) return "";
  return ACRONYM_SKILLS.has(text.toLowerCase()) ? text.toUpperCase() : formatBadgeLabel(text);
};

const getIndustryVisual = (job: RecommendedJobItem) => {
  const haystack = [
    job.group_name,
    job.position_name,
    job.post_title,
    job.internal_title,
    job.company_name,
  ]
    .map((value) => cleanText(value).toLowerCase())
    .filter(Boolean)
    .join(" ");

  return (
    INDUSTRY_ICON_RULES.find((item) =>
      item.keywords.some((keyword) => haystack.includes(keyword))
    ) || {
      icon: FiBriefcase,
      bg: "#EEF4FF",
      color: "#334371",
    }
  );
};

const getLocationLabel = (job: RecommendedJobItem) =>
  cleanText(
    job.work_location?.short_address ||
      job.work_location?.full_name ||
      job.work_location?.name ||
      job.company_short_address
  );

const getSalaryLabel = (job: RecommendedJobItem) => {
  const hasSalary = hasNumber(job.salary_from) || hasNumber(job.salary_to);

  if (hasSalary) {
    const label = formatSalary(job.salary_from, job.salary_to, job.salary_currency);
    return label === "Agreement" ? "Negotiable salary" : label;
  }

  if (job.is_salary_negotiable) {
    return "Negotiable salary";
  }

  return "";
};

const getRecommendationSummary = (job: RecommendedJobItem) => {
  const parts: string[] = [];
  const skillAnalysis = job.match_detail?.skillAnalysis;
  const semanticScore = toPercent(
    job.match_detail?.dimensions?.semantic?.score ??
      job.score_breakdown?.semanticScore
  );

  if (skillAnalysis && skillAnalysis.requiredCount > 0) {
    parts.push(
      `Matches ${skillAnalysis.matchedCount}/${skillAnalysis.requiredCount} required skills.`
    );
  }

  if (semanticScore >= 70) {
    parts.push("High CV/JD semantic similarity.");
  }

  return (
    parts.join(" ") ||
    translateRecommendationText(cleanText(job.match_detail?.overall?.description)) ||
    translateRecommendationText(cleanText(job.reason_texts?.join(" ")))
  );
};

const getMatchedSkills = (job: RecommendedJobItem) => {
  const skills = job.match_detail?.skillAnalysis?.matchedSkills?.length
    ? job.match_detail.skillAnalysis.matchedSkills
    : job.matched_skills ?? [];
  return skills.filter(Boolean);
};

const getMissingSkills = (job: RecommendedJobItem) => {
  const skills = job.match_detail?.skillAnalysis?.missingSkills?.length
    ? job.match_detail.skillAnalysis.missingSkills
    : job.missing_skills ?? [];
  return skills.filter(Boolean);
};

const SectionCard = ({
  title,
  description,
  icon,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
}: {
  title: string;
  description: string;
  icon: ElementType;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}) => {
  return (
    <Box
      bg="linear-gradient(180deg, #F8FBFF 0%, #EEF4FF 100%)"
      border="1px solid"
      borderColor="#D7E3FF"
      
      borderRadius="24px"
      p={{ base: 5, md: 6 }}
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap={5}
        w="full"
      >
        <HStack align="flex-start" spacing={4} flex="1" minW={0}>
          <Flex
            w="56px"
            h="56px"
            borderRadius="18px"
            bg="#334371"
            color="white"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={icon} boxSize={6} />
          </Flex>

          <VStack align="start" spacing={1}>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="800"
              color="#233142"
            >
              {title}
            </Text>
            <Text color="#516173" fontSize="md" lineHeight="1.7">
              {description}
            </Text>
          </VStack>
        </HStack>

        <VStack
          spacing={3}
          align={{ base: "stretch", md: "flex-end" }}
          alignSelf={{ base: "stretch", md: "center" }}
          ml={{ base: 0, md: "auto" }}
          flexShrink={0}
        >
          <Button
            as={RouterLink}
            to={primaryTo}
            bg="#334371"
            color="white"
            borderRadius="13px"
            px={5}
            w={{ base: "full", md: "200px" }}
            _hover={{ bg: "#2A365D" }}
            rightIcon={<FiArrowRight />}
          >
            {primaryLabel}
          </Button>

          {secondaryLabel && secondaryTo ? (
            <Button
              as={RouterLink}
              to={secondaryTo}
              variant="outline"
              borderColor="#334371"
              color="#334371"
              borderRadius="13px"
              px={5}
              w={{ base: "full", md: "200px" }}
              _hover={{ bg: "#F7FAFF" }}
            >
              {secondaryLabel}
            </Button>
          ) : null}
        </VStack>
      </Flex>
    </Box>
  );
};

const RecommendedJobCard = ({
  job,
  isCandidateLoggedIn,
}: {
  job: RecommendedJobItem;
  isCandidateLoggedIn: boolean;
}) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const toggleSaveJobMutation = useToggleSaveJob();
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();
  const { data: savedState } = useCheckSavedJob(job.recruitment_id, {
    enabled: Boolean(job.recruitment_id && isCandidateLoggedIn),
  });
  const savedLocal = savedOverride ?? Boolean(savedState?.is_saved);

  const title = cleanText(job.post_title) || cleanText(job.internal_title) || "Suggested job";
  const companyName = cleanText(job.company_name);
  const companySubtitle = [companyName, cleanText(job.group_name)].filter(Boolean).join(" · ");
  const companyLogo = resolveCompanyLogoUrl(job.company_logo);
  const industryVisual = getIndustryVisual(job);
  const IndustryIcon = industryVisual.icon;
  const score = getOverallScore(job);
  const scoreLabel = translateRecommendationText(cleanText(job.match_detail?.overall?.label)) || (score >= 60 ? "Good fit" : "Consider");
  const location = getLocationLabel(job) || "Location not updated";
  const experienceLabel = formatExperienceRequirement(job) || "Experience not updated";
  const workTypeLabel = formatJobTypeLabel(job.type_of_job) || "Job type not updated";
  const salaryLabel = getSalaryLabel(job);
  const summary = getRecommendationSummary(job);
  const matchedSkills = getMatchedSkills(job);
  const missingSkills = getMissingSkills(job);
  const visibleMatchedSkills = matchedSkills.slice(0, MAX_MATCHED_SKILLS);
  const visibleMissingSkills = missingSkills.slice(0, MAX_MISSING_SKILLS);
  const extraMatchedCount = Math.max(matchedSkills.length - MAX_MATCHED_SKILLS, 0);
  const extraMissingCount = Math.max(missingSkills.length - MAX_MISSING_SKILLS, 0);
  const metaItems = [
    { label: experienceLabel, icon: FiBriefcase },
    { label: workTypeLabel, icon: FiClock },
    { label: location, icon: FiMapPin },
    ...(salaryLabel ? [{ label: salaryLabel, icon: FiDollarSign }] : []),
  ].filter((item) => cleanText(item.label));

  const openJobDetail = () => {
    sessionStorage.setItem(
      `recommendation-detail:${job.recruitment_id}`,
      JSON.stringify(job)
    );

    navigate(`/it-job/jobs/${job.recruitment_id}?source=recommendation`, {
      state: {
        fromRecommendation: true,
        recommendation: job,
      },
    });
  };

  const saveJob = async () => {
    try {
      const res = await toggleSaveJobMutation.mutateAsync(job.recruitment_id);
      setSavedOverride(Boolean(res?.saved));

      notify({
        message: res?.message || (res?.saved ? "Job posting saved" : "Job posting unsaved"),
        type: "success",
      });
    } catch (error: unknown) {
      notify({
        message: "An error occurred",
        description: getUnknownErrorMessage(error, "Unable to save this job posting right now"),
        type: "error",
      });
    }
  };

  const ensureCandidateLogin = () => {
    if (isCandidateLoggedIn) return true;

    notify({
      message: "Please log in",
      description: "You need to log in to your candidate account to save job postings.",
      type: "warning",
    });
    onLoginOpen();
    return false;
  };

  const handleSaveJobClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!ensureCandidateLogin()) return;
    await saveJob();
  };

  const handleViewJobClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    openJobDetail();
  };

  return (
    <>
      <Box
        bg="white"
        borderRadius="18px"
        border="1px solid"
        borderColor="#E5EAF2"
        boxShadow="0 10px 30px rgba(15, 23, 42, 0.07)"
        p={{ base: 4, md: 5 }}
        minH="326px"
        h="100%"
        display="flex"
        transition="all 0.2s ease"
        _hover={{
          transform: "translateY(-3px)",
          boxShadow: "0 18px 38px rgba(15, 23, 42, 0.12)",
          borderColor: "#C8D3E3",
        }}
        cursor="pointer"
        onClick={openJobDetail}
      >
        <VStack align="stretch" spacing={4} flex="1" minH={0}>
          <Flex justify="space-between" align="flex-start" gap={4}>
            <Flex gap={3.5} align="flex-start" minW={0} flex="1">
              <Flex
                w="64px"
                h="64px"
                minW="64px"
                borderRadius="18px"
                bg={companyLogo ? "#F8FAFC" : industryVisual.bg}
                border="1px solid #E7EDF6"
                align="center"
                justify="center"
                overflow="hidden"
                boxShadow="inset 0 0 0 1px rgba(255,255,255,0.7)"
              >
                {companyLogo ? (
                  <Image
                    src={companyLogo}
                    alt={companyName || title}
                    objectFit="contain"
                    w="100%"
                    h="100%"
                    onError={(event) => {
                      const image = event.currentTarget;
                      if (image.dataset.fallbackApplied === "1") return;
                      image.dataset.fallbackApplied = "1";
                      image.src = logo;
                    }}
                  />
                ) : (
                  <Icon as={IndustryIcon} boxSize={7} color={industryVisual.color} />
                )}
              </Flex>

              <Box minW={0} pt={1}>
                <Text
                  fontSize={{ base: "16px", md: "18px" }}
                  fontWeight="800"
                  color="#172033"
                  lineHeight="1.35"
                  noOfLines={2}
                >
                  {title}
                </Text>

                {companySubtitle ? (
                  <Text
                    mt={1}
                    color="#52627A"
                    fontSize="13px"
                    fontWeight="700"
                    lineHeight="1.45"
                    noOfLines={1}
                  >
                    {companySubtitle}
                  </Text>
                ) : null}
              </Box>
            </Flex>

            <VStack spacing={1} flexShrink={0} align="center">
              <CircularProgress
                value={score}
                size="62px"
                thickness="9px"
                color={score >= 60 ? "#2F80ED" : "#F59E0B"}
                trackColor="#EEF2F7"
              >
                <CircularProgressLabel>
                  <Text fontSize="14px" fontWeight="900" color="#23345D">
                    {score}%
                  </Text>
                </CircularProgressLabel>
              </CircularProgress>
              <Text fontSize="12px" fontWeight="800" color="#52627A" noOfLines={1}>
                {scoreLabel}
              </Text>
            </VStack>
          </Flex>

          <HStack spacing={2} flexWrap="wrap">
            {metaItems.slice(0, 4).map((item, index) => (
              <Tag
                key={`${item.label}-${index}`}
                borderRadius="full"
                bg="#F4F6FA"
                color="#334155"
                px={3}
                py={1.5}
                fontSize="12px"
                fontWeight="800"
                maxW={{ base: "100%", md: "210px" }}
                minH="32px"
              >
                <Icon as={item.icon} boxSize={3.5} mr={2} color="#748094" flexShrink={0} />
                <Text noOfLines={1}>{item.label}</Text>
              </Tag>
            ))}
          </HStack>

          {summary ? (
            <HStack align="flex-start" spacing={2.5}>
              <Icon as={FiStar} boxSize={4} color="#2F80ED" mt="3px" flexShrink={0} />
              <Text color="#425466" fontSize="13px" lineHeight="1.7" noOfLines={2}>
                {summary}
              </Text>
            </HStack>
          ) : null}

          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
            <VStack align="start" spacing={2}>
              <Text fontSize="13px" fontWeight="900" color="#334371">
                Matching skills
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                {visibleMatchedSkills.length > 0 ? (
                  visibleMatchedSkills.map((skill) => (
                    <Tag
                      key={skill}
                      borderRadius="full"
                      bg="#EAF7EF"
                      color="#167340"
                      px={3}
                      py={1.5}
                      fontSize="12px"
                      fontWeight="800"
                    >
                      {formatSkillLabel(skill)}
                    </Tag>
                  ))
                ) : (
                  <Text fontSize="12px" color="#7A8699" fontWeight="600">
                    No data yet
                  </Text>
                )}
                {extraMatchedCount > 0 ? (
                  <Tag
                    borderRadius="full"
                    bg="#EDF2F7"
                    color="#334155"
                    px={2.5}
                    py={1.5}
                    fontSize="12px"
                    fontWeight="800"
                  >
                    +{extraMatchedCount}
                  </Tag>
                ) : null}
              </HStack>
            </VStack>

            <VStack align="start" spacing={2}>
              <Text fontSize="13px" fontWeight="900" color="#334371">
                Skills to add
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                {visibleMissingSkills.length > 0 ? (
                  visibleMissingSkills.map((skill) => (
                    <Tag
                      key={skill}
                      borderRadius="full"
                      bg="#FFF4E5"
                      color="#C56A14"
                      px={3}
                      py={1.5}
                      fontSize="12px"
                      fontWeight="800"
                    >
                      {formatSkillLabel(skill)}
                    </Tag>
                  ))
                ) : (
                  <Text fontSize="12px" color="#7A8699" fontWeight="600">
                    None
                  </Text>
                )}
                {extraMissingCount > 0 ? (
                  <Text fontSize="12px" fontWeight="900" color="#B45309">
                    +{extraMissingCount}
                  </Text>
                ) : null}
              </HStack>
            </VStack>
          </SimpleGrid>

          <Flex
            mt="auto"
            pt={3}
            borderTop="1px solid #EEF2F6"
            align="center"
            justify="space-between"
            gap={3}
          >
            <HStack spacing={2} minW={0}>
              <Tooltip label={savedLocal ? "Unsave job" : "Save job"}>
                <IconButton
                  aria-label={savedLocal ? "Unsave job" : "Save job"}
                  type="button"
                  w="38px"
                  h="38px"
                  minW="38px"
                  borderRadius="12px"
                  variant="ghost"
                  color={savedLocal ? "white" : "#334371"}
                  bg={savedLocal ? "#334371" : "white"}
                  border="1px solid #D8E1EE"
                  icon={<Icon as={FiBookmark} boxSize={4} fill={savedLocal ? "currentColor" : "none"} />}
                  isLoading={toggleSaveJobMutation.isPending}
                  _hover={{ bg: savedLocal ? "#26365F" : "#F3F7FF" }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={handleSaveJobClick}
                />
              </Tooltip>

              {job.position_name ? (
                <Tag
                  borderRadius="full"
                  bg="#EEF4FF"
                  color="#334371"
                  px={3}
                  py={1.5}
                  fontSize="12px"
                  fontWeight="900"
                  maxW={{ base: "150px", md: "170px" }}
                >
                  <Icon as={FiLayers} boxSize={3.5} mr={1.5} flexShrink={0} />
                  <Text noOfLines={1}>{job.position_name}</Text>
                </Tag>
              ) : null}
            </HStack>

            <Button
              type="button"
              size="sm"
              borderRadius="13px"
              bg="#EDF4FF"
              color="#2B5FCC"
              px={4}
              rightIcon={<FiArrowRight />}
              _hover={{ bg: "#DDEAFF" }}
              onClick={handleViewJobClick}
              flexShrink={0}
            >
              View job
            </Button>
          </Flex>
        </VStack>
      </Box>

      <CandidateLoginModal
        isOpen={isLoginOpen}
        onClose={onLoginClose}
        onSuccess={saveJob}
      />
    </>
  );
};

const RecommendedSkeleton = () => {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="20px">
      {Array.from({ length: 3 }).map((_, index) => (
        <Box
          key={index}
          bg="white"
          borderRadius="24px"
          border="1px solid #E5EAF2"
          p={5}
        >
          <VStack align="stretch" spacing={4}>
            <Flex justify="space-between" gap={4}>
              <HStack spacing={3.5} flex="1">
                <Skeleton width="64px" height="64px" borderRadius="18px" />
                <VStack align="stretch" spacing={2} flex="1">
                  <Skeleton height="20px" borderRadius="8px" />
                  <Skeleton height="14px" width="70%" borderRadius="8px" />
                </VStack>
              </HStack>
              <Skeleton width="62px" height="62px" borderRadius="full" />
            </Flex>
            <HStack spacing={2}>
              <Skeleton height="32px" width="120px" borderRadius="full" />
              <Skeleton height="32px" width="110px" borderRadius="full" />
              <Skeleton height="32px" width="90px" borderRadius="full" />
            </HStack>
            <Skeleton height="40px" borderRadius="12px" />
            <SimpleGrid columns={2} spacing={4}>
              <Skeleton height="64px" borderRadius="12px" />
              <Skeleton height="64px" borderRadius="12px" />
            </SimpleGrid>
            <Skeleton height="40px" borderRadius="12px" />
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default function JobSuggestion() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);

  const roleNames = (authUser?.roles ?? [])
    .map(getRoleName)
    .filter(Boolean);

  const isCandidateLoggedIn = Boolean(
    isAuthenticated && roleNames.includes(RECRUIT_BASE_ROLE.Candidate)
  );

  const {
    data: candidateProfile,
    isLoading: isProfileLoading,
  } = useGetMyCandidateProfile();

  const hasCv = Boolean(candidateProfile?.cv_file);
  const canLoadRecommendations = isCandidateLoggedIn && hasCv;

  const {
    data: recommendedData,
    isLoading: isRecommendationLoading,
    isError: isRecommendationError,
  } = useGetRecommendedJobs(
    { limit: 6 },
    {
      enabled: canLoadRecommendations,
    }
  );

  const jobs = recommendedData?.items ?? [];

  return (
    <VStack color={theme.colors.candidate.primary} spacing={6} align="stretch" mt={4}>
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap={3}
      >
        <VStack align="start" spacing={1}>
          <Text
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="bold"
            textTransform="uppercase"
            textAlign="left"
          >
            Suggested jobs for you
          </Text>
          <Text color="#637487" fontSize="md">
            Based on your profile, CV, and match level with each job posting.
          </Text>
        </VStack>

        {canLoadRecommendations ? (
          <Button
            as={RouterLink}
            to="/it-job/recommended-jobs"
            variant="outline"
            borderColor="#334371"
            color="#334371"
            borderRadius="13px"
            rightIcon={<FiArrowRight />}
            _hover={{ bg: "#F7FAFF" }}
          >
            View all
          </Button>
        ) : null}
      </Flex>

      {!isCandidateLoggedIn ? (
        <SectionCard
          title="Log in to see jobs suggested specifically for you"
          description="When you log in to your candidate account, the system will begin personalizing the job list and prioritizing positions that are more suitable for you."
          icon={FiUser}
          primaryLabel="Candidate login"
          primaryTo={candidateLoginUrl}
        />
      ) : isProfileLoading ? (
        <RecommendedSkeleton />
      ) : !hasCv ? (
        <SectionCard
          title="Download your CV to receive more accurate suggestions"
          description="You're already logged in, but the system still needs your CV or more complete profile to create a suitable job listing specifically for you."
          icon={FiUploadCloud}
          primaryLabel="Download your CV now"
          primaryTo={candidateMyCvUrl}
        />
      ) : isRecommendationLoading ? (
        <RecommendedSkeleton />
      ) : isRecommendationError ? (
        <Box
          bg="white"
          borderRadius="20px"
          border="1px solid"
          borderColor="#E2E8F0"
          p="24px"
        >
          <Flex direction="column" align="center" justify="center" py={10} gap={3}>
            <Icon as={FiInbox} boxSize={12} color="#334371" />
            <Text color="#334371" fontSize="lg" fontWeight="700" textAlign="center">
              Unable to load suggested jobs right now
            </Text>
            <Text color="#6B7280" textAlign="center" maxW="720px">
              You can still view the full job list below.
            </Text>
          </Flex>
        </Box>
      ) : jobs.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="20px">
          {jobs.map((job) => (
            <RecommendedJobCard
              key={job.recruitment_id}
              job={job}
              isCandidateLoggedIn={isCandidateLoggedIn}
            />
          ))}
        </SimpleGrid>
      ) : (
        <SectionCard
          title="There are no suitable suggestions at this time"
          description="The system has not found a suitable enough job according to your current profile. Update your CV for better suggestions from the system."
          icon={FiBriefcase}
          primaryLabel="Update CV"
          primaryTo={candidateMyCvUrl}
        />
      )}
    </VStack>
  );
}
