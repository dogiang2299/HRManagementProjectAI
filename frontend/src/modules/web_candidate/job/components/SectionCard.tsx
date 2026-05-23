import { Box, Flex, HStack, Text, useColorModeValue } from "@chakra-ui/react";

type SectionCardProps = {
  title: string;
  rightNode?: React.ReactNode;
  children: React.ReactNode;
};

export default function SectionCard({
  title,
  rightNode,
  children,
}: SectionCardProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const textMain = useColorModeValue("gray.800", "whiteAlpha.900");
  const green = useColorModeValue("green.500", "green.300");

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="12px"
      p={{ base: 3, md: 4 }}
      boxShadow="0 2px 8px rgba(15, 23, 42, 0.04)"
    >
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        gap={2}
        wrap="wrap"
        mb={3}
      >
        <HStack spacing={2}>
          <Box w="4px" h="22px" bg={green} borderRadius="full" />

          <Text
            fontSize="md"
            fontWeight="700"
            color={textMain}
            lineHeight="1.2"
          >
            {title}
          </Text>
        </HStack>

        {rightNode}
      </Flex>

      {children}
    </Box>
  );
}