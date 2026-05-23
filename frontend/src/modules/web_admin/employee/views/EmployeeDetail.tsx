import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Center,
  Container,
  Divider,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import {
  EMPLOYEE_STATUS_DISPLAY,
  GENDER_EMPLOYEE_DISPLAY,
  type EmployeeStatusType,
  type GenderEmployeeType,
} from "../../../../constant";
import { formatDateShort } from "../../../../types";
import { useEmployeeByID } from "../api/get_employee";
import EmployeeModal from "../components/EmployeeModal";
import { getAuthUser, getRoleNames } from "../utils";

const EmployeeDetail = () => {
  const { id: paramId } = useParams();
  const authUser = getAuthUser();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isAdmin = useMemo(() => {
    const names = getRoleNames(authUser?.roles).map((x) => x.toLowerCase());
    return names.includes(String(RECRUIT_BASE_ROLE.Admin).toLowerCase());
  }, [authUser?.roles]);

  const userId = isAdmin ? paramId || authUser?.id : authUser?.id;

  const {
    data: employee,
    isLoading,
    isError,
    refetch,
  } = useEmployeeByID(userId || "", { enabled: !!userId });

  if (!userId) {
    return (
      <Center p={10}>
        <Text color="red.500">User ID not found.</Text>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center p={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isError || !employee) {
    return (
      <Center p={10}>
        <Text color="red.500">Failed to load profile info.</Text>
      </Center>
    );
  }

  const rolesDisplay = getRoleNames(employee.roles).join(" | ") || "N/A";

  const Field = ({ label, value }: { label: string; value: any }) => (
    <Box minW={0}>
      <Text
        color="gray.500"
        fontSize="xs"
        mb={0.5}
        textTransform="uppercase"
        letterSpacing="wider"
      >
        {label}
      </Text>
      <Text fontWeight="600" fontSize="sm" color="gray.800" noOfLines={2}>
        {value ?? "N/A"}
      </Text>
    </Box>
  );

  const Section = ({
    title,
    children,
    mb,
  }: {
    title: string;
    children: React.ReactNode;
    mb?: any;
  }) => (
    <Box
      bg="white"
      p={{ base: 4, md: 5 }}
      borderRadius="xl"
      shadow="sm"
      border="1px solid"
      borderColor="gray.200"
      mb={mb}
    >
      <Heading size="sm" color="gray.800" mb={3}>
        {title}
      </Heading>
      <Divider mb={4} />
      {children}
    </Box>
  );

  return (
    <Box w="100%" py={{ base: 0, md: 0 }}>
      <Container maxW="6xl" px={{ base: 0, md: 0 }}>
        {/* Header */}
        <Flex
          bg="white"
          p={{ base: 4, md: 5 }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.200"
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          mb={{ base: 4, md: 5 }}
          direction={{ base: "column", md: "row" }}
          gap={3}
        >
          <Stack spacing={0.5} minW={0}>
            <Heading size={{ base: "md", md: 'md' }} mb={'1'} color="gray.900" noOfLines={1}>
              {employee.employee_name || "N/A"}
            </Heading>
            <Text color="gray.600" fontWeight="500" fontSize="sm" noOfLines={1}>
              {rolesDisplay}
            </Text>
          </Stack>

          <Button
            onClick={() => setIsEditOpen(true)}
            size="sm"
            background={'#334371'}
            color={'white'}
            alignSelf={{ base: "flex-start", md: "auto" }}
          >
            UPDATE
          </Button>
        </Flex>

        <Section title="Basic information" mb={{ base: 4, md: 5 }}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacingX={8} spacingY={6}>
            <Field label="Employee code" value={employee.emp_code || "N/A"} />
            <Field label="Employee name" value={employee.employee_name || "N/A"} />
            <Field label="Personal email" value={employee.email || "N/A"} />
            <Field
              label="Date of birth"
              value={employee.date_of_birth ? formatDateShort(employee.date_of_birth) : "N/A"}
            />
            <Field
              label="Gender"
              value={
                employee.gender
                  ? GENDER_EMPLOYEE_DISPLAY[employee.gender as GenderEmployeeType] ||
                    String(employee.gender)
                  : "N/A"
              }
            />
            <Field label="Address" value={employee.address || "N/A"} />
          </SimpleGrid>
        </Section>

        <Section title="Account information" mb={{ base: 4, md: 5 }}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacingX={8} spacingY={6}>
            <Field label="Account email" value={employee.email_account || "N/A"} />
            <Field label="Account phone" value={employee.phone_account || "N/A"} />
          </SimpleGrid>
        </Section>

        <Section title="Other">
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacingX={8} spacingY={6}>
            <Field
              label="Status"
              value={
                EMPLOYEE_STATUS_DISPLAY[employee.status as EmployeeStatusType] ||
                employee.status ||
                "N/A"
              }
            />
            <Field label="Roles" value={rolesDisplay} />
          </SimpleGrid>
        </Section>

        {isEditOpen && (
          <EmployeeModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            mode="edit"
            data={employee}
            onSuccess={() => {
              refetch();
              setIsEditOpen(false);
            }}
          />
        )}
      </Container>
    </Box>
  );
};

export default EmployeeDetail;