import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  Image,
  LinkBox,
  LinkOverlay,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export type BannerItem = {
  id: number | string;
  image: string;
  href?: string;
  alt?: string;
};

type BannerCarouselProps = {
  banners: BannerItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
};

const BannerCarousel = ({
  banners,
  autoPlay = true,
  autoPlayInterval = 3000,
}: BannerCarouselProps) => {
  const cardWidth = useBreakpointValue({ base: 300, md: 330, xl: 370 }) ?? 370;
  const cardHeight = useBreakpointValue({ base: 168, md: 185, xl: 207 }) ?? 207;
  const gap = useBreakpointValue({ base: 12, md: 14, xl: 16 }) ?? 16;
  const visibleCount = useBreakpointValue({ base: 1, md: 2, xl: 3 }) ?? 3;

  const [currentIndex, setCurrentIndex] = useState(0);

  const maxIndex = useMemo(() => {
    return Math.max(0, banners.length - visibleCount);
  }, [banners.length, visibleCount]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  useEffect(() => {
    if (!autoPlay || banners.length <= visibleCount) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, banners.length, visibleCount, maxIndex]);

  const trackTranslate = currentIndex * (cardWidth + gap);
  const containerWidth = visibleCount * cardWidth + (visibleCount - 1) * gap;

  return (
    <Box position="relative" w="full">
      <Box
        w={`${containerWidth}px`}
        maxW="full"
        mx="auto"
        overflow="hidden"
      >
        <Flex
          gap={`${gap}px`}
          transform={`translateX(-${trackTranslate}px)`}
          transition="transform 0.5s ease"
        >
          {banners.map((banner) => (
            <LinkBox
              key={banner.id}
              minW={`${cardWidth}px`}
              maxW={`${cardWidth}px`}
              h={`${cardHeight}px`}
              borderRadius="24px"
              overflow="hidden"
              flexShrink={0}
              bg="white"
              boxShadow="0 8px 24px rgba(15, 23, 42, 0.08)"
            >
              <LinkOverlay href={banner.href || "#"}>
                <Image
                  src={banner.image}
                  alt={banner.alt || "banner"}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              </LinkOverlay>
            </LinkBox>
          ))}
        </Flex>
      </Box>

      <IconButton
        aria-label="Previous banners"
        icon={<FiChevronLeft />}
        onClick={handlePrev}
        position="absolute"
        left={{ base: "4px", xl: "-20px" }}
        top="50%"
        transform="translateY(-50%)"
        rounded="full"
        bg="white"
        color="#334371"
        boxShadow="0 8px 24px rgba(15, 23, 42, 0.12)"
        zIndex={2}
        _hover={{ bg: "white" }}
        _active={{ bg: "white" }}
      />

      <IconButton
        aria-label="Next banners"
        icon={<FiChevronRight />}
        onClick={handleNext}
        position="absolute"
        right={{ base: "4px", xl: "-20px" }}
        top="50%"
        transform="translateY(-50%)"
        rounded="full"
        bg="white"
        color="#334371"
        boxShadow="0 8px 24px rgba(15, 23, 42, 0.12)"
        zIndex={2}
        _hover={{ bg: "white" }}
        _active={{ bg: "white" }}
      />
    </Box>
  );
};

export default BannerCarousel;