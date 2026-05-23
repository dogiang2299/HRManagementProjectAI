import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import type { ICompanyRegistrationRequest } from "../types";
import { useGetCompanyRegister } from "../api/get_comregis";
import { Box, Badge, Text, Flex, HStack, IconButton, Input, InputGroup, InputLeftElement, Spacer, Tooltip, VStack } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FaEdit, FaTrash } from "react-icons/fa";
import CompanyRegisterModal from "../components/CompanyRegisterModal";
import { ButtonConfig } from "../../../../components/common/Button";
import { ModalConfirm } from "../../../../components/common/ModalConfirm";
import { PaginationBar } from "../../../../components/common/PaginationBar";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import {
  COMPANY_REGISTRATION_STATUS_DISPLAY,
  CompanyRegistrationStatus,
} from "../../../../constant";
import { formatDateShort } from "../../../../types";
import BaseTable, { type BaseTableState, DefaultTableState, type HeaderTable } from "../../../../components/common/BaseTable";

export function CompanyRegister() {
    const notify = useNotify();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch] = useDebounce(searchQuery, 1000);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModaMode] = useState<"add" | "edit" | "view">("add");
    const [selectedCompany, setSelectedCompany] = useState<ICompanyRegistrationRequest | undefined>(undefined);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ICompanyRegistrationRequest|null>(null)
    const [tableState] = useState<Partial<BaseTableState>>({
        ...DefaultTableState,
        page_size: 10,
        sort_order: 'desc',
        sort_by: "createdAt"
    })
 
    const sortBy = tableState.sort_by;
    const sortOrder = tableState.sort_order;

    const { data: ICompanyRegisterData, refetch} = useGetCompanyRegister({
        page,
        limit,
        search: debouncedSearch ?? "",
        status: CompanyRegistrationStatus.Pending,
        sortBy,
        sortOrder
    })
    const items = Array.isArray(ICompanyRegisterData?.data)
      ? ICompanyRegisterData.data.filter(
          (item) =>
            String(item.status ?? "").toLowerCase() ===
            CompanyRegistrationStatus.Pending,
        )
      : [];
    const pagination = ICompanyRegisterData?.pagination ?? {
        totalItems: 0,
        currentPage: 1,
        limit: 10,
        totalPages: 1
    }

    useEffect(() => {
        setPage(1);
    }, [searchQuery])

    const columns: HeaderTable[] = [
    { name: "Company", key: "companyName" },
    { name: "Email", key: "email", disableSort: true },
    { name: "Phone", key: "phone", disableSort: true },
    { name: "Status", key: "status" }, // QUAN TRỌNG
    { name: "Pending At", key: "createdAt" },
    ];

    const mappedItems = useMemo(() => {
        let arr = items?.map((i) => ({
            ...i,
        }));
        return arr;
    }, [items]);

      const customRows = {
        companyName: (_: any, row: ICompanyRegistrationRequest & { id: string }) => {
          const fullName = row.companyName?.trim() || "N/A";
    
          return (
            <Box minW={0}>
              <Text fontWeight={"600"} noOfLines={1}>
                {" "}
                {fullName}
              </Text>
            </Box>
          );
        },
        status: (_: any, row: ICompanyRegistrationRequest & { id: string }) => {
          const statusValue = String(row.status ?? "").toLowerCase();
          const isPending = statusValue === CompanyRegistrationStatus.Pending;
          const statusLabel =
            COMPANY_REGISTRATION_STATUS_DISPLAY[
              (statusValue as keyof typeof COMPANY_REGISTRATION_STATUS_DISPLAY) ||
                CompanyRegistrationStatus.Pending
            ] ?? "Pending";

          return (
            <Badge
              borderRadius={"lg"}
              px={3}
              py={1}
              fontSize={"xs"}
              fontWeight={"700"}
              textTransform={"uppercase"}
              color={isPending ? "orange.700" : "gray.600"}
              borderColor={isPending ? "orange.300" : "gray.300"}
              bg={isPending ? "orange.100" : "gray.100"}
            >
              {statusLabel}
            </Badge>
          );
        },
        createdAt: (_: any, row: ICompanyRegistrationRequest & {id: string}) => {
            return formatDateShort(row.createdAt);
        },
        approvedAt: (_: any, row: ICompanyRegistrationRequest & {id: string}) => {
            return formatDateShort(row.approvedAt);
            }
      };
  return ( 
    <>
      <VStack align={"stretch"} spacing={4}>
        <Flex align={"center"} gap={4}>
          <ButtonConfig
            onClick={() => {
              setModaMode("add");
              setModalOpen(true);
              setSelectedCompany(undefined);
            }}
          >
            ADD
          </ButtonConfig>
          <Spacer />

          <InputGroup w={{ base: "100%", md: "400px" }}>
            <InputLeftElement pointerEvents={"none"}>
              <SearchIcon></SearchIcon>
            </InputLeftElement>
                <Input
                placeholder="Search by company name, ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
          </InputGroup>
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
  customRows={customRows}
  renderRowActions={(row: ICompanyRegistrationRequest & { id: string }) => {
    return (
      <HStack spacing={2} justify="center">
        

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
              setModaMode("edit");
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
            message={`Are you sure you want to delete the company "${deleteTarget?.companyName ?? ""}"? This action cannot be undone.`}
            titleButton="DELETE"
            cancelButtonText="CANCEL"
            confirmButtonProps={{background: "#8B0000"}}
            onClick={() => {
                if(!deleteTarget?.id) return;
                notify({
                    type: 'success',
                    message: 'Deleted',
                    description: 'The company has been successfully deleted.'
                })
                setDeleteOpen(false);
                setDeleteTarget(null);
            }}
            
        />
        <CompanyRegisterModal
            isOpen={modalOpen}
            onClose={() => {
                setModalOpen(false);
                setSelectedCompany(undefined);
            }}
            mode={modalMode}
            data={selectedCompany}
            onSuccess={() => { refetch?.()}}
        />
        {/* <InformModal
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
        /> */}
      </VStack>
    </>
  );
}