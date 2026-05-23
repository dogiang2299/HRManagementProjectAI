import { useState } from "react";
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  Checkbox,
  Link,
  Image,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { authApi } from "../api/auth.api";
import { useNotify } from "../../../components/notification/NotifyProvider";
import { logo } from "../../../assets/logo";
import { ButtonConfig } from "../../../components/common/Button";
import { RECRUIT_BASE_ROLE } from "../../../constant/roles";
import { colors } from "../../../theme/colors";

const LoginView = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tempUserId, setTempUserId] = useState("");

  const navigate = useNavigate();
  const notify = useNotify();
  const loginAction = useAuthStore((state) => state.login);

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/^84/, "0");
  };

  const hideBrowserEyeStyles = {
    "&::-ms-reveal": {
      display: "none",
    },
    "&::-ms-clear": {
      display: "none",
    },
  };

  const handleContinue = async () => {
    if (!phoneNumber) {
      notify({ message: "Please enter your phone number", type: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const userData = await authApi.checkUser(formattedPhone);

      if (userData && userData.name) {
        setDisplayName(userData.name);
      } else {
        setDisplayName(formattedPhone);
      }

      setStep(2);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Account not found or invalid phone number";
      notify({
        message: "Error",
        description: msg,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setPassword("");
    setDisplayName("");
  };

  const handleLogin = async () => {
    if (!password) {
      notify({ message: "Please enter your password", type: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const data = await authApi.login(formattedPhone, password);

      if (data.require_change_password) {
        setTempUserId(data.user_id ?? "");
        setStep(3);
        notify({
          message: "Action Required",
          description: "This is your first login. Please change your password.",
          type: "info",
        });
        setIsLoading(false);
        return;
      }

      if (!data?.accessToken || !data?.user) {
        notify({ message: "Login failed", type: "error" });
        return;
      }

      // 2) loginAction giờ chắc chắn nhận string và user không undefined
      loginAction(data.accessToken, data.user);
      notify({ message: "Login successful", type: "success" });

      const roleNames = (data.user.roles ?? [])
        .map((r: any) => r?.role?.name_role)
        .filter(Boolean) as string[];

      // 4) Check role theo string
      if (roleNames.includes(RECRUIT_BASE_ROLE.Admin)) {
        navigate("/");
      } else if (roleNames.includes(RECRUIT_BASE_ROLE.Employee)) {
        navigate("/");
      } else if (roleNames.includes(RECRUIT_BASE_ROLE.Employer)) {
        navigate("/");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      let msg =
        error.message || error.response?.data?.message || "Login failed";
      if (Array.isArray(msg)) msg = msg.join(", ");

      notify({
        message: "Error",
        description: msg,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      notify({
        message: "Password must be at least 6 characters",
        type: "warning",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      notify({ message: "Passwords do not match", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword(tempUserId, newPassword);

      notify({
        message: "Success",
        description:
          "Password updated successfully. Please login with your new password.",
        type: "success",
      });

      setStep(2);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to update password";
      notify({ message: "Error", description: msg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH={"100vh"}
      direction="column"
      align={"center"}
      justify={"center"}
      bg={colors.bgColors.light}
      position="relative"
    >
      <Stack
        spacing={4}
        mx={"auto"}
        maxW={"lg"}
        py={12}
        px={6}
        w="full"
        align="center"
      >
        <Box mb={4}>
          <Image
            src={logo}
            alt="BlueOC Logo"
            w={{ base: "120px", md: "200px" }}
            h="auto"
            maxH="200px"
            objectFit="contain"
          />
        </Box>

        {step === 1 && (
          <Box w="full" maxW="400px">
            <Stack align={"center"} mb={8}>
              <Heading fontSize={"2xl"} fontWeight={500}>
                Welcome back
              </Heading>
            </Stack>

            <Stack spacing={5}>
              <FormControl id="phone">
                <FormLabel fontSize="sm" color="gray.600" ml={1}>
                  Phone Number
                </FormLabel>
                <Input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                  placeholder="Enter your phone number"
                  size="lg"
                  borderRadius="md"
                  borderColor="gray.400"
                  _focus={{
                    borderColor: colors.baseColors.primary,
                    boxShadow: "none",
                  }}
                />
              </FormControl>

              <Flex justify="space-between" align="center" fontSize="sm">
                <Checkbox colorScheme="blue">Remember me</Checkbox>
              </Flex>

              <ButtonConfig
                bg={colors.baseColors.primary}
                color={"white"}
                size="lg"
                fontSize="md"
                onClick={handleContinue}
                isLoading={isLoading}
                _hover={{ bg: "blue.800" }}
                borderRadius="md"
              >
                Continue
              </ButtonConfig>
            </Stack>
          </Box>
        )}

        {step === 2 && (
          <Box w="full" maxW="400px">
            <Stack align={"center"} mb={8} spacing={3}>
              <Text fontSize={"lg"}>
                Hi{" "}
                <Text as="span" fontWeight="bold">
                  {displayName}
                </Text>{" "}
                !
              </Text>
            </Stack>

            <Stack spacing={4}>
              <FormControl id="password">
                <FormLabel fontSize="sm" color="gray.600" ml={1}>
                  Password
                </FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    borderRadius="md"
                    borderColor="gray.400"
                    _focus={{
                      borderColor: colors.baseColors.primary,
                      boxShadow: "none",
                    }}
                    sx={hideBrowserEyeStyles}
                  />
                  <InputRightElement width="3rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      aria-label={showPassword ? "Hide" : "Show"}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Flex justify="space-between" align="center" fontSize="sm">
                <Link
                  color="blue.600"
                  fontSize="sm"
                  onClick={handleBackToEmail}
                >
                  Back to login
                </Link>
                <Link color="blue.600">Forgot password</Link>
              </Flex>

              <ButtonConfig
                bg={colors.baseColors.primary}
                color={"white"}
                size="lg"
                fontSize="md"
                isLoading={isLoading}
                onClick={handleLogin}
                _hover={{ bg: "blue.800" }}
                borderRadius="md"
                mt={2}
              >
                Login
              </ButtonConfig>
            </Stack>
          </Box>
        )}

        {step === 3 && (
          <Box w="full" maxW="400px">
            <Stack align={"center"} mb={6} spacing={2}>
              <Heading fontSize={"xl"} fontWeight={600}>
                Change Password
              </Heading>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                For security, please create a new password for your first login.
              </Text>
            </Stack>

            <Stack spacing={4}>
              <FormControl id="new-password">
                <FormLabel fontSize="sm" color="gray.600" ml={1}>
                  New Password
                </FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    borderRadius="md"
                    borderColor="gray.400"
                    _focus={{
                      borderColor: colors.baseColors.primary,
                      boxShadow: "none",
                    }}
                    sx={hideBrowserEyeStyles}
                  />
                  <InputRightElement width="3rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                      aria-label={showNewPassword ? "Hide" : "Show"}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl id="confirm-password">
                <FormLabel fontSize="sm" color="gray.600" ml={1}>
                  Confirm Password
                </FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    borderRadius="md"
                    borderColor="gray.400"
                    _focus={{
                      borderColor: colors.baseColors.primary,
                      boxShadow: "none",
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleChangePassword()
                    }
                    sx={hideBrowserEyeStyles}
                  />
                  <InputRightElement width="3rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      icon={
                        showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />
                      }
                      aria-label={showConfirmPassword ? "Hide" : "Show"}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <ButtonConfig
                bg={colors.baseColors.primary}
                color={"white"}
                size="lg"
                fontSize="md"
                isLoading={isLoading}
                onClick={handleChangePassword}
                _hover={{ bg: "blue.800" }}
                borderRadius="md"
                mt={2}
              >
                Update Password
              </ButtonConfig>

              <Box textAlign="center">
                <Link
                  color="gray.500"
                  fontSize="sm"
                  onClick={handleBackToEmail}
                >
                  Cancel and return to start
                </Link>
              </Box>
            </Stack>
          </Box>
        )}
      </Stack>

      <Box position="absolute" bottom={5}>
        <Text fontSize="xs" color="gray.500">
          Copyright © 2025 - All rights reserved
        </Text>
      </Box>
    </Flex>
  );
};

export default LoginView;
