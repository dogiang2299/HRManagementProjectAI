import {
    Badge,
    Box,
    Button,
    Divider,
    Flex,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    SimpleGrid,
    Spacer,
    Spinner,
    Text,
    Tooltip,
    VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { FaTrash } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { ButtonConfig } from "../../../../../components/common/Button";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import { PaginationBar } from "../../../../../components/common/PaginationBar";
import { ModalConfirm } from "../../../../../components/common/ModalConfirm";
import BaseTable, {
    DefaultTableState,
    type BaseTableState,
    type HeaderTable,
} from "../../../../../components/common/BaseTable";
import { SKILL_STATUS } from "../../../../../constant";
import type { ISkill } from "../types";
import { useGetCompanySkills, useGlobalSearchSkills } from "../api/get";
import { useAddCompanySkill, useRemoveCompanySkill } from "../api/companySkill";

export function Skill() {
    const notify = useNotify();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch] = useDebounce(searchQuery, 600);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [addOpen, setAddOpen] = useState(false);
    const [globalKeyword, setGlobalKeyword] = useState("");
    const [debouncedGlobalKeyword] = useDebounce(globalKeyword, 500);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<ISkill | null>(null);

    const [tableState, setTableState] = useState<Partial<BaseTableState>>({
        ...DefaultTableState,
        page_size: 10,
        sort_order: "asc",
        sort_by: "name",
    });

    const {
        data: companySkills = [],
        refetch,
        isFetching: isCompanySkillFetching,
    } = useGetCompanySkills(debouncedSearch);

    const {
        data: globalSkills = [],
        isFetching: isGlobalSearching,
    } = useGlobalSearchSkills(debouncedGlobalKeyword, 20, {
        enabled: addOpen && Boolean(debouncedGlobalKeyword.trim()),
    });

    const { mutateAsync: addCompanySkill, isPending: isAdding } = useAddCompanySkill();
    const { mutateAsync: removeCompanySkill, isPending: isRemoving } = useRemoveCompanySkill();

    const companySkillIds = useMemo(
        () => new Set(companySkills.map((item) => item.id)),
        [companySkills],
    );

    const totalItems = companySkills.length;
    const pageStart = (page - 1) * limit;
    const pagedItems = companySkills.slice(pageStart, pageStart + limit);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, limit]);

    useEffect(() => {
        setTableState((prev) => ({
            ...prev,
            selected_items: [],
        }));
    }, [page, limit, debouncedSearch]);

    const columns: HeaderTable[] = [
        { name: "Skill name", key: "name" },
        { name: "Description", key: "description", disableSort: true },
        { name: "Status", key: "status", disableSort: true },
    ];

    const customRows = {
        description: (_: any, row: ISkill) => (
            <Text noOfLines={1} color="gray.600">
                {row.description || "—"}
            </Text>
        ),
        status: (_: any, row: ISkill) => {
            const active = row.is_active;
            return (
                <Badge
                    borderRadius="lg"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="700"
                    textTransform="uppercase"
                    color={active ? "green.700" : "gray.600"}
                    bg={active ? "green.100" : "gray.100"}
                >
                    {active ? SKILL_STATUS.ACTIVE : SKILL_STATUS.INACTIVE}
                </Badge>
            );
        },
    };

    const handleAddGlobalSkill = async (skill: ISkill) => {
        if (!skill.id) return;

        try {
            await addCompanySkill(skill.id);
            notify({
                type: "success",
                message: "Skill added",
                description: `"${skill.name}" has been added to this company.`,
            });
            setGlobalKeyword("");
            await refetch?.();
        } catch {
            notify({
                type: "error",
                message: "Add skill failed",
                description: "Could not add this skill to the company skill set.",
            });
        }
    };

    const handleRemove = async () => {
        if (!removeTarget?.id) return;

        try {
            await removeCompanySkill(removeTarget.id);
            notify({
                type: "success",
                message: "Skill removed",
                description: `"${removeTarget.name}" has been removed from this company.`,
            });
            await refetch?.();
        } catch {
            notify({
                type: "error",
                message: "Remove failed",
                description: "Could not remove this skill from the company skill set.",
            });
        } finally {
            setRemoveOpen(false);
            setRemoveTarget(null);
        }
    };

    return (
        <VStack align="stretch" spacing={4}>
            <Flex align="center" gap={4} wrap="wrap">
                <ButtonConfig
                    onClick={() => {
                        setGlobalKeyword("");
                        setAddOpen(true);
                    }}
                >
                    ADD SKILL
                </ButtonConfig>

                <Text fontSize="sm" color="gray.600">
                    Showing skills active for this company.
                </Text>

                <Spacer />
                <InputGroup w={{ base: "100%", md: "360px" }}>
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon />
                    </InputLeftElement>
                    <Input
                        placeholder="Search company skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </InputGroup>
            </Flex>

            <Box
                overflowY="auto"
                sx={{
                    table: { borderCollapse: "separate", borderSpacing: 0 },
                    "& thead": {
                        position: "sticky",
                        top: 0,
                        zIndex: 11,
                        bg: "#334371",
                        color: "white",
                        backgroundClip: "padding-box",
                    },
                }}
            >
                <BaseTable
                    columns={columns}
                    data={pagedItems}
                    tableState={tableState}
                    onTableStateChange={setTableState}
                    customRows={customRows}
                    hideCheckboxes
                    isLoading={isCompanySkillFetching}
                    renderRowActions={(row: ISkill) => (
                        <HStack spacing={1} justify="center">
                            <Tooltip label="Remove from company skills" hasArrow>
                                <IconButton
                                    aria-label="Remove from company skills"
                                    icon={<FaTrash />}
                                    size="sm"
                                    variant="ghost"
                                    color="red.600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRemoveTarget(row);
                                        setRemoveOpen(true);
                                    }}
                                />
                            </Tooltip>
                        </HStack>
                    )}
                />
            </Box>

            <PaginationBar
                total={totalItems}
                page={page}
                perPage={limit}
                onPageChange={(p) => setPage(p)}
                onPerPageChange={(n) => {
                    setLimit(n);
                    setPage(1);
                }}
            />

            <ModalConfirm
                open={removeOpen}
                setOpen={setRemoveOpen}
                title="Remove from company skills"
                message={`Remove "${removeTarget?.name ?? ""}" from this company? The global skill will remain available in the system.`}
                titleButton="REMOVE"
                cancelButtonText="CANCEL"
                confirmButtonProps={{ background: "#8B0000", isLoading: isRemoving }}
                onClick={handleRemove}
            />

            <Modal
                isOpen={addOpen}
                onClose={() => setAddOpen(false)}
                isCentered
                size="2xl"
            >
                <ModalOverlay />
                <ModalContent borderRadius="16px">
                    <ModalHeader>
                        <Text fontSize="xl" fontWeight="800" color="#1F2937">
                            Add skill
                        </Text>
                        <Text fontSize="sm" color="gray.500" fontWeight="500" mt={1}>
                            Search the global skill library and add selected skills to this company.
                        </Text>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <SearchIcon />
                            </InputLeftElement>
                            <Input
                                placeholder="Search global skills..."
                                value={globalKeyword}
                                onChange={(e) => setGlobalKeyword(e.target.value)}
                            />
                        </InputGroup>

                        <Divider my={4} />

                        {!debouncedGlobalKeyword.trim() ? (
                            <Text color="gray.500" fontSize="sm">
                                Enter a keyword to search global skills.
                            </Text>
                        ) : isGlobalSearching ? (
                            <Flex justify="center" py={8}>
                                <Spinner color="#334371" />
                            </Flex>
                        ) : globalSkills.length > 0 ? (
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                                {globalSkills.map((skill) => {
                                    const alreadyAdded = companySkillIds.has(skill.id);

                                    return (
                                        <Box
                                            key={skill.id}
                                            border="1px solid"
                                            borderColor="#E2E8F0"
                                            borderRadius="10px"
                                            p={3}
                                            bg="white"
                                        >
                                            <HStack align="start" justify="space-between" spacing={3}>
                                                <Box minW={0}>
                                                    <Text fontWeight="800" color="#1F2937" noOfLines={1}>
                                                        {skill.name}
                                                    </Text>
                                                    <Text mt={1} fontSize="sm" color="gray.500" noOfLines={2}>
                                                        {skill.description || "No description"}
                                                    </Text>
                                                </Box>

                                                <Button
                                                    size="sm"
                                                    leftIcon={<FiPlus />}
                                                    colorScheme="blue"
                                                    isDisabled={alreadyAdded}
                                                    isLoading={isAdding}
                                                    onClick={() => handleAddGlobalSkill(skill)}
                                                >
                                                    {alreadyAdded ? "Added" : "Add"}
                                                </Button>
                                            </HStack>
                                        </Box>
                                    );
                                })}
                            </SimpleGrid>
                        ) : (
                            <Text color="gray.500" fontSize="sm">
                                No global skills found.
                            </Text>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </VStack>
    );
}
