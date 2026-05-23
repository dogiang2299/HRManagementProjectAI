import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiMessageCircle,
  FiSend,
  FiX,
  FiRefreshCcw,
  FiCpu,
} from "react-icons/fi";
import { useAiRecommendations, type AiRecommendationItem } from "../api/getAiRecommendations";
import AiJobCard from "./AiJobCard";
import { useNotify } from "../../../../components/notification/NotifyProvider";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  jobs?: AiRecommendationItem[];
};

const QUICK_PROMPTS = [
  "Suggest suitable jobs for me",
  "Highest paying job",
  "Is there a Backend job?",
  "Why is this job suitable?",
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const getJobSearchText = (item: AiRecommendationItem) => {
  const job = item.recruitment_infor;
  return normalize(
    [
      job.post_title,
      job.internal_title,
      job.position_post?.name_post,
      job.position_post?.group?.name_group,
      job.rank_info?.name_rank,
      job.company?.full_name,
      job.work_location?.short_address,
      job.work_location?.full_name,
      job.type_of_job,
      ...(item.ui_badges || []),
      item.explanation_short,
      item.explanation_long,
    ]
      .filter(Boolean)
      .join(" "),
  );
};

const filterJobsByPrompt = (items: AiRecommendationItem[], prompt: string) => {
  const q = normalize(prompt);
  if (!q) return items.slice(0, 3);

  if (
    q.includes("luong cao") ||
    q.includes("salary") ||
    q.includes("thu nhap")
  ) {
    return [...items]
      .sort(
        (a, b) =>
          Number(b.recruitment_infor.salary_to || b.recruitment_infor.salary_from || 0) -
          Number(a.recruitment_infor.salary_to || a.recruitment_infor.salary_from || 0),
      )
      .slice(0, 3);
  }

  if (q.includes("vi sao") || q.includes("phu hop")) {
    return items.slice(0, 2);
  }

  const keywords = [
    "backend",
    "frontend",
    "developer",
    "marketing",
    "analyst",
    "business analyst",
    "hr",
    "junior",
    "senior",
  ].filter((keyword) => q.includes(keyword));

  if (!keywords.length) {
    return items.slice(0, 3);
  }

  const filtered = items.filter((item) => {
    const searchText = getJobSearchText(item);
    return keywords.some((keyword) => searchText.includes(keyword));
  });

  return filtered.length ? filtered.slice(0, 3) : [];
};

const buildAssistantReply = (prompt: string, items: AiRecommendationItem[]) => {
  const q = normalize(prompt);

  if (!items.length) {
    return {
      text: "I haven't seen a job that matches the keyword you just entered in the current data set. You can try asking questions like Backend, Marketing, HR, Junior or asking for general suggestions.",
      jobs: [] as AiRecommendationItem[],
    };
  }

  if (q.includes("vi sao") || q.includes("phu hop")) {
    return {
      text: "These are the most suitable jobs according to current suggested data. I prioritize jobs with high hybrid scores and explanations from the system's recommendation pipeline.",
      jobs: items,
    };
  }

  if (q.includes("luong cao") || q.includes("salary") || q.includes("thu nhap")) {
    return {
      text: "I have prioritized jobs with higher salaries in the current list of suggestions for you.",
      jobs: items,
    };
  }

  return {
    text: "I found a few suitable jobs from the current suggestion system. Please take a look. If you want me to filter further for Backend, Frontend, HR or Marketing, please send me a message.",
    jobs: items,
  };
};

export default function AiChatWidget() {
  const notify = useNotify();
  const { data, isLoading, isFetching, isError, error, refetch } = useAiRecommendations(true);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello, I am AI that suggests jobs. You can ask me to see the top suitable jobs based on your profile and current recommendation data.",
    },
  ]);

  const bodyRef = useRef<HTMLDivElement | null>(null);
  const items = useMemo(() => data?.items || [], [data?.items]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isError) {
      notify({
        message: "AI suggestion data has not been retrieved",
        description:
          (error as any)?.response?.data?.message ||
          (error as any)?.message ||
          "Please check your candidate login or recommendation file.",
        type: "warning",
        duration: 2.5,
      });
    }
  }, [isError, error, notify]);

  const pushUserAndAssistant = (prompt: string) => {
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: prompt,
    };

    const selectedJobs = filterJobsByPrompt(items, prompt);
    const assistant = buildAssistantReply(prompt, selectedJobs);

    const assistantMessage: ChatMessage = {
      id: `${Date.now()}-assistant`,
      role: "assistant",
      text: assistant.text,
      jobs: assistant.jobs,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

  const handleSend = () => {
    const prompt = input.trim();
    if (!prompt) return;

    if (!items.length) {
      pushUserAndAssistant(prompt);
      setInput("");
      return;
    }

    pushUserAndAssistant(prompt);
    setInput("");
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!isOpen) setIsOpen(true);
    pushUserAndAssistant(prompt);
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        text: "I have refreshed the chat. Please keep asking so I can suggest a job.",
      },
    ]);
  };

  return (
    <>
      <Box position="fixed" right={{ base: 4, md: 6 }} bottom={{ base: 5, md: 6 }} zIndex={1400}>
        <Collapse in={isOpen} animateOpacity>
          <Box
            mb={3}
            w={{ base: "calc(100vw - 32px)", sm: "360px" }}
            maxW="360px"
            borderRadius="24px"
            overflow="hidden"
            border="1px solid #E2E8F0"
            bg="white"
            boxShadow="0 24px 60px rgba(15,23,42,0.18)"
          >
            <Flex
              px={4}
              py={3.5}
              align="center"
              justify="space-between"
              bg="linear-gradient(135deg, #334371 0%, #42558E 100%)"
              color="white"
            >
              <HStack spacing={3}>
                <Flex
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg="rgba(255,255,255,0.16)"
                  align="center"
                  justify="center"
                >
                  <Icon as={FiCpu} boxSize={5} />
                </Flex>
                <Box>
                  <Text fontSize="14px" fontWeight="700">
                    AI suggests jobs
                  </Text>
                  <HStack spacing={2} mt={0.5}>
                    <Badge bg="rgba(255,255,255,0.18)" color="white" borderRadius="full" px={2}>
                      {isLoading || isFetching ? "..." : `${items.length} job`}
                    </Badge>
                    {data?.candidate?.candidate_name && (
                      <Text fontSize="11px" opacity={0.92} noOfLines={1}>
                        {data.candidate.candidate_name}
                      </Text>
                    )}
                  </HStack>
                </Box>
              </HStack>

              <HStack spacing={1}>
                <IconButton
                  aria-label="Refresh"
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "rgba(255,255,255,0.12)" }}
                  icon={<FiRefreshCcw />}
                  onClick={() => {
                    refetch();
                    handleReset();
                  }}
                />
                <IconButton
                  aria-label="Close"
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "rgba(255,255,255,0.12)" }}
                  icon={<FiX />}
                  onClick={() => setIsOpen(false)}
                />
              </HStack>
            </Flex>

            <Box px={3} pt={3} pb={2} borderBottom="1px solid #F1F5F9">
              <HStack spacing={2} flexWrap="wrap">
                {QUICK_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    size="xs"
                    borderRadius="full"
                    bg="#F8FAFC"
                    color="#334371"
                    border="1px solid #E2E8F0"
                    _hover={{ bg: "#EEF2FF" }}
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </HStack>
            </Box>

            <VStack
              ref={bodyRef}
              align="stretch"
              spacing={3}
              px={3}
              py={3}
              h="420px"
              overflowY="auto"
              bg="#F8FAFC"
            >
              {isLoading ? (
                <Flex h="100%" align="center" justify="center" direction="column" gap={3}>
                  <Spinner color="#334371" />
                  <Text fontSize="13px" color="#64748B">
                    Loading job suggestion data...
                  </Text>
                </Flex>
              ) : (
                messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <Box key={message.id} alignSelf={isUser ? "flex-end" : "flex-start"} maxW="88%">
                      <Box
                        px={3.5}
                        py={2.5}
                        borderRadius={isUser ? "18px 18px 6px 18px" : "18px 18px 18px 6px"}
                        bg={isUser ? "#334371" : "white"}
                        color={isUser ? "white" : "#1E293B"}
                        border={isUser ? "none" : "1px solid #E2E8F0"}
                        boxShadow={isUser ? "none" : "0 8px 24px rgba(15,23,42,0.05)"}
                      >
                        <Text fontSize="13px" whiteSpace="pre-wrap" lineHeight="1.6">
                          {message.text}
                        </Text>
                      </Box>

                      {!!message.jobs?.length && (
                        <VStack spacing={2.5} mt={2} align="stretch">
                          {message.jobs.map((job) => (
                            <AiJobCard key={`${message.id}-${job.recruitment_infor.id}`} item={job} />
                          ))}
                        </VStack>
                      )}
                    </Box>
                  );
                })
              )}
            </VStack>

            <Box p={3} borderTop="1px solid #E2E8F0" bg="white">
              <HStack align="stretch" spacing={2}>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message AI for job suggestions..."
                  borderRadius="14px"
                  bg="#F8FAFC"
                  borderColor="#E2E8F0"
                  _focus={{ borderColor: "#334371", boxShadow: "0 0 0 1px #334371" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                />
                <IconButton
                  aria-label="Send a message"
                  icon={<FiSend />}
                  borderRadius="14px"
                  bg="#334371"
                  color="white"
                  _hover={{ bg: "#2B365D" }}
                  onClick={handleSend}
                />
              </HStack>

              {!!data?.message && !data?.items?.length && (
                <Text mt={2} fontSize="12px" color="#E67E22">
                  {data.message}
                </Text>
              )}
            </Box>
          </Box>
        </Collapse>

        <Button
          onClick={() => setIsOpen((prev) => !prev)}
          h="58px"
          px={5}
          borderRadius="full"
          bg="#FFFFFF"
          color="#10B354"
          border="1px solid #E2E8F0"
          boxShadow="0 18px 40px rgba(15,23,42,0.14)"
          leftIcon={<FiMessageCircle />}
          _hover={{ transform: "translateY(-1px)", boxShadow: "0 20px 42px rgba(15,23,42,0.18)" }}
        >
          Chat with AI
        </Button>
      </Box>
    </>
  );
}
