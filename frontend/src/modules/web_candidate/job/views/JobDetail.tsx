import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDisclosure } from "@chakra-ui/react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Container,
  Divider,
  Flex,
  Grid,
  HStack,
  Icon,
  IconButton,
  SimpleGrid,
  Spinner,
  Stack,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiDollarSign,
  FiFacebook,
  FiFileText,
  FiGift,
  FiGrid,
  FiBookmark,
  FiHome,
  FiLink2,
  FiLinkedin,
  FiMapPin,
  FiMessageCircle,
  FiSend,
  FiShare2,
  FiShield,
  FiStar,
  FiTrendingUp,
  FiTwitter,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import type { RecommendedJobItem } from "../api/getRecommendedJobs";
import type { IRecInformData } from "../types/job";
import { useGetJobDetail } from "../api/getJobDetail";
import { useGetJobs } from "../api/getJobs";
import { useGetCandidateApplicationState } from "../api/applyJob";
import { useCheckSavedJob, useToggleSaveJob } from "../api/saveJob";
import { RealJobCard } from "./JobsByGroup";
import { useAuthStore } from "../../../auth/store/auth.store";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { BASE_URL } from "../../../../constant/config";
import { candidateConversationUrl, candidateJobsByGroupUrl, candidateJobsByLocationUrl } from "../../../../routes/urls";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import ApplyJobModal from "../components/ApplyJobModal";
import ITJobInfoSection from "../../home/components/ITJobInfoSection";
import { formatSkillName, translateRecommendationText } from "../utils";
import CandidateLoginModal from "../../auth/components/CandidateLoginModal";
import { formatWorkTypeLabel } from "../../../../utils/formatText";
import SectionCard from "../components/SectionCard";
import InfoRow from "../components/InforRow";

const green = "#334371";
const pageBg = "#FFFFFF";
const cardBg = "#FFFFFF";
const borderColor = "#E5E7EB";
const textMain = "#1F2937";
const textSub = "#6B7280";
const detailContainerMaxW = "1200px";

const toAbsoluteCompanyLogoUrl = (value?: string | null) => {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;

  const cleaned = raw.startsWith("/") ? raw : `/uploads/logo/${raw}`;
  if (!BASE_URL) return cleaned;

  try {
    const origin = new URL(BASE_URL).origin;
    return `${origin}${cleaned}`;
  } catch {
    return cleaned;
  }
};

const SidebarItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement;
  label: string;
  value?: React.ReactNode;
}) => {
  return (
    <HStack align="start" spacing={3}>
      <Flex
        w="36px"
        h="36px"
        minW="36px"
        align="center"
        justify="center"
        borderRadius="full"
        bg={green}
        color="white"
      >
        <Icon as={() => icon} boxSize={3.5} />
      </Flex>

      <Box>
        <Text fontSize="sm" color={textSub} lineHeight="1.4">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="600" color={textMain} lineHeight="1.45">
          {value ?? "--"}
        </Text>
      </Box>
    </HStack>
  );
};

const RecommendationCard = ({
  children,
  id,
  p = { base: 3.5, md: 4 },
}: {
  children: React.ReactNode;
  id?: string;
  p?: React.ComponentProps<typeof Box>["p"];
}) => (
  <Box
    id={id}
    bg="white"
    border="1px solid"
    borderColor="#E3E9F3"
    borderRadius="12px"
    p={p}
    boxShadow="0 8px 22px rgba(15, 23, 42, 0.045)"
    scrollMarginTop="84px"
    
  >
    {children}
  </Box>
);

const RecommendationSectionTitle = ({
  icon,
  title,
}: {
  icon: React.ReactElement;
  title: string;
}) => (
  <HStack spacing={2.5} mb={3}>
    <Flex
      w="26px"
      h="26px"
      minW="26px"
      borderRadius="9px"
      align="center"
      justify="center"
      bg="#EEF4FF"
      color={green}
    >
      <Icon as={() => icon} boxSize={3.5} />
    </Flex>
    <Text fontSize="16px" fontWeight="900" color="#172033" lineHeight="1.25">
      {title}
    </Text>
  </HStack>
);

const RecommendationMetaPill = ({
  icon,
  label,
}: {
  icon: React.ReactElement;
  label: React.ReactNode;
}) => (
  <Tag
    borderRadius="10px"
    bg="#F8FAFC"
    border="1px solid #E1E7F0"
    color="#344054"
    px={2.5}
    py={1.5}
    fontSize="12.5px"
    fontWeight="800"
    minH="32px"
  >
    <Icon as={() => icon} boxSize={3.5} mr={2} color="#667085" />
    <Text noOfLines={1}>{label}</Text>
  </Tag>
);

const MatchRing = ({
  score,
  label,
  size = "104px",
}: {
  score: number;
  label: string;
  size?: string;
}) => (
  <VStack spacing={1.5} flexShrink={0}>
    <CircularProgress
      value={score}
      size={size}
      thickness="9px"
      color="#2F80ED"
      trackColor="#E9EFFB"
    >
      <CircularProgressLabel>
        <Text fontSize="26px" fontWeight="900" color="#172033">
          {score}%
        </Text>
      </CircularProgressLabel>
    </CircularProgress>
    <Text color="#344054" fontSize="12px" fontWeight="800">
      {label}
    </Text>
  </VStack>
);

/* ── Benefit More Tabs ── */
const BENEFIT_MORE_TABS = [
  { key: "competitive_salary", label: "Competitive salary" },
  { key: "professional_environment", label: "Professional environment" },
  { key: "training_and_development", label: "Training and development" },
  { key: "career_opportunities", label: "Career opportunities" },
  { key: "allowances_and_welfare", label: "Allowances and benefits" },
] as const;

function BenefitMoreTabs({ benefitMore }: { benefitMore: Record<string, string | null | undefined> }) {
  const [activeTab, setActiveTab] = useState(0);

  const availableTabs = BENEFIT_MORE_TABS.filter(
    (tab) => benefitMore[tab.key] && benefitMore[tab.key]!.trim().length > 0,
  );

  if (availableTabs.length === 0) return null;

  const activeContent = benefitMore[availableTabs[activeTab]?.key] || "";

  return (
    <Box>
      <Text fontSize="md" fontWeight="700" color="#172033" mb={3}>
        Benefit details
      </Text>
      <HStack spacing={0} overflowX="auto"  mb={3}>
        {availableTabs.map((tab, idx) => (
          <Button
            key={tab.key}
            variant="ghost"
            size="sm"
            borderRadius="0"
            borderBottom={idx === activeTab ? "2px solid #334371" : "2px solid transparent"}
            color={idx === activeTab ? "#334371" : "#6B7280"}
            fontWeight={idx === activeTab ? "700" : "500"}
            fontSize="13px"
            px={3}
            py={2}
            mb="2px"
            _hover={{ bg: "#F4F7FB", color: "#334371" }}
            onClick={() => setActiveTab(idx)}
            whiteSpace="nowrap"
          >
            {tab.label}
          </Button>
        ))}
      </HStack>
      <Box
        fontSize="sm"
        color="#344054"
        lineHeight="1.8"
        dangerouslySetInnerHTML={{ __html: activeContent }}
      />
    </Box>
  );
}

function getScoreTone(score: number) {
  if (score >= 80) {
    return { bg: "#EEF1F8", color: "#2A3A63", icon: "#334371", bar: "#334371" };
  }

  if (score >= 60) {
    return { bg: "#F0F3FA", color: "#3D5289", icon: "#4A6199", bar: "#4A6199" };
  }

  if (score >= 40) {
    return { bg: "#FFF4E5", color: "#C56A14", icon: "#F59E0B", bar: "#F59E0B" };
  }

  return { bg: "#FEF3F2", color: "#B42318", icon: "#F04438", bar: "#F04438" };
}

const MiniProgressCard = ({
  title,
  description,
  score,
}: {
  title: string;
  description: string;
  score: number;
}) => {
  const tone = getScoreTone(score);

  return (
    <Box
      border="1px solid #E3E9F3"
      borderRadius="10px"
      p={3}
      bg="white"
      h="100%"
      display="flex"
      flexDirection="column"
    >
      <HStack justify="space-between" align="flex-start" spacing={3}>
        <Box minW={0} flex="1">
          <Text
            fontSize="13.5px"
            fontWeight="900"
            color="#172033"
            whiteSpace="normal"
          >
            {title}
          </Text>

          <Text
            mt={1}
            mb={1}
            fontSize="13px"
            color="#52627A"
            lineHeight="1.55"
            whiteSpace="normal"
          >
            {description}
          </Text>
        </Box>

        <Tag
          borderRadius="full"
          bg={tone.bg}
          color={tone.color}
          fontWeight="900"
          flexShrink={0}
        >
          {score}%
        </Tag>
      </HStack>

      <Box
        h="7px"
        bg="#EDF1F7"
        borderRadius="full"
        overflow="hidden"
        mt="auto"
      >
        <Box
          h="100%"
          w={`${score}%`}
          bg={tone.bar}
          borderRadius="full"
          transition="width 0.25s ease"
        />
      </Box>
    </Box>
  );
};

const QuickInfoLine = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement;
  label: string;
  value: React.ReactNode;
}) => (
  <HStack align="start" spacing={3}>
    <Icon as={() => icon} boxSize={4} color="#667085" mt="2px" flexShrink={0} />
    <Text w="92px" flexShrink={0} color="#52627A" fontSize="14px" fontWeight="700">
      {label}
    </Text>
    <Text color="#172033" fontSize="13px" fontWeight="800" lineHeight="1.45">
      {value}
    </Text>
  </HStack>
);

