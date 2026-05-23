import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiArrowRight, FiUsers, FiBriefcase, FiStar } from "react-icons/fi";

const floatY = keyframes`
  0%, 100% {
    transform: translate3d(0, 0px, 0) rotate(0deg) scale(1);
  }
  25% {
    transform: translate3d(0, -8px, 0) rotate(-1deg) scale(1.01);
  }
  50% {
    transform: translate3d(0, -16px, 0) rotate(1deg) scale(1.02);
  }
  75% {
    transform: translate3d(0, -8px, 0) rotate(-0.5deg) scale(1.01);
  }
`;

const glowDrift = keyframes`
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.42;
  }
  25% {
    transform: translate3d(20px, -10px, 0) scale(1.06);
    opacity: 0.58;
  }
  50% {
    transform: translate3d(36px, -24px, 0) scale(1.12);
    opacity: 0.78;
  }
  75% {
    transform: translate3d(12px, -8px, 0) scale(1.05);
    opacity: 0.55;
  }
`;

const fadeUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(26px) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const pulseSoft = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.22;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.12;
  }
`;

const rotateSlow = keyframes`
  from {
    transform: rotate(18deg);
  }
  to {
    transform: rotate(378deg);
  }
`;

const sparkle = keyframes`
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.16;
  }
  50% {
    transform: translate3d(0, -12px, 0) scale(1.18);
    opacity: 0.42;
  }
