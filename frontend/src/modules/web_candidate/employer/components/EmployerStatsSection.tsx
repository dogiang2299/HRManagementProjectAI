import {
  Box,
  Container,
  Heading,
  Icon,
  SimpleGrid,
  Text,
  VStack,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiUsers, FiBriefcase, FiAward } from "react-icons/fi";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const softFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`;

const stats = [
  {
    icon: FiUsers,
    value: "10,000+",
    label: "Technology employers trust and choose our platform",
  },
  {
    icon: FiBriefcase,
    value: "1,500,000+",
    label: "Candidate profiles sent to employers",
  },
  {
    icon: FiAward,
    value: "300,000+",
    label: "Experienced candidate profiles",
  },
];

export default function EmployerStatsSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const appear = prefersReducedMotion ? undefined : `${fadeUp} 0.65s ease-out both`;
  const floating = prefersReducedMotion ? undefined : `${softFloat} 5.5s ease-in-out infinite`;

  return (
    <Box px={{ base: 3, md: 15, xl: 135 }} bg="#F8F8FA" py={{ base: 14, md: 20 }}>
      <Container maxW="7xl">
        <VStack spacing={4} textAlign="center" mb={12} animation={appear}>
          <Heading
            fontSize={{ base: "2xl", md: "4xl" }}
            color="#111827"
            fontWeight="900"
          >
            What makes ITJob different?
          </Heading>
          <Text color="#4B5563" fontSize={{ base: "md", md: "lg" }} maxW="780px">
            A specialized recruitment platform for the technology industry, where companies can
            easily access higher-quality and more relevant IT talent.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {stats.map((item, index) => (
            <Box
              key={index}
              position="relative"
              bg="white"
              borderRadius="28px"
              px={8}
              py={10}
              textAlign="center"
              boxShadow="0 18px 40px rgba(15, 23, 42, 0.06)"
              border="1px solid #EEF2F7"
              animation={appear}
              transition="transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease"
              _hover={{
                transform: 'translateY(-6px)',
                boxShadow: '0 22px 50px rgba(15, 23, 42, 0.1)',
                borderColor: '#D9E2F2',
              }}
              style={{ animationDelay: `${index * 0.12}s` }}
            >
              <Box
                position="absolute"
                top="-24px"
                left="50%"
                transform="translateX(-50%)"
                boxSize="72px"
                borderRadius="full"
                bg="#EEF2FF"
                border="2px solid white"
                boxShadow="0 8px 20px rgba(51,67,113,0.14)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                animation={floating}
                style={{ animationDelay: `${index * 0.18}s` }}
              >
                <Icon as={item.icon} boxSize={8} color="#334371" />
              </Box>

              <Text mt={6} fontSize={{ base: "3xl", md: "4xl" }} fontWeight="900" color="#334371">
                {item.value}
              </Text>
              <Text mt={3} color="#1F2937" fontSize="lg" fontWeight="600">
                {item.label}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}