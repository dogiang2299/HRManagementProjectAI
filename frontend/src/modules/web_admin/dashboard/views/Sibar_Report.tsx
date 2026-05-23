import { DownloadIcon, TimeIcon } from "@chakra-ui/icons";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { useGetCompanies } from "../../inform_company/api/get_company";
import { Badge, Box, Button, Flex, HStack, Icon, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { theme } from "../../../../theme";
import CostReport from "../components/CostReport";
import DashboardOverview from "../components/DashboardOverview";
import PerformanceReport from "../components/PerformanceReport";
import PlanReport from "../components/PlanReport";
import RejectedCandidatesReport from "../components/RejectedReport";
import ReportSettings from "../components/ReportSettings";
import { useDashboardOverview } from "../api/use_overview";
import { useDashboardCost } from "../api/get_cost";
import { useDashboardPerformance } from "../api/get_performance";
import type { DashboardPeriod, DashboardScope, ReportTabKey } from "../types";
import { sibarItems } from "../utils";
import { useDashboardPlan } from "../api/get_plan";
import { useDashboardRejected } from "../api/get_rejected";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import { useAuthStore } from "../../../auth/store/auth.store";
// Type-only imports for adapter
import type { DashboardOverviewResponse } from "../api/get_overview";
import type { DashboardOverviewData, DashboardStatCard } from "../types";
// Adapter: convert API response to DashboardOverviewData
function toDashboardOverviewData(res?: DashboardOverviewResponse): DashboardOverviewData | undefined {
  if (!res) return undefined;
  // Map API fields to statCards and other DashboardOverviewData fields
  const statCards: DashboardStatCard[] = [
    {
      title: "Total Recruitments",
      value: String(res.totalRecruitments ?? "--"),
      change: "0%", // fake or default value
      note: "Total recruitment postings",
    },
    {
      title: "Total Applications",
      value: String(res.totalApplications ?? "--"),
      change: "0%",
      note: "Total applications",
    },
    // Add more cards if needed
  ];
  return {
    statCards,
    applicationStatusData: [],
    applicationTrendData: [],
    recruitmentCostData: [],
    planProgressData: [],
    recentRecruitments: [],
    updatedAt: new Date().toISOString(),
  };
}

const { BORDER, PRIMARY, PRIMARY_200, PRIMARY_300, PRIMARY_900 } =
  theme.colors.charts;

const periodOptions = ["This Month", "This Quarter", "Year to Date"] as const;
const scopeOptions = ["All Departments", "Tech Division Only", "Operations Division"] as const;

const tabDescriptions: Record<ReportTabKey, string> = {
  dashboard: "Monitor real-time recruitment KPIs and detect trend deviations early.",
  performance: "Measure recruitment pipeline performance by owner, position, and stage progression.",
  cost: "Control hiring budget by channel, department, and cost per successful candidate.",
  plan: "Track headcount plans, completed hires, and weekly position closure progress.",
  rejected: "Analyze rejection drivers to optimize screening, interviews, and candidate source quality.",
  settings: "Configure default filters, update rules, and reporting data scope.",
};

export default function RecruitmentDashboardMockupTSX() {
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);
  const canFilterByCompany = hasAnyRole([RECRUIT_BASE_ROLE.Admin, RECRUIT_BASE_ROLE.Employee]);

  const [companySearch, setCompanySearch] = React.useState<string>("");
  // Company filter state
  const { data: companiesRes, isLoading: isCompaniesLoading } = useGetCompanies({
    page: 1,
    limit: 50,
    search: companySearch,
  }, {
    enabled: canFilterByCompany,
  });
  const [selectedCompany, setSelectedCompany] = React.useState<string>("");

  // Auto-select first company when filtering by company is enabled.
  React.useEffect(() => {
    if (!canFilterByCompany) return;
    if (!selectedCompany && companiesRes?.data?.length) {
      setSelectedCompany(companiesRes.data[0].id);
    }
  }, [canFilterByCompany, companiesRes, selectedCompany]);
  
  const [activeTab, setActiveTab] = React.useState<ReportTabKey>("dashboard");
  const [activePeriod, setActivePeriod] = React.useState<(typeof periodOptions)[number]>(periodOptions[0]);
  const [activeScope, setActiveScope] = React.useState<(typeof scopeOptions)[number]>(scopeOptions[0]);
  const isOverviewTab = activeTab === "dashboard";
  const isPerformanceTab = activeTab === "performance";
  const isCostTab = activeTab === "cost";
  const isPlanTab = activeTab === "plan";
  const isRejectedTab = activeTab === "rejected";

  const periodParam: DashboardPeriod =
    activePeriod === "This Month"
      ? "month"
      : activePeriod === "This Quarter"
        ? "quarter"
        : "ytd";

  const scopeParam: DashboardScope =
    activeScope === "Tech Division Only"
      ? "tech"
      : activeScope === "Operations Division"
        ? "operations"
        : "all";

  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
  } = useDashboardOverview(
    { companyId: selectedCompany || undefined },
    { enabled: isOverviewTab }
  );

  const {
    data: performanceData,
    isLoading: isPerformanceLoading,
    isError: isPerformanceError,
  } = useDashboardPerformance(
    {
      period: periodParam,
      scope: scopeParam,
      companyId: selectedCompany || undefined,
    },
    {
      enabled: isPerformanceTab,
    },
  );

  const {
    data: costData,
    isLoading: isCostLoading,
    isError: isCostError,
  } = useDashboardCost(
    {
      period: periodParam,
      scope: scopeParam,
      companyId: selectedCompany || undefined,
    },
    {
      enabled: isCostTab,
    },
  );

  const {
    data: planData,
    isLoading: isPlanLoading,
    isError: isPlanError,
  } = useDashboardPlan(
    {
      period: periodParam,
      scope: scopeParam,
      companyId: selectedCompany || undefined,
    },
    {
      enabled: isPlanTab,
    },
  );

  const {
    data: rejectedData,
    isLoading: isRejectedLoading,
    isError: isRejectedError,
  } = useDashboardRejected(
    {
      period: periodParam,
      scope: scopeParam,
      companyId: selectedCompany || undefined,
    },
    {
      enabled: isRejectedTab,
    },
  );

  // Convert API response to DashboardOverviewData for component
  const overviewDataForComponent = toDashboardOverviewData(overviewData);

  const statHighlights = React.useMemo(() => {
    const cardMap = new Map((overviewDataForComponent?.statCards || []).map((card: DashboardStatCard) => [card.title, card.value]));
    const getValue = (...keys: string[]) => {
      const val = keys.map((key) => cardMap.get(key)).find(Boolean);
      return typeof val === "string" || typeof val === "number" ? val : "--";
    };
    return [
      { label: "Active Campaigns", value: getValue("Total Recruitments", "Total recruitment postings") },
      { label: "Applications", value: getValue("Total Applications", "Total applications") },
      { label: "Accepted Candidates", value: getValue("Accepted Candidates", "Accepted candidates") },
    ];
  }, [overviewDataForComponent?.statCards]);

  const activeLabel = sibarItems.find((item) => item.key === activeTab)?.label ?? "Overview";

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            data={overviewDataForComponent}
            isLoading={isOverviewLoading}
            isError={isOverviewError}
          />
        );
      case "performance":
        return (
          <PerformanceReport
            data={performanceData}
            isLoading={isPerformanceLoading}
            isError={isPerformanceError}
          />
        );
      case "cost":
        return (
          <CostReport
            data={costData}
            isLoading={isCostLoading}
            isError={isCostError}
          />
        );
      case "plan":
        return (
          <PlanReport
            data={planData}
            isLoading={isPlanLoading}
            isError={isPlanError}
          />
        );
      case "rejected":
        return (
          <RejectedCandidatesReport
            data={rejectedData}
            isLoading={isRejectedLoading}
            isError={isRejectedError}
          />
        );
      case "settings":
        return <ReportSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <Box minH="100vh" position="relative" overflow="hidden">
      <Box
        position="absolute"
        top="-120px"
        right="-120px"
        w="340px"
        h="340px"
        bg="radial-gradient(circle, rgba(90,108,152,0.24) 0%, rgba(90,108,152,0) 70%)"
        pointerEvents="none"
      />

      <Flex maxW="1540px" mx="auto" gap={{ base: 3, md: 5 }} align="flex-start" direction={{ base: "column", lg: "row" }}>
        <Box
          w={{ base: "100%", lg: "230px" }}
          bg="white"
          border="1px solid"
          borderColor={BORDER}
          borderRadius="7px"
          boxShadow="0 12px 34px rgba(26, 39, 68, 0.06)"
          py={3}
          px={{ base: 3, lg: 3 }}
          position="relative"
          top="auto"
          alignSelf="flex-start"
          h={{ base: "auto", lg: "calc(100vh - 32px)" }}
        >
          <VStack align="stretch" spacing={4} h="100%" justify="space-between">
           

            <VStack spacing={2} align="stretch" flex="1" overflowY="auto" className="hide-scrollbar">
              {sibarItems.map((item) => {
                const isActive = item.key === activeTab;

                return (
                  <Button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    h="45px"
                    justifyContent={{ base: "center", lg: "flex-start" }}
                    px={{ base: 3, lg: 4 }}
                    borderRadius="7px"
                    bg={isActive ? "rgba(51, 67, 113, 0.10)" : "transparent"}
                    color={isActive ? PRIMARY : "gray.500"}
                    _hover={{ bg: isActive ? "rgba(51, 67, 113, 0.12)" : "gray.50" }}
                    _active={{ bg: isActive ? "rgba(51, 67, 113, 0.14)" : "gray.100" }}
                    transition="all 0.2s ease"
                    title={item.label}
                  >
                    <HStack w="full" spacing={3} justify={{ base: "center", lg: "flex-start" }}>
                      <Icon as={item.icon} boxSize={5} />
                      <Text display={{ base: "none", lg: "block" }} fontWeight="600" fontSize="15px">
                        {item.label}
                      </Text>
                    </HStack>
                  </Button>
                );
              })}
            </VStack>

            <Box
              borderRadius="18px"
              p={3}
              bg="rgba(51, 67, 113, 0.06)"
              border="1px solid"
              borderColor={PRIMARY_200}
            >
              <HStack spacing={2} color={PRIMARY}>
                <TimeIcon boxSize={3.5} />
                <Text fontSize="xs" fontWeight="700">
                  Last synchronized: 2 minutes ago
                </Text>
              </HStack>
            </Box>
          </VStack>
        </Box>

        <Box flex="1" minW={0}>
          <VStack spacing={5} align="stretch">
            <Box
              bg="white"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="md"
              px={{ base: 5, md: 7 }}
              py={{ base: 5, md: 6 }}
              boxShadow="0 12px 34px rgba(26, 39, 68, 0.06)"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="-60px"
                right="-40px"
                w="220px"
                h="220px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(126,141,178,0.22) 0%, rgba(126,141,178,0) 68%)"
                pointerEvents="none"
              />

              <Flex
                direction={{ base: "column", xl: "row" }}
                align={{ base: "stretch", xl: "center" }}
                justify="space-between"
                gap={5}
                position="relative"
                zIndex={1}
              >
                <Box>
                  <HStack spacing={2} wrap="wrap">
                    <Badge px={3} py={1} borderRadius="full" bg="rgba(51, 67, 113, 0.10)" color={PRIMARY_900}>
                      Recruitment Reporting Center
                    </Badge>
                    <Badge px={3} py={1} borderRadius="full" bg="rgba(90, 108, 152, 0.14)" color={PRIMARY_900}>
                      Live Data
                    </Badge>
                  </HStack>

                  <Text mt={3} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" color={PRIMARY_900}>
                    {activeLabel}
                  </Text>
                  <Text mt={2} maxW="760px" fontSize="sm" color="gray.500">
                    {tabDescriptions[activeTab]}
                  </Text>

                  <HStack mt={4} spacing={3} wrap="wrap">
                    {statHighlights.map((item) => (
                      <Box
                        key={item.label}
                        px={3.5}
                        py={2}
                        borderRadius="14px"
                        bg="rgba(51, 67, 113, 0.06)"
                        border="1px solid"
                        borderColor={PRIMARY_300}
                      >
                        <Text fontSize="xs" fontWeight="600" color="gray.500">
                          {item.label}
                        </Text>
                        <Text mt={0.5} fontSize="md" fontWeight="800" color={PRIMARY_900}>
                          {item.value ?? "--"}
                        </Text>
                      </Box>
                    ))}
                  </HStack>
                </Box>

                <VStack align={{ base: "stretch", xl: "flex-end" }} spacing={3}>
                  {canFilterByCompany && (
                    <SearchCombobox
                      value={selectedCompany}
                      onChange={setSelectedCompany}
                      options={companiesRes?.data?.map((c) => ({
                        id: c.id,
                        name: c.full_name || c.acronym_name || "No name",
                      })) || []}
                      placeholder="Select company"
                      isAsync
                      onSearchChange={setCompanySearch}
                      isLoading={isCompaniesLoading}
                    />
                  )}
                  <HStack spacing={2} wrap="wrap" justify={{ base: "flex-start", xl: "flex-end" }}>
                    {periodOptions.map((option) => {
                      const isActive = option === activePeriod;
                      return (
                        <Button
                          key={option}
                          size="sm"
                          borderRadius="12px"
                          border="1px solid"
                          borderColor={isActive ? PRIMARY : BORDER}
                          bg={isActive ? "rgba(51, 67, 113, 0.10)" : "white"}
                          color={isActive ? PRIMARY_900 : "gray.600"}
                          onClick={() => setActivePeriod(option)}
                        >
                          {option}
                        </Button>
                      );
                    })}
                  </HStack>

                  <HStack spacing={2} wrap="wrap" justify={{ base: "flex-start", xl: "flex-end" }}>
                    {scopeOptions.map((option) => {
                      const isActive = option === activeScope;
                      return (
                        <Button
                          key={option}
                          size="sm"
                          borderRadius="12px"
                          border="1px solid"
                          borderColor={isActive ? PRIMARY : BORDER}
                          bg={isActive ? "rgba(51, 67, 113, 0.10)" : "white"}
                          color={isActive ? PRIMARY_900 : "gray.600"}
                          onClick={() => setActiveScope(option)}
                        >
                          {option}
                        </Button>
                      );
                    })}
                  </HStack>

                  <Button
                    leftIcon={<DownloadIcon />}
                    h="42px"
                    px={5}
                    borderRadius="14px"
                    border="1px solid"
                    borderColor={PRIMARY}
                    bg={PRIMARY}
                    color="white"
                    _hover={{ bg: PRIMARY_900 }}
                    _active={{ bg: PRIMARY_900 }}
                  >
                    Export Report
                  </Button>
                </VStack>
              </Flex>
            </Box>

            <Box
              maxH={{ base: "none", lg: "calc(100vh - 320px)" }}
              overflowY={{ base: "visible", lg: "auto" }}
              pr={{ base: 0, lg: 1 }}
              className="hide-scrollbar"
            >
              {renderContent()}
            </Box>
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
}