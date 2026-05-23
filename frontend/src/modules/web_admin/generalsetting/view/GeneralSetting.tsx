import React from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  VStack,
  Badge,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiGlobe,
  FiClock,
  FiDatabase,
  FiMonitor,
  FiSave,
  FiRefreshCw,
  FiInfo,
  FiShield,
  FiBell,
  FiMail,
  FiCode,
} from 'react-icons/fi';

const SectionCard = ({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => {
  return (
    <Card
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="20px"
      boxShadow="sm"
      overflow="hidden"
    >
      <CardBody p={{ base: 5, md: 6 }}>
        <VStack align="stretch" spacing={5}>
          <Flex align="start" justify="space-between" gap={4}>
            <HStack align="start" spacing={3}>
              <Flex
                w="44px"
                h="44px"
                borderRadius="14px"
                bg="blue.50"
                color="blue.600"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={icon} boxSize={5} />
              </Flex>
              <Box>
                <Heading size="sm" color="gray.800">
                  {title}
                </Heading>
                <Text mt={1} fontSize="sm" color="gray.500" lineHeight="1.6">
                  {subtitle}
                </Text>
              </Box>
            </HStack>
            <Badge
              colorScheme="green"
              variant="subtle"
              px={3}
              py={1}
              borderRadius="full"
              textTransform="none"
            >
              Configurable
            </Badge>
          </Flex>

          <Divider />

          {children}
        </VStack>
      </CardBody>
    </Card>
  );
};

const GeneralSettingsPage: React.FC = () => {
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
          direction={{ base: 'column', lg: 'row' }}
          align={{ base: 'flex-start', lg: 'center' }}
          justify="space-between"
          gap={4}
        >
          <Box>
            <Text fontSize="sm" color="gray.500" fontWeight="500">
              System Settings / General Settings
            </Text>
            <Heading size="lg" color="gray.800" mt={1}>
              General Settings
            </Heading>
            <Text mt={1.5} color="gray.600" fontSize="sm">
              Manage global platform preferences, localization, branding, notifications and system defaults.
            </Text>
          </Box>

          <HStack spacing={3} justify={{ base: 'flex-start', lg: 'flex-end' }}>
            <Button
              leftIcon={<FiRefreshCw />}
              variant="outline"
              borderColor="gray.300"
              color="gray.700"
              bg="white"
              _hover={{ bg: 'gray.50' }}
              borderRadius="12px"
            >
              Reset Changes
            </Button>
            <Button
              leftIcon={<FiSave />}
              bg="#334371"
              color="white"
              _hover={{ bg: '#2C3A66' }}
              borderRadius="12px"
              px={6}
            >
              Save Settings
            </Button>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={6}>
          <Grid gridColumn={{ base: 'span 1', xl: 'span 2' }} gap={6}>
            <SectionCard
              title="Platform Information"
              subtitle="Define the core identity and public facing information of your platform."
              icon={FiGlobe}
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Platform Name</FormLabel>
                  <Input placeholder="Enter platform name" defaultValue="ITJob Admin Portal" borderRadius="12px" bg="white" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">System Version</FormLabel>
                  <Input placeholder="Version" defaultValue="v2.1.0" borderRadius="12px" bg="white" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Support Email</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiMail color="#718096" />
                    </InputLeftElement>
                    <Input pl="42px" defaultValue="support@itjob.vn" borderRadius="12px" bg="white" />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Contact Number</FormLabel>
                  <Input placeholder="Phone number" defaultValue="+84 912 345 678" borderRadius="12px" bg="white" />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="sm" color="gray.700">System Description</FormLabel>
                <Textarea
                  minH="120px"
                  resize="vertical"
                  borderRadius="14px"
                  defaultValue="Centralized administration system for managing recruitment platform configuration, security preferences, notifications and operational defaults."
                />
              </FormControl>
            </SectionCard>

            <SectionCard
              title="Localization & Regional Preferences"
              subtitle="Configure timezone, language and regional display settings across the platform."
              icon={FiClock}
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Default Language</FormLabel>
                  <Select defaultValue="en" borderRadius="12px" bg="white">
                    <option value="en">English</option>
                    <option value="vi">Vietnamese</option>
                    <option value="ja">Japanese</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Timezone</FormLabel>
                  <Select defaultValue="asia_bangkok" borderRadius="12px" bg="white">
                    <option value="asia_bangkok">Asia/Bangkok (UTC+07:00)</option>
                    <option value="asia_tokyo">Asia/Tokyo (UTC+09:00)</option>
                    <option value="utc">UTC (UTC+00:00)</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Date Format</FormLabel>
                  <Select defaultValue="dd_mm_yyyy" borderRadius="12px" bg="white">
                    <option value="dd_mm_yyyy">DD/MM/YYYY</option>
                    <option value="mm_dd_yyyy">MM/DD/YYYY</option>
                    <option value="yyyy_mm_dd">YYYY-MM-DD</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Currency</FormLabel>
                  <Select defaultValue="vnd" borderRadius="12px" bg="white">
                    <option value="vnd">VND - Vietnamese Dong</option>
                    <option value="usd">USD - US Dollar</option>
                    <option value="jpy">JPY - Japanese Yen</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <HStack justify="space-between" p={4} border="1px solid" borderColor="gray.200" borderRadius="14px">
                <Box>
                  <Text fontWeight="600" color="gray.800">Auto detect user locale</Text>
                  <Text fontSize="sm" color="gray.500">Use browser and region preferences to localize public views.</Text>
                </Box>
                <Switch colorScheme="blue" defaultChecked />
              </HStack>
            </SectionCard>

            <SectionCard
              title="System Behavior"
              subtitle="Control default operations and platform-wide execution preferences."
              icon={FiDatabase}
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Session Timeout (minutes)</FormLabel>
                  <Input type="number" defaultValue="30" borderRadius="12px" bg="white" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Max Upload Size (MB)</FormLabel>
                  <Input type="number" defaultValue="20" borderRadius="12px" bg="white" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Default Items Per Page</FormLabel>
                  <Select defaultValue="20" borderRadius="12px" bg="white">
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Log Retention (days)</FormLabel>
                  <Input type="number" defaultValue="90" borderRadius="12px" bg="white" />
                </FormControl>
              </SimpleGrid>

              <Stack spacing={4}>
                <HStack justify="space-between" p={4} border="1px solid" borderColor="gray.200" borderRadius="14px">
                  <Box>
                    <Text fontWeight="600" color="gray.800">Enable maintenance mode</Text>
                    <Text fontSize="sm" color="gray.500">Temporarily restrict public access during deployment or upgrade.</Text>
                  </Box>
                  <Switch colorScheme="orange" />
                </HStack>

                <HStack justify="space-between" p={4} border="1px solid" borderColor="gray.200" borderRadius="14px">
                  <Box>
                    <Text fontWeight="600" color="gray.800">Auto backup configuration</Text>
                    <Text fontSize="sm" color="gray.500">Create scheduled snapshots before significant system changes.</Text>
                  </Box>
                  <Switch colorScheme="blue" defaultChecked />
                </HStack>
              </Stack>
            </SectionCard>
          </Grid>

          <Grid gap={6}>
            <SectionCard
              title="Branding"
              subtitle="Set visual identity and front-facing default appearance."
              icon={FiMonitor}
            >
              <VStack align="stretch" spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Primary Brand Color</FormLabel>
                  <Input defaultValue="#334371" borderRadius="12px" bg="white" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Admin Theme</FormLabel>
                  <Select defaultValue="light" borderRadius="12px" bg="white">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </Select>
                </FormControl>
                <Checkbox defaultChecked colorScheme="blue">Display platform logo in login screen</Checkbox>
                <Checkbox defaultChecked colorScheme="blue">Use compact admin navigation layout</Checkbox>
              </VStack>
            </SectionCard>

            <SectionCard
              title="Notification Defaults"
              subtitle="Configure default channels used for operational communications."
              icon={FiBell}
            >
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.700">Email notifications</Text>
                  <Switch colorScheme="blue" defaultChecked />
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.700">In-app alerts</Text>
                  <Switch colorScheme="blue" defaultChecked />
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.700">Security incident notices</Text>
                  <Switch colorScheme="red" defaultChecked />
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.700">Daily summary digest</Text>
                  <Switch colorScheme="blue" />
                </HStack>
              </VStack>
            </SectionCard>

            <SectionCard
              title="Integration & API"
              subtitle="Basic platform endpoints and integration level configurations."
              icon={FiCode}
            >
              <VStack align="stretch" spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Frontend Base URL</FormLabel>
                  <Input defaultValue="https://admin.itjob.vn" borderRadius="12px" bg="white" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Public API URL</FormLabel>
                  <Input defaultValue="https://api.itjob.vn/v1" borderRadius="12px" bg="white" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="gray.700">Environment</FormLabel>
                  <Select defaultValue="production" borderRadius="12px" bg="white">
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </Select>
                </FormControl>
              </VStack>
            </SectionCard>

            <SectionCard
              title="Configuration Summary"
              subtitle="Review important system flags before applying changes."
              icon={FiShield}
            >
              <Stack spacing={3}>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">Current Mode</Text>
                  <Badge colorScheme="green" borderRadius="full" px={3} py={1}>Production</Badge>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">Maintenance</Text>
                  <Badge colorScheme="gray" borderRadius="full" px={3} py={1}>Disabled</Badge>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">Locale</Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.800">English / Asia-Bangkok</Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">Last Updated</Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.800">06 Apr 2026, 14:45</Text>
                </Flex>
              </Stack>

              <Flex
                mt={2}
                p={4}
                borderRadius="14px"
                bg="blue.50"
                border="1px solid"
                borderColor="blue.100"
                gap={3}
                align="start"
              >
                <Icon as={FiInfo} color="blue.600" mt="2px" />
                <Text fontSize="sm" color="blue.800" lineHeight="1.7">
                  Changes to localization, session timeout and integration endpoints may affect both admin operations and public user experiences.
                </Text>
              </Flex>
            </SectionCard>
          </Grid>
        </SimpleGrid>
    </VStack>
  );
};

export default GeneralSettingsPage;
