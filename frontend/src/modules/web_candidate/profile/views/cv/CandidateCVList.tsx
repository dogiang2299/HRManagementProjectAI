import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  HStack,
  Icon,
  Link,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { ModalConfirm } from "../../../../../components/common/ModalConfirm";
import { useMemo, useRef, useState } from "react";
import {
  FiArchive,
  FiEdit2,
  FiEye,
  FiFileText,
  FiPlusCircle,
  FiStar,
  FiUpload,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiTrash,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../../../constant/config";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import { candidateCvBuilderUrl } from "../../../../../routes/urls";
import {
  type CandidateCvListItem,
  useArchiveCv,
  useDeleteCandidateCv,
  useGetMyCandidateCvs,
  useSetPrimaryCv,
} from "../../api/candidateCv";
import { useGetMyCandidateProfile, useUploadMyCv } from "../../api/myCv";
import { useGetRecommendedJobs } from "../../../job/api/getRecommendedJobs";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const extractFileName = (value?: string | null) => {
  if (!value) return "";
  const parts = value.split("/");
  return parts[parts.length - 1] || value;
};

const buildCvFileUrl = (value?: string | null) => {
  const raw = value?.trim();
  if (!raw) return "";

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  const path = raw.startsWith("/")
    ? raw
    : raw.startsWith("uploads/") || raw.startsWith("candidate/")
      ? `/${raw}`
      : `/uploads/cv/${raw}`;

  if (!BASE_URL) return path;

  try {
    const origin = new URL(BASE_URL).origin;
    return `${origin}${path}`;
  } catch {
    return `${BASE_URL.replace(/\/$/, "")}${path}`;
  }
};

const buildBuilderPath = (id: string) => candidateCvBuilderUrl.replace(":id", id);

const sourceBadge = (type: CandidateCvListItem["source_type"]) => {
  if (type === "AI_GENERATED") {
    return {
      label: "AI generated",
      bg: "#EEF2FF",
      color: "#334371",
    };
  }

  return {
    label: "Uploaded file",
    bg: "#ECFDF5",
    color: "#047857",
  };
};

const statusBadge = (status: CandidateCvListItem["status"]) => {
  if (status === "DRAFT") {
    return {
      label: "Draft",
      bg: "#FFF7ED",
      color: "#C2410C",
      icon: FiClock,
    };
  }

  if (status === "COMPLETED") {
    return {
      label: "Completed",
      bg: "#ECFDF5",
      color: "#047857",
      icon: FiCheckCircle,
    };
  }

  return {
    label: "Archived",
    bg: "#F1F5F9",
    color: "#64748B",
    icon: FiArchive,
  };
};

type PrimaryCvCardProps = {
  title: string;
  fileName?: string | null;
  fileUrl?: string;
  sourceLabel: string;
  statusLabel: string;
  isPrimary: boolean;
  updatedAt?: string | null;
  onChooseFile: () => void;
  isUploading: boolean;
};

function PrimaryCvCard({
  title,
  fileName,
  fileUrl,
  sourceLabel,
  statusLabel,
  isPrimary,
  updatedAt,
  onChooseFile,
  isUploading,
}: PrimaryCvCardProps) {
  const hasFile = Boolean(fileUrl);

  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius="28px"
      bg="linear-gradient(135deg, #334371 0%, #1F2937 58%, #111827 100%)"
      color="white"
      p={{ base: 5, md: 7 }}
      boxShadow="0 24px 60px rgba(15, 23, 42, 0.22)"
    >
      <Box
        position="absolute"
        top="-80px"
        right="-80px"
        w="220px"
        h="220px"
        rounded="full"
        bg="whiteAlpha.200"
      />

      <Box
        position="absolute"
        bottom="-100px"
        left="30%"
        w="260px"
        h="260px"
        rounded="full"
        bg="whiteAlpha.100"
      />

      <Flex
        position="relative"
        zIndex={1}
        direction={{ base: "column", lg: "row" }}
        justify="space-between"
        align={{ base: "stretch", lg: "center" }}
        gap={6}
      >
        <VStack align="start" spacing={4} flex={1} minW={0}>
          <HStack spacing={3} flexWrap="wrap">
            <HStack
              bg="whiteAlpha.200"
              border="1px solid"
              borderColor="whiteAlpha.300"
              borderRadius="999px"
              px={3}
              py={1.5}
            >
              <Icon as={FiFileText} boxSize={4} />
              <Text fontSize="sm" fontWeight="700">
                Primary CV
              </Text>
            </HStack>

            {isPrimary && (
              <Badge
                bg="#22C55E"
                color="white"
                px={3}
                py={1.5}
                borderRadius="999px"
                textTransform="none"
              >
                Active for matching
              </Badge>
            )}
          </HStack>

          <Box>
            <Text
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="900"
              lineHeight="1.15"
              noOfLines={2}
            >
              {title}
            </Text>

            <Text mt={2} maxW="640px" fontSize="sm" color="whiteAlpha.800">
              This is the CV currently used for job matching. Keep it updated so
              employers see your latest experience and target role.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} w="full">
            <Box bg="whiteAlpha.140" borderRadius="18px" p={4}>
              <Text fontSize="xs" color="whiteAlpha.700">
                Source
              </Text>
              <Text mt={1} fontSize="sm" fontWeight="800">
                {sourceLabel}
              </Text>
            </Box>

            <Box bg="whiteAlpha.140" borderRadius="18px" p={4}>
              <Text fontSize="xs" color="whiteAlpha.700">
                Status
              </Text>
              <Text mt={1} fontSize="sm" fontWeight="800">
                {statusLabel}
              </Text>
            </Box>

            <Box bg="whiteAlpha.140" borderRadius="18px" p={4}>
              <Text fontSize="xs" color="whiteAlpha.700">
                Last updated
              </Text>
              <Text mt={1} fontSize="sm" fontWeight="800">
                {formatDateTime(updatedAt)}
              </Text>
            </Box>
          </SimpleGrid>

          <Text fontSize="sm" color="whiteAlpha.700" noOfLines={1}>
            File name: {fileName || "No CV uploaded yet"}
          </Text>
        </VStack>

        <VStack
          align={{ base: "stretch", lg: "end" }}
          spacing={3}
          minW={{ base: "full", lg: "260px" }}
        >
          {hasFile && (
            <HStack spacing={3} w="full" justify={{ base: "stretch", lg: "end" }}>
              <Button
                as={Link}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                leftIcon={<FiEye />}
                bg="white"
                color="#334371"
                flex={{ base: 1, lg: "unset" }}
                _hover={{ bg: "#F8FAFC", textDecoration: "none" }}
              >
                Preview
              </Button>

              <Button
                as={Link}
                href={fileUrl}
                download={fileName || "cv"}
                leftIcon={<FiDownload />}
                bg="whiteAlpha.200"
                color="white"
                border="1px solid"
                borderColor="whiteAlpha.300"
                flex={{ base: 1, lg: "unset" }}
                _hover={{ bg: "whiteAlpha.300", textDecoration: "none" }}
              >
                Download
              </Button>
            </HStack>
          )}

          <Button
            leftIcon={<FiUpload />}
            bg="#F9FAFB"
            color="#111827"
            w="full"
            size="lg"
            onClick={onChooseFile}
            isLoading={isUploading}
            loadingText="Uploading"
            _hover={{ bg: "white" }}
          >
            {hasFile ? "Replace CV" : "Upload CV"}
          </Button>

        </VStack>
      </Flex>
    </Box>
  );
}

