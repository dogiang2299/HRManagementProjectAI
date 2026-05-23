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
  Select,
  HStack,
  Tooltip,
  IconButton,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { SearchIcon } from "@chakra-ui/icons";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import BaseTable, {
  DefaultTableState,
  type BaseTableState,
  type HeaderTable,
} from "../../../../components/common/BaseTable";
import { PaginationBar } from "../../../../components/common/PaginationBar";
import { ModalConfirm } from "../../../../components/common/ModalConfirm";
import { ButtonConfig } from "../../../../components/common/Button";
import { useNotify } from "../../../../components/notification/NotifyProvider";

import type { IEmployee } from "../types";
import {
  EmployeeStatus,
  EMPLOYEE_STATUS_DISPLAY,
  type EmployeeStatusType,
} from "../../../../constant";

import { useGetEmployee } from "../api/get_employee";
import { useUpdateEmployee } from "../api/update_employee";
import { useDeleteEmployee } from "../api/delete_employee";

import EmployeeModal from "../components/EmployeeModal";

type BulkActionType = "activate" | "inactive" | "delete";

export function Employees() {
  const notify = useNotify();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 1000);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"All" | EmployeeStatusType>(
    "All",
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | undefined>(
    undefined,
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IEmployee | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkActionType | null>(null);

  const [tableState, setTableState] = useState<Partial<BaseTableState>>({
    ...DefaultTableState,
    page_size: 10,
    sort_order: "desc",
    sort_by: "created_at",
  });

  const sortBy = tableState.sort_by;
  const sortOrder = tableState.sort_order;

  const { data: employeeResp, refetch } = useGetEmployee({
    page,
    limit,
    search: debouncedSearch ?? "",
    status: statusFilter === "All" ? undefined : statusFilter,
    sortBy,
    sortOrder,
  });

  const selectedItems = (tableState.selected_items ?? []) as IEmployee[];
  const selectedIds = selectedItems.map((employee) => employee.id).filter(Boolean);
  const hasSelectedItems = selectedIds.length > 0;

  const { mutateAsync: updateEmployeeMutation, isPending: isUpdating } = useUpdateEmployee();
  const { mutateAsync: deleteEmployeeMutation, isPending: isDeletingBulk } = useDeleteEmployee();

  const items = Array.isArray(employeeResp?.data) ? employeeResp.data : [];
  const pagination = employeeResp?.pagination ?? {
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

  const columns: HeaderTable[] = [
    { name: "Code", key: "emp_code" },
    { name: "Employee", key: "employee_name" },
    { name: "Phone", key: "phone_account", disableSort: true },
    { name: "Email", key: "email_account", disableSort: true },
    { name: "Status", key: "status" },
  ];

  const mappedItems = useMemo(() => {
    return items?.map((i) => ({ ...i })) ?? [];
  }, [items]);

  const openBulkConfirm = (action: BulkActionType) => {
    if (!hasSelectedItems) {
      notify({
        type: "warning",
        message: "No employee selected",
        description: "Please select at least one employee to perform this action.",
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
        await Promise.all(
          selectedIds.map((id) =>
            updateEmployeeMutation({ id, data: { status: EmployeeStatus.Active, is_active: true } }),
          ),
        );
      }

      if (bulkAction === "inactive") {
        await Promise.all(
          selectedIds.map((id) =>
            updateEmployeeMutation({ id, data: { status: EmployeeStatus.Inactive, is_active: false } }),
          ),
        );
      }

      if (bulkAction === "delete") {
        await Promise.all(selectedIds.map((id) => deleteEmployeeMutation(id)));
      }

      notify({
        type: "success",
        message: "Bulk action completed",
        description: `${selectedIds.length} employee(s) have been updated successfully.`,
      });
      clearSelection();
      setBulkConfirmOpen(false);
      setBulkAction(null);
      refetch?.();
    } catch {
      notify({
        type: "error",
        message: "Bulk action failed",
        description: "Unable to process employee bulk action. Please try again.",
      });
    }
  };

  const bulkConfirmTitle =
    bulkAction === "activate"
      ? "Bulk activate employees"
      : bulkAction === "inactive"
        ? "Move employees to inactive"
        : "Bulk delete employees";

  const bulkConfirmMessage =
    bulkAction === "activate"
      ? `Are you sure you want to move ${selectedIds.length} selected employees to Active?`
      : bulkAction === "inactive"
        ? `Are you sure you want to move ${selectedIds.length} selected employees to Inactive?`
        : `Are you sure you want to delete ${selectedIds.length} selected employees?`;

  const bulkConfirmButtonLabel =
    bulkAction === "activate"
      ? "ACTIVE"
      : bulkAction === "inactive"
        ? "INACTIVE"
        : "DELETE";

  const customRows = {
    employee_name: (_: any, row: IEmployee & { id: string }) => {
      const name = row.employee_name?.trim() || "N/A";
      const sub = [row.job_title, row.position, row.work_unit]
        .filter(Boolean)
        .join(" • ");

      return (
        <Box minW={0}>
          <Text fontWeight="600" noOfLines={1}>
            {name}
          </Text>
          {sub ? (
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </Box>
      );
    },

    status: (_: any, row: IEmployee & { id: string }) => {
      const active = row.status === EmployeeStatus.Active;
      return (
        <Badge
          borderRadius="lg"
          px={3}
          py={1}
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
          color={active ? "green.700" : "gray.600"}
          borderColor={active ? "green.300" : "gray.300"}
          bg={active ? "green.100" : "gray.100"}
        >
          {EMPLOYEE_STATUS_DISPLAY[row.status as EmployeeStatusType] ??
            row.status ??
            "N/A"}
        </Badge>
      );
    },
  };

  return (
    <>
      <VStack align="stretch" spacing={4}>
        <Flex align="center" gap={4}>
          <ButtonConfig
            onClick={() => {
              setModalMode("add");
              setModalOpen(true);
              setSelectedEmployee(undefined);
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
            <InputLeftElement pointerEvents="none">
              <SearchIcon />
            </InputLeftElement>
            <Input
              placeholder="Search by employee name, email, phone, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Flex flexDirection="column" mt={-6}>
            <Text fontSize="md" color="gray.700">
              Status
            </Text>
            <Select
              w="100px"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="All">All</option>
              {Object.values(EmployeeStatus).map((v) => (
                <option key={v} value={v}>
                  {EMPLOYEE_STATUS_DISPLAY[v as EmployeeStatusType]}
                </option>
              ))}
            </Select>
          </Flex>
        </Flex>

        <Box
          overflowY="auto"
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
            renderRowActions={(row: IEmployee & { id: string }) => {
              return (
                <HStack spacing={2} justify="center">
                  <Tooltip label="View" hasArrow>
                    <IconButton
                      aria-label="View employee"
                      icon={<FaEye />}
                      size="sm"
                      variant="ghost"
                      color="gray.600"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/employee/${row.id}`, {
                          state: {
                            title: row.employee_name ?? "Employee detail",
                          },
                        });
                      }}
                    />
                  </Tooltip>

                  <Tooltip label="Edit" hasArrow>
                    <IconButton
                      aria-label="Edit employee"
                      icon={<FaEdit />}
                      size="sm"
                      variant="ghost"
                      color="blue.600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployee(row);
                        setModalMode("edit");
                        setModalOpen(true);
                      }}
                    />
                  </Tooltip>

                  <Tooltip label="Delete" hasArrow>
                    <IconButton
                      aria-label="Delete employee"
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
              );
            }}
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
          title="Delete Employee"
          message={`Are you sure you want to delete the employee "${deleteTarget?.employee_name ?? ""}"? This action cannot be undone.`}
          titleButton="DELETE"
          cancelButtonText="CANCEL"
          confirmButtonProps={{ background: "#8B0000", isLoading: isDeletingBulk }}
          onClick={async () => {
            if (!deleteTarget?.id) return;

            try {
              await deleteEmployeeMutation(deleteTarget.id);
              notify({
                type: "success",
                message: "Deleted",
                description: "The employee has been successfully deleted.",
              });

              setDeleteOpen(false);
              setDeleteTarget(null);
              refetch?.();
            } catch {
              notify({
                type: "error",
                message: "Delete failed",
                description: "Unable to delete employee. Please try again.",
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
          confirmButtonProps={{ background: bulkAction === "delete" ? "#8B0000" : undefined, isLoading: isUpdating || isDeletingBulk }}
          onClick={runBulkAction}
        />

        <EmployeeModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedEmployee(undefined);
          }}
          mode={modalMode}
          data={selectedEmployee}
          onSuccess={() => {
            refetch?.();
          }}
        />
      </VStack>
    </>
  );
}