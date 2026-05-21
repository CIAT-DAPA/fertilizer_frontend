
import React from 'react';
import './DashboardPageHeader.css';

function DashboardPageHeader({ title, subtitle, actions }) {
  return (
    <div className="dash-page-header">
      <div>
        <h1 className="dash-page-header__title">{title}</h1>
        {subtitle ? <p className="dash-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="dash-page-header__actions">{actions}</div> : null}
    </div>
  );
}

export default DashboardPageHeader;
