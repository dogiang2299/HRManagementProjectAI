import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Image,
  LinkBox,
  LinkOverlay,
  Skeleton,
  SkeletonText,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiArrowRight, FiBriefcase, FiMapPin, FiSend, FiStar } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { useGetJobs } from "../../job/api/getJobs";
import type { IJobItem } from "../../job/types/job";
import { formatSalary } from "../../job/types/job";
import LightningBoltBadge from "../../job/components/LightningBoltBadge";
import { resolveCompanyLogoUrl } from "../../../../utils/companyLogo";
import { logo } from "../../../../assets/logo";

const HERO_BG = "linear-gradient(110deg, #061422 0%, #183B4A 38%, #334371 100%)";

const getRemainingUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const diffMs = Math.max(midnight.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(diffMs / 1000);

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const padTime = (value: number) => String(value).padStart(2, "0");

const getCompanyLogo = (job: IJobItem) => {
  return (
    resolveCompanyLogoUrl(job.department?.image_logo) ||
    resolveCompanyLogoUrl((job as any)?.inforCompany?.image_logo) ||
    resolveCompanyLogoUrl((job as any)?.company?.image_logo)
  );
};

const getCompanyName = (job: IJobItem) => {
  return job.department_name || job.department?.full_name || "Company name";
};

const getLocation = (job: IJobItem) => {
  return job.workLocation?.short_address || job.work_location_name || "Updating";
};

const getTitle = (job: IJobItem) => job.post_title || job.internal_title || "Recruitment news";

const RotatingFeatureJobs = () => {
  const { data, isLoading } = useGetJobs({
    pages: 1,
    limit: 24,
    search: "",
    status: "PUBLIC",
  });

  const jobs = useMemo(() => data?.data ?? [], [data?.data]);
  const windowSize = Math.min(4, jobs.length);
  const [startIndex, setStartIndex] = useState(0);
  const [countdown, setCountdown] = useState(getRemainingUntilMidnight);

  useEffect(() => {
    if (jobs.length <= windowSize || windowSize === 0) return;

    const timer = window.setInterval(() => {
      setStartIndex((prev) => (prev + 1) % jobs.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [jobs.length, windowSize]);

  useEffect(() => {
    setStartIndex(0);
  }, [jobs.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getRemainingUntilMidnight());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const featuredJobs = useMemo(() => {
    if (!jobs.length || windowSize === 0) return [];

    return Array.from({ length: windowSize }, (_, index) => {
      return jobs[(startIndex + index) % jobs.length];
    });
  }, [jobs, startIndex, windowSize]);

  return (
<Box
  position="relative"
  w="full"
  overflow="clip"
  bg={HERO_BG}
  boxShadow="0 30px 80px rgba(9, 22, 40, 0.22)"
    py={{ base: 3, md: 5, xl: 5 }}
  px={{ base: 3, md: 15, xl: 150 }}

>
  <Box
    maxW="1440px"
    mx="auto"
    px={{ base: 4, md: 5, xl: 6 }}
    py={{ base: 5, md: 6, xl: 7 }}
    position="relative"
    zIndex={1}
  >
    <Flex
      direction={{ base: "column", xl: "row" }}
      gap={{ base: 5, xl: 8 }}
      align={{ base: "stretch", xl: "center" }}
      justify="space-between"
    >
        <VStack align="start" spacing={4} flex={{ base: "1", xl: "1 1 0" }} minW={0}>
          <HStack spacing={3} align="center">
            <LightningBoltBadge />
            <Text
              color="white"
              fontSize={{ base: "2xl", md: "4xl", xl: "5xl" }}
              fontWeight="900"
              lineHeight="1"
            >
              Lightning Badge
            </Text>
          </HStack>

          <Text
            color="rgba(255,255,255,0.88)"
            fontSize={{ base: "sm", md: "sm", xl: "md" }}
            maxW="720px"
            lineHeight="1.65"
          >
             Record the Employer's regular interaction with the candidate's CV
          </Text>

          <Box>
            <Text
              color="rgba(255,255,255,0.82)"
              fontWeight="800"
              letterSpacing="0.35em"
              textTransform="uppercase"
              fontSize={{ base: "xs", md: "sm" }}
              mb={4}
            >
              Automatically update later
            </Text>

            <HStack spacing={3} align="center" wrap="wrap">
              <Box
                minW="78px"
                bg="rgba(255,255,255,0.10)"
                border="1px solid"
                borderColor="rgba(255,255,255,0.10)"
                borderRadius="16px"
                px={3}
                py={2}
                color="white"
                textAlign="center"
              >
                <Text fontSize="2xl" fontWeight="900" lineHeight="1">
                  {padTime(countdown.hours)}
                </Text>
                <Text fontSize="xs" mt={1} color="rgba(255,255,255,0.72)">
                  Hour
                </Text>
              </Box>
              <Text color="rgba(255,255,255,0.86)" fontSize="3xl" fontWeight="800">
                .
              </Text>
              <Box
                minW="78px"
                bg="rgba(255,255,255,0.10)"
                border="1px solid"
                borderColor="rgba(255,255,255,0.10)"
                borderRadius="16px"
                px={3}
                py={2}
                color="white"
                textAlign="center"
              >
                <Text fontSize="2xl" fontWeight="900" lineHeight="1">
                  {padTime(countdown.minutes)}
                </Text>
                <Text fontSize="xs" mt={1} color="rgba(255,255,255,0.72)">
                  Minute
                </Text>
              </Box>
              <Text color="rgba(255,255,255,0.86)" fontSize="3xl" fontWeight="800">
                .
              </Text>
              <Box
                minW="78px"
                bg="rgba(255,255,255,0.10)"
                border="1px solid"
                borderColor="rgba(255,255,255,0.10)"
                borderRadius="16px"
                px={3}
                py={2}
                color="white"
                textAlign="center"
              >
                <Text fontSize="2xl" fontWeight="900" lineHeight="1">
                  {padTime(countdown.seconds)}
                </Text>
                <Text fontSize="xs" mt={1} color="rgba(255,255,255,0.72)">
                  Second
                </Text>
              </Box>
            </HStack>
          </Box>

          <Button
            h="44px"
            px={5}
            disabled
            borderRadius="full"
            bg="#334371"
            color="white"
            fontWeight="800"
            rightIcon={<FiArrowRight />}
            _hover={{ bg: "#2A365D" }}
            _active={{ bg: "#243055" }}
          >
            Explore jobs
          </Button>
        </VStack>

        <Box
          flex={{ base: "1", xl: "0 0 340px" }}
          w="full"
          maxW={{ base: "100%", xl: "340px" }}
          minW={0}
        >
          {isLoading ? (
            <VStack align="stretch" spacing={3} pt={{ base: 6, xl: 1 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Box
                  key={index}
                  bg="rgba(255,255,255,0.94)"
                  borderRadius="18px"
                  border="1px solid rgba(255,255,255,0.32)"
                  boxShadow="0 14px 32px rgba(8, 15, 30, 0.16)"
                  px={3}
                  py={3}
                >
                  <Flex align="center" gap={3}>
                    <Skeleton w="52px" h="52px" borderRadius="14px" />
                    <Box flex="1">
                      <Skeleton h="18px" mb={2} borderRadius="full" />
                      <SkeletonText noOfLines={2} spacing={2} skeletonHeight="12px" />
                    </Box>
                    <VStack align="end" spacing={2} minW="88px">
                      <Skeleton h="14px" w="44px" borderRadius="full" />
                      <Skeleton h="34px" w="72px" borderRadius="full" />
                    </VStack>
                  </Flex>
                </Box>
              ))}
            </VStack>
          ) : featuredJobs.length === 0 ? (
            <Flex
              minH={{ base: "260px", xl: "520px" }}
              align="center"
              justify="center"
              color="white"
              fontWeight="700"
            >
              There are no matching jobs to display
            </Flex>
          ) : (
            <VStack align="stretch" spacing={2} pt={{ base: 6, xl: 1 }}>
              {featuredJobs.map((job, index) => (
                <LinkBox
                  key={index}
                  as={Box}
                  bg="rgba(255,255,255,0.94)"
                  borderRadius="16px"
                  border="1px solid"
                  borderColor={index === 0 ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.32)"}
                  boxShadow="0 14px 32px rgba(8, 15, 30, 0.16)"
                  px={2}
                  py={2}
                  transition="box-shadow 0.2s ease, border-color 0.2s ease"
                  backdropFilter="blur(8px)"
                >
                  <Flex align="center" gap={2}>
                    <Box
                      w="48px"
                      h="48px"
                      minW="48px"
                      borderRadius="12px"
                      border="1px solid"
                      borderColor="rgba(51, 67, 113, 0.28)"
                      bg="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      overflow="hidden"
                    >
                      <Image
                        src={getCompanyLogo(job) || logo}
                        alt={getCompanyName(job)}
                        objectFit="contain"
                        w="80%"
                        h="80%"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset.fallbackApplied === "1") return;
                          img.dataset.fallbackApplied = "1";
                          img.src = logo;
                        }}
                      />
                    </Box>

                    <Box flex="1" minW={0}>
                      <LinkOverlay as={RouterLink} to={`/it-job/jobs/${job.id}`}>
                        <Text
                          fontSize={{ base: "sm", md: "14px" }}
                          fontWeight="800"
                          color="#243055"
                          noOfLines={2}
                          lineHeight="1.25"
                        >
                          {getTitle(job)}
                        </Text>
                      </LinkOverlay>

                      <Text mt={1} fontSize="xs" color="#64748B" noOfLines={1}>
                        {getCompanyName(job)}
                      </Text>

                      <HStack spacing={2.5} mt={1.5} flexWrap="wrap" color="#334371">
                        <HStack spacing={1.5}>
                          <Icon as={FiBriefcase} boxSize={3} />
                          <Text fontSize="xs" fontWeight="700">
                            {formatSalary(job.salary_from, job.salary_to, job.salary_currency)}
                          </Text>
                        </HStack>
                        <HStack spacing={1.5}>
                          <Icon as={FiMapPin} boxSize={3} />
                          <Text fontSize="xs" fontWeight="700" noOfLines={1}>
                            {getLocation(job)}
                          </Text>
                        </HStack>
                      </HStack>
                    </Box>

                    <VStack spacing={1} align="end" minW="70px">
                      <HStack spacing={1} color="#334371">
                        <Icon as={FiStar} boxSize={3} />
                        <Text fontSize="xs" fontWeight="800" textTransform="uppercase">
                          Hot
                        </Text>
                      </HStack>
                      <Button
                        as={RouterLink}
                        to={`/it-job/jobs/${job.id}`}
                        size="sm"
                        h="26px"
                        px={2}
                        borderRadius="full"
                        bg="#334371"
                        color="white"
                        fontWeight="800"
                        _hover={{ bg: "#2A365D" }}
                        rightIcon={<FiSend />}
                      >
                        Xem
                      </Button>
                    </VStack>
                  </Flex>
                </LinkBox>
              ))}
            </VStack>
          )}
        </Box>

<Flex
  flex={{ base: "1", xl: "0 0 360px" }}
  align="center"
  justify={{ base: "center", xl: "center" }}
  minW={{ base: 0, xl: "320px" }}
  pt={{ base: 2, xl: 0 }}
>
  <Box
    position="relative"
    w={{ base: "220px", md: "280px", xl: "360px" }}
    h={{ base: "220px", md: "280px", xl: "360px" }}
    pointerEvents="none"
  >
    {/* next class */}
    <Box
      position="absolute"
      inset={{ base: "6%", md: "5%", xl: "4%" }}
      borderRadius={{ base: "34px", md: "42px", xl: "52px" }}
      bg="linear-gradient(180deg, rgba(100,138,220,0.10) 0%, rgba(58,79,132,0.14) 100%)"
      transform="rotate(12deg)"
      opacity={0.9}
    />

    {/* slanted middle layer */}
    <Box
      position="absolute"
      inset={{ base: "14%", md: "12%", xl: "10%" }}
      borderRadius={{ base: "30px", md: "38px", xl: "46px" }}
      bg="linear-gradient(180deg, rgba(124,168,255,0.34) 0%, rgba(51,67,113,0.24) 100%)"
      transform="rotate(-18deg)"
      boxShadow="0 18px 40px rgba(10, 25, 52, 0.18)"
      opacity={0.98}
    />

    {/* light border for the middle layer */}
    <Box
      position="absolute"
      inset={{ base: "14%", md: "12%", xl: "10%" }}
      borderRadius={{ base: "30px", md: "38px", xl: "46px" }}
      border="1px solid"
      borderColor="rgba(180,205,255,0.16)"
      transform="rotate(-18deg)"
    />

    {/* lightning logo in the middle, very big */}
    <Flex
      position="absolute"
      inset={0}
      align="center"
      justify="center"
      zIndex={3}
    >
      <LightningBoltBadge
        w={{ base: "92px", md: "120px", xl: "150px" }}
        h={{ base: "92px", md: "120px", xl: "150px" }}
        minW={{ base: "92px", md: "120px", xl: "150px" }}
        borderRadius={{ base: "26px", md: "32px", xl: "38px" }}
        boxShadow="
          0 18px 40px rgba(62, 97, 190, 0.28),
          0 0 22px rgba(120, 160, 255, 0.18)
        "
        bg="linear-gradient(180deg, #7DA4FF 0%, #4F6DC0 52%, #334371 100%)"
        iconSize={16}
      />
    </Flex>
  </Box>
</Flex>    

</Flex>
    </Box>
  </Box>
  );
};

export default RotatingFeatureJobs;
