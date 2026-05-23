import React, { useState, useEffect } from 'react';
import { Flex, IconButton, Select, Text, Input, Button, Tooltip } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useNotify } from '../notification/NotifyProvider';
interface Props {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
}

export const PaginationBar: React.FC<Props> = ({
  total,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const [goPageValue, setGoPageValue] = useState('');
  const notify = useNotify();

  useEffect(() => {
    setGoPageValue('');
  }, [page]);

  const handleGoToPage = () => {
    if (!goPageValue) return;

    const pageNumber = Number(goPageValue);

    if (pageNumber < 1 || pageNumber > totalPages) {
      notify({
        message: `Please enter a page number between 1 and ${totalPages}`,
        type: 'warning',
      });

      return;
    }

    onPageChange(pageNumber);
    setGoPageValue('');
  };

  return (
    <Flex align="center" justify="flex-end" mt={8} w="100%">
      <Text fontSize="sm" color="gray.600" mr={4}>
        Total Items: {total}
      </Text>

      <Flex align="center" gap={3}>
        <IconButton
          aria-label="prev"
          icon={<ChevronLeftIcon />}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          isDisabled={page <= 1}
          size="sm"
          variant="outline"
          borderRadius="md"
          borderColor="gray.300"
          bg="white"
          _hover={{ bg: 'gray.100' }}
          _disabled={{ opacity: 0.4, cursor: 'not-allowed', bg: 'gray.50' }}
        />

        <Button
          size="sm"
          borderRadius="md"
          fontWeight="semibold"
          border="none"
          bg="#334371"
          color="white"
          _hover={{ bg: '#233055' }}
          cursor="default"
        >
          {page}
        </Button>

        <IconButton
          aria-label="next"
          icon={<ChevronRightIcon />}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          isDisabled={page >= totalPages}
          size="sm"
          variant="outline"
          borderRadius="md"
          borderColor="gray.300"
          bg="white"
          _hover={{ bg: 'gray.100' }}
          _disabled={{ opacity: 0.4, cursor: 'not-allowed', bg: 'gray.50' }}
        />

        <Select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          w="110px"
          size="sm"
          borderColor="gray.300"
          borderRadius="md"
          _focus={{ borderColor: '#334371', boxShadow: '0 0 0 1px #334371' }}
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
        </Select>

        <Text fontSize="sm" ml={2}>
          Go to
        </Text>

        <Tooltip label={`Max page: ${totalPages}`} hasArrow placement="top">
          <Input
            placeholder="Page"
            size="sm"
            w="60px"
            borderColor="gray.300"
            borderRadius="md"
            _focus={{ borderColor: '#334371', boxShadow: '0 0 0 1px #334371' }}
            value={goPageValue}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setGoPageValue(val);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleGoToPage();
              }
            }}
          />
        </Tooltip>
        <Flex fontSize="sm" ml={2}>
          Total pages:{' '}
          <Text ml={2} fontWeight="bold">
            {totalPages}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
