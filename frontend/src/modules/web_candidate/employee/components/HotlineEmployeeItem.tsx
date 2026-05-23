import { Box, HStack, Icon, Link, Text, VStack } from "@chakra-ui/react";
import { FiMail, FiPhone } from "react-icons/fi";

type HotlineEmployeeItemProps = {
  employee: {
    id?: string;
    employee_name?: string | null;
    email?: string | null;
    email_account?: string | null;
    phone_account?: string | null;
    avatar?: string | null;
  };
};

const HotlineEmployeeItem = ({ employee }: HotlineEmployeeItemProps) => {
  const displayName = employee.employee_name || "Support staff";
  const email = employee.email || employee.email_account || "";
  const phone = employee.phone_account || "";

  return (
    <Box
      bg="rgba(255,255,255,0.58)"
      border="1px solid"
      borderColor="rgba(148,163,184,0.14)"
      borderRadius="12px"
      px={{ base: 3, md: 3.5 }}
      py={{ base: 2.5, md: 3 }}
      transition="all 0.2s ease"
      _hover={{
        bg: "rgba(255,255,255,0.82)",
        borderColor: "rgba(51,67,113,0.18)",
      }}
    >
      <VStack align="start" spacing={1.5}>
        <Text
          color="#1E293B"
          fontWeight="700"
          fontSize={{ base: "sm", md: "sm" }}
          lineHeight="1.4"
          noOfLines={1}
        >
          {displayName}
        </Text>

        {phone ? (
          <HStack spacing={2} align="center">
            <Icon as={FiPhone} boxSize={3} color="#334371" />
            <Link
              href={`tel:${phone}`}
              color="#334371"
              fontWeight="600"
              fontSize="sm"
              lineHeight="1.4"
              _hover={{ textDecoration: "none", color: "#334371" }}
            >
              {phone}
            </Link>
          </HStack>
        ) : null}

        {email ? (
          <HStack spacing={2} align="center">
            <Icon as={FiMail} boxSize={3} color="#334371" />
            <Link
              href={`mailto:${email}`}
              color="#64748B"
              fontWeight="500"
              fontSize="xs"
              lineHeight="1.4"
              wordBreak="break-word"
              _hover={{ textDecoration: "none", color: "#334155" }}
            >
              {email}
            </Link>
          </HStack>
        ) : null}
      </VStack>
    </Box>
  );
};

export default HotlineEmployeeItem;