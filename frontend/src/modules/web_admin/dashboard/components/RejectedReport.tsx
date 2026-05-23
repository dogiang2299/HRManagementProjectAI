import { Badge, Box, Grid, GridItem, SimpleGrid, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, Legend } from "recharts";
import { theme } from "../../../../theme";
import type { DashboardRejectedData } from "../types";
import SectionCard from "./SectionCard";

type RejectedReportProps = {
  data?: DashboardRejectedData;
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

export default function RejectedCandidatesReport({ data, isLoading, isError }: RejectedReportProps) {
  if (isLoading && !data) {
    return (
      <Box bg="white" border="1px solid" borderColor={theme.colors.charts.BORDER} borderRadius="24px" p={6}>
          <Text fontWeight="700" color="gray.600">Loading rejected candidate data...</Text>
      </Box>
    );
  }

  if (isError && !data) {
    return (
      <Box bg="white" border="1px solid" borderColor={theme.colors.charts.BORDER} borderRadius="24px" p={6}>
          <Text fontWeight="700" color="red.500">Unable to load rejected candidate data.</Text>
      </Box>
    );
  }

  const totals = data?.totals || { totalInPeriod: 0, totalRejected: 0, rejectionRate: 0 };

  const summaryCards = [
    { title: "Total Applications", value: String(totals.totalInPeriod), note: "All applications in period" },
    { title: "Rejected", value: String(totals.totalRejected), note: "Candidates marked as rejected" },
    { title: "Rejection Rate", value: `${totals.rejectionRate}%`, note: "Rejected / Total applications" },
  ];

  const byRecruiter = data?.byRecruiter || [];
  const byPosition = data?.byPosition || [];
  const byDepartment = data?.byDepartment || [];
  const trend = data?.trend || [];
  const recentRejected = data?.recentRejected || [];

  return (
    <VStack align="stretch" spacing={5}>
      {/* Summary cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
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

      {/* Charts row */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={5}>
        <GridItem>
          <SectionCard title="Rejection Trend" subtitle="Total applications versus rejected over time">
            {trend.length === 0 ? (
              <Text fontSize="sm" color="gray.400">No trend data available</Text>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke={theme.colors.charts.PRIMARY_400} strokeWidth={2} dot={false} name="Total" />
                  <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} dot={false} name="Rejected" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </GridItem>

        <GridItem>
          <SectionCard title="Rejections by Position" subtitle="Positions with the highest rejection volume">
            {byPosition.length === 0 ? (
              <Text fontSize="sm" color="gray.400">No data available</Text>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byPosition.slice(0, 7)} layout="vertical" margin={{ top: 5, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="position" type="category" tick={{ fontSize: 10 }} width={110} />
                  <RechartsTooltip />
                  <Bar dataKey="rejected" name="Rejected" radius={[0, 6, 6, 0]}>
                    {byPosition.slice(0, 7).map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </GridItem>
      </Grid>

      {/* By Recruiter + By Department */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={5}>
        <GridItem>
          <SectionCard title="By Recruiter" subtitle="Rejection volume and rate by recruiter">
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Recruitment Owner</Th>
                    <Th isNumeric>Total</Th>
                    <Th isNumeric>Rejected</Th>
                    <Th isNumeric>Rate</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {byRecruiter.length === 0 ? (
                    <Tr><Td colSpan={4}><Text fontSize="sm" color="gray.400" textAlign="center">No data available</Text></Td></Tr>
                  ) : (
                    byRecruiter.map((r) => (
                      <Tr key={r.id}>
                        <Td fontWeight="600">{r.name}</Td>
                        <Td isNumeric>{r.total}</Td>
                        <Td isNumeric color="red.500" fontWeight="600">{r.rejected}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={r.rejectionRate >= 60 ? "red" : r.rejectionRate >= 30 ? "yellow" : "green"}>
                            {r.rejectionRate}%
                          </Badge>
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
          <SectionCard title="By Department" subtitle="Rejection volume and rate by department">
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Department</Th>
                    <Th isNumeric>Total</Th>
                    <Th isNumeric>Rejected</Th>
                    <Th isNumeric>Rate</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {byDepartment.length === 0 ? (
                    <Tr><Td colSpan={4}><Text fontSize="sm" color="gray.400" textAlign="center">No data available</Text></Td></Tr>
                  ) : (
                    byDepartment.map((d) => (
                      <Tr key={d.department}>
                        <Td fontWeight="600">{d.department}</Td>
                        <Td isNumeric>{d.total}</Td>
                        <Td isNumeric color="red.500" fontWeight="600">{d.rejected}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={d.rejectionRate >= 60 ? "red" : d.rejectionRate >= 30 ? "yellow" : "green"}>
                            {d.rejectionRate}%
                          </Badge>
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

      {/* Recent rejected list */}
      <SectionCard title="Recently Rejected Candidates" subtitle="20 latest candidates marked as rejected">
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Code</Th>
                <Th>Candidate</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Position</Th>
                <Th>Department</Th>
                <Th>Recruitment Owner</Th>
                <Th>Notes</Th>
                <Th>Rejected At</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentRejected.length === 0 ? (
                <Tr>
                  <Td colSpan={9}>
                    <Text fontSize="sm" color="gray.400" textAlign="center">No rejected candidates in this period</Text>
                  </Td>
                </Tr>
              ) : (
                recentRejected.map((item) => (
                  <Tr key={item.candidateId}>
                    <Td fontWeight="600" color={theme.colors.charts.PRIMARY}>{item.candidateCode}</Td>
                    <Td fontWeight="600">{item.candidateName}</Td>
                    <Td color="gray.600" fontSize="xs">{item.email}</Td>
                    <Td color="gray.600" fontSize="xs">{item.phone}</Td>
                    <Td maxW="140px" isTruncated>{item.position}</Td>
                    <Td color="gray.600">{item.department}</Td>
                    <Td color="gray.600">{item.recruiter}</Td>
                    <Td color="gray.500" fontSize="xs" maxW="160px" isTruncated>{item.note || "—"}</Td>
                    <Td fontSize="xs" color="gray.500" whiteSpace="nowrap">
                      {new Date(item.rejectedAt).toLocaleDateString("en-GB")}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </SectionCard>
    </VStack>
  );
}