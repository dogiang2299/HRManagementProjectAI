import {
  Box,
  Flex,
  Grid,
  HStack,
  Icon,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiFacebook,
  FiLinkedin,
  FiYoutube,
} from "react-icons/fi";
import { FaTiktok } from "react-icons/fa";

const topFooterGroups = [
  {
    title: "About ITJob",
    links: [
      { label: "Introduce", href: "#" },
      { label: "Press corner", href: "#" },
      { label: "Recruitment", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Q&A", href: "#" },
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
    ],
  },
  {
    title: "Profile and CV",
    links: [
      { label: "Manage your CV", href: "#" },
      { label: "Instructions for writing a CV", href: "#" },
      { label: "CV library by industry", href: "#" },
      { label: "Review CV", href: "#" },
    ],
    extraTitle: "Discover",
    extraLinks: [
      { label: "ITJob mobile application", href: "#" },
      { label: "Gross - Net salary calculation", href: "#" },
      { label: "Calculate compound interest", href: "#" },
      { label: "Make a savings plan", href: "#" },
      { label: "Calculate unemployment insurance", href: "#" },
      { label: "Calculate one-time social insurance", href: "#" },
      { label: "MBTI test", href: "#" },
      { label: "MI test", href: "#" },
    ],
  },
  {
    title: "Build a career",
    links: [
      { label: "Best job", href: "#" },
      { label: "High paying job", href: "#" },
      { label: "Management jobs", href: "#" },
      { label: "IT jobs", href: "#" },
      { label: "Senior Jobs", href: "#" },
      { label: "Part-time job", href: "#" },
    ],
    extraTitle: "General rules",
    extraLinks: [
      { label: "General trading conditions", href: "#" },
      { label: "Service price & Payment method", href: "#" },
      { label: "Information about shipping", href: "#" },
    ],
  },
];

const CandidateFooter = () => {
  return (
    <Box
      as="footer"
      mt={{ base: 8, md: 10 }}
    >
      {/* TOP */}
      <Box borderTop="1px solid" borderColor="#E5E7EB">
        <Box
          maxW="full"
          mx="auto"
          py={{ base: 3, md: 5, xl: 10 }}
          px={{ base: 3, md: 15, xl: 150 }}
        >
          <Grid
            templateColumns={{ base: "1fr", lg: "260px 1fr" }}
            gap={4}
            alignItems="start"
          >
            {/* LEFT */}
            <VStack align="start" spacing={4}>
              <VStack align="start" spacing={2}>
                <Text
                  fontSize={{ base: "3xl", md: "4xl" }}
                  fontWeight="900"
                  lineHeight="1"
                  letterSpacing="-0.03em"
                >
                  <Box as="span" color="#1E293B">
                    it
                  </Box>
                  <Box as="span" color="#334371">
                    job
                  </Box>
                </Text>

                <Text
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="700"
                  color="#1F2937"
                >
                  Next advantage - Successful connection
                </Text>
              </VStack>

              <HStack spacing={2} flexWrap="wrap">
                <Box
                  px={2.5}
                  py={1.5}
                  bg="white"
                  border="1px solid"
                  borderColor="#E5E7EB"
                  borderRadius="md"
                >
                  <Text fontSize="xs" fontWeight="700" color="#64748B">
                    Google for Startups
                  </Text>
                </Box>

                <Box px={2.5} py={1.5} bg="#334371" borderRadius="md">
                  <Text fontSize="10px" fontWeight="800" color="white">
                    DMCA
                  </Text>
                </Box>
              </HStack>

              <VStack align="start" spacing={1.5}>
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="800" color="#1F2937">
                  Contact
                </Text>

                <Text fontSize="sm" color="#4B5563">
                  Hotline:{" "}
                  <Box as="span" fontWeight="700" color="#1F2937">
                    0377 167 619
                  </Box>
                </Text>

                <Text fontSize="sm" color="#4B5563">
                  Email:{" "}
                  <Box as="span" fontWeight="700" color="#1F2937">
                    dogianga9.2020@gmail.com
                  </Box>
                </Text>
              </VStack>

              <VStack align="start" spacing={2}>
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="800" color="#1F2937">
                  Download application
                </Text>

                <HStack spacing={2} flexWrap="wrap">
                  <Flex
                    bg="black"
                    color="white"
                    px={3}
                    py={2}
                    borderRadius="md"
                    minW="120px"
                    direction="column"
                  >
                    <Text fontSize="9px">Download on the</Text>
                    <Text fontSize="sm" fontWeight="800">
                      App Store
                    </Text>
                  </Flex>

                  <Flex
                    bg="black"
                    color="white"
                    px={3}
                    py={2}
                    borderRadius="md"
                    minW="130px"
                    direction="column"
                  >
                    <Text fontSize="9px">GET IT ON</Text>
                    <Text fontSize="sm" fontWeight="800">
                      Google Play
                    </Text>
                  </Flex>
                </HStack>
              </VStack>

              <VStack align="start" spacing={2}>
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="800" color="#1F2937">
                  ITJob community
                </Text>

                <HStack spacing={2}>
                  {[FiFacebook, FiYoutube, FiLinkedin, FaTiktok].map((item, index) => (
                    <Flex
                      key={index}
                      w="32px"
                      h="32px"
                      borderRadius="full"
                      align="center"
                      justify="center"
                      bg="#6B7280"
                      color="white"
                      transition="0.2s ease"
                      _hover={{ bg: "#334371" }}
                      cursor="pointer"
                    >
                      <Icon as={item} boxSize={3.5} />
                    </Flex>
                  ))}
                </HStack>
              </VStack>
            </VStack>

            {/* RIGHT */}
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
              {topFooterGroups.map((group) => (
                <VStack key={group.title} align="start" spacing={2}>
                  <Text
                    fontSize={{ base: "md", md: "lg" }}
                    fontWeight="800"
                    color="#1F2937"
                  >
                    {group.title}
                  </Text>

                  {group.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      fontSize="sm"
                      color="#4B5563"
                      lineHeight="1.6"
                      _hover={{ color: "#334371", textDecoration: "none" }}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {"extraTitle" in group && group.extraTitle && (
                    <>
                      <Text
                        pt={2}
                        fontSize={{ base: "md", md: "lg" }}
                        fontWeight="800"
                        color="#1F2937"
                      >
                        {group.extraTitle}
                      </Text>

                      {group.extraLinks?.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          fontSize="sm"
                          color="#4B5563"
                          lineHeight="1.6"
                          _hover={{ color: "#334371", textDecoration: "none" }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </>
                  )}
                </VStack>
              ))}
            </SimpleGrid>
          </Grid>
        </Box>
      </Box>

     
    </Box>
  );
};

export default CandidateFooter;