import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { dashboardNavItems } from './dashboardNavConfig';
import { locationPairLabel, isEthiopiaCountry } from './locationPairLabel';
import { getLocationSelectionPath } from '../../utils/reportLocationUtils';
import './DashboardSidebar.css';

function DashboardSidebar({ collapsed, onToggle }) {
  const report = useSelector((state) => state.report);
  const countryLabel = locationPairLabel(report.country);
  const showEthiopiaFlag = isEthiopiaCountry(report.country, countryLabel);

  const resolveItemPath = (item) => {
    if (item.dynamicLocation) return getLocationSelectionPath(report);
    return item.to;
  };

  const isItemDisabled = (item) => {
    if (item.requiresType && report.type !== item.requiresType) return true;
    if (item.dynamicLocation && !report.country) return false;
    return false;
  };

  return (
    <aside className={`dash-sidebar ${collapsed ? 'dash-sidebar--collapsed' : ''}`}>
      <div className="dash-sidebar__brand">
        <span className="dash-sidebar__logo">
          <i className="bi bi-flower1" />
        </span>
        {!collapsed && (
          <span className="dash-sidebar__brand-text">
            <span className="dash-sidebar__title">HaFAS</span>
            <span className="dash-sidebar__subtitle">Advisory</span>
          </span>
        )}
      </div>

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
        {dashboardNavItems.map((group) => (
          <div key={group.section} className="dash-sidebar__section">
            {!collapsed && (
              <span className="dash-sidebar__section-title">{group.section}</span>
            )}
            <ul className="dash-sidebar__list">
              {group.items.map((item) => {
                if (item.requiresType && report.type !== item.requiresType) {
                  return null;
                }
                const path = resolveItemPath(item);
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
                      to={path}
                      end={item.end}
                      className={({ isActive }) =>
                        `dash-sidebar__link${isActive ? ' dash-sidebar__link--active' : ''}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <i className={`bi ${item.icon}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
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
          <Link to="/" className="dash-sidebar__classic">
            <i className="bi bi-box-arrow-up-right" />
            Classic map view
          </Link>
        )}
      </div>
    </aside>
  );
}

export default DashboardSidebar;
