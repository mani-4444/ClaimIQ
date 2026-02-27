import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '../../lib/utils';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown on lg+ */}
      <div
        className={cn(
          'hidden lg:block',
          mobileMenuOpen && '!block',
        )}
      >
        <Sidebar
          isCollapsed={sidebarCollapsed && !mobileMenuOpen}
          onToggle={() => {
            if (mobileMenuOpen) {
              setMobileMenuOpen(false);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
        />
      </div>

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-[var(--transition-slow)]',
          'lg:ml-64',
          sidebarCollapsed && 'lg:ml-16',
        )}
      >
        <TopBar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main id="main-content" role="main" className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
