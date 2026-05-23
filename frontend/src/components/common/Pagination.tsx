import { HStack, IconButton, Button } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const getVisiblePages = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let end = Math.min(totalPages, start + maxPagesToShow - 1);
    if (end - start < maxPagesToShow - 1) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <HStack spacing={2} justify="center" mt={6}>
      <IconButton
        aria-label="Previous page"
        icon={<ChevronLeftIcon />}
        onClick={handlePrev}
        isDisabled={currentPage === 1}
        bg="white"
        _hover={{ bg: "gray.100" }}
      />

      {getVisiblePages().map((page) => (
        <Button
          key={page}
          onClick={() => onPageChange(page)}
          bg={'white'}
          color={page === currentPage ? "#334371" : "black"}
          _hover={{
            bg: page === currentPage ? "white" : "white",
          }}
                    borderColor={'#334371'}
          border={'1px solid'}
          borderRadius="full"
          minW="36px"
        >
          {page}
        </Button>
      ))}

      <IconButton
        aria-label="Next page"
        icon={<ChevronRightIcon />}
        onClick={handleNext}
        isDisabled={currentPage === totalPages}
        bg="white"
        _hover={{ bg: "gray.100" }}
      />
    </HStack>
  );
}
