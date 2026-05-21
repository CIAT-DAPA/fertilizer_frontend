
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import './DashboardLayout.css';

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <div className="dash-shell">
      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className={`dash-main ${collapsed ? 'dash-main--expanded' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;
