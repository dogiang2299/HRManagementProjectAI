import {
    Avatar,
    Badge,
    Box,
    Button,
    Checkbox,
    Flex,
    HStack,
    Icon,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerCloseButton,
    DrawerBody,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    Spinner,
    useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { useNavigate } from "react-router-dom";
import {
    FiCheckSquare,
    FiFilter,
    FiGrid,
    FiInbox,
    FiList,
    FiMail,
    FiMoreHorizontal,
    FiMoreVertical,
    FiSearch,
    FiSettings,
    FiSliders,
    FiTrendingUp,
} from "react-icons/fi";
import { APPLICATION_STATUS, APPLICATION_STATUS_VALUES } from "../../../../constant";
import { useGetApplication } from "../../interview_schedule/api/get_application";
import { candidateDetailUrl } from "../../../../routes/urls";

const visibleApplicationStatuses = APPLICATION_STATUS_VALUES.filter(
    (status) =>
        status !== APPLICATION_STATUS.REJECTED &&
        status !== APPLICATION_STATUS.CLOSED,
);

function StageItem({
    label,
    active,
    onClick,
}: {
    label: string;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <HStack
            spacing={2}
            minW="fit-content"
            cursor="pointer"
            onClick={onClick}
            userSelect="none"
        >
            <Text
                fontSize="md"
                fontWeight="700"
                color={active ? "blue.500" : "gray.800"}
            >
                {label}
            </Text>
        </HStack>
    );
}

type CandidatesTabContentProps = {
    recruitmentId: string;
    refreshTick?: number;
};

const normalizeStatus = (status?: string | null) =>
    (status || "").trim().toLowerCase().replace(/[\s_-]+/g, " ");

const matchesStatus = (currentStatus: string, itemStatus?: string | null) => {
    const target = normalizeStatus(currentStatus);
    const value = normalizeStatus(itemStatus);

    if (value === target) return true;

    const canonicalMap: Record<string, string> = {
        "applied": APPLICATION_STATUS.APPLIED,
        "contacted": APPLICATION_STATUS.CONTACTED,
        "interviewing": APPLICATION_STATUS.INTERVIEWING,
        "waiting response": APPLICATION_STATUS.WAITING_RESPONSE,
        "accepted": APPLICATION_STATUS.ACCEPTED,
        "rejected": APPLICATION_STATUS.REJECTED,
        "closed": APPLICATION_STATUS.CLOSED,
    };

    return normalizeStatus(canonicalMap[value] || "") === target;
};

const isNewApplication = (createdAt?: string | Date | null) => {
    if (!createdAt) return false;

    const createdTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdTime)) return false;

    const diffDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
    return diffDays <= 5;
};

const normalizeSearchText = (value?: string | null) =>
    (value || "").trim().toLowerCase();

const matchesKeyword = (
    keyword: string,
    candidate?: {
        candidate_name?: string | null;
        candidate_code?: string | null;
        phone_number?: string | null;
        email?: string | null;
    } | null,
) => {
    if (!keyword) return true;

    const haystack = [
        candidate?.candidate_name,
        candidate?.candidate_code,
        candidate?.phone_number,
        candidate?.email,
    ]
        .map((item) => normalizeSearchText(item))
        .join(" ");

    return haystack.includes(keyword);
};

