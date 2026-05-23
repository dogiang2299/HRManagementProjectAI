import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  SearchIcon,
  TimeIcon,
} from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../../auth/store/auth.store";
import theme from "../../../../theme";
import {
  SCHEDULE_TYPE_DISPLAY,
  ScheduleType,
  type ScheduleTypeType,
} from "../../../../constant";
import Modal_Interview from "../components/Modal_Interview";
import InterviewIllustration from "../components/InterviewIllustration";
import { useGetInterview } from "../api/get";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import type { IInterviewSchedule, IInterviewScheduleDetail } from "../types";
import { PaginationBar } from "../../../../components/common/PaginationBar";

type Nullable<T> = T | null | undefined;

type CandidateVM = {
  id: string;
  name: string;
  avatar?: string | null;
};

type ScheduleCardVM = {
  id: string;
  scheCode?: string;
  dateKey: string;
  dayLabel: string;
  shortDateLabel: string;
  timeLabel: string;
  durationLabel: string;
  typeLabel: string;
  typeTone: "blue" | "purple" | "green" | "orange" | "gray";
  candidates: CandidateVM[];
  candidatesText: string;
  jobTitle: string;
  companyName?: string;
  locationText: string;
  roomText?: string;
  meetingLink?: string;
  isOnline: boolean;
  statusLabel: "Today" | "Upcoming" | "Completed";
  statusTone: "green" | "blue" | "gray";
  rawDate: Date;
};

const VIEW_MODES = {
  WEEKLY: "weekly",
};

const BRAND = "#334371";

const UI = {
  pageBg: "#F5F7FB",
  panelBg: "#FFFFFF",
  softBg: "#F7F9FC",
  tintedBg: "#F2F5FB",
  tintedBgStrong: "#EAF0FA",
  border: "#D8E0EF",
  borderStrong: "#C7D2E5",
  heading: "#1F2A44",
  text: "#334371",
  subText: "#667085",
  muted: "#8A94A6",
  brand: BRAND,
};

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatWeekRange(date: Date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startText = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(start);

  const endText = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(end);

  return `${startText} - ${endText}`;
}

