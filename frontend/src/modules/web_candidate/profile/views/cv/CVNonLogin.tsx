import {
  Box,
  Button,
  Container,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiLock,
  FiSend,
  FiUploadCloud,
  FiUserPlus,
} from "react-icons/fi";
import { candidateLoginUrl, candidateRegisterUrl } from "../../../../../routes/urls";

const LOGIN_PATH = candidateLoginUrl;
const REGISTER_PATH = candidateRegisterUrl;

const benefits = [
  {
    icon: FiBriefcase,
    title: "Receive better job opportunities",
    description:
      "Your CV can be used for job matching so employers can discover suitable candidates faster.",
    bg: "#EEF2FF",
    color: "#334371",
  },
  {
    icon: FiBarChart2,
    title: "Improve your CV profile",
    description:
      "Track your CV information and keep your profile updated for better recommendations.",
    bg: "#FFF7ED",
    color: "#F97316",
  },
  {
    icon: FiSend,
    title: "Apply faster with your saved CV",
    description:
      "Upload once and reuse your CV when applying for jobs on ITJob.",
    bg: "#EEF4FF",
    color: "#3B82F6",
  },
  {
    icon: FiCheckCircle,
    title: "Match with suitable IT jobs",
    description:
      "Your CV helps the system understand your skills, experience and career direction.",
    bg: "#FFF1F3",
    color: "#E11D48",
  },
];

export default function CVNonLogin() {
  const navigate = useNavigate();

  return (
    <Box minH="100vh" py={{ base: 8, md: 12 }}>
      <Container maxW="1180px">
        <VStack align="stretch" spacing={8}>
          <Box
            overflow="hidden"
            borderRadius="28px"
            bg="white"
            border="1px solid #E2E8F0"
            boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)"
          >
            <Box
              bg="linear-gradient(135deg, #334371 0%, #1F2A4D 52%, #425892 130%)"
              px={{ base: 6, md: 10 }}
              py={{ base: 8, md: 10 }}
              color="white"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                right={{ base: "-80px", md: "40px" }}
                top={{ base: "-60px", md: "24px" }}
                w={{ base: "190px", md: "240px" }}
                h={{ base: "190px", md: "240px" }}
                borderRadius="999px"
                bg="rgba(255,255,255,0.10)"
              />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} alignItems="center">
                <Box position="relative" zIndex={1}>
                  <HStack spacing={3} mb={5}>
                    <Box
                      w="46px"
                      h="46px"
                      borderRadius="16px"
                      display="grid"
                      placeItems="center"
                      bg="rgba(255,255,255,0.14)"
                    >
                      <Icon as={FiFileText} boxSize={6} />
                    </Box>

                    <Text fontSize="sm" fontWeight="900" color="whiteAlpha.900">
                      ITJob CV Center
                    </Text>
                  </HStack>

                  <Text
                    fontSize={{ base: "3xl", md: "4xl" }}
                    fontWeight="950"
                    lineHeight="1.18"
                    letterSpacing="-0.03em"
                  >
                    Upload your CV so better IT opportunities can find you
                  </Text>

                  <Text
                    mt={4}
                    fontSize={{ base: "md", md: "lg" }}
                    color="whiteAlpha.850"
                    maxW="620px"
                    lineHeight="1.8"
                  >
                    Sign in to upload, preview and manage the CV used for job matching.
                    Your CV helps ITJob suggest more suitable jobs based on your skills,
                    experience and career direction.
                  </Text>

                  <HStack mt={7} spacing={4} flexWrap="wrap">
                    <Button
                      h="52px"
                      px={7}
                      borderRadius="16px"
                      bg="white"
                      color="#334371"
                      fontWeight="900"
                      rightIcon={<FiArrowRight />}
                      _hover={{ bg: "#F8FAFC", transform: "translateY(-1px)" }}
                      onClick={() => navigate(LOGIN_PATH)}
                    >
                      Log in to upload CV
                    </Button>

                    <Button
                      h="52px"
                      px={7}
                      borderRadius="16px"
                      variant="outline"
                      borderColor="whiteAlpha.600"
                      color="white"
                      fontWeight="900"
                      leftIcon={<FiUserPlus />}
                      _hover={{
                        bg: "rgba(255,255,255,0.12)",
                        borderColor: "white",
                      }}
                      onClick={() => navigate(REGISTER_PATH)}
                    >
                      Sign in
                    </Button>
                  </HStack>
                </Box>

                <Box
                  display={{ base: "none", md: "block" }}
                  position="relative"
                  zIndex={1}
                >
                  <Box
                    bg="rgba(255,255,255,0.12)"
                    border="1px solid rgba(255,255,255,0.20)"
                    borderRadius="26px"
                    p={6}
                    backdropFilter="blur(16px)"
                  >
                    <Box
                      bg="white"
                      borderRadius="22px"
                      p={6}
                      color="#1E293B"
                      boxShadow="0 18px 45px rgba(15, 23, 42, 0.18)"
                    >
                      <HStack justify="space-between" mb={5}>
                        <HStack>
                          <Box
                            w="42px"
                            h="42px"
                            borderRadius="14px"
                            display="grid"
                            placeItems="center"
                            bg="#EEF4FF"
                            color="#334371"
                          >
                            <Icon as={FiUploadCloud} boxSize={6} />
                          </Box>

                          <Box>
                            <Text fontWeight="950">My CV</Text>
                            <Text fontSize="sm" color="#64748B">
                              Ready for matching
                            </Text>
                          </Box>
                        </HStack>

                        <Box
                          px={3}
                          py={1}
                          borderRadius="999px"
                          bg="#EEF2FF"
                          color="#334371"
                          fontSize="xs"
                          fontWeight="900"
                        >
                          Secure
                        </Box>
                      </HStack>

                      <VStack align="stretch" spacing={3}>
                        <Box h="10px" borderRadius="999px" bg="#E2E8F0" />
                        <Box h="10px" w="82%" borderRadius="999px" bg="#E2E8F0" />
                        <Box h="10px" w="64%" borderRadius="999px" bg="#E2E8F0" />
                      </VStack>

                      <HStack mt={6} spacing={3}>
                        <Box flex={1} h="10px" borderRadius="999px" bg="#C7D2FE" />
                        <Box flex={1} h="10px" borderRadius="999px" bg="#DBEAFE" />
                        <Box flex={1} h="10px" borderRadius="999px" bg="#FFE4E6" />
                      </HStack>
                    </Box>
                  </Box>
                </Box>
              </SimpleGrid>
            </Box>

          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            {benefits.map((item) => (
              <Box
                key={item.title}
                bg="white"
                border="1px solid #E2E8F0"
                borderRadius="24px"
                p={{ base: 6, md: 8 }}
                minH="210px"
                boxShadow="0 12px 28px rgba(15, 23, 42, 0.05)"
                transition="all 0.2s ease"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.09)",
                  borderColor: "#CBD5E1",
                }}
              >
                <VStack align="center" spacing={4} textAlign="center">
                  <Box
                    w="58px"
                    h="58px"
                    borderRadius="999px"
                    display="grid"
                    placeItems="center"
                    bg={item.bg}
                    color={item.color}
                  >
                    <Icon as={item.icon} boxSize={7} />
                  </Box>

                  <Box>
                    <Text fontSize="lg" fontWeight="950" color="#1E293B">
                      {item.title}
                    </Text>

                    <Text mt={3} color="#64748B" lineHeight="1.7">
                      {item.description}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}