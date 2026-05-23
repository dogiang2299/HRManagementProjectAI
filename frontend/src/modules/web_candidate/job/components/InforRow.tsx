import { Box, Flex, HStack, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import type { ReactElement, ReactNode } from "react";

type InfoRowProps = {
  icon: ReactElement;
  label: string;
  value?: ReactNode;
  valueColor?: string;
};

export default function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: InfoRowProps) {
  const green = useColorModeValue("green.500", "green.300");
  const textSub = useColorModeValue("gray.500", "whiteAlpha.700");
  const textMain = useColorModeValue("gray.800", "whiteAlpha.900");

  return (
    <HStack align="start" spacing={3}>
      <Flex
        w="38px"
        h="38px"
        minW="38px"
        align="center"
        justify="center"
        borderRadius="full"
        bg="#E9EDF7"
        color={green}
      >
        <Icon as={() => icon} boxSize={4} />
      </Flex>

      <Box>
        <Text fontSize="sm" color={textSub} lineHeight="1.4">
          {label}
        </Text>

        <Text
          mt={1}
          fontSize="14.5px"
          fontWeight="700"
          color={valueColor ?? textMain}
          lineHeight="1.45"
        >
          {value ?? "--"}
        </Text>
      </Box>
    </HStack>
  );
}