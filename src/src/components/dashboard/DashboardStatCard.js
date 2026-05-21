import React from 'react';
import './DashboardStatCard.css';

function DashboardStatCard({ label, value, hint, icon, accent = '#2d6a4f', trend }) {
  const display = value != null && value !== '' ? value : 'Not set';

  return (
    <article className="dash-stat-card" style={{ '--stat-accent': accent }}>
      <div className="dash-stat-card__icon-wrap">
        <i className={`bi ${icon}`} aria-hidden="true" />
      </div>
      <div className="dash-stat-card__body">
        <span className="dash-stat-card__label">{label}</span>
        <span className="dash-stat-card__value" title={typeof display === 'string' ? display : undefined}>
          {display}
        </span>
        {hint ? <span className="dash-stat-card__hint">{hint}</span> : null}
        {trend ? <span className="dash-stat-card__trend">{trend}</span> : null}
      </div>
    </article>
  );
}

export default DashboardStatCard;
