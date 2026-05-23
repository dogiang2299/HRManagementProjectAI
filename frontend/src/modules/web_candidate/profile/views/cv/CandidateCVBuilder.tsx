import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiSend, FiStar } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import { candidateCvListUrl } from "../../../../../routes/urls";
import {
  type CandidateCvChatMessage,
  useCandidateCvAiChat,
  useCompleteCandidateCv,
  useGetCandidateCvDetail,
  useGetCandidateCvMessages,
  useSetPrimaryCvById,
  useUpdateCandidateCv,
} from "../../api/candidateCv";
import CVPreview from "./components/CVPreview";

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const quickPrompts = [
  "I am a recent graduate",
  "I want to apply for a Frontend Developer role",
  "Rewrite my experience section more professionally",
  "Add my ITJob graduation project to the CV",
];

const MessageBubble = ({ message }: { message: CandidateCvChatMessage }) => {
  const isUser = message.role === "USER";

  return (
    <Flex justify={isUser ? "flex-end" : "flex-start"}>
      <Box
        maxW="86%"
        px={3.5}
        py={2.5}
        borderRadius={isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px"}
        bg={isUser ? "#334371" : "#F8FAFC"}
        color={isUser ? "white" : "#1F2937"}
        border="1px solid"
        borderColor={isUser ? "#334371" : "#E5E7EB"}
      >
        <Text fontSize="sm" lineHeight="1.7" whiteSpace="pre-wrap">{message.content}</Text>
        <Text mt={1} fontSize="10px" color={isUser ? "whiteAlpha.700" : "#94A3B8"} textAlign="right">
          {formatDateTime(message.created_at)}
        </Text>
      </Box>
    </Flex>
  );
};

export default function CandidateCVBuilder() {
  const { id } = useParams<{ id: string }>();
  const notify = useNotify();
  const navigate = useNavigate();

  const detailQuery = useGetCandidateCvDetail(id);
  const messagesQuery = useGetCandidateCvMessages(id);

  const updateMutation = useUpdateCandidateCv(id);
  const completeMutation = useCompleteCandidateCv(id);
  const setPrimaryMutation = useSetPrimaryCvById(id);
  const aiChatMutation = useCandidateCvAiChat(id);

  const [chatInput, setChatInput] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [desiredPosition, setDesiredPosition] = useState("");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [rawText, setRawText] = useState("");
  const [structuredData, setStructuredData] = useState<Record<string, any>>({});

  const messages = useMemo(() => messagesQuery.data || [], [messagesQuery.data]);

  useEffect(() => {
    const cv = detailQuery.data;
    if (!cv) return;

    setTitle(cv.title || "");
    setSummary(cv.summary || "");
    setDesiredPosition(cv.desired_position || "");
    setYearsExperience(cv.years_experience != null ? String(cv.years_experience) : "");
    setRawText(cv.raw_text || "");
    setStructuredData((cv.structured_data || {}) as Record<string, any>);
  }, [detailQuery.data?.id, detailQuery.data?.updated_at]);

  const cv = detailQuery.data;

  const handleSendMessage = async () => {
    const message = chatInput.trim();
    if (!message || !id || aiChatMutation.isPending) return;

    setChatInput("");
    try {
      const result = await aiChatMutation.mutateAsync(message);
      if (result?.cv?.structured_data && typeof result.cv.structured_data === "object") {
        setStructuredData(result.cv.structured_data);
      }
      if (typeof result?.cv?.summary === "string") {
        setSummary(result.cv.summary);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Unable to send the AI message";
      notify({
        type: "error",
        message: "AI response failed",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
      });
    }
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      await updateMutation.mutateAsync({
        title: title.trim() || undefined,
        summary: summary.trim() || undefined,
        desired_position: desiredPosition.trim() || undefined,
        years_experience: yearsExperience.trim() ? Number(yearsExperience) : null,
        raw_text: rawText.trim() || undefined,
        structured_data: structuredData,
      });

      notify({ type: "success", message: "CV changes saved" });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Unable to save the CV";
      notify({
        type: "error",
        message: "CV save failed",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
      });
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync();
      notify({ type: "success", message: "CV completed" });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Unable to complete the CV";
      notify({
        type: "error",
        message: "CV completion failed",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
      });
    }
  };

  const handleSetPrimary = async () => {
    try {
      await setPrimaryMutation.mutateAsync();
      notify({ type: "success", message: "This CV is now the primary CV for job recommendations." });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Unable to set the primary CV";
      notify({
        type: "error",
        message: "Set primary CV failed",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
      });
    }
  };

  if (detailQuery.isLoading) {
    return (
      <Flex align="center" justify="center" minH="60vh">
        <Spinner size="lg" color="#334371" />
      </Flex>
    );
  }

  if (!cv || detailQuery.isError) {
    return (
      <Container maxW="1200px" py={8}>
        <Box bg="white" border="1px solid" borderColor="#E5E7EB" borderRadius="16px" p={6}>
          <Text color="#6B7280">Unable to load CV data.</Text>
          <Button mt={4} onClick={() => navigate(candidateCvListUrl)}>Back to CV list</Button>
        </Box>
      </Container>
    );
  }

  const isDraft = cv.status === "DRAFT";
  const isCompleted = cv.status === "COMPLETED";

  return (
    <Box bg="#F6F8FB" minH="100vh" py={{ base: 5, md: 7 }}>
      <Container maxW="1300px" px={{ base: 4, md: 6, xl: 8 }}>
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3} mb={5}>
          <VStack align="start" spacing={1}>
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color="#1F2937">{cv.title || "CV Builder"}</Text>
            <Text fontSize="sm" color="#6B7280">Chat with AI to improve your CV and preview changes in real time.</Text>
          </VStack>
          <Button variant="outline" borderColor="#CBD5E1" onClick={() => navigate(candidateCvListUrl)}>Back to CV list</Button>
        </Flex>

        <Flex direction={{ base: "column", xl: "row" }} gap={5} align="stretch">
          <Box flex={{ base: "1", xl: "0 0 42%" }} bg="white" border="1px solid" borderColor="#E5E7EB" borderRadius="16px" p={4}>
            <Text fontSize="lg" fontWeight="700" color="#1F2937" mb={3}>AI Chat</Text>

            <HStack spacing={2} flexWrap="wrap" mb={3}>
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  size="xs"
                  variant="outline"
                  borderColor="#D8E0EC"
                  color="#334371"
                  onClick={() => setChatInput(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </HStack>

            <Box border="1px solid" borderColor="#EEF2F7" borderRadius="12px" bg="#F9FBFF" p={3} h={{ base: "280px", xl: "420px" }} overflowY="auto">
              {messagesQuery.isLoading ? (
                <CenterWrapper />
              ) : messages.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                </VStack>
              ) : (
                <Text fontSize="sm" color="#6B7280">No messages yet. Send information so AI can help update your CV.</Text>
              )}
            </Box>

            <HStack mt={3} align="end">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Enter what you want AI to help with..."
                borderRadius="12px"
                bg="#F8FAFC"
                borderColor="#E5E7EB"
                minH="90px"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                leftIcon={<FiSend />}
                bg="#334371"
                color="white"
                _hover={{ bg: "#2A365D" }}
                isLoading={aiChatMutation.isPending}
                onClick={handleSendMessage}
              >
                Send
              </Button>
            </HStack>
          </Box>

          <Box flex={1}>
            <Box bg="white" border="1px solid" borderColor="#E5E7EB" borderRadius="16px" p={4} mb={4}>
              <VStack align="stretch" spacing={3}>
                {isDraft ? (
                  <Box bg="#FFF7ED" border="1px solid" borderColor="#FED7AA" borderRadius="12px" px={3} py={2}>
                    <Text fontSize="sm" color="#9A3412">This CV is still a draft and is not used for job recommendations yet.</Text>
                  </Box>
                ) : null}

                <HStack spacing={3} align="start" flexWrap="wrap">
                  <FormControl>
                    <FormLabel fontSize="sm">CV title</FormLabel>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Desired position</FormLabel>
                    <Input value={desiredPosition} onChange={(e) => setDesiredPosition(e.target.value)} />
                  </FormControl>
                  <FormControl maxW={{ base: "100%", md: "180px" }}>
                    <FormLabel fontSize="sm">Years of experience</FormLabel>
                    <NumberInput value={yearsExperience} onChange={(value) => setYearsExperience(value)} min={0} max={50}>
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel fontSize="sm">Summary</FormLabel>
                  <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} minH="88px" />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Raw text</FormLabel>
                  <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} minH="88px" />
                </FormControl>

                <HStack spacing={2} flexWrap="wrap">
                  <Button
                    leftIcon={<FiCheckCircle />}
                    bg="#334371"
                    color="white"
                    _hover={{ bg: "#2A365D" }}
                    isLoading={updateMutation.isPending}
                    onClick={handleSave}
                  >
                    Save changes
                  </Button>
                  <Button
                    variant="outline"
                    borderColor="#CBD5E1"
                    isDisabled={!isDraft}
                    isLoading={completeMutation.isPending}
                    onClick={handleComplete}
                  >
                    Complete CV
                  </Button>
                  <Button
                    leftIcon={<FiStar />}
                    variant="outline"
                    borderColor="#CBD5E1"
                    isDisabled={!isCompleted || cv.is_primary}
                    isLoading={setPrimaryMutation.isPending}
                    onClick={handleSetPrimary}
                  >
                    Set as primary CV
                  </Button>
                </HStack>
              </VStack>
            </Box>

            <CVPreview structuredData={structuredData} />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

function CenterWrapper() {
  return (
    <Flex align="center" justify="center" h="100%">
      <Spinner color="#334371" />
    </Flex>
  );
}
