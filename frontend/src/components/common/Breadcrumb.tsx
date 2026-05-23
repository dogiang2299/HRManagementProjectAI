import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Text } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { AiOutlineRight } from 'react-icons/ai';
import { type IMenuItem, defaultMenus } from '../layout/MenuItem';
import { homeUrl } from '../../routes/urls';

const generatePathMap = (menus: IMenuItem[]): Record<string, string> => {
  const map: Record<string, string> = {};
  const stack = [...menus];

  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;

    if (item.path) map[item.path] = item.name;
    if (item.children?.length) stack.push(...item.children);
  }

  return map;
};

const pathNameMap = generatePathMap(defaultMenus);

const capitalize = (s: string) => {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// ✅ UUID v4/v1... (chuẩn 36 ký tự có dấu '-')
const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default function AppBreadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;
  const state: any = location.state;

  if (pathname === homeUrl) return null;

  const parts = pathname.split('/').filter(Boolean);

  // ✅ Nếu không có title mà segment cuối là UUID => ẩn segment đó luôn (đỡ show id)
  const effectiveParts =
    parts.length > 0 && isUuid(parts[parts.length - 1]) && !state?.title
      ? parts.slice(0, -1)
      : parts;

  const breadcrumbItems = effectiveParts.map((p, index) => {
    const fullPath = '/' + effectiveParts.slice(0, index + 1).join('/');

    // ✅ Nếu có state.title và trang đang là detail (bản chất: URL vẫn có UUID)
    // thì gắn title này làm label cho crumb cuối
    if (index === effectiveParts.length - 1 && state?.title) {
      return { path: fullPath, label: state.title };
    }

    const menuName = pathNameMap[fullPath];
    const label = menuName ?? capitalize(decodeURIComponent(p));
    return { path: fullPath, label };
  });

  return (
    <Breadcrumb fontWeight="medium" fontSize="sm" mb={4} separator={<AiOutlineRight size={12} />}>
      <BreadcrumbItem>
        <BreadcrumbLink as={Link} to={homeUrl}>
          Information Technology Tool
        </BreadcrumbLink>
      </BreadcrumbItem>

      {breadcrumbItems.map((item, idx) => {
        const isLast = idx === breadcrumbItems.length - 1;
        return (
          <BreadcrumbItem key={item.path} isCurrentPage={isLast}>
            {isLast ? (
              <Text fontWeight="semibold">{item.label}</Text>
            ) : (
              <BreadcrumbLink as={Link} to={item.path}>
                {item.label}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}