function getStartOfWeek(date: Date) {
  const clone = new Date(date);
  const day = clone.getDay(); // 0 CN, 1 T2...
  const diff = day === 0 ? -6 : 1 - day;
  clone.setDate(clone.getDate() + diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinWeek(date: Date, pivot: Date) {
  const start = getStartOfWeek(pivot);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function safeDate(dateLike: Nullable<string | Date>) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeTypeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getScheduleTypeValue(item: IInterviewSchedule): ScheduleTypeType | undefined {
  const raw = item.type_schedule?.trim();
  if (!raw) return undefined;

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

  return undefined;
}

function getTypeLabel(item: IInterviewSchedule) {
  const scheduleType = getScheduleTypeValue(item);
  if (!scheduleType) {
    return item.type_schedule?.trim() || "Interview schedule";
  }

  return SCHEDULE_TYPE_DISPLAY[scheduleType];
}

function getTypeTone(scheduleType?: ScheduleTypeType): ScheduleCardVM["typeTone"] {
  switch (scheduleType) {
    case ScheduleType.InPersonInterview:
      return "blue";
    case ScheduleType.AssessmentTest:
      return "orange";
    case ScheduleType.ExternalOnlineInterview:
      return "purple";
    case ScheduleType.OnlineTest:
      return "orange";
    case ScheduleType.InternshipEvaluation:
      return "green";
    case ScheduleType.InternshipAcceptance:
      return "green";
    default:
      return "gray";
  }
}

function getStatusTone(
  label: ScheduleCardVM["statusLabel"],
): ScheduleCardVM["statusTone"] {
  if (label === "Today") return "green";
  if (label === "Upcoming") return "blue";
  return "gray";
}

function buildCandidates(item: IInterviewSchedule): CandidateVM[] {
  const fromCandidates =
    item.candidates?.map((sc) => ({
      id:
        sc.candidate?.id ||
        sc.candidate_id ||
        sc.id ||
        Math.random().toString(),
      name: sc.candidate?.candidate_name || "Unnamed candidate",
      avatar: sc.candidate?.avatar_file || null,
    })) || [];

  const fromScheduleCandidates =
    item.scheduleCandidates?.map((sc) => ({
      id: sc.candidate?.id || sc.id || Math.random().toString(),
      name: sc.candidate?.candidate_name || "Unnamed candidate",
      avatar: sc.candidate?.avatar_file || null,
    })) || [];

  const fromApplications =
    item.applications?.map((ap) => ({
      id: ap.candidate?.id || ap.id || Math.random().toString(),
      name: ap.candidate?.candidate_name || "Unnamed candidate",
      avatar: ap.candidate?.avatar_file || null,
    })) || [];

  const merged = [
    ...fromCandidates,
    ...fromScheduleCandidates,
    ...fromApplications,
  ];

  const map = new Map<string, CandidateVM>();
  merged.forEach((c) => {
    const key = c.id || c.name;
    if (!map.has(key)) map.set(key, c);
  });

  return Array.from(map.values());
}

function buildCandidatesText(candidates: CandidateVM[]) {
  if (!candidates.length) return "No candidates";
  if (candidates.length <= 2) return candidates.map((c) => c.name).join(", ");
  return `${candidates[0].name}, ${candidates[1].name} +${candidates.length - 2} more`;
}

function buildJobTitle(item: IInterviewSchedule) {
  const fromApplications = item.applications?.find(
    (ap) =>
      ap.recruitment_infor?.post_title ||
      ap.recruitment_infor?.internal_title ||
      ap.recruitment_infor?.positionPost?.name_post,
  )?.recruitment_infor;

  if (fromApplications) {
    return (
      fromApplications.post_title ||
      fromApplications.internal_title ||
      "Unassigned job posting"
    );
  }

  const fromCandidateApps = item.candidates
    ?.flatMap((sc) => sc.candidate?.statusApplication || [])
    ?.find(
      (ap) =>
        ap.recruitment_infor?.post_title ||
        ap.recruitment_infor?.internal_title 
    )?.recruitment_infor;

  if (fromCandidateApps) {
    return (
      fromCandidateApps.post_title ||
      fromCandidateApps.internal_title ||
      fromCandidateApps.positionPost?.name_post ||
      "Unassigned job posting"
    );
  }

  const fromScheduleCandidates = item.scheduleCandidates
    ?.flatMap((sc) => sc.candidate?.statusApplication || [])
    ?.find(
      (ap) =>
        ap.recruitment_infor?.post_title ||
        ap.recruitment_infor?.internal_title 
    )?.recruitment_infor;

  if (fromScheduleCandidates) {
    return (
      fromScheduleCandidates.post_title ||
      fromScheduleCandidates.internal_title ||
      "Unassigned job posting"
    );
  }

  return "Unassigned job posting";
}

function buildCompanyName(item: IInterviewSchedule) {
  if (item.company?.full_name || item.company?.acronym_name) {
    return item.company.full_name || item.company.acronym_name || undefined;
  }

  const fromApplications = item.applications?.find(
    (ap) =>
      ap.recruitment_infor?.department?.full_name ||
      ap.recruitment_infor?.department?.acronym_name,
  )?.recruitment_infor?.department;

  if (fromApplications) {
    return (
      fromApplications.full_name || fromApplications.acronym_name || undefined
    );
  }

  const fromCandidateApps = item.candidates
    ?.flatMap((sc) => sc.candidate?.statusApplication || [])
    ?.find(
      (ap) =>
        ap.recruitment_infor?.department?.full_name ||
        ap.recruitment_infor?.department?.acronym_name,
    )?.recruitment_infor?.department;

  if (fromCandidateApps) {
    return (
      fromCandidateApps.full_name || fromCandidateApps.acronym_name || undefined
    );
  }

  const fromScheduleCandidates = item.scheduleCandidates
    ?.flatMap((sc) => sc.candidate?.statusApplication || [])
    ?.find(
      (ap) =>
        ap.recruitment_infor?.department?.full_name ||
        ap.recruitment_infor?.department?.acronym_name,
    )?.recruitment_infor?.department;

  if (fromScheduleCandidates) {
    return (
      fromScheduleCandidates.full_name ||
      fromScheduleCandidates.acronym_name ||
      undefined
    );
  }

  return undefined;
}

function normalizeSchedule(item: IInterviewSchedule): ScheduleCardVM | null {
  const rawDate = safeDate(item.times || item.interview_date);
  if (!rawDate) return null;

  const now = new Date();
  const isToday = isSameDay(rawDate, now);
  const isUpcoming = rawDate.getTime() > now.getTime();

  const statusLabel: ScheduleCardVM["statusLabel"] = isToday
    ? "Today"
    : isUpcoming
      ? "Upcoming"
      : "Completed";

  const candidates = buildCandidates(item);
  const scheduleType = getScheduleTypeValue(item);
  const typeLabel = getTypeLabel(item);
  const isOnline = !!item.meeting_link;

  const locationParts = [
    item.interview_location?.trim(),
    item.interview_room?.trim() ? `Room ${item.interview_room?.trim()}` : "",
  ].filter(Boolean);

  return {
    id: item.id,
    scheCode: item.sche_code || undefined,
    dateKey: formatDateKey(rawDate),
    dayLabel: formatDayLabel(rawDate),
    shortDateLabel: formatShortDateLabel(rawDate),
    timeLabel: formatTimeLabel(rawDate),
    durationLabel: `${item.time_duration || 0} mins`,
    typeLabel,
    typeTone: getTypeTone(scheduleType),
    candidates,
    candidatesText: buildCandidatesText(candidates),
    jobTitle: buildJobTitle(item),
    companyName: buildCompanyName(item),
    locationText: isOnline
      ? "Online meeting"
      : locationParts.join(" • ") || "Interview location not set",
    roomText: item.interview_room || undefined,
    meetingLink: item.meeting_link || undefined,
    isOnline,
    statusLabel,
    statusTone: getStatusTone(statusLabel),
    rawDate,
  };
}

function groupSchedules(items: ScheduleCardVM[]) {
  const sorted = [...items].sort(
    (a, b) => a.rawDate.getTime() - b.rawDate.getTime(),
  );

  const map = new Map<
    string,
    {
      dateKey: string;
      dayLabel: string;
      shortDateLabel: string;
      items: ScheduleCardVM[];
    }
  >();

  sorted.forEach((item) => {
    if (!map.has(item.dateKey)) {
      map.set(item.dateKey, {
        dateKey: item.dateKey,
        dayLabel: item.dayLabel,
        shortDateLabel: item.shortDateLabel,
        items: [],
      });
    }
    map.get(item.dateKey)!.items.push(item);
  });

  return Array.from(map.values());
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Flex align="center" justify="center" minH={{ base: "420px", md: "500px" }}>
      <VStack spacing={3}>
        <Box
          transform={{
            base: "scale(0.72)",
            md: "scale(0.82)",
            lg: "scale(0.9)",
          }}
          transformOrigin="top center"
        >
          <InterviewIllustration />
        </Box>

       

        <Text
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="800"
          color={UI.heading}
          mt={1}
          letterSpacing="-0.02em"
        >
          No interview schedules yet
        </Text>

        <Text
          fontSize={{ base: "md", md: "lg" }}
          color={UI.subText}
          textAlign="center"
          maxW="700px"
        >
          Create your first schedule to manage interviews in a clean,
          structured, and professional way.
        </Text>

        <Button
          mt={4}
          bg={UI.brand}
          color="white"
          px={8}
          size="lg"
          fontSize="md"
          borderRadius="12px"
          _hover={{ bg: "#2B3A63" }}
          onClick={onAdd}
        >
          ADD SCHEDULES
        </Button>
      </VStack>
    </Flex>
  );
}

function ScheduleStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "blue" | "gray";
}) {
  const styles = {
    green: { bg: "#EAF7EF", color: "#2F855A", borderColor: "#BFE3CC" },
    blue: { bg: "#EDF3FF", color: "#335C9E", borderColor: "#C8D7F2" },
    gray: { bg: "#F2F5FB", color: "#5B6780", borderColor: "#D8E0EF" },
  }[tone];

  return (
    <Badge
      px={2.5}
      py={0.75}
      borderRadius="10px"
      bg={styles.bg}
      color={styles.color}
      border="1px solid"
      borderColor={styles.borderColor}
      textTransform="none"
      fontWeight="700"
      fontSize="11px"
      letterSpacing="0.01em"
    >
      {label}
    </Badge>
  );
}

