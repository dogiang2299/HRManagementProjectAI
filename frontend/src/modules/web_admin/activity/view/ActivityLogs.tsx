import React from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEye,
  FiFilter,
  FiGlobe,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiServer,
  FiSettings,
  FiShield,
  FiUser,
  FiXCircle,
} from 'react-icons/fi';

type LogSeverity = 'Info' | 'Warning' | 'Error' | 'Critical';
type LogStatus = 'Success' | 'Failed' | 'Pending';

type LogItem = {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  module: string;
  action: string;
  description: string;
  ipAddress: string;
  status: LogStatus;
  severity: LogSeverity;
  endpoint: string;
  device: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
};

const logs: LogItem[] = [
  {
    id: 'LOG-20260406-001',
    timestamp: '2026-04-06 14:32:15',
    user: 'giang.admin@itjob.vn',
    role: 'Super Admin',
    module: 'Mail Server',
    action: 'Update SMTP Settings',
    description: 'SMTP host and port were updated successfully.',
    ipAddress: '192.168.1.24',
    status: 'Success',
    severity: 'Info',
    endpoint: '/api/admin/mail-server',
    device: 'Chrome on macOS',
    oldValue: 'smtp.oldmail.com : 465',
    newValue: 'smtp.gmail.com : 587',
    note: 'Configuration saved from admin settings panel.',
  },
  {
    id: 'LOG-20260406-002',
    timestamp: '2026-04-06 13:58:42',
    user: 'security.admin@itjob.vn',
    role: 'Security Admin',
    module: 'Advanced Security',
    action: 'Enable 2FA Policy',
    description: 'Two-factor authentication policy enabled for admin accounts.',
    ipAddress: '10.24.8.11',
    status: 'Success',
    severity: 'Warning',
    endpoint: '/api/admin/security/policies',
    device: 'Edge on Windows 11',
    oldValue: '2FA = Disabled',
    newValue: '2FA = Enabled',
    note: 'Policy will apply to all admin users from next login.',
  },
  {
    id: 'LOG-20260406-003',
    timestamp: '2026-04-06 13:21:03',
    user: 'unknown.user@blocked.com',
    role: 'Unknown',
    module: 'Authentication',
    action: 'Failed Admin Login',
    description: 'Multiple failed login attempts detected.',
    ipAddress: '103.82.21.99',
    status: 'Failed',
    severity: 'Critical',
    endpoint: '/api/auth/login',
    device: 'Firefox on Linux',
    note: 'Risk flag raised after 5 invalid password attempts.',
  },
  {
    id: 'LOG-20260406-004',
    timestamp: '2026-04-06 12:49:17',
    user: 'ops.admin@itjob.vn',
    role: 'System Operator',
    module: 'General Settings',
    action: 'Change Session Timeout',
    description: 'Session timeout updated from 15 to 30 minutes.',
    ipAddress: '172.16.10.5',
    status: 'Success',
    severity: 'Info',
    endpoint: '/api/admin/general-settings',
    device: 'Chrome on macOS',
    oldValue: '15 minutes',
    newValue: '30 minutes',
    note: 'Applied globally for admin panel sessions.',
  },
  {
    id: 'LOG-20260406-005',
    timestamp: '2026-04-06 11:30:51',
    user: 'audit.admin@itjob.vn',
    role: 'Auditor',
    module: 'Activity Logs',
    action: 'Export Logs',
    description: 'Exported audit logs for the last 30 days.',
    ipAddress: '192.168.10.18',
    status: 'Success',
    severity: 'Warning',
    endpoint: '/api/admin/logs/export',
    device: 'Chrome on Windows 10',
    note: 'Export format: CSV',
  },
  {
    id: 'LOG-20260406-006',
    timestamp: '2026-04-06 10:42:26',
    user: 'infra.admin@itjob.vn',
    role: 'Infrastructure Admin',
    module: 'System',
    action: 'Backup Triggered',
    description: 'Automated configuration backup executed.',
    ipAddress: '127.0.0.1',
    status: 'Pending',
    severity: 'Info',
    endpoint: '/api/system/backup',
    device: 'Internal Scheduler',
    note: 'Backup process is still running in background queue.',
  },
];

const getSeverityScheme = (severity: LogSeverity) => {
  switch (severity) {
    case 'Info':
      return 'blue';
    case 'Warning':
      return 'orange';
    case 'Error':
      return 'red';
    case 'Critical':
      return 'purple';
    default:
      return 'gray';
  }
};

