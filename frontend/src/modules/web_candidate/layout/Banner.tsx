import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Image,
  Text,
  VStack,
  usePrefersReducedMotion,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiChevronRight, FiMapPin, FiSearch } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { candidateHomeUrl } from "../../../routes/urls";
import { useGetPositionGroups } from "./api/get";
import SearchCombobox from "../../../components/common/SearchCombobox";
import { useGetCompanyCandidate } from "../company/api/getCompany";

const bannerImages = [
  "/1.png",
  "/2.png",
  "/3.png",
  "/4.png",
  "/5.png",
  "/6.png",
];

const TopCVStyleHero = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(1);
  const [isSliding, setIsSliding] = useState(true);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const groupLimit = 6;

  const { data: groupPositionRes, isLoading: isGroupLoading } =
    useGetPositionGroups({
      pages: groupPage,
      limit: groupLimit,
    });

  const { data: companyRes, isLoading: isCompanyLoading } =
    useGetCompanyCandidate({
      pages: 1,
      limit: 500,
      search: "",
    });

  const locationOptions = (() => {
    const uniqueAddress = new Set<string>();

    return (companyRes?.data ?? [])
      .map((company) => ({
        address: (company.short_address ?? "").trim(),
      }))
      .filter((company) => {
        if (!company.address) {
          return false;
        }

        const key = company.address.toLowerCase();
        if (uniqueAddress.has(key)) {
          return false;
        }

        uniqueAddress.add(key);
        return true;
      })
      .map((company) => ({
        id: company.address,
        name: company.address,
      }));
  })();

  const selectedLocationOption = locationOptions.find(
    (option) => option.id === selectedLocationId,
  );

  const selectedLocationLabel = selectedLocationOption?.name ?? "";

  const categories = (groupPositionRes?.data ?? []).map((item) => ({
    id: item.id,
    label: item.name_group,
  }));

  const hoveredGroup = useMemo(() => {
    return (
      groupPositionRes?.data?.find((group) => group.id === hoveredGroupId) ??
      null
    );
  }, [groupPositionRes?.data, hoveredGroupId]);

  const hoveredGroupPositions = useMemo(() => {
    return (hoveredGroup?.positions ?? []).filter((item) => Boolean(item.id));
  }, [hoveredGroup?.positions]);

  const totalGroupPages = Math.max(
    groupPositionRes?.pagination.totalPages ?? 1,
    1,
  );
  const currentGroupPage = Math.max(
    groupPositionRes?.pagination.currentPage ?? groupPage,
    1,
  );

  const handlePreviousGroupPage = () => {
    setGroupPage((current) => Math.max(current - 1, 1));
  };

  const handleNextGroupPage = () => {
    setGroupPage((current) => Math.min(current + 1, totalGroupPages));
  };

  const clearHoveredGroup = () => {
    setHoveredGroupId(null);
  };

  const displayGroupId = hoveredGroupId && hoveredGroup ? hoveredGroupId : null;
  const loopedBannerImages = [
    bannerImages[bannerImages.length - 1],
    ...bannerImages,
    bannerImages[0],
  ];

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setIsSliding(true);
      setCarouselIndex((currentIndex) => currentIndex + 1);
    }, 2500);

    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    if (carouselIndex !== bannerImages.length + 1) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setIsSliding(false);
      setCarouselIndex(1);
    }, 700);

    return () => window.clearTimeout(resetTimer);
  }, [carouselIndex, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    if (!isSliding) {
      const frame = window.requestAnimationFrame(() => {
        setIsSliding(true);
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, [isSliding, prefersReducedMotion]);

  useEffect(() => {
    if (groupPage > totalGroupPages) {
      setGroupPage(totalGroupPages);
    }
  }, [groupPage, totalGroupPages]);

  useEffect(() => {
    const locationFromUrl = (
      searchParams.get("location") ||
      searchParams.get("locationId") ||
      ""
    ).trim();
    setSelectedLocationId(locationFromUrl);
  }, [searchParams]);

  const handleSearch = () => {
    const trimmed = keyword.trim();

    if (!trimmed && !selectedLocationId) {
      navigate(candidateHomeUrl);
      return;
    }

    const params = new URLSearchParams();

    if (trimmed) {
      params.set("search", trimmed);
    }

    if (selectedLocationLabel) {
      params.set("location", selectedLocationLabel);
    }

    navigate(`${candidateHomeUrl}?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Box
      w="full"
      position="relative"
      overflow="hidden"
      py={{ base: 5, md: 6, xl: 7 }}
      bg="linear-gradient(115deg, #202A49 0%, #29375F 30%, #334371 58%, #4B629B 82%, #6A80B8 100%)"
    >
      {/* background glow */}
      <Box
        position="absolute"
        inset={0}
        zIndex={0}
        pointerEvents="none"
        bg="
          radial-gradient(circle at 12% 38%, rgba(106, 128, 184, 0.24), transparent 22%),
          radial-gradient(circle at 86% 22%, rgba(132, 154, 210, 0.22), transparent 20%),
          radial-gradient(circle at 58% 100%, rgba(75, 98, 155, 0.20), transparent 30%)
"
      />

      {/* left shape */}
      <Box
        position="absolute"
        left={{ base: "-70px", md: "-25px", xl: "0px" }}
        top="0"
        bottom="0"
        w={{ base: "170px", md: "250px", xl: "320px" }}
        zIndex={0}
        pointerEvents="none"
        opacity={0.2}
      >
        <Box
          position="absolute"
          top="10%"
          left="-24%"
          w="78%"
          h="34%"
          transform="rotate(45deg)"
          border="1px solid rgba(160, 185, 245, 0.16)"
          bg="linear-gradient(135deg, rgba(78, 108, 178, 0.14), rgba(33, 46, 82, 0.02))"
        />
        <Box
          position="absolute"
          top="38%"
          left="-6%"
          w="48%"
          h="20%"
          transform="rotate(45deg)"
          border="1px solid rgba(160, 185, 245, 0.10)"
          bg="linear-gradient(135deg, rgba(88, 118, 186, 0.08), rgba(33, 46, 82, 0.01))"
        />
        <Box
          position="absolute"
          bottom="-1%"
          left="-8%"
          w="60%"
          h="26%"
          transform="rotate(45deg)"
          border="1px solid rgba(160, 185, 245, 0.12)"
          bg="linear-gradient(135deg, rgba(82, 112, 182, 0.10), rgba(33, 46, 82, 0.015))"
        />
      </Box>

      {/* shape right */}
      <Box
        position="absolute"
        right={{ base: "-80px", md: "-30px", xl: "0px" }}
        top="0"
        bottom="0"
        w={{ base: "170px", md: "250px", xl: "320px" }}
        zIndex={0}
        pointerEvents="none"
        opacity={0.16}
      >
        <Box
          position="absolute"
          top="8%"
          right="-24%"
          w="78%"
          h="34%"
          transform="rotate(45deg)"
          border="1px solid rgba(160, 185, 245, 0.12)"
          bg="linear-gradient(135deg, rgba(76, 105, 174, 0.10), rgba(33, 46, 82, 0.015))"
        />
        <Box
          position="absolute"
          bottom="10%"
          right="-10%"
          w="58%"
          h="25%"
          transform="rotate(45deg)"
          border="1px solid rgba(160, 185, 245, 0.08)"
          bg="linear-gradient(135deg, rgba(84, 114, 184, 0.08), rgba(33, 46, 82, 0.01))"
        />
      </Box>

      {/* light overlay */}
      <Box
        position="absolute"
        inset={0}
        zIndex={0}
        pointerEvents="none"
        bg="linear-gradient(135deg, rgba(8, 12, 28, 0.08) 0%, rgba(16, 24, 44, 0.05) 42%, rgba(30, 42, 74, 0.02) 100%)"
      />

      <VStack
        w="full"
        maxW="1220px"
        mx="auto"
        px={{ base: 3, md: 4, xl: 5 }}
        spacing={5}
        align="stretch"
        position="relative"
        zIndex={1}
      >
        <Text
          textAlign="center"
          fontSize={{ base: "xl", md: "1xl", xl: "2xl" }}
          fontWeight="800"
          color="white"
          lineHeight="1.25"
          letterSpacing="-0.02em"
          textShadow="0 2px 8px rgba(0,0,0,0.16)"
        >
          ITJob - Find jobs, Recruit effectively
        </Text>

        {/* content */}
        <Flex
          w="full"
          gap={{ base: 3, md: 4, xl: 4 }}
          direction={{ base: "column", xl: "row" }}
          align="stretch"
        >
          {/* left panel */}
          <VStack
            flex={{ base: "unset", xl: "0 0 31%" }}
            w={{ base: "full", xl: "20%" }}
            h={{ base: "auto", xl: "360px" }}
            bg="rgba(255,255,255,0.97)"
            borderRadius="24px"
            overflow="hidden"
            align="stretch"
            spacing={0}
            boxShadow="0 14px 28px rgba(8, 14, 34, 0.14)"
            border="1px solid rgba(255,255,255,0.26)"
          >
            <VStack align="stretch" spacing={0} py={1.5}>
              {!isGroupLoading && categories.length === 0 && (
                <Flex px={{ base: 4, md: 5 }} py={{ base: 3.5, md: 2, xl: 3 }}>
                  <Text fontSize="sm" color="#64748B" fontWeight="600">
                    No location group yet.
                  </Text>
                </Flex>
              )}

              {categories.map((item, index) => (
                <Flex
                  key={item.id}
                  align="center"
                  justify="space-between"
                  px={{ base: 4, md: 5 }}
                  py={{ base: 3.5, md: 2, xl: 3 }}
                  borderBottom={
                    index !== categories.length - 1 ? "1px solid" : "none"
                  }
                  borderColor="rgba(226, 232, 240, 0.9)"
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{
                    bg: "linear-gradient(135deg, rgba(36,49,86,0.04) 0%, rgba(51,67,113,0.08) 100%)",
                  }}
                  role="group"
                  onMouseEnter={() => setHoveredGroupId(item.id)}
                >
                  <Text
                    fontSize={{ base: "md", md: "sm", xl: "15px" }}
                    fontWeight="700"
                    color="#334155"
                    noOfLines={1}
                    transition="all 0.2s ease"
                    _groupHover={{ color: "#243156" }}
                  >
                    {item.label}
                  </Text>

                  <Icon
                    as={FiChevronRight}
                    boxSize={4.5}
                    color="#94A3B8"
                    transition="all 0.2s ease"
                    _groupHover={{
                      color: "#334371",
                      transform: "translateX(2px)",
                    }}
                  />
                </Flex>
              ))}
            </VStack>

            <Flex
              align="center"
              justify="space-between"
              px={5}
              py={4}
              mt="auto"
              borderTop="1px solid"
              borderColor="rgba(226, 232, 240, 0.9)"
              bg="rgba(248, 250, 252, 0.75)"
            >
              <Text color="#64748B" fontSize="sm" fontWeight="700">
                {currentGroupPage}/{totalGroupPages}
              </Text>

              <HStack spacing={2.5}>
                <IconButton
                  aria-label="Previous"
                  icon={
                    <FiChevronRight style={{ transform: "rotate(180deg)" }} />
                  }
                  variant="outline"
                  borderRadius="full"
                  borderColor="rgba(148, 163, 184, 0.3)"
                  color="#94A3B8"
                  isRound
                  size="sm"
                  bg="white"
                  _hover={{ bg: "gray.50" }}
                  isDisabled={currentGroupPage <= 1 || isGroupLoading}
                  onClick={handlePreviousGroupPage}
                />
                <IconButton
                  aria-label="Next"
                  icon={<FiChevronRight />}
                  variant="solid"
                  borderRadius="full"
                  bg="white"
                  border="1px solid #334371"
                  color="#334371"
                  isRound
                  size="sm"
                  _hover={{
                    bg: "#334371",
                    color: "white",
                  }}
                  isDisabled={
                    currentGroupPage >= totalGroupPages || isGroupLoading
                  }
                  onClick={handleNextGroupPage}
                />
              </HStack>
            </Flex>
          </VStack>

          {/* right banner */}
          <Box
            flex={{ base: "unset", xl: "1" }}
            w={{ base: "full", xl: "auto" }}
            minW={0}
            onMouseLeave={clearHoveredGroup}
          >
            {displayGroupId ? (
              <Box
                w="full"
                h={{ base: "220px", md: "290px", xl: "360px" }}
                borderRadius="24px"
                overflow="hidden"
                boxShadow="0 16px 34px rgba(15, 23, 42, 0.12)"
                border="1px solid #E2E8F0"
                position="relative"
                bg="linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)"
                px={{ base: 4, md: 6, xl: 8 }}
                py={{ base: 4, md: 5, xl: 6 }}
              >
                <VStack align="stretch" spacing={4} h="full">
                  <Flex justify="space-between" align="start" gap={3}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="#64748B" fontWeight="700">
                        Setting positions in this group
                      </Text>
                      <Text
                        fontSize={{ base: "xl", md: "xl" }}
                        color="#1E293B"
                        fontWeight="800"
                      >
                        {hoveredGroup?.name_group}
                      </Text>
                    </VStack>
                  </Flex>
                  <Box flex="1" overflowY="auto" pr={2}>
                    {hoveredGroupPositions.length > 0 ? (
                      <Wrap spacing={3} rowGap={3} align="start">
                        {hoveredGroupPositions.map((position) => (
                          <WrapItem key={position.id}>
                            <Flex
                              as="button"
                              type="button"
                              align="center"
                              borderRadius="999px"
                              px={{ base: 3, md: 4 }}
                              py={{ base: 2, md: 2.5 }}
                              bg="#F1F5F9"
                              color="#334155"
                              fontSize={{ base: "sm", md: "sm" }}
                              fontWeight="600"
                              lineHeight="1"
                              cursor="pointer"
                              transition="all 0.18s ease"
                              maxW={{ base: "150px", md: "220px", xl: "260px" }}
                              _hover={{
                                bg: "#E8EEF8",
                                color: "#1E293B",
                                transform: "translateY(-1px)",
                              }}
                              _active={{
                                transform: "translateY(0)",
                              }}
                              onClick={() =>
                                navigate(`/it-job/jobs/group/${position.id}`)
                              }
                            >
                              <Text noOfLines={1}>
                                {position.name_post || position.position_code}
                              </Text>
                            </Flex>
                          </WrapItem>
                        ))}
                      </Wrap>
                    ) : (
                      <Flex h="full" align="center" justify="center">
                        <Text color="#64748B" fontWeight="600">
                          No positions found in this group.
                        </Text>
                      </Flex>
                    )}
                  </Box>{" "}
                </VStack>
              </Box>
            ) : (
              <Box
                w="full"
                h={{ base: "220px", md: "290px", xl: "360px" }}
                borderRadius="24px"
                overflow="hidden"
                boxShadow="0 16px 30px rgba(6, 12, 28, 0.18)"
                border="1px solid rgba(255,255,255,0.08)"
                position="relative"
                bg="#0B1020"
              >
                <Box
                  display="flex"
                  w={`${loopedBannerImages.length * 100}%`}
                  h="full"
                  transform={`translateX(-${carouselIndex * (100 / loopedBannerImages.length)}%)`}
                  transition={
                    prefersReducedMotion || !isSliding
                      ? "none"
                      : "transform 700ms ease"
                  }
                >
                  {loopedBannerImages.map((src, index) => (
                    <Box
                      key={`${src}-${index}`}
                      w={`calc(100% / ${loopedBannerImages.length})`}
                      h="full"
                      flex="0 0 auto"
                      pointerEvents="none"
                    >
                      <Image
                        src={src}
                        alt={`Banner ${index + 1}`}
                        w="full"
                        h="full"
                        objectFit="cover"
                        draggable={false}
                        userSelect="none"
                      />
                    </Box>
                  ))}
                </Box>

                <Box
                  position="absolute"
                  inset={0}
                  bg="linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.03) 100%)"
                  pointerEvents="none"
                />
              </Box>
            )}
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
};

export default TopCVStyleHero;
