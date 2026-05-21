import React from 'react';
import './Menu.css';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../slices/authSlice';
import HeaderPrimaryNav from './HeaderPrimaryNav';
import logo_nextgen from '../../assets/images/logo_nextgen.png';

function MenuDashboardAuth({ onSidebarToggle, sidebarOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, status } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

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
            data-bs-target="#navbarCollapseDashAuth"
            aria-controls="navbarCollapseDashAuth"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarCollapseDashAuth">
            <HeaderPrimaryNav idPrefix="dash-auth" />

            <ul className="navbar-nav hafas-header__actions ms-auto align-items-lg-center">
              {status === 'authenticated' && user ? (
                <>
                  <li className="nav-item d-none d-md-block">
                    <span className="hafas-header__user">
                      <i className="bi bi-person-circle" aria-hidden="true" />
                      <span className="hafas-header__user-name">
                        {user.full_name || user.email}
                      </span>
                    </span>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className="btn hafas-header__btn-logout btn-sm"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <Link className="btn hafas-header__btn-primary btn-sm" to="/login">
                    Sign in
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default MenuDashboardAuth;
