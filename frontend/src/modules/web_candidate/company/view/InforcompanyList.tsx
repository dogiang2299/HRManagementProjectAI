import { useMemo, useState } from "react";
import { useGetCompanyCandidate } from "../api/getCompany";
import type { ICompanyInfoCard } from "../type";
import { theme } from "../../../../theme";
import { SimpleGrid } from "@chakra-ui/react/grid";
import CompanyCard from "../components/InforCard";

import { Box, Flex, Image, Text, Icon, VStack, IconButton } from "@chakra-ui/react";
import { FiBriefcase, FiInbox, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useGetJobs as useGetGroupJobs } from "../../job/api/getGroupJobs";
import { useGetJobs as useGetRecruitmentJobs } from "../../job/api/getJobs";
import type { IGroupJob } from "../../job/types/job";
import type { HorizontalTagItem } from "../../../../components/common/HorizontalTagScroller";
import HorizontalTagScroller from "../../../../components/common/HorizontalTagScroller";
import CompanyFollowButton from "../components/CompanyFollowButton";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";

export default function InformComList() {
  const [currentPage, setCurrentPage] = useState(1);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev <= 1 ? totalPages : prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev >= totalPages ? 1 : prev + 1));
  };

  const { data, isLoading, error } = useGetCompanyCandidate({
    pages: currentPage,
    limit: 9,
    search: "",
  });

  const totalPages = data?.pagination?.totalPages || 1;
  const [activeGroupId, setActiveGroupId] = useState<number | string>("all");

  const {
    data: dataGroup,
    isLoading: isLoadingGroup,
    error: errorGroup,
  } = useGetGroupJobs({
    pages: 1,
    limit: 10,
    search: "",
    status: "active",
  });

  const company: ICompanyInfoCard[] = data?.data || [];

  const filteredCompanies = useMemo(() => {
    if (activeGroupId === "all") return company;

    const selectedGroupId = String(activeGroupId);

    return company.filter((item) => {
      const companyGroupId =
        item.field_of_activity_group?.id ?? item.field_of_activity_id ?? "";

      return String(companyGroupId) === selectedGroupId;
    });
  }, [activeGroupId, company]);

  const featuredCompany = filteredCompanies[0] ?? null;
  const companyList = filteredCompanies.slice(1);
  const hasCompanyList = companyList.length > 0;
  const featuredCompanyId = featuredCompany?.id;

  const { data: featuredJobsRes, isLoading: isFeaturedJobsLoading } =
    useGetRecruitmentJobs(
      {
        pages: 1,
        limit: 1,
        search: "",
        status: "PUBLIC",
        department_id: featuredCompanyId,
      },
      {
        enabled: Boolean(featuredCompanyId),
      }
    );

  const groupJobs: IGroupJob[] = dataGroup?.data || [];

  if (isLoading) return null;
  if (error) return <div>Error loading company</div>;
  if (isLoadingGroup) return null;
  if (errorGroup) return <div>Error loading group jobs</div>;

  const featuredJobCount = featuredJobsRes?.pagination.totalItems ?? 0;
  const textColor = theme.colors.primaryText;
  const brandLogos = company
    .map((item) => resolveCompanyLogoUrl(item.image_logo))
    .filter((src): src is string => Boolean(src));

  const groupItems: HorizontalTagItem[] = groupJobs.map((group, index) => ({
    id: group.id ?? `group-${index}`,
    label: group.name_group ?? "Not classified",
  }));

  return (
    <Box
      mt={3}
      borderRadius="20px"
      overflow="hidden"
      bg="white"
      boxShadow="0 12px 28px rgba(15, 23, 42, 0.08)"
      border="1px solid"
      borderColor="rgba(226, 232, 240, 0.9)"
    >
      {company.length > 0 ? (
        <>
          <Box
            position="relative"
            h={{ base: "110px", md: "140px", lg: "150px" }}
                minH={{ base: "420px", md: "520px", lg: "unset" }}
            bg="linear-gradient(90deg, #1B2544 0%, #243156 42%, #2E3D68 100%)"
          >
            {/* glow total */}
            <Box
              position="absolute"
              inset={0}
              zIndex={0}
              pointerEvents="none"
              bg="
                radial-gradient(circle at 14% 35%, rgba(125, 151, 221, 0.16), transparent 22%),
                radial-gradient(circle at 86% 24%, rgba(150, 176, 236, 0.12), transparent 18%),
                radial-gradient(circle at 56% 100%, rgba(58, 78, 131, 0.18), transparent 30%)
              "
            />

            <Flex h="100%" position="relative">
              {/* Left content */}
              <Box
                flex={{ base: 1.2, lg: 1 }}
                px={{ base: 5, md: 8, lg: 12 }}
                py={{ base: 5, md: 7, lg: 7 }}
                position="relative"
                zIndex={2}
                display="flex"
                alignItems="center"
              >
                <Box maxW="560px">
                  <Text
                    color="#F8FAFC"
                    fontWeight="800"
                    fontSize={{ base: "16px", md: "19px", lg: "26px" }}
                    lineHeight={{ base: "1.2", md: "1.15" }}
                    letterSpacing="-0.4px"
                  >
                    Representative major brands
                  </Text>

                  <Text
                    mt={{ base: 1.5, md: 2.5, lg: 3 }}
                    color="#E6ECF8"
                    fontWeight="500"
                    fontSize={{ base: "12px", md: "14px", lg: "15px" }}
                    lineHeight="1.5"
                    maxW="540px"
                  >
                    Hundreds of major brands are currently recruiting on ITJob
                  </Text>
                </Box>
              </Box>

              {/* Divider glow */}
              <Box
                display={{ base: "none", md: "block" }}
                position="absolute"
                top={0}
                left={{ md: "46%", lg: "49.5%" }}
                h="100%"
                w={{ md: "8px", lg: "10px" }}
                zIndex={3}
                pointerEvents="none"
              >
                {/* glow outside */}
                <Box
                  position="absolute"
                  inset={0}
                  clipPath="polygon(45% 0%, 100% 0%, 100% 54%, 68% 64%, 68% 100%, 0% 100%, 0% 60%, 45% 50%)"
                  bg="linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(180,200,245,0.14) 55%, rgba(140,165,225,0.12) 100%)"
                  filter="blur(16px)"
                  transform="scaleX(1.09)"
                  opacity={1}
                  pointerEvents="none"
                />

                {/* sample photo style outer border */}
                <Box
                  position="absolute"
                  inset={0}
                  clipPath="polygon(45% 0%, 100% 0%, 100% 54%, 68% 64%, 68% 100%, 0% 100%, 0% 60%, 45% 50%)"
                  bg="linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(245,248,255,0.68) 35%, rgba(225,234,250,0.55) 70%, rgba(205,220,245,0.42) 100%)"
                  filter="blur(2px)"
                  transform="scaleX(1.09)"
                  opacity={0.9}
                  pointerEvents="none"
                />

                {/* main border keeps old color */}
                <Box
                  position="absolute"
                  inset={0}
                  clipPath="polygon(45% 0%, 100% 0%, 100% 54%, 68% 64%, 68% 100%, 0% 100%, 0% 60%, 45% 50%)"
                  bg="linear-gradient(180deg, #F8FBFF 0%, #DCE6FA 52%, #AFC2EC 100%)"
                  boxShadow="
    0 0 6px rgba(255,255,255,0.55),
    0 0 12px rgba(180,200,245,0.32),
    0 0 20px rgba(120,145,210,0.16)
  "
                  opacity={0.96}
                  pointerEvents="none"
                />

                {/* thin core line for sharper definition */}
                <Box
                  position="absolute"
                  inset="1px"
                  clipPath="polygon(45% 0%, 100% 0%, 100% 54%, 68% 64%, 68% 100%, 0% 100%, 0% 60%, 45% 50%)"
                  bg="linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,251,255,0.7) 45%, rgba(220,230,248,0.22) 100%)"
                  opacity={0.65}
                  pointerEvents="none"
                />
              </Box>
              {/* Right content */}
              <Box
                flex={{ base: 1, lg: 1.2 }}
                position="relative"
                display={{ base: "none", md: "block" }}
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  inset={0}
                  bg="radial-gradient(circle at center, rgba(87,110,173,0.16) 0%, rgba(28,38,68,0.58) 55%, rgba(16,25,51,0.74) 100%)"
                  zIndex={1}
                />

                <SimpleGrid
                  columns={5}
                  spacing={4}
                  position="absolute"
                  top="-70px"
                  right="-10px"
                  left="48px"
                  transform="rotate(-24deg) scale(1.05)"
                  zIndex={0}
                >
                  {brandLogos.concat(brandLogos).map((src, index) => (
                    <Flex
                      key={`${src}-${index}`}
                      gap={2}
                      borderRadius="22px"
                      align="center"
                      justify="center"
                      // boxShadow="0 10px 24px rgba(0,0,0,0.18)"
                      // border="1px solid rgba(226, 232, 240, 0.8)"
                    >
                      <Image
                        borderRadius={10}
                        src={src}
                        alt={`brand-${index}`}
                        maxH="100px"
                        maxW="100%"
                        objectFit="contain"
                      />
                    </Flex>
                  ))}
                </SimpleGrid>
              </Box>
            </Flex>

            {/* light texture */}
            <Box
              position="absolute"
              inset={0}
              opacity={0.08}
              bg="repeating-linear-gradient(
                180deg,
                rgba(255,255,255,0.12) 0px,
                rgba(255,255,255,0.12) 2px,
                transparent 2px,
                transparent 8px
              )"
              pointerEvents="none"
            />

            {/* Badge */}
            <Flex
              position="absolute"
              left={{ base: "50%", md: "52%", lg: "65%" }}
              top={{ base: "74%", md: "58%", lg: "50%" }}
              transform="translate(-50%, -50%)"
              zIndex={5}
              px={{ base: 3, md: 4, lg: 6 }}
              h={{ base: "38px", md: "42px", lg: "38px" }}
              borderRadius="full"
              align="center"
              justify="center"
              bg="linear-gradient(180deg, #5A73B2 0%, #334371 100%)"
              color="#F8FAFC"
              fontWeight="800"
              fontSize={{ base: "13px", md: "14px", lg: "15px" }}
              boxShadow="
    0 10px 20px rgba(36, 49, 86, 0.22),
    0 1px 0 rgba(255,255,255,0.08) inset
  "
              border="1px solid rgba(230, 236, 248, 0.34)"
              whiteSpace="nowrap"
            >
              Pro Company
            </Flex>
          </Box>

          <HorizontalTagScroller
            items={groupItems}
            activeId={activeGroupId}
            onChange={setActiveGroupId}
            allLabel="All"
          />

          <Box
            px={{ base: 2, md: 3, lg: 5 }}
            py={{ base: 2, md: 3, lg: 4 }}
            mb={4}
            bg="white"
            borderRadius="24px"
            position="relative"
            overflow="visible"
          >
            {filteredCompanies.length > 0 ? (
              <SimpleGrid
                columns={{ base: 1, lg: hasCompanyList ? 2 : 1 }}
                spacing={{ base: 4, md: 5, lg: 6 }}
                minChildWidth={0}
                templateColumns={{ base: "1fr", lg: hasCompanyList ? "30% 70%" : "1fr" }}
                alignItems="stretch"
                justifyItems={{ base: "stretch", lg: hasCompanyList ? "stretch" : "center" }}
              >
                {/* Left banner */}
                <Box
                  position="relative"
                  borderRadius="24px"
                  overflow="hidden"
                  minH={{ base: "420px", md: "480px", lg: "unset" }}
                  h="100%"
                  w={{ base: "100%", lg: hasCompanyList ? "100%" : "min(100%, 680px)" }}
                  bgImage="url('/companyhi.png')"
                  bgSize="cover"
                  bgPosition="center"
                  bgRepeat="no-repeat"
                >
                  <Box
                    position="absolute"
                    inset={0}
                    bg="linear-gradient(180deg, rgba(27,37,68,0.22) 0%, rgba(27,37,68,0.52) 50%, rgba(16,25,51,0.78) 100%)"
                    zIndex={1}
                  />

                  <Flex
                    position="relative"
                    zIndex={2}
                    h="100%"
                    direction="column"
                    align="center"
                    justify="center"
                    textAlign="center"
                    px={{ base: 5, md: 8 }}
                    py={{ base: 8, md: 10 }}
                  >
                    {/* Logo */}
                    <Box
                      w={{ base: "56px", md: "76px", lg: "96px" }}
                      h={{ base: "56px", md: "76px", lg: "96px" }}
                      bg="white"
                      borderRadius="2xl"
                      overflow="hidden"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 12px 30px rgba(0,0,0,0.16)"
                      mb={6}
                      border="1px solid rgba(226, 232, 240, 0.9)"
                    >
                      <Image
                        src={resolveCompanyLogoUrl(featuredCompany?.image_logo)}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                    </Box>

                    {/* Company name */}
                    <Text
                      color="white"
                      fontWeight="800"
                      fontSize={{ base: "20px", md: "23px", lg: "22px" }}
                      lineHeight="1.2"
                      mb={2.5}
                      maxW="95%"
                    >
                      {featuredCompany?.full_name || "Company name"}
                    </Text>

                    {/* Field */}
                    <Text
                      color="#E6ECF8"
                      fontWeight="500"
                      fontSize={{ base: "14px", md: "16px", lg: "15px" }}
                      mb={4.5}
                    >
                      {featuredCompany?.field_of_activity_group?.name_group ||
                        featuredCompany?.field_of_activity ||
                        "The field has not been updated"}
                    </Text>

                    {/* Job count */}
                    <Flex
                      align="center"
                      justify="center"
                      gap={2}
                      px={6}
                      py={4.5}
                      h={{ base: "34px", md: "38px" }}
                      borderRadius="full"
                      bg="rgba(27, 37, 68, 0.42)"
                      backdropFilter="blur(8px)"
                      color="white"
                      mb={4.6}
                      border="1px solid rgba(230,236,248,0.14)"
                    >
                      <Icon as={FiBriefcase} boxSize={4} />
                      <Text
                        fontWeight="600"
                        fontSize={{ base: "13px", md: "14px" }}
                      >
                        {isFeaturedJobsLoading ? "..." : featuredJobCount} jobs
                      </Text>
                    </Flex>

                    {/* Follow button */}
                    <CompanyFollowButton
                      companyId={featuredCompany?.id}
                      variant="card"
                      followLabel="Follow"
                      followingLabel="Following"
                    />
                  </Flex>
                </Box>

                {/* Right company list */}
                {hasCompanyList ? (
                  <VStack
                    align="stretch"
                    pr={{ base: 0, lg: 6 }}
                    spacing={5}
                    minW={0}
                    h="100%"
                    justify="space-between"
                  >
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing="20px" flex="1" alignContent="start">
                      {companyList.map((comp) => (
                        <CompanyCard key={comp.id} company={comp} />
                      ))}
                    </SimpleGrid>
                  </VStack>
                ) : null}
              </SimpleGrid>
            ) : (
              <Flex
                minH={{ base: "260px", md: "300px" }}
                borderRadius="20px"
                border="1px dashed"
                borderColor="#D7DFEE"
                bg="#F8FAFC"
                align="center"
                justify="center"
                px={6}
                textAlign="center"
              >
                <Text color="#64748B" fontSize={{ base: "sm", md: "md" }} fontWeight="500">
                  There are no companies in this field on the current page.
                </Text>
              </Flex>
            )}

            <IconButton
              aria-label="Previous company page"
              icon={<FiChevronLeft />}
              onClick={handlePrevPage}
              position="absolute"
              left={{ base: "-20px", md: "-22px", lg: "-24px" }}
              top="50%"
              transform="translateY(-50%)"
              w="52px"
              h="52px"
              minW="52px"
              rounded="full"
              bg="white"
              color="#334371"
              border="1px solid #E2E8F0"
              boxShadow="0 8px 24px rgba(15, 23, 42, 0.12)"
              zIndex={6}
              _hover={{ bg: "white" }}
              _active={{ bg: "white" }}
              display={{ base: "none", md: "inline-flex" }}
            />

            <IconButton
              aria-label="Next company page"
              icon={<FiChevronRight />}
              onClick={handleNextPage}
              position="absolute"
              right={{ base: "-20px", md: "-22px", lg: "-24px" }}
              top="50%"
              transform="translateY(-50%)"
              w="52px"
              h="52px"
              minW="52px"
              rounded="full"
              bg="white"
              color="#334371"
              border="1px solid #E2E8F0"
              boxShadow="0 8px 24px rgba(15, 23, 42, 0.12)"
              zIndex={6}
              _hover={{ bg: "white" }}
              _active={{ bg: "white" }}
              display={{ base: "none", md: "inline-flex" }}
            />
          </Box>
        </>
      ) : (
        <Box
          bg="white"
          borderRadius="20px"
          border="1px solid"
          borderColor="#E2E8F0"
          p="24px"
        >
          <Flex direction="column" align="center" justify="center" py={10}>
            <Icon as={FiInbox} boxSize={12} color={textColor} />
            <Text color={textColor} fontSize="lg" mt={2}>
              No data
            </Text>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
