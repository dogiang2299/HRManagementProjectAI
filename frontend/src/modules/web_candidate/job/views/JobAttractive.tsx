import {
  Box,
  Flex,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FiInbox, FiSearch } from "react-icons/fi";

import { useGetJobs } from "../api/getJobs";
import type { IRecruitmentInfor } from "../types/job";
import JobCard from "../components/JobCard";
import Pagination from "../../../../components/common/Pagination";
import theme from "../../../../theme";
import FilterDropdown, {
  doesJobMatchFilter,
  isValidFilterValue,
  type FilterValue,
} from "../../home/components/Filter";

const JOBS_PER_PAGE = 6;

export default function JobAttractive() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>("Address");
  const [selectedFilterValue, setSelectedFilterValue] = useState("");

  const { data, isLoading, error } = useGetJobs({
    pages: 1,
    limit: 500,
    search: "",
    status: "PUBLIC",
  });

  const textColor = theme.colors.primaryText;

  // Sort by updated_at desc (most recently updated first) and apply filters
  const filteredJobs = useMemo(() => {
    const list = (data?.data ?? []) as IRecruitmentInfor[];

    // Sort by updated_at descending
    const sorted = [...list].sort((a, b) => {
      const dateA = new Date((a as any).updated_at || (a as any).created_at || 0).getTime();
      const dateB = new Date((b as any).updated_at || (b as any).created_at || 0).getTime();
      return dateB - dateA;
    });

    return sorted.filter((job) => {
      // Search filter
      const keyword = searchValue.trim().toLowerCase();
      if (keyword) {
        const haystack = [
          job.post_title,
          job.internal_title,
          job.department?.full_name,
          job.department?.acronym_name,
          job.positionPost?.name_post,
          job.positionPost?.group?.name_group,
        ]
          .map((v) => (v || "").toLowerCase())
          .join(" ");

        if (!haystack.includes(keyword)) return false;
      }

      // Section filter
      if (selectedFilterValue.trim()) {
        if (!doesJobMatchFilter(job, selectedFilter, selectedFilterValue)) return false;
      }

      return true;
    });
  }, [data?.data, searchValue, selectedFilter, selectedFilterValue]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [currentPage, filteredJobs]);

  // Reset page when filters change
  const handleFilterChange = (value: FilterValue) => {
    setSelectedFilter(value);
    setSelectedFilterValue("");
    setCurrentPage(1);
  };

  const handleFilterValueChange = (value: string) => {
    setSelectedFilterValue(value);
    setCurrentPage(1);
  };

  if (isLoading) return null;
  if (error) return <div>Error loading jobs</div>;

  return (
    <Box w="100%" color={theme.colors.candidate.primary}>
      <Text
        fontSize={{ base: "xl", md: "2xl" }}
        fontWeight="bold"
        textTransform="uppercase"
        textAlign="left"
        w="100%"
        mb={4}
      >
        Job Attractive
      </Text>


      <Flex
        direction={{ base: "column", lg: "row" }}
        gap={{ base: 6, lg: 8 }}
        align="stretch"
        w="100%"
        mt={4}
      >
        {/* LEFT COLUMN: JOB LIST */}
        <Box flex="1" minW={0}>
              <Box mb={4}>
                {/* Search */}
      <Box w="full" mb={4}>
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="#94A3B8" />
          </InputLeftElement>
          <Input
            placeholder="Search jobs at here ......"
            value={searchValue}
            onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(1); }}
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

      {/* Filter */}
      <FilterDropdown
        jobs={filteredJobs}
        isLoading={false}
        selectedFilter={selectedFilter}
        selectedValue={selectedFilterValue}
        onSelectedFilterChange={handleFilterChange}
        onSelectedValueChange={handleFilterValueChange}
      />
              </Box>

          {paginatedJobs.length > 0 ? (
            <VStack align="stretch" spacing={5}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing="20px">
                {paginatedJobs.map((job) => (
                  <JobCard key={job.id} job={job as any} />
                ))}
              </SimpleGrid>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </VStack>
          ) : (
            <Box
              bg="white"
              borderRadius="20px"
              border="1px solid"
              borderColor="#E2E8F0"
              p="24px"
              minH="260px"
            >
              <Flex direction="column" align="center" justify="center" h="100%" py={10}>
                <Icon as={FiInbox} boxSize={12} color={textColor} />
                <Text color={textColor} fontSize="lg" mt={2}>
                  No data
                </Text>
              </Flex>
            </Box>
          )}
        </Box>

        {/* RIGHT COLUMN: IMAGE / BANNER */}
        <Box
          w={{ base: "100%", lg: "360px", xl: "420px" }}
          flexShrink={0}
          borderRadius="24px"
          overflow="hidden"
          bg="white"
          border="1px solid"
          borderColor="#E2E8F0"
          boxShadow="0 12px 30px rgba(15, 23, 42, 0.08)"
          minH={{ base: "220px", lg: "100%" }}
        >
          <Image
            src="/logo3.png"
            alt="Job attractive banner"
            w="100%"
            h="100%"
            minH={{ base: "220px", lg: "520px" }}
            objectFit="cover"
          />
        </Box>
      </Flex>
    </Box>
  );
}
