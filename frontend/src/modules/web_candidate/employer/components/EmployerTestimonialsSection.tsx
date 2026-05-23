import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  SimpleGrid,
  Text,
  VStack,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const testimonials = [
  {
    content:
      "ITJob is an effective channel for connecting with IT candidates. Its job posting service and support system help companies optimize both the quantity and quality of incoming CVs.",
    name: "Tran Thi Ngoc Hieu",
    role: "Recruitment Lead | Rakus Vietnam Co., Ltd.",
    brand: "RAKUS",
  },
  {
    content:
      "ITJob delivers a great experience for IT recruitment services. The platform focuses on the right pool of experienced candidates, with a support team that is responsive and dedicated.",
    name: "Tran Thi Thanh Truc",
    role: "Talent Acquisition Lead | MoMo",
    brand: "MoMo",
  },
  {
    content:
      "The quality of candidates from ITJob is highly relevant to our hiring needs. The platform helps us save screening time and improve our recruitment efficiency.",
    name: "Nguyen Minh Anh",
    role: "HR Manager | FPT Software",
    brand: "FPT",
  },
  {
    content:
      "ITJob helps us reach experienced IT professionals faster. The job posting process is clear, convenient, and well supported by the consulting team.",
    name: "Le Hoang Nam",
    role: "Recruitment Specialist | NashTech Vietnam",
    brand: "NashTech",
  },
  {
    content:
      "We appreciate ITJob for its focused IT talent pool and professional support. It is a useful recruitment partner for companies hiring technology roles.",
    name: "Pham Thu Ha",
    role: "Talent Acquisition Manager | TMA Solutions",
    brand: "TMA",
  },
];

export default function EmployerTestimonialsSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const appear = prefersReducedMotion ? undefined : `${fadeUp} 0.6s ease-out both`;

  const [activeIndex, setActiveIndex] = useState(0);

  const visibleTestimonials = useMemo(() => {
    const first = testimonials[activeIndex];
    const second = testimonials[(activeIndex + 1) % testimonials.length];

    return [first, second];
  }, [activeIndex]);

  const handlePrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? testimonials.length - 1 : current - 1,
    );
  };

  const handleNext = () => {
    setActiveIndex((current) =>
      current === testimonials.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <Box
      px={{ base: 3, md: 15, xl: 135 }}
      bg="linear-gradient(180deg, #FFFFFF 0%, #F8F8FA 100%)"
      py={{ base: 14, md: 16 }}
    >
      <Container maxW="7xl">
        <VStack spacing={4} textAlign="center" mb={12} animation={appear}>
          <Text
            color="#334371"
            fontWeight="800"
            fontSize="sm"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            Testimonials
          </Text>

          <Heading fontSize={{ base: "2xl", md: "4xl" }} color="#111827" fontWeight="900">
            What do our clients say about us?
          </Heading>

          <Text color="#4B5563" fontSize={{ base: "md", md: "lg" }} maxW="720px" lineHeight="1.8">
            Trusted by technology employers to improve hiring quality, speed, and candidate
            matching across the IT recruitment process.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={7}>
          {visibleTestimonials.map((item, index) => (
            <Box
              key={`${item.name}-${activeIndex}`}
              position="relative"
              bg="white"
              borderRadius="30px"
              border="1px solid #E5E7EB"
              p={{ base: 6, md: 8 }}
              minH="330px"
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              overflow="hidden"
              animation={appear}
              style={{ animationDelay: `${index * 0.08}s` }}
              boxShadow="0 16px 42px rgba(15, 23, 42, 0.05)"
              transition="transform 0.26s ease, box-shadow 0.26s ease, border-color 0.26s ease"
              _hover={{
                transform: "translateY(-6px)",
                boxShadow: "0 24px 56px rgba(15, 23, 42, 0.1)",
                borderColor: "#CBD5E1",
              }}
            >
              <Box
                position="absolute"
                top="-32px"
                right="-20px"
                fontSize="150px"
                lineHeight="1"
                fontWeight="900"
                color="#EEF2FF"
                userSelect="none"
              >
                “
              </Box>

              <Box position="relative" zIndex={1}>
                <Flex
                  w="52px"
                  h="52px"
                  borderRadius="18px"
                  bg="#EEF2FF"
                  color="#334371"
                  align="center"
                  justify="center"
                  fontSize="4xl"
                  fontWeight="900"
                  mb={6}
                >
                  “
                </Flex>

                <Text
                  color="#1F2937"
                  fontSize={{ base: "md", md: "lg" }}
                  lineHeight="1.95"
                  fontWeight="500"
                >
                  {item.content}
                </Text>
              </Box>

              <Flex
                justify="space-between"
                align={{ base: "start", sm: "end" }}
                mt={9}
                gap={5}
                direction={{ base: "column", sm: "row" }}
                position="relative"
                zIndex={1}
              >
                <Box>
                  <Text fontWeight="900" color="#111827" fontSize="xl">
                    {item.name}
                  </Text>
                  <Text color="#4B5563" fontSize="md" mt={1} lineHeight="1.7">
                    {item.role}
                  </Text>
                </Box>

                <Flex
                  minW="96px"
                  h="64px"
                  px={5}
                  borderRadius="20px"
                  bg="linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)"
                  border="1px solid #E0E7FF"
                  align="center"
                  justify="center"
                  fontWeight="900"
                  color="#334371"
                  fontSize="xl"
                  letterSpacing="0.02em"
                  boxShadow="inset 0 1px 0 rgba(255,255,255,0.75)"
                  transition="transform 0.25s ease, box-shadow 0.25s ease"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 24px rgba(51,67,113,0.12)",
                  }}
                >
                  {item.brand}
                </Flex>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>

        <HStack justify="center" mt={10} spacing={5}>
          <IconButton
            aria-label="Previous testimonial"
            icon={<FiChevronLeft />}
            borderRadius="full"
            variant="outline"
            color="#334371"
            borderColor="#CBD5E1"
            bg="white"
            boxSize="48px"
            boxShadow="0 10px 24px rgba(15, 23, 42, 0.05)"
            transition="all 0.2s ease"
            onClick={handlePrevious}
            _hover={{
              bg: "#EEF2FF",
              borderColor: "#334371",
              transform: "translateX(-2px)",
            }}
          />

          <Flex
            align="center"
            justify="center"
            h="48px"
            minW="92px"
            px={6}
            borderRadius="full"
            bg="white"
            border="1px solid #E5E7EB"
            boxShadow="0 10px 24px rgba(15, 23, 42, 0.04)"
          >
            <Text fontWeight="900" color="#111827" fontSize="lg">
              {activeIndex + 1} / {testimonials.length}
            </Text>
          </Flex>

          <IconButton
            aria-label="Next testimonial"
            icon={<FiChevronRight />}
            borderRadius="full"
            variant="outline"
            color="#334371"
            borderColor="#CBD5E1"
            bg="white"
            boxSize="48px"
            boxShadow="0 10px 24px rgba(15, 23, 42, 0.05)"
            transition="all 0.2s ease"
            onClick={handleNext}
            _hover={{
              bg: "#EEF2FF",
              borderColor: "#334371",
              transform: "translateX(2px)",
            }}
          />
        </HStack>
      </Container>
    </Box>
  );
}