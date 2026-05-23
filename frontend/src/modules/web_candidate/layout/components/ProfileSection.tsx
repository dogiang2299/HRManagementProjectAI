import {
  Avatar,
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
} from "@chakra-ui/icons";
import {
  FiBell,
  FiMessageCircle,
  FiBriefcase,
  FiFileText,
  FiSettings,
  FiUser,
  FiLogOut,
  FiChevronRight,
} from "react-icons/fi";
import { LuBadgeCheck } from "react-icons/lu";
import { HiOutlineIdentification } from "react-icons/hi2";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type ProfileMenuSectionProps = {
  icon: React.ElementType;
  title: string;
  items?: { label: string; onClick: () => void }[];
  defaultOpen?: boolean;
};

const ProfileMenuSection = ({
  icon,
  title,
  items = [],
  defaultOpen = false,
}: ProfileMenuSectionProps) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: defaultOpen });

  return (
    <Box w="full">
      <Flex
        align="center"
        justify="space-between"
        py={1.5}
        cursor="pointer"
        onClick={onToggle}
      >
        <HStack spacing={3} align="center">
          <Flex
            w="28px"
            h="28px"
            align="center"
            justify="center"
            borderRadius="8px"
          >
            <Icon as={icon} boxSize={5} color="#7B8794" />
          </Flex>

          <Text
            fontSize="15px"
            fontWeight="700"
            color="#2F4358"
            lineHeight="1.2"
          >
            {title}
          </Text>
        </HStack>

        <Icon
          as={isOpen ? ChevronUpIcon : ChevronDownIcon}
          boxSize={5}
          color="#7B8794"
        />
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <VStack align="start" spacing={2} pl="40px" pt={0} pb={2}>
          {items.map((item) => (
            <Text
              key={item.label}
              fontSize="14.8px"
              color="#5F6B7A"
              fontWeight="500"
              cursor="pointer"
              lineHeight="1.35"
              _hover={{ color: "#334371" }}
              onClick={item.onClick}
            >
              {item.label}
            </Text>
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
};
export default ProfileMenuSection;