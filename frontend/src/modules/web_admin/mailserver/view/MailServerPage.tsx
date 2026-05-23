import {
  Box,
  Text,
  Flex,
  VStack,
  HStack,
  SimpleGrid,
  Switch,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Badge,
  Divider,
  Button,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { FaPaperPlane, FaSave, FaSyncAlt } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { mailServerApi } from "../api";

type ConnectionStatus = "Connected" | "Disconnected" | "Not Tested";

type MailConfigForm = {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  senderName: string;
  senderEmail: string;
  secure: boolean;
  outgoingMailEnabled: boolean;
  authMailEnabled: boolean;
  notificationMailEnabled: boolean;
};

type TestEmailForm = {
  to: string;
  subject: string;
  message: string;
};

export default function MailServerPage(): JSX.Element {
  const toast = useToast();

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("Not Tested");
  const [lastTestedAt, setLastTestedAt] = useState<string>("--");

  const [config, setConfig] = useState<MailConfigForm>({
    smtpHost: "",
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "••••••••••",
    senderName: "ITJob System",
    senderEmail: "",
    secure: false,
    outgoingMailEnabled: true,
    authMailEnabled: true,
    notificationMailEnabled: true,
  });

  const [testEmail, setTestEmail] = useState<TestEmailForm>({
    to: "",
    subject: "Test email from ITJob Mail Server",
    message: "This is a test email to verify the current SMTP configuration of the ITJob platform.",
  });

  const controlStyles = useMemo(
    () => ({
      "& input": {
        h: "37px",
        borderColor: "#E2E8F0",
        _hover: { borderColor: "#CBD5E0" },
        _focusVisible: {
          borderColor: "#334371",
          boxShadow: "0 0 0 1px #334371",
        },
      },
      "& textarea": {
        borderColor: "#E2E8F0",
        _hover: { borderColor: "#CBD5E0" },
        _focusVisible: {
          borderColor: "#334371",
          boxShadow: "0 0 0 1px #334371",
        },
      },
    }),
    []
  );

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const data = await mailServerApi.getConfig();

      setConfig((prev) => ({
        ...prev,
        smtpHost: data.host || "",
        smtpPort: String(data.port || ""),
        smtpUsername: data.user || "",
        senderEmail: data.from || "",
        senderName: data.fromName || "ITJob System",
        secure: Boolean(data.secure),
      }));

      setTestEmail((prev) => ({
        ...prev,
        to: data.from || "",
      }));
    } catch (error: any) {
      toast({
        title: "Failed to load mail configuration",
        description: error?.response?.data?.message || error?.message || "Unknown error",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    void fetchConfig();
  }, []);

const handleTestConnection = async () => {
  try {
    setTestingConnection(true);

    const res = await mailServerApi.testConnection();

    setConnectionStatus("Connected");
    setLastTestedAt(new Date().toLocaleString("vi-VN"));

    toast({
      title: "Connection successful",
      description: res.message || "SMTP connection verified successfully",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  } catch (error: any) {
    setConnectionStatus("Disconnected");
    setLastTestedAt(new Date().toLocaleString("vi-VN"));

    toast({
      title: "Connection failed",
      description:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to verify SMTP connection",
      status: "error",
      duration: 3500,
      isClosable: true,
    });
  } finally {
    setTestingConnection(false);
  }
};
const handleSendTestEmail = async () => {
  const recipientEmail = testEmail.to.trim();

  if (!recipientEmail) {
    toast({
      title: "Recipient email is required",
      status: "warning",
      duration: 2500,
      isClosable: true,
    });
    return;
  }

  try {
    setSendingTestEmail(true);

    const res = await mailServerApi.sendTestEmail(recipientEmail);

    toast({
      title: "Test email sent",
      description: res.message || "Email sent successfully",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  } catch (error: any) {
    toast({
      title: "Failed to send test email",
      description:
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error",
      status: "error",
      duration: 3500,
      isClosable: true,
    });
  } finally {
    setSendingTestEmail(false);
  }
};

  const handleSaveChanges = () => {
    toast({
      title: "Mail settings are managed via .env",
      description: "This page is used for monitoring and testing the current mail server configuration.",
      status: "info",
      duration: 3500,
      isClosable: true,
    });
  };

  if (loadingConfig) {
    return (
      <Flex minH="300px" align="center" justify="center" direction="column" gap={3}>
        <Spinner size="lg" color="#334371" />
        <Text fontSize="sm" color="gray.600">
          Loading mail server configuration...
        </Text>
      </Flex>
    );
  }

  return (
    <VStack align="stretch" spacing={5} sx={controlStyles}>
      <Flex
        align={{ base: "flex-start", lg: "center" }}
        justify="space-between"
        direction={{ base: "column", lg: "row" }}
        gap={4}
      >
        <Box>
          <Text fontSize="sm" color="gray.500" fontWeight="500">
            System Settings / Mail Server
          </Text>
          <Text fontSize="2xl" fontWeight="700" color="gray.800" mt={1}>
            Mail Server Configuration
          </Text>
          <Text fontSize="sm" color="gray.600" mt={1} maxW="760px">
            Configure and test the SMTP service currently used by the system for authentication and candidate email workflows.
          </Text>
        </Box>

        <HStack spacing={3}>
          <Button
            leftIcon={<FaSyncAlt />}
            variant="outline"
            borderColor="gray.300"
            color="gray.700"
            bg="white"
            _hover={{ bg: "gray.50" }}
            onClick={handleTestConnection}
            isLoading={testingConnection}
            loadingText="Testing"
          >
            Test Connection
          </Button>

          <Button
            leftIcon={<FaSave />}
            bg="#334371"
            color="white"
            _hover={{ bg: "#2C3A64" }}
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
        <StatusCard
          title="Service Status"
          value={config.outgoingMailEnabled ? "Enabled" : "Disabled"}
          description="Outgoing mail service status"
          tone={config.outgoingMailEnabled ? "green" : "gray"}
        />
        <StatusCard
          title="Connection"
          value={connectionStatus}
          description={lastTestedAt === "--" ? "Not tested yet" : `Last tested ${lastTestedAt}`}
          tone={connectionStatus === "Connected" ? "blue" : connectionStatus === "Disconnected" ? "orange" : "gray"}
        />
        <StatusCard
          title="Default Sender"
          value={config.senderName || "ITJob System"}
          description={config.senderEmail || "--"}
          tone="gray"
        />
        <StatusCard
          title="Security"
          value={config.secure ? "Secure" : "Standard"}
          description={config.secure ? "SMTP secure enabled" : "SMTP secure disabled"}
          tone="orange"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={5}>
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="2xl"
          overflow="hidden"
          gridColumn={{ base: "span 1", xl: "span 2" }}
        >
          <SectionHeader
            title="SMTP Configuration"
            description="These values are loaded from the current server environment configuration."
            rightContent={
              <Badge
                px={3}
                py={1}
                borderRadius="full"
                bg="blue.50"
                color="blue.700"
                border="1px solid"
                borderColor="blue.200"
              >
                Read-only config
              </Badge>
            }
          />

          <Box p={6}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
              <ConfigField label="SMTP Host">
                <Input value={config.smtpHost} isReadOnly />
              </ConfigField>

              <ConfigField label="SMTP Port">
                <Input value={config.smtpPort} isReadOnly />
              </ConfigField>

              <ConfigField label="SMTP Username">
                <Input value={config.smtpUsername} isReadOnly />
              </ConfigField>

              <ConfigField label="SMTP Password">
                <Input type="password" value={config.smtpPassword} isReadOnly />
              </ConfigField>

              <ConfigField label="Sender Name">
                <Input value={config.senderName} isReadOnly />
              </ConfigField>

              <ConfigField label="Sender Email">
                <Input value={config.senderEmail} isReadOnly />
              </ConfigField>
            </SimpleGrid>

            <Divider my={6} />

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <SwitchCard
                title="Enable Outgoing Mail"
                description="Allow the system to send emails to users"
                isChecked={config.outgoingMailEnabled}
              />
              <SwitchCard
                title="Authentication Emails"
                description="Registration, verification, forgot password"
                isChecked={config.authMailEnabled}
              />
              <SwitchCard
                title="System Notifications"
                description="Application updates and platform notices"
                isChecked={config.notificationMailEnabled}
              />
            </SimpleGrid>
          </Box>
        </Box>

        <VStack spacing={5} align="stretch">
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden">
            <SectionHeader
              title="Connection Summary"
              description="Current mail service status and verification details."
            />

            <VStack align="stretch" spacing={0} p={6}>
              <SummaryRow
                label="Status"
                value={connectionStatus}
                tone={connectionStatus === "Connected" ? "green" : "default"}
              />
              <SummaryRow label="Host" value={config.smtpHost || "--"} />
              <SummaryRow label="Port" value={config.smtpPort || "--"} />
              <SummaryRow label="Username" value={config.smtpUsername || "--"} />
              <SummaryRow label="Sender" value={config.senderEmail || "--"} />
              <SummaryRow label="Last Tested" value={lastTestedAt} isLast />
            </VStack>
          </Box>

          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden">
            <SectionHeader
              title="Send Test Email"
              description="Verify email delivery using the current SMTP configuration."
            />

            <VStack align="stretch" spacing={4} p={6}>
              <ConfigField label="Recipient Email">
                <Input
                  value={testEmail.to}
                  onChange={(e) => setTestEmail((prev) => ({ ...prev, to: e.target.value }))}
                  placeholder="Enter recipient email"
                />
              </ConfigField>

              <ConfigField label="Subject">
                <Input
                  value={testEmail.subject}
                  onChange={(e) => setTestEmail((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </ConfigField>

              <ConfigField label="Message">
                <Textarea
                  rows={5}
                  resize="none"
                  value={testEmail.message}
                  onChange={(e) => setTestEmail((prev) => ({ ...prev, message: e.target.value }))}
                />
              </ConfigField>

              <Button
                leftIcon={<FaPaperPlane />}
                bg="#334371"
                color="white"
                _hover={{ bg: "#2C3A64" }}
                onClick={handleSendTestEmail}
                isLoading={sendingTestEmail}
                loadingText="Sending"
              >
                Send Test Email
              </Button>
            </VStack>
          </Box>
        </VStack>
      </SimpleGrid>
    </VStack>
  );
}

type SectionHeaderProps = {
  title: string;
  description: string;
  rightContent?: React.ReactNode;
};

function SectionHeader({ title, description, rightContent }: SectionHeaderProps): JSX.Element {
  return (
    <Flex
      px={6}
      py={5}
      borderBottom="1px solid"
      borderColor="gray.200"
      align={{ base: "flex-start", md: "center" }}
      justify="space-between"
      direction={{ base: "column", md: "row" }}
      gap={3}
    >
      <Box>
        <Text fontSize="lg" fontWeight="700" color="gray.800">
          {title}
        </Text>
        <Text fontSize="sm" color="gray.500" mt={1}>
          {description}
        </Text>
      </Box>
      {rightContent ? <Box>{rightContent}</Box> : null}
    </Flex>
  );
}

type StatusCardProps = {
  title: string;
  value: string;
  description: string;
  tone: "green" | "blue" | "gray" | "orange";
};

function StatusCard({ title, value, description, tone }: StatusCardProps): JSX.Element {
  const toneMap = {
    green: { dot: "green.500" },
    blue: { dot: "blue.500" },
    gray: { dot: "gray.500" },
    orange: { dot: "orange.500" },
  };

  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" p={5}>
      <Text fontSize="sm" color="gray.500" fontWeight="600">
        {title}
      </Text>
      <HStack spacing={2} mt={3}>
        <Box w="10px" h="10px" borderRadius="full" bg={toneMap[tone].dot} />
        <Text fontSize="lg" fontWeight="700" color="gray.800">
          {value}
        </Text>
      </HStack>
      <Text fontSize="sm" color="gray.600" mt={2}>
        {description}
      </Text>
    </Box>
  );
}

type ConfigFieldProps = {
  label: string;
  children: React.ReactNode;
};

function ConfigField({ label, children }: ConfigFieldProps): JSX.Element {
  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
        {label}
      </FormLabel>
      {children}
    </FormControl>
  );
}

type SwitchCardProps = {
  title: string;
  description: string;
  isChecked: boolean;
};

function SwitchCard({ title, description, isChecked }: SwitchCardProps): JSX.Element {
  return (
    <Box border="1px solid" borderColor="gray.200" borderRadius="xl" p={4} bg="gray.50">
      <Flex align="flex-start" justify="space-between" gap={4}>
        <Box>
          <Text fontSize="sm" fontWeight="700" color="gray.800">
            {title}
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {description}
          </Text>
        </Box>
        <Switch colorScheme="blue" isChecked={isChecked} isReadOnly />
      </Flex>
    </Box>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  tone?: "default" | "green";
  isLast?: boolean;
};

function SummaryRow({ label, value, tone = "default", isLast = false }: SummaryRowProps): JSX.Element {
  return (
    <Flex
      justify="space-between"
      align="center"
      py={3}
      borderBottom={isLast ? "none" : "1px dashed"}
      borderColor="gray.200"
      gap={4}
    >
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>

      {tone === "green" ? (
        <Badge
          px={3}
          py={1}
          borderRadius="full"
          bg="green.50"
          color="green.700"
          border="1px solid"
          borderColor="green.200"
        >
          {value}
        </Badge>
      ) : (
        <Text fontSize="sm" fontWeight="600" color="gray.800" textAlign="right">
          {value}
        </Text>
      )}
    </Flex>
  );
}