type CvRecordCardProps = {
  item: CandidateCvListItem;
  onEdit: () => void;
  onSetPrimary: () => void;
  onArchive: () => void;
  onDelete?: () => void;
  isSettingPrimary: boolean;
  isArchiving: boolean;
};

function CvRecordCard({
  item,
  onEdit,
  onSetPrimary,
  onArchive,
  onDelete,
  isSettingPrimary,
  isArchiving,
}: CvRecordCardProps) {
  const source = sourceBadge(item.source_type);
  const status = statusBadge(item.status);
  const canSetPrimary = item.status === "COMPLETED" && !item.is_primary;
  const canArchive = !item.is_primary && item.status !== "ARCHIVED";
  const fileUrl = buildCvFileUrl(
    item.source_type === "UPLOADED_FILE"
      ? item.file_name || item.file_url
      : item.file_url || item.file_name,
  );
  const hasFile = Boolean(fileUrl);

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="#E5E7EB"
      borderRadius="22px"
      p={{ base: 4, md: 5 }}
      transition="all 0.18s ease"
      _hover={{
        borderColor: "#CBD5E1",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
        transform: "translateY(-1px)",
      }}
    >
      <Flex
        direction={{ base: "column", xl: "row" }}
        justify="space-between"
        align={{ base: "stretch", xl: "center" }}
        gap={5}
      >
        <HStack align="start" spacing={4} flex={1} minW={0}>
          <Flex
            w="46px"
            h="46px"
            flexShrink={0}
            align="center"
            justify="center"
            rounded="16px"
            bg={item.is_primary ? "#EEF2FF" : "#F8FAFC"}
            color={item.is_primary ? "#334371" : "#64748B"}
          >
            <Icon as={item.is_primary ? FiStar : FiFileText} boxSize={5} />
          </Flex>

          <VStack align="start" spacing={2} flex={1} minW={0}>
            <HStack spacing={2} flexWrap="wrap">
              <Text
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="900"
                color="#111827"
                noOfLines={1}
              >
                {item.title || item.file_name || "Untitled CV"}
              </Text>

              {item.is_primary && (
                <Badge
                  bg="#334371"
                  color="white"
                  borderRadius="999px"
                  px={2.5}
                  py={1}
                  textTransform="none"
                >
                  Primary
                </Badge>
              )}
            </HStack>

            <HStack spacing={2} flexWrap="wrap">
              <Badge
                bg={source.bg}
                color={source.color}
                borderRadius="999px"
                px={2.5}
                py={1}
                textTransform="none"
              >
                {source.label}
              </Badge>

              <HStack
                bg={status.bg}
                color={status.color}
                borderRadius="999px"
                px={2.5}
                py={1}
                spacing={1.5}
              >
                <Icon as={status.icon} boxSize={3.5} />
                <Text fontSize="xs" fontWeight="700">
                  {status.label}
                </Text>
              </HStack>
            </HStack>

            <SimpleGrid
              columns={{ base: 1, md: 3 }}
              spacing={{ base: 1, md: 4 }}
              w="full"
              color="#64748B"
              fontSize="sm"
            >
              <Text noOfLines={1}>
                Position:{" "}
                <Box as="span" color="#334155" fontWeight="600">
                  {item.desired_position || "Not updated"}
                </Box>
              </Text>

              <Text>
                Experience:{" "}
                <Box as="span" color="#334155" fontWeight="600">
                  {item.years_experience ?? "-"} years
                </Box>
              </Text>

              <Text>
                Updated:{" "}
                <Box as="span" color="#334155" fontWeight="600">
                  {formatDateTime(item.updated_at)}
                </Box>
              </Text>
            </SimpleGrid>
          </VStack>
        </HStack>

        <Flex
          gap={2}
          flexWrap="wrap"
          justify={{ base: "start", xl: "end" }}
          minW={{ xl: "420px" }}
        >
          {hasFile && (
            <Button
              as={Link}
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              leftIcon={<FiEye />}
              variant="outline"
              borderColor="#CBD5E1"
              color="#334371"
              _hover={{ bg: "#F8FAFC", textDecoration: "none" }}
            >
              Preview
            </Button>
          )}

          {hasFile && (
            <Button
              as={Link}
              href={fileUrl}
              download={item.file_name || item.title || "cv"}
              size="sm"
              leftIcon={<FiDownload />}
              variant="outline"
              borderColor="#CBD5E1"
              color="#334371"
              _hover={{ bg: "#F8FAFC", textDecoration: "none" }}
            >
              Download
            </Button>
          )}

          <Button
            size="sm"
            leftIcon={<FiEdit2 />}
            variant="outline"
            borderColor="#CBD5E1"
            color="#334371"
            onClick={onEdit}
            _hover={{ bg: "#F8FAFC" }}
          >
            Edit
          </Button>

          <Button
            size="sm"
            leftIcon={<FiStar />}
            bg="#334371"
            color="white"
            _hover={{ bg: "#263452" }}
            isDisabled={!canSetPrimary}
            isLoading={isSettingPrimary}
            onClick={onSetPrimary}
          >
            Set primary
          </Button>

          <Button
            size="sm"
            leftIcon={<FiArchive />}
            variant="ghost"
            color="#64748B"
            isDisabled={!canArchive}
            isLoading={isArchiving}
            onClick={onArchive}
            _hover={{ bg: "#F8FAFC" }}
          >
            Archive
          </Button>

          <Button
            size="sm"
            leftIcon={<FiTrash />}
            variant="ghost"
            color="#B91C1C"
            isDisabled={item.is_primary}
            onClick={() => onDelete && onDelete()}
            _hover={{ bg: "#FFF1F2" }}
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

export default function CandidateCVList() {
  const navigate = useNavigate();
  const toast = useToast();
  const notify = useNotify();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileQuery = useGetMyCandidateProfile();
  const cvsQuery = useGetMyCandidateCvs();
  const recommendationsQuery = useGetRecommendedJobs();
  const uploadCvMutation = useUploadMyCv();
  const setPrimaryMutation = useSetPrimaryCv();
  const archiveMutation = useArchiveCv();
  const deleteCvMutation = useDeleteCandidateCv();

  const profile = profileQuery.data;
  const cvs = useMemo(() => cvsQuery.data || [], [cvsQuery.data]);

  const profileCvUrl = useMemo(
    () => buildCvFileUrl(profile?.cv_file),
    [profile?.cv_file],
  );

  const profileFileName = useMemo(
    () => extractFileName(profile?.cv_file),
    [profile?.cv_file],
  );

  const primaryRecord = useMemo(
    () => cvs.find((item) => item.is_primary && item.status !== "ARCHIVED") || null,
    [cvs],
  );

  const activeCv =
    primaryRecord ||
    (profileCvUrl
      ? {
          id: `profile-${profile?.id || "current"}`,
          title: "Current uploaded CV",
          source_type: "UPLOADED_FILE" as const,
          status: "COMPLETED" as const,
          is_primary: true,
          file_name: profileFileName,
          file_url: profileCvUrl,
          desired_position: null,
          years_experience: null,
          created_at: profile?.cv_uploaded_at || "",
          updated_at: profile?.cv_uploaded_at || "",
        }
      : null);

  const activeSourceLabel = activeCv
    ? activeCv.source_type === "AI_GENERATED"
      ? "AI generated"
      : "Uploaded file"
    : "No CV uploaded yet";

  const activeStatusLabel = activeCv
    ? activeCv.status === "ARCHIVED"
      ? "Archived"
      : activeCv.status === "DRAFT"
        ? "Draft"
        : "Completed"
    : "No CV uploaded yet";

  const activeFileName = activeCv?.file_name || activeCv?.title || "No CV uploaded yet";
  const activeFileUrl = buildCvFileUrl(
    activeCv?.source_type === "UPLOADED_FILE"
      ? activeCv?.file_name || activeCv?.file_url
      : activeCv?.file_url || activeCv?.file_name,
  );

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExt = ["pdf", "doc", "docx"];

    if (!ext || !allowedExt.includes(ext)) {
      toast({
        title: "Invalid file",
        description: "Only PDF, DOC and DOCX files are supported.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      event.target.value = "";
      return;
    }

    try {
      await uploadCvMutation.mutateAsync(file);
      
      // Refetch all related queries after CV upload
      await Promise.all([
        profileQuery.refetch(),
        cvsQuery.refetch(),
        recommendationsQuery.refetch(),
      ]);

      // Check if recommendations are empty and show appropriate message
      if (recommendationsQuery.data?.items.length === 0) {
        toast({
          title: "CV uploaded",
          description: "Your CV has been uploaded. Recommendations will appear shortly.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "CV uploaded",
          description: "Your CV has been refreshed and recommendations updated.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Unable to upload your CV right now.";
      toast({
        title: "Upload failed",
        description: errorMsg,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      event.target.value = "";
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryMutation.mutateAsync(id);
      await Promise.all([profileQuery.refetch(), cvsQuery.refetch()]);

      notify({
        type: "success",
        message: "Primary CV updated",
        description: "This CV is now used for job matching.",
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to set this CV as primary";

      notify({
        type: "error",
        message: "Unable to update primary CV",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      await cvsQuery.refetch();

      notify({
        type: "success",
        message: "CV archived",
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to archive this CV";

      notify({
        type: "error",
        message: "Archive failed",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
      });
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openDeleteModal = (id: string) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCvMutation.mutateAsync(deletingId);
      await cvsQuery.refetch();

      notify({ type: "success", message: "CV deleted" });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Unable to delete CV";
      notify({ type: "error", message: "Delete failed", description: Array.isArray(msg) ? msg.join(", ") : msg });
    } finally {
      setDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <Box
      minH="100vh"
      
      py={{ base: 5, md: 8 }}
    >
      <Container maxW="1220px">
        <Flex
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={4}
          mb={6}
        >
          <VStack align="start" spacing={1}>
            <Text
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="900"
              color="#111827"
              letterSpacing="-0.03em"
            >
              My CV
            </Text>

            <Text color="#64748B" fontSize="sm">
              Upload, generate, preview and choose the CV used for job matching.
            </Text>
          </VStack>

        </Flex>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {profileQuery.isLoading || cvsQuery.isLoading ? (
          <Flex
            align="center"
            justify="center"
            minH="420px"
            bg="white"
            borderRadius="28px"
            border="1px solid"
            borderColor="#E5E7EB"
          >
            <VStack spacing={4}>
              <Spinner size="lg" color="#334371" thickness="4px" />
              <Text color="#64748B" fontSize="sm">
                Loading your CV workspace...
              </Text>
            </VStack>
          </Flex>
        ) : profileQuery.isError || cvsQuery.isError ? (
          <Box
            bg="white"
            borderRadius="24px"
            border="1px solid"
            borderColor="#FCA5A5"
            p={6}
          >
            <Text color="#B91C1C" fontWeight="800">
              Unable to load CV data
            </Text>
            <Text mt={1} color="#64748B" fontSize="sm">
              Please try again later or refresh the page.
            </Text>
          </Box>
        ) : (
          <VStack spacing={5} align="stretch">
            <PrimaryCvCard
              title={activeFileName}
              fileName={activeCv?.file_name || null}
              fileUrl={activeFileUrl || undefined}
              sourceLabel={activeSourceLabel}
              statusLabel={activeStatusLabel}
              isPrimary={Boolean(activeCv?.is_primary)}
              updatedAt={activeCv?.updated_at || profile?.cv_uploaded_at || null}
              onChooseFile={handleChooseFile}
              isUploading={uploadCvMutation.isPending}
            />

            <Box
              bg="whiteAlpha.900"
              border="1px solid"
              borderColor="#E5E7EB"
              borderRadius="28px"
              p={{ base: 4, md: 5 }}
              boxShadow="0 20px 45px rgba(15, 23, 42, 0.04)"
            >
              <Flex
                justify="space-between"
                align={{ base: "stretch", md: "center" }}
                direction={{ base: "column", md: "row" }}
                gap={4}
                mb={4}
              >
                <VStack align="start" spacing={1}>
                  <HStack spacing={2}>
                    <Text fontSize="lg" fontWeight="900" color="#111827">
                      All CVs
                    </Text>

                    <Badge
                      bg="#EEF2FF"
                      color="#334371"
                      borderRadius="999px"
                      px={2.5}
                      py={1}
                      textTransform="none"
                    >
                      {cvs.length} records
                    </Badge>
                  </HStack>

                  <Text fontSize="sm" color="#64748B">
                    Review every uploaded or generated CV and manage which one
                    is used for matching.
                  </Text>
                </VStack>

                <Button
                  leftIcon={<FiUpload />}
                  variant="outline"
                  borderColor="#CBD5E1"
                  color="#334371"
                  bg="white"
                  onClick={handleChooseFile}
                  _hover={{ bg: "#F8FAFC" }}
                >
                  Upload another CV
                </Button>
              </Flex>

              <Divider borderColor="#E5E7EB" mb={4} />

              {cvs.length === 0 ? (
                <Box
                  borderRadius="24px"
                  border="1px dashed"
                  borderColor="#CBD5E1"
                  bg="#F8FAFC"
                  p={{ base: 7, md: 10 }}
                  textAlign="center"
                >
                  <Flex
                    mx="auto"
                    mb={4}
                    w="64px"
                    h="64px"
                    align="center"
                    justify="center"
                    rounded="22px"
                    bg="white"
                    color="#334371"
                    boxShadow="0 12px 30px rgba(15, 23, 42, 0.08)"
                  >
                    <Icon as={FiFileText} boxSize={7} />
                  </Flex>

                  <Text color="#111827" fontWeight="900" fontSize="lg">
                    No CV records yet
                  </Text>

                  <Text color="#64748B" fontSize="sm" mt={2} maxW="440px" mx="auto">
                    Upload your current CV or generate an AI draft to start
                    building your candidate profile.
                  </Text>

                  <HStack mt={5} justify="center" spacing={3} flexWrap="wrap">
                    <Button
                      leftIcon={<FiUpload />}
                      bg="#334371"
                      color="white"
                      onClick={handleChooseFile}
                      isLoading={uploadCvMutation.isPending}
                      _hover={{ bg: "#263452" }}
                    >
                      Upload CV
                    </Button>

                  </HStack>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {cvs.map((item) => (
                    <CvRecordCard
                      key={item.id}
                      item={item}
                      onEdit={() => navigate(buildBuilderPath(item.id))}
                      onSetPrimary={() => handleSetPrimary(item.id)}
                      onArchive={() => handleArchive(item.id)}
                      onDelete={() => openDeleteModal(item.id)}
                      isSettingPrimary={setPrimaryMutation.isPending}
                      isArchiving={archiveMutation.isPending}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </VStack>
        )}
      </Container>
      <ModalConfirm
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title="Delete CV"
        message="Are you sure you want to permanently delete this CV? This action cannot be undone."
        onClick={handleDelete}
        titleButton="Delete"
        confirmButtonProps={{ isLoading: deleteCvMutation.isPending }}
      />
    </Box>
  );
}
