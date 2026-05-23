import { HStack , Text, Box} from "@chakra-ui/react";

export default function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <HStack align="flex-start" spacing={3}>
      <Text w="120px" color="gray.600" fontSize="sm">
        {label}
      </Text>
      <Box flex="1" minW={0}>
        {typeof value === "string" ? (
          <Text fontSize="sm" noOfLines={2}>
            {value || "-"}
          </Text>
        ) : (
          value ?? <Text fontSize="sm">-</Text>
        )}
      </Box>
    </HStack>
  );
}
