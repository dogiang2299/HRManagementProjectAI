import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  IconButton,
  Link,
  Flex,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { candidateAuthApi } from "../api/auth.api";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { useAuthStore } from "../../../auth/store/auth.store";
import { candidateHomeUrl } from "../../../../routes/urls";
import { followCompany } from "../../company/api/companyFollow";

const PENDING_FOLLOW_KEY = "pending-company-follow";

export default function CandidateLoginView() {
  const navigate = useNavigate();
  const notify = useNotify();
  const loginAction = useAuthStore((state) => state.login);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    if (!phone || !password) {
      notify({ message: "Please enter phone and password", type: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = phone.replace(/^84/, "0").trim();
      const data = await candidateAuthApi.login({
        phone_account: formattedPhone,
        password,
      });

      if (!data?.accessToken || !data?.user) {
        notify({ message: "Login failed", type: "error" });
        return;
      }

      loginAction(data.accessToken, data.user);
      notify({ message: "Login successful", type: "success" });

      const pendingFollowRaw = sessionStorage.getItem(PENDING_FOLLOW_KEY);
      if (pendingFollowRaw) {
        try {
          const pendingFollow = JSON.parse(pendingFollowRaw) as {
            companyId?: string;
            returnTo?: string;
          };

          if (pendingFollow.companyId) {
            try {
              await followCompany(pendingFollow.companyId);
              notify({ message: "Followed the company", type: "success" });
            } catch (followError: any) {
              const followMessage =
                followError?.response?.data?.message ||
                followError?.message ||
                "The company cannot be tracked at this time";
              notify({
                message: "Track failed companies",
                description: Array.isArray(followMessage)
                  ? followMessage.join(", ")
                  : followMessage,
                type: "warning",
              });
            } finally {
              sessionStorage.removeItem(PENDING_FOLLOW_KEY);
            }

            navigate(pendingFollow.returnTo || candidateHomeUrl, {
              replace: true,
            });
            return;
          }
        } catch {
          sessionStorage.removeItem(PENDING_FOLLOW_KEY);
        }
      }

      navigate(candidateHomeUrl);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || "Login failed";
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
        minH={{ base: "auto", lg: "620px" }}
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
          <Box w="full" maxW="420px">
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
                  Welcome back
                </Heading>

                <Text fontSize="sm" color="#6B7280">
                  Sign in to continue your job search journey.
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

                <FormControl>
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
                      placeholder="Enter your password"
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
                  Secure candidate login
                </Text>
                <Link
                  fontSize="sm"
                  color="#334371"
                  fontWeight="600"
                  _hover={{ textDecoration: "none", color: "#26345A" }}
                >
                  Forgot password?
                </Link>
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
                Login
              </Button>

              <Text fontSize="sm" textAlign="center" color="#6B7280">
                Do not have an account?{" "}
                <Link
                  as={RouterLink}
                  to="/it-job/register"
                  color="#334371"
                  fontWeight="700"
                  _hover={{ color: "#26345A", textDecoration: "none" }}
                >
                  Register now
                </Link>
              </Text>
            </VStack>
          </Box>
        </Flex>

{/* RIGHT - BRAND / IMAGE PANEL */}
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

  <Flex
    position="relative"
    h="full"
    p={10}
    align="flex-end"
  >
    <VStack align="start" spacing={4} color="white" maxW="420px">
      <Text
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.14em"
        fontWeight="700"
        color="rgba(255,255,255,0.78)"
      >
        IT JOB PLATFORM
      </Text>

      <Heading fontSize="3xl" lineHeight="1.2">
        Find opportunities that match your skills
      </Heading>

      <Text
        fontSize="sm"
        color="rgba(255,255,255,0.88)"
        lineHeight="1.8"
      >
        Build your profile, explore suitable jobs, and connect with recruiters.
      </Text>
    </VStack>
  </Flex>
</Box>
      </Flex>
    </Flex>
  );
}