export default function CandidatesTabContent({ recruitmentId, refreshTick }: CandidatesTabContentProps) {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch] = useDebounce(searchQuery, 500);
    const [activeApplicationStatus, setActiveApplicationStatus] = useState(
        visibleApplicationStatuses[0],
    );

    const { data, isLoading, refetch } = useGetApplication({
        recruitment_infor_id: recruitmentId,
        pages: 1,
        limit: 500,
        search: debouncedSearch || undefined,
        sortBy: "created_at",
        sortOrder: "desc",
    });

    const cardBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
    const subtleBg = useColorModeValue("gray.50", "whiteAlpha.50");
    const emptyTextColor = useColorModeValue("gray.600", "gray.300");

    const applications = useMemo(() => data?.data || [], [data]);
    const normalizedKeyword = useMemo(
        () => normalizeSearchText(debouncedSearch),
        [debouncedSearch],
    );

    const candidates = useMemo(() => {
        const list = applications.filter((item) =>
            matchesStatus(activeApplicationStatus, item.status) &&
            matchesKeyword(normalizedKeyword, item.candidate),
        );

        return list.map((item) => ({
            id: item.id,
            candidateId: item.candidate?.id || "",
            name: item.candidate?.candidate_name || "--",
            phone: item.candidate?.phone_number || "--",
            email: item.candidate?.email || "--",
            education: "--",
            school: "--",
            major: "--",
            badge: isNewApplication(item.created_at) ? "NEW" : null,
        }));
    }, [applications, activeApplicationStatus, normalizedKeyword]);

    useEffect(() => {
        if (refreshTick === undefined) return;
        refetch();
    }, [refreshTick, refetch]);

    return (
        <Box px={{ base: 4, md: 6 }} py={5}>
            <Box
                bg={cardBg}
                borderRadius="16px"
                border="1px solid"
                borderColor={borderColor}
                overflow="hidden"
            >
                <Flex
                    justify="space-between"
                    align={{ base: "stretch", xl: "center" }}
                    direction={{ base: "column", xl: "row" }}
                    gap={4}
                    px={{ base: 4, md: 5 }}
                    py={4}
                >
                        <InputGroup maxW="400px">
                            <InputLeftElement h="40px" pointerEvents="none">
                                <Icon as={FiSearch} color="blue.400" boxSize={4} />
                            </InputLeftElement>
                            <Input
                                placeholder="Search or ask AI for help"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                bg={subtleBg}
                                borderColor={borderColor}
                                borderRadius="12px"
                                h="40px"
                                fontSize="sm"
                                _placeholder={{ color: "gray.400" }}
                                _focus={{
                                    borderColor: "blue.400",
                                    boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
                                    bg: "white",
                                }}
                            />
                        </InputGroup>

                        <HStack justify="space-between" flex="1" flexWrap="wrap" spacing={3}>
                            <HStack spacing={2}>
                                                           </HStack>

                            <HStack spacing={2}>
                                <HStack
                                    spacing={0}
                                    border="1px solid"
                                    borderColor={borderColor}
                                    borderRadius="10px"
                                    overflow="hidden"
                                    bg="white"
                                >
                                    <IconButton
                                        aria-label="List view"
                                        icon={<FiList />}
                                        variant="ghost"
                                        size="sm"
                                        color={viewMode === "list" ? "blue.500" : "gray.500"}
                                        bg={viewMode === "list" ? "blue.50" : "transparent"}
                                        borderRadius="0"
                                        onClick={() => setViewMode("list")}
                                    />
                                    <IconButton
                                        aria-label="Grid view"
                                        icon={<FiGrid />}
                                        variant="ghost"
                                        size="sm"
                                        color={viewMode === "grid" ? "blue.500" : "gray.500"}
                                        bg={viewMode === "grid" ? "blue.50" : "transparent"}
                                        borderRadius="0"
                                        onClick={() => setViewMode("grid")}
                                    />
                                </HStack>

                                <IconButton aria-label="Filter" icon={<FiFilter />} variant="outline" size="sm" borderRadius="10px" />
                                <IconButton aria-label="Sort" icon={<FiSliders />} variant="outline" size="sm" borderRadius="10px" />
                                <IconButton aria-label="Analytics" icon={<FiTrendingUp />} variant="outline" size="sm" borderRadius="10px" />
                                <IconButton aria-label="Settings" icon={<FiSettings />} variant="outline" size="sm" borderRadius="10px" />
                            </HStack>
                        </HStack>
                    </Flex>

                <Box px={{ base: 4, md: 5 }} pb={4}>
                    <Flex
                        align="center"
                        justify={{ base: "flex-start", lg: "center" }}
                        gap={{ base: 4, md: 6, lg: 8 }}
                        overflowX="auto"
                        whiteSpace="nowrap"
                        py={3}
                    >
                        {visibleApplicationStatuses.map((status, index) => (
                            <HStack key={status} spacing={4}>
                                <StageItem
                                    label={status}
                                    active={activeApplicationStatus === status}
                                    onClick={() => setActiveApplicationStatus(status)}
                                />
                                {index < visibleApplicationStatuses.length - 1 && (
                                    <Text color="gray.300" fontSize="md">
                                        ›
                                    </Text>
                                )}
                            </HStack>
                        ))}
                    </Flex>
                </Box>

                <Box borderTop="1px solid" borderColor={borderColor}>
                    <Box overflowX="auto">
                        <Table variant="unstyled" minW="1120px">
                            <Thead bg={useColorModeValue("#fbfcfe", "whiteAlpha.50")}>
                                <Tr>
                                    <Th py={3.5} px={5} color="gray.600" fontSize="sm" fontWeight="800" textTransform="none">
                                        Full name
                                    </Th>
                                    <Th py={3.5} color="gray.600" fontSize="sm" fontWeight="800" textTransform="none">
                                        Phone number
                                    </Th>
                                    <Th py={3.5} color="gray.600" fontSize="sm" fontWeight="800" textTransform="none">
                                        Email
                                    </Th>
                                    <Th py={3.5} color="gray.600" fontSize="sm" fontWeight="800" textTransform="none">
                                        Education level
                                    </Th>
                                    <Th py={3.5} color="gray.600" fontSize="sm" fontWeight="800" textTransform="none">
                                        School / Institution
                                    </Th>
                                    <Th py={3.5} color="gray.600" fontSize="sm" fontWeight="800" textTransform="none">
                                        Major
                                    </Th>
                                </Tr>
                            </Thead>

                            <Tbody>
                                {candidates.length === 0 ? (
                                    <Tr>
                                        <Td bg="white" colSpan={8} textAlign="center" py={10}>
                                            <Flex direction="column" align="center" justify="center">
                                                <Icon as={FiInbox} boxSize={12} color={emptyTextColor} />
                                                <HStack mt={2} spacing={2}>
                                                    <Text color={emptyTextColor} fontSize="lg">
                                                        No data
                                                    </Text>
                                                    {isLoading && <Spinner size="xs" color="gray.400" />}
                                                </HStack>
                                            </Flex>
                                        </Td>
                                    </Tr>
                                ) : (
                                    candidates.map((candidate) => (
                                        <Tr
                                            key={candidate.id}
                                            borderTop="1px solid"
                                            borderColor={borderColor}
                                            _hover={{ bg: "gray.50", cursor: "pointer" }}
                                            onClick={() => navigate(candidateDetailUrl.replace(':id', candidate.candidateId))}
                                        >
                                            <Td py={3.5} px={5}>
                                                <HStack spacing={3}>
                                                    <Avatar name={candidate.name} size="sm" bg="blue.400" color="white" />
                                                    <HStack spacing={2}>
                                                        <Text fontSize="sm" fontWeight="700" color="gray.800">
                                                            {candidate.name}
                                                        </Text>
                                                        {candidate.badge && (
                                                            <Badge
                                                                bg="#334371"
                                                                color="white"
                                                                borderRadius="8px"
                                                                px={2}
                                                                py={0.5}
                                                                textTransform="none"
                                                                fontSize="10px"
                                                                fontWeight="700"
                                                            >
                                                                {candidate.badge}
                                                            </Badge>
                                                        )}
                                                    </HStack>
                                                </HStack>
                                            </Td>

                                            <Td py={3.5}>
                                                <Text fontSize="sm" color="gray.700" fontWeight="500">
                                                    {candidate.phone}
                                                </Text>
                                            </Td>

                                            <Td py={3.5}>
                                                <Text fontSize="sm" color="gray.700" fontWeight="500">
                                                    {candidate.email}
                                                </Text>
                                            </Td>

                                            <Td py={3.5}>
                                                <Text fontSize="sm" color="gray.700" fontWeight="500">
                                                    {candidate.education}
                                                </Text>
                                            </Td>

                                            <Td py={3.5}>
                                                <Text fontSize="sm" color="gray.700" fontWeight="500">
                                                    {candidate.school}
                                                </Text>
                                            </Td>

                                            <Td py={3.5}>
                                                <Text
                                                    fontSize="sm"
                                                    color="gray.700"
                                                    fontWeight="500"
                                                    noOfLines={1}
                                                    maxW="160px"
                                                >
                                                    {candidate.major}
                                                </Text>
                                            </Td>
                                        </Tr>
                                    ))
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
