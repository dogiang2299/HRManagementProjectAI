import { Box, HStack, Text, useColorModeValue } from "@chakra-ui/react";
import type React from "react";

export default function Metric({icon, label, value, tone}: {
    icon: React.ReactElement;
    label: string;
    value: string;
    tone?: string;
}) {
    const subtle = useColorModeValue("gray.600", "gray.300");
    return (
        <HStack spacing={2} minW={'fit-content'}>
            <Box color={tone ?? subtle}>{icon}</Box>
            <Text fontSize={'sm'} color={subtle}>{label}</Text>
            <Text fontSize={'sm'} fontWeight={'700'}>{value}</Text>
        </HStack>
    )
}