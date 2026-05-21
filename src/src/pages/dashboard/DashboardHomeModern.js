import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardStatCard from '../../components/dashboard/DashboardStatCard';
import { advisoryQuickLinks } from '../../components/dashboard/dashboardNavConfig';
import { locationPairLabel } from '../../components/dashboard/locationPairLabel';
import {
  getLocationSelectionPath,
  resolveDashboardLinkPath,
} from '../../utils/reportLocationUtils';
import './DashboardHome.css';
import './DashboardHomeModern.css';

const QUICK_ICONS = {
  'Country & location': 'bi-geo-alt-fill',
  'N, P & optimal yield': 'bi-droplet-half',
  'NPS & Urea': 'bi-moisture',
  'ISFM': 'bi-recycle',
  'PDF report': 'bi-file-earmark-pdf-fill',
  Agroclimate: 'bi-cloud-sun-fill',
  Lime: 'bi-layers-fill',
  CSA: 'bi-tree-fill',
  Irrigation: 'bi-water',
  'Wheat rust': 'bi-shield-exclamation',
  'AI chatbot': 'bi-robot',
  Methodology: 'bi-journal-bookmark-fill',
};

const SETUP_STEPS = [
  { id: 1, label: 'Country', detail: 'Select your nation' },
  { id: 2, label: 'Admin units', detail: 'Region → zone → woreda' },
  { id: 3, label: 'Reports & maps', detail: 'Kebele or woreda level' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function DashboardHomeModern() {
  const report = useSelector((state) => state.report);

  const country = locationPairLabel(report.country);
  const region = locationPairLabel(report.region);
  const zone = locationPairLabel(report.zone);
  const woreda = locationPairLabel(report.woreda);
  const kebele = locationPairLabel(report.kebele);

  const reportPath =
    report.type === 'woreda' ? '/report_woreda' : report.kebele ? '/report' : null;

  const step1 = !!country;
  const step2 = !!region && !!zone && !!woreda;
  const step3 = !!kebele || report.type === 'woreda';
  const setupComplete = step1 && step2 && step3;
  const setupPct = Math.round(((step1 ? 1 : 0) + (step2 ? 1 : 0) + (step3 ? 1 : 0)) * (100 / 3));

  const locationPath = getLocationSelectionPath(report);

  const visibleLinks = useMemo(
    () =>
      advisoryQuickLinks.filter((item) => {
        if (item.dynamicReport && !reportPath) return false;
        return true;
      }),
    [reportPath],
  );

  const featuredLinks = visibleLinks.slice(0, 2);
  const restLinks = visibleLinks.slice(2);

  const sessionLayers = [
    { key: 'fertilizer', label: 'Fertilizer', on: report.ad_fertilizer, icon: 'bi-droplet-half' },
    { key: 'aclimate', label: 'Aclimate', on: report.ad_aclimate, icon: 'bi-cloud-sun' },
    { key: 'risk', label: 'Risk', on: report.ad_risk, icon: 'bi-exclamation-triangle' },
  ];

  return (
    <div className="dash-page dash-home dash-home--modern">
      <header
        className="dash-home-hero"
        aria-labelledby="dash-home-title"
      >
        <div className="dash-home-hero__mesh" aria-hidden="true" />
        <div className="dash-home-hero__grain" aria-hidden="true" />

        <div className="dash-home-hero__inner">
          <div className="dash-home-hero__copy">
            <p className="dash-home-hero__eyebrow">
              <i className="bi bi-leaf-fill" aria-hidden="true" />
              {greeting()} · HaFAS workspace
            </p>
            <h1 id="dash-home-title" className="dash-home-hero__title">
              {country ? (
                <>
                  Advisories for{' '}
                  <span className="dash-home-hero__highlight">{country}</span>
                </>
              ) : (
                'Start with your location'
              )}
            </h1>
            <p className="dash-home-hero__text">
              {country
                ? 'Unlock location-specific advisories with interactive maps, nutrient intelligence, climate data, and actionable reports tailored to your selected administrative areas.'
                : 'Pick a country and drill down to kebele level. Everything on this dashboard updates as you go.'}
            </p>

            <div className="dash-home-hero__actions">
              <Link className="dash-home-btn dash-home-btn--primary" to={locationPath}>
                <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                {country ? 'Change location' : 'Select country'}
              </Link>
              {reportPath && (
                <Link className="dash-home-btn dash-home-btn--ghost" to={reportPath}>
                  <i className="bi bi-file-earmark-pdf" aria-hidden="true" />
                  Open report
                </Link>
              )}
            </div>
          </div>

          <aside className="dash-home-hero__status" aria-label="Setup status">
            <div className="dash-home-ring" style={{ '--pct': setupPct }}>
              <svg viewBox="0 0 36 36" className="dash-home-ring__svg" aria-hidden="true">
                <path
                  className="dash-home-ring__track"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="dash-home-ring__fill"
                  strokeDasharray={`${setupPct}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="dash-home-ring__value">{setupPct}%</span>
            </div>
            <p className="dash-home-hero__status-label">
              {setupComplete ? 'Ready to explore' : 'Setup in progress'}
            </p>
            <ol className="dash-home-steps" aria-label="Setup progress">
              {SETUP_STEPS.map((step, i) => {
                const done = [step1, step2, step3][i];
                const active = !done && (i === 0 || [step1, step2][i - 1]);
                return (
                  <li
                    key={step.id}
                    className={`dash-home-steps__item ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}
                  >
                    <span className="dash-home-steps__dot" aria-hidden="true">
                      {done ? <i className="bi bi-check-lg" /> : step.id}
                    </span>
                    <span className="dash-home-steps__text">
                      <strong>{step.label}</strong>
                      <small>{step.detail}</small>
                    </span>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      </header>

      <section className="dash-home-loc" aria-labelledby="dash-home-loc-title">
        <div className="dash-home-section-head">
          <h2 id="dash-home-loc-title" className="dash-home-section-head__title">
            Location snapshot
          </h2>
          <p className="dash-home-section-head__sub">Your administrative hierarchy at a glance</p>
        </div>

        <div className="dash-home-loc__trail" aria-hidden="true" />
        <div className="row g-3 dash-home-loc__grid">
          <div className="col-sm-6 col-lg-3">
            <DashboardStatCard label="Country" value={country} icon="bi-globe2" accent="#1b4332" />
          </div>
          <div className="col-sm-6 col-lg-3">
            <DashboardStatCard
              label="Region"
              value={region}
              hint={zone ? `Zone: ${zone}` : 'Adm1'}
              icon="bi-map"
              accent="#2d6a4f"
            />
          </div>
          <div className="col-sm-6 col-lg-3">
            <DashboardStatCard label="Woreda" value={woreda} icon="bi-pin-map-fill" accent="#40916c" />
          </div>
          <div className="col-sm-6 col-lg-3">
            <DashboardStatCard
              label="Kebele"
              value={kebele}
              hint={report.type === 'woreda' ? 'Woreda-level report' : 'Kebele-level'}
              icon="bi-house-door"
              accent="#52b788"
              trend={
                report.ad_fertilizer
                  ? 'Fertilizer layer on'
                  : report.ad_optimal
                    ? 'Optimal yield on'
                    : undefined
              }
            />
          </div>
        </div>
      </section>

      <div className="row g-4 dash-home-main">
        <div className="col-lg-8">
          <section className="dash-home-modules" aria-labelledby="dash-home-modules-title">
            <div className="dash-home-section-head dash-home-section-head--row">
              <div>
                <h2 id="dash-home-modules-title" className="dash-home-section-head__title">
                  Quick access
                </h2>
                <p className="dash-home-section-head__sub">
                  Jump straight into advisories, maps, and tools
                </p>
              </div>
              <span className="dash-home-pill">{visibleLinks.length} modules</span>
            </div>

            <div className="dash-home-bento">
              {featuredLinks.map((item) => {
                const path = resolveDashboardLinkPath(item, report, reportPath);
                return (
                  <Link
                    key={item.title}
                    to={path}
                    className="dash-home-bento__card dash-home-bento__card--featured"
                    style={{ '--module-color': item.color }}
                  >
                    <span className="dash-home-bento__icon" aria-hidden="true">
                      <i className={`bi ${QUICK_ICONS[item.title] || 'bi-grid'}`} />
                    </span>
                    <span className="dash-home-bento__body">
                      <span className="dash-home-bento__title">{item.title}</span>
                      <span className="dash-home-bento__desc">{item.description}</span>
                    </span>
                    <i className="bi bi-arrow-up-right dash-home-bento__arrow" aria-hidden="true" />
                  </Link>
                );
              })}

              {restLinks.map((item) => {
                const path = resolveDashboardLinkPath(item, report, reportPath);
                return (
                  <Link
                    key={item.title}
                    to={path}
                    className="dash-home-bento__card"
                    style={{ '--module-color': item.color }}
                  >
                    <span className="dash-home-bento__icon dash-home-bento__icon--sm" aria-hidden="true">
                      <i className={`bi ${QUICK_ICONS[item.title] || 'bi-grid'}`} />
                    </span>
                    <span className="dash-home-bento__title">{item.title}</span>
                    <span className="dash-home-bento__desc">{item.description}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="col-lg-4">
          <aside className="dash-home-session" aria-labelledby="dash-home-session-title">
            <h2 id="dash-home-session-title" className="dash-home-session__title">
              Live session
            </h2>
            <p className="dash-home-session__sub">Layers and report scope for this visit</p>

            <div className="dash-home-session__report">
              <span className="dash-home-session__report-label">Report type</span>
              <span className="dash-home-session__report-value">
                {report.type || 'Not set'}
              </span>
            </div>

            <ul className="dash-home-session__layers">
              {sessionLayers.map((layer) => (
                <li key={layer.key} className={layer.on ? 'is-on' : ''}>
                  <span className="dash-home-session__layer-name">
                    <i className={`bi ${layer.icon}`} aria-hidden="true" />
                    {layer.label}
                  </span>
                  <span className="dash-home-session__toggle" aria-label={layer.on ? 'On' : 'Off'}>
                    <span className="dash-home-session__knob" />
                  </span>
                </li>
              ))}
            </ul>

            <Link to="/dashboard/metrics" className="dash-home-btn dash-home-btn--primary dash-home-btn--block">
              <i className="bi bi-bar-chart-line-fill" aria-hidden="true" />
              Preview metrics
            </Link>
            <Link
              to="/dashboard/advisories"
              className="dash-home-btn dash-home-btn--outline dash-home-btn--block"
            >
              All advisories
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default DashboardHomeModern;
