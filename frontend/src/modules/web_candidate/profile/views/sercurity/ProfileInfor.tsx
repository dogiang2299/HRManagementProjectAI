import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiCamera,
  FiCheckCircle,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import {
  getCandidateAvatarUrl,
  useGetMyCandidateProfile,
  useUpdateMyCandidateBasicInfo,
  useUploadMyAvatar,
} from "../../api/myCv";

export default function ProfileInfor() {
  const notify = useNotify();
  const profileQuery = useGetMyCandidateProfile();
  const updateBasicInfoMutation = useUpdateMyCandidateBasicInfo();
  const uploadAvatarMutation = useUploadMyAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const profile = profileQuery.data;
  const email = profile?.email || profile?.employee?.email_account || "";

  const [candidateName, setCandidateName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [formErrors, setFormErrors] = useState<{
    candidateName?: string;
    phoneNumber?: string;
  }>({});

  useEffect(() => {
    setCandidateName(
      profile?.candidate_name || profile?.employee?.employee_name || "",
    );
    setPhoneNumber(profile?.phone_number || profile?.employee?.phone_account || "");
    setAvatarPreview(getCandidateAvatarUrl(profile?.avatar_file));
    setAvatarFile(null);
  }, [
    profile?.avatar_file,
    profile?.candidate_name,
    profile?.employee?.employee_name,
    profile?.employee?.phone_account,
    profile?.phone_number,
  ]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const validateBasicInfo = () => {
    const errors: typeof formErrors = {};
    const nextName = candidateName.trim();
    const nextPhone = phoneNumber.trim();

    if (!nextName) {
      errors.candidateName = "Please enter your full name";
    }

    if (!nextPhone) {
      errors.phoneNumber = "Please enter your phone number";
    } else if (!/^[0-9]{9,15}$/.test(nextPhone)) {
      errors.phoneNumber = "Phone number must contain 9-15 digits";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify({
        message: "Invalid avatar file",
        description: "Please select a JPG, PNG, or WEBP image.",
        type: "error",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify({
        message: "Avatar file is too large",
        description: "Maximum image size is 5MB.",
        type: "error",
      });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveBasicInfo = async () => {
    if (!validateBasicInfo()) return;

    try {
      await updateBasicInfoMutation.mutateAsync({
        candidate_name: candidateName.trim(),
        phone_number: phoneNumber.trim(),
      });

      if (avatarFile) {
        await uploadAvatarMutation.mutateAsync(avatarFile);
      }

      notify({
        message: "Personal information updated successfully",
        type: "success",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to update personal information";

      notify({
        message: "Personal information update failed",
        description: Array.isArray(message) ? message.join(", ") : message,
        type: "error",
      });
    }
  };

  const isLoading = profileQuery.isLoading;
  const isSavingBasicInfo =
    updateBasicInfoMutation.isPending || uploadAvatarMutation.isPending;

  if (isLoading) {
    return (
      <Box minH="100vh" py={{ base: 5, md: 7 }}>
        <Container maxW="1080px" px={{ base: 4, md: 6 }}>
          <Stack align="center" justify="center" minH="50vh">
            <Spinner thickness="3px" color="#334371" size="xl" />
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" py={{ base: 4, md: 7 }}>
      <Container maxW="1200px">
        <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={3} alignItems="start">
          <Box gridColumn={{ base: "auto", lg: "span 8" }}>
            <VStack align="stretch" spacing={3}>
              <Box
                bg="white"
                border="1px solid #E2E8F0"
                borderRadius="22px"
                overflow="hidden"
                boxShadow="0 18px 45px rgba(15, 23, 42, 0.07)"
              >
                <Box
                  bg="linear-gradient(135deg, #334371 0%, #223052 58%, #50669F 145%)"
                  color="white"
                  px={{ base: 4, md: 6 }}
                  py={{ base: 5, md: 6 }}
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    right="-70px"
                    top="-70px"
                    w="210px"
                    h="210px"
                    borderRadius="999px"
                    bg="rgba(255,255,255,0.11)"
                  />

                  <Box
                    position="absolute"
                    left="-90px"
                    bottom="-110px"
                    w="260px"
                    h="260px"
                    borderRadius="999px"
                    bg="rgba(255,255,255,0.08)"
                  />

                  <HStack position="relative" zIndex={1} spacing={3} align="center">
                    <Box
                      w="46px"
                      h="46px"
                      borderRadius="14px"
                      display="grid"
                      placeItems="center"
                      bg="rgba(255,255,255,0.16)"
                      border="1px solid rgba(255,255,255,0.2)"
                      flexShrink={0}
                    >
                      <Icon as={FiUser} boxSize={6} />
                    </Box>

                    <Box>
                      <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.14em"
                        color="whiteAlpha.800"
                        fontWeight="800"
                      >
                        Candidate profile
                      </Text>

                      <Heading
                        mt={1}
                        fontSize={{ base: "xl", md: "2xl" }}
                        letterSpacing="-0.03em"
                      >
                        Personal information settings
                      </Heading>

                      <Text mt={2} color="whiteAlpha.850" fontWeight="500">
                        Update the basic information for your candidate account.
                      </Text>
                    </Box>
                  </HStack>
                </Box>

                <Box p={{ base: 4, md: 6 }}>
                  <VStack align="stretch" spacing={3}>
                    <Box>
                      <HStack justify="space-between" align="start" mb={4}>
                        <Box>
                          <Text fontSize="md" fontWeight="650" color="#1E293B">
                            Personal information
                          </Text>

                          <Text
                            mt={1}
                            color="#64748B"
                            fontSize="sm"
                            fontWeight="600"
                          >
                            This information helps recruiters identify your
                            profile.
                          </Text>
                        </Box>

                        <Badge
                          px={3}
                          py={1.5}
                          borderRadius="999px"
                          bg="#EEF2FF"
                          color="#334371"
                          textTransform="none"
                          fontWeight="800"
                        >
                          Verified
                        </Badge>
                      </HStack>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <FormControl isInvalid={Boolean(formErrors.candidateName)}>
                          <FormLabel color="#334155" fontWeight="650">
                            Full name <Text as="span" color="#E11D48">*</Text>
                          </FormLabel>

                          <InputGroup>
                            <InputLeftElement h="46px" pointerEvents="none">
                              <Icon as={FiUser} color="#94A3B8" />
                            </InputLeftElement>

                            <Input
                              h="46px"
                              pl="40px"
                              bg="#F8FAFC"
                              borderColor="#D8E0EC"
                              borderRadius="13.5px"
                              color="#1E293B"
                              fontWeight="650"
                              value={candidateName}
                              onChange={(event) =>
                                setCandidateName(event.target.value)
                              }
                              fontSize={14.5}
                              placeholder="Enter your full name"
                              _placeholder={{
                                color: "#94A3B8",
                                fontWeight: "500",
                              }}
                              _hover={{ borderColor: "#CBD5E1" }}
                              _focusVisible={{
                                bg: "white",
                                borderColor: "#334371",
                                boxShadow:
                                  "0 0 0 4px rgba(51, 67, 113, 0.12)",
                              }}
                            />
                          </InputGroup>

                          <FormErrorMessage>
                            {formErrors.candidateName}
                          </FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={Boolean(formErrors.phoneNumber)}>
                          <FormLabel color="#334155" fontWeight="650">
                            Phone number <Text as="span" color="#E11D48">*</Text>
                          </FormLabel>

                          <InputGroup>
                            <InputLeftElement h="46px" pointerEvents="none">
                              <Icon as={FiPhone} color="#94A3B8" />
                            </InputLeftElement>

                            <Input
                              h="46px"
                              pl="40px"
                              bg="#F8FAFC"
                              borderColor="#D8E0EC"
                              borderRadius="14px"
                              color="#1E293B"
                              fontWeight="600"
                              value={phoneNumber}
                              onChange={(event) =>
                                setPhoneNumber(event.target.value)
                              }
                              fontSize={14.5}
                              placeholder="Enter your phone number"
                              _placeholder={{
                                color: "#94A3B8",
                                fontWeight: "500",
                              }}
                              _hover={{ borderColor: "#CBD5E1" }}
                              _focusVisible={{
                                bg: "white",
                                borderColor: "#334371",
                                boxShadow:
                                  "0 0 0 4px rgba(51, 67, 113, 0.12)",
                              }}
                            />
                          </InputGroup>

                          <FormErrorMessage>
                            {formErrors.phoneNumber}
                          </FormErrorMessage>
                        </FormControl>

                        <FormControl gridColumn={{ base: "auto", md: "1 / -1" }}>
                          <FormLabel color="#334155" fontWeight="650">
                            Email
                          </FormLabel>

                          <InputGroup>
                            <InputLeftElement h="46px" pointerEvents="none">
                              <Icon as={FiMail} color="#94A3B8" />
                            </InputLeftElement>

                            <Input
                              h="46px"
                              pl="40px"
                              bg="#F1F5F9"
                              borderColor="#E2E8F0"
                              borderRadius="14px"
                              color="#94A3B8"
                              fontWeight="600"
                              value={email}
                              isReadOnly
                              fontSize={14.5}
                              placeholder="Email"
                            />
                          </InputGroup>

                          <Text
                            mt={2}
                            color="#94A3B8"
                            fontSize="xs"
                            fontWeight="650"
                          >
                            Email is used to verify your account and cannot be
                            edited here.
                          </Text>
                        </FormControl>
                      </SimpleGrid>

                      <HStack mt={5} justify="flex-end">
                        <Button
                          h="44px"
                          px={5}
                          borderRadius="14px"
                          bg="#334371"
                          color="white"
                          fontWeight="650"
                          isLoading={isSavingBasicInfo}
                          loadingText="Saving..."
                          _hover={{
                            bg: "#26345A",
                            transform: "translateY(-1px)",
                            boxShadow:
                              "0 12px 24px rgba(51, 67, 113, 0.24)",
                          }}
                          onClick={handleSaveBasicInfo}
                        >
                          SAVE
                        </Button>
                      </HStack>
                    </Box>
                  </VStack>
                </Box>
              </Box>
            </VStack>
          </Box>

          <Box gridColumn={{ base: "auto", lg: "span 4" }}>
            <VStack
              align="stretch"
              spacing={3}
              position={{ base: "static", lg: "sticky" }}
              top="24px"
            >
              <Box
                bg="white"
                border="1px solid #E2E8F0"
                borderRadius="22px"
                p={5}
                boxShadow="0 18px 45px rgba(15, 23, 42, 0.07)"
              >
                <VStack align="center" spacing={3}>
                  <Box position="relative">
                    <Avatar
                      size="xl"
                      name={candidateName || "Candidate"}
                      src={avatarPreview || undefined}
                      bg="#DCE5F5"
                      color="#334371"
                      fontWeight="800"
                    />

                    <IconButton
                      aria-label="Upload avatar"
                      icon={<FiCamera />}
                      size="sm"
                      position="absolute"
                      right="2px"
                      bottom="6px"
                      borderRadius="full"
                      bg="#334371"
                      color="white"
                      boxShadow="0 8px 20px rgba(51, 67, 113, 0.28)"
                      _hover={{ bg: "#26345A" }}
                      onClick={() => avatarInputRef.current?.click()}
                    />

                    <Input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      display="none"
                      onChange={handleAvatarChange}
                    />
                  </Box>

                  <Box textAlign="center">
                    <Text fontSize="md" fontWeight="650" color="#1E293B">
                      {candidateName || "Candidate"}
                    </Text>

                    <Text mt={1} color="#64748B" fontSize="sm" fontWeight="700">
                      {email || "candidate@itjob.local"}
                    </Text>
                  </Box>

                  <Badge
                    px={3}
                    py={1.5}
                    borderRadius="999px"
                    bg="#EEF2FF"
                    color="#334371"
                    textTransform="none"
                    fontWeight="800"
                  >
                    Verified account
                  </Badge>
                </VStack>

                <Divider my={5} borderColor="#E2E8F0" />

                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Box
                        w="34px"
                        h="34px"
                        borderRadius="14px"
                        bg="#EEF4FF"
                        color="#334371"
                        display="grid"
                        placeItems="center"
                      >
                        <Icon as={FiShield} />
                      </Box>

                      <Box>
                        <Text color="#1E293B" fontWeight="800">
                          Account status
                        </Text>

                        <Text color="#64748B" fontSize="sm">
                          Verified
                        </Text>
                      </Box>
                    </HStack>

                    <Badge
                      bg="#EEF2FF"
                      color="#334371"
                      borderRadius="999px"
                      px={3}
                      py={1}
                      textTransform="none"
                      fontWeight="800"
                    >
                      Active
                    </Badge>
                  </HStack>

                  <Box
                    bg="#F8FAFC"
                    border="1px solid #E2E8F0"
                    borderRadius="14px"
                    p={3.5}
                  >
                    <Text color="#1E293B" fontWeight="650">
                      This information is synced with your login account
                    </Text>

                    <Text mt={2} color="#64748B" fontSize="sm" lineHeight="1.7">
                      Full name, phone number, and avatar are used in your
                      candidate profile and account.
                    </Text>
                  </Box>
                </VStack>
              </Box>

              <Box
                bg="#334371"
                color="white"
                borderRadius="22px"
                p={5}
                boxShadow="0 18px 38px rgba(51, 67, 113, 0.20)"
                position="relative"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  right="-45px"
                  top="-45px"
                  w="140px"
                  h="140px"
                  borderRadius="999px"
                  bg="rgba(255,255,255,0.10)"
                />

                <VStack align="stretch" spacing={3} position="relative" zIndex={1}>
                  <HStack>
                    <Box
                      w="36px"
                      h="36px"
                      borderRadius="13px"
                      bg="rgba(255,255,255,0.14)"
                      display="grid"
                      placeItems="center"
                    >
                      <Icon as={FiShield} />
                    </Box>

                    <Box>
                      <Text fontWeight="650">Account basics</Text>
                      <Text color="whiteAlpha.750" fontSize="sm">
                        Personal information only
                      </Text>
                    </Box>
                  </HStack>

                  <VStack align="stretch" spacing={3}>
                    {[
                      "Clear personal information",
                      "Registered email cannot be edited",
                      "Avatar is shared with your account",
                    ].map((item) => (
                      <HStack key={item} spacing={3}>
                        <Box
                          w="20px"
                          h="20px"
                          borderRadius="999px"
                          bg="rgba(255,255,255,0.16)"
                          display="grid"
                          placeItems="center"
                          flexShrink={0}
                        >
                          <Icon as={FiCheckCircle} fontSize="12px" />
                        </Box>

                        <Text fontSize="sm" fontWeight="650">
                          {item}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}