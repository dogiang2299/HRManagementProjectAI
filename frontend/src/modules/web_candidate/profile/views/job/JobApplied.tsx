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
  Image,
  LinkBox,
  LinkOverlay,
  Progress,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiCheckCircle,
  FiFileText,
  FiInbox,
  FiMapPin,
  FiMessageCircle,
  FiSearch,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";
import { FiTrash } from "react-icons/fi";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

import SearchCombobox from "../../../../../components/common/SearchCombobox";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import {
  useGetMyApplications,
  type CandidateMyApplicationRecord,
} from "../../../job/api/applyJob";
import { formatSalary, type IJobItem } from "../../../job/types/job";
import { APPLICATION_STATUS } from "../../../../../constant";
import { candidateConversationUrl } from "../../../../../routes/urls";
import { resolveCompanyLogoUrl } from "../../../../../utils/companyLogo";
import { ModalConfirm } from "../../../../../components/common/ModalConfirm";
import { useWithdrawApplication } from "../../../job/api/applyJob";

type AppliedJobView = {
  applicationId: string;
  status: string;
  appliedAt?: string;
  job: IJobItem;
};

const REVIEWING_STATUS = "Reviewing";

const STATUS_OPTIONS = [
  { id: "ALL", name: "All status" },
  { id: APPLICATION_STATUS.APPLIED, name: APPLICATION_STATUS.APPLIED },
  { id: REVIEWING_STATUS, name: REVIEWING_STATUS },
  { id: APPLICATION_STATUS.CONTACTED, name: APPLICATION_STATUS.CONTACTED },
  {
    id: APPLICATION_STATUS.INTERVIEWING,
    name: APPLICATION_STATUS.INTERVIEWING,
  },
  {
    id: APPLICATION_STATUS.WAITING_RESPONSE,
    name: APPLICATION_STATUS.WAITING_RESPONSE,
  },
  { id: APPLICATION_STATUS.ACCEPTED, name: APPLICATION_STATUS.ACCEPTED },
  { id: APPLICATION_STATUS.REJECTED, name: APPLICATION_STATUS.REJECTED },
  { id: APPLICATION_STATUS.CLOSED, name: APPLICATION_STATUS.CLOSED },
];

const STATUS_LABEL: Record<string, string> = {
  [APPLICATION_STATUS.APPLIED]: "Applied",
  [REVIEWING_STATUS]: "Screening",
  [APPLICATION_STATUS.CONTACTED]: "Contacted",
  [APPLICATION_STATUS.INTERVIEWING]: "Interviewing",
  [APPLICATION_STATUS.WAITING_RESPONSE]: "Waiting for response",
  [APPLICATION_STATUS.ACCEPTED]: "Accepted",
  [APPLICATION_STATUS.REJECTED]: "Not suitable",
  [APPLICATION_STATUS.CLOSED]: "Closed",
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  [APPLICATION_STATUS.APPLIED]: { bg: "#DBEAFE", color: "#1D4ED8" },
  [REVIEWING_STATUS]: { bg: "#FEF3C7", color: "#92400E" },
  [APPLICATION_STATUS.CONTACTED]: { bg: "#E0F2FE", color: "#0369A1" },
  [APPLICATION_STATUS.INTERVIEWING]: { bg: "#EDE9FE", color: "#5B21B6" },
  [APPLICATION_STATUS.WAITING_RESPONSE]: { bg: "#F3F4F6", color: "#374151" },
  [APPLICATION_STATUS.ACCEPTED]: { bg: "#334371", color: "#334371" },
  [APPLICATION_STATUS.REJECTED]: { bg: "#FEE2E2", color: "#B91C1C" },
  [APPLICATION_STATUS.CLOSED]: { bg: "#E5E7EB", color: "#374151" },
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not determined";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not determined";

  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(",", " -");
};

const getRelativeTime = (value?: string) => {
  if (!value) return "Just updated";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Just updated";

  const diff = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
  if (diff < 60) return `Updated ${diff} minutes ago`;

  const hours = Math.floor(diff / 60);
  if (hours < 24) return `Updated ${hours} hours ago`;

  return `Updated ${Math.floor(hours / 24)} days ago`;
};

