import { TriangleDownIcon, TriangleUpIcon, UpDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  Icon,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Checkbox,
  Center,
} from '@chakra-ui/react';
import type React from 'react';
import { memo, useCallback, useMemo } from 'react';
import { FiInbox } from 'react-icons/fi';
import LoadingPage from './LoadingPage';
import { theme } from '../../theme';

export type HeaderTable = {
  name: string;
  key: string;
  disableSort?: boolean;
  render?: (row: any) => React.ReactNode;
  headerStyle?: React.CSSProperties;
};

export type BaseTableState = {
  selected_items?: any[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page_index?: number;
  page_size?: number;
};

export const DefaultTableState: BaseTableState = {
  selected_items: [],
  sort_by: '',
  sort_order: 'desc',
  page_index: 0,
  page_size: 10,
};

interface BaseTableProps<T extends object> {
  columns: HeaderTable[];
  data?: T[];
  tableState?: Partial<BaseTableState>;
  onTableStateChange?: (state: BaseTableState) => void;
  renderRowActions?: (row: T) => React.ReactNode;
  hideCheckboxes?: boolean;
  hideSortButton?: boolean;
  count?: number;
  customRows?: { [key: string]: (value: any, rowData: any) => React.ReactNode };
  customStyles?: { [key: string]: React.CSSProperties };
  onToggleImportantItem?: (row: T, isPin: boolean) => void;
  importantItems?: any[];
  maxHBaseTable?: string;
  isLoading?: boolean;
}

type DataRow = { [key: string]: any; id: string };

const BaseTable = <T extends DataRow>({
  columns,
  data = [],
  tableState = DefaultTableState,
  onTableStateChange,
  renderRowActions,
  hideCheckboxes = false,
  hideSortButton = false,
  customRows = {},
  customStyles = {},
  importantItems = [],
  onToggleImportantItem,
  maxHBaseTable,
  isLoading,
}: BaseTableProps<T>) => {
  const { sort_by, sort_order } = tableState;
  const rowHeight = '40px';

  const tableBg = theme.colors.tableBg;
  const headerBg = theme.colors.primary;
  const headerText = theme.colors.white;
  const rowHoverBg = theme.colors.rowHoverBg;
  const textColor = theme.colors.primaryText;
  const tableColorNoData = theme.colors.tableColorNoData;
  const borderColor = theme.colors.colorBorder;
  const stickyHeaderProps = {
    position: 'sticky' as const,
    top: 0,
    zIndex: 2,
    bg: headerBg,
  };

  const updateTableState = useCallback(
    (newState: BaseTableState) => onTableStateChange?.(newState),
    [onTableStateChange],
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      let newSortOrder: 'asc' | 'desc' = 'asc';

      if (sort_by === columnKey) {
        newSortOrder = sort_order === 'asc' ? 'desc' : 'asc';
      }

      updateTableState({ ...tableState, sort_by: columnKey, sort_order: newSortOrder });
    },
    [sort_by, sort_order, tableState, updateTableState],
  );

  const selectedIds = tableState.selected_items?.map((item: any) => item.id) || [];
  const allSelected = data.length > 0 && selectedIds.length === data.length;

  const handleSelectAll = (checked: boolean) => {
    const newSelected = checked ? [...data] : [];
    updateTableState({ ...tableState, selected_items: newSelected });
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    let newSelected = [...selectedIds];
    if (checked) {
      if (!newSelected.includes(row.id)) newSelected.push(row.id);
    } else {
      newSelected = newSelected.filter((id) => id !== row.id);
    }
    const selectedItems = data.filter((row) => newSelected.includes(row.id));
    updateTableState({ ...tableState, selected_items: selectedItems });
  };

  const renderHeaders = useMemo(
    () => (
      <Tr bg={headerBg} borderBottom={`1px solid ${borderColor}`}>
        {!hideCheckboxes && (
          <Th
            {...stickyHeaderProps}
            textAlign="center"
            color={headerText}
            fontWeight="bold"
            height={rowHeight}
            lineHeight={rowHeight}
            borderRight={`1px solid ${headerText}`}
            textTransform="none"
          >
            <Center h="100%">
              <Checkbox
                isChecked={allSelected}
                isIndeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                colorScheme={headerBg}
                alignItems="center"
                padding={0}
              />
            </Center>
          </Th>
        )}
        {columns.map((column, index) => {
          const isLastColumn = index === columns.length - 1 && !renderRowActions;
          return (
            <Th
              {...stickyHeaderProps}
              key={column.key}
              style={column.headerStyle}
              textAlign="center"
              fontSize={14}
              fontWeight="bold"
              color={headerText}
              height={rowHeight}
              lineHeight={rowHeight}
              borderRight={isLastColumn ? undefined : `1px solid ${headerText}`}
              textTransform="none"
              cursor={!hideSortButton && !column.disableSort ? 'pointer' : 'default'}
              userSelect="none"
              onClick={
                !hideSortButton && !column.disableSort ? () => handleSort(column.key) : undefined
              }
            >
              {column.name}
              {!column.disableSort && !hideSortButton && (
                <>
                  {sort_by === column.key ? (
                    sort_order === 'asc' ? (
                      <TriangleUpIcon ml={1} />
                    ) : sort_order === 'desc' ? (
                      <TriangleDownIcon ml={1} />
                    ) : (
                      <UpDownIcon ml={1} />
                    )
                  ) : (
                    <UpDownIcon ml={2} />
                  )}
                </>
              )}
            </Th>
          );
        })}
        {renderRowActions && (
          <Th
            {...stickyHeaderProps}
            textAlign="center"
            color={headerText}
            fontSize={14}
            fontWeight="bold"
            height={rowHeight}
            lineHeight={rowHeight}
            textTransform="none"
          >
            Actions
          </Th>
        )}
      </Tr>
    ),
    [
      columns,
      sort_by,
      sort_order,
      hideSortButton,
      importantItems,
      onToggleImportantItem,
      renderRowActions,
      handleSort,
    ],
  );

  const emptyState = useMemo(
    () => (
      <Tr>
        <Td
          bg={tableColorNoData}
          colSpan={columns.length + (!hideCheckboxes ? 1 : 0) + (renderRowActions ? 1 : 0)}
          textAlign="center"
        >
          <Flex direction="column" align="center" justify="center" py={10}>
            <Icon as={FiInbox} boxSize={12} color={textColor} />
            <Text color={textColor} fontSize="lg" mt={2}>
              No data
            </Text>
          </Flex>
        </Td>
      </Tr>
    ),
    [columns.length, hideCheckboxes, renderRowActions, tableColorNoData, textColor],
  );

  const TableRow = memo(({ row, rowIndex }: { row: T; rowIndex: number }) => {
    const isLastRow = rowIndex === data.length - 1;

    return (
      <Tr key={row.id} _hover={{ bg: rowHoverBg }} bg={tableBg}>
        {!hideCheckboxes && (
          <Td
            width={10}
            p={3}
            textAlign="center"
            borderRight={`1px solid ${borderColor}`}
            borderBottom={isLastRow ? undefined : `1px solid ${borderColor}`}
            height={rowHeight}
          >
            <Checkbox
              isChecked={selectedIds.includes(row.id)}
              onChange={(e) => handleSelectRow(row, e.target.checked)}
            />
          </Td>
        )}

        {columns.map((column, colIndex) => {
          const isLastColumn = colIndex === columns.length - 1 && !renderRowActions;
          return (
            <Td
              key={column.key}
              style={customStyles[column.key]}
              color={textColor}
              textAlign="center"
              borderRight={isLastColumn ? undefined : `1px solid ${borderColor}`}
              borderBottom={isLastRow ? undefined : `1px solid ${borderColor}`}
              height={rowHeight}
            >
              {customRows[column.key]
                ? customRows[column.key](row[column.key], row)
                : row[column.key]}
            </Td>
          );
        })}

        {renderRowActions && (
          <Td
            textAlign="center"
            height={rowHeight}
            borderBottom={isLastRow ? undefined : `1px solid ${borderColor}`}
          >
            {renderRowActions(row)}
          </Td>
        )}
      </Tr>
    );
  });
  TableRow.displayName = 'TableRow';

  return (
    <Box
      maxH={maxHBaseTable ?? '450px'}
      overflow="auto"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xs"
    >
      {isLoading ? (
        <LoadingPage loadChildren />
      ) : (
        <Table variant="simple" size="sm" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <Thead>{renderHeaders}</Thead>
          <Tbody>
            {data.length > 0
              ? data.map((row, rowIndex) => <TableRow key={row.id} rowIndex={rowIndex} row={row} />)
              : emptyState}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default memo(BaseTable) as typeof BaseTable;
