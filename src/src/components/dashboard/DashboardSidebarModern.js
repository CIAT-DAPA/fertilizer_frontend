import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { dashboardNavItemsModern } from './dashboardNavConfigModern';
import { locationPairLabel, isEthiopiaCountry } from './locationPairLabel';
import './DashboardSidebar.css';

function DashboardSidebarModern({
  collapsed,
  onToggle,
  mobileOpen,
  onNavigate,
  onRequestExpandSidebar,
}) {
  const location = useLocation();
  const report = useSelector((state) => state.report);
  const countryLabel = locationPairLabel(report.country);
  const showEthiopiaFlag = isEthiopiaCountry(report.country, countryLabel);
  const [openGroups, setOpenGroups] = useState({});

  const isItemDisabled = (item) => {
    if (item.requiresType && report.type !== item.requiresType) return true;
    return false;
  };

  const toggleGroup = (item) => {
    if (collapsed && onRequestExpandSidebar) {
      onRequestExpandSidebar();
      setOpenGroups((prev) => ({ ...prev, [item.groupId]: true }));
      return;
    }
    setOpenGroups((prev) => {
      const childActive = item.children.some((c) => location.pathname === c.to);
      const current =
        prev[item.groupId] !== undefined ? prev[item.groupId] : childActive;
      return { ...prev, [item.groupId]: !current };
    });
  };

  const isGroupOpen = (item) => {
    const childActive = item.children?.some((c) => location.pathname === c.to);
    if (openGroups[item.groupId] !== undefined) {
      return openGroups[item.groupId];
    }
    return Boolean(childActive);
  };

  const renderNavItem = (item) => {
    if (item.expandable && item.children) {
      const open = isGroupOpen(item);
      const childActive = item.children.some((c) => location.pathname === c.to);

      return (
        <li key={item.groupId} className="dash-sidebar__expandable">
          <button
            type="button"
            className={`dash-sidebar__link dash-sidebar__expandable-trigger${
              childActive ? ' dash-sidebar__expandable-trigger--active' : ''
            }`}
            onClick={() => toggleGroup(item)}
            aria-expanded={open}
            title={collapsed ? item.label : undefined}
          >
            <i className={`bi ${item.icon}`} />
            {!collapsed && (
              <>
                <span className="dash-sidebar__expandable-label">{item.label}</span>
                <i className={`bi dash-sidebar__expandable-chevron ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
              </>
            )}
          </button>
          {open && !collapsed && (
            <ul className="dash-sidebar__sublist" role="list">
              {item.children.map((child) => {
                if (child.requiresType && report.type !== child.requiresType) {
                  return null;
                }
                const disabled = isItemDisabled(child);
                if (disabled) {
                  return (
                    <li key={child.label}>
                      <span
                        className="dash-sidebar__link dash-sidebar__link--sub dash-sidebar__link--disabled"
                        title="Select a kebele or woreda first"
                      >
                        <i className={`bi ${child.icon}`} />
                        <span>{child.label}</span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={child.label}>
                    <NavLink
                      to={child.to}
                      end={child.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `dash-sidebar__link dash-sidebar__link--sub${
                          isActive ? ' dash-sidebar__link--active' : ''
                        }`
                      }
                    >
                      <i className={`bi ${child.icon}`} />
                      <span>{child.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    if (item.requiresType && report.type !== item.requiresType) {
      return null;
    }
    const disabled = isItemDisabled(item);

    if (disabled) {
      return (
        <li key={item.label}>
          <span
            className="dash-sidebar__link dash-sidebar__link--disabled"
            title="Select a kebele or woreda first"
          >
            <i className={`bi ${item.icon}`} />
            {!collapsed && <span>{item.label}</span>}
          </span>
        </li>
      );
    }

    return (
      <li key={item.label}>
        <NavLink
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) => `dash-sidebar__link${isActive ? ' dash-sidebar__link--active' : ''}`}
          title={collapsed ? item.label : undefined}
        >
          <i className={`bi ${item.icon}`} />
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      </li>
    );
  };

  return (
    <aside
      className={`dash-sidebar dash-sidebar--no-brand${collapsed ? ' dash-sidebar--collapsed' : ''}${
        mobileOpen ? ' dash-sidebar--mobile-open' : ''
      }`}
    >
      {!collapsed && countryLabel && (
        <div className="dash-sidebar__context">
          {showEthiopiaFlag ? (
            <span className="dash-sidebar__country-flag" role="img" aria-label="Ethiopia">
              🇪🇹
            </span>
          ) : (
            <i className="bi bi-pin-map" aria-hidden="true" />
          )}
          <span>{countryLabel}</span>
        </div>
      )}

      <nav className="dash-sidebar__nav" aria-label="Dashboard navigation">
        {dashboardNavItemsModern.map((group) => (
          <div key={group.id || group.section || 'nav'} className="dash-sidebar__section">
            {group.section && !collapsed && (
              <span className="dash-sidebar__section-title">{group.section}</span>
            )}
            <ul className="dash-sidebar__list">
              {group.items.map((item) => renderNavItem(item)).filter(Boolean)}
            </ul>
          </div>
        ))}
      </nav>

      <div className="dash-sidebar__footer">
        <button
          type="button"
          className="dash-sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
        </button>
        {!collapsed && (
          <Link to="/" className="dash-sidebar__classic" onClick={onNavigate}>
            <i className="bi bi-box-arrow-up-right" />
            Classic map view
          </Link>
        )}
      </div>
    </aside>
  );
}

export default DashboardSidebarModern;
