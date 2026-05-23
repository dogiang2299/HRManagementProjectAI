import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Spacer,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useGetCompanies } from "../../inform_company/api/get_company";
import { useGetInform } from "../api/get";
import RecruitmentFeedCard from "../components/RecruitmentFeedCard";
import { ButtonConfig } from "../../../../components/common/Button";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { PaginationBar } from "../../../../components/common/PaginationBar";
import { type RecruitmentStatusType, RecruitmentStatus, RECRUITMENT_STATUS_DISPLAY } from "../../../../constant";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import { recruitmentInforAddUrl } from "../../../../routes/urls";
import { useAuthStore } from "../../../auth/store/auth.store";

export function Recruitment() {
  const navigate = useNavigate();
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);
  const canFilterByCompany = hasAnyRole([
    RECRUIT_BASE_ROLE.Admin,
    RECRUIT_BASE_ROLE.Employee,
  ]);

  const stickyBg = useColorModeValue("white", "gray.800");
  const emptyBg = useColorModeValue("gray.50", "gray.700");
  const emptyTextColor = useColorModeValue("gray.500", "gray.300");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [statusFilter, setStatusFilter] = useState<"All" | RecruitmentStatusType>("All");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedDepartmentId =
    canFilterByCompany && companyFilter !== "all" ? companyFilter : undefined;

  const { data, isLoading, isError } = useGetInform({
    pages: page,
    limit,
    search: searchQuery.trim() || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    department_id: selectedDepartmentId,
  });

  const { data: companyData } = useGetCompanies(
    { page: 1, limit: 500 },
    { enabled: canFilterByCompany }
  );

  const list = data?.data ?? [];
  const pagination = data?.pagination;

  const companyOptions = useMemo(() => {
    if (!canFilterByCompany) return [] as Array<{ id: string; name: string }>;

    return (companyData?.data ?? [])
      .map((it) => ({
        id: it.id,
        name: (it.full_name ?? it.acronym_name ?? "").trim(),
      }))
      .filter((it) => Boolean(it.id && it.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [canFilterByCompany, companyData?.data]);

  useEffect(() => {
    if (!canFilterByCompany && companyFilter !== "all") {
      setCompanyFilter("all");
      setPage(1);
    }
  }, [canFilterByCompany, companyFilter]);

  return (
    <VStack align="stretch" spacing={4} h="calc(100vh - 170px)" minH={0}>
      <Box position="sticky" top={0} zIndex={2} bg={stickyBg} pb={2}>
        <Flex align={{ base: "stretch", md: "center" }} gap={4} wrap="wrap">
          <ButtonConfig onClick={() => navigate(recruitmentInforAddUrl)}>ADD</ButtonConfig>
          <Spacer display={{ base: "none", md: "block" }} />

          <InputGroup w={{ base: "100%", md: "400px" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon />
            </InputLeftElement>
            <Input
              placeholder="Search by recruitment name - code, ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </InputGroup>

          {canFilterByCompany && (
            <Box w={{ base: "100%", md: "220px" }}>
              <SearchCombobox
                value={companyFilter}
                onChange={(value) => {
                  setCompanyFilter(value || "all");
                  setPage(1);
                }}
                options={[
                  { id: "all", name: "All companies" },
                  ...companyOptions,
                ]}
                placeholder="Filter by company"
                isClearable={false}
                size="md"
              />
            </Box>
          )}

          <Box w={{ base: "100%", md: "180px" }}>
            <SearchCombobox
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter((value || "All") as "All" | RecruitmentStatusType);
                setPage(1);
              }}
              options={[
                { id: "All", name: "All status" },
                ...Object.values(RecruitmentStatus).map((v) => ({
                  id: v,
                  name: RECRUITMENT_STATUS_DISPLAY[v as RecruitmentStatusType],
                })),
              ]}
              placeholder="Filter by status"
              isClearable={false}
              size="md"
            />
          </Box>
        </Flex>
      </Box>

      <Box flex={1} minH={0} overflowY="auto" pr={1}>
        {isLoading ? (
          <Text>Loading...</Text>
        ) : isError ? (
          <Text color="red.500">Failed to load recruitments.</Text>
        ) : list.length === 0 ? (
          <Box w="100%" maxH="50%" borderRadius="12px" bg={emptyBg} p={8}>
            <Flex direction="column" align="center" justify="center" textAlign="center">
              <Icon as={FiInbox} boxSize={12} color={emptyTextColor} />
              <Text color={emptyTextColor} fontSize="lg" mt={2}>
                No data
              </Text>
            </Flex>
          </Box>
        ) : (
          <VStack align="stretch" spacing={3}>
            {list.map((item) => <RecruitmentFeedCard key={item.id} item={item} />)}
          </VStack>
        )}
      </Box>


      <PaginationBar
        total={pagination?.totalItems ?? 0}
        page={page}
        perPage={limit}
        onPageChange={(nextPage) => setPage(nextPage)}
        onPerPageChange={(nextLimit) => {
          setLimit(nextLimit);
          setPage(1);
        }}
      />
    </VStack>
  );
}
