import { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
  Badge,
  Spinner,
  Center,
} from "@chakra-ui/react";
import {
  FiCheckCircle,
  FiFileText,
  FiUploadCloud,
  FiEye,
} from "react-icons/fi";
import { useApplyForJob } from "../api/applyJob";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { useGetMyCandidateCvs, type CandidateCvListItem } from "../../profile/api/candidateCv";
import { formatDateShort } from "../../../../types";
import { BASE_URL } from "../../../../constant/config";

const openCvPreview = (cv: { file_url?: string | null; file_name?: string | null }) => {
  const url = cv.file_url
    ? (cv.file_url.startsWith("http") ? cv.file_url : `${BASE_URL}${cv.file_url}`)
    : cv.file_name
      ? `${BASE_URL}${cv.file_name}`
      : null;

  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

type ApplyJobModalProps = {
  isOpen: boolean;
  onClose: () => void;
  recruitmentInforId: string;
  employeeId?: string;
  jobTitle?: string;
  submitLabel?: string;
};

type CvSource = "library" | "upload";

export default function ApplyJobModal({
  isOpen,
  onClose,
  recruitmentInforId,
  employeeId,
  jobTitle,
  submitLabel,
}: ApplyJobModalProps) {
  const notify = useNotify();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cvSource, setCvSource] = useState<CvSource>("library");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);

  const applyMutation = useApplyForJob();

  // Fetch CV list
  const { data: cvList = [], isLoading: isCvLoading } = useGetMyCandidateCvs();

  const usableCvList = cvList.filter((cv) => cv.status === "COMPLETED");

  // Select default CV: primary completed CV or most recent completed CV
  const defaultCv = usableCvList.find((cv) => cv.is_primary) ||
    [...usableCvList].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  const selectedCv = usableCvList.find((cv) => cv.id === selectedCvId) || defaultCv;

  // Initialize selectedCvId when modal opens; keep user selection if still valid.
  useEffect(() => {
    if (!isOpen) return;

    if (usableCvList.length === 0) {
      setSelectedCvId(null);
      return;
    }

    const hasValidSelection =
      selectedCvId !== null && usableCvList.some((cv) => cv.id === selectedCvId);

    if (!hasValidSelection && defaultCv) {
      setSelectedCvId(defaultCv.id);
    }
  }, [isOpen, usableCvList, selectedCvId, defaultCv]);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = [".doc", ".docx", ".pdf"];
    const fileName = file.name.toLowerCase();
    const isValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext));
    const isValidSize = file.size <= 5 * 1024 * 1024;

    if (!isValidExt) {
      notify({
        message: "Invalid file",
        description: "Only .doc, .docx, .pdf formats are supported",
        type: "warning",
      });
      return;
    }

    if (!isValidSize) {
      notify({
        message: "File is too large",
        description: "File size must be less than 5MB",
        type: "warning",
      });
      return;
    }

    setUploadedFile(file);
    setCvSource("upload");
  };

  const handleSubmit = async () => {
    if (cvSource === "upload") {
      if (!uploadedFile) {
        notify({
          message: "Missing CV",
          description: "Please upload your CV before submitting your application",
          type: "warning",
        });
        return;
      }
    } else {
      // Library source: selectedCvId should be set
      if (!selectedCvId) {
        notify({
          message: "Missing CV",
          description: "Please select a CV to apply",
          type: "warning",
        });
        return;
      }
    }

    setIsSubmitting(true);

    if (!agreePolicy) {
      notify({
        message: "Haven't agreed to terms",
        description: "Please confirm your agreement to the personal data use agreement",
        type: "warning",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await applyMutation.mutateAsync({
        recruitment_infor_id: recruitmentInforId,
        employee_id: employeeId,
        cover_letter: coverLetter.trim() || undefined,
        candidate_cv_id: cvSource === "library" ? selectedCvId || undefined : undefined,
        cv: cvSource === "upload" ? uploadedFile : null,
      });

      const mode = response?.mode;
      const title =
        mode === "reapplied"
          ? "Reapply"
          : mode === "updated_profile"
            ? "Profile updated successfully"
            : "Application submitted successfully";

      const description =
        mode === "updated_profile"
          ? "Your profile information has been updated"
          : "Your profile has been sent to the employer";

      notify({
        message: title,
        description,
        type: "success",
      });

      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Applications cannot be submitted at this time";
      notify({
        message: "An error occurred",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal scrollBehavior="inside" isOpen={isOpen} onClose={onClose} isCentered size="2xl">
      <ModalOverlay bg="rgba(15, 23, 42, 0.45)" />
      <ModalContent
        borderRadius="18px"
        maxH="90vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        boxShadow="0 20px 60px rgba(15, 23, 42, 0.18)"
      >
        <ModalHeader
          px={6}
          py={4}
          borderBottom="1px solid"
          borderColor="#E9EEF5"
          fontSize="xl"
          fontWeight="800"
          color="#1F2D3D"
          flexShrink={0}
        >
          Apply {" "}
          <Text as="span" color="#334371">
            {jobTitle || "recruitment position"}
          </Text>
        </ModalHeader>

        <ModalCloseButton
          top="18px"
          right="18px"
          borderRadius="full"
          bg="#F3F4F6"
          _hover={{ bg: "#E5E7EB" }}
        />

        <ModalBody px={6} py={5} flex="1" minH={0} overflowY="auto">
          <VStack align="stretch" spacing={4}>
            {/* Select CV */}
            <Box>
              <HStack spacing={2} mb={3}>
                <Icon as={FiFileText} color="#334371" boxSize={4} />
                <Text fontSize="md" fontWeight="700" color="#243B53">
                  CV used for this application
                </Text>
              </HStack>

              {isCvLoading ? (
                <Center py={8}>
                  <Spinner size="sm" />
                </Center>
              ) : usableCvList.length === 0 ? (
                // No CV available - show upload
                <Box
                  border="1px dashed"
                  borderColor="#D1D5DB"
                  bg="#FAFAFA"
                  borderRadius="12px"
                  px={4}
                  py={5}
                  cursor="pointer"
                  transition="all 0.2s"
                  onClick={() => setCvSource("upload")}
                >
                  <HStack align="flex-start" spacing={3}>
                    <Box
                      w="22px"
                      h="22px"
                      borderRadius="full"
                      border="2px solid"
                      borderColor={cvSource === "upload" ? "#334371" : "#CBD5E1"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mt="2px"
                      flexShrink={0}
                    >
                      {cvSource === "upload" && (
                        <Box w="10px" h="10px" borderRadius="full" bg="#334371" />
                      )}
                    </Box>

                    <Flex flex="1" direction="column" align="center">
                      <Icon as={FiUploadCloud} boxSize={9} color="#9CA3AF" mb={2} />
                      <Text fontSize="sm" fontWeight="700" color="#334155" textAlign="center">
                        Upload your CV from your computer, select or drag and drop
                      </Text>
                      <Text
                        mt={1}
                        fontSize="sm"
                        color="#8A94A6"
                        textAlign="center"
                      >
                        Supports .doc, .docx, .pdf formats under 5MB in size
                      </Text>

                      <Button
                        mt={3}
                        size="sm"
                        bg="#E5E7EB"
                        color="#374151"
                        _hover={{ bg: "#D1D5DB" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChooseFile();
                        }}
                      >
                        Select CV
                      </Button>

                      {uploadedFile && (
                        <Text mt={2} fontSize="sm" color="#334371" fontWeight="600">
                          {uploadedFile.name}
                        </Text>
                      )}

                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".doc,.docx,.pdf"
                        display="none"
                        onChange={handleFileChange}
                      />
                    </Flex>
                  </HStack>
                </Box>
              ) : (
                // Have CVs - show selected CV and list
                <VStack spacing={3} align="stretch">
                  {/* Selected CV (primary or latest) */}
                  {selectedCv && (
                    <Box
                      border="1px solid"
                      borderColor={cvSource === "library" ? "#334371" : "#E5E7EB"}
                      bg={cvSource === "library" ? "#F0F4FF" : "white"}
                      borderRadius="12px"
                      px={4}
                      py={3}
                      cursor="pointer"
                      transition="all 0.2s"
                      onClick={() => {
                        setCvSource("library");
                        setSelectedCvId(selectedCv.id);
                      }}
                    >
                      <Flex align="center" justify="space-between">
                        <HStack spacing={3} align="center">
                          <Box
                            w="22px"
                            h="22px"
                            borderRadius="full"
                            border="2px solid"
                            borderColor={cvSource === "library" && selectedCvId === selectedCv.id ? "#334371" : "#CBD5E1"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            {cvSource === "library" && selectedCvId === selectedCv.id && (
                              <Box w="10px" h="10px" borderRadius="full" bg="#334371" />
                            )}
                          </Box>

                          <VStack align="start" spacing={0}>
                            <HStack spacing={2}>
                              <Text fontSize="sm" fontWeight="600" color="#1F2937">
                                {selectedCv.title || selectedCv.file_name || "CV"}
                              </Text>
                              {selectedCv.is_primary && (
                                <Badge colorScheme="blue" variant="solid" fontSize="xs">
                                  Primary CV
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                              {formatDateShort(selectedCv.updated_at)}
                            </Text>
                          </VStack>
                        </HStack>

                        <Button
                          size="xs"
                          variant="ghost"
                          leftIcon={<FiEye />}
                          fontSize="sm"
                          color="#334371"
                          _hover={{ bg: "transparent", opacity: 0.7 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openCvPreview(selectedCv);
                          }}
                        >
                          View
                        </Button>
                      </Flex>
                    </Box>
                  )}

                  {/* Other CVs if multiple */}
                  {usableCvList.length > 1 && (
                    <VStack spacing={2} align="stretch">
                      <Text fontSize="xs" fontWeight="600" color="#6B7280">
                        Other CVs ({usableCvList.length - 1})
                      </Text>
                          {usableCvList.map((cv) => {
                        // Skip if it's the selected CV
                        if (cv.id === selectedCv?.id) return null;

                        return (
                          <Box
                            key={cv.id}
                            border="1px solid"
                            borderColor={selectedCvId === cv.id ? "#334371" : "#E5E7EB"}
                            bg={selectedCvId === cv.id ? "#F0F4FF" : "white"}
                            borderRadius="10px"
                            px={3}
                            py={2}
                            cursor="pointer"
                            transition="all 0.2s"
                            onClick={() => {
                              setCvSource("library");
                              setSelectedCvId(cv.id);
                            }}
                          >
                            <Flex align="center" justify="space-between">
                              <HStack spacing={2} align="center">
                                <Box
                                  w="18px"
                                  h="18px"
                                  borderRadius="full"
                                  border="2px solid"
                                  borderColor={selectedCvId === cv.id ? "#334371" : "#CBD5E1"}
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  flexShrink={0}
                                >
                                  {selectedCvId === cv.id && (
                                    <Box w="8px" h="8px" borderRadius="full" bg="#334371" />
                                  )}
                                </Box>

                                <VStack align="start" spacing={0}>
                                  <HStack spacing={2}>
                                    <Text fontSize="sm" color="#1F2937">
                                      {cv.title || cv.file_name || "CV"}
                                    </Text>
                                    {cv.is_primary && (
                                      <Badge colorScheme="blue" variant="solid" fontSize="xs">
                                        Primary CV
                                      </Badge>
                                    )}
                                  </HStack>
                                  <Text fontSize="xs" color="gray.500">
                                    {formatDateShort(cv.updated_at)}
                                  </Text>
                                </VStack>
                              </HStack>

                              <Button
                                size="xs"
                                variant="ghost"
                                leftIcon={<FiEye />}
                                fontSize="sm"
                                color="#334371"
                                _hover={{ bg: "transparent", opacity: 0.7 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCvPreview(cv);
                                }}
                              >
                                View
                              </Button>
                            </Flex>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}

                  {/* Upload option */}
                  <Box
                    border="1px dashed"
                    borderColor={cvSource === "upload" ? "#334371" : "#D1D5DB"}
                    bg={cvSource === "upload" ? "#F0F4FF" : "#FAFAFA"}
                    borderRadius="12px"
                    px={4}
                    py={4}
                    cursor="pointer"
                    transition="all 0.2s"
                    onClick={() => setCvSource("upload")}
                  >
                    <HStack align="flex-start" spacing={3}>
                      <Box
                        w="22px"
                        h="22px"
                        borderRadius="full"
                        border="2px solid"
                        borderColor={cvSource === "upload" ? "#334371" : "#CBD5E1"}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        mt="2px"
                        flexShrink={0}
                      >
                        {cvSource === "upload" && (
                          <Box w="10px" h="10px" borderRadius="full" bg="#334371" />
                        )}
                      </Box>

                      <Flex flex="1" direction="column" align="center">
                        <Icon as={FiUploadCloud} boxSize={9} color="#9CA3AF" mb={2} />
                        <Text fontSize="sm" fontWeight="700" color="#334155" textAlign="center">
                          Or upload a new CV
                        </Text>
                        <Text
                          mt={1}
                          fontSize="sm"
                          color="#8A94A6"
                          textAlign="center"
                        >
                          Supports .doc, .docx, .pdf formats under 5MB in size
                        </Text>

                        <Button
                          mt={3}
                          size="sm"
                          bg="#E5E7EB"
                          color="#374151"
                          _hover={{ bg: "#D1D5DB" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChooseFile();
                          }}
                        >
                          Select CV
                        </Button>

                        {uploadedFile && (
                          <Text mt={2} fontSize="sm" color="#334371" fontWeight="600">
                            {uploadedFile.name}
                          </Text>
                        )}

                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".doc,.docx,.pdf"
                          display="none"
                          onChange={handleFileChange}
                        />
                      </Flex>
                    </HStack>
                  </Box>
                </VStack>
              )}
            </Box>

            {/* Letter of recommendation */}
            <Box>
              <HStack spacing={2} mb={2}>
                <Text fontSize="md" color="#334371">
                  ✦
                </Text>
                <Text fontSize="md" fontWeight="700" color="#243B53">
                  Letter of introduction:
                </Text>
              </HStack>

              <Text fontSize="sm" color="#8A94A6" mb={3}>
                A concise, well-written cover letter will help you appear professional
                and make more impression on employers.
              </Text>

              <Box position="relative">
                <Textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  minH="110px"
                  resize="vertical"
                  borderRadius="10px"
                  borderColor="#DDE3EA"
                  fontSize="sm"
                  placeholder="Enter your cover letter..."
                  pr="42px"
                  _focusVisible={{
                    borderColor: "#334371",
                    boxShadow: "0 0 0 1px #334371",
                  }}
                />
                <Flex
                  position="absolute"
                  right="10px"
                  bottom="10px"
                  w="26px"
                  h="26px"
                  borderRadius="full"
                  bg="#334371"
                  align="center"
                  justify="center"
                >
                  <Icon as={FiCheckCircle} color="white" boxSize={4} />
                </Flex>
              </Box>
            </Box>
          </VStack>
        </ModalBody>

        <Divider borderColor="#E9EEF5" />

        <Box px={6} py={4} flexShrink={0}>
          <Checkbox
            isChecked={agreePolicy}
            onChange={(e) => setAgreePolicy(e.target.checked)}
            colorScheme="green"
            alignItems="flex-start"
          >
            <Text fontSize="sm" color="#4A5568">
              I have read and agree with {" "}
              <Text as="span" color="#334371" fontWeight="600">
                "Personal data use agreement"
              </Text>{" "}
              of the Employer
            </Text>
          </Checkbox>

          <HStack justify="flex-end" spacing={3} mt={4}>
            <Button
              variant="ghost"
              bg="#F3F4F6"
              color="#334155"
              h="42px"
              px={6}
              borderRadius="10px"
              _hover={{ bg: "#E5E7EB" }}
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              bg="#334371"
              color="white"
              h="42px"
              px={8}
              borderRadius="10px"
              fontWeight="700"
              _hover={{ bg: "#334371" }}
              _disabled={{
                bg: "#334371",
                opacity: 0.45,
                cursor: "not-allowed",
                boxShadow: "none",
              }}
              isDisabled={!agreePolicy || isSubmitting}
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              {submitLabel || "Submit your application"}
            </Button>
          </HStack>
        </Box>
      </ModalContent>
    </Modal>
  );
}
