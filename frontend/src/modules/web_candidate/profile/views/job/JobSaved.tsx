import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiArrowRight, FiClock, FiBookmark, FiInbox, FiMapPin, FiSearch } from "react-icons/fi";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useGetMySavedJobs, useToggleSaveJob } from "../../../job/api/saveJob";
import type { IJobItem } from "../../../job/types/job";
import { formatSalary } from "../../../job/types/job";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import { resolveCompanyLogoUrl } from "../../../../../utils/companyLogo";

type SavedJobView = {
  recordId: string;
  savedAt: string | undefined;
  job: IJobItem;
};

const formatSavedTime = (value?: string) => {
  if (!value) return "Not determined";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not determined";

  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", " -");
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "Just updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just updated";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 60) return `Updated ${diffMinutes} minutes ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays} days ago`;
};

const getExperienceText = (job: IJobItem) => {
  return job.rank_name || "Experience";
};

const MetaPill = ({
  icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) => {
  return (
    <HStack
      spacing="6px"
      px="10px"
      h="30px"
      bg="#F3F5F7"
      borderRadius="999px"
    >
      <Icon as={icon} boxSize={3.5} color="#6B7280" />
      <Text fontSize="sm" color="#4B5563" fontWeight="500" lineHeight="1">
        {children}
      </Text>
    </HStack>
  );
};

const SavedJobCard = ({
  savedAt,
  job,
  isRemoving,
  onUnsave,
}: {
  savedAt?: string;
  job: IJobItem;
  isRemoving?: boolean;
  onUnsave: (recruitmentInforId: string) => void;
}) => {
  const title = job.post_title || "Recruitment news";
  const companyName = job.department?.full_name || "Updating";

  const location =
    job.workLocation?.short_address ||
    job.work_location_name ||
    job.workLocation?.full_name ||
    "Updating";

  const salary = formatSalary(
    job.salary_from,
    job.salary_to,
    job.salary_currency
  );

  const updatedAt = savedAt;

  const experienceText = getExperienceText(job);

  return (
   <LinkBox
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
      
      <Flex gap={3.5} align="stretch">
        <Flex
          w={{ base: "72px", md: "82px" }}
          h={{ base: "72px", md: "82px" }}
          minW={{ base: "72px", md: "82px" }}
          bg="white"
          border="1px solid"
          borderColor="#E5E7EB"
          borderRadius="14px"
          align="center"
          justify="center"
          overflow="hidden"
          p={2}
        >
          <Image
            src={resolveCompanyLogoUrl(job.department?.image_logo)}
            alt={companyName}
            objectFit="contain"
            w="78%"
            h="78%"
          />
        </Flex>

        <Flex flex="1" direction="column" minW={0}>
          <Flex justify="space-between" align="start" gap={3}>
            <Box minW={0} flex="1">
              <LinkOverlay as={RouterLink} to={`/it-job/jobs/${job.id}`}>
                <Text
                  fontSize={{ base: "md", md: "md" }}
                  fontWeight="700"
                  color="#1F2937"
                  lineHeight="1.35"
                  noOfLines={2}
                  _hover={{ color: "#334371" }}
                >
                  {title}
                </Text>
              </LinkOverlay>

              <Text
                mt="2px"
                color="#6B7280"
                fontSize="sm"
                fontWeight="500"
                textTransform="uppercase"
                noOfLines={1}
              >
                {companyName}
              </Text>
            </Box>

            <Text
              color="#334371"
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="700"
              lineHeight="1.2"
              whiteSpace="nowrap"
            >
              {salary}
            </Text>
          </Flex>

          <HStack spacing={2} mt={3} flexWrap="wrap">
            <MetaPill icon={FiMapPin}>{location}</MetaPill>
            <MetaPill icon={FiMapPin}>{experienceText}</MetaPill>
          </HStack>

          <Flex
            mt={3.5}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={2}
            direction={{ base: "column", md: "row" }}
          >
            <Text fontSize="sm" color="#6B7280" fontWeight="500">
              Saved: {formatSavedTime(savedAt)}
            </Text>

            <HStack spacing={3}>
              <Text fontSize="sm" color="#6B7280" fontWeight="500">
                {formatRelativeTime(updatedAt)}
              </Text>

              <IconButton
                aria-label="Unsave the message"
                w="38px"
                h="38px"
                minW="38px"
                borderRadius="full"
                border="1px solid"
                borderColor="#eeeeee"
                bg="white"
                icon={
                  <Icon
                    as={FiBookmark}
                    boxSize={4}
                    color="#334371"
                    fill="#334371"
                  />
                }
                _hover={{ bg: "#334371" }}
                _active={{ bg: "#334371" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUnsave(job.id);
                }}
                isLoading={Boolean(isRemoving)}
              />
            </HStack>
          </Flex>
        </Flex>
      </Flex>
    </LinkBox>
  );
};

export default function JobSaved() {
  const { data, isLoading, isError } = useGetMySavedJobs();
  const notify = useNotify();
  const toggleSaveJobMutation = useToggleSaveJob();
  const [removingIds, setRemovingIds] = useState<Record<string, boolean>>({});

  const jobs: SavedJobView[] = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.flatMap((item) => {
      if (!item?.recruitment_infor?.id) return [];
      return [
        {
          recordId: item.id,
          savedAt: item.created_at,
          job: item.recruitment_infor,
        },
      ];
    });
  }, [data]);

  const handleUnsave = async (recruitmentInforId: string) => {
    setRemovingIds((prev) => ({ ...prev, [recruitmentInforId]: true }));
    try {
      const res = await toggleSaveJobMutation.mutateAsync(recruitmentInforId);
      notify({
        message: res?.message || "The job posting has been unsaved",
        type: "success",
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Cannot unsave at this time";

      notify({
        message: "An error occurred",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        type: "error",
      });
    } finally {
      setRemovingIds((prev) => ({ ...prev, [recruitmentInforId]: false }));
    }
  };

  return (
    <Box bg="#F6F8FB" minH="100vh" py={{ base: 5, md: 7 }}>
      <Container maxW="1255px" px={{ base: 4, md: 6, xl: 8 }}>
        <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={{ base: 5, xl: 8 }}>
          <Box gridColumn={{ base: "span 1", xl: "span 8" }}>
            <VStack align="start" spacing={1} mb={5}>
              <Heading
                fontSize={{ base: "md", md: "lg" }}
                color="#1F2937"
                lineHeight="1.15"
                fontWeight="700"
              >
                List{" "}
                <Text as="span" color="#334371">
                  {jobs.length}
                </Text>{" "}
                saved jobs
              </Heading>

              <Text color="#6B7280" fontSize="sm">
                Manage the job postings you are interested in here.
              </Text>
            </VStack>

            {isLoading ? (
              <Flex align="center" justify="center" py={16}>
                <Spinner size="lg" color="#334371" />
              </Flex>
            ) : isError ? (
              <Box bg="white" borderRadius="18px" border="1px solid" borderColor="#E5E7EB" p={6}>
                <Text color="#6B7280">Unable to load saved job listings.</Text>
              </Box>
            ) : jobs.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {jobs.map(({ job, recordId, savedAt }) => (
                  <SavedJobCard
                    key={recordId}
                    savedAt={savedAt}
                    job={job}
                    isRemoving={Boolean(removingIds[job.id])}
                    onUnsave={handleUnsave}
                  />
                ))}
              </VStack>
            ) : (
              <Box
                bg="white"
                borderRadius="18px"
                border="1px solid"
                borderColor="#E5E7EB"
                p={8}
              >
                <Flex direction="column" align="center" justify="center" py={10}>
                  <Icon as={FiInbox} boxSize={10} color="#9CA3AF" />
                  <Text color="#374151" fontSize="md" fontWeight="600" mt={3}>
                    You have not saved any job postings yet
                  </Text>
                </Flex>
              </Box>
            )}
          </Box>
<Box
  gridColumn={{ base: "span 1", xl: "span 4" }}
  display={{ base: "none", xl: "block" }}
>
  <Box position="sticky" top="88px">
    <Box
      position="relative"
      borderRadius="24px"
      overflow="hidden"
      border="1px solid"
      borderColor="rgba(51, 67, 113, 0.10)"
      bg="linear-gradient(180deg, #F9FBFF 0%, #FFFFFF 100%)"
      boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)"
      p={6}
    >
      {/* Light glow for background */}
      <Box
        position="absolute"
        top="-30px"
        right="-20px"
        w="140px"
        h="140px"
        borderRadius="full"
        bg="rgba(51, 67, 113, 0.10)"
        filter="blur(40px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-30px"
        left="-10px"
        w="120px"
        h="120px"
        borderRadius="full"
        bg="rgba(59, 130, 246, 0.07)"
        filter="blur(38px)"
        pointerEvents="none"
      />

      <VStack align="stretch" spacing={5} position="relative" zIndex={1}>
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between" align="start">
            <Box>
              <Text
                fontSize="xs"
                fontWeight="700"
                color="#334371"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                Saved jobs
              </Text>
              <Text
                fontSize="2xl"
                fontWeight="800"
                color="#1F2937"
                lineHeight="1.25"
              >
                Save the right opportunity
              </Text>
            </Box>

            <Badge
              bg="#EEF4FF"
              color="#334371"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="12px"
              fontWeight="700"
            >
              Care about
            </Badge>
          </HStack>

          <Text fontSize="sm" color="#6B7280" lineHeight="1.8">
            The work you save will be collected here for easy comparison.
            Follow up and apply at the right time.
          </Text>
        </VStack>

        <Box
          borderRadius="18px"
          bg="white"
          border="1px solid"
          borderColor="#EEF2F7"
          p={4}
        >
          <HStack align="start" spacing={3}>
            <Box
              w="42px"
              h="42px"
              borderRadius="14px"
              bg="#EEF4FF"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon as={FiBookmark} color="#334371" boxSize={5} />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="700" color="#1F2937">
                List of jobs of interest
              </Text>
              <Text fontSize="sm" color="#6B7280" lineHeight="1.7" mt={1}>
                Save first, come back later. This is the place to help you not miss out
                job postings under consideration.
              </Text>
            </Box>
          </HStack>
        </Box>

        <VStack
          align="stretch"
          spacing={3}
          borderRadius="18px"
          bg="rgba(255,255,255,0.86)"
          border="1px solid"
          borderColor="#EEF2F7"
          p={4}
        >
          <HStack align="start" spacing={3}>
            <Icon as={FiClock} boxSize={4} color="#F59E0B" mt="2px" />
            <Box>
              <Text fontSize="sm" fontWeight="700" color="#1F2937">
                Back in time
              </Text>
              <Text fontSize="sm" color="#6B7280" lineHeight="1.7">
                Some job postings have short deadlines, so save your job
                Monitor and make decisions faster.
              </Text>
            </Box>
          </HStack>

          <HStack align="start" spacing={3}>
            <Icon as={FiBookmark} boxSize={4} color="#334371" mt="2px" />
            <Box>
              <Text fontSize="sm" fontWeight="700" color="#1F2937">
                Select according to preferences
              </Text>
              <Text fontSize="sm" color="#6B7280" lineHeight="1.7">
                Prioritize jobs that match your skills and desired position
                and the work environment you are looking for.
              </Text>
            </Box>
          </HStack>

          <HStack align="start" spacing={3}>
            <Icon as={FiArrowRight} boxSize={4} color="#334371" mt="2px" />
            <Box>
              <Text fontSize="sm" fontWeight="700" color="#1F2937">
                Ready to apply
              </Text>
              <Text fontSize="sm" color="#6B7280" lineHeight="1.7">
                Once you find a suitable position, you can apply immediately without having to search
                from the beginning again.
              </Text>
            </Box>
          </HStack>
        </VStack>

        <Divider borderColor="#EDF2F7" />

        <VStack align="stretch" spacing={3}>
          <Button
            as={RouterLink}
            to="/it-job"
            leftIcon={<FiSearch />}
            h="46px"
            borderRadius="14px"
            bg="#334371"
            color="white"
            fontWeight="700"
            _hover={{ bg: "#2B365D" }}
          >
            Explore more jobs
          </Button>

          <Button
            as={RouterLink}
            to="/it-job/applied-jobs"
            variant="outline"
            h="46px"
            borderRadius="14px"
            borderColor="#CBD5E1"
            color="#334371"
            bg="white"
            fontWeight="700"
            _hover={{
              bg: "#F8FAFC",
              borderColor: "#334371",
            }}
          >
            View applied jobs
          </Button>
        </VStack>
      </VStack>
    </Box>
  </Box>
</Box>        </SimpleGrid>
      </Container>
    </Box>
  );
}
