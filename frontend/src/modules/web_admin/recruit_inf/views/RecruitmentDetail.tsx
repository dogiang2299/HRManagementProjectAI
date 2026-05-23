import {
    Box,
    Button,
    Divider,
    Flex,
    HStack,
    IconButton,
    Spinner,
    Text,
    VStack,
    useColorModeValue,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
    FiArrowLeft,
    FiEdit2,
    FiShare2,
} from "react-icons/fi";
import { keyframes } from "@emotion/react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDateShort } from "../../../../types";
import { recruitmentInforAddUrl, recruitmentInforUrl } from "../../../../routes/urls";
import { useRecInformID } from "../api/get";
import type { IRecruitmentInfor } from "../types";
import CandidatesTabContent from "../components/CandidatesTabContent";
import InterviewScheduleTabContent from "../components/InterviewScheduleTabContent";
import ReportTabContent from "../components/ReportTabContent";
import CandidateCreateModal from "../../candidate/components/CandidateModal";
import { useCreateCandidate } from "../../candidate/api/create";
import { useUploadCandidateCv } from "../../candidate/api/upload_cv";
import { useUploadCandidateAvatar } from "../../candidate/api/upload_avatar";
import { useCreateApplication } from "../../candidate/api/create_application";
import type { CandidateCreatePayload } from "../../candidate/types";
import { useNotify } from "../../../../components/notification/NotifyProvider";

const statusColorMap: Record<string, { dot: string; bg: string; color: string }> = {
    Public: { dot: "green.400", bg: "green.50", color: "green.700" },
    Internal: { dot: "blue.400", bg: "blue.50", color: "blue.700" },
    StopReceiving: { dot: "orange.400", bg: "orange.50", color: "orange.700" },
    Closed: { dot: "gray.400", bg: "gray.100", color: "gray.700" },
    Draft: { dot: "purple.400", bg: "purple.50", color: "purple.700" },
};

const tabs = [
    { key: "candidates", label: "CANDIDATES" },
    { key: "interview", label: "INTERVIEW SCHEDULE" },
];

const editButtonWobble = keyframes`
    0%, 86%, 100% { transform: translateX(0); }
    88% { transform: translateX(-1px) rotate(-0.6deg); }
    90% { transform: translateX(1px) rotate(0.6deg); }
    92% { transform: translateX(-1px) rotate(-0.4deg); }
    94% { transform: translateX(1px) rotate(0.4deg); }
`;

const editButtonPulseDot = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55); }
    70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

function TopTab({
    active,
    label,
    onClick,
}: {
    active?: boolean;
    label: string;
    onClick?: () => void;
}) {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            px={0}
            py={0}
            minH="30px"
            h="38px"
            borderRadius="0"
            borderBottom="2px solid"
            borderColor={active ? "#334371" : "transparent"}
            color={active ? "#334371" : "gray.600"}
            fontSize="sm"
            fontWeight="700"
            _hover={{ bg: "transparent", color: active ? "#334371" : "gray.800" }}
        >
            {label}
        </Button>
    );
}

