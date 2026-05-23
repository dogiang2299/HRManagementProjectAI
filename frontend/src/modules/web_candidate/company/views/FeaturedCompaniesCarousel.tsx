import { useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { useGetCompanyCandidate } from "../api/getCompany";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";
import { candidateInformCompany } from "../../../../routes/urls";

export default function FeaturedCompaniesCarousel() {
  const { data } = useGetCompanyCandidate({
    pages: 1,
    limit: 12,
    search: "",
  });

  const companies = useMemo(() => data?.data ?? [], [data?.data]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto scroll every 3 seconds
  useEffect(() => {
    if (companies.length === 0) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % companies.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [companies.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + companies.length) % companies.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % companies.length);
  };

  if (companies.length === 0) {
    return null;
  }

  // Show 5 companies at a time (for display carousel effect)
  const displayCount = 5;
  const visibleCompanies = Array.from({ length: displayCount }, (_, i) => {
    return companies[(currentIndex + i) % companies.length];
  });

  return (
    <Box w="full" bg="white" mt={4}>
      <VStack align="stretch" spacing={6} maxW="1440px" mx="auto">
        {/* Header */}
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={4}
          align={{ base: "start", md: "center" }}
          justify="space-between"
        >
          <VStack align="start" spacing={1}>
            <Text fontSize={{ base: "xl", md: "2xl", xl: "3xl" }} fontWeight="900" color="#0a0e27">
              Featured Employer
            </Text>
            <Text fontSize={{ base: "xs", md: "sm" }} color="#64748B">
              Explore top companies hiring
            </Text>
          </VStack>

          {/* Navigation Buttons */}
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              borderColor="#c7d2e0"
              onClick={handlePrev}
              _hover={{ bg: "#f1f5f9" }}
              leftIcon={<FiArrowLeft />}
              minW="auto"
              px={3}
            >
              Before
            </Button>
            <Button
              size="sm"
              variant="outline"
              borderColor="#c7d2e0"
              onClick={handleNext}
              _hover={{ bg: "#f1f5f9" }}
              rightIcon={<FiArrowRight />}
              minW="auto"
              px={3}
            >
              Next
            </Button>
          </HStack>
        </Flex>

        {/* Carousel */}
        <Flex
          gap={{ base: 3, md: 4, xl: 5 }}
          overflow="hidden"
          w="full"
          transition="all 0.4s ease-in-out"
        >
          {visibleCompanies.map((company, index) => {
            return (
              <Box
                key={`${company.id}-${index}`}
                flex="0 0 calc(20% - 16px)"
                minW="0"
              >
                <Flex
                  as={RouterLink}
                  to={`${candidateInformCompany}/${company.id}`}
                  align="stretch"
                  justify="stretch"
                  p={0}
                  bg="#f5f6f8"
                  borderRadius="12px"
                  border="1px solid #e2e8f0"
                  aspectRatio={1}
                  overflow="hidden"
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{
                    bg: "#f0f4f9",
                    borderColor: "#cbd5e1",
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
                  }}
                >
                  {/* Logo Only */}
                  <Image
                    src={resolveCompanyLogoUrl(company.image_logo)}
                    alt={company.full_name || `Company ${index + 1}`}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                </Flex>
              </Box>
            );
          })}
        </Flex>

        {/* Indicator Dots */}
        <Flex gap={1} justify="center">
          {Array.from({ length: Math.ceil(companies.length / displayCount) }).map(
            (_, i) => (
              <Box
                key={i}
                w={{ base: 1.5, md: 2 }}
                h={{ base: 1.5, md: 2 }}
                borderRadius="full"
                bg={i === Math.floor(currentIndex / displayCount) ? "#334371" : "#cbd5e1"}
                transition="all 0.2s ease"
                cursor="pointer"
                onClick={() => setCurrentIndex(i * displayCount)}
              />
            )
          )}
        </Flex>
      </VStack>
    </Box>
  );
}