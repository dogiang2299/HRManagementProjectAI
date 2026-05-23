import { useState, useLayoutEffect, useMemo, useRef } from 'react';
import { Flex, Box } from '@chakra-ui/react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../modules/auth/store/auth.store';
import AppBreadcrumb from '../common/Breadcrumb';
import Header from './Header';
import Sidebar from './Sidebar';
import type { MenuMode } from '../../types';


export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement | null>(null);

  // lấy role từ store (khuyên dùng hasAnyRole)
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);

  // chỉ Admin/Employee mới có quyền xem menu admin
  const canUseAdminMenu = useMemo(
    () => hasAnyRole(['Admin', 'Employee']),
    [hasAnyRole]
  );

  // state menu đang dùng
  const [selectedMenuMode, setSelectedMenuMode] = useState<MenuMode>('main');
  const menuMode: MenuMode =
    canUseAdminMenu && selectedMenuMode === 'admin' ? 'admin' : 'main';

  const toggleMenuMode = () => {
    if (!canUseAdminMenu) return;
    setSelectedMenuMode((m) => (m === 'main' ? 'admin' : 'main'));
  };

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return (
    <Flex height="100vh" bg="white" overflow="hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        menuMode={menuMode}
      />

      <Flex
        flex="1"
        direction="column"
        pt="70px"
        ml={isCollapsed ? '80px' : '250px'}
        transition="margin-left 0.2s ease"
        minW="0"
        w={`calc(100% - ${isCollapsed ? '80px' : '250px'})`}
        overflow="hidden"
        position="relative"
      >
        <Box flex="0 0 auto">
          <Header
            menuMode={menuMode}
            canUseAdminMenu={canUseAdminMenu}
            onToggleMenuMode={toggleMenuMode}
          />
        </Box>

        <Box
          ref={contentRef}
          flex="1"
          p={6}
          overflowY="auto"
          overflowX="hidden"
          minW="0"
          className="hide-scrollbar"
        >
          <AppBreadcrumb />
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}
