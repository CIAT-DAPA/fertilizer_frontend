import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardPageHeader from '../../components/dashboard/DashboardPageHeader';
import DashboardStatCard from '../../components/dashboard/DashboardStatCard';
import DashboardLocationMap from '../../components/dashboard/DashboardLocationMap';
import { locationPairLabel } from '../../components/dashboard/locationPairLabel';
import { useDashboardLocationGeo } from '../../hooks/useDashboardLocationGeo';
import {
  formatSavedLocationLabel,
  getLocationSelectionPath,
  isReportLocationComplete,
} from '../../utils/reportLocationUtils';
import './DashboardLocation.css';

const HIERARCHY_STEPS = [
  { key: 'country', label: 'Country', icon: 'bi-globe2' },
  { key: 'region', label: 'Region', icon: 'bi-map' },
  { key: 'zone', label: 'Zone', icon: 'bi-signpost-split' },
  { key: 'woreda', label: 'Woreda', icon: 'bi-pin-map-fill' },
  { key: 'kebele', label: 'Kebele', icon: 'bi-house-door' },
];

const ADVISORY_LAYERS = [
  { key: 'ad_fertilizer', label: 'Fertilizer', icon: 'bi-droplet-half' },
  { key: 'ad_optimal', label: 'Optimal yield', icon: 'bi-graph-up-arrow' },
  { key: 'ad_risk', label: 'Risk', icon: 'bi-exclamation-triangle' },
  { key: 'ad_aclimate', label: 'Aclimate', icon: 'bi-cloud-sun' },
];

function deepestAreaLabel(report) {
  if (report.kebele) return locationPairLabel(report.kebele);
  if (report.woreda) return locationPairLabel(report.woreda);
  if (report.zone) return locationPairLabel(report.zone);
  if (report.region) return locationPairLabel(report.region);
  return locationPairLabel(report.country);
}

function setupProgress(report) {
  const country = !!report.country;
  const admin = !!report.region && !!report.zone && !!report.woreda;
  const final = report.type === 'woreda' ? admin : admin && !!report.kebele;
  const steps = [country, admin, final];
  const done = steps.filter(Boolean).length;
  return { done, total: 3, pct: Math.round((done / 3) * 100), complete: final && country };
}

