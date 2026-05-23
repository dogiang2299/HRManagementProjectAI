import {
  Box,
  Flex,
  Link as ChakraLink,
  Text,
  VStack,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useEffect, useState } from "react";
import type { IPositionGroup } from "./type";


export type NavItemProps = {
  label: string;
  to?: string;
  active?: boolean;
  hasDropdown?: boolean;
  onMouseEnter?: () => void;
  onClick?: () => void;
};

export function NavItem({
  label,
  to,
  active = false,
  hasDropdown = false,
  onMouseEnter,
  onClick,
}: NavItemProps) {
  const content = (
    <Flex
      align="center"
      gap={1}
      h="72px"
      cursor="pointer"
      color={active ? "#334371" : "#1F2937"}
      fontWeight={active ? "700" : "600"}
      fontSize="15px"
      transition="all 0.2s ease"
      _hover={{ color: "#334371" }}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <Text>{label}</Text>
      {hasDropdown && <ChevronDownIcon boxSize={5} />}
    </Flex>
  );

  if (to) {
    return (
      <ChakraLink
        as={RouterLink}
        to={to}
        _hover={{ textDecoration: "none" }}
      >
        {content}
      </ChakraLink>
    );
  }

  return content;
}

export type MegaMenuProps = {
  isOpen: boolean;
  groups: IPositionGroup[];
  onClose: () => void;
};

export default function MegaMenu({ isOpen, groups, onClose }: MegaMenuProps) {
  const [activeGroupID, setActiveGroupID] = useState<string | null>(null);

  useEffect(() => {
    if (groups.length === 0) {
      setActiveGroupID(null);
      return;
    }

    const firstGroupWithPositions =
      groups.find((group) => (group.positions?.length ?? 0) > 0) ?? groups[0];

    setActiveGroupID(firstGroupWithPositions.id);
  }, [groups]);

  const activeGroup = groups.find((g) => g.id === activeGroupID) || null;

  if (!isOpen) return null;

  return (
    <Box
      position="absolute"
      top="100%"
      left="0"
      mt={1}
      w="1080px"
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="18px"
      boxShadow="0 18px 40px rgba(15, 23, 42, 0.12)"
      zIndex={1200}
      overflow="hidden"
      onMouseLeave={onClose}
    >
      <Flex minH="420px">
        {/* LEFT */}
        <Box
          w="320px"
          bg="#F8FAFC"
          borderRight="1px solid"
          borderColor="gray.200"
          py={3}
        >
          <VStack align="stretch" spacing={0}>
            {groups.map((group) => {
              const isActive = group.id === activeGroupID;

              return (
                <Flex
                  key={group.id}
                  align="center"
                  justify="space-between"
                  px={6}
                  py={4}
                  cursor="pointer"
                  bg={isActive ? "white" : "transparent"}
                  color={isActive ? "#334371" : "#334155"}
                  fontWeight={isActive ? "700" : "500"}
                  borderLeft={
                    isActive ? "4px solid #334371" : "4px solid transparent"
                  }
                  _hover={{ bg: "white", color: "#334371" }}
                  onMouseEnter={() => setActiveGroupID(group.id)}
                >
                  <Text fontSize="15px">{group.name_group}</Text>
                  <ChevronRightIcon boxSize={5} />
                </Flex>
              );
            })}
          </VStack>
        </Box>

        {/* RIGHT */}
        <Flex flex="1" direction="column" bg="white">
          <Box px={8} py={7} flex="1">
            <Text fontSize="18px" fontWeight="700" color="#111827" mb={5}>
              {activeGroup?.name_group}
            </Text>

            <Grid templateColumns="repeat(2, 1fr)" gap={2}>
              {activeGroup?.positions?.map((item) => (
                <GridItem key={item.id}>
                  <ChakraLink
                    as={RouterLink}
                    to={`/candidate/jobs?position_id=${item.id}`}
                    color="gray.700"
                    fontWeight="500"
                    _hover={{
                      textDecoration: "none",
                      color: "#334371",
                    }}
                  >
                    {item.name_post || item.position_code || "Location"}
                  </ChakraLink>
                </GridItem>
              ))}

              {(activeGroup?.positions?.length ?? 0) === 0 && (
                <Text color="gray.500" fontSize="14px">
                  This group currently has no position.
                </Text>
              )}
            </Grid>
          </Box>

          {/* FOOTER */}
          <Flex
            justify="center"
            py={4}
            borderTop="1px solid"
            borderColor="gray.100"
          >
            {activeGroup && (
              <ChakraLink
                as={RouterLink}
                to={`/candidate/jobs?group_id=${activeGroup.id}`}
                fontWeight="700"
                color="#334371"
                _hover={{ textDecoration: "none", opacity: 0.9 }}
              >
                See all
              </ChakraLink>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}