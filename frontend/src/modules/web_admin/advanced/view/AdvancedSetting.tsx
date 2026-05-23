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
  Select,
  Badge,
  Divider,
  Button,
  Textarea,
} from "@chakra-ui/react";
import type { JSX } from "react";
import { FaSave, FaUndoAlt, FaShieldAlt } from "react-icons/fa";

type SecurityStatusTone = "green" | "orange" | "blue" | "red";

type SecurityCardStat = {
  title: string;
  value: string;
  description: string;
  tone: SecurityStatusTone;
};

type ToggleCardProps = {
  title: string;
  description: string;
  isChecked: boolean;
};

type ConfigFieldProps = {
  label: string;
  children: React.ReactNode;
};

type SectionHeaderProps = {
  title: string;
  description: string;
  rightContent?: React.ReactNode;
};

type SummaryRowProps = {
  label: string;
  value: string;
  tone?: "default" | "green" | "orange" | "red";
  isLast?: boolean;
};

const securityStats: SecurityCardStat[] = [
  {
    title: "Security Level",
    value: "High",
    description: "Core security policies are enabled",
    tone: "green",
  },
  {
    title: "Admin Protection",
    value: "2FA Required",
    description: "All admin accounts must verify login",
    tone: "blue",
  },
  {
    title: "Login Monitoring",
    value: "Active",
    description: "Suspicious sign-in detection is enabled",
    tone: "orange",
  },
  {
    title: "Access Control",
    value: "Restricted",
    description: "Admin access is limited by IP policy",
    tone: "red",
  },
];

