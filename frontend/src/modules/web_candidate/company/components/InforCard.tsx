import { LinkBox, Box, Flex, Image, Text, LinkOverlay, HStack, Button, Icon } from "@chakra-ui/react";
import { FiBriefcase } from "react-icons/fi";
import type { ICompanyInfoCard } from "../type";
import { Link as RouterLink } from "react-router-dom";
import theme from "../../../../theme";
import { useGetJobs } from "../../job/api/getJobs";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";
type CompanyProps = {
    company: ICompanyInfoCard;
};

const CompanyCard = ({ company }: CompanyProps) => {
    const title = company.full_name || "N/A";
    const companyLogo = resolveCompanyLogoUrl(company.image_logo);
    const fieldOfActivity = company.field_of_activity_group?.name_group || company.field_of_activity || "N/A";
    const { data: jobsRes, isLoading: isJobsLoading } = useGetJobs(
      {
        pages: 1,
        limit: 1,
        search: "",
        status: "PUBLIC",
        department_id: company.id,
      },
      {
        enabled: Boolean(company.id),
      },
    );

    const totalJobs = jobsRes?.pagination.totalItems ?? 0;

    return (
            <LinkBox
      as={Box}
      bg="white"
      borderRadius="20px"
      border="1px solid"
      borderColor="#EAEAEA"
      boxShadow="0 2px 10px rgba(15, 23, 42, 0.04)"
      p="12px"
      transition="all 0.2s ease"
      _hover={{
        transform: "translateY(-1px)",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
      }}
      minW="300px"
      h="120px"
    >
      <Flex gap="12px" align="center" h="100%">
        {/* Logo */}
        <Box
          w="70px"
          h="70px"
          minW="70px"
          border="1px solid"
          borderColor="#D9E2EC"
          borderRadius="12px"
          bg="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
          mt="2px"
          flexShrink={0}
        >
          <Image
            src={companyLogo}
            alt={title}
            objectFit="contain"
            w="82%"
            h="82%"
          />
        </Box>

        {/* Right content */}
        <Flex flex="1" direction="column" justify="space-between" minW={0}>
          {/* Top */}
          <Box minW={0}>
            <LinkOverlay as={RouterLink} to={`/it-job/inforcompany/${company.id}`}>
              <Text
                fontSize="md"
                fontWeight="700"
                color="#25364A"
                lineHeight="1.35"
                noOfLines={2}
                textTransform={'uppercase'}
                _hover={{ color: "#2B6CB0" }}
              >
                {title}
              </Text>
            </LinkOverlay>

            <Text
              mt="5px"
              fontSize="sm"
              fontWeight="600"
              color="#7B8794"
              
              noOfLines={1}
            >
              {fieldOfActivity}
            </Text>
          </Box>

          {/* Bottom */}
          <Flex justify="space-between" align="center" gap="10px">
            <HStack spacing="8px" flexWrap="wrap" minW={0}>
              <Icon as={FiBriefcase} boxSize={4} color="#314155" />
              <Text color="#314155" fontSize="sm" fontWeight="700" noOfLines={1}>
                {isJobsLoading ? "..." : totalJobs} jobs
              </Text>
            </HStack>

             <Button

                h={{ base: "40px", md: "35px" }}
                minW={{ base: "100px", md: "90px" }}
                borderRadius="full"
                bg={theme.colors.candidate.primary}
                color="#FFFFFF"
                fontWeight="700"
                fontSize={{ base: "sm", md: "md" }}
                _hover={{ bg: "#334371" }}
              >
                Follow
              </Button>
          </Flex>
        </Flex>
      </Flex>
    </LinkBox>

    )
}

export default CompanyCard;