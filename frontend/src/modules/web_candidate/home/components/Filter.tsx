import { Box, Flex, Icon, IconButton, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiChevronLeft, FiChevronRight, FiSliders } from "react-icons/fi";
import { formatSalary, type IRecruitmentInfor } from "../../job/types/job";
import { formatWorkTypeLabel } from "../../../../utils/formatText";

export type FilterValue = "Address" | "Salary" | "Experience" | "Job Type";

export const FILTER_OPTIONS: Array<{ label: string; value: FilterValue }> = [
  { label: "Address", value: "Address" },
  { label: "Salary", value: "Salary" },
  { label: "Experience", value: "Experience" },
  { label: "Job Type", value: "Job Type" },
];

const ITEMS_PER_PAGE = 8;

const normalizeLabel = (value?: string | null) => (value || "").trim();
const normalizeKey = (value?: string | null) => normalizeLabel(value).toLowerCase();

const uniqueValues = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter((item) => {
    const key = normalizeKey(item);
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const formatSalaryBucket = (job: IRecruitmentInfor) => {
  return formatSalary(job.salary_from, job.salary_to, job.salary_currency);
};

const hasNumber = (value?: number | null): value is number =>
  typeof value === "number" && Number.isFinite(value);

const formatYear = (value: number) => `${value} ${value === 1 ? "year" : "years"}`;
const formatYearToken = (value: string) => `${value} ${value === "1" ? "year" : "years"}`;

export const getRecruitmentAddressLabel = (job: IRecruitmentInfor) =>
  normalizeLabel(job.workLocation?.short_address || job.work_location_name || "");

export const extractExperienceLabel = (job: IRecruitmentInfor) => {
  const explicitLabel = normalizeLabel(job.experience_label);
  if (explicitLabel) return explicitLabel;

  const min = job.experience_min ?? null;
  const max = job.experience_max ?? null;

  switch (job.experience_type) {
    case "none":
      return "Not required";
    case "exact":
      if (hasNumber(min)) return formatYear(min);
      break;
    case "range":
      if (hasNumber(min) && hasNumber(max)) return `${formatYear(min)} - ${formatYear(max)}`;
      if (hasNumber(min)) return `From ${formatYear(min)}`;
      if (hasNumber(max)) return `Up to ${formatYear(max)}`;
      break;
    case "above":
      if (hasNumber(min)) return `Over ${formatYear(min)}`;
      break;
    case "below":
      if (hasNumber(max)) return `Under ${formatYear(max)}`;
      break;
    case "flexible":
      return "Flexible";
    default:
      break;
  }

  const candidates = [
    job.positionPost?.requirements_post,
    job.candidate_requirements,
    job.requirements,
  ];

  for (const raw of candidates) {
    if (!raw) continue;

    const text = String(raw);
    const yearMatch = text.match(/(\d+\+?)\s*(year|years|năm)/i);
    if (yearMatch) return formatYearToken(yearMatch[1]);

    if (/not\s*required|fresher|intern|không\s*yêu\s*cầu/i.test(text)) {
      return "Not required";
    }

    try {
      const parsed = JSON.parse(text);
      const parsedText = JSON.stringify(parsed);
      const parsedYearMatch = parsedText.match(/(\d+\+?)\s*(year|years|năm)/i);
      if (parsedYearMatch) return formatYearToken(parsedYearMatch[1]);
    } catch {
      // keep moving; not a JSON payload
    }
  }

  return "Not updated yet";
};

export const getJobFilterLabel = (job: IRecruitmentInfor, filter: FilterValue) => {
  if (filter === "Address") return getRecruitmentAddressLabel(job);
  if (filter === "Salary") return formatSalaryBucket(job);
  if (filter === "Experience") return extractExperienceLabel(job);
  return formatWorkTypeLabel(job.type_of_job);
};

export const isValidFilterValue = (value?: string | null): value is FilterValue =>
  FILTER_OPTIONS.some((item) => item.value === value);

export const doesJobMatchFilter = (
  job: IRecruitmentInfor,
  selectedFilter: FilterValue,
  selectedValue: string
) => {
  const target = normalizeKey(selectedValue);
  if (!target) return true;
  return normalizeKey(getJobFilterLabel(job, selectedFilter)) === target;
};

type FilterDropdownProps = {
  jobs: IRecruitmentInfor[];
  isLoading?: boolean;
  selectedFilter: FilterValue;
  selectedValue: string;
  onSelectedFilterChange: (value: FilterValue) => void;
  onSelectedValueChange: (value: string) => void;
};

export default function FilterDropdown({
  jobs,
  isLoading = false,
  selectedFilter,
  selectedValue,
  onSelectedFilterChange,
  onSelectedValueChange,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const filterData = useMemo(() => {
    return uniqueValues(jobs.map((job) => getJobFilterLabel(job, selectedFilter)).filter(Boolean));
  }, [jobs, selectedFilter]);

  const totalPages = Math.max(1, Math.ceil(filterData.length / ITEMS_PER_PAGE));

  const currentValues = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filterData.slice(start, start + ITEMS_PER_PAGE);
  }, [filterData, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedFilter]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handleSelected = (value: FilterValue) => {
    onSelectedFilterChange(value);
    onSelectedValueChange("");
    setIsOpen(false);
  };

  const handleChipClick = (value: string) => {
    onSelectedValueChange(selectedValue === value ? "" : value);
  };

  return (
    <Flex
      w="full"
      px={{ base: 4, md: 6, xl: 0 }}
      align="center"
      gap={{ base: 3, md: 4 }}
      flexDirection={{ base: "column", md: "row" }}
      justifyContent="space-between"
    >
      <Box position={"relative"} ref={wrapperRef} flex="0 0 auto">
        <Flex
          align={"center"}
          gap={"8px"}
          px={{ base: "10px", md: "12px" }}
          py={{ base: "8px", md: "8px" }}
          bg="#F8F8F8"
          border="1px solid"
          borderColor="#D9D9D9"
          borderRadius="14px"
          cursor="pointer"
          onClick={() => setIsOpen((prev) => !prev)}
          userSelect="none"
        >
          <Flex align="center" gap="8px">
            <Icon as={FiSliders} boxSize={4} color="#9CA3AF" />
            <Text color="#A0AEC0" fontSize="sm" fontWeight="500">
              Filter by:
            </Text>
            <Text color="#2D3748" fontSize="sm" fontWeight="700">
              {selectedFilter}
            </Text>
            {selectedValue ? (
              <Text
                color="#334371"
                fontSize="sm"
                fontWeight="700"
                maxW={{ base: "120px", md: "180px" }}
                noOfLines={1}
              >
                {selectedValue}
              </Text>
            ) : null}
          </Flex>
          <Icon as={FiChevronDown} boxSize={4} color="#6B7280" />
        </Flex>

        {isOpen && (
          <Box
            position="absolute"
            top="calc(100% + 10px)"
            left="0"
            w={{ base: "220px", md: "300px" }}
            bg="white"
            borderRadius="16px"
            boxShadow="0 10px 30px rgba(0,0,0,0.12)"
            px={2}
            py={2}
            zIndex={20}
          >
            <VStack align="stretch" gap="2px">
              {FILTER_OPTIONS.map((item) => {
                const isActive = item.value === selectedFilter;

                return (
                  <Flex
                    key={item.value}
                    align="center"
                    justify="space-between"
                    px={{ base: 3, md: 3 }}
                    py={{ base: 2, md: 2 }}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: "#F7FAFC" }}
                    gap={3}
                    onClick={() => handleSelected(item.value as FilterValue)}
                  >
                    <Text
                      fontSize="sm"
                      fontWeight={isActive ? "600" : "500"}
                      color={isActive ? "#334371" : "#1F2937"}
                    >
                      {item.label}
                    </Text>

                    {isActive && <Icon as={FiCheck} boxSize={4} color="#334371" />}
                  </Flex>
                );
              })}
            </VStack>
          </Box>
        )}
      </Box>

      <Flex flex="1" minW={0} justify="flex-end" align="center" gap={3}>
        <IconButton
          aria-label="Previous filter page"
          icon={<FiChevronLeft />}
          isRound
          size="sm"
          variant="outline"
          borderColor="#334371"
          color="#334371"
          _hover={{ bg: "#334371" }}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          isDisabled={page <= 1 || isLoading}
        />

        <Flex minW={0} maxW="100%" gap={3} overflow="hidden" justify="flex-end">
          {isLoading ? (
            <Text color="#94A3B8" fontSize="sm"></Text>
          ) : currentValues.length === 0 ? (
            <Text color="#94A3B8" fontSize="sm">There is no filtered data yet.</Text>
          ) : (
            currentValues.map((item) => {
              const isActive = selectedValue === item;
              return (
                <Box
                  key={item}
                  px={{ base: 3, md: 4 }}
                  py={{ base: 1.5, md: 2 }}
                  borderRadius="999px"
                  bg={isActive ? "#334371" : "#EFF1F5"}
                  color={isActive ? "white" : "#334155"}
                  fontWeight={isActive ? "700" : "600"}
                  fontSize="sm"
                  whiteSpace="nowrap"
                  cursor="pointer"
                  onClick={() => handleChipClick(item)}
                  _hover={{ opacity: 0.92 }}
                >
                  {item}
                </Box>
              );
            })
          )}
        </Flex>

        <IconButton
          aria-label="Next filter page"
          icon={<FiChevronRight />}
          isRound
          size="sm"
          variant="outline"
          borderColor="#334371"
          color="#334371"
          _hover={{ bg: "#334371" }}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          isDisabled={page >= totalPages || isLoading}
        />
      </Flex>
    </Flex>
  );
}
