import { Badge, Box, Grid, GridItem, Progress, SimpleGrid, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { theme } from "../../../../theme";
import type { DashboardPlanData } from "../types";
import SectionCard from "./SectionCard";

type PlanReportProps = {
  data?: DashboardPlanData;
  isLoading?: boolean;
  isError?: boolean;
};

const COLORS = [
  theme.colors.charts.PRIMARY_700,
  theme.colors.charts.PRIMARY_500,
  theme.colors.charts.PRIMARY_400,
  theme.colors.charts.PRIMARY_300,
  theme.colors.charts.PRIMARY_200,
  "#7C8DB0",
  "#9BACD0",
];

function fillRateColor(rate: number) {
  if (rate >= 80) return "green";
  if (rate >= 40) return "yellow";
  return "red";
}

export default function PlanReport({ data, isLoading, isError }: PlanReportProps) {
  if (isLoading && !data) {
    return (
      <Box bg="white" border="1px solid" borderColor={theme.colors.charts.BORDER} borderRadius="24px" p={6}>
          <Text fontWeight="700" color="gray.600">Loading planning data...</Text>
      </Box>
    );
  }

  if (isError && !data) {
    return (
      <Box bg="white" border="1px solid" borderColor={theme.colors.charts.BORDER} borderRadius="24px" p={6}>
          <Text fontWeight="700" color="red.500">Unable to load planning data.</Text>
      </Box>
    );
  }

  const totals = data?.totals || {
    totalRecruitments: 0,
    totalPlanned: 0,
    totalHired: 0,
    totalRemaining: 0,
    fillRate: 0,
  };

  const summaryCards = [
    { title: "Total Recruitments", value: String(totals.totalRecruitments), note: "Recruitment campaigns in selected period" },
    { title: "Planned Headcount", value: String(totals.totalPlanned), note: "Total positions planned" },
    { title: "Hired", value: String(totals.totalHired), note: "Candidates successfully hired to date" },
    { title: "Completion Rate", value: `${totals.fillRate}%`, note: "Hired / Planned" },
  ];

  const byRecruitment = data?.byRecruitment || [];
  const byDepartment = data?.byDepartment || [];
  const byPosition = data?.byPosition || [];
  const activeBatches = data?.activeBatches || [];
  const postingChannels = data?.postingChannels || [];
  const trend = data?.trend || [];

  return (
    <VStack align="stretch" spacing={5}>
      {/* Summary cards */}
      <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4}>
        {summaryCards.map((card) => (
          <Box
            key={card.title}
            bg="white"
            border="1px solid"
            borderColor={theme.colors.charts.BORDER}
            borderRadius="16px"
            p={5}
          >
            <Text fontSize="xs" color="gray.500" mb={1}>{card.title}</Text>
            <Text fontSize="2xl" fontWeight="800" color={theme.colors.charts.PRIMARY}>{card.value}</Text>
            <Text fontSize="xs" color="gray.400" mt={1}>{card.note}</Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* Overall progress bar */}
      <Box bg="white" border="1px solid" borderColor={theme.colors.charts.BORDER} borderRadius="16px" p={5}>
        <Text fontWeight="700" fontSize="sm" color={theme.colors.charts.PRIMARY} mb={3}>
          Overall Headcount Progress
        </Text>
        <Progress
          value={Math.min(totals.fillRate, 100)}
          colorScheme={fillRateColor(totals.fillRate)}
          borderRadius="full"
          size="lg"
          mb={2}
        />
        <Text fontSize="xs" color="gray.500">
          Hired {totals.totalHired}/{totals.totalPlanned} planned positions ({totals.fillRate}% completed)
        </Text>
      </Box>

      {/* Charts row */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={5}>
        <GridItem>
          <SectionCard title="Plan vs Hires Trend" subtitle="Monthly headcount progress">
            {trend.length === 0 ? (
              <Text fontSize="sm" color="gray.400">No trend data available</Text>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="planned" stroke={theme.colors.charts.PRIMARY_500} strokeWidth={2} dot={false} name="Planned" />
                  <Line type="monotone" dataKey="hired" stroke="#22c55e" strokeWidth={2} dot={false} name="Hired" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </GridItem>

        <GridItem>
          <SectionCard title="Posting Channels" subtitle="Distribution across job boards">
            {postingChannels.length === 0 ? (
              <Text fontSize="sm" color="gray.400">No posting channel data available</Text>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={postingChannels} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="postCount" name="Posting Count" radius={[6, 6, 0, 0]}>
                    {postingChannels.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </GridItem>
      </Grid>

      {/* Active batches */}
      {activeBatches.length > 0 && (
        <SectionCard title="Active Recruitment Batches" subtitle="Upcoming and active batches sorted by deadline">
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Batch</Th>
                  <Th>Recruitment Listing</Th>
                  <Th>Start Date</Th>
                  <Th>End Date</Th>
                  <Th isNumeric>Target</Th>
                  <Th isNumeric>Remaining</Th>
                </Tr>
              </Thead>
              <Tbody>
                {activeBatches.map((batch, idx) => (
                  <Tr key={idx}>
                    <Td fontWeight="600" maxW="180px" isTruncated>{batch.title}</Td>
                    <Td color="gray.600" maxW="160px" isTruncated>{batch.recruitmentTitle}</Td>
                    <Td color="gray.500">{batch.fromDate || "—"}</Td>
                    <Td color="gray.500">{batch.toDate || "—"}</Td>
                    <Td isNumeric>{batch.target}</Td>
                    <Td isNumeric>
                      <Badge colorScheme={batch.daysLeft <= 7 ? "red" : batch.daysLeft <= 14 ? "yellow" : "green"}>
                        {batch.daysLeft} days
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </SectionCard>
      )}

      {/* Recruitment progress table */}
      <SectionCard title="Progress by Recruitment Listing" subtitle="Headcount plan versus actual hires by campaign">
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Code</Th>
                <Th>Title</Th>
                <Th>Department</Th>
                <Th>Position</Th>
                <Th>Recruitment Owner</Th>
                <Th isNumeric>Planned</Th>
                <Th isNumeric>Hired</Th>
                <Th isNumeric>Remaining</Th>
                <Th isNumeric>Rate %</Th>
                <Th>Deadline</Th>
              </Tr>
            </Thead>
            <Tbody>
              {byRecruitment.length === 0 ? (
                <Tr>
                  <Td colSpan={10}>
                    <Text fontSize="sm" color="gray.400" textAlign="center">No data available</Text>
                  </Td>
                </Tr>
              ) : (
                byRecruitment.map((r) => (
                  <Tr key={r.id}>
                    <Td fontWeight="600" color={theme.colors.charts.PRIMARY}>{r.code}</Td>
                    <Td maxW="160px" isTruncated>{r.title}</Td>
                    <Td color="gray.600">{r.department}</Td>
                    <Td color="gray.600">{r.position}</Td>
                    <Td color="gray.600">{r.recruiter}</Td>
                    <Td isNumeric>{r.planned}</Td>
                    <Td isNumeric color="green.600" fontWeight="600">{r.hired}</Td>
                    <Td isNumeric color={r.remaining > 0 ? "orange.500" : "green.500"} fontWeight="600">{r.remaining}</Td>
                    <Td isNumeric>
                      <Badge colorScheme={fillRateColor(r.fillRate)}>{r.fillRate}%</Badge>
                    </Td>
                    <Td fontSize="xs" color="gray.500">{r.deadline || "—"}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </SectionCard>

      {/* Department + Position tables */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={5}>
        <GridItem>
          <SectionCard title="By Department" subtitle="Headcount completion rate by department">
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Department</Th>
                    <Th isNumeric>Campaigns</Th>
                    <Th isNumeric>Planned</Th>
                    <Th isNumeric>Hired</Th>
                    <Th isNumeric>Rate %</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {byDepartment.length === 0 ? (
                    <Tr>
                      <Td colSpan={5}><Text fontSize="sm" color="gray.400" textAlign="center">No data available</Text></Td>
                    </Tr>
                  ) : (
                    byDepartment.map((d) => (
                      <Tr key={d.department}>
                        <Td fontWeight="600">{d.department}</Td>
                        <Td isNumeric>{d.recruitments}</Td>
                        <Td isNumeric>{d.planned}</Td>
                        <Td isNumeric color="green.600" fontWeight="600">{d.hired}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={fillRateColor(d.fillRate)}>{d.fillRate}%</Badge>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </SectionCard>
        </GridItem>

        <GridItem>
          <SectionCard title="By Position" subtitle="Headcount completion rate by hiring position">
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Position</Th>
                    <Th isNumeric>Campaigns</Th>
                    <Th isNumeric>Planned</Th>
                    <Th isNumeric>Hired</Th>
                    <Th isNumeric>Rate %</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {byPosition.length === 0 ? (
                    <Tr>
                      <Td colSpan={5}><Text fontSize="sm" color="gray.400" textAlign="center">No data available</Text></Td>
                    </Tr>
                  ) : (
                    byPosition.map((p) => (
                      <Tr key={p.position}>
                        <Td fontWeight="600">{p.position}</Td>
                        <Td isNumeric>{p.recruitments}</Td>
                        <Td isNumeric>{p.planned}</Td>
                        <Td isNumeric color="green.600" fontWeight="600">{p.hired}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={fillRateColor(p.fillRate)}>{p.fillRate}%</Badge>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </SectionCard>
        </GridItem>
      </Grid>
    </VStack>
  );
}