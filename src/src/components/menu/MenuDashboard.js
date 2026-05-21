import React from 'react';
import './Menu.css';
import { Link } from 'react-router-dom';
import HeaderPrimaryNav from './HeaderPrimaryNav';
import logo_nextgen from '../../assets/images/logo_nextgen.png';

function MenuDashboard({ onSidebarToggle, sidebarOpen }) {
  return (
    <header className="hafas-header">
      <nav className="navbar navbar-expand-lg navbar-dark hafas-header__bar fixed-top">
        <div className="container-fluid hafas-header__container">
          {onSidebarToggle && (
            <button
              type="button"
              className="btn hafas-header__icon-btn d-lg-none me-1"
              onClick={onSidebarToggle}
              aria-expanded={sidebarOpen}
              aria-label="Toggle navigation sidebar"
            >
              <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`} />
            </button>
          )}

          <Link className="navbar-brand hafas-header__brand" to="/dashboard">
            <img src={logo_nextgen} width="36" height="36" alt="" className="hafas-header__logo" />
            <span className="hafas-header__brand-text">HaFAS Advisory</span>
          </Link>

          <button
            className="navbar-toggler hafas-header__toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarCollapseDash"
            aria-controls="navbarCollapseDash"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarCollapseDash">
            <HeaderPrimaryNav idPrefix="dash" />
          </div>
        </div>
      </nav>
    </header>
  );
}

export default MenuDashboard;
