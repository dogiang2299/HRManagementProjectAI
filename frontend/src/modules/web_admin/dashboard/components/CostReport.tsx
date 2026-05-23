import { Box, Grid, GridItem, SimpleGrid, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { theme } from "../../../../theme";
import type { DashboardCostData } from "../types";
import SectionCard from "./SectionCard";

type CostReportProps = {
  data?: DashboardCostData;
  isLoading?: boolean;
  isError?: boolean;
};

const formatNumber = (value: number) => value.toLocaleString("en-US");

const formatMoney = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(1);
};

export default function CostReport({ data, isLoading, isError }: CostReportProps) {
  if (isLoading && !data) {
    return (
      <Box bg="white" border="1px solid" borderColor={theme.colors.charts.BORDER} borderRadius="24px" p={6}>
          <Text fontWeight="700" color="gray.600">Loading cost data...</Text>
      </Box>
    );
  }

  if (isError && !data) {
    return (
      <Box bg="white" border="1px solid" borderColor={theme.colors.charts.BORDER} borderRadius="24px" p={6}>
          <Text fontWeight="700" color="red.500">Unable to load cost data.</Text>
      </Box>
    );
  }

  const totals = data?.totals || {
    totalCost: 0,
    totalRecruitmentsWithCost: 0,
    totalAccepted: 0,
    costPerAccepted: 0,
  };

  const summaryCards = [
    {
      title: "Total Cost",
      value: formatMoney(totals.totalCost),
      note: "Total recruitment cost for the selected period",
    },
    {
      title: "Cost-Tracked Listings",
      value: formatNumber(totals.totalRecruitmentsWithCost),
      note: "Campaigns with recorded recruitment costs",
    },
    {
      title: "Accepted Candidates",
      value: formatNumber(totals.totalAccepted),
      note: "Number of accepted candidates in the selected period",
    },
    {
      title: "Cost per Accepted Candidate",
      value: formatMoney(totals.costPerAccepted),
      note: "Average cost per accepted candidate",
    },
  ];

  const byType = data?.byType || [];
  const trend = data?.trend || [];
  const byDepartment = data?.byDepartment || [];
  const byRecruiter = data?.byRecruiter || [];
  const topRecruitments = data?.topRecruitments || [];

  const palette = [
    theme.colors.charts.PRIMARY_700,
    theme.colors.charts.PRIMARY_600,
    theme.colors.charts.PRIMARY_500,
    theme.colors.charts.PRIMARY_400,
    theme.colors.charts.PRIMARY_300,
  ];

  return (
    <VStack spacing={5} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5}>
        {summaryCards.map((item, index) => (
          <Box
            key={item.title}
            bg="white"
            border="1px solid"
            borderColor={index === 0 ? theme.colors.charts.PRIMARY_200 : theme.colors.charts.BORDER}
            borderRadius="24px"
            p={5}
            boxShadow="0 10px 24px rgba(26, 39, 68, 0.05)"
          >
            <Text fontSize="sm" fontWeight="600" color="gray.500">{item.title}</Text>
            <Text mt={3} fontSize="3xl" fontWeight="800" color="gray.800">{item.value}</Text>
            <Text mt={2} fontSize="sm" color="gray.500">{item.note}</Text>
          </Box>
        ))}
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={5}>
        <GridItem>
          <SectionCard title="Cost Composition by Type" subtitle="Cost distribution across expense categories">
            <Box h="320px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E7ECF4" />
                  <XAxis dataKey="type" tick={{ fill: "#718096", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#718096", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                    {byType.map((_, index) => (
                      <Cell key={index} fill={palette[index % palette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </GridItem>

        <GridItem>
          <SectionCard title="Cost and Acceptance Trend" subtitle="Monthly trend of cost and accepted candidates">
            <Box h="320px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E7ECF4" />
                  <XAxis dataKey="month" tick={{ fill: "#718096", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: "#718096", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#718096", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="cost" stroke={theme.colors.charts.PRIMARY_700} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="accepted" stroke={theme.colors.charts.PRIMARY_400} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={5}>
        <GridItem>
          <SectionCard title="Department Cost Efficiency" subtitle="Budget utilization efficiency by department">
            <Box overflowX="auto" border="1px solid" borderColor="gray.100" borderRadius="20px">
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Department</Th>
                    <Th isNumeric>Cost</Th>
                    <Th isNumeric>Accepted</Th>
                    <Th isNumeric>Cost/Accepted</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {byDepartment.map((item) => (
                    <Tr key={item.department}>
                      <Td fontWeight="700" color="gray.800">{item.department}</Td>
                      <Td isNumeric>{formatMoney(item.amount)}</Td>
                      <Td isNumeric>{item.accepted}</Td>
                      <Td isNumeric>{formatMoney(item.costPerAccepted)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </SectionCard>
        </GridItem>

        <GridItem>
          <SectionCard title="Recruiter Cost Efficiency" subtitle="Cost efficiency by recruitment owner">
            <Box overflowX="auto" border="1px solid" borderColor="gray.100" borderRadius="20px">
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Recruitment Owner</Th>
                    <Th isNumeric>Cost</Th>
                    <Th isNumeric>Accepted</Th>
                    <Th isNumeric>Cost/Accepted</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {byRecruiter.map((item) => (
                    <Tr key={item.recruiter}>
                      <Td fontWeight="700" color="gray.800">{item.recruiter}</Td>
                      <Td isNumeric>{formatMoney(item.amount)}</Td>
                      <Td isNumeric>{item.accepted}</Td>
                      <Td isNumeric>{formatMoney(item.costPerAccepted)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </SectionCard>
        </GridItem>
      </Grid>

      <SectionCard title="Highest-Cost Recruitment Listings" subtitle="Campaigns consuming the highest recruitment budget">
        <Box overflowX="auto" border="1px solid" borderColor="gray.100" borderRadius="22px">
          <Table variant="simple" size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Code</Th>
                <Th>Position</Th>
                <Th>Department</Th>
                <Th isNumeric>Cost</Th>
                <Th isNumeric>Accepted</Th>
                <Th isNumeric>Cost/Accepted</Th>
              </Tr>
            </Thead>
            <Tbody>
              {topRecruitments.map((item) => (
                <Tr key={`${item.code}-${item.title}`}>
                  <Td fontWeight="700" color="gray.800">{item.code}</Td>
                  <Td color="gray.700">{item.title}</Td>
                  <Td color="gray.600">{item.department}</Td>
                  <Td isNumeric color="gray.700">{formatMoney(item.amount)}</Td>
                  <Td isNumeric color="gray.700">{item.accepted}</Td>
                  <Td isNumeric color="gray.700">{formatMoney(item.costPerAccepted)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </SectionCard>
    </VStack>
  );
}