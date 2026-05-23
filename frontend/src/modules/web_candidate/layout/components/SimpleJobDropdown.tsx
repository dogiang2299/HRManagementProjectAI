import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  GridItem,
  HStack,
  Icon,
  LinkBox,
  LinkOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiChevronRight, FiGrid } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import type { IPositionGroup, IPositionItem } from "../type";

type QuickLinkItem = {
  label: string;
  to: string;
  icon: React.ElementType;
};

interface SimpleJobDropdownProps {
  isOpen: boolean;
  groups?: IPositionGroup[];
  onClose?: () => void;
  quickLinks: QuickLinkItem[];
}

const BRAND_COLOR = "#343E71";
// If the actual brand color differs from #343E71, update only the line above.
// #34371 is not a valid hex code because it is missing one character.

const sectionTitleStyle = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#7C8593",
  textTransform: "uppercase" as const,
  letterSpacing: "0.09em",
};

const softHoverStyle = {
  bg: "white",
  transform: "translateX(2px)",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
};

export default function SimpleJobDropdown({
  isOpen,
  groups = [],
  onClose,
  quickLinks,
}: SimpleJobDropdownProps) {
  const topGroups = useMemo(() => groups.slice(0, 8), [groups]);

  const [activeGroupId, setActiveGroupId] = useState<string>(
    topGroups[0]?.id ?? "",
  );

  useEffect(() => {
    if (!isOpen || !topGroups.length) return;

    setActiveGroupId((current) => {
      if (current && topGroups.some((group) => group.id === current)) {
        return current;
      }

      return topGroups[0].id;
    });
  }, [isOpen, topGroups]);

  const activeGroup = useMemo(
    () => topGroups.find((group) => group.id === activeGroupId) ?? topGroups[0],
    [activeGroupId, topGroups],
  );

  const topPositions = useMemo(
    () => ((activeGroup?.positions ?? []).slice(0, 8) as IPositionItem[]),
    [activeGroup],
  );

  if (!isOpen) return null;

  return (
    <Box
      position="absolute"
      top="calc(100% + 5px)"
      left="0"
      w="840px"
      bg="white"
      border="1px solid"
      borderColor="#E5EAF2"
      borderRadius="18px"
      boxShadow="0 24px 55px rgba(15, 23, 42, 0.13)"
      overflow="hidden"
      zIndex={1200}
      onMouseLeave={onClose}
      _before={{
        content: '""',
        position: "absolute",
        top: "-7px",
        left: "42px",
        width: "14px",
        height: "14px",
        bg: "white",
        borderLeft: "1px solid #E5EAF2",
        borderTop: "1px solid #E5EAF2",
        transform: "rotate(45deg)",
      }}
    >
      <Grid templateColumns="270px 1fr">
        <GridItem bg="#F8FAFC" borderRight="1px solid #EEF2F7" px={6} py={6}>
          <VStack align="stretch" spacing={5}>
            <Box>
              <Text {...sectionTitleStyle} mb={3}>
                Quick links
              </Text>

              <VStack align="stretch" spacing={1.5}>
                {quickLinks.map((item) => (
                  <LinkBox
                    key={item.label}
                    borderRadius="12px"
                    px={3}
                    py={2.5}
                    transition="all 0.18s ease"
                    _hover={softHoverStyle}
                  >
                    <HStack spacing={3} align="center">
                      <Icon as={item.icon} boxSize={4} color="#64748B" />

                      <LinkOverlay
                        as={RouterLink}
                        to={item.to}
                        fontSize="14.5px"
                        fontWeight="700"
                        color="#253B53"
                      >
                        {item.label}
                      </LinkOverlay>
                    </HStack>
                  </LinkBox>
                ))}
              </VStack>
            </Box>

          </VStack>
        </GridItem>

        <GridItem px={6} py={6}>
          <Grid templateColumns="1fr 1fr" gap={7}>
            <Box>
              <Text {...sectionTitleStyle} mb={3.5}>
                Job groups
              </Text>

              <VStack align="stretch" spacing={1.5}>
                {topGroups.map((group) => {
                  const isActive = group.id === activeGroupId;

                  return (
                    <LinkBox
                      key={group.id}
                      borderRadius="12px"
                      px={3}
                      py={3.5}
                      cursor="pointer"
                      bg={isActive ? "#F7F8FC" : "transparent"}
                      transition="all 0.18s ease"
                      boxShadow={
                        isActive
                          ? `inset 3px 0 0 ${BRAND_COLOR}`
                          : "inset 3px 0 0 transparent"
                      }
                      _hover={{
                        bg: "#F7F8FC",
                        transform: "translateX(2px)",
                      }}
                      onMouseEnter={() => setActiveGroupId(group.id)}
                    >
                      <HStack justify="space-between" align="center" spacing={3}>
                        <Text
                          fontSize="14.5px"
                          fontWeight="700"
                          color={isActive ? BRAND_COLOR : "#253B53"}
                          noOfLines={1}
                        >
                          {group.name_group}
                        </Text>

                        <Icon
                          as={FiChevronRight}
                          boxSize={4}
                          color={isActive ? BRAND_COLOR : "#94A3B8"}
                        />
                      </HStack>
                    </LinkBox>
                  );
                })}
              </VStack>
            </Box>

            <Box>
              <Text {...sectionTitleStyle} mb={3.5}>
                Setting positions
              </Text>

              <VStack align="stretch" spacing={2}>
                {topPositions.map((item) => (
                  <LinkBox
                    key={item.id}
                    borderRadius="11px"
                    px={3}
                    py={2}
                    transition="all 0.18s ease"
                    _hover={{
                      bg: "#F7F8FC",
                      transform: "translateX(2px)",
                    }}
                  >
                    <LinkOverlay
                      as={RouterLink}
                      to={`/it-job/jobs/group/${item.id}`}
                    >
                      <Text
                        fontSize="14.5px"
                        fontWeight="700"
                        color="#253B53"
                        transition="color 0.18s ease"
                        _hover={{ color: BRAND_COLOR }}
                        noOfLines={1}
                      >
                        {item.name_post || item.position_code}
                      </Text>
                    </LinkOverlay>
                  </LinkBox>
                ))}

                {topPositions.length === 0 && (
                  <Text fontSize="13.5px" color="#64748B" lineHeight="1.6">
                    Hover a group to view its setting positions.
                  </Text>
                )}
              </VStack>
            </Box>
          </Grid>
        </GridItem>
      </Grid>
    </Box>
  );
}