function DashboardLocation() {
  const report = useSelector((state) => state.report);
  const openPath = getLocationSelectionPath(report);
  const { geoJson, status: geoStatus, level: geoLevel } = useDashboardLocationGeo(report);

  const country = locationPairLabel(report.country);
  const region = locationPairLabel(report.region);
  const zone = locationPairLabel(report.zone);
  const woreda = locationPairLabel(report.woreda);
  const kebele = locationPairLabel(report.kebele);
  const summary = formatSavedLocationLabel(report);
  const areaLabel = deepestAreaLabel(report);
  const locationComplete = isReportLocationComplete(report);
  const progress = setupProgress(report);

  const reportPath =
    report.type === 'woreda' ? '/report_woreda' : report.kebele ? '/report' : null;

  const reportTypeLabel =
    report.type === 'woreda' ? 'Woreda-level report' : report.type === 'kebele' ? 'Kebele-level report' : null;

  const hierarchyValues = useMemo(
    () => ({
      country,
      region,
      zone,
      woreda,
      kebele: report.type === 'woreda' ? null : kebele,
    }),
    [country, region, zone, woreda, kebele, report.type],
  );

  const enabledLayers = ADVISORY_LAYERS.filter((layer) => report[layer.key]);

  if (!report.country) {
    return (
      <div className="dash-page dash-location dash-location--modern">
        <DashboardPageHeader
          title="Location"
          subtitle="HaFAS Ethiopia — choose your country and administrative units to unlock location-specific advisories."
        />

        <section className="dash-loc-empty" aria-labelledby="dash-loc-empty-title">
          <div className="dash-loc-empty__icon" aria-hidden="true">
            <i className="bi bi-geo-alt" />
          </div>
          <h2 id="dash-loc-empty-title">No location selected yet</h2>
          <p>
            Pick Ethiopia and drill down through region, zone, woreda, and kebele. Your selection is
            saved in this browser for maps, reports, and advisory modules.
          </p>
          <Link className="dash-loc-btn dash-loc-btn--primary" to={openPath}>
            <i className="bi bi-geo-alt-fill" aria-hidden="true" />
            Select location
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="dash-page dash-location dash-location--modern">
      <DashboardPageHeader
        title="Location"
        subtitle="HaFAS Ethiopia — your saved administrative area, map preview, and enabled advisory layers."
        actions={
          <>
            <Link className="dash-loc-btn dash-loc-btn--ghost" to={openPath}>
              <i className="bi bi-pencil-square" aria-hidden="true" />
              Change location
            </Link>
            {reportPath ? (
              <Link className="dash-loc-btn dash-loc-btn--primary" to={reportPath}>
                <i className="bi bi-file-earmark-pdf" aria-hidden="true" />
                Open report
              </Link>
            ) : null}
          </>
        }
      />

      <header className="dash-loc-hero" aria-labelledby="dash-loc-hero-title">
        <div className="dash-loc-hero__mesh" aria-hidden="true" />
        <div className="dash-loc-hero__inner">
          <div className="dash-loc-hero__copy">
            <p className="dash-loc-hero__eyebrow">
              <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              {locationComplete ? 'Location ready' : 'Setup in progress'}
            </p>
            <h2 id="dash-loc-hero-title" className="dash-loc-hero__title">
              {areaLabel ? (
                <span className="dash-loc-hero__highlight">{areaLabel}</span>
              ) : (
                country
              )}
            </h2>
            <p className="dash-loc-hero__text">{summary || country}</p>
            <div className="dash-loc-hero__meta">
              {reportTypeLabel ? (
                <span className="dash-loc-pill">
                  <i className="bi bi-layers" aria-hidden="true" />
                  {reportTypeLabel}
                </span>
              ) : null}
              <span className="dash-loc-pill dash-loc-pill--muted">
                <i className="bi bi-hdd" aria-hidden="true" />
                Saved in this browser
              </span>
            </div>
          </div>

          <aside className="dash-loc-hero__ring-wrap" aria-label="Location setup progress">
            <div className="dash-loc-ring" style={{ '--pct': progress.pct }}>
              <svg viewBox="0 0 36 36" className="dash-loc-ring__svg" aria-hidden="true">
                <path
                  className="dash-loc-ring__track"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="dash-loc-ring__fill"
                  strokeDasharray={`${progress.pct}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="dash-loc-ring__value">{progress.pct}%</span>
            </div>
            <p className="dash-loc-hero__ring-label">
              {progress.complete ? 'Ready for advisories' : 'Complete your hierarchy'}
            </p>
          </aside>
        </div>
      </header>

      <section className="dash-loc-trail-section" aria-label="Administrative hierarchy">
        <ol className="dash-loc-trail">
          {HIERARCHY_STEPS.filter(
            (step) => step.key !== 'kebele' || report.type !== 'woreda',
          ).map((step, index, steps) => {
            const value = hierarchyValues[step.key];
            const done = !!value;
            const prevKey = index > 0 ? steps[index - 1].key : null;
            const active = !done && (prevKey == null || !!hierarchyValues[prevKey]);
            return (
              <li
                key={step.key}
                className={`dash-loc-trail__step ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}
              >
                <span className="dash-loc-trail__icon" aria-hidden="true">
                  <i className={`bi ${step.icon}`} />
                </span>
                <span className="dash-loc-trail__label">{step.label}</span>
                <span className="dash-loc-trail__value">{value || '—'}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="row g-4 dash-loc-main">
        <div className="col-lg-7">
          <section className="dash-loc-panel" aria-labelledby="dash-loc-map-title">
            <div className="dash-loc-panel__head">
              <h3 id="dash-loc-map-title" className="dash-loc-panel__title">
                Map preview
              </h3>
              <p className="dash-loc-panel__sub">Boundary for your current selection</p>
            </div>
            <DashboardLocationMap
              geoJson={geoJson}
              status={geoStatus}
              level={geoLevel}
              areaLabel={areaLabel}
            />
          </section>
        </div>

        <div className="col-lg-5">
          <section className="dash-loc-panel dash-loc-panel--stack" aria-labelledby="dash-loc-stats-title">
            <div className="dash-loc-panel__head">
              <h3 id="dash-loc-stats-title" className="dash-loc-panel__title">
                At a glance
              </h3>
            </div>
            <div className="row g-3">
              <div className="col-6">
                <DashboardStatCard label="Country" value={country} icon="bi-globe2" accent="#1b4332" />
              </div>
              <div className="col-6">
                <DashboardStatCard label="Region" value={region} icon="bi-map" accent="#2d6a4f" />
              </div>
              <div className="col-6">
                <DashboardStatCard label="Zone" value={zone} icon="bi-signpost-split" accent="#40916c" />
              </div>
              <div className="col-6">
                <DashboardStatCard
                  label="Woreda"
                  value={woreda}
                  hint={report.type === 'woreda' ? 'Report anchor' : undefined}
                  icon="bi-pin-map-fill"
                  accent="#52b788"
                />
              </div>
              {report.type !== 'woreda' ? (
                <div className="col-12">
                  <DashboardStatCard
                    label="Kebele"
                    value={kebele}
                    hint={kebele ? 'Finest unit' : 'Select on location picker'}
                    icon="bi-house-door"
                    accent="#1d3557"
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="dash-loc-panel" aria-labelledby="dash-loc-layers-title">
            <div className="dash-loc-panel__head dash-loc-panel__head--row">
              <div>
                <h3 id="dash-loc-layers-title" className="dash-loc-panel__title">
                  Advisory layers
                </h3>
                <p className="dash-loc-panel__sub">
                  {enabledLayers.length
                    ? `${enabledLayers.length} active for this session`
                    : 'None selected — enable layers when choosing location'}
                </p>
              </div>
              <Link className="dash-loc-link" to={openPath}>
                Edit <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
            </div>
            <ul className="dash-loc-layers">
              {ADVISORY_LAYERS.map((layer) => (
                <li
                  key={layer.key}
                  className={`dash-loc-layers__item ${report[layer.key] ? 'is-on' : ''}`}
                >
                  <i className={`bi ${layer.icon}`} aria-hidden="true" />
                  <span>{layer.label}</span>
                  <span className="dash-loc-layers__state">
                    {report[layer.key] ? 'On' : 'Off'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DashboardLocation;