function TypeBadge({
  label,
  tone,
}: {
  label: string;
  tone: "blue" | "purple" | "green" | "orange" | "gray";
}) {
  const styles = {
    blue: { bg: "#EEF3FF", color: "#334371", borderColor: "#CAD6F0" },
    purple: { bg: "#F4EEFF", color: "#6B46C1", borderColor: "#D9C7F5" },
    green: { bg: "#EAF7EF", color: "#2F855A", borderColor: "#BFE3CC" },
    orange: { bg: "#FFF4E8", color: "#C05621", borderColor: "#F2D0AE" },
    gray: { bg: "#F2F5FB", color: "#5B6780", borderColor: "#D8E0EF" },
  }[tone];

  return (
    <Badge
      px={2.5}
      py={0.75}
      borderRadius="10px"
      bg={styles.bg}
      color={styles.color}
      border="1px solid"
      borderColor={styles.borderColor}
      textTransform="none"
      fontWeight="700"
      fontSize="11px"
      letterSpacing="0.01em"
    >
      {label}
    </Badge>
  );
}

function ScheduleCard({
  item,
  onEdit,
}: {
  item: ScheduleCardVM;
  onEdit: (id: string) => void;
}) {
  return (
    <Box
      bg={UI.panelBg}
      border="1px solid"
      borderColor={UI.border}
      borderRadius="14px"
      px={{ base: 3.5, md: 4 }}
      py={{ base: 3.5, md: 4 }}
      transition="all 0.2s ease"
      _hover={{
        borderColor: UI.borderStrong,
        boxShadow: "0 10px 24px rgba(51, 67, 113, 0.08)",
        transform: "translateY(-1px)",
      }}
    >
      <Flex
        direction={{ base: "column", lg: "row" }}
        align={{ base: "stretch", lg: "center" }}
        justify="space-between"
        gap={3}
      >
        <HStack align="stretch" spacing={3} flex="1">
          <VStack
            align="center"
            justify="center"
            minW={{ base: "76px", md: "82px" }}
            bg={UI.tintedBg}
            border="1px solid"
            borderColor={UI.border}
            borderRadius="12px"
            px={2.5}
            py={2.5}
            spacing={0.5}
          >
            <Text
              fontSize="2xs"
              color={UI.muted}
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="0.04em"
            >
              {item.shortDateLabel}
            </Text>

            <Text
              fontSize="xl"
              fontWeight="800"
              color={UI.heading}
              lineHeight="1"
            >
              {item.timeLabel}
            </Text>

            <Text fontSize="xs" color={UI.subText} fontWeight="700">
              {item.durationLabel}
            </Text>
          </VStack>

          <VStack align="stretch" spacing={2.5} flex="1" minW={0}>
            <HStack
              justify="space-between"
              align="start"
              spacing={3}
              wrap="wrap"
            >
              <VStack align="stretch" spacing={0.5} flex="1" minW={0}>
                <HStack spacing={2} wrap="wrap">
                  <Text
                    fontSize={{ base: "md", md: "lg" }}
                    fontWeight="800"
                    color={UI.heading}
                    noOfLines={1}
                    letterSpacing="-0.02em"
                  >
                    {item.jobTitle}
                  </Text>

                  <TypeBadge label={item.typeLabel} tone={item.typeTone} />
                  <ScheduleStatusBadge
                    label={item.statusLabel}
                    tone={item.statusTone}
                  />
                </HStack>
              </VStack>
            </HStack>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={2.5}>
              <Box
                bg={UI.tintedBg}
                border="1px solid"
                borderColor={UI.border}
                borderRadius="12px"
                px={3}
                py={2.5}
              >
                <Text
                  fontSize="xs"
                  color={UI.text}
                  fontWeight="800"
                  mb={1.5}
                  textTransform="uppercase"
                  letterSpacing="0.03em"
                >
                  Candidates
                </Text>

                <HStack justify="space-between" align="center" spacing={3}>
                  <HStack spacing={3} minW={0}>
                    <AvatarGroup size="sm" max={3}>
                      {item.candidates.map((candidate) => (
                        <Avatar
                          key={candidate.id}
                          name={candidate.name}
                          src={candidate.avatar || undefined}
                          bg={theme.colors.primary}
                          color={'white'}
                          border="2px solid white"
                        />
                      ))}
                    </AvatarGroup>

                    <Tooltip
                      label={item.candidates.map((c) => c.name).join(", ")}
                      hasArrow
                    >
                      <Text
                        fontSize="sm"
                        fontWeight="700"
                        color={UI.heading}
                        noOfLines={1}
                      >
                        {item.candidatesText}
                      </Text>
                    </Tooltip>
                  </HStack>
                </HStack>
              </Box>

              <Box
                bg={UI.tintedBg}
                border="1px solid"
                borderColor={UI.border}
                borderRadius="12px"
                px={3}
                py={2.5}
              >
                <Text
                  fontSize="xs"
                  color={UI.text}
                  fontWeight="800"
                  mb={1.5}
                  textTransform="uppercase"
                  letterSpacing="0.03em"
                >
                  Location
                </Text>

                <VStack align="start" spacing={1}>
                  <Text
                    fontSize="sm"
                    fontWeight="700"
                    color={UI.heading}
                    noOfLines={2}
                  >
                    {item.locationText}
                  </Text>

                  {item.meetingLink ? (
                    <Link
                      href={item.meetingLink}
                      isExternal
                      fontSize="sm"
                      color={UI.brand}
                      fontWeight="700"
                    >
                      Open meeting link <ExternalLinkIcon mx="2px" />
                    </Link>
                  ) : null}
                </VStack>
              </Box>
            </SimpleGrid>

            <HStack
              justify="space-between"
              align={{ base: "start", md: "center" }}
              flexWrap="wrap"
              spacing={3}
              pt={0.5}
            >
              <HStack spacing={4} flexWrap="wrap">
                <HStack spacing={1.5}>
                  <CalendarIcon color={UI.muted} />
                  <Text fontSize="sm" color={UI.subText} fontWeight="600">
                    {item.dayLabel}
                  </Text>
                </HStack>

                <HStack spacing={1.5}>
                  <TimeIcon color={UI.muted} />
                  <Text fontSize="sm" color={UI.subText} fontWeight="600">
                    {item.durationLabel}
                  </Text>
                </HStack>
              </HStack>

              <HStack spacing={2}>
               

                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="md"
                  fontWeight="700"
                  borderColor={UI.borderStrong}
                  color={UI.heading}
                  _hover={{ bg: UI.tintedBg }}
                  onClick={() => onEdit(item.id)}
                >
                  EDIT
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </HStack>
      </Flex>
    </Box>
  );
}

