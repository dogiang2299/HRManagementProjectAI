import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiTarget, FiTrendingUp, FiCheckCircle, FiMapPin, FiSearch, FiSliders, FiUsers } from "react-icons/fi";

const floatY = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const points = [
  {
    icon: FiUsers,
    text: "Access thousands of pre-screened profiles and proactively send relevant invitations.",
  },
  {
    icon: FiSliders,
    text: "Refine searches by skills, years of experience, keywords, and many other criteria.",
  },
];

const features = [
  {
    icon: FiUsers,
    title: "Reach high-quality IT candidates",
    desc: "Increase your ability to connect with highly skilled and relevant candidates faster.",
  },
  {
    icon: FiTarget,
    title: "Attract the right candidate groups",
    desc: "Position job postings clearly based on skills, roles, and real hiring needs.",
  },
  {
    icon: FiTrendingUp,
    title: "Improve recruitment efficiency",
    desc: "Optimize application rates, shorten hiring time, and improve the recruitment experience.",
  },
  {
    icon: FiCheckCircle,
    title: "Manage recruitment visually",
    desc: "A clear, easy-to-use interface that helps you track and process candidates conveniently.",
  },
];

function MockJobBlock({
  title,
  badge,
  top,
  right,
  motion,
  delay,
}: {
  title: string;
  badge: string;
  top: string;
  right: string;
  motion?: string;
  delay: string;
}) {
  const badgeColor =
    badge === "SUPER HOT" ? "#334371" : badge === "HOT" ? "#5B6BA3" : "#6E82B8";

  return (
    <Box
      position="absolute"
      top={top}
      right={right}
      bg="white"
      borderRadius="18px"
      p={4}
      w={{ base: "180px", md: "220px" }}
      boxShadow="0 18px 40px rgba(15,23,42,0.10)"
      animation={motion}
      style={{ animationDelay: delay }}
      transition="transform 0.25s ease, box-shadow 0.25s ease"
      _hover={{ transform: 'translateY(-4px)', boxShadow: '0 22px 48px rgba(15,23,42,0.14)' }}
    >
      <HStack justify="space-between" mb={3}>
        <Box h="8px" w="70px" bg="#E5E7EB" borderRadius="full" />
        <Box bg={badgeColor} color="white" px={2.5} py={1} borderRadius="md" fontSize="xs" fontWeight="800">
          {badge}
        </Box>
      </HStack>
      <Text fontWeight="900" color="#1F2937" fontSize="lg">
        {title}
      </Text>
      <Box mt={4} h="10px" bg="#D1FAE5" borderRadius="full" />
      <HStack mt={3}>
        <Box boxSize="18px" borderRadius="full" bg="#DCFCE7" />
        <Box h="8px" flex="1" bg="#E5E7EB" borderRadius="full" />
      </HStack>
    </Box>
  );
}

