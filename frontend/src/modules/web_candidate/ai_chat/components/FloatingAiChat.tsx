import { keyframes } from "@emotion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Circle,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiMessageCircle, FiMinus, FiSend, FiX } from "react-icons/fi";
import { formatWorkTypeLabel } from "../../../../utils/formatText";

type ChatRole = "bot" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
};

type ChatSession = {
  id: string;
  step: string;
  profile: Record<string, any>;
  messages: ChatMessage[];
};

type ChatRecommendation = {
  recruitmentId: string;
  score?: number;
  reasons?: string[];
  recruitment?: {
    id: string;
    post_title?: string;
    salary_from?: number;
    salary_to?: number;
    salary_currency?: string;
    type_of_job?: string;
    department?: {
      full_name?: string;
      address?: string;
      short_address?: string;
    };
    workLocation?: {
      address?: string;
      short_address?: string;
      place_of_issue?: string;
    };
  };
};

type ChatResponse = {
  session: ChatSession;
  recommendations: ChatRecommendation[];
};

type UiMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

const API_BASE = "http://localhost:3000";
// If using Vite, switch to:
// const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const INITIAL_BOT_MESSAGE = `Hello 👋
I'm your AI Job Assistant.

I can help you find suitable jobs based on your preferences.
What position are you looking for today?`;

const QUICK_PROMPTS = [
  "Frontend Developer",
  "Backend Developer",
  "Business Analyst",
  "Mobile Developer",
];

const typingDots = keyframes`
  0%, 80%, 100% {
    transform: scale(0.72);
    opacity: 0.35;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [recommendations, setRecommendations] = useState<ChatRecommendation[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const [uiMessages, setUiMessages] = useState<UiMessage[]>([
    {
      id: "welcome-message",
      role: "bot",
      text: INITIAL_BOT_MESSAGE,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const hasUnreadBotMessage = useMemo(() => {
    if (!uiMessages.length) return false;
    const last = uiMessages[uiMessages.length - 1];
    return last.role === "bot" && !isOpen;
  }, [uiMessages, isOpen]);

  const ensureSession = async () => {
    if (session) return session;

    setBooting(true);
    try {
      const res = await fetch(`${API_BASE}/job-chat/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data: ChatSession = await res.json();
      setSession(data);
      return data;
    } catch (error) {
      console.error("Create chat session failed:", error);
      return null;
    } finally {
      setBooting(false);
    }
  };

  const openChat = async () => {
    setIsOpen(true);
    if (!session) {
      ensureSession();
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const renderBotBubble = (text: string, key: string | number) => (
    <HStack key={key} align="flex-start" spacing={3} w="full">
      <Circle
        size="34px"
        bg="linear-gradient(135deg, #16A34A 0%, #22C55E 100%)"
        color="white"
        flexShrink={0}
        mt="2px"
      >
        <Icon as={FiMessageCircle} boxSize={4} />
      </Circle>

      <Box
        maxW="82%"
        bg="white"
        border="1px solid #E2E8F0"
        borderRadius="20px"
        px={4}
        py={3}
        boxShadow="0 6px 18px rgba(15, 23, 42, 0.06)"
      >
        <Text
          fontSize="14px"
          color="#1F2937"
          lineHeight="1.7"
          whiteSpace="pre-wrap"
        >
          {text}
        </Text>
      </Box>
    </HStack>
  );

  const renderUserBubble = (text: string, key: string | number) => (
    <Flex key={key} justify="flex-end" w="full">
      <Box
        maxW="82%"
        px={4}
        py={3}
        borderRadius="20px"
        bg="#16A34A"
        color="white"
        boxShadow="0 8px 18px rgba(34, 197, 94, 0.18)"
      >
        <Text fontSize="14px" lineHeight="1.7" whiteSpace="pre-wrap">
          {text}
        </Text>
      </Box>
    </Flex>
  );

  const renderTypingBubble = () => (
    <HStack align="flex-start" spacing={3} w="full">
      <Circle
        size="34px"
        bg="linear-gradient(135deg, #16A34A 0%, #22C55E 100%)"
        color="white"
        flexShrink={0}
        mt="2px"
      >
        <Icon as={FiMessageCircle} boxSize={4} />
      </Circle>

      <Box
        px={4}
        py={3}
        bg="white"
        borderRadius="20px"
        border="1px solid #E2E8F0"
        boxShadow="0 6px 18px rgba(15, 23, 42, 0.06)"
      >
        <HStack spacing={1}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              w="8px"
              h="8px"
              borderRadius="full"
              bg="#94A3B8"
              animation={`${typingDots} 1.2s infinite`}
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </HStack>
      </Box>
    </HStack>
  );

  const sendMessage = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text || loading || isBotTyping) return;

    let currentSession = session;
    if (!currentSession) {
      currentSession = await ensureSession();
    }

    if (!currentSession?.id) return;

    setHasStartedChat(true);

    const previousMessageCount = currentSession.messages?.length ?? 0;

    const userMessage: UiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };

    setUiMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setIsBotTyping(true);
    setRecommendations([]);

    try {
      const res = await fetch(`${API_BASE}/job-chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          message: text,
        }),
      });

      const data: ChatResponse = await res.json();
      setSession(data.session);

      const newServerMessages = (data.session.messages ?? []).slice(previousMessageCount);
      const newBotMessages = newServerMessages.filter((msg) => msg.role === "bot");

      await sleep(850);
      setIsBotTyping(false);

      for (const msg of newBotMessages) {
        setUiMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            role: "bot",
            text: msg.text,
          },
        ]);

        await sleep(320);
      }

      if (data.recommendations?.length) {
        await sleep(250);
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error("Send chat message failed:", error);
      setIsBotTyping(false);

      setUiMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "bot",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uiMessages, recommendations, isOpen, isBotTyping]);

  return (
    <Box
      position="fixed"
      right={{ base: "16px", md: "20px" }}
      bottom={{ base: "20px", md: "24px" }}
      zIndex={1400}
    >
      {!isOpen ? (
        <Box position="relative">
          <Circle
            size={{ base: "56px", md: "60px" }}
            bg="white"
            boxShadow="0 14px 34px rgba(15, 23, 42, 0.16)"
            border="1px solid #E2E8F0"
            cursor="pointer"
            onClick={openChat}
            transition="all 0.25s ease"
            _hover={{
              transform: "translateY(-3px)",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.2)",
            }}
          >
            {booting ? (
              <Spinner color="#16A34A" />
            ) : (
              <Icon as={FiMessageCircle} boxSize={6} color="#16A34A" />
            )}
          </Circle>

          {hasUnreadBotMessage && (
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              minW="22px"
              h="22px"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="#16A34A"
              color="white"
              fontSize="11px"
              px={0}
              border="2px solid white"
            >
              1
            </Badge>
          )}
        </Box>
      ) : (
        <Box
          w={{ base: "calc(100vw - 24px)", sm: "390px" }}
          maxW="390px"
          h={{ base: "76vh", md: "640px" }}
          bg="white"
          borderRadius="28px"
          border="1px solid #E2E8F0"
          boxShadow="0 24px 60px rgba(15, 23, 42, 0.18)"
          overflow="hidden"
        >
          <Flex
            px={4}
            py={3.5}
            align="center"
            justify="space-between"
            bg="linear-gradient(135deg, #16A34A 0%, #22C55E 100%)"
          >
            <HStack spacing={3}>
              <Circle size="42px" bg="rgba(255,255,255,0.18)">
                <Icon as={FiMessageCircle} boxSize={5} color="white" />
              </Circle>

              <Box>
                <Text color="white" fontWeight="700" fontSize="md" lineHeight="1.2">
                  AI Job Assistant
                </Text>
                <Text color="rgba(255,255,255,0.88)" fontSize="xs">
                  Find suitable jobs faster
                </Text>
              </Box>
            </HStack>

            <HStack spacing={1}>
              <IconButton
                aria-label="Minimize chat"
                icon={<FiMinus />}
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: "rgba(255,255,255,0.14)" }}
                onClick={closeChat}
              />
              <IconButton
                aria-label="Close chat"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: "rgba(255,255,255,0.14)" }}
                onClick={closeChat}
              />
            </HStack>
          </Flex>

          <VStack
            align="stretch"
            spacing={3}
            px={3}
            py={3}
            h="calc(100% - 154px)"
            overflowY="auto"
            bg="linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)"
          >
            {!session && booting && (
              <Flex justify="center" py={4}>
                <Spinner color="#16A34A" />
              </Flex>
            )}

            {uiMessages.map((msg) =>
              msg.role === "bot"
                ? renderBotBubble(msg.text, msg.id)
                : renderUserBubble(msg.text, msg.id)
            )}

            {!hasStartedChat && (
              <Box pl="46px">
                <HStack spacing={2} flexWrap="wrap">
                  {QUICK_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      size="sm"
                      borderRadius="full"
                      bg="white"
                      color="#15803D"
                      border="1px solid #BBF7D0"
                      _hover={{ bg: "#F0FDF4" }}
                      onClick={() => sendMessage(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </HStack>
              </Box>
            )}

            {isBotTyping && renderTypingBubble()}

            {!!recommendations.length && (
              <Box pl="46px">
                <VStack align="stretch" spacing={3} pt={1}>
                  <Text fontSize="13px" fontWeight="600" color="#334155">
                    Here are some matching jobs for you:
                  </Text>

                  {recommendations.map((item) => {
                    const job = item.recruitment;
                    const company = job?.department?.full_name || "Company updating";
                    const location =
                      job?.workLocation?.short_address ||
                      job?.workLocation?.place_of_issue ||
                      job?.department?.short_address ||
                      "Location updating";

                    const salary =
                      job?.salary_from && job?.salary_to
                        ? `${job.salary_from} - ${job.salary_to} ${job.salary_currency ?? ""}`
                        : "Negotiable";

                    return (
                      <Box
                        key={item.recruitmentId}
                        bg="white"
                        border="1px solid #E2E8F0"
                        borderRadius="20px"
                        p={4}
                        boxShadow="0 10px 24px rgba(15,23,42,0.07)"
                      >
                        <Text fontWeight="700" color="#0F172A" fontSize="sm" lineHeight="1.5">
                          {job?.post_title || "Job title updating"}
                        </Text>

                        <Text fontSize="xs" color="#475569" mt={1}>
                          {company}
                        </Text>

                        <HStack spacing={2} mt={3} flexWrap="wrap">
                          <Badge
                            bg="#EEF2FF"
                            color="#334371"
                            px={2.5}
                            py={1}
                            borderRadius="full"
                          >
                            {salary}
                          </Badge>

                          <Badge
                            bg="#ECFDF5"
                            color="#15803D"
                            px={2.5}
                            py={1}
                            borderRadius="full"
                          >
                            {location}
                          </Badge>

                          {job?.type_of_job && (
                            <Badge
                              bg="#F8FAFC"
                              color="#475569"
                              px={2.5}
                              py={1}
                              borderRadius="full"
                            >
                              {formatWorkTypeLabel(job.type_of_job)}
                            </Badge>
                          )}
                        </HStack>

                        {!!item?.reasons?.length && (
                          <VStack align="stretch" spacing={1.5} mt={3}>
                            {item.reasons.slice(0, 3).map((reason, idx) => (
                              <Text
                                key={idx}
                                fontSize="12px"
                                color="#475569"
                                lineHeight="1.6"
                              >
                                • {reason}
                              </Text>
                            ))}
                          </VStack>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            )}

            <Box ref={messagesEndRef} />
          </VStack>

          <Box borderTop="1px solid #E2E8F0" bg="white" px={3} py={3}>
            <HStack spacing={2}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                borderRadius="18px"
                h="48px"
                borderColor="#D1D5DB"
                bg="#F8FAFC"
                _placeholder={{ color: "#94A3B8" }}
                _focus={{
                  borderColor: "#16A34A",
                  boxShadow: "0 0 0 1px #16A34A",
                  bg: "white",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading && !isBotTyping) {
                    sendMessage();
                  }
                }}
              />

              <IconButton
                aria-label="Send message"
                icon={<FiSend />}
                h="48px"
                minW="48px"
                color="white"
                bg="linear-gradient(135deg, #16A34A 0%, #22C55E 100%)"
                borderRadius="18px"
                _hover={{
                  bg: "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
                }}
                onClick={() => sendMessage()}
                isLoading={loading}
                isDisabled={isBotTyping}
              />
            </HStack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