export default function RecruitmentDetail() {
    const notify = useNotify();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState("candidates");
    const [addCandidateModalOpen, setAddCandidateModalOpen] = useState(false);
    const [candidatesRefreshTick, setCandidatesRefreshTick] = useState(0);

    const createCandidateMutation = useCreateCandidate();
    const uploadCvMutation = useUploadCandidateCv();
    const uploadAvatarMutation = useUploadCandidateAvatar();
    const createApplicationMutation = useCreateApplication();

    const { data, isLoading, isError, error } = useRecInformID(id || "", {
        enabled: !!id,
    });

    const recruitment = useMemo<IRecruitmentInfor | null>(() => {
        if (!data) return null;
        const payload = (data as any)?.data ?? data;
        const raw = payload?.data ?? payload;
        return (raw as IRecruitmentInfor) ?? null;
    }, [data]);

    const pageBg = useColorModeValue("white", "gray.900");
    const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
    const mutedText = useColorModeValue("gray.600", "gray.400");
    const headerBg = useColorModeValue("white", "gray.900");

    if (!id) {
        return (
            <Box p={6}>
                <Text color="red.500" fontWeight="600">
                    Invalid recruitment identifier.
                </Text>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Flex p={8} align="center" justify="center" direction="column" gap={3}>
                <Spinner size="md" />
                <Text color={mutedText} fontSize="sm">
                    Loading recruitment workspace...
                </Text>
            </Flex>
        );
    }

    if (isError || !recruitment) {
        return (
            <VStack p={8} align="flex-start" spacing={4}>
                <Text color="red.500" fontWeight="700">
                    Unable to load recruitment details.
                </Text>
                <Text color={mutedText} fontSize="sm">
                    {(error as any)?.message ||
                        "This recruitment posting may not exist or you may not have access."}
                </Text>
                <Button
                    onClick={() => navigate(recruitmentInforUrl)}
                    leftIcon={<FiArrowLeft />}
                    colorScheme="blue"
                    variant="outline"
                    size="sm"
                >
                    Back to Recruitment List
                </Button>
            </VStack>
        );
    }

    const statusConfig = statusColorMap[recruitment.status || "Draft"] || statusColorMap.Draft;
    const title =
        recruitment.post_title || recruitment.internal_title || "Untitled recruitment";
    const companyName =
        recruitment.department_name ||
        (recruitment as any)?.department?.full_name ||
        (recruitment as any)?.department?.acronym_name ||
        "";

    const getErrorMessage = (error: unknown) => {
        const e = error as { response?: { data?: { message?: unknown } }; message?: string };
        const msg = e?.response?.data?.message ?? e?.message;

        if (Array.isArray(msg)) return msg.join(", ");
        if (typeof msg === "string" && msg.trim()) return msg;
        return "An unexpected error occurred.";
    };

    const handleSubmitCandidate = async (payload: CandidateCreatePayload) => {
        if (!id) return;

        const { cv_file, avatar_file, ...candidateData } = payload;

        try {
            const created = await createCandidateMutation.mutateAsync(candidateData);

            if (cv_file) {
                await uploadCvMutation.mutateAsync({
                    candidateId: created.id,
                    file: cv_file,
                    currentCvFile: created.cv_file ?? null,
                });
            }

            if (avatar_file) {
                await uploadAvatarMutation.mutateAsync({
                    candidateId: created.id,
                    file: avatar_file,
                    currentAvatarFile: created.avatar_file ?? null,
                });
            }

            await createApplicationMutation.mutateAsync({
                candidate_id: created.id,
                recruitment_infor_id: id,
            });

            await queryClient.invalidateQueries({ queryKey: ["recruitment-candidates-by-status"] });

            notify({
                type: "success",
                message: "Created",
                description: "Candidate has been added to this recruitment.",
            });

            setAddCandidateModalOpen(false);
            setActiveTab("candidates");
            setCandidatesRefreshTick((prev) => prev + 1);
        } catch (error) {
            notify({
                type: "error",
                message: "Create failed",
                description: getErrorMessage(error),
            });
        }
    };

    return (
        <Box bg={pageBg} minH="100vh" mx={-6} my={-6}>
            <Box
                bg={headerBg}
                borderBottom="1px solid"
                borderColor={borderColor}
                px={{ base: 4, md: 6 }}
                pt={4}
            >
                <Flex
                    justify="space-between"
                    align={{ base: "flex-start", xl: "center" }}
                    direction={{ base: "column", xl: "row" }}
                    gap={4}
                >
                    <VStack align="stretch" spacing={2} flex="1">
                        <HStack spacing={2} align="center">
                            <IconButton
                                aria-label="Back"
                                icon={<FiArrowLeft />}
                                variant="ghost"
                                size="sm"
                                borderRadius="full"
                                onClick={() => navigate(recruitmentInforUrl)}
                            />

                            <Box w="8px" h="8px" borderRadius="full" bg={statusConfig.dot} />

                            <Text
                                fontSize={{ base: "xl", md: "xl" }}
                                fontWeight="800"
                                color="gray.800"
                                lineHeight="1.1"
                            >
                                {title}
                            </Text>

                            <Button
                                size="sm"
                                variant="outline"
                                borderRadius="999px"
                                leftIcon={<FiEdit2 />}
                                fontSize="sm"
                                h="29px"
                                onClick={() =>
                                    navigate(`${recruitmentInforAddUrl}?mode=edit&id=${id}`)
                                }
                                position="relative"
                                animation={`${editButtonWobble} 2.4s ease-in-out infinite`}
                                _after={{
                                    content: '""',
                                    position: "absolute",
                                    top: "-3px",
                                    right: "4px",
                                    w: "10px",
                                    h: "10px",
                                    borderRadius: "full",
                                    bg: "red.400",
                                    animation: `${editButtonPulseDot} 1.4s ease-out infinite`,
                                }}
                            >
                                Edit Posting
                            </Button>

                            <IconButton
                                aria-label="Share"
                                icon={<FiShare2 />}
                                variant="ghost"
                                size="sm"
                            />
                        </HStack>

                        <HStack
                            spacing={4}
                            flexWrap="wrap"
                            divider={<Divider orientation="vertical" h="14px" borderColor={borderColor} />}
                        >
                            <Text fontSize="sm" color={mutedText}>
                                {recruitment.internal_title || title}
                            </Text>
                            <Text fontSize="sm" color={mutedText}>
                                {companyName}
                            </Text>
                            <Text fontSize="sm" color={mutedText}>
                                Openings: {recruitment.total_needed ?? "--"}
                            </Text>
                            <Text fontSize="sm" color={mutedText}>
                                Application deadline: {formatDateShort(recruitment.application_deadline) || "--"}
                            </Text>
                            <Text fontSize="sm" color={mutedText}>
                                Experience: {(recruitment as any)?.experience_label || "--"}
                            </Text>
                        </HStack>
                    </VStack>

                    <HStack spacing={3} flexWrap="wrap">
                      
                        <Button
                            bg={'#334371'}
                            color={'white'}
                            borderRadius="7px"
                            size="sm"
                            h="40px"
                            px={4}
                            fontSize="sm"
                            onClick={() => setAddCandidateModalOpen(true)}
                        >
                            ADD CANDIDATE
                        </Button>

                       
                    </HStack>
                </Flex>

                <HStack spacing={8} mt={3} overflowX="auto">
                    {tabs.map((tab) => (
                        <TopTab
                            key={tab.key}
                            label={tab.label}
                            active={activeTab === tab.key}
                            onClick={() => setActiveTab(tab.key)}
                        />
                    ))}
                </HStack>
            </Box>

            {activeTab === "candidates" && (
                <CandidatesTabContent
                    recruitmentId={id}
                    refreshTick={candidatesRefreshTick}
                />
            )}
            {activeTab === "interview" && <InterviewScheduleTabContent recruitmentId={id} />}
            {activeTab === "report" && <ReportTabContent />}

            <CandidateCreateModal
                isOpen={addCandidateModalOpen}
                mode="add"
                onClose={() => setAddCandidateModalOpen(false)}
                onSubmit={handleSubmitCandidate}
                isSubmitting={
                    createCandidateMutation.isPending ||
                    uploadCvMutation.isPending ||
                    uploadAvatarMutation.isPending ||
                    createApplicationMutation.isPending
                }
            />
        </Box>
    );
}