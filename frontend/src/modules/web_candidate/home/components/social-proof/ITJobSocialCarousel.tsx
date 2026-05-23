import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";

type ResponsiveNumber = {
  base: number;
  md?: number;
  xl?: number;
};

type ITJobSocialCarouselProps<T> = {
  title: string;
  subtitle: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  visibleCount: ResponsiveNumber;
  cardWidth: ResponsiveNumber;
  autoPlayInterval?: number;
};

function ITJobSocialCarousel<T>({
  title,
  subtitle,
  items,
  renderItem,
  visibleCount: visibleCountConfig,
  cardWidth: cardWidthConfig,
  autoPlayInterval = 3200,
}: ITJobSocialCarouselProps<T>) {
  const visibleCount = useBreakpointValue(visibleCountConfig) ?? visibleCountConfig.base;
  const cardWidth = useBreakpointValue(cardWidthConfig) ?? cardWidthConfig.base;
  const gap = useBreakpointValue({ base: 12, md: 14, xl: 16 }) ?? 16;

  const [currentIndex, setCurrentIndex] = useState(0);

  const resolvedVisibleCount = Math.min(visibleCount, Math.max(1, items.length));
  const maxIndex = useMemo(() => {
    return Math.max(0, items.length - resolvedVisibleCount);
  }, [items.length, resolvedVisibleCount]);

  useEffect(() => {
    if (items.length <= resolvedVisibleCount) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, autoPlayInterval);

    return () => window.clearInterval(timer);
  }, [autoPlayInterval, items.length, maxIndex, resolvedVisibleCount]);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  if (items.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const trackTranslate = currentIndex * (cardWidth + gap);
  const containerWidth = resolvedVisibleCount * cardWidth + (resolvedVisibleCount - 1) * gap;

  return (
    <Box w="full" mt={6}>
      <VStack align="stretch" spacing={3} w="full">
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "start", md: "center" }}
          gap={3}
        >
          <VStack align="start" spacing={0.5} maxW="900px">
            <Text
              fontSize={{ base: "lg", md: "lg" }}
              fontWeight="800"
              color="#0F172A"
              lineHeight="1.1"
            >
              {title}
            </Text>
            <Text fontSize="sm" color="#64748B" lineHeight="1.6">
              {subtitle}
            </Text>
          </VStack>

          <Flex gap={1.5} align="center" flexShrink={0}>
            <Button
              onClick={handlePrev}
              variant="outline"
              borderColor="#CBD5E1"
              color="#334155"
              bg="white"
              w="32px"
              h="32px"
              minW="32px"
              p={0}
              borderRadius="full"
              fontSize="14px"
              fontWeight="700"
              _hover={{ bg: "#F8FAFC", borderColor: "#94A3B8" }}
              aria-label="Previous item"
            >
              <Text as="span" lineHeight="1">
                &lt;
              </Text>
            </Button>
            <Button
              onClick={handleNext}
              variant="outline"
              borderColor="#CBD5E1"
              color="#334155"
              bg="white"
              w="32px"
              h="32px"
              minW="32px"
              p={0}
              borderRadius="full"
              fontSize="14px"
              fontWeight="700"
              _hover={{ bg: "#F8FAFC", borderColor: "#94A3B8" }}
              aria-label="Next item"
            >
              <Text as="span" lineHeight="1">
                &gt;
              </Text>
            </Button>
          </Flex>
        </Flex>

        <Box w="full" maxW={`${containerWidth}px`} overflow="hidden">
          <Flex
            gap={`${gap}px`}
            transform={`translateX(-${trackTranslate}px)`}
            transition="transform 0.55s ease"
            willChange="transform"
          >
            {items.map((item, index) => (
              <Box
                key={index}
                minW={`${cardWidth}px`}
                maxW={`${cardWidth}px`}
                flexShrink={0}
              >
                {renderItem(item)}
              </Box>
            ))}
          </Flex>
        </Box>
      </VStack>
    </Box>
  );
}

export default ITJobSocialCarousel;