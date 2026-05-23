import { Box, Center, Text } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiCode,
  FiCpu,
  FiPenTool,
  FiServer,
  FiShield,
  FiTool,
} from "react-icons/fi";
import type { IGroupJob } from "../types/job";

type GroupJobCardProps = {
  group: IGroupJob;
  index: number;
  onClick?: () => void;
};

const fallbackIcons: IconType[] = [
  FiActivity,
  FiCode,
  FiShield,
  FiCheckCircle,
  FiBarChart2,
  FiTool,
  FiServer,
  FiPenTool,
];

const getIconForGroup = (groupName?: string | null, index = 0): IconType => {
  const normalized = (groupName || "").toLowerCase();

  if (normalized.includes("support") || normalized.includes("operation")) {
    return FiTool;
  }
  if (normalized.includes("software") || normalized.includes("development")) {
    return FiCode;
  }
  if (normalized.includes("security")) {
    return FiShield;
  }
  if (normalized.includes("qa") || normalized.includes("testing") || normalized.includes("test")) {
    return FiCheckCircle;
  }
  if (
    normalized.includes("product") ||
    normalized.includes("business") ||
    normalized.includes("delivery")
  ) {
    return FiBarChart2;
  }
  if (normalized.includes("infrastructure") || normalized.includes("cloud")) {
    return FiServer;
  }
  if (normalized.includes("design")) {
    return FiPenTool;
  }
  if (normalized.includes("other")) {
    return FiCpu;
  }

  return fallbackIcons[index % fallbackIcons.length];
};

const GroupJobCard = ({ group, index, onClick }: GroupJobCardProps) => {
  const Icon = getIconForGroup(group?.name_group, index);

  return (
    <Box
      onClick={onClick}
      role="group"
      cursor="pointer"
      bg="#F7F8FA"
      border="1px solid"
      borderColor="#ECEFF3"
      borderRadius="22px"
      px={{ base: 4, md: 5 }}
      py={{ base: 5, md: 6 }}
      minH={{ base: "150px", md: "170px" }}
      transition="all 0.2s ease"
      _hover={{
        transform: "translateY(-3px)",
        bg: "white",
        borderColor: "#D9E2EC",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Center
        w={{ base: "40px", md: "50px" }}
        h={{ base: "40px", md: "50px" }}
        mx="auto"
        mb={4}
        borderRadius="md"
        bg="rgba(51, 67, 113, 0.12)"
        color="#334371"
        fontSize={{ base: "15px", md: "25px" }}
      >
        <Icon />
      </Center>

      <Text
        textAlign="center"
        fontWeight="700"
        color="#1E293B"
        fontSize={{ base: "md", md: "16px" }}
        lineHeight="1.35"
        noOfLines={2}
        minH="52px"
      >
        {group.name_group || "Industry group"}
      </Text>

      <Text
        mt={2}
        textAlign="center"
        fontSize={{ base: "sm", md: "15px" }}
        color="#334371"
        fontWeight="500"
      >
        See industry group
      </Text>
    </Box>
  );
};

export default GroupJobCard;