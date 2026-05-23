import { Box, Text } from "@chakra-ui/react";

export default function ReportTabContent() {
    return (
        <Box px={{ base: 4, md: 6 }} py={5}>
            <Box
                bg="white"
                borderRadius="16px"
                border="1px solid"
                borderColor="gray.200"
                p={{ base: 5, md: 6 }}
            >
                <Text fontSize="lg" fontWeight="700" color="gray.800">
                    Recruitment Report
                </Text>
                <Text mt={2} fontSize="sm" color="gray.600">
                    Report content has been separated into its own component.
                </Text>
            </Box>
        </Box>
    );
}
