import { HStack, Box } from "@chakra-ui/react";

export default function Stars({ value = 0 }: { value?: number }) {
  const arr = new Array(5).fill(0).map((_, i) => i < value);
  return (
    <HStack spacing={1}>
      {arr.map((filled, idx) => (
        <Box key={idx} fontSize="14px" color={filled ? "yellow.400" : "gray.300"}>
          ★
        </Box>
      ))}
    </HStack>
  );
}