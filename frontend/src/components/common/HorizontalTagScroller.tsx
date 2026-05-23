import {
  Box,
  Button,
  Flex,
  IconButton,
  type FlexProps,
  type BoxProps,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useRef } from "react";

export type HorizontalTagItem = {
  id: number | string;
  label: string;
};

type HorizontalTagScrollerProps = {
  items: HorizontalTagItem[];
  activeId: number | string;
  onChange: (id: number | string) => void;
  allLabel?: string;
  allValue?: number | string;

  w?: BoxProps["w"];
  px?: FlexProps["px"];
  py?: FlexProps["py"];
  buttonH?: ButtonPropsLike;
};

type ButtonPropsLike =
  | string
  | number
  | { base?: string | number; md?: string | number; lg?: string | number };

export default function HorizontalTagScroller({
  items,
  activeId,
  onChange,
  allLabel = "All",
  allValue = "all",
  w = "100%",
  px = { base: 2, md: 2, lg: 2 },
  py = { base: 2, md: 2, lg: 4 },
  buttonH = "35px",
}: HorizontalTagScrollerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({
      left: -220,
      behavior: "smooth",
    });
  };

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({
      left: 220,
      behavior: "smooth",
    });
  };

  const primaryColor = "#334371";
  const primaryHover = "#2E3D68";
  const softBg = "#F1F4FA";
  const softHover = "#E7ECF7";
  const borderSoft = "#D7DFEE";
  const iconSoft = "#8A99BD";

  return (
    <Flex
      px={{ base: 2, md: 4, lg: 5 }}
      align="center"
      gap={{ base: 1, md: 1, lg: 0 }}
      w={w}
    >
      <IconButton
        aria-label="Scroll left"
        icon={<ChevronLeftIcon boxSize={6} />}
        onClick={handleScrollLeft}
        borderRadius="full"
        bg="white"
        color={iconSoft}
        border="2px solid"
        borderColor={borderSoft}
        w={{ base: "30px", md: "35px" }}
        h={{ base: "30px", md: "35px" }}
        minW={{ base: "30px", md: "35px" }}
        _hover={{ bg: "#F8FAFC", borderColor: primaryColor, color: primaryColor }}
        _active={{ bg: "#EEF2F8" }}
        flexShrink={0}
      />

      <Box flex="1" overflow="hidden">
        <Flex
          ref={scrollRef}
          px={px}
          py={py}
          gap="14px"
          align="center"
          flexWrap="nowrap"
          overflowX="auto"
          overflowY="hidden"
          sx={{
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          <Button
            flexShrink={0}
            borderRadius="full"
            bg={activeId === allValue ? primaryColor : softBg}
            color={activeId === allValue ? "white" : primaryColor}
            fontSize="sm"
            fontWeight="700"
            px="24px"
            h={buttonH}
            border="1px solid"
            borderColor={activeId === allValue ? primaryColor : "transparent"}
            _hover={{
              bg: activeId === allValue ? primaryHover : softHover,
            }}
            onClick={() => onChange(allValue)}
          >
            {allLabel}
          </Button>

          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <Button
                key={item.id}
                flexShrink={0}
                borderRadius="full"
                bg={isActive ? primaryColor : softBg}
                color={isActive ? "white" : primaryColor}
                fontSize="sm"
                fontWeight="700"
                px="24px"
                h={buttonH}
                border="1px solid"
                borderColor={isActive ? primaryColor : "transparent"}
                _hover={{
                  bg: isActive ? primaryHover : softHover,
                }}
                onClick={() => onChange(item.id)}
              >
                {item.label}
              </Button>
            );
          })}
        </Flex>
      </Box>

      <IconButton
        aria-label="Scroll right"
        icon={<ChevronRightIcon boxSize={6} />}
        onClick={handleScrollRight}
        borderRadius="full"
        bg="white"
        color={primaryColor}
        border="2px solid"
        borderColor={primaryColor}
        w={{ base: "30px", md: "35px" }}
        h={{ base: "30px", md: "35px" }}
        minW={{ base: "30px", md: "35px" }}
        _hover={{ bg: "#F5F7FC" }}
        _active={{ bg: "#E9EEF8" }}
        flexShrink={0}
      />
    </Flex>
  );
}