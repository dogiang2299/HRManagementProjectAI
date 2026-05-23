import { Box, Button, Container, Text, VStack, usePrefersReducedMotion } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import { candidateHomeUrl } from "../../../../routes/urls";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;
const floatGlow = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.5; }
  50% { transform: translate3d(18px, -10px, 0) scale(1.06); opacity: 0.8; }
`;

export default function EmployerRegisterSuccess() {
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();
  const appear = prefersReducedMotion ? undefined : `${fadeUp} 0.6s ease-out both`;
  const glow = prefersReducedMotion ? undefined : `${floatGlow} 8s ease-in-out infinite`;

  return (
     <Box
      py={{ base: 14, md: 10 }}
      bg="linear-gradient(90deg, #101A33 0%, #23325E 45%, #334371 100%)"
      color="white"
      position="relative"
      overflow="hidden"
      mb={-10}
    >
      <Box
        position="absolute"
        inset={0}
        bg="radial-gradient(circle at 80% 50%, rgba(114,138,201,0.18), transparent 35%)"
        animation={glow}
      />
      <Box
        position="absolute"
        bottom="-100px"
        left="-40px"
        w="240px"
        h="240px"
        borderRadius="full"
        bg="rgba(114,138,201,0.12)"
        filter="blur(18px)"
        animation={glow}
        style={{ animationDelay: '1.5s' }}
      />
      <Container maxW="4xl" py={{ base: 16, md: 24 }} mx={"auto"} my={"auto"}>
        <VStack spacing={7} textAlign="center" animation={appear}>
          <Text fontSize={{ base: "3xl", md: "5xl" }} fontWeight="900" color="#F0F0F0">
            Thank you for contacting us!
          </Text>

          <Text
            fontSize={{ base: "lg", md: "2xl" }}
            color="#F0F0F0"
            maxW="900px"
            lineHeight="1.8"
          >
            The Customer Love Team will contact you as soon as possible.
            While waiting, you can continue exploring opportunities at ITJob.
          </Text>

          <Button
            h={{ base: "48px", md: "56px" }}
            minW={{ base: "200px", md: "260px" }}
            borderRadius="12px"
            border="1px solid"
            borderColor="#D1D5DB"
            bg="white"
            color="#334371"
            fontWeight="800"
            fontSize={{ base: "md", md: "xl" }}
            transition="all 0.2s ease"
            _hover={{ bg: "#F9FAFB", transform: 'translateY(-2px)' }}
            onClick={() => navigate(candidateHomeUrl)}
          >
            Back to home
          </Button>
        </VStack>
      </Container>
    </Box>
  );
}