const BulletList = ({
  items,
  emptyText = "Updating",
}: {
  items: string[];
  emptyText?: string;
}) => {
  if (!items.length) {
    return (
      <Text color="#667085" fontSize="13px">
        {emptyText}
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={2}>
      {items.map((item, index) => (
        <HStack key={`${item}-${index}`} align="start" spacing={2.5}>
          <Box w="5px" h="5px" borderRadius="full" bg={green} mt="8px" flexShrink={0} />
          <Text fontSize="13px" color="#344054" lineHeight="1.65">
            {item}
          </Text>
        </HStack>
      ))}
    </VStack>
  );
};

const formatSalary = (
  job?: Pick<
    IRecInformData,
    "salary_from" | "salary_to" | "salary_currency" | "is_salary_negotiable"
  > | null
) => {
  const from = job?.salary_from;
  const to = job?.salary_to;
  const currency = job?.salary_currency || "VND";
  const unit =
    currency === "VND" && Number(from || to || 0) < 1000
      ? "million VND"
      : currency;
  const formatValue = (value?: number | null) => {
    if (!value) return "";
    return Number(value).toLocaleString("en-US");
  };

  if (from && to) return `${formatValue(from)} - ${formatValue(to)} ${unit}`;
  if (from) return `From ${formatValue(from)} ${unit}`;
  if (to) return `Up to ${formatValue(to)} ${unit}`;
  if (job?.is_salary_negotiable) return "Negotiable salary";
  return "Negotiable";
};

const getDeadlineText = (date?: string | Date | null) => {
  if (!date) return "Updating";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Updating";

  return d.toLocaleDateString("en-US");
};

const getDaysLeft = (date?: string | Date | null) => {
  if (!date) return null;

  const now = new Date();
  const deadline = new Date(date);

  if (Number.isNaN(deadline.getTime())) return null;

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endDate = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate()
  ).getTime();

  return Math.ceil((endDate - startToday) / (1000 * 60 * 60 * 24));
};

const normalizeRelatedValue = (value?: string | null) =>
  String(value || "").trim().toLowerCase();

const getRecruitmentSkillIds = (job?: IRecInformData | null): Set<string> =>
  new Set<string>(
    (job?.recruitmentSkills ?? [])
      .map((item: any) => item?.skill_id || item?.skill?.id)
      .filter((value: unknown): value is string => typeof value === "string" && Boolean(value)),
  );

const countSharedSkills = (currentSkillIds: Set<string>, candidateSkillIds: Set<string>) => {
  if (!currentSkillIds.size || !candidateSkillIds.size) return 0;

  let total = 0;
  candidateSkillIds.forEach((skillId) => {
    if (currentSkillIds.has(skillId)) total += 1;
  });

  return total;
};

const normalizeScore = (score?: number | null) => {
  if (typeof score !== "number" || !Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score <= 1 ? score * 100 : score)));
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

const getUnknownErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  };
  const message = maybeError.response?.data?.message ?? maybeError.message ?? fallback;

  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" && message.trim() ? message : fallback;
};

const hasNumber = (value?: number | null): value is number =>
  typeof value === "number" && Number.isFinite(value);

const formatExperienceRequirement = (job?: {
  experience_type?: string | null;
  experience_min?: number | null;
  experience_max?: number | null;
  experience_label?: string | null;
}) => {
  const type = String(job?.experience_type || "").trim().toLowerCase();
  const min = hasNumber(job?.experience_min) ? job?.experience_min : null;
  const max = hasNumber(job?.experience_max) ? job?.experience_max : null;
  const year = (value: number) => `${value} ${value === 1 ? "year" : "years"}`;

  if (type === "none") return "No experience required";

  if (type === "exact") {
    const value = min ?? max;
    if (hasNumber(value)) {
      return value <= 0 ? "No experience required" : `${year(value)} of experience`;
    }
  }

  if (type === "range") {
    if (hasNumber(min) && hasNumber(max)) {
      if (min <= 0 && max <= 0) return "No experience required";
      if (min === max) return `${year(min)} of experience`;
      return `${min} - ${max} years`;
    }
    if (hasNumber(min)) return min <= 0 ? "No experience required" : `From ${year(min)}`;
    if (hasNumber(max)) return max <= 0 ? "No experience required" : `Up to ${year(max)}`;
  }

  if (type === "above") {
    if (hasNumber(min)) return min <= 0 ? "No experience required" : `${min}+ years of experience`;
  }

  if (type === "below") {
    if (hasNumber(max)) return max <= 0 ? "No experience required" : `Under ${year(max)}`;
  }

  if (type === "flexible") return "Flexible experience";

  if (hasNumber(min) && hasNumber(max)) {
    if (min <= 0 && max <= 0) return "No experience required";
    if (min === max) return `${year(min)} of experience`;
    return `${min} - ${max} years`;
  }

  if (hasNumber(min)) return min <= 0 ? "No experience required" : `${min}+ years of experience`;
  if (hasNumber(max)) return max <= 0 ? "No experience required" : `Up to ${year(max)}`;

  return job?.experience_label || "Updating";
};

const formatPostedDate = (date?: string | Date | null) => {
  if (!date) return "Updating";

  const postedDate = new Date(date);
  if (Number.isNaN(postedDate.getTime())) return "Updating";

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startPosted = new Date(
    postedDate.getFullYear(),
    postedDate.getMonth(),
    postedDate.getDate()
  ).getTime();
  const diffDays = Math.floor((startToday - startPosted) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return postedDate.toLocaleDateString("en-US");
};


const getRecommendationSummaryText = (recommendation?: RecommendedJobItem | null) =>
  recommendation?.match_detail?.overall?.description ||
  recommendation?.reason_texts?.join(" ") ||
  "Your profile is being compared with this job's requirements.";

const getSkillAnalysis = (recommendation?: RecommendedJobItem | null) =>
  recommendation?.match_detail?.skillAnalysis;

const stripInlineHtml = (value?: string | null) =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const toBulletItems = (value?: string | null) => {
  const text = stripInlineHtml(value);
  if (!text) return [];

  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-•*]+/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) return lines.slice(0, 7);

  return text
    .split(/(?<=[.!?。])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 7);
};

const scrollToDetailSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const renderTextBlock = (value?: string | null) => {
  if (!value || !String(value).trim()) {
    return (
      <Text color={textSub} fontSize="sm">
        Updating
      </Text>
    );
  }

  return (
    <Text color={textMain} fontSize="sm" lineHeight="1.85" whiteSpace="pre-wrap">
      {value}
    </Text>
  );
};

const getMatchColor = (status?: string) => {
  switch (status) {
    case "strong":
      return {
        bg: "#EEF2FF",
        color: "#334371",
        border: "#C7D2FE",
        progressColor: "#334371",
      };

    case "good":
      return {
        bg: "#F3F6FF",
        color: "#3F5188",
        border: "#D8E0FF",
        progressColor: "#4F63A3",
      };

    case "medium":
      return {
        bg: "#FFF8E8",
        color: "#946200",
        border: "#F4D28A",
        progressColor: "#D89B1D",
      };

    default:
      return {
        bg: "#FFF1F0",
        color: "#A33A36",
        border: "#F2B8B5",
        progressColor: "#C45A55",
      };
  }
};

