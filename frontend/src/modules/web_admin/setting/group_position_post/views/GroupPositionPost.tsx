import {
  Box,
  Text,
  Flex,
  VStack,
  Spacer,
  InputGroup,
  InputLeftElement,
  Input,
  HStack,
  Tooltip,
  IconButton,
  Badge,
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
import type { IGroupPositionPost } from "../types";
import { useGetGroupPositionPosts } from "../api/get";
import { useDeleteGroupPositionPost } from "../api/delete";
import GroupPositionPostModal from "../components/GroupPositionPostModal";

export function GroupPositionPost() {
  const notify = useNotify();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 600);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selected, setSelected] = useState<IGroupPositionPost | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IGroupPositionPost | null>(null);

  const [tableState] = useState<Partial<BaseTableState>>({
    ...DefaultTableState,
    page_size: 10,
    sort_order: "desc",
    sort_by: "created_at",
  });

  const { data: groupsRes, refetch } = useGetGroupPositionPosts({
    pages: page,
    items_per_pages: limit,
    search: debouncedSearch,
  });

  const { mutateAsync: deleteGroup, isPending: isDeleting } = useDeleteGroupPositionPost();

  const items = groupsRes?.data ?? [];
  const pagination = groupsRes?.pagination ?? {
    totalItems: 0,
    currentPage: 1,
    limit: 10,
    totalPages: 1,
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const columns: HeaderTable[] = [
    { name: "Group name", key: "name_group" },
    { name: "Slug", key: "slug" },
    { name: "Position count", key: "positions_count", disableSort: true },
    { name: "Description", key: "description", disableSort: true },
  ];

  const mappedItems = useMemo(
    () =>
      items.map((i) => ({
        ...i,
        positions_count: i.positions?.length ?? 0,
      })),
    [items],
  );

  const customRows = {
    name_group: (_: any, row: IGroupPositionPost) => (
      <Text fontWeight="600" noOfLines={1}>
        {row.name_group || "—"}
      </Text>
    ),
    slug: (_: any, row: IGroupPositionPost) => (
      <Text noOfLines={1}>{row.slug || "—"}</Text>
    ),
    positions_count: (_: any, row: IGroupPositionPost) => (
      <Badge borderRadius="lg" px={3} py={1} fontSize="xs" fontWeight="700" color="blue.700" bg="blue.100">
        {(row.positions?.length ?? 0) + " positions"}
      </Badge>
    ),
    description: (_: any, row: IGroupPositionPost) => (
      <Text noOfLines={1}>{row.description || "—"}</Text>
    ),
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteGroup(deleteTarget.id);
      notify({
        type: "success",
        message: "Deleted",
        description: `Position group "${deleteTarget.name_group || ""}" has been removed.`,
      });
    } catch {
      notify({
        type: "error",
        message: "Delete failed",
        description: "Could not delete this position group.",
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
            placeholder="Search by group name or slug..."
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
          renderRowActions={(row: IGroupPositionPost) => (
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
        title="Delete Position Group"
        message={`Are you sure you want to delete "${deleteTarget?.name_group ?? ""}"? This action cannot be undone.`}
        titleButton="DELETE"
        cancelButtonText="CANCEL"
        confirmButtonProps={{ background: "#8B0000", isLoading: isDeleting }}
        onClick={handleDelete}
      />

      <GroupPositionPostModal
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
