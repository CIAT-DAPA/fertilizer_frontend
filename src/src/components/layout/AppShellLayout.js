import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MenuDashboard from '../menu/MenuDashboard';
import DashboardSidebarModern from '../dashboard/DashboardSidebarModern';
import Footer from '../footer/Footer';
import '../dashboard/dashboardTheme.css';
import './AppShellLayout.css';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 72;

function AppShellLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('app-shell-active');
    document.body.classList.add('app-shell-active');
    return () => {
      html.classList.remove('app-shell-active');
      document.body.classList.remove('app-shell-active');
    };
  }, []);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <div className="app-shell" style={{ '--app-sidebar-offset': `${sidebarWidth}px` }}>
      <MenuDashboard
        onSidebarToggle={() => setMobileOpen((open) => !open)}
        sidebarOpen={mobileOpen}
      />

      {mobileOpen && (
        <button
          type="button"
          className="app-shell__backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <DashboardSidebarModern
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onRequestExpandSidebar={() => setCollapsed(false)}
      />

      <main className={`app-shell__main${collapsed ? ' app-shell__main--collapsed' : ''}`}>
        <div className="app-shell__content">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default AppShellLayout;