export default function EmployerServicesSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const floating = prefersReducedMotion ? undefined : `${floatY} 6.5s ease-in-out infinite`;
  const appear = prefersReducedMotion ? undefined : `${fadeUp} 0.65s ease-out both`;

  return (
    <Box px={{ base: 3, md: 15, xl: 135 }} bg="linear-gradient(180deg, #24335F 0%, #334371 100%)" py={{ base: 14, md: 20 }}>
      <Container maxW="7xl">
        <VStack spacing={4} textAlign="center" mb={10} animation={appear}>
          <Heading color="white" fontSize={{ base: "2xl", md: "4xl" }} fontWeight="900">
            High-quality services for IT employers
          </Heading>
        </VStack>

        <Box
          bg="#FAFAFB"
          borderRadius="32px"
          p={{ base: 6, md: 10, xl: 10 }}
          boxShadow="0 25px 60px rgba(0,0,0,0.14)"
          animation={appear}
        >
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 10, xl: 16 }} alignItems="center">
            <VStack align="start" spacing={6}>
              <Heading fontSize={{ base: "2xl", md: "3xl" }} color="#111827" fontWeight="900">
                Job Posting
              </Heading>

              <Text color="#4B5563" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                Post technology roles, reach candidates who match your business needs,
                and manage the recruitment process in a clear and professional way.
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                {features.map((item, index) => (
                  <HStack
                    key={index}
                    align="start"
                    spacing={4}
                    p={4}
                    bg="#F3F6FF"
                    borderRadius="20px"
                    transition="transform 0.25s ease, box-shadow 0.25s ease"
                    _hover={{ transform: 'translateY(-4px)', boxShadow: '0 14px 28px rgba(51,67,113,0.08)' }}
                  >
                    <Flex
                      boxSize="52px"
                      borderRadius="full"
                      bg="#334371"
                      color="white"
                      align="center"
                      justify="center"
                      flexShrink={0}
                      animation={floating}
                      style={{ animationDelay: `${index * 0.14}s` }}
                    >
                      <Icon as={item.icon} boxSize={5} />
                    </Flex>
                    <Box>
                      <Text fontWeight="800" color="#111827" mb={1}>
                        {item.title}
                      </Text>
                      <Text color="#4B5563" fontSize="sm" lineHeight="1.7">
                        {item.desc}
                      </Text>
                    </Box>
                  </HStack>
                ))}
              </SimpleGrid>
            </VStack>

            <Flex justify="center">
              <Box position="relative" w="full" maxW="500px" h={{ base: "320px", md: "420px" }}>
                <Box position="absolute" inset="8%" borderRadius="full" bg="rgba(15, 23, 42, 0.03)" animation={floating} />
                <MockJobBlock title="UX/UI Designer" badge="HOT" top="10%" right="10%" motion={floating} delay="0s" />
                <MockJobBlock title="Full-stack Developer" badge="SUPER HOT" top="34%" right="24%" motion={floating} delay="0.4s" />
                <MockJobBlock title="Business Analyst" badge="NEW" top="68%" right="6%" motion={floating} delay="0.8s" />
              </Box>
            </Flex>
          </SimpleGrid>
        </Box>

        <Box
          mt={10}
          bg="#FAFAFB"
          borderRadius="32px"
          p={{ base: 6, md: 10, xl: 10 }}
          boxShadow="0 25px 60px rgba(0,0,0,0.14)"
          animation={appear}
          style={{ animationDelay: '0.1s' }}
        >
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 10, xl: 16 }} alignItems="center">
            <VStack align="start" spacing={6}>
              <Heading fontSize={{ base: "2xl", md: "3xl" }} color="#111827" fontWeight="900">
                Talent Finder
              </Heading>

              <Text color="#4B5563" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                A service that helps IT employers proactively find high-quality candidates
                based on the exact hiring criteria they need.
              </Text>

              <VStack align="stretch" spacing={4} w="full">
                {points.map((item, index) => (
                  <HStack
                    key={index}
                    align="start"
                    spacing={4}
                    p={5}
                    bg="#F3F6FF"
                    borderRadius="20px"
                    transition="transform 0.25s ease, box-shadow 0.25s ease"
                    _hover={{ transform: 'translateY(-4px)', boxShadow: '0 14px 28px rgba(51,67,113,0.08)' }}
                  >
                    <Flex
                      boxSize="52px"
                      borderRadius="full"
                      bg="#334371"
                      color="white"
                      align="center"
                      justify="center"
                      flexShrink={0}
                      animation={floating}
                      style={{ animationDelay: `${index * 0.16}s` }}
                    >
                      <Icon as={item.icon} boxSize={5} />
                    </Flex>
                    <Text color="#1F2937" fontSize="md" lineHeight="1.9" fontWeight="500">
                      {item.text}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>

            <Flex justify="center">
              <Box position="relative" w="full" maxW="520px" h={{ base: "360px", md: "420px" }}>
                <Box position="absolute" inset="8%" borderRadius="full" bg="rgba(15, 23, 42, 0.03)" animation={floating} />

                <Box
                  position="absolute"
                  top="8%"
                  left="8%"
                  right="8%"
                  bg="white"
                  border="1px solid #E5E7EB"
                  borderRadius="18px"
                  px={5}
                  py={4}
                  boxShadow="0 12px 24px rgba(15,23,42,0.06)"
                  animation={floating}
                >
                  <HStack spacing={3}>
                    <Icon as={FiSearch} color="#334371" boxSize={5} />
                    <Text color="gray.400">Search keyword (job title, skill,...)</Text>
                  </HStack>
                </Box>

                <Box position="absolute" top="30%" left="12%" right="10%" bg="white" borderRadius="18px" p={4} boxShadow="0 18px 40px rgba(15,23,42,0.08)" animation={floating} style={{ animationDelay: '0.3s' }}>
                  <HStack>
                    <Box boxSize="18px" borderRadius="full" bg="#D1D5DB" />
                    <Text fontWeight="800" color="#111827">
                      Java Developer at ABC Company
                    </Text>
                  </HStack>
                </Box>

                <Box position="absolute" top="46%" left="8%" right="4%" bg="#EEF2FF" borderLeft="6px solid #334371" borderRadius="18px" p={5} boxShadow="0 18px 40px rgba(15,23,42,0.08)" animation={floating} style={{ animationDelay: '0.55s' }}>
                  <Text fontWeight="900" color="#334371" fontSize="xl">
                    Java Developer at DE Corporation
                  </Text>
                  <Box mt={4} h="10px" bg="#CFD9F3" borderRadius="full" />
                  <Box mt={3} h="10px" w="70%" bg="#CFD9F3" borderRadius="full" />
                </Box>

                <Box position="absolute" top="74%" left="14%" right="12%" bg="white" borderRadius="18px" p={4} boxShadow="0 18px 40px rgba(15,23,42,0.08)" animation={floating} style={{ animationDelay: '0.8s' }}>
                  <HStack>
                    <Box boxSize="18px" borderRadius="full" bg="#D1D5DB" />
                    <Text fontWeight="800" color="#111827">
                      Java Developer at X Company
                    </Text>
                  </HStack>
                </Box>

                <Box position="absolute" top="42%" left="0" bg="#334371" color="white" px={4} py={2} borderRadius="full" fontSize="sm" fontWeight="700" animation={floating} style={{ animationDelay: '0.2s' }}>
                  <HStack spacing={2}>
                    <Icon as={FiMapPin} />
                    <Text>Location</Text>
                  </HStack>
                </Box>

                <Box position="absolute" top="62%" right="0" bg="#5B6BA3" color="white" px={4} py={2} borderRadius="full" fontSize="sm" fontWeight="700" animation={floating} style={{ animationDelay: '0.5s' }}>
                  Years of experience
                </Box>

                <Box position="absolute" bottom="8%" left="14%" bg="#334371" color="white" px={4} py={2} borderRadius="full" fontSize="sm" fontWeight="700" animation={floating} style={{ animationDelay: '0.75s' }}>
                  Skill
                </Box>
              </Box>
            </Flex>
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  );
}