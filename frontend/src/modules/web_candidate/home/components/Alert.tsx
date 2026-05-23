import { Flex, Icon , IconButton, Text} from "@chakra-ui/react";
import type { SuggestionProps } from "../type";
import { FiX } from "react-icons/fi";
import { HiOutlineLightBulb } from "react-icons/hi";
const AlertCandidate = ({ message, onClose }: SuggestionProps) => {
    return (
        <Flex w='full' align={'center'} px={{ base: 3, md: 2 }}
      py={{ base: 3, md: 1 }}
      bg="#F5F9FF"
      border="1px solid"
      borderColor="#7AA7F8"
      borderRadius="14px" justifyContent={'space-between'} gap={'12px'} >
        <Flex align="center" gap="12px" minW={0} flex="1">
        <Icon
          as={HiOutlineLightBulb}
          boxSize="18px"
          color="#6C9CF6"
          flexShrink={0}
        />

        <Text
          color="#334155"
          fontSize={{ base: "sm", md: "sm" }}
          lineHeight="1.5"
          noOfLines={1}
        >
          <Text as="span" fontWeight="700">
            Suggestion: 
          </Text>{" "}
          {message}
        </Text>
        </Flex>

        <IconButton
        aria-label="Close suggestion"
        icon={<FiX />}
        variant="ghost"
        size="sm"
        minW="32px"
        h="32px"
        color="#8A94A6"
        _hover={{ bg: "transparent", color: "#4A5568" }}
        _active={{ bg: "transparent" }}
        onClick={onClose}
      />
      </Flex>
    )
}

export default AlertCandidate;