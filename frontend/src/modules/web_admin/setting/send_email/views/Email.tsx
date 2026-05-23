import {
    Box,
    Text,
    Flex,
    VStack,
    Badge,
    Spacer,
    InputGroup,
    InputLeftElement,
    Input,
    HStack,
    Tooltip,
    IconButton,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { FaEdit, FaTrash } from "react-icons/fa";
import { ButtonConfig } from "../../../../../components/common/Button";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import { PaginationBar } from "../../../../../components/common/PaginationBar";
import { ModalConfirm } from "../../../../../components/common/ModalConfirm";
import BaseTable, {
    DefaultTableState,
    type BaseTableState,
    type HeaderTable,
} from "../../../../../components/common/BaseTable";
import type { ISettingEmail } from "../types";
import { useGetSettingEmails } from "../api/get";
import { useDeleteSettingEmail } from "../api/delete";
import SendEmailModal from "../components/SendEmailModal";

export function SendEmail() {
    const notify = useNotify();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch] = useDebounce(searchQuery, 600);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [selected, setSelected] = useState<ISettingEmail | undefined>(undefined);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ISettingEmail | null>(null);

    const [tableState] = useState<Partial<BaseTableState>>({
        ...DefaultTableState,
        page_size: 10,
        sort_order: "desc",
        sort_by: "created_at",
    });

    const { data: settingEmailRes, refetch } = useGetSettingEmails({
        pages: page,
        items_per_pages: limit,
        search: debouncedSearch,
    });

    const { mutateAsync: deleteSettingEmail, isPending: isDeleting } = useDeleteSettingEmail();

    const items = settingEmailRes?.data ?? [];
    const pagination = settingEmailRes?.pagination ?? {
        totalItems: 0,
        currentPage: 1,
        limit: 10,
        totalPages: 1,
    };

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const columns: HeaderTable[] = [
        { name: "Code", key: "sec_code" },
        { name: "Template name", key: "name" },
        { name: "Subject", key: "subject", disableSort: true },
        { name: "Company / Unit", key: "unit_name", disableSort: true },
        { name: "Auto send", key: "auto_send", disableSort: true },
        { name: "Updated at", key: "updated_at", disableSort: true },
    ];

    const mappedItems = useMemo(
        () =>
            items.map((i) => ({
                ...i,
                unit_name: i.inforCompany?.full_name || i.inforCompany?.acronym_name || "—",
            })),
        [items],
    );

    const customRows = {
        sec_code: (_: any, row: ISettingEmail) => <Text noOfLines={1}>{row.sec_code || "—"}</Text>,
        name: (_: any, row: ISettingEmail) => <Text noOfLines={1}>{row.name || "—"}</Text>,
        subject: (_: any, row: ISettingEmail) => <Text noOfLines={1}>{row.subject || "—"}</Text>,
        unit_name: (_: any, row: ISettingEmail & { unit_name?: string }) => (
            <Text noOfLines={1}>{row.unit_name || "—"}</Text>
        ),
        auto_send: (_: any, row: ISettingEmail) => (
            <Badge
                borderRadius="lg"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
                color={row.auto_send ? "green.700" : "gray.600"}
                bg={row.auto_send ? "green.100" : "gray.100"}
            >
                {row.auto_send ? "YES" : "NO"}
            </Badge>
        ),
        updated_at: (_: any, row: ISettingEmail) => {
            if (!row.updated_at) return <Text>—</Text>;
            return <Text>{new Date(row.updated_at).toLocaleString()}</Text>;
        },
    };

    const handleDelete = async () => {
        if (!deleteTarget?.id) return;
        try {
            await deleteSettingEmail(deleteTarget.id);
            notify({
                type: "success",
                message: "Deleted",
                description: `Email template "${deleteTarget.name || ""}" has been removed.`,
            });
        } catch {
            notify({
                type: "error",
                message: "Delete failed",
                description: "Could not delete this email template.",
            });
        } finally {
            setDeleteOpen(false);
            setDeleteTarget(null);
        }
    };

    return (
        <VStack align="stretch" spacing={4}>
            <Flex align="center" gap={4}>
                <ButtonConfig
                    onClick={() => {
                        setModalMode("add");
                        setSelected(undefined);
                        setModalOpen(true);
                    }}
                >
                    ADD
                </ButtonConfig>
                <Spacer />
                <InputGroup w={{ base: "100%", md: "360px" }}>
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon />
                    </InputLeftElement>
                    <Input
                        placeholder="Search by code, template name, subject..."
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
                    data={mappedItems}
                    tableState={tableState}
                    customRows={customRows}
                    renderRowActions={(row: ISettingEmail) => (
                        <HStack spacing={1} justify="center">
                            <Tooltip label="Edit" hasArrow>
                                <IconButton
                                    aria-label="Edit"
                                    icon={<FaEdit />}
                                    size="sm"
                                    variant="ghost"
                                    color="blue.600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelected(row);
                                        setModalMode("edit");
                                        setModalOpen(true);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip label="Delete" hasArrow>
                                <IconButton
                                    aria-label="Delete"
                                    icon={<FaTrash />}
                                    size="sm"
                                    variant="ghost"
                                    color="red.600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteTarget(row);
                                        setDeleteOpen(true);
                                    }}
                                />
                            </Tooltip>
                        </HStack>
                    )}
                />
            </Box>

            <PaginationBar
                total={pagination.totalItems}
                page={page}
                perPage={limit}
                onPageChange={(p) => setPage(p)}
                onPerPageChange={(n) => {
                    setLimit(n);
                    setPage(1);
                }}
            />

            <ModalConfirm
                open={deleteOpen}
                setOpen={setDeleteOpen}
                title="Delete Email Template"
                message={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? This action cannot be undone.`}
                titleButton="DELETE"
                cancelButtonText="CANCEL"
                confirmButtonProps={{ background: "#8B0000", isLoading: isDeleting }}
                onClick={handleDelete}
            />

            <SendEmailModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelected(undefined);
                }}
                mode={modalMode}
                data={selected}
                onSuccess={() => refetch?.()}
            />
        </VStack>
    );
}