import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Skeleton,
  Stack,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import Pagination from "../../../../components/common/Pagination";
import ITJobInfoSection from "../../home/components/ITJobInfoSection";
import {
  useGetRecommendedJobs,
  type RecommendedJobItem,
} from "../api/getRecommendedJobs";
import formatBadgeLabel, { formatWorkTypeLabel } from "../../../../utils/formatText";
import { translateRecommendationText } from "../utils";

function formatSalary(
  salaryFrom?: number | null,
  salaryTo?: number | null,
  currency?: string | null
) {
  if (!salaryFrom && !salaryTo) return "Agree";

  const from = salaryFrom ? Number(salaryFrom).toLocaleString("en-US") : "";
  const to = salaryTo ? Number(salaryTo).toLocaleString("en-US") : "";
  const unit = currency || "";

  if (from && to) return `${from} - ${to} ${unit}`.trim();
  if (from) return `From ${from} ${unit}`.trim();
  return `Up to ${to} ${unit}`.trim();
}

function percentFromScore(score?: number) {
  if (typeof score !== "number") return 0;
  return Math.round(score * 100);
}

function getOverallScore(job: RecommendedJobItem) {
  return (
    job.match_detail?.overall?.score ??
    percentFromScore(job.score_breakdown?.finalScore)
  );
}

function getRecommendationDescription(job: RecommendedJobItem) {
  return (
    translateRecommendationText(
      job.match_detail?.overall?.description || job.reason_texts?.join(" ") || ""
    )
  );
}