const getStatusScheme = (status: LogStatus) => {
  switch (status) {
    case 'Success':
      return 'green';
    case 'Failed':
      return 'red';
    case 'Pending':
      return 'yellow';
    default:
      return 'gray';
  }
};

const getModuleIcon = (module: string) => {
  switch (module) {
    case 'Mail Server':
      return FiMail;
    case 'Advanced Security':
      return FiShield;
    case 'Authentication':
      return FiLock;
    case 'General Settings':
      return FiSettings;
    case 'Activity Logs':
      return FiActivity;
    case 'System':
      return FiServer;
    default:
      return FiGlobe;
  }
};

const StatCard = ({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
}) => {
  return (
    <Card
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="20px"
      boxShadow="sm"
    >
      <CardBody p={5}>
        <Flex align="start" justify="space-between" gap={3}>
          <Box>
            <Text fontSize="sm" color="gray.500">{label}</Text>
            <Heading mt={2} size="md" color="gray.800">{value}</Heading>
            <Text mt={2} fontSize="sm" color="gray.500">{hint}</Text>
          </Box>
          <Flex
            w="46px"
            h="46px"
            borderRadius="16px"
            bg="blue.50"
            color="blue.600"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={icon} boxSize={5} />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

const FilterField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <FormControl>
      <Text mb={2} fontSize="sm" fontWeight="600" color="gray.700">{label}</Text>
      {children}
    </FormControl>
  );
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => {
  return (
    <Flex justify="space-between" gap={4} py={3} borderBottom="1px solid" borderColor="gray.100">
      <Text fontSize="sm" color="gray.500">{label}</Text>
      <Text fontSize="sm" color="gray.800" fontWeight="600" textAlign="right">
        {value || '--'}
      </Text>
    </Flex>
  );
};

const ActivityLogsPage: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLog, setSelectedLog] = React.useState<LogItem | null>(logs[0]);
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
  };

  const openDetail = (log: LogItem) => {
    setSelectedLog(log);
    onOpen();
  };

  return (
    <>
      <VStack align="stretch" spacing={5} sx={controlStyles}>
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          align={{ base: 'flex-start', lg: 'center' }}
          justify="space-between"
          gap={4}
        >
          <Box>
            <Text fontSize="sm" color="gray.500" fontWeight="500">
              System Settings / Activity Logs
            </Text>
            <Heading size="lg" color="gray.800" mt={1}>Activity Logs</Heading>
            <Text mt={1.5} color="gray.600" fontSize="sm">
              Monitor administrative actions, system events, configuration changes and suspicious activities across the platform.
            </Text>
          </Box>

          <HStack spacing={3} justify={{ base: 'flex-start', lg: 'flex-end' }} flexWrap="wrap">
            <Badge colorScheme="green" variant="subtle" px={3} py={1.5} borderRadius="full" textTransform="none">
              Live Monitoring Enabled
            </Badge>
            <Button
              leftIcon={<FiRefreshCw />}
              variant="outline"
              borderColor="gray.300"
              bg="white"
              color="gray.700"
              borderRadius="12px"
            >
              Refresh
            </Button>
            <Button
              leftIcon={<FiDownload />}
              variant="outline"
              borderColor="gray.300"
              bg="white"
              color="gray.700"
              borderRadius="12px"
            >
              Export Logs
            </Button>
            <Button
              leftIcon={<FiFilter />}
              bg="#334371"
              color="white"
              _hover={{ bg: '#2C3A66' }}
              borderRadius="12px"
            >
              Apply Filters
            </Button>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={5}>
          <StatCard label="Total Events Today" value="12,458" hint="+8.2% compared to yesterday" icon={FiActivity} />
          <StatCard label="Critical Events" value="18" hint="3 unresolved incidents" icon={FiAlertCircle} />
          <StatCard label="Admin Actions" value="326" hint="Includes create, update and export actions" icon={FiUser} />
          <StatCard label="Failed Logins" value="41" hint="12 from unknown IP ranges" icon={FiLock} />
          <StatCard label="Config Changes" value="29" hint="Mail, security and general settings" icon={FiSettings} />
        </SimpleGrid>

        <Card
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="20px"
          boxShadow="sm"
        >
          <CardBody p={{ base: 5, md: 6 }}>
            <VStack align="stretch" spacing={5}>
              <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
                <Box>
                  <Heading size="sm" color="gray.800">Filter Activity Logs</Heading>
                  <Text mt={1} fontSize="sm" color="gray.500">
                    Narrow down records by module, action type, severity, user, date range or operational status.
                  </Text>
                </Box>
                <HStack spacing={3}>
                  <Text fontSize="sm" color="gray.500">Auto refresh</Text>
                  <Switch colorScheme="blue" defaultChecked />
                </HStack>
              </Flex>

              <Divider />

              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
                <FilterField label="Search Logs">
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiSearch color="#718096" />
                    </InputLeftElement>
                    <Input pl="40px" placeholder="Search by user, action, IP..." borderRadius="12px" />
                  </InputGroup>
                </FilterField>

                <FilterField label="Module">
                  <Select borderRadius="12px" defaultValue="all">
                    <option value="all">All Modules</option>
                    <option value="authentication">Authentication</option>
                    <option value="mail-server">Mail Server</option>
                    <option value="advanced-security">Advanced Security</option>
                    <option value="general-settings">General Settings</option>
                    <option value="system">System</option>
                  </Select>
                </FilterField>

                <FilterField label="Action Type">
                  <Select borderRadius="12px" defaultValue="all">
                    <option value="all">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="export">Export</option>
                  </Select>
                </FilterField>

                <FilterField label="Severity">
                  <Select borderRadius="12px" defaultValue="all">
                    <option value="all">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="critical">Critical</option>
                  </Select>
                </FilterField>

                <FilterField label="Status">
                  <Select borderRadius="12px" defaultValue="all">
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </Select>
                </FilterField>

                <FilterField label="User / Admin">
                  <Input placeholder="Enter email or admin name" borderRadius="12px" />
                </FilterField>

                <FilterField label="IP Address">
                  <Input placeholder="Example: 192.168.1.24" borderRadius="12px" />
                </FilterField>

                <FilterField label="Date Range">
                  <Select borderRadius="12px" defaultValue="today">
                    <option value="today">Today</option>
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="custom">Custom Range</option>
                  </Select>
                </FilterField>
              </SimpleGrid>

              <HStack justify="space-between" flexWrap="wrap">
                <Text fontSize="sm" color="gray.500">Showing 6 of 12,458 records</Text>
                <Button variant="ghost" color="gray.600">Reset Filters</Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="20px"
          boxShadow="sm"
        >
          <CardBody p={{ base: 0, md: 0 }}>
            <TableContainer>
              <Table variant="simple" size="md">
                <Thead bg="gray.50">
                  <Tr>
                    <Th py={4}>Timestamp</Th>
                    <Th>User</Th>
                    <Th>Role</Th>
                    <Th>Module</Th>
                    <Th>Action</Th>
                    <Th>Description</Th>
                    <Th>IP Address</Th>
                    <Th>Status</Th>
                    <Th>Severity</Th>
                    <Th textAlign="center">Details</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {logs.map((log) => {
                    const moduleIcon = getModuleIcon(log.module);
                    return (
                      <Tr key={log.id} _hover={{ bg: 'gray.50' }}>
                        <Td whiteSpace="nowrap">
                          <Text fontSize="sm" color="gray.800" fontWeight="600">{log.timestamp}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" fontWeight="600" color="gray.800">{log.user}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.600">{log.role}</Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Flex
                              w="32px"
                              h="32px"
                              borderRadius="10px"
                              bg="blue.50"
                              color="blue.600"
                              align="center"
                              justify="center"
                            >
                              <Icon as={moduleIcon} boxSize={4} />
                            </Flex>
                            <Text fontSize="sm" color="gray.700">{log.module}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.800" fontWeight="600">{log.action}</Text>
                        </Td>
                        <Td maxW="320px">
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>{log.description}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.600">{log.ipAddress}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusScheme(log.status)} borderRadius="full" px={3} py={1} textTransform="none">
                            {log.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={getSeverityScheme(log.severity)} borderRadius="full" px={3} py={1} textTransform="none">
                            {log.severity}
                          </Badge>
                        </Td>
                        <Td textAlign="center">
                          <IconButton
                            aria-label="View details"
                            icon={<FiEye />}
                            variant="ghost"
                            borderRadius="12px"
                            onClick={() => openDetail(log)}
                          />
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>

            <Divider />

            <Flex px={6} py={4} justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <Text fontSize="sm" color="gray.500">Page 1 of 48</Text>
              <HStack spacing={2}>
                <IconButton aria-label="Previous page" icon={<FiChevronLeft />} variant="outline" borderRadius="12px" />
                <Button size="sm" bg="#334371" color="white" _hover={{ bg: '#2C3A66' }} borderRadius="10px">1</Button>
                <Button size="sm" variant="outline" borderRadius="10px">2</Button>
                <Button size="sm" variant="outline" borderRadius="10px">3</Button>
                <IconButton aria-label="Next page" icon={<FiChevronRight />} variant="outline" borderRadius="12px" />
              </HStack>
            </Flex>
          </CardBody>
        </Card>
      </VStack>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <VStack align="start" spacing={1} pr={8}>
              <Text fontSize="lg" fontWeight="700" color="gray.800">Log Event Details</Text>
              <Text fontSize="sm" color="gray.500">Inspect event metadata, technical context and configuration change history.</Text>
            </VStack>
          </DrawerHeader>

          <DrawerBody px={0}>
            {selectedLog && (
              <VStack align="stretch" spacing={0}>
                <Box px={6} py={5} bg="gray.50">
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Text fontSize="sm" color="gray.500">Event ID</Text>
                      <Text mt={1} fontSize="md" fontWeight="700" color="gray.800">{selectedLog.id}</Text>
                    </Box>
                    <VStack align="end" spacing={2}>
                      <Badge colorScheme={getStatusScheme(selectedLog.status)} borderRadius="full" px={3} py={1} textTransform="none">
                        {selectedLog.status}
                      </Badge>
                      <Badge colorScheme={getSeverityScheme(selectedLog.severity)} borderRadius="full" px={3} py={1} textTransform="none">
                        {selectedLog.severity}
                      </Badge>
                    </VStack>
                  </HStack>
                </Box>

                <Box px={6} py={5}>
                  <Heading size="sm" color="gray.800">Event Overview</Heading>
                  <Box mt={3}>
                    <DetailRow label="Timestamp" value={selectedLog.timestamp} />
                    <DetailRow label="Performed By" value={selectedLog.user} />
                    <DetailRow label="Role" value={selectedLog.role} />
                    <DetailRow label="Module" value={selectedLog.module} />
                    <DetailRow label="Action" value={selectedLog.action} />
                    <DetailRow label="Description" value={selectedLog.description} />
                  </Box>
                </Box>

                <Box px={6} py={5} bg="gray.50">
                  <Heading size="sm" color="gray.800">Technical Details</Heading>
                  <Box mt={3}>
                    <DetailRow label="IP Address" value={selectedLog.ipAddress} />
                    <DetailRow label="Device / Browser" value={selectedLog.device} />
                    <DetailRow label="API Endpoint" value={selectedLog.endpoint} />
                  </Box>
                </Box>

                <Box px={6} py={5}>
                  <Heading size="sm" color="gray.800">Change Summary</Heading>
                  <Box mt={3}>
                    <DetailRow label="Old Value" value={selectedLog.oldValue} />
                    <DetailRow label="New Value" value={selectedLog.newValue} />
                  </Box>
                </Box>

                <Box px={6} py={5} bg="gray.50">
                  <Heading size="sm" color="gray.800">Additional Context</Heading>
                  <Flex
                    mt={3}
                    p={4}
                    borderRadius="14px"
                    bg="blue.50"
                    border="1px solid"
                    borderColor="blue.100"
                    gap={3}
                    align="start"
                  >
                    <Icon
                      as={selectedLog.status === 'Success' ? FiCheckCircle : selectedLog.status === 'Failed' ? FiXCircle : FiClock}
                      color="blue.600"
                      mt="2px"
                    />
                    <Text fontSize="sm" color="blue.800" lineHeight="1.7">
                      {selectedLog.note || 'No additional notes were recorded for this event.'}
                    </Text>
                  </Flex>
                </Box>

                <Box px={6} py={5}>
                  <HStack spacing={3}>
                    <Button flex={1} variant="outline" borderRadius="12px">Close</Button>
                    <Button flex={1} bg="#334371" color="white" _hover={{ bg: '#2C3A66' }} borderRadius="12px">
                      Flag for Review
                    </Button>
                  </HStack>
                </Box>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ActivityLogsPage;
