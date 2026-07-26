import React from 'react';
import { NavLink } from 'react-router-dom';
import { collapseMobileHeaderNav } from './collapseMobileHeaderNav';

export const API_LINKS = [
  {
    label: 'HaFAS API',
    href: 'https://webapi.hafasadvisory.com/apidocs/',
    icon: 'bi-braces',
  },
  {
    label: 'API Aclimate',
    href: 'https://webapi.aclimate.org/swagger/index.html',
    icon: 'bi-cloud',
  },
];

function HeaderPrimaryNav({ idPrefix = 'nav', mobileCollapseId = 'navbarCollapseDash' }) {
  const dropdownId = `${idPrefix}-apis-dropdown`;
  const closeMobileNav = () => collapseMobileHeaderNav(mobileCollapseId);

  return (
    <ul className="navbar-nav hafas-header__nav me-auto mb-2 mb-md-0">
      <li className="nav-item">
        <NavLink
          className={({ isActive }) => `nav-link hafas-header__link${isActive ? ' active' : ''}`}
          to="/"
          end
          onClick={closeMobileNav}
        >
          Home
        </NavLink>
      </li>

      <li className="nav-item">
        <NavLink className="hafas-header__link nav-link" to="/about" onClick={closeMobileNav}>
          About
        </NavLink>
      </li>

      <li className="nav-item">
        <NavLink className="hafas-header__link nav-link" to="/partners" onClick={closeMobileNav}>
          Partners
        </NavLink>
      </li>

      <li className="nav-item">
        <NavLink className="hafas-header__link nav-link" to="/methodology" onClick={closeMobileNav}>
          Methodology
        </NavLink>
      </li>

      <li className="nav-item dropdown">
        <button
          type="button"
          className="nav-link hafas-header__link dropdown-toggle"
          id={dropdownId}
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          APIs
        </button>
        <ul className="dropdown-menu dropdown-menu-dark hafas-header__dropdown" aria-labelledby={dropdownId}>
          {API_LINKS.map((api) => (
            <li key={api.href}>
              <a
                className="dropdown-item hafas-header__dropdown-item"
                href={api.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className={`bi ${api.icon} me-2`} aria-hidden="true" />
                {api.label}
                <i className="bi bi-box-arrow-up-right ms-auto small opacity-75" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </li>

      <li className="nav-item">
        <NavLink className="hafas-header__link nav-link" to="/success-stories" onClick={closeMobileNav}>
          Success Stories
        </NavLink>
      </li>

      <li className="nav-item">
        <NavLink className="hafas-header__link nav-link" to="/chatbot" onClick={closeMobileNav}>
          Chatbot
        </NavLink>
      </li>
    </ul>
  );
}

export default HeaderPrimaryNav;
