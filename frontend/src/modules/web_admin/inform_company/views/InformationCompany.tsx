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
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import type { IInforCompany } from "../types";
import { useGetCompanies } from "../api/get_company";
import { useBulkUpdateCompany, useUpdateCompany } from "../api/update_company";
import { SearchIcon } from "@chakra-ui/icons";
import InformModal from "../components/InformModal";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import BaseTable, { type BaseTableState, DefaultTableState, type HeaderTable } from "../../../../components/common/BaseTable";
import { ButtonConfig } from "../../../../components/common/Button";
import { ModalConfirm } from "../../../../components/common/ModalConfirm";
import { PaginationBar } from "../../../../components/common/PaginationBar";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { INFOR_COMPANY_STATUS_DISPLAY } from "../../../../constant";
import SearchCombobox from "../../../../components/common/SearchCombobox";

type BulkActionType = "activate" | "inactive" | "delete";

export function InforCompany() {
  const notify = useNotify();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 1000);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCompany, setSelectedCompany] = useState<
    IInforCompany | undefined
  >(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IInforCompany | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkActionType | null>(null);

  const [tableState, setTableState] = useState<BaseTableState>({
    ...DefaultTableState,
    page_size: 10,
    sort_order: "desc",
    sort_by: "created_at",
  });

  const sortBy = tableState.sort_by;
  const sortOrder = tableState.sort_order;

  const { data: ICompanyData, refetch } = useGetCompanies({
    page,
    limit,
    search: debouncedSearch ?? "",
    status: statusFilter === "All" ? undefined : statusFilter,
    sortBy,
    sortOrder,
  });

  const updateCompanyMutation = useUpdateCompany();
  const bulkUpdateCompanyMutation = useBulkUpdateCompany();

  const items = Array.isArray(ICompanyData?.data) ? ICompanyData.data : [];
  const pagination = ICompanyData?.pagination ?? {
    totalItems: 0,
    currentPage: 1,
    limit: 10,
    totalPages: 1,
  };
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    setTableState((prev) => ({
      ...prev,
      selected_items: [],
    }));
  }, [page, limit, statusFilter, debouncedSearch]);

  const statusOptions = useMemo(
    () => [
      { id: "All", name: "All" },
      ...Object.entries(INFOR_COMPANY_STATUS_DISPLAY).map(([key, label]) => ({
        id: key,
        name: label,
      })),
    ],
    [],
  );

  const columns: HeaderTable[] = [
    { name: "Code", key: "infor_code" },
    { name: "Company", key: "full_name" },
    { name: "Phone", key: "phone_number", disableSort: true },
    { name: "Email", key: "email", disableSort: true },
    { name: "Status", key: "status", disableSort: true },
  ];
  const mappedItems = useMemo(() => {
    const arr = items?.map((i) => ({
      ...i,
    }));
    return arr;
  }, [items]);

  const selectedItems = (tableState.selected_items ?? []) as IInforCompany[];
  const selectedIds = selectedItems.map((company) => company.id).filter(Boolean);
  const hasSelectedItems = selectedIds.length > 0;

  const openBulkConfirm = (action: BulkActionType) => {
    if (!hasSelectedItems) {
      notify({
        type: "warning",
        message: "No company selected",
        description: "Please select at least one company to perform this action.",
      });
      return;
    }

    setBulkAction(action);
    setBulkConfirmOpen(true);
  };

  const clearSelection = () => {
    setTableState((prev) => ({
      ...prev,
      selected_items: [],
    }));
  };

  const runBulkAction = async () => {
    if (!bulkAction || !selectedIds.length) return;

    try {
      if (bulkAction === "activate") {
        await bulkUpdateCompanyMutation.mutateAsync({
          ids: selectedIds,
          data: { status: "Active", is_active: true },
        });

        notify({
          type: "success",
          message: "Bulk activated",
          description: `${selectedIds.length} companies have been moved to Active.`,
        });
      }

      if (bulkAction === "inactive") {
        await bulkUpdateCompanyMutation.mutateAsync({
          ids: selectedIds,
          data: { status: "Inactive", is_active: true },
        });

        notify({
          type: "success",
          message: "Moved to inactive",
          description: `${selectedIds.length} companies have been moved to Inactive.`,
        });
      }

      if (bulkAction === "delete") {
        await bulkUpdateCompanyMutation.mutateAsync({
          ids: selectedIds,
          data: { is_active: false },
        });

        notify({
          type: "success",
          message: "Bulk deleted",
          description: `${selectedIds.length} companies have been soft deleted successfully.`,
        });
      }

      clearSelection();
      setBulkConfirmOpen(false);
      setBulkAction(null);
      refetch?.();
    } catch (error) {
      notify({
        type: "error",
        message: "Bulk action failed",
        description: "Unable to process bulk action. Please try again.",
      });
    }
  };

  const bulkConfirmTitle =
    bulkAction === "activate"
      ? "Bulk activate companies"
      : bulkAction === "inactive"
        ? "Move companies to inactive"
        : "Bulk delete companies";

  const bulkConfirmMessage =
    bulkAction === "activate"
      ? `Are you sure you want to move ${selectedIds.length} selected companies to Active?`
      : bulkAction === "inactive"
        ? `Are you sure you want to move ${selectedIds.length} selected companies to Inactive?`
        : `Are you sure you want to soft delete ${selectedIds.length} selected companies?`;

  const bulkConfirmButtonLabel =
    bulkAction === "activate"
      ? "ACTIVE"
      : bulkAction === "inactive"
        ? "INACTIVE"
        : "DELETE";

  const customRows = {
    full_name: (_: any, row: IInforCompany & { id: string }) => {
      const fullName = row.full_name?.trim() || "N/A";
      const acronym = row.acronym_name?.trim();

      return (
        <Box minW={0}>
          <Text fontWeight={"600"} noOfLines={1}>
            {" "}
            {fullName}
          </Text>
          {acronym ? (
            <Text fontSize={"xs"} color={"gray.500"} noOfLines={1}></Text>
          ) : null}
        </Box>
      );
    },
    status: (_: any, row: IInforCompany & { id: string }) => {
      const statusText = String(row.status ?? "").trim();
      const derivedStatus = statusText || (row.is_active ? "Active" : "Inactive");
      const isActive = derivedStatus.toLowerCase() === "active";
      const isInactive = derivedStatus.toLowerCase() === "inactive";

      const color = isActive ? "green.700" : isInactive ? "gray.600" : "gray.600";
      const borderColor = isActive ? "green.300" : isInactive ? "gray.300" : "gray.300";
      const bg = isActive ? "green.100" : isInactive ? "gray.100" : "gray.100";

      return (
        <Badge
          borderRadius={"lg"}
          px={3}
          py={1}
          fontSize={"xs"}
          fontWeight={"700"}
          textTransform={"uppercase"}
          color={color}
          borderColor={borderColor}
          bg={bg}
        >
          {derivedStatus}
        </Badge>
      );
    },
  };

  return ( 
    <>
      <VStack align={"stretch"} spacing={4}>
        <Flex align={"center"} gap={4}>
          <ButtonConfig
            onClick={() => {
              setModalMode("add");
              setModalOpen(true);
              setSelectedCompany(undefined);
            }}
          >
            ADD
          </ButtonConfig>

          {hasSelectedItems ? (
            <>
              <ButtonConfig onClick={() => openBulkConfirm("activate")}>
                BULK ACTIVE
              </ButtonConfig>

              <ButtonConfig
                onClick={() => openBulkConfirm("inactive")}
                styles={{ backgroundColor: "#718096" }}
              >
                BULK INACTIVE
              </ButtonConfig>

              <ButtonConfig onClick={() => openBulkConfirm("delete")} danger>
                BULK DELETE
              </ButtonConfig>

              <Text fontSize="sm" color="gray.600">
                Selected: {selectedIds.length}
              </Text>
            </>
          ) : null}

          <Spacer />

          <InputGroup w={{ base: "100%", md: "400px" }}>
            <InputLeftElement pointerEvents={"none"}>
              <SearchIcon></SearchIcon>
            </InputLeftElement>
                <Input
                placeholder="Search by company name, acronym name, ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
          </InputGroup>

          <Flex flexDirection={"column"} mt={-6} w="140px">
            <Text fontSize={"md"} color={"gray.700"}>
              Status
            </Text>
            <SearchCombobox
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={statusOptions}
              placeholder="Select status..."
              size="md"
            />
          </Flex>
        </Flex>
        <Box
          overflowY={"auto"}
          border={'1px solid #E2E8F0"'}
          sx={{
            table: {
              borderCollapse: "separate",
              borderSpacing: 0,
            },
            "& thead": {
              position: "sticky",
              top: 0,
              zIndex: 11,
              bg: "#334371",
              color: "white",
              backgroundClip: "padding-box",
              borderRight: "1px solid white",
            },
            "& thead th:last-child": {
              borderRight: "none",
            },
          }}
        >
<BaseTable
  columns={columns}
  data={mappedItems}
  tableState={tableState}
  onTableStateChange={setTableState}
  customRows={customRows}
  renderRowActions={(row: IInforCompany & { id: string }) => {
    return (
      <HStack spacing={2} justify="center">
        <Tooltip label="View" hasArrow>
          <IconButton
            aria-label="View company"
            icon={<FaEye />}
            size="sm"
            variant="ghost"
            color="gray.600"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/inforcompany/${row.id}`, {
                state: {
                    title: row.full_name ?? row.acronym_name ?? "Detail"
                }
              });
              
            }}
          />
        </Tooltip>

        <Tooltip label="Edit" hasArrow>
          <IconButton
            aria-label="Edit company"
            icon={<FaEdit />}
            size="sm"
            variant="ghost"
            color="blue.600"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCompany(row);
              setModalMode("edit");
              setModalOpen(true);
            }}
          />
        </Tooltip>

        <Tooltip label="Delete" hasArrow>
          <IconButton
          aria-label="Delete company"
          icon={<FaTrash />}
          size="sm"
          variant="ghost"
          color="red.600"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(row);
            setDeleteOpen(true); // ✅ mở confirm
          }}
        />
        </Tooltip>
      </HStack>
    );
  }}
/>        </Box>
        <PaginationBar
          total={pagination.totalItems}
          page={page}
          perPage={limit}
          onPageChange={(p) => setPage(p)}
          onPerPageChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
        ></PaginationBar>
        <ModalConfirm
            open={deleteOpen}
            setOpen={setDeleteOpen}
            title="Delete Company"
            message={`Are you sure you want to delete the company "${deleteTarget?.full_name ?? ""}"? This action cannot be undone.`}
            titleButton="DELETE"
            cancelButtonText="CANCEL"
            confirmButtonProps={{ background: "#8B0000" }}
            onClick={async () => {
              if (!deleteTarget?.id) return;

              try {
                await updateCompanyMutation.mutateAsync({
                  id: deleteTarget.id,
                  data: { is_active: false },
                });

                notify({
                  type: "success",
                  message: "Deleted",
                  description: "The company has been successfully soft deleted.",
                });

                setDeleteOpen(false);
                setDeleteTarget(null);
                clearSelection();
                refetch?.();
              } catch (error) {
                notify({
                  type: "error",
                  message: "Delete failed",
                  description: "Unable to delete company. Please try again.",
                });
              }
            }}
        />

        <ModalConfirm
          open={bulkConfirmOpen}
          setOpen={setBulkConfirmOpen}
          title={bulkConfirmTitle}
          message={bulkConfirmMessage}
          titleButton={bulkConfirmButtonLabel}
          cancelButtonText="CANCEL"
          confirmButtonProps={{ background: bulkAction === "delete" ? "#8B0000" : undefined }}
          onClick={runBulkAction}
        />
        <InformModal
            isOpen={modalOpen}
            onClose={() => {
                setModalOpen(false);
                setSelectedCompany(undefined);
            }}
            mode={modalMode}
            data={selectedCompany}
            onSuccess={() => {
                refetch?.();
            }}
        />
      </VStack>
    </>
  );
}