export default function AdvancedSecurityPage(): JSX.Element {
  const controlStyles = {
    "& input": {
      h: "37px",
      borderColor: "#E2E8F0",
      _hover: { borderColor: "#CBD5E0" },
      _focusVisible: {
        borderColor: "#334371",
        boxShadow: "0 0 0 1px #334371",
      },
    },
    "& select": {
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
  };

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
            System Settings / Advanced Security
          </Text>
          <Text fontSize="2xl" fontWeight="700" color="gray.800" mt={1}>
            Advanced Security Settings
          </Text>
          <Text fontSize="sm" color="gray.600" mt={1} maxW="760px">
            Manage password policies, authentication rules, session protection, access control, and security alerts for the platform.
          </Text>
        </Box>

        <HStack spacing={3}>
          <Button
            leftIcon={<FaUndoAlt />}
            variant="outline"
            borderColor="gray.300"
            color="gray.700"
            bg="white"
            _hover={{ bg: "gray.50" }}
          >
            Reset Default
          </Button>
          <Button
            leftIcon={<FaSave />}
            bg="#334371"
            color="white"
            _hover={{ bg: "#2C3A64" }}
          >
            Save Changes
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
        {securityStats.map((item) => (
          <StatusCard
            key={item.title}
            title={item.title}
            value={item.value}
            description={item.description}
            tone={item.tone}
          />
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={5}>
        <VStack spacing={5} align="stretch" gridColumn={{ base: "span 1", xl: "span 2" }}>
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden">
            <SectionHeader
              title="Password Policy"
              description="Define rules for stronger account passwords across the system."
              rightContent={
                <Badge px={3} py={1} borderRadius="full" bg="green.50" color="green.700" border="1px solid" borderColor="green.200">
                  Recommended
                </Badge>
              }
            />

            <Box p={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <ConfigField label="Minimum Password Length">
                  <Input defaultValue="8" />
                </ConfigField>

                <ConfigField label="Password Expiration (Days)">
                  <Input defaultValue="90" />
                </ConfigField>
              </SimpleGrid>

              <Divider my={6} />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <ToggleCard
                  title="Require Uppercase Letters"
                  description="Password must contain at least one uppercase letter"
                  isChecked={true}
                />
                <ToggleCard
                  title="Require Numbers"
                  description="Password must contain at least one numeric character"
                  isChecked={true}
                />
                <ToggleCard
                  title="Require Special Characters"
                  description="Password must include one special symbol"
                  isChecked={true}
                />
                <ToggleCard
                  title="Prevent Reused Passwords"
                  description="Users cannot reuse their recent passwords"
                  isChecked={true}
                />
              </SimpleGrid>
            </Box>
          </Box>

          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden">
            <SectionHeader
              title="Login Protection"
              description="Reduce unauthorized access by controlling failed login attempts."
            />

            <Box p={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <ConfigField label="Max Failed Attempts">
                  <Input defaultValue="5" />
                </ConfigField>

                <ConfigField label="Temporary Lock Duration (Minutes)">
                  <Input defaultValue="15" />
                </ConfigField>
              </SimpleGrid>

              <Divider my={6} />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <ToggleCard
                  title="Enable CAPTCHA"
                  description="Show CAPTCHA after repeated failed login attempts"
                  isChecked={true}
                />
                <ToggleCard
                  title="Block Suspicious IP"
                  description="Automatically block login from flagged IP addresses"
                  isChecked={false}
                />
              </SimpleGrid>
            </Box>
          </Box>

          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden">
            <SectionHeader
              title="Session Security"
              description="Control user sessions and protect idle accounts."
            />

            <Box p={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <ConfigField label="Session Timeout (Minutes)">
                  <Input defaultValue="30" />
                </ConfigField>

                <ConfigField label="Concurrent Sessions Limit">
                  <Input defaultValue="2" />
                </ConfigField>
              </SimpleGrid>

              <Divider my={6} />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <ToggleCard
                  title="Auto Logout When Inactive"
                  description="Automatically end sessions after inactivity"
                  isChecked={true}
                />
                <ToggleCard
                  title="Remember Device"
                  description="Allow trusted devices to stay signed in longer"
                  isChecked={false}
                />
              </SimpleGrid>
            </Box>
          </Box>

          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden">
            <SectionHeader
              title="Two-Factor Authentication"
              description="Add an extra verification step for sensitive accounts."
            />

            <Box p={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <ConfigField label="2FA Method">
                  <Select defaultValue="email_otp">
                    <option value="email_otp">Email OTP</option>
                    <option value="authenticator_app">Authenticator App</option>
                    <option value="sms_otp">SMS OTP</option>
                  </Select>
                </ConfigField>

                <ConfigField label="Backup Code Length">
                  <Input defaultValue="8" />
                </ConfigField>
              </SimpleGrid>

              <Divider my={6} />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <ToggleCard
                  title="Enable Two-Factor Authentication"
                  description="Allow users to verify login with an additional step"
                  isChecked={true}
                />
                <ToggleCard
                  title="Require 2FA For Admins"
                  description="Mandatory two-factor authentication for admin accounts"
                  isChecked={true}
                />
              </SimpleGrid>
            </Box>
          </Box>
        </VStack>

        <VStack spacing={5} align="stretch">
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden">
            <SectionHeader
              title="Access Control"
              description="Restrict access based on IP rules and environments."
            />

            <VStack align="stretch" spacing={4} p={6}>
              <ConfigField label="Admin Access Mode">
                <Select defaultValue="restricted">
                  <option value="open">Open Access</option>
                  <option value="restricted">Restricted By IP</option>
                  <option value="internal_only">Internal Network Only</option>
                </Select>
              </ConfigField>

              <ConfigField label="IP Whitelist">
                <Textarea
                  rows={6}
                  resize="none"
                  defaultValue={`192.168.1.10\n192.168.1.11\n10.0.0.5`}
                />
              </ConfigField>

              <ToggleCard
                title="Restrict Admin Login By IP"
                description="Only allow admin login from approved IP addresses"
                isChecked={true}
              />
            </VStack>
          </Box>

          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden">
            <SectionHeader
              title="Security Alerts"
              description="Receive alerts for risky activities and critical changes."
            />

            <VStack align="stretch" spacing={4} p={6}>
              <ToggleCard
                title="Login Alert Emails"
                description="Send email when a new device or location signs in"
                isChecked={true}
              />
              <ToggleCard
                title="Password Change Alerts"
                description="Notify users when their password is changed"
                isChecked={true}
              />
              <ToggleCard
                title="Suspicious Login Detection"
                description="Flag unusual login patterns for review"
                isChecked={true}
              />
              <ToggleCard
                title="Critical Admin Action Alerts"
                description="Notify when important security settings are modified"
                isChecked={true}
              />
            </VStack>
          </Box>

          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden">
            <SectionHeader
              title="Security Summary"
              description="Overview of current advanced protection settings."
            />

            <VStack align="stretch" spacing={0} p={6}>
              <SummaryRow label="Password Policy" value="Strong" tone="green" />
              <SummaryRow label="Failed Login Lock" value="5 attempts / 15 min" tone="orange" />
              <SummaryRow label="Session Timeout" value="30 minutes" />
              <SummaryRow label="2FA For Admins" value="Required" tone="green" />
              <SummaryRow label="IP Restriction" value="Enabled" tone="red" />
              <SummaryRow label="Last Updated By" value="System Admin" isLast />
            </VStack>
          </Box>

          <Box bg="#334371" color="white" borderRadius="2xl" p={5}>
            <HStack align="flex-start" spacing={4}>
              <Box mt={1}>
                <FaShieldAlt />
              </Box>
              <Box>
                <Text fontSize="md" fontWeight="700">
                  Enterprise Security Note
                </Text>
                <Text fontSize="sm" color="whiteAlpha.800" mt={2} lineHeight="1.7">
                  Sensitive settings such as 2FA enforcement, IP restrictions, and login protection should be reviewed carefully before being applied to the production environment.
                </Text>
              </Box>
            </HStack>
          </Box>
        </VStack>
      </SimpleGrid>
    </VStack>
  );
}

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
  tone: SecurityStatusTone;
};

function StatusCard({ title, value, description, tone }: StatusCardProps): JSX.Element {
  const toneMap = {
    green: { dot: "green.500" },
    orange: { dot: "orange.500" },
    blue: { dot: "blue.500" },
    red: { dot: "red.500" },
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

function ToggleCard({ title, description, isChecked }: ToggleCardProps): JSX.Element {
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
        <Switch colorScheme="blue" isChecked={isChecked} />
      </Flex>
    </Box>
  );
}

function SummaryRow({ label, value, tone = "default", isLast = false }: SummaryRowProps): JSX.Element {
  const badgeTone = {
    green: { bg: "green.50", color: "green.700", border: "green.200" },
    orange: { bg: "orange.50", color: "orange.700", border: "orange.200" },
    red: { bg: "red.50", color: "red.700", border: "red.200" },
  };

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

      {tone === "default" ? (
        <Text fontSize="sm" fontWeight="600" color="gray.800" textAlign="right">
          {value}
        </Text>
      ) : (
        <Badge
          px={3}
          py={1}
          borderRadius="full"
          bg={badgeTone[tone].bg}
          color={badgeTone[tone].color}
          border="1px solid"
          borderColor={badgeTone[tone].border}
          textTransform="none"
        >
          {value}
        </Badge>
      )}
    </Flex>
  );
}
