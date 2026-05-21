
import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardPageHeader from '../../components/dashboard/DashboardPageHeader';
import DashboardStatCard from '../../components/dashboard/DashboardStatCard';
import { advisoryQuickLinks } from '../../components/dashboard/dashboardNavConfig';
import { locationPairLabel } from '../../components/dashboard/locationPairLabel';
import { getLocationSelectionPath } from '../../utils/reportLocationUtils';
import './DashboardHome.css';

function DashboardHome() {
  const report = useSelector((state) => state.report);

  const country = locationPairLabel(report.country);
  const region = locationPairLabel(report.region);
  const zone = locationPairLabel(report.zone);
  const woreda = locationPairLabel(report.woreda);
  const kebele = locationPairLabel(report.kebele);

  const reportPath =
    report.type === 'woreda' ? '/report_woreda' : report.kebele ? '/report' : null;

  return (
    <div className="dash-home">
      <DashboardPageHeader
        title="Dashboard overview"
        subtitle="HaFAS Ethiopia — fertilizer and agro-advisory tools in one place."
        actions={
          <Link className="btn btn-success btn-sm" to={getLocationSelectionPath(report)}>
            <i className="bi bi-geo-alt me-1" />
            {country ? 'Change location' : 'Select country'}
          </Link>
        }
      />

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <DashboardStatCard label="Country" value={country} icon="bi-globe2" accent="#1b4332" />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardStatCard label="Region" value={region} hint="Adm1" icon="bi-map" accent="#2d6a4f" />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardStatCard label="Woreda" value={woreda} icon="bi-pin-map-fill" accent="#40916c" />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardStatCard
            label="Kebele"
            value={kebele}
            hint={report.type === 'woreda' ? 'Woreda-level report' : 'Kebele-level report'}
            icon="bi-house-door"
            accent="#52b788"
          />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="dash-panel">
            <h2 className="dash-panel__title">Quick access</h2>
            <div className="dash-quick-grid">
              {advisoryQuickLinks.map((item) => {
                let path = item.path;
                if (item.dynamicReport && reportPath) path = reportPath;
                if (item.dynamicReport && !reportPath) return null;
                return (
                  <Link key={item.title} to={path} className="dash-quick-card" style={{ '--qc': item.color }}>
                    <span className="dash-quick-card__title">{item.title}</span>
                    <span className="dash-quick-card__desc">{item.description}</span>
                    <i className="bi bi-arrow-right dash-quick-card__arrow" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="dash-panel">
            <h2 className="dash-panel__title">Getting started</h2>
            <ol className="dash-steps">
              <li className={country ? 'done' : ''}>Select Ethiopia on the map</li>
              <li className={region ? 'done' : ''}>Choose region, zone, woreda & kebele</li>
              <li className={kebele || report.type === 'woreda' ? 'done' : ''}>Open advisory maps or report</li>
            </ol>
            <Link to="/dashboard/advisories" className="btn btn-outline-success btn-sm w-100 mt-2">
              Browse all advisories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
