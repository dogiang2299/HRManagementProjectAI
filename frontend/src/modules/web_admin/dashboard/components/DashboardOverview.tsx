import { Badge, Box, Button, Flex, Grid, GridItem, HStack, Progress, SimpleGrid, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Line, PieChart, Pie, Cell, BarChart, Bar, Tooltip as RechartsTooltip } from "recharts";
import { theme } from "../../../../theme";
import type { DashboardOverviewData } from "../types";
import SectionCard from "./SectionCard";

type StatCard = {
  title: string;
  value: string;
  change: string;
  note: string;
};

type ApplicationStatusItem = {
  name: string;
  label?: string;
  value: number;
  color: string;
};

type TrendItem = {
  month: string;
  applications: number;
};

type CostItem = {
  type: string;
  amount: number;
};

type PlanProgressItem = {
  position: string;
  plan: number;
  hired: number;
};

type RecruitmentItem = {
  code: string;
  title: string;
  department: string;
  applications: number;
  status: "Active" | "Reviewing" | "Paused";
};

type DashboardOverviewProps = {
  data?: DashboardOverviewData;
  isLoading?: boolean;
  isError?: boolean;
};

const statusColorMap: Record<string, string> = {
  Applied: theme.colors.charts.PRIMARY_700,
  Reviewing: theme.colors.charts.PRIMARY_600,
  Contacted: theme.colors.charts.PRIMARY_500,
  Interviewing: theme.colors.charts.PRIMARY_400,
  "Waiting Response": theme.colors.charts.PRIMARY_300,
  Accepted: "#6E86B7",
  Rejected: "#B5C0D9",
};

const statusLabelMap: Record<string, string> = {
  Applied: "Applied",
  Reviewing: "Under Review",
  Contacted: "Contacted",
  Interviewing: "Interviewing",
  "Waiting Response": "Awaiting Response",
  Accepted: "Accepted",
  Rejected: "Rejected",
};

const recruitmentStatusLabelMap: Record<RecruitmentItem["status"], string> = {
  Active: "Active",
  Reviewing: "Under Review",
  Paused: "Paused",
};

const statTitleMap: Record<string, string> = {
  "Total Recruitments": "Total Recruitments",
  "Total Applications": "Total Applications",
  "Accepted Candidates": "Accepted Candidates",
  "Recruitment Cost": "Recruitment Cost",
  "Tổng tin tuyển dụng": "Total Recruitments",
  "Tổng hồ sơ ứng tuyển": "Total Applications",
  "Ứng viên đạt": "Accepted Candidates",
  "Chi phí tuyển dụng": "Recruitment Cost",
};

const translateStatNote = (note: string) => {
  const activeMatch = note.match(/^(.+) campaigns active$/i);
  if (activeMatch) return `${activeMatch[1]} active campaigns`;

  const avgCandidateMatch = note.match(/^Average (.+) candidates per role$/i);
  if (avgCandidateMatch) return `Average ${avgCandidateMatch[1]} candidates per position`;

  const hiringRateMatch = note.match(/^Hiring rate (.+) overall$/i);
  if (hiringRateMatch) return `Overall hiring rate: ${hiringRateMatch[1]}`;

  const avgAcceptedMatch = note.match(/^Average (.+) per accepted candidate$/i);
  if (avgAcceptedMatch) return `Average ${avgAcceptedMatch[1]} per accepted candidate`;

  return note;
};

const getStatusBadgeStyles = (status: RecruitmentItem["status"]) => {
  switch (status) {
    case "Active":
      return { bg: "rgba(51, 67, 113, 0.10)", color: theme.colors.charts.PRIMARY_700 };
    case "Reviewing":
      return { bg: "rgba(90, 108, 152, 0.12)", color: theme.colors.charts.PRIMARY_600 };
    case "Paused":
      return { bg: "rgba(166, 177, 204, 0.25)", color: theme.colors.charts.PRIMARY_500 };
    default:
      return { bg: "gray.100", color: "gray.700" };
  }
};

