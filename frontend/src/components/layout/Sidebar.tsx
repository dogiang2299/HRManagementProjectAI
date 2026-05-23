import {
  Box,
  Flex,
  IconButton,
  VStack,
  Text,
  Link as ChakraLink,
  Tooltip,
  Image,
  Collapse,
  Icon,
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@chakra-ui/icons';
import { Link, useLocation } from 'react-router-dom';
import { type IMenuItem } from './MenuItem';
import { useEffect, useState } from 'react';
import { logo } from '../../assets/logo';
import { useAuthStore } from '../../modules/auth/store/auth.store';
import type { MenuMode } from '../../types';
import {defaultMenus as mainMenus} from './MenuItem';
import {defaultMenusAdmin as adminMenus} from './MenuItemAdmin';
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  menuMode: MenuMode
}

export default function Sidebar({ isCollapsed, onToggle, menuMode }: SidebarProps) {
  const location = useLocation();
  const { hasAnyRole } = useAuthStore();

  const isPathActive = (targetPath?: string) => {
    if (!targetPath) return false;
    if (location.pathname === targetPath) return true;
    return location.pathname.startsWith(`${targetPath}/`);
  };

  const menus = menuMode === 'admin' ? adminMenus : mainMenus;
const menuItems = menus.filter((menu) => hasAnyRole(menu.roles));  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newOpenMenus = { ...openMenus };
    menuItems.forEach((menu) => {
      if (menu.children) {
        const isChildActive = menu.children.some((child) => isPathActive(child.path));
        if (isChildActive) {
          newOpenMenus[menu.name] = true;
        }
      }
    });
    setOpenMenus(newOpenMenus);
  }, [location.pathname]);
  useEffect(() => {
  setOpenMenus({});
}, [menuMode]);
  const handleMenuClick = (menuName: string) => {
    if (isCollapsed) {
      onToggle();
      setOpenMenus({ [menuName]: true });
    } else {
      setOpenMenus((prev) => ({
        ...prev,
        [menuName]: !prev[menuName],
      }));
    }
  };

  const renderMenuItem = (item: IMenuItem) => {
    if (!item.children) {
      const isActive = isPathActive(item.path);
      return (
        <Tooltip key={item.path} label={isCollapsed ? item.name : ''} placement="right" hasArrow>
          <ChakraLink
            as={Link}
            to={item.path!}
            display="flex"
            alignItems="center"
            justifyContent={isCollapsed ? 'center' : 'flex-start'}
            gap={3}
            px={isCollapsed ? 3 : 4}
            py={2.5}
            bg={isActive ? '#e2e8f0' : 'transparent'}
            color="black"
            _hover={{ bg: isActive ? '#e2e8f0' : 'gray.100' }}
            borderRadius="lg"
            textDecoration="none !important"
          >
            {item.icon}
            {!isCollapsed && <Text fontWeight="medium">{item.name}</Text>}
          </ChakraLink>
        </Tooltip>
      );
    }
    const isOpen = openMenus[item.name];
    const isParentActive = item.children.some((child) => isPathActive(child.path));

    return (
      <Box key={item.name} w="full">
        <Tooltip label={isCollapsed ? item.name : ''} placement="right" hasArrow>
          <Flex
            align="center"
            justify={isCollapsed ? 'center' : 'space-between'}
            px={isCollapsed ? 3 : 4}
            py={2.5}
            cursor="pointer"
            borderRadius="lg"
            bg={isParentActive ? '#edf2f7' : 'transparent'}
            _hover={{ bg: 'gray.100' }}
            onClick={() => handleMenuClick(item.name)}
            color="black"
          >
            <Flex align="center" gap={3}>
              {item.icon}
              {!isCollapsed && <Text fontWeight="medium">{item.name}</Text>}
            </Flex>

            {!isCollapsed && (
              <Icon as={isOpen ? ChevronUpIcon : ChevronDownIcon} fontSize="1.2em" />
            )}
          </Flex>
        </Tooltip>

        {!isCollapsed && (
          <Collapse in={isOpen} animateOpacity>
            <VStack align="stretch" mt={1} spacing={1} pl={4}>
              {item.children.map((child) => {
                const isChildActive = isPathActive(child.path);
                return (
                  <ChakraLink
                    key={child.path}
                    as={Link}
                    to={child.path!}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    px={4}
                    py={2}
                    bg={isChildActive ? '#e2e8f0' : 'transparent'}
                    color="black"
                    _hover={{ bg: isChildActive ? '#e2e8f0' : 'gray.100' }}
                    borderRadius="lg"
                    textDecoration="none !important"
                  >
                    <Box as="span" color="gray.600">
                      {child.icon}
                    </Box>
                    <Text fontWeight="medium">{child.name}</Text>
                  </ChakraLink>
                );
              })}
            </VStack>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box
      bg="white"
      color="black"
      minH="100vh"
      w={isCollapsed ? '80px' : '250px'}
      transition="width 0.2s ease"
      borderRight="1px solid"
      borderColor="#e2e2e2ff"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      position="fixed"
      zIndex={100}
      top="50px"
    >
      <IconButton
        aria-label="Toggle sidebar"
        onClick={onToggle}
        position="absolute"
        right={-4}
        top="calc(50vh - 50px)"
        transform="translateY(0)"
        borderRadius="full"
        size="sm"
        bg="#eaeaeaff"
        _hover={{ bg: '#b3b1b1ff' }}
        icon={isCollapsed ? <ChevronRightIcon boxSize={6} /> : <ChevronLeftIcon boxSize={6} />}
      />
      <Box
        overflowY="auto"
        h="78vh"
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { width: '6px' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e0', borderRadius: '24px' },
        }}
      >
        <VStack align="stretch" spacing={1} mt={12} flex="1" pr={2.5} pl={2.5}>
          {menuItems.map((item) => renderMenuItem(item))}
        </VStack>
      </Box>
      <Flex flexDirection="column" gap={1} mb={70} pl={6}>
        <Flex align="center" gap={2}>
          <Image src={logo} alt="Logo" boxSize="30px" />
          {!isCollapsed && (
            <Text fontSize={16} fontWeight={800} color="#39393b">
              ITJob
            </Text>
          )}
        </Flex>

        {!isCollapsed && (
          <>
            <Text fontSize={13} fontWeight={700} color="#39393b">
              Think IT - Think VietNam
            </Text>
            <Text fontSize={11} fontWeight={500} color="#39393b">
              Copyright © ITJob 2025
            </Text>
            <Text fontSize={11} fontWeight={500} color="#39393b">
              All rights reserved. © 2025
            </Text>
          </>
        )}
      </Flex>
    </Box>
  );
}
