import { Box, Button, Flex, HStack, Icon, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import {
  FiGrid,
  FiCheckCircle,
  FiAward,
  FiMail,
  FiCode,
  FiUsers,
  FiEye,
} from "react-icons/fi";
import { GroupPositionPost } from "./group_position_post/views/GroupPositionPost";
import { PositionPost } from "./position_post/views/PositionPost";
import { Rank } from "./rank/views/Rank";
import { SendEmail } from "./send_email/views/Email";
import { Skill } from "./skill/views/Skill";
import { TypePotential } from "./type_potential/views/TypePotential";
import { theme } from "../../../theme";

type SettingTabKey =
  | "position_group"
  | "position_post"
  | "rank"
  | "send_email"
  | "skill"
  | "type_potential"

const { PRIMARY, PRIMARY_900, BORDER } = theme.colors.charts;

const menuItems: { key: SettingTabKey; label: string; icon: any }[] = [
  { key: "position_group", label: "Position Group", icon: FiGrid },
  { key: "position_post", label: "Position Post", icon: FiCheckCircle },
  { key: "rank", label: "Rank", icon: FiAward },
  { key: "send_email", label: "Send Email", icon: FiMail },
  { key: "skill", label: "Skills", icon: FiCode },
  { key: "type_potential", label: "Type Potential", icon: FiUsers },
];

const tabDescriptions: Record<SettingTabKey, string> = {
  position_group: "Manage industry and domain groups (Group Position) in the system.",
  position_post: "Manage the recruitment position catalog in the system.",
  rank: "Configure ranks and titles used throughout the recruitment process.",
  send_email: "Set up and manage email templates sent to candidates.",
  skill: "Manage the skills list used to tag candidates and recruitment postings.",
  type_potential: "Classify potential candidate groups based on specific criteria.",

};

const renderContent = (activeTab: SettingTabKey) => {
  switch (activeTab) {
   
    case "position_group":
      return <GroupPositionPost />;
    case "position_post":
      return <PositionPost />;
    case "rank":
      return <Rank />;
    case "send_email":
      return <SendEmail />;
    case "skill":
      return <Skill />;
    case "type_potential":
      return <TypePotential />;
  }
};

export default function General_Sibar() {
  const [activeTab, setActiveTab] = useState<SettingTabKey>("position_group");

  const activeItem = menuItems.find((item) => item.key === activeTab);

  return (
    <Box minH="100vh"  position="relative">
      <Flex maxW="1540px" mx="auto" gap={{ base: 3, md: 5 }} align="stretch" direction={{ base: "column", lg: "row" }}>
        {/* Sidebar */}
        <Box
          w={{ base: "100%", lg: "200px" }}
          bg="white"
          border="1px solid"
          borderColor={BORDER}
          borderRadius="6px"
          boxShadow="0 12px 34px rgba(26, 39, 68, 0.01)"
          py={3}
          px={{ base: 3, lg: 3 }}
          position={{ base: "relative", lg: "sticky" }}
          top={{ base: "auto", lg: "16px" }}
          h={{ base: "auto", lg: "calc(100vh - 52px)" }}
        >
          <VStack align="stretch" spacing={4} h="100%">
          

            <VStack spacing={2} align="stretch" flex="1" overflowY="auto" className="hide-scrollbar">
              {menuItems.map((item) => {
                const isActive = item.key === activeTab;
                return (
                  <Button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    h="45px"
                    justifyContent={{ base: "center", lg: "flex-start" }}
                    px={{ base: 3, lg: 4 }}
                    borderRadius="7px"
                    bg={isActive ? "rgba(51, 67, 113, 0.10)" : "transparent"}
                    color={isActive ? PRIMARY : "gray.500"}
                    _hover={{ bg: isActive ? "rgba(51, 67, 113, 0.12)" : "gray.50" }}
                    _active={{ bg: isActive ? "rgba(51, 67, 113, 0.14)" : "#E2E8F0" }}
                    transition="all 0.2s ease"
                  >
                    <HStack w="full" spacing={3} justify={{ base: "center", lg: "flex-start" }}>
                      <Icon as={item.icon} boxSize={5} />
                      <Text display={{ base: "none", lg: "block" }} fontWeight="700" fontSize="sm">
                        {item.label}
                      </Text>
                    </HStack>
                  </Button>
                );
              })}
            </VStack>
          </VStack>
        </Box>

        {/* Content */}
        <Box flex="1" minW={0}>
          <VStack spacing={5} align="stretch">
            {/* Header */}
                <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="7px"
                px={{ base: 5, md: 5 }}
                py={{ base: 5, md: 4 }}
                boxShadow="0 12px 34px rgba(26, 39, 68, 0.05)"
                >
                <HStack spacing={3} mb={2}>
                    {activeItem && <Icon as={activeItem.icon} boxSize={5} color={PRIMARY} />}
                    <Text fontSize={{ base: "xl", md: "lg" }} fontWeight="800" color={PRIMARY_900}>
                    {activeItem?.label}
                    </Text>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                    {tabDescriptions[activeTab]}
                </Text>
                </Box>

            {/* Tab content */}
            <Box
              bg="white"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="7px"
              px={{ base: 4, md: 6 }}
              py={{ base: 4, md: 5 }}
              boxShadow="0 12px 34px rgba(26, 39, 68, 0.05)"
            >
              {renderContent(activeTab)}
            </Box>
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
}