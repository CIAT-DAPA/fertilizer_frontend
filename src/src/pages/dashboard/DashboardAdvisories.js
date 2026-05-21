import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardPageHeader from '../../components/dashboard/DashboardPageHeader';
import { advisoryQuickLinks } from '../../components/dashboard/dashboardNavConfig';
import './DashboardAdvisories.css';

const HIDDEN_ON_ADVISORY_HUB = new Set([
  'Country & location',
  'Wheat rust',
  'Methodology',
]);

function DashboardAdvisories() {
  const report = useSelector((state) => state.report);
  const reportPath = report.type === 'woreda' ? '/report_woreda' : report.kebele ? '/report' : null;

  const visibleLinks = advisoryQuickLinks.filter((item) => {
    if (HIDDEN_ON_ADVISORY_HUB.has(item.title)) return false;
    if (item.dynamicReport && !reportPath) return false;
    return true;
  });

  return (
    <div className="dash-page dash-advisories">
      <DashboardPageHeader
        title="Advisory hub"
        subtitle="HaFAS Ethiopia — browse and open fertilizer, soil, climate, and crop advisory modules."
      />

      <div className="row g-3">
        {visibleLinks.map((item) => {
          let path = item.path;
          if (item.dynamicReport) path = reportPath;
          return (
            <div className="col-md-6 col-lg-4" key={item.title}>
              <Link to={path} className="dash-adv-card h-100">
                <div className="dash-adv-card__bar" style={{ background: item.color }} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="dash-adv-card__link">
                  Open module <i className="bi bi-arrow-right" />
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardAdvisories;
