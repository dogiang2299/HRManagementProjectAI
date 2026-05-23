import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiLock, FiPhone, FiShield, FiUserCheck } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { useAuthStore } from "../../../auth/store/auth.store";
import { candidateAuthApi } from "../api/auth.api";

type CandidateLoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CandidateLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: CandidateLoginModalProps) {
  const notify = useNotify();
  const loginAction = useAuthStore((state) => state.login);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setPhone("");
    setPassword("");
    setShowPassword(false);
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const onSubmit = async () => {
    if (!phone.trim() || !password) {
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

      resetForm();
      onClose();
      onSuccess?.();
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
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay
        bg="rgba(15, 23, 42, 0.42)"        
      />

      <ModalContent
        maxW={{ base: "calc(100vw - 28px)", md: "500px" }}
        borderRadius="22px"
        overflow="hidden"
        border="1px solid rgba(226, 232, 240, 0.9)"
        boxShadow="0 22px 60px rgba(15, 23, 42, 0.22)"
        bg="white"
      >
        <ModalCloseButton
          top="14px"
          right="14px"
          borderRadius="full"
          isDisabled={isLoading}
          bg="whiteAlpha.900"
          color="#334371"
          _hover={{ bg: "white" }}
          zIndex={2}
        />

        <Box
          position="relative"
          px={{ base: 5, md: 6 }}
          pt={{ base: 6, md: 6 }}
          pb={{ base: 5, md: 5 }}
          color="white"
          bg="linear-gradient(135deg, #334371 0%, #40517A 62%, #6F7EAA 135%)"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="-76px"
            right="-74px"
            w="190px"
            h="190px"
            borderRadius="999px"
            bg="rgba(255,255,255,0.10)"
          />
          <Box
            position="absolute"
            bottom="-100px"
            left="-86px"
            w="210px"
            h="210px"
            borderRadius="999px"
            bg="rgba(255,255,255,0.07)"
          />

          <VStack align="stretch" spacing={3.5} position="relative" zIndex={1}>
            <HStack spacing={2.5}>
              <Box
                w="44px"
                h="44px"
                borderRadius="15px"
                display="grid"
                placeItems="center"
                bg="rgba(255,255,255,0.16)"
                border="1px solid rgba(255,255,255,0.18)"
              >
                <Icon as={FiUserCheck} boxSize={5} />
              </Box>

              <Box>
                <Text
                  fontSize="10px"
                  fontWeight="900"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  color="whiteAlpha.800"
                >
                  Candidate Portal
                </Text>
                <Heading mt={1} fontSize={{ base: "xl", md: "2xl" }} lineHeight="1.1">
                  Login to continue
                </Heading>
              </Box>
            </HStack>

            <Text
              maxW="520px"
              fontSize="sm"
              lineHeight="1.65"
              color="whiteAlpha.850"
              fontWeight="500"
            >
              Sign in to apply jobs, manage your CV, and receive better IT job
              recommendations based on your profile.
            </Text>

            <HStack spacing={2} flexWrap="wrap" pt={0.5}>
              <HStack
                px={2.5}
                py={1.5}
                borderRadius="999px"
                bg="rgba(255,255,255,0.14)"
                border="1px solid rgba(255,255,255,0.18)"
              >
                <Icon as={FiShield} boxSize={3.5} />
                <Text fontSize="12.5px" fontWeight="800">
                  Secure candidate access
                </Text>
              </HStack>

              <HStack
                px={2.5}
                py={1.5}
                borderRadius="999px"
                bg="rgba(255,255,255,0.14)"
                border="1px solid rgba(255,255,255,0.18)"
              >
                <Icon as={FiLock} boxSize={3.5} />
                <Text fontSize="12.5px" fontWeight="800">
                  Stay on this page after login
                </Text>
              </HStack>
            </HStack>
          </VStack>
        </Box>

        <ModalBody px={{ base: 5, md: 6 }} py={{ base: 5, md: 5 }}>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontSize="md" fontWeight="950" color="#1E293B">
                Welcome back
              </Text>
              <Text mt={1} fontSize="sm" color="#64748B" fontWeight="600">
                Enter your candidate account information to continue.
              </Text>
            </Box>

            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="800" color="#334155" mb={1.5}>
                  Phone number
                </FormLabel>

                <InputGroup>
                  <InputLeftElement h="42px" pointerEvents="none">
                    <Icon as={FiPhone} color="#94A3B8" boxSize={4} />
                  </InputLeftElement>

                  <Input
                    h="42px"
                    pl="40px"
                    borderRadius="13px"
                    borderColor="#D8E0EC"
                    bg="#F8FAFC"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    fontSize="sm"
                    fontWeight="700"
                    color="#1E293B"
                    _placeholder={{ color: "#94A3B8", fontWeight: "600" }}
                    _hover={{ borderColor: "#CBD5E1" }}
                    _focusVisible={{
                      bg: "white",
                      borderColor: "#334371",
                      boxShadow: "0 0 0 4px rgba(51, 67, 113, 0.12)",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="800" color="#334155" mb={1.5}>
                  Password
                </FormLabel>

                <InputGroup>
                  <InputLeftElement h="42px" pointerEvents="none">
                    <Icon as={FiLock} color="#94A3B8" boxSize={4} />
                  </InputLeftElement>

                  <Input
                    h="42px"
                    pl="40px"
                    pr="48px"
                    type={showPassword ? "text" : "password"}
                    borderRadius="13px"
                    borderColor="#D8E0EC"
                    bg="#F8FAFC"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    fontSize="sm"
                    fontWeight="700"
                    color="#1E293B"
                    _placeholder={{ color: "#94A3B8", fontWeight: "600" }}
                    _hover={{ borderColor: "#CBD5E1" }}
                    _focusVisible={{
                      bg: "white",
                      borderColor: "#334371",
                      boxShadow: "0 0 0 4px rgba(51, 67, 113, 0.12)",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                  />

                  <InputRightElement h="42px" pr={1}>
                    <IconButton
                      aria-label="Toggle password visibility"
                      variant="ghost"
                      size="sm"
                      color="#64748B"
                      borderRadius="12px"
                      onClick={() => setShowPassword((value) => !value)}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      _hover={{ bg: "#EEF2FF", color: "#334371" }}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>

            <Button
              h="44px"
              borderRadius="13px"
              bg="#334371"
              color="white"
              fontWeight="950"
              fontSize="sm"
              boxShadow="0 10px 22px rgba(51, 67, 113, 0.22)"
              _hover={{
                bg: "#26345A",
                transform: "translateY(-1px)",
                boxShadow: "0 18px 34px rgba(51, 67, 113, 0.30)",
              }}
              _active={{
                bg: "#1F2B4A",
                transform: "translateY(0)",
              }}
              onClick={onSubmit}
              isLoading={isLoading}
              loadingText="Logging in..."
            >
              Login and continue
            </Button>

            <HStack spacing={3}>
              <Divider />
              <Text
                whiteSpace="nowrap"
                fontSize="10px"
                color="#94A3B8"
                fontWeight="800"
              >
                NEW TO ITJOB?
              </Text>
              <Divider />
            </HStack>

            <Box
              bg="#F8FAFC"
              border="1px solid #E2E8F0"
              borderRadius="15px"
              px={3}
              py={3}
            >
              <HStack
                justify="space-between"
                align={{ base: "start", sm: "center" }}
                spacing={4}
                flexDirection={{ base: "column", sm: "row" }}
              >
                <Box>
                  <Text fontSize="sm" color="#1E293B" fontWeight="900">
                    Do not have a candidate account?
                  </Text>
                  <Text mt={1} fontSize="sm" color="#64748B" fontWeight="600" lineHeight="1.45">
                    Create one to upload CV and apply for IT jobs faster.
                  </Text>
                </Box>

                <Button
                  as={RouterLink}
                  to="/it-job/register"
                  h="34px"
                  px={4}
                  borderRadius="12px"
                  variant="outline"
                  borderColor="#CBD5E1"
                  color="#334371"
                  fontWeight="900"
                  fontSize="sm"
                  flexShrink={0}
                  _hover={{
                    bg: "#EEF2FF",
                    borderColor: "#334371",
                    textDecoration: "none",
                  }}
                >
                  Register now
                </Button>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