const RecommendationMatchPanel = ({
  recommendation,
}: {
  recommendation: RecommendedJobItem;
}) => {
  const overall = recommendation.match_detail?.overall;
  const dimensions = recommendation.match_detail?.dimensions;
  const dimensionItems = Object.entries(dimensions ?? {}).flatMap(
    ([key, value]) => (value ? [{ key, ...value }] : [])
  );
  const skillAnalysis = recommendation.match_detail?.skillAnalysis;
  const experienceAnalysis = recommendation.match_detail?.dimensions?.experience;
  const suggestions = recommendation.match_detail?.suggestions ?? [];
  const overallScore =
    overall?.score ??
    Math.round((recommendation.score_breakdown?.finalScore ?? 0) * 100);
  const overallDescription =
    overall?.description || recommendation.reason_texts?.join(" ");

  return (
    <SectionCard
      title="Match level with your profile"
      rightNode={
        <Tag
          borderRadius="full"
          bg="#EEF4FF"
          color={green}
          px={3}
          py={1.5}
          fontWeight="800"
        >
          AI suggestion
        </Tag>
      }
    >
      <VStack align="stretch" spacing={5}>
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={4}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          bg="linear-gradient(135deg, #F8FBFF 0%, #EEF4FF 100%)"
          border="1px solid #D7E3FF"
          borderRadius="18px"
          p={{ base: 4, md: 5 }}
        >
          <Flex align="center" gap={4}>
            <Flex
              w={{ base: "86px", md: "104px" }}
              h={{ base: "86px", md: "104px" }}
              borderRadius="full"
              bg="white"
              border="8px solid #334371"
              align="center"
              justify="center"
              boxShadow="0 10px 28px rgba(51, 67, 113, 0.16)"
              flexShrink={0}
            >
              <Text
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="900"
                color={green}
              >
                {overallScore}%
              </Text>
            </Flex>

            <Box>
              <Text fontSize="lg" fontWeight="900" color={textMain}>
                {translateRecommendationText(overall?.label) || "Match level"}
              </Text>
              <Text mt={1} fontSize="sm" color={textSub} lineHeight="1.75">
                {translateRecommendationText(overallDescription) ||
                  "The system analyzes your CV, skills, and the recruitment information."}
              </Text>
            </Box>
          </Flex>
        </Flex>

        {dimensionItems.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            {dimensionItems.map((item) => {
              const score = Number(item.score ?? 0);
              const status =
                score >= 80
                  ? "strong"
                  : score >= 60
                    ? "good"
                    : score >= 40
                      ? "medium"
                      : "weak";

              const color = getMatchColor(status);

              return (
                <Box
                  key={item.key}
                  border="1px solid"
                  borderColor={color.border}
                  borderRadius="16px"
                  p={4}
                  bg="white"
                >
                  <HStack justify="space-between" align="start" mb={2}>
                    <Box>
                      <Text fontSize="sm" fontWeight="800" color={textMain}>
                        {translateRecommendationText(item.label)}
                      </Text>
                      <Text
                        mt={1}
                        fontSize="xs"
                        color={textSub}
                        lineHeight="1.6"
                      >
                        {translateRecommendationText(item.description)}
                      </Text>
                    </Box>

                    <Tag
                      borderRadius="full"
                      bg={color.bg}
                      color={color.color}
                      fontWeight="900"
                      flexShrink={0}
                    >
                      {score}%
                    </Tag>
                  </HStack>

                  <Box
                    w="100%"
                    h="8px"
                    borderRadius="999px"
                    bg="#EEF2F7"
                    overflow="hidden"
                  >
                    <Box
                      h="100%"
                      w={`${Math.max(0, Math.min(100, score))}%`}
                      borderRadius="999px"
                      bg={color.progressColor}
                      transition="width 0.35s ease"
                    />
                  </Box>
                </Box>
              );
            })}
          </SimpleGrid>
        ) : null}

        {skillAnalysis ? (
          <Box
            border="1px solid #E5EAF2"
            borderRadius="18px"
            p={4}
            bg="#FFFFFF"
          >
            <HStack justify="space-between" align="start" mb={3}>
              <Box>
                <Text fontSize="md" fontWeight="900" color={textMain}>
                  Skill analysis
                </Text>
                <Text mt={1} fontSize="sm" color={textSub}>
                  {`You match ${skillAnalysis.matchedCount ?? 0}/${
                    skillAnalysis.requiredCount ?? 0
                  } required skills.`}
                </Text>
              </Box>

              <Tag
                borderRadius="full"
                bg="#EEF4FF"
                color={green}
                fontWeight="900"
              >
                {skillAnalysis.score ?? 0}%
              </Tag>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="800" color="#027A48" mb={2}>
                  Matched skills
                </Text>

                <HStack spacing={2} flexWrap="wrap">
                  {(skillAnalysis.matchedSkills ?? []).length > 0 ? (
                    skillAnalysis.matchedSkills.map((skill) => (
                      <Tag
                        key={skill}
                        borderRadius="full"
                        bg="#ECFDF3"
                        color="#027A48"
                        px={3}
                        py={1.5}
                      >
                        {formatSkillName(skill)}
                      </Tag>
                    ))
                  ) : (
                    <Text fontSize="sm" color={textSub}>
                      No clearly matched skills yet.
                    </Text>
                  )}
                </HStack>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="800" color="#B42318" mb={2}>
                  Skills to improve
                </Text>

                <HStack spacing={2} flexWrap="wrap">
                  {(skillAnalysis.missingSkills ?? []).length > 0 ? (
                    skillAnalysis.missingSkills.map((skill) => (
                      <Tag
                        key={skill}
                        borderRadius="full"
                        bg="#FEF3F2"
                        color="#B42318"
                        px={3}
                        py={1.5}
                      >
                        {formatSkillName(skill)}
                      </Tag>
                    ))
                  ) : (
                    <Text fontSize="sm" color={textSub}>
                      No notable missing skills.
                    </Text>
                  )}
                </HStack>
              </Box>
            </SimpleGrid>
          </Box>
        ) : null}

        {experienceAnalysis ? (
          <Box
            border="1px solid #E5EAF2"
            borderRadius="18px"
            p={4}
            bg="#FFFFFF"
          >
            <HStack justify="space-between" align="start">
              <Box>
                <Text fontSize="md" fontWeight="900" color={textMain}>
                  Experience analysis
                </Text>
                <Text mt={1} fontSize="sm" color={textSub} lineHeight="1.7">
                  {translateRecommendationText(experienceAnalysis.description)}
                </Text>
              </Box>

              <Tag
                borderRadius="full"
                bg="#FFFAEB"
                color="#B54708"
                fontWeight="900"
              >
                {experienceAnalysis.score}%
              </Tag>
            </HStack>
          </Box>
        ) : null}

        {suggestions.length > 0 ? (
          <Box
            bg="#F8FAFC"
            border="1px solid #E5EAF2"
            borderRadius="18px"
            p={4}
          >
            <Text fontSize="md" fontWeight="900" color={textMain} mb={3}>
              Suggestions to improve your match level
            </Text>

            <VStack align="stretch" spacing={2}>
              {suggestions.map((item, index) => (
                <HStack key={index} align="start" spacing={2.5}>
                  <Flex
                    w="22px"
                    h="22px"
                    minW="22px"
                    borderRadius="full"
                    bg={green}
                    color="white"
                    align="center"
                    justify="center"
                    fontSize="xs"
                    fontWeight="900"
                    mt="1px"
                  >
                    {index + 1}
                  </Flex>
                  <Text fontSize="sm" color={textMain} lineHeight="1.7">
                    {translateRecommendationText(item)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        ) : null}
      </VStack>
    </SectionCard>
  );
};

const JobDetailPage = () => {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isFromRecommendation = searchParams.get("source") === "recommendation";
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);
  const notify = useNotify();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();
  const [pendingApplyAfterLogin, setPendingApplyAfterLogin] = useState(false);
  const [recommendationTab, setRecommendationTab] = useState<"overview" | "company">("overview");
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);

  const roleNames = (authUser?.roles ?? [])
    .map(getRoleName)
    .filter(Boolean);
  const isCandidateLoggedIn = Boolean(
    isAuthenticated && roleNames.includes(RECRUIT_BASE_ROLE.Candidate),
  );

  const ensureCandidateLogin = () => {
    if (isCandidateLoggedIn) return true;

    notify({
      message: "Please log in",
      description:
        "You need to log in to your candidate account to continue.",
      type: "warning",
    });
    onLoginOpen();
    return false;
  };

  const { data: applyState, isLoading: isApplyStateLoading } = useGetCandidateApplicationState(
    {
      recruitment_infor_id: id,
      employee_id: authUser?.id,
    },
    {
      enabled: Boolean(id && isCandidateLoggedIn),
    },
  );

  const applyButtonLabel = applyState?.buttonLabel || "Apply now";
  const applySubmitLabel =
    applyState?.action === "UPDATE_PROFILE"
      ? "Update profile"
      : applyState?.action === "REAPPLY"
        ? "Reapply"
        : "Submit your application";
  const isApplyBlocked = applyState?.action === "NONE";
  const showMessageButton = applyState?.action === "UPDATE_PROFILE";
  const candidateRecruiterMessageUrl = `${candidateConversationUrl}?application_id=${
    applyState?.application?.id || ""
  }`;

  const { data: savedJobState, refetch: refetchSavedState } = useCheckSavedJob(
    id,
    {
      enabled: Boolean(id && isCandidateLoggedIn),
    }
  );
  const toggleSaveJobMutation = useToggleSaveJob();
  const isSavedJob = Boolean(savedJobState?.is_saved);
  const savedHeartIcon = (
    <Icon
      as={FiBookmark}
      color="currentColor"
      fill={isSavedJob ? "currentColor" : "none"}
      boxSize={4}
    />
  );

  const handleApplyClick = () => {
    if (!ensureCandidateLogin()) {
      setPendingApplyAfterLogin(true);
      return;
    }

    if (isApplyBlocked) {
      notify({
        message: "Cannot apply",
        description: "You cannot reapply to this posting in its current status.",
        type: "warning",
      });
      return;
    }

    onOpen();
  };

  useEffect(() => {
    if (!pendingApplyAfterLogin || !isCandidateLoggedIn || isApplyStateLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPendingApplyAfterLogin(false);

      if (applyState?.action === "NONE") {
        notify({
          message: "Cannot apply",
          description: "You cannot reapply to this posting in its current status.",
          type: "warning",
        });
        return;
      }

      onOpen();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    applyState?.action,
    isApplyStateLoading,
    isCandidateLoggedIn,
    notify,
    onOpen,
    pendingApplyAfterLogin,
  ]);

  const handleSaveJobClick = async () => {
    if (!ensureCandidateLogin()) return;

    try {
      const res = await toggleSaveJobMutation.mutateAsync(id);
      await refetchSavedState();

      notify({
        message:
          res?.message ||
          (res?.saved ? "Job posting saved" : "The job posting has been unsaved"),
        type: "success",
      });
    } catch (error: unknown) {
      notify({
        message: "An error occurred",
        description: getUnknownErrorMessage(error, "Cannot save information at this time"),
        type: "error",
      });
    }
  };

  const handleMessageRecruiterClick = () => {
    if (!ensureCandidateLogin()) return;
    if (!applyState?.application?.id) {
      notify({
        message: "Conversation not ready",
        description:
          "Your application is not available yet, so the chat cannot be opened.",
        type: "warning",
      });
      return;
    }
    navigate(candidateRecruiterMessageUrl);
  };

  const handleSecondaryActionClick = () => {
    if (showMessageButton) {
      handleMessageRecruiterClick();
      return;
    }

    handleSaveJobClick();
  };

  const handleNavigateHome = () => {
    if (isNavigatingHome) return;

    setIsNavigatingHome(true);
    window.setTimeout(() => {
      navigate("/it-job/jobs");
    }, 220);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setRecommendationTab("overview");
  }, [id]);

  const { data: job, isLoading } = useGetJobDetail(id, {
    source: isFromRecommendation ? "recommendation" : undefined,
  });
  const recommendationFromState = (location.state as { recommendation?: RecommendedJobItem } | null)
    ?.recommendation as
    | RecommendedJobItem
    | undefined;

  const recommendationFromStorage = useMemo(() => {
    if (!isFromRecommendation || !id) return null;

    try {
      const raw = sessionStorage.getItem(`recommendation-detail:${id}`);
      return raw ? (JSON.parse(raw) as RecommendedJobItem) : null;
    } catch {
      return null;
    }
  }, [id, isFromRecommendation]);

  const recommendationDetail =
    isCandidateLoggedIn && isFromRecommendation
      ? recommendationFromState || recommendationFromStorage
      : null;
  const currentGroupId = job?.positionPost?.group?.id || "";
  const currentPositionId = job?.positionPost?.id || job?.position_post_id || "";
  const relatedJobQueryParams = useMemo(
    () => ({
      pages: 1,
      limit: 12,
      search: "",
      status: "PUBLIC",
      exclude_id: job?.id,
      position_group_id: currentGroupId || undefined,
      position_post_id: currentGroupId ? undefined : currentPositionId || undefined,
    }),
    [currentGroupId, currentPositionId, job?.id],
  );
  const { data: relatedJobsData, isLoading: isRelatedJobsLoading } = useGetJobs(
    relatedJobQueryParams,
    {
      enabled: Boolean(job?.id && (currentGroupId || currentPositionId)),
    },
  );

  const title = job?.post_title || job?.internal_title || "Recruitment details";
  const companyName = job?.department?.full_name || "Company name";
  const locationText = job?.workLocation?.short_address || job?.workLocation?.address || "Updating";
  const salaryText = formatSalary(job);
  const workTypeText = formatWorkTypeLabel(job?.type_of_job) || "Updating";
  const experienceRequirementText = formatExperienceRequirement(job);

  const deadlineText = getDeadlineText(job?.application_deadline);
  const daysLeft = getDaysLeft(job?.application_deadline);

  const professionTags = useMemo(() => {
    const tags: Array<{ name: string; id?: string; type: "group" | "position" | "rank" }> = [];

    if (job?.positionPost?.name_post) {
      tags.push({
        name: job.positionPost.name_post,
        id: job.positionPost?.group?.id,
        type: "position",
      });
    }

    if (job?.positionPost?.group?.name_group) {
      tags.push({
        name: job.positionPost.group.name_group,
        id: job.positionPost.group.id,
        type: "group",
      });
    }

    return tags;
  }, [job]);

  const relatedJobs = useMemo(() => {
    const list = relatedJobsData?.data ?? [];
    const currentSkillIds = getRecruitmentSkillIds(job);
    const currentJobType = normalizeRelatedValue(job?.type_of_job);
    const currentRankId = job?.rank?.id || job?.rank_id;
    const currentLocationId = job?.workLocation?.id || job?.work_location_id;
    const currentDepartmentId = job?.department?.id || job?.department_id;

    return list
      .filter((item) => {
        if (item.id === job?.id) return false;

        const daysLeft = getDaysLeft(item.application_deadline);
        return daysLeft === null || daysLeft >= 0;
      })
      .map((item) => {
        const itemGroupId = item.positionPost?.group?.id;
        const itemPositionId = item.positionPost?.id || item.position_post_id;
        const itemSkillIds = getRecruitmentSkillIds(item);

        let score = 0;

        if (currentPositionId && itemPositionId && itemPositionId === currentPositionId) {
          score += 10;
        }

        if (currentGroupId && itemGroupId && itemGroupId === currentGroupId) {
          score += 7;
        }

        score += Math.min(countSharedSkills(currentSkillIds, itemSkillIds), 5);

        if (currentRankId && (item.rank?.id || item.rank_id) === currentRankId) {
          score += 2;
        }

        if (currentJobType && normalizeRelatedValue(item.type_of_job) === currentJobType) {
          score += 1;
        }

        if (currentLocationId && (item.workLocation?.id || item.work_location_id) === currentLocationId) {
          score += 1;
        }

        if (currentDepartmentId && (item.department?.id || item.department_id) === currentDepartmentId) {
          score += 1;
        }

        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return (left.item.post_title || left.item.internal_title || "").localeCompare(
          right.item.post_title || right.item.internal_title || "",
        );
      })
      .map(({ item }) => item)
      .slice(0, 6);
  }, [currentGroupId, currentPositionId, job, relatedJobsData?.data]);

  if (isLoading) {
    return (
      <Flex minH="60vh" align="center" justify="center" bg={pageBg}>
        <Spinner color={green} />
      </Flex>
    );
  }

  if (isFromRecommendation) {
    const skillMatch = job?.skill_match;
    const scoreBreakdown = skillMatch?.score_breakdown;
    const hasRecommendationData = Boolean(skillMatch || recommendationDetail);
    const skillAnalysis = getSkillAnalysis(recommendationDetail);
    const dimensions = recommendationDetail?.match_detail?.dimensions;
    const scoreFromBreakdown = (
      apiScore?: number | null,
      dimensionScore?: number | null,
      listScore?: number | null,
    ) => normalizeScore(apiScore ?? dimensionScore ?? listScore ?? 0);
    const overallScore = hasRecommendationData
      ? normalizeScore(
          scoreBreakdown?.final ??
            skillMatch?.final_score ??
            recommendationDetail?.match_detail?.overall?.score ??
            recommendationDetail?.score_breakdown?.finalScore
        )
      : 0;
    const overallLabel =
      translateRecommendationText(recommendationDetail?.match_detail?.overall?.label) ||
      (hasRecommendationData
        ? overallScore >= 80
          ? "Excellent fit"
          : overallScore >= 60
            ? "Good fit"
            : overallScore >= 40
              ? "Worth considering"
              : "Low match"
        : "No recommendation data");
    const reasonTexts =
      (skillMatch?.reason_texts ?? recommendationDetail?.reason_texts ?? []).filter(Boolean);
    const recommendationSummary =
      reasonTexts.length > 0
        ? reasonTexts.map((item) => translateRecommendationText(item)).join(" ")
        : hasRecommendationData
          ? getRecommendationSummaryText(recommendationDetail)
          : "No recommendation data is available for this job.";
    const matchedSkills =
      skillMatch?.matched_skills ??
      skillAnalysis?.matchedSkills ??
      recommendationDetail?.matched_skills ??
      [];
    const missingSkills =
      skillMatch?.missing_skills ??
      skillAnalysis?.missingSkills ??
      recommendationDetail?.missing_skills ??
      [];
    const requiredSkillCount = matchedSkills.length + missingSkills.length;
    const overviewText =
      stripInlineHtml(job?.positionPost?.description_post || job?.job_description || job?.description)
        .split(/(?<=[.!?。])\s+/)
        .filter(Boolean)[0] ||
      `${title} at ${companyName} with a focus on ${job?.positionPost?.group?.name_group || "technology"}.`;
    const descriptionItems = toBulletItems(
      job?.positionPost?.description_post || job?.job_description || job?.description
    );
    const requirementItems = toBulletItems(
      job?.positionPost?.requirements_post || job?.candidate_requirements || job?.requirements
    );
    const benefitItems = toBulletItems(job?.positionPost?.benefits_post || job?.benefits);
    const companyDescription =
      stripInlineHtml(
        (job?.department as { description?: string | null } | null | undefined)?.description
      ) ||
      `${companyName} is hiring for ${title}.`;
    const companyDetailUrl = job?.department?.id
      ? `/it-job/inforcompany/${job.department.id}`
      : "";
    const dimensionCards = [
      {
        key: "position",
        title: "Position",
        score: scoreFromBreakdown(
          scoreBreakdown?.position ?? skillMatch?.position_score,
          dimensions?.position?.score,
          recommendationDetail?.score_breakdown?.positionScore ??
            recommendationDetail?.score_breakdown?.groupSimilarityScore,
        ),
        description:
          translateRecommendationText(dimensions?.position?.description) ||
          "Your career direction and seniority are compared with the position requirements.",
      },
      {
        key: "semantic",
        title: "CV/JD semantics",
        score: scoreFromBreakdown(
          scoreBreakdown?.semantic ?? skillMatch?.semantic_score,
          dimensions?.semantic?.score,
          recommendationDetail?.score_breakdown?.semanticScore,
        ),
        description:
          translateRecommendationText(dimensions?.semantic?.description) ||
          "Your CV and the job description have high semantic similarity.",
      },
      {
        key: "experience",
        title: "Experience",
        score: scoreFromBreakdown(
          scoreBreakdown?.experience ?? skillMatch?.experience_score,
          dimensions?.experience?.score,
          recommendationDetail?.score_breakdown?.experienceScore,
        ),
        description:
          translateRecommendationText(dimensions?.experience?.description) ||
          "Your experience is compared with the job requirements.",
      },
      {
        key: "skills",
        title: "Skills",
        score: scoreFromBreakdown(
          scoreBreakdown?.skills ?? skillMatch?.skill_overlap_score,
          dimensions?.skills?.score,
          skillAnalysis?.score ?? recommendationDetail?.score_breakdown?.skillOverlapScore,
        ),
        description: requiredSkillCount
          ? `You match ${matchedSkills.length}/${requiredSkillCount} required skills.`
          : "The system does not have enough skill data to provide a detailed analysis.",
      },
      {
        key: "job_type",
        title: "Job type",
        score: scoreFromBreakdown(
          scoreBreakdown?.job_type ?? skillMatch?.job_type_score,
          undefined,
          recommendationDetail?.score_breakdown?.jobTypeScore,
        ),
        description: "The system compares the job type with your profile preferences.",
      },
      {
        key: "location",
        title: "Location",
        score: scoreFromBreakdown(
          scoreBreakdown?.location ?? skillMatch?.location_score,
          undefined,
          recommendationDetail?.score_breakdown?.locationScore,
        ),
        description: "The location score reflects how well the job matches your preferred area; remote jobs may not depend on location.",
      },
    ];
    const tabs = [
      { id: "overview", label: "Overview", icon: <FiBriefcase /> },
      { id: "company", label: "Company", icon: <FiGrid /> },
    ];
    const handleShareClick = async () => {
      const href = window.location.href;

      try {
        await navigator.clipboard?.writeText(href);
        notify({ message: "Job link copied", type: "success" });
      } catch {
        notify({
          message: "Unable to copy link",
          description: href,
          type: "warning",
        });
      }
    };

    return (
      <Box minH="100vh">
        <Container maxW={detailContainerMaxW} px={{ base: 3, md: 5 }} py={{ base: 4, md: 6 }}>
          <Flex
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={3}
            mb={4}
          >
            <HStack spacing={2} color="#667085" fontSize="14px" fontWeight="800" flexWrap="wrap">
              <Icon as={FiHome} color={green} boxSize={4} />
              <Text cursor="pointer" onClick={handleNavigateHome}>
                Home
              </Text>
              <Text color="#CBD5E1">/</Text>
              <Text>Recommended jobs</Text>
              <Text color="#CBD5E1">/</Text>
              <Text color="#172033" noOfLines={1}>
                {title}
              </Text>
            </HStack>

            <HStack spacing={3} flexWrap="wrap">
              <Button
                leftIcon={<FiSend />}
                bg={green}
                color="white"
                borderRadius="10px"
                minW={{ base: "full", sm: "144px" }}
                _hover={{ bg: "#26345E" }}
                isDisabled={isApplyBlocked}
                onClick={handleApplyClick}
              >
                {applyButtonLabel}
              </Button>
              <Button
                leftIcon={savedHeartIcon}
                variant="outline"
                borderColor="#D9E2EF"
                color="#172033"
                bg="white"
                borderRadius="10px"
                minW={{ base: "full", sm: "150px" }}
                _hover={{ bg: "#F3F6FB", borderColor: green }}
                isLoading={toggleSaveJobMutation.isPending}
                onClick={handleSaveJobClick}
              >
                {isSavedJob ? "Saved" : "Save job"}
              </Button>
              <IconButton
                aria-label="Share job"
                icon={<FiShare2 />}
                borderRadius="10px"
                variant="outline"
                borderColor="#D9E2EF"
                bg="white"
                color="#172033"
                _hover={{ bg: "#F3F6FB", borderColor: green }}
                onClick={handleShareClick}
              />
            </HStack>
          </Flex>

          <RecommendationCard p={{ base: 4, md: 6 }}>
            <Grid templateColumns={{ base: "1fr", lg: "1.45fr 0.95fr" }} gap={{ base: 5, lg: 7 }}>
              <Flex gap={{ base: 4, md: 5 }} align={{ base: "flex-start", md: "center" }}>
                <Flex
                  w={{ base: "78px", md: "92px" }}
                  h={{ base: "78px", md: "92px" }}
                  borderRadius="16px"
                  bg="#EEF4FF"
                  border="1px solid #E2E9F4"
                  align="center"
                  justify="center"
                  overflow="hidden"
                  flexShrink={0}
                >
                  <Avatar
                    name={companyName}
                    src={toAbsoluteCompanyLogoUrl(job?.department?.image_logo)}
                    w="100%"
                    h="100%"
                    borderRadius="0"
                    bg="#EEF4FF"
                  />
                </Flex>

                <Box minW={0}>
                  <HStack spacing={3} align="center" flexWrap="wrap">
                    <Text
                      fontSize={{ base: "26px", md: "18px" }}
                      fontWeight="900"
                      color="#172033"
                      lineHeight="1.15"
                    >
                      {title}
                    </Text>
                    <Tag borderRadius="8px" bg="#EAF7EF" color="#15803D" fontWeight="600" px={3} py={1.5}>
                      {overallLabel}
                    </Tag>
                  </HStack>

                  <Text mt={2} color="#344054" fontSize="15px" fontWeight="700">
                    {companyName}
                    {job?.positionPost?.group?.name_group ? ` · ${job.positionPost.group.name_group}` : ""}
                  </Text>

                  <HStack mt={3} spacing={2} flexWrap="wrap">
                    <RecommendationMetaPill icon={<FiMapPin />} label={locationText} />
                    <RecommendationMetaPill icon={<FiBriefcase />} label={workTypeText} />
                    <RecommendationMetaPill icon={<FiDollarSign />} label={salaryText} />
                    <RecommendationMetaPill icon={<FiCalendar />} label={experienceRequirementText} />
                    <RecommendationMetaPill icon={<FiClock />} label={deadlineText} />
                    <RecommendationMetaPill icon={<FiTrendingUp />} label={formatPostedDate(job?.created_at)} />
                  </HStack>
                </Box>
              </Flex>

              <Flex
                align="center"
                gap={5}
                borderLeft={{ base: "0", lg: "1px solid #E3E9F3" }}
                pl={{ base: 0, lg: 6 }}
                direction={{ base: "column", sm: "row" }}
              >
                {hasRecommendationData ? (
                  <>
                    {/* điểm lớn */}
                    <MatchRing score={overallScore} label="Match" /> 
                    <Box
                      flex="1"
                      bg="#F7FAFF"
                      border="1px solid #E5ECF8"
                      borderRadius="16px"
                      p={4}
                      minW={0}
                    >
                      <Text fontSize="14.5px" color="#172033" fontWeight="900">
                        {overallLabel} with your profile
                      </Text>
                      <Text mt={2} color="#52627A" fontSize="14px" lineHeight="1.65" noOfLines={3}>
                        {translateRecommendationText(recommendationSummary)}
                      </Text>
                      <Button
                        mt={3}
                        variant="link"
                        color={green}
                        rightIcon={<FiArrowRight />}
                        onClick={() => {
                          setRecommendationTab("overview");
                          window.setTimeout(() => scrollToDetailSection("overview"), 0);
                        }}
                        fontSize={15}
                      >
                        View match details
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box
                    flex="1"
                    bg="#F8FAFC"
                    border="1px solid #E5EAF2"
                    borderRadius="16px"
                    p={4}
                    minW={0}
                  >
                    <Text fontSize="14.5px" color="#172033" fontWeight="900">
                      No recommendation data
                    </Text>
                    <Text mt={2} color="#52627A" fontSize="14px" lineHeight="1.65">
                      The system does not have a match breakdown for this job yet.
                    </Text>
                  </Box>
                )}
              </Flex>
            </Grid>
          </RecommendationCard>

          <Grid templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 310px" }} gap={5} mt={5} alignItems="start">
            <VStack align="stretch" spacing={4}>
              <RecommendationCard p={0}>
                <HStack spacing={1} overflowX="auto" px={3} py={2}>
                  {tabs.map((tab) => {
                    const isActive = recommendationTab === tab.id;

                    return (
                      <Button
                        key={tab.id}
                        variant="ghost"
                        leftIcon={tab.icon}
                        color={isActive ? green : "#344054"}
                        borderBottom={isActive ? `2px solid ${green}` : "2px solid transparent"}
                        borderRadius="0"
                        px={{ base: 3, md: 5 }}
                        minW="max-content"
                        _hover={{ bg: "#F4F7FB", color: green }}
                        onClick={() => setRecommendationTab(tab.id as "overview" | "company")}
                      >
                        {tab.label}
                      </Button>
                    );
                  })}
                </HStack>
              </RecommendationCard>

              {recommendationTab === "overview" ? (
                <>
                  <RecommendationCard id="overview">
                    <RecommendationSectionTitle icon={<FiUserCheck />} title="Position overview" />
                    <Text color="#344054" fontSize="14px" lineHeight="1.8">
                      {overviewText}
                    </Text>
                    <HStack mt={3} spacing={4} flexWrap="wrap">
                      {descriptionItems.slice(0, 3).map((item, index) => (
                        <HStack key={`${item}-${index}`} spacing={2}>
                          <Box w="7px" h="7px" borderRadius="full" bg="#2F80ED" />
                          <Text fontSize="13px" color="#344054" fontWeight="700">
                            {item}
                          </Text>
                        </HStack>
                      ))}
                    </HStack>
                  </RecommendationCard>

                  <RecommendationCard>
                    <RecommendationSectionTitle icon={<FiStar />} title="Why this job fits" />
                    {hasRecommendationData ? (
                      <>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                          {dimensionCards.map((item) => (
                            <MiniProgressCard
                              key={item.key}
                              title={item.title}
                              description={item.description}
                              score={item.score}
                            />
                          ))}
                        </SimpleGrid>

                        <Box mt={4} bg="#EEF1F8" border="1px solid #D4DAE8" borderRadius="13px" p={3.5}>
                          <HStack align="start" spacing={2.5}>
                            <Icon as={FiStar} color="#334371" mt="2px" />
                            <Text color="#2A3A63" fontSize="13px" lineHeight="1.65" fontWeight="700">
                              {translateRecommendationText(recommendationSummary)}
                            </Text>
                          </HStack>
                        </Box>
                      </>
                    ) : (
                      <Box bg="#F8FAFC" border="1px solid #E5EAF2" borderRadius="13px" p={4}>
                        <Text color="#667085" fontSize="14px" fontWeight="700">
                          No recommendation data yet.
                        </Text>
                      </Box>
                    )}
                  </RecommendationCard>

                  <RecommendationCard>
                    <RecommendationSectionTitle icon={<FiFileText />} title="Job description" />
                    <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={0}>
                      <Box pr={{ base: 0, lg: 5 }} borderRight={{ base: "0", lg: "1px solid #E3E9F3" }}>
                        <Text fontSize="14px" fontWeight="900" color="#344054" mb={3}>
                          Description
                        </Text>
                        <BulletList items={descriptionItems} />
                      </Box>
                      <Box pl={{ base: 0, lg: 5 }} mt={{ base: 5, lg: 0 }}>
                        <Text fontSize="14px" fontWeight="900" color="#344054" mb={3}>
                          Requirements
                        </Text>
                        <BulletList items={requirementItems} />
                      </Box>
                    </Grid>
                  </RecommendationCard>

                  <RecommendationCard>
                    <RecommendationSectionTitle icon={<FiCode />} title="Skills" />
                    <Grid templateColumns={{ base: "1fr", md: "0.9fr 1.1fr" }} gap={6}>
                      <Box>
                        <Text fontSize="14px" fontWeight="900" color="#344054" mb={3}>
                          Matching skills
                        </Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {matchedSkills.length > 0 ? (
                            matchedSkills.map((skill) => (
                              <Tag
                                key={skill}
                                borderRadius="full"
                                bg="#EAF7EF"
                                color="#167340"
                                px={3}
                                py={2}
                                fontWeight="700"
                              >
                                <Icon as={FiCheckCircle} mr={2} />
                                {formatSkillName(skill)}
                              </Tag>
                            ))
                          ) : (
                            <Text fontSize="13px" color="#667085">
                              No clearly matched skills yet.
                            </Text>
                          )}
                        </HStack>
                      </Box>

                      <Box>
                        <Text fontSize="14px" fontWeight="900" color="#344054" mb={3}>
                          Skills to add
                        </Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {missingSkills.length > 0 ? (
                            missingSkills.map((skill) => (
                              <Tag
                                key={skill}
                                borderRadius="full"
                                bg="#FFF4E5"
                                color="#C56A14"
                                px={3}
                                py={2}
                                fontWeight="700"
                              >
                                <Icon as={FiCheck} mr={2} />
                                {formatSkillName(skill)}
                              </Tag>
                            ))
                          ) : (
                            <Text fontSize="13px" color="#667085">
                              None
                            </Text>
                          )}
                        </HStack>
                      </Box>
                    </Grid>
                  </RecommendationCard>

                  <RecommendationCard>
                    <RecommendationSectionTitle icon={<FiGift />} title="Benefits" />
                    {job?.positionPost?.benefit_more && Object.values(job.positionPost.benefit_more).some((v) => v && String(v).trim()) ? (
                      <BenefitMoreTabs benefitMore={job.positionPost.benefit_more} />
                    ) : (
                      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3}>
                        {(benefitItems.length ? benefitItems.slice(0, 4) : ["Competitive salary", "Professional environment", "Training and development", "Career opportunities"]).map((item, index) => (
                          <HStack
                            key={`${item}-${index}`}
                            spacing={3}
                            borderRight={{ base: "0", xl: index < 3 ? "1px solid #E3E9F3" : "0" }}
                            pr={{ base: 0, xl: 3 }}
                            align="start"
                          >
                            <Flex w="34px" h="34px" minW="34px" borderRadius="11px" bg="#EEF4FF" color={green} align="center" justify="center">
                              <Icon as={index % 2 === 0 ? FiGift : FiShield} boxSize={4} />
                            </Flex>
                            <Text fontSize="13px" color="#344054" fontWeight="700" lineHeight="1.55">
                              {item}
                            </Text>
                          </HStack>
                        ))}
                      </SimpleGrid>
                    )}
                  </RecommendationCard>
                </>
              ) : (
                <RecommendationCard id="company">
                  <RecommendationSectionTitle icon={<FiGrid />} title="Company" />
                  <HStack align="start" spacing={4}>
                    <Flex
                      w="96px"
                      h="96px"
                      minW="96px"
                      borderRadius="16px"
                      bg="#EEF4FF"
                      border="1px solid #E2E9F4"
                      overflow="hidden"
                    >
                      <Avatar
                        name={companyName}
                        src={toAbsoluteCompanyLogoUrl(job?.department?.image_logo)}
                        w="100%"
                        h="100%"
                        borderRadius="0"
                      />
                    </Flex>

                    <Box minW={0}>
                      <HStack spacing={2} align="center">
                        <Text color="#172033" fontWeight="900" fontSize={{ base: "20px", md: "24px" }} lineHeight="1.2">
                          {companyName}
                        </Text>
                        <Icon as={FiCheckCircle} color="#2F80ED" boxSize={5} />
                      </HStack>
                      <Text mt={3} color="#52627A" fontSize="14px" lineHeight="1.75">
                        {companyDescription}
                      </Text>
                    </Box>
                  </HStack>

                  <Divider borderColor="#E3E9F3" my={5} />

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <QuickInfoLine icon={<FiUsers />} label="Size" value={job?.department?.employee_quantity || "Updating"} />
                    <QuickInfoLine icon={<FiMapPin />} label="Address" value={job?.department?.address || job?.department?.short_address || "Updating"} />
                    <QuickInfoLine icon={<FiLink2 />} label="Website" value={job?.department?.website || "Updating"} />
                    <QuickInfoLine icon={<FiUserCheck />} label="Contact" value={job?.department?.phone_number || "Updating"} />
                    <QuickInfoLine icon={<FiMessageCircle />} label="Email" value={job?.department?.email || "Updating"} />
                  </SimpleGrid>
                </RecommendationCard>
              )}
            </VStack>

            <VStack align="stretch" spacing={4}>
              {recommendationTab === "overview" ? (
                <>
                  <RecommendationCard>
                    <RecommendationSectionTitle icon={<FiBookmark />} title="Match summary" />
                    {hasRecommendationData ? (
                      <>
                        <Flex gap={5} align="center">
                          <MatchRing score={overallScore} label="Match" size="104px" />
                          <VStack align="stretch" spacing={2.5} flex="1">
                            {dimensionCards.map((item) => {
                              const tone = getScoreTone(item.score);

                              return (
                                <HStack key={item.key} justify="space-between">
                                  <HStack spacing={2} minW={0}>
                                    <Icon
                                      as={item.score >= 60 ? FiCheckCircle : FiAlertCircle}
                                      color={tone.icon}
                                      flexShrink={0}
                                    />
                                    <Text fontSize="13px" color="#344054" fontWeight="800" noOfLines={1}>
                                      {item.title}
                                    </Text>
                                  </HStack>
                                  <Tag
                                    borderRadius="full"
                                    bg={tone.bg}
                                    color={tone.color}
                                    fontWeight="900"
                                    flexShrink={0}
                                  >
                                    {item.score}%
                                  </Tag>
                                </HStack>
                              );
                            })}
                          </VStack>
                        </Flex>

                        <Box mt={4} bg="#EEF1F8" border="1px solid #D4DAE8" borderRadius="13px" p={3.5}>
                          <HStack align="start" spacing={2.5}>
                            <Icon as={FiStar} color="#334371" mt="2px" />
                            <Text color="#2A3A63" fontSize="13px" lineHeight="1.65" fontWeight="700">
                              {translateRecommendationText(recommendationSummary)}
                            </Text>
                          </HStack>
                        </Box>
                      </>
                    ) : (
                      <Box bg="#F8FAFC" border="1px solid #E5EAF2" borderRadius="13px" p={4}>
                        <Text color="#667085" fontSize="14px" fontWeight="700">
                          No recommendation data yet.
                        </Text>
                      </Box>
                    )}
                  </RecommendationCard>

                  <RecommendationCard>
                    <RecommendationSectionTitle icon={<FiFileText />} title="Quick information" />
                    <VStack align="stretch" spacing={3}>
                      <QuickInfoLine icon={<FiDollarSign />} label="Salary" value={salaryText} />
                      <QuickInfoLine icon={<FiCalendar />} label="Job type" value={workTypeText} />
                      <QuickInfoLine icon={<FiMapPin />} label="Location" value={locationText} />
                      <QuickInfoLine icon={<FiGrid />} label="Department" value={job?.positionPost?.group?.name_group || "Updating"} />
                      <QuickInfoLine icon={<FiClock />} label="Posted" value={formatPostedDate(job?.created_at)} />
                    </VStack>
                  </RecommendationCard>
                </>
              ) : (
                <>
                  <RecommendationCard>
                    <RecommendationSectionTitle icon={<FiGrid />} title="Company information" />
                    <VStack align="stretch" spacing={3}>
                      <QuickInfoLine icon={<FiUsers />} label="Size" value={job?.department?.employee_quantity || "Updating"} />
                      <QuickInfoLine icon={<FiMapPin />} label="Address" value={job?.department?.short_address || job?.department?.address || "Updating"} />
                      <QuickInfoLine icon={<FiLink2 />} label="Website" value={job?.department?.website || "Updating"} />
                      <QuickInfoLine icon={<FiMessageCircle />} label="Email" value={job?.department?.email || "Updating"} />
                      <QuickInfoLine icon={<FiUserCheck />} label="Contact" value={job?.department?.phone_number || "Updating"} />
                    </VStack>
                  </RecommendationCard>

                  <Button
                    variant="outline"
                    borderColor={green}
                    color={green}
                    borderRadius="10px"
                    rightIcon={<FiArrowRight />}
                    isDisabled={!companyDetailUrl}
                    _hover={{ bg: "#EEF4FF" }}
                    onClick={() => {
                      if (companyDetailUrl) navigate(companyDetailUrl);
                    }}
                  >
                    View company details
                  </Button>
                </>
              )}
            </VStack>
          </Grid>

          <Box mt={6}>
            <ITJobInfoSection />
          </Box>
        </Container>

        <ApplyJobModal
          isOpen={isOpen}
          onClose={onClose}
          recruitmentInforId={id}
          employeeId={authUser?.id}
          jobTitle={title}
          submitLabel={applySubmitLabel}
        />
        <CandidateLoginModal
          isOpen={isLoginOpen}
          onClose={() => {
            onLoginClose();
            setPendingApplyAfterLogin(false);
          }}
          onSuccess={() => {
            if (!pendingApplyAfterLogin) return;
            setPendingApplyAfterLogin(true);
          }}
        />
      </Box>
    );
  }

  return (
    <Box minH="100vh">

      <Container maxW={detailContainerMaxW} px={{ base: 3, md: 4, xl: 5 }} py={{ base: 4, md: 5 }}>
        {/* breadcrumb */}
        <HStack
          spacing={2}
          color={green}
          fontSize="sm"
          fontWeight="600"
          wrap="wrap"
          mb={4}
        >
          <HStack spacing={1.5}>
            <Text
              cursor={isNavigatingHome ? "default" : "pointer"}
              opacity={isNavigatingHome ? 0.85 : 1}
              onClick={handleNavigateHome}
            >
              {isNavigatingHome ? "Moving..." : "Home page"}
            </Text>
            {isNavigatingHome && <Spinner size="xs" color={green} />}
          </HStack>
          <Text color="#9CA3AF">›</Text>
          <Text>Jobs at {companyName}</Text>
        </HStack>

        {/* top main */}
        <Grid
          templateColumns={{ base: "1fr", xl: "0fr 1fr" }}
          gap={4}
          alignItems="start"
        >
          {/* left */}
          <VStack align="stretch" spacing={4}>
            <Box
              bg="white"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="12px"
              p={{ base: 3, md: 4 }}
              boxShadow="0 2px 8px rgba(15, 23, 42, 0.04)"
            >
              <Text
                fontSize="lg"
                fontWeight="700"
                color={textMain}
                lineHeight="1.45"
                pr={{ base: 0, md: 2 }}
              >
                {title}{" "}
                <Icon
                  as={FiCheckCircle}
                  color={green}
                  boxSize={4}
                  verticalAlign="text-bottom"
                />
              </Text>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mt={4}>
                <InfoRow
                  icon={<FiDollarSign />}
                  label="Salary"
                  value={formatSalary(job)}
                />
                <InfoRow
                  icon={<FiMapPin />}
                  label="Location"
                  value={locationText}
                  valueColor={green}
                />
                <InfoRow
                  icon={<FiClock />}
                  label="Experience"
                  value={formatExperienceRequirement(job) || "Updating"}
                />
              </SimpleGrid>

              <Text mt={4} fontSize="sm" color={textSub} lineHeight="1.6">
                Application deadline:{" "}
                <Text as="span" color={textMain} fontWeight="700">
                  {deadlineText}
                </Text>
                {daysLeft !== null && daysLeft >= 0 && (
                  <Text as="span" color={textMain} fontWeight="700">
                    {" "}
                    ({daysLeft} days left)
                  </Text>
                )}
              </Text>

              <HStack mt={4} spacing={3} w="full">
                <Button
                  leftIcon={<FiSend />}
                  h="35px"
                  w="full"
                  flex={1}
                  minW={0}
                  bg={green}
                  color="white"
                  _hover={{ bg: "#334371" }}
                  borderRadius="10px"
                  fontSize="sm"
                  fontWeight="700"
                  isDisabled={isApplyBlocked}
                  onClick={handleApplyClick}
                >
                  {applyButtonLabel}
                </Button>

                <Button
                  leftIcon={showMessageButton ? <FiMessageCircle /> : savedHeartIcon}
                  h="35px"
                  minW={{ base: "full", md: "135px" }}
                  flexShrink={0}
                  variant="outline"
                  borderColor="#334371"
                  color={green}
                  bg="white"
                  borderRadius="10px"
                  fontSize="sm"
                  fontWeight="700"
                  _hover={{ bg: "#334371", color: "white", borderColor: "#334371" }}
                  isLoading={!showMessageButton && toggleSaveJobMutation.isPending}
                  onClick={handleSecondaryActionClick}
                >
                  {showMessageButton ? "Texting" : isSavedJob ? "Saved" : "Save this information"}
                </Button>
              </HStack>
            </Box>

            {/* detail content */}
             {recommendationDetail ? (
              <RecommendationMatchPanel recommendation={recommendationDetail} />
            ) : null}

            {/* detail content */}
            <SectionCard
              title="Recruitment details"
              rightNode={
                <HStack color={green} spacing={1.5}>
                  <Icon as={FiAlertCircle} boxSize={4} />
                  <Text fontWeight="600" fontSize="sm">
                    Send me similar jobs
                  </Text>
                </HStack>
              }
            >
              <VStack id="job-detail" align="stretch" spacing={4}>
                <Box>
                  <Stack
                    direction={{ base: "column", md: "row" }}
                    spacing={3}
                    align={{ base: "start", md: "center" }}
                  >
                    <Text minW="88px" fontWeight="700" fontSize="sm" color={textMain}>
                      Request:
                    </Text>

                    <HStack spacing={2} flexWrap="wrap">
                      <Tag
                        borderRadius="full"
                        px={3}
                        py={1.5}
                        fontSize="sm"
                        bg="#F3F4F6"
                        color={textMain}
                        fontWeight="500"
                      >
                        {formatWorkTypeLabel(job?.type_of_job) || "Full-time"}
                      </Tag>
                    </HStack>
                  </Stack>
                </Box>

                <Box>
                  <Stack
                    direction={{ base: "column", md: "row" }}
                    spacing={3}
                    align={{ base: "start", md: "center" }}
                  >
                    <Text minW="88px" fontWeight="700" fontSize="sm" color={textMain}>
                      Expertise:
                    </Text>

                    <HStack spacing={2} flexWrap="wrap">
                      {(professionTags?.length ?? 0) > 0 ? (
                        professionTags.map((item, idx) => (
                          <Tag
                            key={idx}
                            borderRadius="full"
                            px={3}
                            py={1.5}
                            fontSize="sm"
                            bg="#E8ECFF"
                            color="#334371"
                            fontWeight="600"
                            cursor="pointer"
                            transition="all 0.2s ease"
                            _hover={{
                              bg: "#D4DCF7",
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 12px rgba(51, 67, 113, 0.15)",
                            }}
                            onClick={() => {
                              if (item.id) {
                                navigate(
                                  candidateJobsByGroupUrl.replace(":groupId", item.id)
                                );
                              }
                            }}
                          >
                            {item.name}
                          </Tag>
                        ))
                      ) : (
                        <Text color={textSub} fontSize="sm">
                          Updating
                        </Text>
                      )}
                    </HStack>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Text fontSize="md" fontWeight="700" color={textMain} mb={2}>
                    Job description
                  </Text>
                  {renderTextBlock(job?.positionPost?.description_post || job?.job_description || job?.description)}
                </Box>

                <Box>
                  <Text fontSize="md" fontWeight="700" color={textMain} mb={2}>
                    Candidate requirements
                  </Text>
                  {renderTextBlock(job?.positionPost?.requirements_post || job?.candidate_requirements || job?.requirements)}
                </Box>

                <Box>
                  <Text fontSize="md" fontWeight="700" color={textMain} mb={2}>
                    Interest
                  </Text>
                  {renderTextBlock(job?.positionPost?.benefits_post || job?.benefits)}
                </Box>

                {/* Benefit More - Tabs */}
                {job?.positionPost?.benefit_more && (
                  <BenefitMoreTabs benefitMore={job.positionPost.benefit_more} />
                )}

                <Box>
                  <Text fontSize="md" fontWeight="700" color={textMain} mb={2}>
                    Work location
                  </Text>
                  <Text color={textMain} fontSize="sm" lineHeight="1.8">
                    {job?.workLocation?.address || locationText}
                  </Text>
                </Box>

                {/* <Box>
                  <Text fontSize="lg" fontWeight="700" color={textMain} mb={2}>
                    Working time
                  </Text>
                  <Text color={textMain} fontSize="sm" lineHeight="1.8">
                    {job?.working_time || "Updating"}
                  </Text>
                </Box> */}
                <Box>
                  <Text fontSize="md" fontWeight="700" color={textMain} mb={2}>
                    How to apply
                  </Text>

                  <Text color={textMain} fontSize="sm" lineHeight="1.85">
                    Candidates apply online by clicking{" "}
                    <Text as="span" fontWeight="700">
                      Apply now
                    </Text>{" "}
                    below.
                  </Text>

                  <Text color={textMain} fontSize="sm" mt={4} lineHeight="1.8">
                    Application deadline:{" "}
                    <Text as="span" fontWeight="700">
                      {deadlineText}
                    </Text>
                    {daysLeft !== null && daysLeft >= 0 && (
                      <Text as="span" fontWeight="700">
                        {" "}
                        ({daysLeft} days left)
                      </Text>
                    )}
                  </Text>

                  <HStack mt={4} spacing={3} flexWrap="wrap">
                    <Button
                      leftIcon={<FiSend />}
                      h="40px"
                      minW={{ base: "full", md: "210px" }}
                      bg={green}
                      color="white"
                      _hover={{ bg: "#334371" }}
                      borderRadius="10px"
                      fontSize="sm"
                      fontWeight="700"
                      isDisabled={isApplyBlocked}
                      onClick={handleApplyClick}
                    >
                      {applyButtonLabel}
                    </Button>

                    <Button
                      leftIcon={showMessageButton ? <FiMessageCircle /> : savedHeartIcon}
                      h="40px"
                      minW={{ base: "full", md: "132px" }}
                      variant="outline"
                      borderColor="#334371"
                      color={green}
                      bg="white"
                      borderRadius="10px"
                      fontSize="sm"
                      fontWeight="700"
                      _hover={{ bg: "#334371", color: "white", borderColor: "#334371" }}
                      isLoading={!showMessageButton && toggleSaveJobMutation.isPending}
                      onClick={handleSecondaryActionClick}
                    >
                      {showMessageButton ? "Texting" : isSavedJob ? "Saved" : "Save this information"}
                    </Button>
                  </HStack>

                  <Box
                    mt={4}
                    bg="#F7F8FA"
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="12px"
                    px={3.5}
                    py={3}
                  >
                    <HStack align="start" spacing={2.5}>
                      <Flex
                        w="24px"
                        h="24px"
                        minW="24px"
                        borderRadius="full"
                        bg={green}
                        align="center"
                        justify="center"
                        mt="1px"
                      >
                        <Icon as={FiAlertCircle} color="white" boxSize={3} />
                      </Flex>

                      <Text fontSize="sm" color={textMain} lineHeight="1.8">
                        Report job posting: If you find that this job posting is incorrect
                        or shows signs of fraud, {" "}
                        <Text as="span" color={green} fontWeight="700">
                          Please reflect to us.
                        </Text>
                      </Text>
                    </HStack>
                  </Box>

                  <Box mt={5}>
                    <Text fontSize="md" fontWeight="700" color={textMain} mb={3}>
                      Related jobs
                    </Text>

                    {isRelatedJobsLoading ? (
                      <Flex py={6} align="center" justify="center">
                        <Spinner color={green} />
                      </Flex>
                    ) : relatedJobs.length > 0 ? (
                      <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={3.5}>
                        {relatedJobs.map((relatedJob) => (
                          <RealJobCard key={relatedJob.id} job={relatedJob} />
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text color={textSub} fontSize="sm">
                        There are no related jobs yet.
                      </Text>
                    )}
                  </Box>
                </Box>
              </VStack>
            </SectionCard>

            <Box id="related-jobs" />
          </VStack>

          {/* right */}
          <VStack align="stretch" spacing={4}>
            {/* company card */}
            <Box
              bg="white"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="12px"
              p={{ base: 3, md: 4 }}
              boxShadow="0 2px 8px rgba(15, 23, 42, 0.04)"
            >
              <HStack align="start" spacing={3}>
                <Flex
                  w="78px"
                  h="78px"
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="12px"
                  align="center"
                  justify="center"
                  bg="white"
                  overflow="hidden"
                >
                  <Avatar
                    name={companyName}
                    src={toAbsoluteCompanyLogoUrl(job?.department?.image_logo)}
                    w="78px"
                    h="78px"
                    borderRadius="0"
                  />
                </Flex>

                <Box flex="1">
                  <Text
                    fontSize="md"
                    fontWeight="700"
                    color={textMain}
                    lineHeight="1.45"
                  >
                    {companyName}
                  </Text>
                </Box>
              </HStack>

              <VStack align="stretch" spacing={3} mt={4}>
                <HStack align="start" spacing={2.5}>
                  <Icon as={FiUsers} color="#9CA3AF" mt={0.5} boxSize={4} />
                  <Text color={textSub} fontSize="sm">
                    Scale:
                  </Text>
                  <Text color={textMain} fontSize="sm" fontWeight="700">
                    {job?.employee_quantity
                      ? `${job.employee_quantity} personnel`
                      : "Updating"}
                  </Text>
                </HStack>

                <HStack align="start" spacing={2.5}>
                  <Icon as={FiBriefcase} color="#9CA3AF" mt={0.5} boxSize={4} />
                  <Text color={textSub} fontSize="sm">
                    Field:
                  </Text>
                  <Text color={textMain} fontSize="sm" fontWeight="700">
                    {job?.positionPost?.group?.name_group || "Updating"}
                  </Text>
                </HStack>

                <HStack align="start" spacing={2.5}>
                  <Icon as={FiMapPin} color="#9CA3AF" mt={0.5} boxSize={4} />
                  <Text color={textSub} fontSize="sm">
                    Location:
                  </Text>
                  <Text color={textMain} fontSize="sm" fontWeight="700">
                    {job?.workLocation?.address || locationText}
                  </Text>
                </HStack>
              </VStack>

        
            </Box>

            {/* info chung */}
            <SectionCard title="General information">
              <VStack align="stretch" spacing={3.5}>
                {/* <SidebarItem
                  icon={<FiUser />}
                  label="Education"
                  value={job?.education_level || "Updating"}
                /> */}
                <SidebarItem
                  icon={<FiUsers />}
                  label="Number of recruits"
                  value={
                    job?.employee_quantity
                      ? `${job.employee_quantity} people`
                      : "Updating"
                  }
                />
                <SidebarItem
                  icon={<FiCalendar />}
                  label="Form of work"
                  value={formatWorkTypeLabel(job?.type_of_job) || "Full-time"}
                />
              </VStack>
            </SectionCard>

            {/* related category */}
            <SectionCard title="Related expertise">
              <VStack align="stretch" spacing={4}>
                <HStack spacing={2} flexWrap="wrap">
                  {professionTags.length > 0 ? (
                    professionTags.map((item, idx) => (
                      <Tag
                        key={idx}
                        borderRadius="full"
                        px={3}
                        py={1.5}
                        fontSize="sm"
                        bg="#E8ECFF"
                        color="#334371"
                        fontWeight="600"
                        cursor="pointer"
                        transition="all 0.2s ease"
                        _hover={{
                          bg: "#D4DCF7",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(51, 67, 113, 0.15)",
                        }}
                        onClick={() => {
                          if (item.id) {
                            navigate(
                              candidateJobsByGroupUrl.replace(":groupId", item.id)
                            );
                          }
                        }}
                      >
                        {String(item.name)}
                      </Tag>
                    ))
                  ) : (
                    <Text color={textSub} fontSize="sm">
                      No data yet
                    </Text>
                  )}
                </HStack>

                <Divider />

                <Box>
                  <Text fontSize="md" fontWeight="700" color={textMain} mb={2}>
                    Find jobs by area
                  </Text>

                  <HStack spacing={2} flexWrap="wrap">
                    <Tag
                      borderRadius="full"
                      px={3}
                      py={1.5}
                      fontSize="sm"
                      bg="#F3F4F6"
                      cursor="pointer"
                      transition="all 0.2s ease"
                      _hover={{
                        bg: "#E5E7EB",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                      onClick={() => {
                        if (job?.work_location_id) {
                          navigate(
                            candidateJobsByLocationUrl.replace(":locationId", job.work_location_id)
                          );
                        }
                      }}
                    >
                      {locationText}
                    </Tag>
                  </HStack>
                </Box>
              </VStack>
            </SectionCard>
          </VStack>
        </Grid>

        <Box
          mt={{ base: 8, md: 5 }}
          mb={{ base: 6, md: 5 }}
          mx={{ base: -3, md: -4, xl: -140 }}
        >
          <Divider borderColor="#E2E8F0" />
        </Box>

        <Box>
          <ITJobInfoSection />
        </Box>

        {/* fixed left social */}
        <Box
          position="fixed"
          left="20px"
          top="45%"
          transform="translateY(-50%)"
          zIndex={20}
          display={{ base: "none", xl: "block" }}
        >
          <VStack
            bg="white"
            border="1px solid"
            borderColor={borderColor}
            borderRadius="full"
            p={1.5}
            spacing={1.5}
            boxShadow="0 6px 18px rgba(15, 23, 42, 0.08)"
          >
            <IconButton
              aria-label="facebook"
              icon={<FiFacebook />}
              borderRadius="full"
              variant="ghost"
              size="sm"
            />
            <IconButton
              aria-label="twitter"
              icon={<FiTwitter />}
              borderRadius="full"
              variant="ghost"
              size="sm"
            />
            <IconButton
              aria-label="linkedin"
              icon={<FiLinkedin />}
              borderRadius="full"
              variant="ghost"
              size="sm"
            />
            <IconButton
              aria-label="copy link"
              icon={<FiLink2 />}
              borderRadius="full"
              variant="ghost"
              size="sm"
            />
          </VStack>
        </Box>
      </Container>
      <ApplyJobModal
        isOpen={isOpen}
        onClose={onClose}
        recruitmentInforId={id}
        employeeId={authUser?.id}
        jobTitle={title}
        submitLabel={applySubmitLabel}
      />
      <CandidateLoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          onLoginClose();
          setPendingApplyAfterLogin(false);
        }}
        onSuccess={() => {
          if (!pendingApplyAfterLogin) return;
          setPendingApplyAfterLogin(true);
        }}
      />
    </Box>
  );
};

export default JobDetailPage;