`;

function FloatingJobCard({
  title,
  badge,
  top,
  left,
  delay,
  motion,
}: {
  title: string;
  badge: string;
  top: string;
  left: string;
  delay: string;
  motion?: string;
}) {
  return (
    <Box
      position="absolute"
      top={top}
      left={left}
      bg="rgba(255,255,255,0.94)"
      borderRadius="20px"
      px={4}
      py={3}
      minW="190px"
      boxShadow="0 22px 54px rgba(15, 23, 42, 0.18)"
      border="1px solid rgba(255,255,255,0.58)"
      backdropFilter="blur(12px)"
      animation={motion}
      transition="transform 0.28s ease, box-shadow 0.28s ease"
      _hover={{
        transform: "translateY(-6px) scale(1.02)",
        boxShadow: "0 28px 62px rgba(15, 23, 42, 0.22)",
      }}
      style={{ animationDelay: delay }}
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" color="gray.400" fontWeight="600">
          Posted 2 hours ago
        </Text>
        <Badge
          bg={badge === "SUPER HOT" ? "#334371" : badge === "HOT" ? "#5569A5" : "#7B8FC4"}
          color="white"
          px={2}
          py={1}
          borderRadius="full"
          fontSize="10px"
        >
          {badge}
        </Badge>
      </HStack>

      <Text fontWeight="800" color="#1E293B" fontSize="md">
        {title}
      </Text>

      <Text mt={1} fontSize="sm" color="#334371" fontWeight="700">
        Competitive Salary
      </Text>
    </Box>
  );
}

type EmployerHeroSectionProps = {
  onContactClick?: () => void;
};

export default function EmployerHeroSection({ onContactClick }: EmployerHeroSectionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const fadeIn = prefersReducedMotion
    ? undefined
    : `${fadeUp} 0.9s cubic-bezier(0.22, 1, 0.36, 1) both`;

  const floatingA = prefersReducedMotion
    ? undefined
    : `${floatY} 5.4s ease-in-out infinite`;

  const floatingB = prefersReducedMotion
    ? undefined
    : `${floatY} 6.3s ease-in-out infinite`;

  const floatingC = prefersReducedMotion
    ? undefined
    : `${floatY} 5.8s ease-in-out infinite`;

  const drifting = prefersReducedMotion
    ? undefined
    : `${glowDrift} 10s ease-in-out infinite`;

  const pulsing = prefersReducedMotion
    ? undefined
    : `${pulseSoft} 6s ease-in-out infinite`;

  const spinning = prefersReducedMotion
    ? undefined
    : `${rotateSlow} 16s linear infinite`;

  const sparklingA = prefersReducedMotion
    ? undefined
    : `${sparkle} 4.2s ease-in-out infinite`;

  const sparklingB = prefersReducedMotion
    ? undefined
    : `${sparkle} 5.4s ease-in-out infinite`;

  return (
    <Box
      position="relative"
      overflow="hidden"
      bg="linear-gradient(105deg, #0D152C 0%, #182547 38%, #334371 100%)"
      color="white"
      px={{ base: 3, md: 15, xl: 135 }}
    >
      <Box
        position="absolute"
        inset={0}
        bg="radial-gradient(circle at 76% 36%, rgba(144,168,231,0.18), transparent 32%)"
      />

      <Box
        position="absolute"
        top="-120px"
        right="-80px"
        w="420px"
        h="420px"
        borderRadius="full"
        bg="rgba(102,130,196,0.18)"
        filter="blur(14px)"
        animation={`${drifting}, ${pulsing}`}
      />

      <Box
        position="absolute"
        bottom="-100px"
        left="-60px"
        w="280px"
        h="280px"
        borderRadius="full"
        bg="rgba(93,123,196,0.14)"
        filter="blur(18px)"
        animation={`${drifting}, ${pulsing}`}
        style={{ animationDelay: "1.8s" }}
      />

      <Box
        position="absolute"
        top="16%"
        right="24%"
        w="10px"
        h="10px"
        borderRadius="full"
        bg="rgba(255,255,255,0.34)"
        filter="blur(2px)"
        animation={sparklingA}
      />

      <Box
        position="absolute"
        top="26%"
        right="12%"
        w="6px"
        h="6px"
        borderRadius="full"
        bg="rgba(255,255,255,0.28)"
        filter="blur(1px)"
        animation={sparklingB}
        style={{ animationDelay: "0.8s" }}
      />

      <Box
        position="absolute"
        bottom="20%"
        right="31%"
        w="8px"
        h="8px"
        borderRadius="full"
        bg="rgba(255,255,255,0.22)"
        filter="blur(1px)"
        animation={sparklingA}
        style={{ animationDelay: "1.6s" }}
      />

      <Container maxW="7xl" py={{ base: 14, md: 20, xl: 24 }} position="relative" zIndex={1}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 10, xl: 16 }} alignItems="center">
          <VStack align="start" spacing={6} animation={fadeIn}>
            <Badge
              px={4}
              py={2}
              borderRadius="full"
              bg="rgba(255,255,255,0.1)"
              color="white"
              fontSize="xs"
              fontWeight="700"
              letterSpacing="0.04em"
              backdropFilter="blur(8px)"
              boxShadow="inset 0 0 0 1px rgba(255,255,255,0.08)"
            >
              EXCLUSIVELY FOR IT EMPLOYERS
            </Badge>

            <Heading
              fontSize={{ base: "3xl", md: "4xl", xl: "5xl" }}
              lineHeight={{ base: "1.25", md: "1.18" }}
              fontWeight="900"
              maxW="680px"
            >
              Recruit IT Talent in Vietnam with ITJob
            </Heading>

            <Text
              fontSize={{ base: "md", md: "lg" }}
              color="rgba(255,255,255,0.82)"
              maxW="620px"
              lineHeight="1.85"
            >
              Connect with a high-quality pool of technology candidates, optimize recruitment
              efficiency, and build a professional employer brand directly on your platform.
            </Text>

            <HStack spacing={4} pt={2} flexWrap="wrap">
              <Button
  size="lg"
  bg="#334371"
  color="white"
  px={8}
  borderRadius="14px"
  transition="all 0.28s ease"
  _hover={{
    bg: "#2B365F",
    transform: "translateY(-2px)",
    boxShadow: "0 16px 34px rgba(27, 40, 78, 0.3)",
  }}
  rightIcon={<FiArrowRight />}
  onClick={onContactClick}
>
  Contact Now
</Button>

             
            </HStack>

            <Stack
              direction={{ base: "column", sm: "row" }}
              spacing={6}
              pt={4}
              color="rgba(255,255,255,0.85)"
            >
              <HStack>
                <Icon as={FiUsers} color="#B8C5EA" />
                <Text fontSize="sm">300,000+ IT candidates</Text>
              </HStack>
              <HStack>
                <Icon as={FiBriefcase} color="#B8C5EA" />
                <Text fontSize="sm">10,000+ companies</Text>
              </HStack>
              <HStack>
                <Icon as={FiStar} color="#B8C5EA" />
                <Text fontSize="sm">Premium service</Text>
              </HStack>
            </Stack>
          </VStack>

          <Flex justify="center" align="center" animation={fadeIn} style={{ animationDelay: "0.12s" }}>
            <Box
              position="relative"
              w={{ base: "100%", sm: "420px", xl: "520px" }}
              h={{ base: "420px", xl: "500px" }}
            >
              <Box
                position="absolute"
                inset="12%"
                borderRadius="full"
                bg="linear-gradient(180deg, rgba(75,96,156,0.6), rgba(45,62,111,0.14))"
                animation={`${drifting}, ${pulsing}`}
              />

              <Box
                position="absolute"
                inset="20%"
                border="4px solid rgba(255,255,255,0.72)"
                borderRadius="full"
                borderLeftColor="transparent"
                borderBottomColor="transparent"
                animation={spinning}
              />

              <Box
                position="absolute"
                inset="27%"
                borderRadius="full"
                border="1px solid rgba(255,255,255,0.16)"
              />

              <FloatingJobCard
                title="Java Developer"
                badge="SUPER HOT"
                top="12%"
                left="8%"
                delay="0.15s"
                motion={floatingA}
              />

              <FloatingJobCard
                title="PHP Developer"
                badge="HOT"
                top="40%"
                left="2%"
                delay="0.35s"
                motion={floatingB}
              />

              <FloatingJobCard
                title="AI Engineer"
                badge="NEW"
                top="74%"
                left="8%"
                delay="0.6s"
                motion={floatingC}
              />

              <Box
                position="absolute"
                bottom="10%"
                right="0"
                bg="rgba(255,255,255,0.95)"
                borderRadius="24px"
                p={5}
                w={{ base: "250px", xl: "290px" }}
                boxShadow="0 24px 56px rgba(15, 23, 42, 0.2)"
                animation={floatingB}
                style={{ animationDelay: "0.8s" }}
                transition="transform 0.28s ease, box-shadow 0.28s ease"
                _hover={{
                  transform: "translateY(-6px)",
                  boxShadow: "0 28px 64px rgba(15, 23, 42, 0.24)",
                }}
              >
                <Text fontSize="2xl" fontWeight="900" color="#0F172A" mb={4}>
                  Applicants
                </Text>

                <VStack align="stretch" spacing={3}>
                  {[
                    { name: "Nguyen Minh Phuong", role: "Senior Java Engineer" },
                    { name: "Tran Hoang Khanh", role: "Java Developer" },
                    { name: "Le Thanh Tung", role: "PHP Developer" },
                  ].map((item, index) => (
                    <HStack key={index} spacing={3}>
                      <Flex
                        boxSize="44px"
                        borderRadius="full"
                        bg="#F1F5F9"
                        align="center"
                        justify="center"
                        fontWeight="800"
                        color="#334155"
                      >
                        {item.name.charAt(0)}
                      </Flex>

                      <Box>
                        <Text color="#111827" fontWeight="800" fontSize="sm">
                          {item.name}
                        </Text>
                        <Text color="gray.500" fontSize="sm">
                          {item.role}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              <Flex
                position="absolute"
                bottom="18%"
                left="28%"
                w={{ base: "170px", xl: "210px" }}
                h={{ base: "220px", xl: "260px" }}
                borderRadius="28px"
                bg="linear-gradient(180deg, #E2EAFF 0%, #C2D1F3 100%)"
                align="center"
                justify="center"
                boxShadow="0 24px 64px rgba(0,0,0,0.22)"
                animation={floatingA}
                style={{ animationDelay: "1.15s" }}
              >
                <Box
                  position="absolute"
                  inset="10px"
                  borderRadius="22px"
                  border="1px solid rgba(255,255,255,0.58)"
                />
                <Text
                  fontSize={{ base: "3xl", xl: "4xl" }}
                  fontWeight="900"
                  color="#334371"
                  letterSpacing="tight"
                >
                  IT
                </Text>
              </Flex>
            </Box>
          </Flex>
        </SimpleGrid>
      </Container>
    </Box>
  );
}