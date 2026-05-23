import { Box, Flex, HStack } from "@chakra-ui/react";

export default function InterviewIllustration() {
  return (
    <Box position="relative" w="360px" h="240px">
      <Box
        position="absolute"
        top="20px"
        left="50%"
        transform="translateX(-50%)"
        w="250px"
        h="150px"
        bg="#EEF4FF"
        borderRadius="45% 55% 50% 50% / 45% 45% 55% 55%"
      />

      <Box position="absolute" left="22px" bottom="32px" w="34px" h="92px">
        <Box
          position="absolute"
          bottom="0"
          left="6px"
          w="18px"
          h="60px"
          bg="#D7E4F5"
          borderRadius="999px"
        />
        <Box
          position="absolute"
          bottom="34px"
          left="0"
          w="28px"
          h="38px"
          bg="#D7E4F5"
          borderRadius="60% 40% 60% 40%"
          transform="rotate(-20deg)"
        />
      </Box>

      <Box position="absolute" right="22px" bottom="24px" w="52px" h="98px">
        <Box
          position="absolute"
          bottom="0"
          right="14px"
          w="18px"
          h="62px"
          bg="#D7E4F5"
          borderRadius="999px"
        />
        <Box
          position="absolute"
          bottom="40px"
          right="0"
          w="34px"
          h="42px"
          bg="#D7E4F5"
          borderRadius="60% 40% 60% 40%"
          transform="rotate(18deg)"
        />
      </Box>

      <Box
        position="absolute"
        top="72px"
        left="50%"
        transform="translateX(-50%)"
        w="232px"
        h="168px"
        bg="white"
        borderRadius="20px"
        boxShadow="0 10px 30px rgba(15, 23, 42, 0.08)"
        overflow="hidden"
      >
        <Box h="34px" bg="#5B9CF0" position="relative">
          <Box position="absolute" top="8px" left="48px" w="8px" h="8px" bg="whiteAlpha.900" borderRadius="full" />
          <Box position="absolute" top="8px" right="48px" w="8px" h="8px" bg="whiteAlpha.900" borderRadius="full" />
        </Box>

        <Box p={4}>
          <HStack justify="center" mb={3}>
            <Box w="30px" h="22px" bg="#2F80ED" borderRadius="md" position="relative">
              <Box
                position="absolute"
                left="10px"
                top="5px"
                w="9px"
                h="5px"
                borderLeft="2px solid white"
                borderBottom="2px solid white"
                transform="rotate(-45deg)"
              />
            </Box>
          </HStack>

          <Flex wrap="wrap" gap={3} justify="center">
            {Array.from({ length: 9 }).map((_, index) => (
              <Box
                key={index}
                w="34px"
                h="22px"
                bg={index === 0 ? "#DCEBFF" : "#E8EEF7"}
                borderRadius="md"
              />
            ))}
          </Flex>
        </Box>
      </Box>

      <Box position="absolute" left="104px" bottom="18px" w="96px" h="148px">
        <Box
          position="absolute"
          bottom="74px"
          left="24px"
          w="24px"
          h="24px"
          bg="#FFD7B5"
          borderRadius="full"
          zIndex={2}
        />
        <Box
          position="absolute"
          bottom="84px"
          left="10px"
          w="44px"
          h="54px"
          bg="#2E4A72"
          borderRadius="28px 28px 20px 20px"
          transform="rotate(10deg)"
        />
        <Box
          position="absolute"
          bottom="54px"
          left="26px"
          w="32px"
          h="44px"
          bg="#F7D7A8"
          borderRadius="14px"
          zIndex={2}
        />
        <Box
          position="absolute"
          bottom="54px"
          left="42px"
          w="24px"
          h="10px"
          bg="#F7D7A8"
          borderRadius="999px"
          transform="rotate(-35deg)"
          zIndex={1}
        />
        <Box
          position="absolute"
          bottom="60px"
          left="58px"
          w="26px"
          h="6px"
          bg="#2F80ED"
          borderRadius="999px"
          transform="rotate(-45deg)"
          zIndex={3}
        />
        <Box
          position="absolute"
          bottom="0"
          left="20px"
          w="16px"
          h="62px"
          bg="#496A9A"
          borderRadius="10px"
        />
        <Box
          position="absolute"
          bottom="0"
          left="42px"
          w="16px"
          h="62px"
          bg="#496A9A"
          borderRadius="10px"
        />
        <Box
          position="absolute"
          bottom="0"
          left="14px"
          w="24px"
          h="6px"
          bg="#243B5A"
          borderRadius="999px"
        />
        <Box
          position="absolute"
          bottom="0"
          left="40px"
          w="24px"
          h="6px"
          bg="#243B5A"
          borderRadius="999px"
        />
      </Box>
    </Box>
  );
};