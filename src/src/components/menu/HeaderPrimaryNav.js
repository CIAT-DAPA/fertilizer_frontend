import React from 'react';
import { NavLink } from 'react-router-dom';

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

function HeaderPrimaryNav({ idPrefix = 'nav' }) {
  const dropdownId = `${idPrefix}-apis-dropdown`;

  return (
    <ul className="navbar-nav hafas-header__nav me-auto mb-2 mb-md-0">
      <li className="nav-item">
        <NavLink
          className={({ isActive }) => `nav-link hafas-header__link${isActive ? ' active' : ''}`}
          to="/"
          end
        >
          Home
        </NavLink>
      </li>

      <li className="nav-item">
        <NavLink className="hafas-header__link nav-link" to="/about">
          About
        </NavLink>
      </li>

      <li className="nav-item">
        <NavLink className="hafas-header__link nav-link" to="/partners">
          Partners
        </NavLink>
      </li>

      <li className="nav-item">
        <NavLink className="hafas-header__link nav-link" to="/methodology">
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
        <NavLink className="hafas-header__link nav-link" to="/success-stories">
          Success Stories
        </NavLink>
      </li>

      <li className="nav-item">
        <NavLink className="hafas-header__link nav-link" to="/chatbot">
          Chatbot
        </NavLink>
      </li>
    </ul>
  );
}

export default HeaderPrimaryNav;
