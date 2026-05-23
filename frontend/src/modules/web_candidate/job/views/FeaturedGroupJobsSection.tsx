import { Box, Flex, HStack, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useGetJobs } from "../api/getGroupJobs";
import GroupJobCard from "../components/GroupJobCard";
import { useNavigate } from "react-router-dom";
import { candidateJobsByGroupUrl } from "../../../../routes/urls";


const PAGE_SIZE = 8;

const FeaturedGroupJobsSection = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const params = useMemo(
    () => ({
      pages: currentPage,
      limit: PAGE_SIZE,
      status: "active",
    }),
    [currentPage]
  );

  const { data, isLoading, isFetching } = useGetJobs(params);

  const groups = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <Box
      w="full"
      maxW="1200px"
      mx="auto"
      py={{ base: 8, md: 3 }}
      mt={4}
    >
      <Flex
        align={{ base: "start", md: "center" }}
        justify="space-between"
        gap={4}
        mb={{ base: 5, md: 7 }}
        direction={{ base: "column", md: "row" }}
      >
        <VStack align="start" spacing={1}>
          <Text
            fontSize={{ base: "2xl", md: "2xl" }}
            fontWeight="800"
            color="#334371"
            lineHeight="1.2"
            textTransform={'uppercase'}
          >
            Top outstanding fields
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            color="#64748B"
            mt={2}
          >
            Explore areas of interest
          </Text>
        </VStack>

        <HStack spacing={3} display={{ base: "none", md: "flex" }}>
          <Box
            w="44px"
            h="44px"
            borderRadius="full"
            border="1px solid"
            borderColor="#E5E7EB"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color={currentPage <= 1 ? "#CBD5E1" : "#94A3B8"}
            bg="white"
            cursor={currentPage <= 1 ? "not-allowed" : "pointer"}
            onClick={() => {
              if (currentPage > 1) setCurrentPage((prev) => prev - 1);
            }}
          >
            <FiChevronLeft size={20} />
          </Box>

          <Box
            w="44px"
            h="44px"
            borderRadius="full"
            border="1.5px solid"
            borderColor="#334371"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="#334371"
            bg="white"
            cursor={
              pagination && currentPage >= pagination.totalPages
                ? "not-allowed"
                : "pointer"
            }
            onClick={() => {
              if (pagination && currentPage < pagination.totalPages) {
                setCurrentPage((prev) => prev + 1);
              }
            }}
          >
            <FiChevronRight size={20} />
          </Box>
        </HStack>
      </Flex>

      <Box position="relative">
        {(isLoading || isFetching) && (
          <Flex
            position="absolute"
            inset={0}
            zIndex={2}
            align="center"
            justify="center"
            bg="rgba(255,255,255,0.6)"
            borderRadius="24px"
          >
            <Spinner size="lg" color="#334371" />
          </Flex>
        )}

        <SimpleGrid
          columns={{ base: 1, sm: 2, lg: 4 }}
          spacing={{ base: 4, md: 5 }}
        >
          {groups.map((group, index) => (
            <GroupJobCard
              key={group.id ?? `${group.name_group}-${index}`}
              group={group}
              index={index}
              onClick={() => {
                if (!group.id) return;
                navigate(candidateJobsByGroupUrl.replace(":groupId", group.id));
              }}
            />
          ))}
        </SimpleGrid>

        {!isLoading && groups.length === 0 && (
          <Flex
            minH="180px"
            borderRadius="24px"
            border="1px dashed"
            borderColor="#DDE5EC"
            bg="#F8FAFC"
            align="center"
            justify="center"
            mt={2}
          >
            <Text color="#64748B" fontSize="md" fontWeight="500">
              There are currently no industry groups
            </Text>
          </Flex>
        )}
      </Box>

    
    </Box>
  );
};

export default FeaturedGroupJobsSection;