export default function DashboardOverview({ data, isLoading, isError }: DashboardOverviewProps) {
    const statCards: StatCard[] = (data?.statCards ?? []).map((item) => ({
      ...item,
      title: statTitleMap[item.title] || item.title,
      note: translateStatNote(item.note),
    }));
    const applicationTrendData: TrendItem[] = data?.applicationTrendData ?? [];
    const recruitmentCostData: CostItem[] = data?.recruitmentCostData ?? [];
    const planProgressData: PlanProgressItem[] = data?.planProgressData ?? [];
    const recentRecruitments: RecruitmentItem[] = data?.recentRecruitments ?? [];

    const applicationStatusData: ApplicationStatusItem[] = (data?.applicationStatusData ?? []).map((item) => ({
      ...item,
      label: statusLabelMap[item.name] || item.name,
      color: statusColorMap[item.name] || theme.colors.charts.PRIMARY_300,
    }));

    const totalApplications = applicationStatusData.reduce((sum, item) => sum + item.value, 0);
    const totalCostLabel = statCards.find((item) => item.title === "Recruitment Cost")?.value ?? "0";

    if (isLoading && !data) {
      return (
        <Box bg="white" border="1px solid" borderColor={theme.colors.charts.BORDER} borderRadius="24px" p={6}>
          <Text fontWeight="700" color="gray.600">Loading overview data...</Text>
        </Box>
      );
    }

    if (isError && !data) {
      return (
        <Box bg="white" border="1px solid" borderColor={theme.colors.charts.BORDER} borderRadius="24px" p={6}>
          <Text fontWeight="700" color="red.500">Unable to load overview data.</Text>
        </Box>
      );
    }

    return (
    <VStack spacing={5} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5}>
        {statCards.map((item, index) => (
          <Box
            key={item.title}
            bg="white"
            border="1px solid"
            borderColor={index === 0 ? theme.colors.charts.PRIMARY_200 : theme.colors.charts.BORDER}
            borderRadius="24px"
            p={5}
            boxShadow="0 10px 24px rgba(26, 39, 68, 0.05)"
          >
            <Flex justify="space-between" align="flex-start" gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.500">
                  {item.title}
                </Text>
                <Text mt={3} fontSize="3xl" fontWeight="800" color="gray.800">
                  {item.value}
                </Text>
              </Box>

              <Box
                w="46px"
                h="46px"
                borderRadius="18px"
                bg={index % 2 === 0 ? theme.colors.charts.PRIMARY : theme.colors.charts.PRIMARY_500}
                opacity={0.95}
              />
            </Flex>

            <HStack mt={5} justify="space-between" align="flex-start" spacing={3}>
              <Box
                px={3}
                py={1.5}
                borderRadius="full"
                bg="rgba(51, 67, 113, 0.08)"
                color={theme.colors.charts.PRIMARY}
                fontSize="sm"
                fontWeight="700"
              >
                {item.change}
              </Box>
              <Text flex="1" textAlign="right" fontSize="sm" color="gray.400">
                {item.note}
              </Text>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", xl: "1.3fr 0.9fr" }} gap={5}>
        <GridItem>
          <SectionCard
            title="Application Trend"
            subtitle="Monthly application volume"
            right={
              <Badge
                borderRadius="full"
                px={3}
                py={1.5}
                bg="gray.100"
                color="gray.600"
                fontSize="xs"
              >
                {data?.updatedAt ? "Live Data" : "No Data"}
              </Badge>
            }
          >
            <Box h="320px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={applicationTrendData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E7ECF4" />
                  <XAxis dataKey="month" tick={{ fill: "#718096", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#718096", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke={theme.colors.charts.PRIMARY}
                    strokeWidth={3}
                    dot={{ r: 4, fill: theme.colors.charts.PRIMARY }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </GridItem>

        <GridItem>
          <SectionCard
            title="Application Status"
            subtitle="Distribution by current status"
          >
            <Box h="250px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applicationStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {applicationStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            <VStack mt={4} spacing={3} align="stretch">
              {applicationStatusData.map((item) => {
                const percent = ((item.value / totalApplications) * 100).toFixed(1);
                return (
                  <Flex key={item.name} justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Box w="10px" h="10px" borderRadius="full" bg={item.color} />
                      <Text fontSize="sm" fontWeight="600" color="gray.600">
                        {item.label}
                      </Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Text fontSize="sm" color="gray.500">
                        {percent}%
                      </Text>
                      <Text minW="44px" textAlign="right" fontSize="sm" fontWeight="700" color="gray.800">
                        {item.value}
                      </Text>
                    </HStack>
                  </Flex>
                );
              })}
            </VStack>
          </SectionCard>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={5}>
        <GridItem>
          <SectionCard
            title="Recruitment Cost Structure"
            subtitle="Cost breakdown by category"
            right={
              <Box
                px={4}
                py={2}
                borderRadius="18px"
                bg="rgba(51, 67, 113, 0.08)"
                color={theme.colors.charts.PRIMARY}
                fontSize="sm"
                fontWeight="700"
              >
                Total {totalCostLabel}
              </Box>
            }
          >
            <Box h="300px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recruitmentCostData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E7ECF4" />
                  <XAxis dataKey="type" tick={{ fill: "#718096", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#718096", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                    {recruitmentCostData.map((_, index) => {
                      const palette = [theme.colors.charts.PRIMARY_700, theme.colors.charts.PRIMARY_600, theme.colors.charts.PRIMARY_500, theme.colors.charts.PRIMARY_400, theme.colors.charts.PRIMARY_300];
                      return <Cell key={index} fill={palette[index % palette.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </GridItem>

        <GridItem>
          <SectionCard
            title="Hiring Plan Progress"
            subtitle="Actual hiring progress versus plan"
            right={
              <Badge borderRadius="full" px={3} py={1.5} bg="gray.100" color="gray.600">
                Top 5 Positions
              </Badge>
            }
          >
            <VStack spacing={4} align="stretch">
              {planProgressData.map((item) => {
                const percent = Math.round((item.hired / item.plan) * 100);
                return (
                  <Box key={item.position} border="1px solid" borderColor="gray.100" borderRadius="20px" p={4}>
                    <Flex justify="space-between" gap={3} align="flex-start">
                      <Box>
                        <Text fontWeight="700" color="gray.800">
                          {item.position}
                        </Text>
                        <Text mt={1} fontSize="sm" color="gray.500">
                          Planned {item.plan} · Hired {item.hired} · Remaining {item.plan - item.hired}
                        </Text>
                      </Box>
                      <Box
                        px={3}
                        py={1}
                        borderRadius="full"
                        bg="rgba(51, 67, 113, 0.08)"
                        color={theme.colors.charts.PRIMARY}
                        fontSize="sm"
                        fontWeight="700"
                      >
                        {percent}%
                      </Box>
                    </Flex>
                    <Progress
                      mt={4}
                      value={percent}
                      borderRadius="full"
                      bg={theme.colors.charts.PRIMARY_200}
                      sx={{
                        '& > div': {
                          background: `linear-gradient(90deg, ${theme.colors.charts.PRIMARY_700} 0%, ${theme.colors.charts.PRIMARY_400} 100%)`,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </VStack>
          </SectionCard>
        </GridItem>
      </Grid>

      <SectionCard
        title="Recent Recruitment Listings"
        subtitle="Latest recruitment listings for quick operational monitoring"
        right={
          <Button
            bg={theme.colors.charts.PRIMARY}
            color="white"
            borderRadius="16px"
            _hover={{ bg: theme.colors.charts.PRIMARY_900 }}
            _active={{ bg: theme.colors.charts.PRIMARY_900 }}
          >
            View All Listings
          </Button>
        }
      >
        <Box overflowX="auto" border="1px solid" borderColor="gray.100" borderRadius="22px">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th color="gray.500">Code</Th>
                <Th color="gray.500">Position</Th>
                <Th color="gray.500">Department</Th>
                <Th color="gray.500">Applications</Th>
                <Th color="gray.500">Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentRecruitments.map((item) => {
                const badgeStyle = getStatusBadgeStyles(item.status);
                return (
                  <Tr key={item.code}>
                    <Td fontWeight="700" color="gray.800">
                      {item.code}
                    </Td>
                    <Td color="gray.700">{item.title}</Td>
                    <Td color="gray.600">{item.department}</Td>
                    <Td color="gray.700">{item.applications}</Td>
                    <Td>
                      <Badge
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        bg={badgeStyle.bg}
                        color={badgeStyle.color}
                        textTransform="none"
                        fontSize="xs"
                      >
                        {recruitmentStatusLabelMap[item.status] || item.status}
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </SectionCard>
    </VStack>
    )
}