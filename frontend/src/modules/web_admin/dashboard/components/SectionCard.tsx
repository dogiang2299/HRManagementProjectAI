import { Box, Flex, Text } from "@chakra-ui/react";

import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

const BORDER = "#E3E8F2";

export default function SectionCard({
  title,
  subtitle,
  right,
  children,
}: SectionCardProps) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={BORDER}
      borderRadius="24px"
      p={{ base: 4, md: 6 }}
      boxShadow="0 10px 30px rgba(26, 39, 68, 0.06)"
    >
      <Flex
        mb={6}
        gap={3}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        direction={{ base: "column", md: "row" }}
      >
        <Box>
          <Text fontSize="lg" fontWeight="700" color="gray.800">
            {title}
          </Text>
          {subtitle && (
            <Text mt={1} fontSize="sm" color="gray.500">
              {subtitle}
            </Text>
          )}
        </Box>
        {right}
      </Flex>
      {children}
    </Box>
  );
};