export default function RecommendedJobsPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 400);
  const pageSize = 9;
  const normalizedSearch = debouncedSearch.trim();

  const { data, isLoading } = useGetRecommendedJobs({
    page: currentPage,
    limit: pageSize,
    search: normalizedSearch || undefined,
  });

  const jobs = data?.items || [];
  const candidateName = data?.candidate?.candidate_name;
  const totalPages = data?.pagination?.totalPages || 1;
  const hasSearch = normalizedSearch.length > 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return (
    <Box
      py={{ base: 3, md: 5, xl: 5 }}
      px={{ base: 3, md: 15, xl: 150 }}
      minH="100vh"
    >
      <VStack pb={10} align="stretch" spacing={{ base: 4, md: 3 }}>
        <Flex
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={5}
        >
          <VStack align="start" spacing={2}>
            <HStack spacing={4}>
              <Text
                fontSize="sm"
                fontWeight="700"
                color="#334371"
                cursor="pointer"
                onClick={() => navigate("/it-job/jobs")}
                _hover={{ color: "#25345A" }}
              >
                Home page
              </Text>
              <Text color="#9CA3AF" fontWeight="700">
                ›
              </Text>
              <Text fontSize="sm" fontWeight="700" color="#334371">
                Suggested jobs
              </Text>
            </HStack>

            <Text
              fontSize={{ base: "26px", md: "26px" }}
              fontWeight="800"
              color="#334371"
              lineHeight="1.2"
            >
              ALL SUGGESTED WORKS
            </Text>

            <Text fontSize={{ base: "14px", md: "16px" }} color="#64748B">
              {candidateName
                ? `Job listing matches for ${candidateName}.`
                : "Job listings are suggested from resumes, CVs and suitability."}
            </Text>
          </VStack>

          <InputGroup w={{ base: "100%", md: "420px" }} size="lg">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="#94A3B8" />
            </InputLeftElement>
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search suggested jobs..."
              bg="white"
              borderColor="#DDE5F1"
              borderRadius="16px"
              color="#1E293B"
              fontSize="15px"
              fontWeight="600"
              _placeholder={{ color: "#94A3B8", fontWeight: "500" }}
              _hover={{ borderColor: "#CBD5E1" }}
              _focusVisible={{
                borderColor: "#334371",
                boxShadow: "0 0 0 1px #334371",
              }}
            />
          </InputGroup>
        </Flex>

        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Box key={index} bg="white" borderRadius="16px" border="1px solid #E2E8F0" p={4}>
                <Stack spacing={3}>
                  <Skeleton height="20px" borderRadius="8px" />
                  <Skeleton height="14px" borderRadius="8px" />
                  <Skeleton height="30px" borderRadius="10px" />
                  <Skeleton height="72px" borderRadius="12px" />
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        ) : jobs.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            bg="white"
            borderRadius="20px"
            border="1px solid #E2E8F0"
            py={14}
            px={8}
            textAlign="center"
          >
            <Text fontSize="22px" fontWeight="700" color="#334371" mb={2}>
              {hasSearch ? "No matching suggested jobs" : "There are no suggested jobs"}
            </Text>
            <Text fontSize="15px" color="#64748B" maxW="680px">
              {hasSearch
                ? "Try another job title, company, or position keyword."
                : "Please update your CV or profile to make the suggestion system more accurate."}
            </Text>
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {jobs.map((job) => {
              const recommendationDescription =
                getRecommendationDescription(job);

              return (
                <Box
                  key={job.recruitment_id}
                  bg="white"
                  borderRadius="20px"
                  border="1px solid"
                  borderColor="#E2E8F0"
                  p={4}
                  minH="100%"
                  h="100%"
                  display="flex"
                  transition="all 0.2s ease"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                    borderColor: "#CBD5E1",
                  }}
                >
                  <VStack align="stretch" spacing={3} flex="1" h="100%">
                    <Flex justify="space-between" align="flex-start" gap={3}>
                      <Box flex="1" minW={0}>
                        <Text
                          fontSize={{ base: "15px", md: "16px" }}
                          fontWeight="800"
                          color="#1E293B"
                          lineHeight="1.45"
                          noOfLines={2}
                        >
                          {job.post_title || job.internal_title || "Job title"}
                        </Text>

                        <Text
                          mt={1}
                          fontSize="13px"
                          fontWeight="700"
                          color="#64748B"
                          textTransform="uppercase"
                          letterSpacing="0.4px"
                          noOfLines={1}
                        >
                          {job.company_name || "Company"}
                        </Text>
                      </Box>

                      <Flex
                        minW="56px"
                        h="38px"
                        px={3}
                        align="center"
                        justify="center"
                        borderRadius="999px"
                        bg="#EEF2FF"
                        flexShrink={0}
                      >
                        <Text fontSize="15px" fontWeight="800" color="#334371">
                          {getOverallScore(job)}%
                        </Text>
                      </Flex>
                    </Flex>

                    <HStack spacing={2} flexWrap="wrap">
                      {job.position_name && (
                        <Tag
                          size="sm"
                          borderRadius="full"
                          bg="#F1F5F9"
                          color="#334155"
                          px={3}
                          py={1.5}
                          fontSize="12px"
                          fontWeight="600"
                        >
                          {job.position_name}
                        </Tag>
                      )}

                      {job.type_of_job && (
                        <Tag
                          size="sm"
                          borderRadius="full"
                          bg="#F8FAFC"
                          color="#475569"
                          px={3}
                          py={1.5}
                          fontSize="12px"
                          fontWeight="600"
                        >
                          {formatWorkTypeLabel(job.type_of_job)}
                        </Tag>
                      )}
                    </HStack>

                    <Tag
                      alignSelf="flex-start"
                      size="sm"
                      borderRadius="full"
                      bg="#EEF2FF"
                      color="#334371"
                      px={3}
                      py={1.5}
                      fontSize="12px"
                      fontWeight="700"
                    >
                      {formatSalary(
                        job.salary_from,
                        job.salary_to,
                        job.salary_currency
                      )}
                    </Tag>

                    {recommendationDescription && (
                      <Box
                        bg="#F8FAFC"
                        border="1px solid #E2E8F0"
                        borderRadius="16px"
                        px={3}
                        py={3}
                      >
                        <Text
                          fontSize="13px"
                          color="#475569"
                          lineHeight="1.75"
                          noOfLines={4}
                        >
                          {recommendationDescription}
                        </Text>
                      </Box>
                    )}

                    {job.matched_skills && job.matched_skills.length > 0 && (
                      <VStack align="start" spacing={2}>
                        <Text fontSize="13px" fontWeight="800" color="#334371">
                          Appropriate skills
                        </Text>

                        <HStack spacing={2} flexWrap="wrap">
                          {job.matched_skills.slice(0, 4).map((skill) => (
                            <Tag
                              key={skill}
                              size="sm"
                              borderRadius="full"
                              bg="#f4efef"
                              color="#334371"
                              px={3}
                              py={1.5}
                              fontSize="12px"
                              fontWeight="700"
                            >
                              {formatBadgeLabel(skill)}
                            </Tag>
                          ))}
                        </HStack>
                      </VStack>
                    )}

                    <Button
                      mt="auto"
                      w="full"
                      size="md"
                      h="44px"
                      borderRadius="14px"
                      bg="#334371"
                      color="white"
                      fontSize="15px"
                      fontWeight="700"
                      rightIcon={<FiArrowRight />}
                      _hover={{ bg: "#2A365D" }}
                      onClick={() => {
                        sessionStorage.setItem(
                          `recommendation-detail:${job.recruitment_id}`,
                          JSON.stringify(job)
                        );

                        navigate(
                          `/it-job/jobs/${job.recruitment_id}?source=recommendation`,
                          {
                            state: {
                              fromRecommendation: true,
                              recommendation: job,
                            },
                          }
                        );
                      }}
                    >
                      See details
                    </Button>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}

        {!isLoading && jobs.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </VStack>

      <ITJobInfoSection />
    </Box>
  );
}
