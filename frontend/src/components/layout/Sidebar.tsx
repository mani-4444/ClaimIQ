import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { UI_PERMISSIONS } from '../../constants';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: keyof (typeof UI_PERMISSIONS)['admin'];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Claims', href: '/claims', icon: <FileText className="h-5 w-5" /> },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    permission: 'canAccessAnalytics',
  },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
  {
    label: 'User Management',
    href: '/settings/users',
    icon: <Users className="h-5 w-5" />,
    permission: 'canManageUsers',
  },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'policyholder';
  const permissions = UI_PERMISSIONS[role];
  const location = useLocation();

  const filteredItems = navItems.filter(
    (item) => !item.permission || permissions[item.permission],
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-[var(--transition-slow)] flex flex-col',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 bg-primary-600 rounded-lg flex-shrink-0">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
              ClaimIQ
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary navigation">
        {filteredItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 border-l-3 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                isCollapsed && 'justify-center px-0',
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full px-3 py-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