const mapApplicationToJob = (
  item: CandidateMyApplicationRecord,
): AppliedJobView | null => {
  const rec = item?.recruitment_infor;
  if (!rec?.id) return null;

  return {
    applicationId: item.id,
    status: item.status,
    appliedAt: item.applied_at || item.created_at || undefined,
    job: {
      id: rec.id,
      recruitment_code: rec.recruitment_code,
      internal_title: rec.internal_title,
      post_title: rec.post_title,
      salary_from: rec.salary_from,
      salary_to: rec.salary_to,
      salary_currency: rec.salary_currency,
      rank_name: rec.rank?.name_rank || null,
      department: rec.department
        ? {
            id: rec.department.id,
            full_name: rec.department.full_name,
            acronym_name: rec.department.acronym_name,
            image_logo: rec.department.image_logo,
            address: rec.department.address,
            short_address: rec.department.short_address,
          }
        : null,
      workLocation: rec.workLocation
        ? {
            id: rec.workLocation.id,
            full_name: rec.workLocation.full_name,
            acronym_name: rec.workLocation.acronym_name,
            address: rec.workLocation.address,
            short_address: rec.workLocation.short_address,
          }
        : null,
    },
  };
};

export default function JobApplied() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const notify = useNotify();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const withdrawMutation = useWithdrawApplication();

  const handleWithdraw = async () => {
    if (!withdrawingId) return;
    try {
      await withdrawMutation.mutateAsync(withdrawingId);
      notify({ type: "success", message: "Application withdrawn" });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Unable to withdraw application";
      notify({ type: "error", message: "Withdraw failed", description: Array.isArray(msg) ? msg.join(", ") : msg });
    } finally {
      setWithdrawModalOpen(false);
      setWithdrawingId(null);
    }
  };

  const statusQuery = selectedStatus === "ALL" ? undefined : selectedStatus;
  const { data, isLoading, isError } = useGetMyApplications(statusQuery);

  const jobs = useMemo(() => {
    if (!Array.isArray(data)) return [] as AppliedJobView[];
    return data.flatMap((item) => {
      const mapped = mapApplicationToJob(item);
      return mapped ? [mapped] : [];
    });
  }, [data]);

  return (
    <Box minH="100vh" py={{ base: 5, md: 7 }}>
      <Container maxW="1220px">
        <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={{ base: 5, xl: 8 }}>
          <Box gridColumn={{ base: "span 1", xl: "span 8" }}>
            <Flex
              justify="space-between"
              align={{ base: "stretch", md: "center" }}
              gap={3}
              mb={5}
              direction={{ base: "column", md: "row" }}
            >
              <VStack align="start" spacing={1}>
                <Heading
                  fontSize={{ base: "md", md: "lg" }}
                  color="#1F2937"
                  lineHeight="1.15"
                  fontWeight="700"
                >
                  Job applied for
                </Heading>
                <Text color="#6B7280" fontSize="sm">
                  Total {jobs.length} job postings submitted.
                </Text>
              </VStack>

              <Box w={{ base: "100%", md: "320px" }}>
                <SearchCombobox
                  value={selectedStatus}
                  onChange={(v) => setSelectedStatus(v || "ALL")}
                  options={STATUS_OPTIONS}
                  placeholder="Filter by status"
                  size="md"
                  zIndex={2100}
                />
              </Box>
            </Flex>

            {isLoading ? (
              <Flex align="center" justify="center" py={16}>
                <Spinner size="lg" color="#334371" />
              </Flex>
            ) : isError ? (
              <Box
                bg="white"
                borderRadius="18px"
                border="1px solid"
                borderColor="#E5E7EB"
                p={6}
              >
                <Text color="#6B7280">
                  Unable to download job application list.
                </Text>
              </Box>
            ) : jobs.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {jobs.map((item) => {
                  const title = item.job.post_title || "Recruitment news";
                  const companyName =
                    item.job.department?.full_name || "Updating";
                  const location =
                    item.job.workLocation?.short_address ||
                    item.job.work_location_name ||
                    item.job.workLocation?.full_name ||
                    "Updating";

                  const salary = formatSalary(
                    item.job.salary_from,
                    item.job.salary_to,
                    item.job.salary_currency,
                  );
                  const statusStyle = STATUS_COLOR[item.status] || {
                    bg: "#E5E7EB",
                    color: "#334371",
                  };
                  const statusText =
                    STATUS_LABEL[item.status] || item.status;

                  return (
                    <LinkBox
                      key={item.applicationId}
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
                            src={resolveCompanyLogoUrl(
                              item.job.department?.image_logo,
                            )}
                            alt={companyName}
                            objectFit="contain"
                            w="78%"
                            h="78%"
                          />
                        </Flex>

                        <Flex flex="1" direction="column" minW={0}>
                          <Flex justify="space-between" align="start" gap={3}>
                            <Box minW={0} flex="1">
                              <LinkOverlay
                                as={RouterLink}
                                to={`/it-job/jobs/${item.job.id}`}
                              >
                                <Text
                                  fontSize="md"
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
                            <Tag
                              px={3}
                              py={1.5}
                              borderRadius="999px"
                              bg="#F3F5F7"
                              color="#4B5563"
                              fontSize="sm"
                              fontWeight="500"
                            >
                              <HStack spacing={1.5}>
                                <Icon
                                  as={FiMapPin}
                                  boxSize={3.5}
                                  color="#6B7280"
                                />
                                <Text>{location}</Text>
                              </HStack>
                            </Tag>

                            <Tag
                              px={3}
                              py={1.5}
                              borderRadius="999px"
                              bg={statusStyle.bg}
                              color={statusStyle.color}
                              fontSize="sm"
                              fontWeight="600"
                            >
                              {statusText}
                            </Tag>
                          </HStack>

                          <Flex
                            mt={3.5}
                            justify="space-between"
                            align={{ base: "flex-start", md: "center" }}
                            gap={2}
                            direction={{ base: "column", md: "row" }}
                          >
                            <HStack spacing={3}>
                              <Text
                                fontSize="sm"
                                color="#6B7280"
                                fontWeight="500"
                              >
                                Applied: {formatDateTime(item.appliedAt)}
                              </Text>
                              <Text
                                fontSize="sm"
                                color="#6B7280"
                                fontWeight="500"
                              >
                                {getRelativeTime(item.appliedAt)}
                              </Text>
                            </HStack>

                            <Button
                              size="sm"
                              leftIcon={<FiMessageCircle />}
                              color={"#334371"}
                              variant="outline"
                              borderRadius="999px"
                              onClick={() =>
                                navigate(
                                  `${candidateConversationUrl}?application_id=${item.applicationId}`,
                                )
                              }
                            >
                              Texting
                            </Button>
                              <Button
                                size="sm"
                                leftIcon={<FiTrash />}
                                color="#B91C1C"
                                variant="outline"
                                borderRadius="999px"
                                onClick={() => {
                                  setWithdrawingId(item.applicationId);
                                  setWithdrawModalOpen(true);
                                }}
                              >
                                Withdraw
                              </Button>
                          </Flex>
                        </Flex>
                      </Flex>
                    </LinkBox>
                  );
                })}
              </VStack>
            ) : (
              <Box
                bg="white"
                borderRadius="18px"
                border="1px solid"
                borderColor="#E5E7EB"
                p={8}
              >
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  py={10}
                >
                  <Icon as={FiInbox} boxSize={10} color="#9CA3AF" />
                  <Text color="#374151" fontSize="md" fontWeight="600" mt={3}>
                    There are no job applications in this state
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
                bg="linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 100%)"
                boxShadow="0 18px 50px rgba(15, 23, 42, 0.08)"
                p={6}
              >
                {/* Light background glow */}
                <Box
                  position="absolute"
                  top="-40px"
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
                  left="-20px"
                  w="120px"
                  h="120px"
                  borderRadius="full"
                  bg="rgba(59, 130, 246, 0.08)"
                  filter="blur(36px)"
                  pointerEvents="none"
                />

                <VStack
                  align="stretch"
                  spacing={5}
                  position="relative"
                  zIndex={1}
                >
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between" align="start">
                      <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color="#334371"
                          letterSpacing="0.0em"
                          textTransform="uppercase"
                        >
                          Application profile
                        </Text>
                        <Text
                          mt={1.5}
                          fontSize="2xl"
                          fontWeight="800"
                          color="#1F2937"
                          lineHeight="1.4"
                        >
                          Ready for new opportunities
                        </Text>
                      </Box>

                      <Badge
                        bg="#EAF2FF"
                        color="#334371"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="12px"
                        fontWeight="700"
                      >
                        Stable
                      </Badge>
                    </HStack>

                    <Text fontSize="sm" color="#6B7280" lineHeight="1.8">
                      Complete your profile and track your application status to
                      increase your chances of receiving a response from
                      employers.
                    </Text>
                  </VStack>

                  <Box
                    borderRadius="18px"
                    bg="white"
                    border="1px solid"
                    borderColor="#EEF2F7"
                    p={4}
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="700" color="#1F2937">
                        Degree of completeness of documents
                      </Text>
                      <Text fontSize="sm" fontWeight="800" color="#334371">
                        78%
                      </Text>
                    </HStack>

                    <Progress
                      value={78}
                      size="sm"
                      borderRadius="full"
                      bg="#E9EEF7"
                      sx={{
                        "& > div": {
                          background:
                            "linear-gradient(90deg, #334371 0%, #4F6AA3 100%)",
                        },
                      }}
                    />

                    <Text fontSize="xs" color="#6B7280" mt={2}>
                      Update your CV and skills to make your profile stand out
                      more.
                    </Text>
                  </Box>

                  <VStack
                    align="stretch"
                    spacing={3}
                    borderRadius="18px"
                    bg="rgba(255,255,255,0.82)"
                    border="1px solid"
                    borderColor="#EEF2F7"
                    p={4}
                  >
                    <HStack align="start" spacing={3}>
                      <Icon
                        as={FiCheckCircle}
                        boxSize={4}
                        color="#16A34A"
                        mt="2px"
                      />
                      <Box>
                        <Text fontSize="sm" fontWeight="700" color="#1F2937">
                          Track application status
                        </Text>
                        <Text fontSize="sm" color="#6B7280" lineHeight="1.7">
                          Quickly view submitted jobs and filter by processing
                          status.
                        </Text>
                      </Box>
                    </HStack>

                    <HStack align="start" spacing={3}>
                      <Icon
                        as={FiShield}
                        boxSize={4}
                        color="#334371"
                        mt="2px"
                      />
                      <Box>
                        <Text fontSize="sm" fontWeight="700" color="#1F2937">
                          Personal information security
                        </Text>
                        <Text fontSize="sm" color="#6B7280" lineHeight="1.7">
                          Only share further when you actively agree to the
                          connection invitation from the employer.
                        </Text>
                      </Box>
                    </HStack>

                    <HStack align="start" spacing={3}>
                      <Icon
                        as={FiTrendingUp}
                        boxSize={4}
                        color="#F59E0B"
                        mt="2px"
                      />
                      <Box>
                        <Text fontSize="sm" fontWeight="700" color="#1F2937">
                          Increase your chances of getting a response
                        </Text>
                        <Text fontSize="sm" color="#6B7280" lineHeight="1.7">
                          A profile that is clear, recently updated, and has the
                          right skills will be more likely to be noticed.
                        </Text>
                      </Box>
                    </HStack>
                  </VStack>

                  <Divider borderColor="#EDF2F7" />

                  <VStack align="stretch" spacing={3}>
                    <Button
                      as={RouterLink}
                      to="/it-job/my-cvs"
                      leftIcon={<FiFileText />}
                      h="46px"
                      borderRadius="14px"
                      bg="#334371"
                      color="white"
                      fontWeight="700"
                      _hover={{ bg: "#2B365D" }}
                    >
                      Update CV
                    </Button>

                  
                  </VStack>
                </VStack>
              </Box>
            </Box>
          </Box>
        </SimpleGrid>
        <ModalConfirm
          open={withdrawModalOpen}
          setOpen={setWithdrawModalOpen}
          title="Withdraw application"
          message="Are you sure you want to withdraw this application?"
          onClick={handleWithdraw}
          titleButton="Withdraw"
          confirmButtonProps={{ isLoading: withdrawMutation.isPending }}
        />
      </Container>
    </Box>
  );
}
