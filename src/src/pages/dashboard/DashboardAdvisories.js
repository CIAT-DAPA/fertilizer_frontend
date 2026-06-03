import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardPageHeader from '../../components/dashboard/DashboardPageHeader';
import { advisoryQuickLinks } from '../../components/dashboard/dashboardNavConfig';
import './DashboardAdvisories.css';

const HIDDEN_ON_ADVISORY_HUB = new Set(['Methodology', 'PDF report']);

/** First items on the Advisory hub grid (others keep config order). */
const ADVISORY_HUB_PRIORITY = ['Site fertilizer advisory', 'AI chatbot'];

function sortAdvisoryHubLinks(links) {
  return [...links].sort((a, b) => {
    const rankA = ADVISORY_HUB_PRIORITY.indexOf(a.title);
    const rankB = ADVISORY_HUB_PRIORITY.indexOf(b.title);
    const orderA =
      rankA === -1
        ? ADVISORY_HUB_PRIORITY.length + advisoryQuickLinks.indexOf(a)
        : rankA;
    const orderB =
      rankB === -1
        ? ADVISORY_HUB_PRIORITY.length + advisoryQuickLinks.indexOf(b)
        : rankB;
    return orderA - orderB;
  });
}

function DashboardAdvisories() {
  const visibleLinks = useMemo(
    () =>
      sortAdvisoryHubLinks(
        advisoryQuickLinks.filter((item) => !HIDDEN_ON_ADVISORY_HUB.has(item.title))
      ),
    []
  );

  return (
    <div className="dash-page dash-advisories">
      <DashboardPageHeader
        title="Advisory hub"
        subtitle="HaFAS Ethiopia — browse and open fertilizer, soil, climate, and crop advisory modules."
      />

      <div className="row g-3">
        {visibleLinks.map((item) => (
            <div className="col-md-6 col-lg-4" key={item.title}>
              <Link to={item.path} className="dash-adv-card h-100">
                <div className="dash-adv-card__bar" style={{ background: item.color }} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="dash-adv-card__link">
                  Open module <i className="bi bi-arrow-right" />
                </span>
              </Link>
            </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardAdvisories;
