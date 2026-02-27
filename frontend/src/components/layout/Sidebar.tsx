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
  Sparkles,
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
        'fixed left-0 top-0 z-40 h-screen bg-dark-800/95 backdrop-blur-xl border-r border-white/[0.06] transition-all duration-[var(--transition-slow)] flex flex-col',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex-shrink-0 shadow-glow-blue">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-white whitespace-nowrap">
                ClaimIQ
              </span>
              <Sparkles className="h-3.5 w-3.5 text-primary-400 animate-pulse-slow" />
            </div>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-500/15 text-primary-400 border-l-3 border-primary-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.06)]'
                  : 'text-gray-400 hover:bg-white/[0.06] hover:text-gray-200',
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

      {/* AI Badge - only when expanded */}
      {!isCollapsed && (
        <div className="px-3 py-3 mx-3 mb-2 rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-700/10 border border-primary-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary-400" />
            <span className="text-xs font-semibold text-primary-400">AI-Powered</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Intelligent claim analysis & fraud detection
          </p>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="px-3 py-4 border-t border-white/[0.06] flex-shrink-0">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-gray-500 hover:bg-white/[0.06] hover:text-gray-300 transition-all"
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
