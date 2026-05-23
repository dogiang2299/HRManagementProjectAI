import { Box, Text, VStack } from "@chakra-ui/react";
import { theme } from "../../../../theme";

type EmptyPlaceholderProps = {
  title: string;
  description: string;
};

export default function EmptyPlaceholder({ title, description }: EmptyPlaceholderProps) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={theme.colors.charts.BORDER}
      borderRadius="24px"
      p={{ base: 6, md: 8 }}
      boxShadow="0 10px 30px rgba(26, 39, 68, 0.06)"
    >
      <VStack spacing={3} align="start">
        <Text fontSize="2xl" fontWeight="800" color={theme.colors.charts.PRIMARY_900}>
          {title}
        </Text>
        <Text fontSize="sm" color="gray.500" maxW="700px">
          {description}
        </Text>

        <Box
          mt={4}
          w="full"
          minH="260px"
          borderRadius="20px"
          border="1px dashed"
          borderColor={theme.colors.charts.PRIMARY_200}
          bg="rgba(51, 67, 113, 0.03)"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color={theme.colors.charts.PRIMARY_500} fontWeight="700">
            Report content area
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
