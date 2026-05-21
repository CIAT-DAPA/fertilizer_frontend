import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebarModern from './DashboardSidebarModern';
import './DashboardLayout.css';
import './dashboardTheme.css';

function DashboardLayoutModern() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <div className="dash-shell dash-shell--modern">
      <DashboardSidebarModern
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onRequestExpandSidebar={() => setCollapsed(false)}
      />
      <div className={`dash-main ${collapsed ? 'dash-main--expanded' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayoutModern;
