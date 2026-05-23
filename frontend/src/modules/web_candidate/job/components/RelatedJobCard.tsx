import { Box, Flex, HStack, Image, LinkBox, LinkOverlay, Tag, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { formatSalary, type IJobItem } from "../types/job";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";

type RelatedJobCardProps = {
  job: IJobItem;
};

const RelatedJobCard = ({ job }: RelatedJobCardProps) => {
  const title = job.post_title || "Untitled Job";
  const companyName = job.department?.full_name || "Unknown Company";
  const location =
    job.workLocation?.short_address ||
    job.work_location_name ||
    job.workLocation?.full_name ||
    "Updating";
  const salaryText = formatSalary(job.salary_from, job.salary_to, job.salary_currency);
  const companyLogo = resolveCompanyLogoUrl(job.department?.image_logo);

  return (
    <LinkBox
      as={Box}
      bg="white"
      border="1px solid"
      borderColor="#E5E7EB"
      borderRadius="14px"
      p={{ base: 3, md: 3.5 }}
      boxShadow="0 2px 8px rgba(15, 23, 42, 0.03)"
      transition="all 0.2s ease"
      _hover={{
        borderColor: "#334371",
        boxShadow: "0 6px 18px rgba(16, 24, 40, 0.05)",
        transform: "translateY(-1px)",
      }}
    >
      <Flex gap={3} align="stretch">
        <Flex
          w={{ base: "68px", md: "76px" }}
          h={{ base: "68px", md: "76px" }}
          minW={{ base: "68px", md: "76px" }}
          bg="white"
          border="1px solid"
          borderColor="#E5E7EB"
          borderRadius="12px"
          align="center"
          justify="center"
          overflow="hidden"
          p={2}
        >
          <Image
            src={companyLogo}
            alt={companyName}
            objectFit="contain"
            w="78%"
            h="78%"
          />
        </Flex>

        <Flex flex="1" direction="column" minW={0} justify="space-between">
          <Box minW={0}>
            <LinkOverlay as={RouterLink} to={`/it-job/jobs/${job.id}`}>
              <Text
                fontSize="15px"
                fontWeight="700"
                color="#1F2937"
                lineHeight="1.35"
                noOfLines={2}
                _hover={{ color: "#334371" }}
              >
                {title}
              </Text>
            </LinkOverlay>

            <Text mt="2px" color="#6B7280" fontSize="12px" fontWeight="500" textTransform="uppercase" noOfLines={1}>
              {companyName}
            </Text>
          </Box>

          <HStack spacing={2} flexWrap="wrap" mt={2}>
            <Tag
              px={3}
              py={1.5}
              borderRadius="full"
              bg="#F8FAFC"
              color="#334155"
              fontSize="12px"
              fontWeight="600"
              minH="unset"
            >
              <Text noOfLines={1}>{salaryText}</Text>
            </Tag>

            <Tag
              px={3}
              py={1.5}
              borderRadius="full"
              bg="#F8FAFC"
              color="#334155"
              fontSize="12px"
              fontWeight="600"
              minH="unset"
            >
              <Text noOfLines={1}>{location}</Text>
            </Tag>
          </HStack>
        </Flex>
      </Flex>
    </LinkBox>
  );
};

export default RelatedJobCard;