function ScheduleGroup({
  title,
  items,
  onEdit,
}: {
  title: string;
  items: ScheduleCardVM[];
  onEdit: (id: string) => void;
}) {
  return (
    <VStack align="stretch" spacing={3.5}>
      <HStack justify="space-between" align="center">
        <HStack spacing={3}>
          <Text
            fontSize="lg"
            fontWeight="800"
            color={UI.heading}
            letterSpacing="-0.02em"
          >
            {title}
          </Text>
          <Badge
            px={2.5}
            py={0.75}
            borderRadius="10px"
            bg={UI.tintedBg}
            color={UI.text}
            border="1px solid"
            borderColor={UI.border}
            textTransform="none"
            fontSize="11px"
            fontWeight="700"
          >
            {items.length} schedule{items.length > 1 ? "s" : ""}
          </Badge>
        </HStack>
      </HStack>

      <VStack align="stretch" spacing={2.5}>
        {items.map((item) => (
          <ScheduleCard key={item.id} item={item} onEdit={onEdit} />
        ))}
      </VStack>
    </VStack>
  );
}

type InterviewScheduleProps = {
  recruitmentInforId?: string;
};

export const Interview_Schedule = ({ recruitmentInforId }: InterviewScheduleProps = {}) => {
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useGetInterview({
    pages: 1,
    limit: 1000,
    search: debouncedSearch || undefined,
    recruitment_infor_id: recruitmentInforId,
    sortBy: "times",
    sortOrder: "asc",
  });

  const rawSchedules = data?.data || [];

  const scheduleById = useMemo(() => {
    const map = new Map<string, IInterviewScheduleDetail>();
    rawSchedules.forEach((item) => {
      map.set(item.id, item as IInterviewScheduleDetail);
    });
    return map;
  }, [rawSchedules]);

  const editingScheduleData = useMemo(() => {
    if (!editingScheduleId) {
      return undefined;
    }

    return scheduleById.get(editingScheduleId);
  }, [editingScheduleId, scheduleById]);

  const normalizedSchedules = useMemo(() => {
    return rawSchedules
      .map((item) => normalizeSchedule(item as IInterviewSchedule))
      .filter(Boolean) as ScheduleCardVM[];
  }, [rawSchedules]);

  const companyOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        normalizedSchedules
          .map((item) => item.companyName)
          .filter(Boolean) as string[],
      ),
    );
    return names;
  }, [normalizedSchedules]);

  const filteredSchedules = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return normalizedSchedules.filter((item) => {
      const matchWeek = isWithinWeek(item.rawDate, currentWeek);

      const matchCompany =
        selectedCompany === "all" || item.companyName === selectedCompany;

      const haystack = [
        item.jobTitle,
        item.typeLabel,
        item.companyName,
        item.locationText,
        item.candidates.map((c) => c.name).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = !keyword || haystack.includes(keyword);

      return matchWeek && matchCompany && matchSearch;
    });
  }, [normalizedSchedules, currentWeek, search, selectedCompany]);

  const groupedSchedules = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    const currentPageItems = filteredSchedules.slice(start, end);
    return groupSchedules(currentPageItems);
  }, [filteredSchedules, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCompany, currentWeek]);

  const summary = useMemo(() => {
    const total = filteredSchedules.length;
    const totalCandidates = filteredSchedules.reduce(
      (sum, item) => sum + item.candidates.length,
      0,
    );
    return { total, totalCandidates };
  }, [filteredSchedules]);

  const handlePrevWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() - 7);
    setCurrentWeek(next);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  const handleResetToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingScheduleId(null);
    setOpenModal(true);
  };

  const handleOpenEditModal = (scheduleId: string) => {
    setModalMode("edit");
    setEditingScheduleId(scheduleId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setModalMode("add");
    setEditingScheduleId(null);
  };

  return (
    <Box minH="100vh" h="calc(100vh - 96px)" overflow="hidden">
      <VStack align="stretch" spacing={4} h="100%" minH={0}>
        {/* Toolbar */}
        <Flex
          bg={UI.panelBg}
          justify="space-between"
          align={{ base: "stretch", xl: "center" }}
          direction={{ base: "column", xl: "row" }}
          gap={3}
        >
          <HStack flexShrink={0}>
            <Button
              bg={UI.brand}
              color="white"
              px={5}
              h="44px"
              borderRadius="12px"
              fontWeight="700"
              _hover={{ bg: "#2B3A63" }}
              onClick={handleOpenAddModal}
            >ADD</Button>
          </HStack>

          <Stack
            direction={{ base: "column", lg: "row" }}
            align={{ base: "stretch", lg: "center" }}
            justify="flex-end"
            spacing={3}
            flex="1"
          >
            <InputGroup maxW={{ base: "100%", lg: "420px" }}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate, job posting, interview type..."
                borderColor={UI.border}
                borderRadius="12px"
                _placeholder={{ color: UI.muted }}
                bg={UI.softBg}
                color={UI.heading}
                h="44px"
                _hover={{ borderColor: UI.borderStrong }}
                _focus={{
                  borderColor: UI.brand,
                  boxShadow: "0 0 0 1px #334371",
                  bg: "white",
                }}
              />
            </InputGroup>

            <HStack
              spacing={2}
              bg={UI.softBg}
              border="1px solid"
              borderColor={UI.border}
              // px={2}
              // py={1}
              borderRadius="12px"
              align="center"
              justify="center"
            >
              <IconButton
                aria-label="Previous week"
                icon={<ChevronLeftIcon boxSize={5} />}
                variant="ghost"
                borderRadius="10px"
                color={UI.heading}
                _hover={{ bg: UI.tintedBg }}
                onClick={handlePrevWeek}
                h="44px"
                w="44px"
              />
              <Text
                whiteSpace="nowrap"
                fontWeight="700"
                color="gray.700"
                minW="190px"
                textAlign="center"
                fontSize="sm"
              >
                {formatWeekRange(currentWeek)}
              </Text>
              <IconButton
                aria-label="Previous week"
                icon={<ChevronRightIcon boxSize={5} />}
                variant="ghost"
                borderRadius="10px"
                color={UI.heading}
                _hover={{ bg: UI.tintedBg }}
                onClick={handleNextWeek}
                h="44px"
                w="44px"
              />
            </HStack>

            <Button
              leftIcon={<CalendarIcon />}
              variant="outline"
              bg={UI.softBg}
              borderColor={UI.border}
              color={UI.heading}
              borderRadius="12px"
              fontWeight="700"
              px={4}
              h="44px"
              _hover={{ bg: UI.tintedBg }}
              onClick={handleResetToCurrentWeek}
            >
              {VIEW_MODES.WEEKLY.toUpperCase()}
            </Button>

            {!useAuthStore((s) => s.hasAnyRole(["Employer"])) ? (
              <Box w={{ base: "100%", lg: "220px" }}>
                <SearchCombobox
                  value={selectedCompany}
                  onChange={(value) => setSelectedCompany(value || "all")}
                  options={[
                    { id: "all", name: "All companies" },
                    ...companyOptions.map((company) => ({
                      id: company,
                      name: company,
                    })),
                  ]}
                  placeholder="Filter by company"
                  isClearable={false}
                  size="md"
                  inputHeight="44px"
                />
              </Box>
            ) : null}
          </Stack>
        </Flex>

        {/* Content */}
        <Box
          bg={UI.panelBg}
          position="relative"
          overflow="hidden"
          flex="1"
          minH={0}
        >
          {isLoading ? (
            <VStack align="stretch" spacing={4} p={2}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} h="145px" borderRadius="18px" />
              ))}
            </VStack>
          ) : groupedSchedules.length === 0 ? (
            <EmptyState onAdd={handleOpenAddModal} />
          ) : (
            <VStack align="stretch" spacing={6} h="100%" minH={0}>
              <Flex
                justify="space-between"
                align={{ base: "start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                gap={3}
                flexShrink={0}
                px={{ base: 1, md: 2 }}
                pt={{ base: 1, md: 2 }}
              >
                <VStack align="start" spacing={0.5}>
                  <Text
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontWeight="800"
                    color={UI.heading}
                    letterSpacing="-0.02em"
                  >
                    Interview schedules
                  </Text>

                  <Text fontSize="sm" color={UI.subText} fontWeight="500">
                    Weekly overview of candidate interview arrangements
                  </Text>
                </VStack>
                <HStack
                  spacing={3}
                  bg={theme.colors.primary}
                  border="1px solid"
                  borderColor={UI.border}
                  borderRadius="12px"
                  px={4}
                  py={2.5}
                >
                  <VStack spacing={0} align="start">
                    <Text
                      fontSize="xs"
                      color={'white'}
                      fontWeight="800"
                      textTransform="uppercase"
                    >
                      Schedules
                    </Text>
                    <Text fontSize="lg" fontWeight="800" color={'white'}>
                      {summary.total}
                    </Text>
                  </VStack>

                  <Divider
                    orientation="vertical"
                    h="34px"
                    borderColor={UI.borderStrong}
                  />

                  <VStack spacing={0} align="start">
                    <Text
                      fontSize="xs"
                      color={'white'}
                      fontWeight="800"
                      textTransform="uppercase"
                    >
                      Candidates
                    </Text>
                    <Text fontSize="lg" fontWeight="800" color={'white'}>
                      {summary.totalCandidates}
                    </Text>
                  </VStack>

                  {isFetching ? (
                    <>
                      <Divider
                        orientation="vertical"
                        h="34px"
                        borderColor={UI.borderStrong}
                      />
                      <Text fontSize="sm" color={UI.subText} fontWeight="600">
                        Refreshing...
                      </Text>
                    </>
                  ) : null}
                </HStack>{" "}
              </Flex>

              <Divider flexShrink={0} />

              <Box
                flex="1"
                minH={0}
                overflowY="auto"
                px={{ base: 1, md: 2 }}
                pb={{ base: 2, md: 3 }}
              >
                <VStack align="stretch" spacing={8}>
                  {groupedSchedules.map((group) => (
                    <ScheduleGroup
                      key={group.dateKey}
                      title={group.dayLabel}
                      items={group.items}
                      onEdit={handleOpenEditModal}
                    />
                  ))}
                </VStack>
              </Box>
            </VStack>
          )}
        </Box>
      </VStack>

      {!isLoading && filteredSchedules.length > 0 && (
        <PaginationBar
          total={filteredSchedules.length}
          page={page}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          onPerPageChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />
      )}

        <Modal_Interview
          isOpen={openModal}
          onClose={handleCloseModal}
          mode={modalMode}
          data={modalMode === "edit" ? editingScheduleData : undefined}
          fixedRecruitmentId={recruitmentInforId}
        />
    </Box>
  );
};

export default Interview_Schedule;
