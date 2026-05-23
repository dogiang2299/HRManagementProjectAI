import { Box, Flex, Icon, Input, InputGroup, InputLeftElement, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { useGetJobs } from "../api/getJobs";
import type { IJobItem } from "../types/job";
import JobCard from "../components/JobCard";
import { FiInbox, FiSearch } from "react-icons/fi";
import theme from "../../../../theme";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "../../../../components/common/Pagination";
import FilterDropdown, {
  doesJobMatchFilter,
  getRecruitmentAddressLabel,
  isValidFilterValue,
  type FilterValue,
} from "../../home/components/Filter";

const JOBS_PER_PAGE = 9;
const FILTER_SOURCE_LIMIT = 500;

const normalizeSearchText = (value?: string | number | null) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const doesJobMatchKeyword = (job: IJobItem, keyword: string) => {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) return true;

  const haystack = [
    job.post_title,
    job.internal_title,
    job.recruitment_code,
    job.department_name,
    job.department?.full_name,
    job.department?.acronym_name,
    job.work_location_name,
    job.workLocation?.short_address,
    job.workLocation?.full_name,
    job.workLocation?.acronym_name,
    job.rank_name,
    (job as any).type_of_job,
    (job as any).positionPost?.name_post,
  ]
    .map(normalizeSearchText)
    .join(" ");

  return haystack.includes(normalizedKeyword);
};

