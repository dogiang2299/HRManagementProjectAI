import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Link,
  Flex,
  VStack,
  InputGroup,
  InputRightElement,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { candidateAuthApi } from "../api/auth.api";
import { useNotify } from "../../../../components/notification/NotifyProvider";

export default function CandidateRegisterView() {
  const navigate = useNavigate();
  const notify = useNotify();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !phone || !password) {
      notify({ message: "Please fill all required fields", type: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = phone.replace(/^84/, "0").trim();

      await candidateAuthApi.register({
        employee_name: fullName.trim() || undefined,
        email_account: email.trim(),
        phone_account: formattedPhone,
        password,
      });

      notify({ message: "Register successful", type: "success" });
      navigate("/it-job/login");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || "Register failed";

      notify({
        message: "Error",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      bg="#F4F7FB"
      align="center"
      justify="center"
      px={{ base: 4, md: 6 }}
      py={{ base: 6, md: 10 }}
    >
      <Flex
        w="full"
        maxW="1100px"
        minH={{ base: "auto", lg: "660px" }}
        bg="white"
        border="1px solid"
        borderColor="#E5E7EB"
        borderRadius="24px"
        overflow="hidden"
        boxShadow="0 20px 60px rgba(15, 23, 42, 0.08)"
        direction={{ base: "column", lg: "row" }}
      >
        {/* LEFT - FORM */}
        <Flex
          flex="1"
          bg="white"
          px={{ base: 5, md: 8, lg: 10 }}
          py={{ base: 8, md: 10 }}
          align="center"
          justify="center"
        >
          <Box w="full" maxW="440px">
            <VStack align="stretch" spacing={6}>
              <VStack spacing={2} align="stretch">
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  color="#334371"
                  letterSpacing="0.04em"
                  textTransform="uppercase"
                >
                  Candidate Portal
                </Text>

                <Heading
                  fontSize={{ base: "2xl", md: "3xl" }}
                  color="#111827"
                  lineHeight="1.2"
                >
                  Create your account
                </Heading>

                <Text fontSize="sm" color="#6B7280">
                  Start building your profile and explore suitable job opportunities.
                </Text>
              </VStack>

              <Stack spacing={4}>
                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="600"
                    color="#374151"
                    mb={2}
                  >
                    Full name
                  </FormLabel>
                  <Input
                    h="46px"
                    borderRadius="12px"
                    borderColor="#D1D5DB"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    _hover={{ borderColor: "#CBD5E1" }}
                    _focusVisible={{
                      borderColor: "#334371",
                      boxShadow: "0 0 0 3px rgba(51, 67, 113, 0.14)",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="600"
                    color="#374151"
                    mb={2}
                  >
                    Email
                  </FormLabel>
                  <Input
                    h="46px"
                    borderRadius="12px"
                    borderColor="#D1D5DB"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    _hover={{ borderColor: "#CBD5E1" }}
                    _focusVisible={{
                      borderColor: "#334371",
                      boxShadow: "0 0 0 3px rgba(51, 67, 113, 0.14)",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="600"
                    color="#374151"
                    mb={2}
                  >
                    Phone number
                  </FormLabel>
                  <Input
                    h="46px"
                    borderRadius="12px"
                    borderColor="#D1D5DB"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    _hover={{ borderColor: "#CBD5E1" }}
                    _focusVisible={{
                      borderColor: "#334371",
                      boxShadow: "0 0 0 3px rgba(51, 67, 113, 0.14)",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="600"
                    color="#374151"
                    mb={2}
                  >
                    Password
                  </FormLabel>
                  <InputGroup>
                    <Input
                      h="46px"
                      type={showPassword ? "text" : "password"}
                      borderRadius="12px"
                      borderColor="#D1D5DB"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      pr="48px"
                      _hover={{ borderColor: "#CBD5E1" }}
                      _focusVisible={{
                        borderColor: "#334371",
                        boxShadow: "0 0 0 3px rgba(51, 67, 113, 0.14)",
                      }}
                      onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                    />
                    <InputRightElement h="46px">
                      <IconButton
                        aria-label="toggle password"
                        variant="ghost"
                        size="sm"
                        color="#6B7280"
                        onClick={() => setShowPassword((s) => !s)}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </Stack>

              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="#6B7280">
                  Quick and secure registration
                </Text>
              </HStack>

              <Button
                h="48px"
                borderRadius="12px"
                bg="#334371"
                color="white"
                fontWeight="700"
                _hover={{ bg: "#26345A" }}
                _active={{ bg: "#1F2B4A" }}
                onClick={onSubmit}
                isLoading={isLoading}
              >
                Register
              </Button>

              <Text fontSize="sm" textAlign="center" color="#6B7280">
                Already have an account?{" "}
                <Link
                  as={RouterLink}
                  to="/it-job/login"
                  color="#334371"
                  fontWeight="700"
                  _hover={{ color: "#26345A", textDecoration: "none" }}
                >
                  Login now
                </Link>
              </Text>
            </VStack>
          </Box>
        </Flex>

        {/* RIGHT - BRAND PANEL */}
<Box
  flex="1"
  position="relative"
  display={{ base: "none", lg: "block" }}
  overflow="hidden"
  bg="#334371"
>
  <Box
    position="absolute"
    inset="0"
    bgImage="url('/login.png')"
    bgSize="cover"
    bgPosition="center"
    transform="scale(1.02)"
  />

  <Box
    position="absolute"
    inset="0"
    bg="linear-gradient(180deg, rgba(17,24,39,0.10) 0%, rgba(17,24,39,0.28) 38%, rgba(17,24,39,0.72) 100%)"
  />


          <Flex position="relative" h="full" p={10} align="flex-end">
            <VStack align="start" spacing={4} color="white" maxW="420px">
              <Text
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.12em"
                fontWeight="700"
                color="rgba(255,255,255,0.75)"
              >
                IT Job Platform
              </Text>

              <Heading fontSize="3xl" lineHeight="1.25">
                Take the first step toward your next career opportunity
              </Heading>

              <Text
                fontSize="sm"
                color="rgba(255,255,255,0.82)"
                lineHeight="1.8"
              >
                Create your account to discover jobs, connect with recruiters,
                and manage your candidate profile in one place.
              </Text>

              <HStack spacing={3} pt={2} flexWrap="wrap">
                <Box
                  px={3}
                  py={2}
                  borderRadius="12px"
                  bg="rgba(255,255,255,0.12)"
                  backdropFilter="blur(8px)"
                  fontSize="sm"
                  fontWeight="600"
                >
                  Create Profile
                </Box>
                <Box
                  px={3}
                  py={2}
                  borderRadius="12px"
                  bg="rgba(255,255,255,0.12)"
                  backdropFilter="blur(8px)"
                  fontSize="sm"
                  fontWeight="600"
                >
                  Discover Jobs
                </Box>
                <Box
                  px={3}
                  py={2}
                  borderRadius="12px"
                  bg="rgba(255,255,255,0.12)"
                  backdropFilter="blur(8px)"
                  fontSize="sm"
                  fontWeight="600"
                >
                  Apply Faster
                </Box>
              </HStack>
            </VStack>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
}