export default function JobList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const searchKeyword = (searchParams.get("search") || "").trim();
  const legacyLocationKeyword = (searchParams.get("location") || "").trim();
  const locationId = (searchParams.get("locationId") || "").trim();
  const hasRouteLocationFilter = !locationId && legacyLocationKeyword.length > 0;
  const filterByParam = searchParams.get("filterBy");
  const legacyFilter = isValidFilterValue(filterByParam) ? filterByParam : null;
  const routeSearchKeyword = legacyFilter ? "" : searchKeyword;
  const [localSearch, setLocalSearch] = useState(routeSearchKeyword);
  const localSearchKeyword = localSearch.trim();
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>(legacyFilter ?? "Address");
  const [selectedFilterValue, setSelectedFilterValue] = useState(legacyFilter ? searchKeyword : "");

  useEffect(() => {
    setCurrentPage(1);
  }, [localSearchKeyword, legacyLocationKeyword, locationId]);

  useEffect(() => {
    setLocalSearch(routeSearchKeyword);
    setCurrentPage(1);
  }, [routeSearchKeyword]);

  useEffect(() => {
    if (legacyFilter) {
      setSelectedFilter(legacyFilter);
      setSelectedFilterValue(searchKeyword);
    } else {
      setSelectedFilterValue("");
    }
    setCurrentPage(1);
  }, [legacyFilter, searchKeyword]);

  const pageQuery = useGetJobs({
    pages: currentPage,
    limit: JOBS_PER_PAGE,
    work_location_id: locationId || undefined,
    status: "PUBLIC",
  });
  const filterSourceQuery = useGetJobs({
    pages: 1,
    limit: FILTER_SOURCE_LIMIT,
    work_location_id: locationId || undefined,
    status: "PUBLIC",
  });

  const filterSourceJobs = filterSourceQuery.data?.data ?? [];
  const hasActiveSectionFilter = selectedFilterValue.trim().length > 0;
  const hasActiveKeywordFilter = localSearchKeyword.length > 0;
  const hasActiveLocalFilter =
    hasActiveKeywordFilter || hasActiveSectionFilter || hasRouteLocationFilter;
  const filteredJobs = useMemo(
    () =>
      filterSourceJobs.filter((job) => {
        const matchesKeyword = doesJobMatchKeyword(job, localSearchKeyword);
        const matchesSectionFilter = doesJobMatchFilter(
          job,
          selectedFilter,
          selectedFilterValue
        );
        const matchesRouteLocation =
          !hasRouteLocationFilter ||
          getRecruitmentAddressLabel(job).toLowerCase() ===
            legacyLocationKeyword.toLowerCase();

        return matchesKeyword && matchesSectionFilter && matchesRouteLocation;
      }),
    [
      filterSourceJobs,
      hasRouteLocationFilter,
      legacyLocationKeyword,
      localSearchKeyword,
      selectedFilter,
      selectedFilterValue,
    ]
  );

  const localFilteredJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [currentPage, filteredJobs]);

  const localTotalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const totalPages = hasActiveLocalFilter
    ? localTotalPages
    : pageQuery.data?.pagination?.totalPages || 1;
  const isLoading = hasActiveLocalFilter ? filterSourceQuery.isLoading : pageQuery.isLoading;
  const error = hasActiveLocalFilter ? filterSourceQuery.error : pageQuery.error;

  useEffect(() => {
    if (hasActiveLocalFilter && currentPage > localTotalPages) {
      setCurrentPage(localTotalPages);
    }
  }, [currentPage, hasActiveLocalFilter, localTotalPages]);

  if (isLoading) return null;
  if (error) return <div>Error loading jobs</div>;

  const jobs: IJobItem[] = hasActiveLocalFilter
    ? localFilteredJobs
    : pageQuery.data?.data || [];
  const textColor = theme.colors.primaryText;
  const isSearching =
    localSearchKeyword.length > 0 ||
    locationId.length > 0 ||
    legacyLocationKeyword.length > 0 ||
    hasActiveSectionFilter;

  const handleSelectedFilterChange = (value: FilterValue) => {
    setSelectedFilter(value);
    setSelectedFilterValue("");
    setCurrentPage(1);
  };

  const handleSelectedFilterValueChange = (value: string) => {
    setSelectedFilterValue(value);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <Flex direction="column" gap={4}>
      {/* header */}
      <Flex
        justifyContent={"space-between"}
        mx={"auto"}
        alignItems={"center"}
        w="full"
        gap={4}
      >
        <VStack>
          <Text
            color={theme.colors.candidate.primary}
            fontWeight={"bold"}
            fontSize={{ base: "lg", md: "xl", xl: "2xl" }}
          >
            {" "}
            THE BEST JOB OPPOTUNITIES FOR YOU
          </Text>
        </VStack>
      </Flex>

      {/* search */}
      <Box as="form" onSubmit={handleSearchSubmit} w="full" maxW="600px">
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="#94A3B8" />
          </InputLeftElement>
          <Input
            placeholder="Tìm kiếm việc làm..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            borderRadius="14px"
            border="1px solid #E2E8F0"
            bg="white"
            fontSize="sm"
            fontWeight="500"
            _placeholder={{ color: "#94A3B8" }}
            _focus={{ borderColor: "#334371", boxShadow: "0 0 0 1px #334371" }}
          />
        </InputGroup>
      </Box>

      {/* filter */}

      <FilterDropdown
        jobs={filterSourceJobs}
        isLoading={filterSourceQuery.isLoading}
        selectedFilter={selectedFilter}
        selectedValue={selectedFilterValue}
        onSelectedFilterChange={handleSelectedFilterChange}
        onSelectedValueChange={handleSelectedFilterValueChange}
      />
      {jobs.length > 0 ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="20px">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </SimpleGrid>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
        
      ) : isSearching ? (
        <Box
          bg="#F3F4F6"
          borderRadius="16px"
          p={{ base: 6, md: 8 }}
        >
          <Flex direction="column" align="center" justify="center" textAlign="center" gap={4}>
            <Text color="#2F4358" fontSize={{ base: "2xl", md: "lg" }} lineHeight="1.4" maxW="1100px">
              Sorry, ITJob hasn't found a job that matches your criteria. Try changing <Text as="span" fontWeight="700">filter or keyword</Text> to expand search results.
            </Text>
            <Text color="#2F4358" fontSize={{ base: "2xl", md: "md" }} lineHeight="1.4">
              Click "Create job alerts" <Text as="span" fontWeight="700">above to receive news as soon as a suitable position becomes available.</Text>
            </Text>
          </Flex>
        </Box>
      ) : (
        <Box
          bg="white"
          borderRadius="20px"
          border="1px solid"
          borderColor="#E2E8F0"
          p="24px"
        >
          <Flex direction="column" align="center" justify="center" py={10}>
            <Icon as={FiInbox} boxSize={12} color={textColor} />
            <Text color={textColor} fontSize="lg" mt={2}>
              No data
            </Text>
          </Flex>
        </Box>
      )}
    </Flex>
  );
}
