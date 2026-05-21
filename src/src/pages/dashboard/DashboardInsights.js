import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Configuration from '../../conf/Configuration';
import DashboardPageHeader from '../../components/dashboard/DashboardPageHeader';
import DashboardStatCard from '../../components/dashboard/DashboardStatCard';
import './DashboardInsights.css';

const PLATFORM_METRICS = [
  {
    key: 'countries',
    label: 'Supported Countries',
    value: 1,
    icon: 'bi-globe2',
    accent: '#1b4332',
    detail: 'Ethiopia',
  },
  {
    key: 'crops',
    label: 'Supported Crops',
    value: 4,
    icon: 'bi-flower1',
    accent: '#2d6a4f',
    detail: 'Cereals & legumes',
  },
  {
    key: 'advisories',
    label: 'Advisory Types',
    value: 4,
    icon: 'bi-collection',
    accent: '#40916c',
    detail: 'Fertilizer, climate, risk & yield',
  },
  {
    key: 'farmers',
    label: 'Farmers Reached',
    value: 300000,
    icon: 'bi-people-fill',
    accent: '#1d3557',
    detail: 'Nationwide outreach',
    featured: true,
  },
];

function formatMetricValue(value) {
  if (value >= 1000) return value.toLocaleString('en-US');
  return String(value);
}

function DashboardInsights() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [countryCount, setCountryCount] = useState(null);

  useEffect(() => {
    axios
      .get(Configuration.get_url_api_base() + 'country')
      .then((res) => {
        setApiStatus('online');
        setCountryCount(Array.isArray(res.data) ? res.data.length : 0);
      })
      .catch(() => {
        setApiStatus('offline');
      });
  }, []);

  return (
    <div className="dash-page dash-insights dash-insights--modern">
      <DashboardPageHeader
        title="System Status"
        subtitle="HaFAS Ethiopia — live service health and platform reach at a glance."
      />

      <section className="dash-insights-sys" aria-labelledby="dash-insights-sys-title">
        <h2 id="dash-insights-sys-title" className="dash-insights-section__title">
          Service health
        </h2>
        <p className="dash-insights-section__sub">Connected to the same NextGen API as advisories and reports</p>
        <div className="row g-3">
          <div className="col-md-4">
            <DashboardStatCard
              label="API status"
              value={apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking…'}
              icon="bi-hdd-network"
              accent={apiStatus === 'online' ? '#2d6a4f' : '#dc2626'}
            />
          </div>
          <div className="col-md-4">
            <DashboardStatCard
              label="Countries in DB"
              value={countryCount != null ? String(countryCount) : '—'}
              icon="bi-globe"
              accent="#40916c"
            />
          </div>
          <div className="col-md-4">
            <DashboardStatCard
              label="GeoServer"
              value="Aclimate WMS"
              hint={Configuration.get_geoserver_url()}
              icon="bi-layers"
              accent="#1b4332"
            />
          </div>
        </div>
      </section>

      <section className="dash-insights-reach" aria-labelledby="dash-insights-reach-title">
        <header className="dash-insights-reach__hero">
          <div className="dash-insights-reach__mesh" aria-hidden="true" />
          <div className="dash-insights-reach__inner">
            <div>
              <p className="dash-insights-reach__eyebrow">
                <i className="bi bi-bar-chart-line-fill" aria-hidden="true" />
                Platform reach
              </p>
              <h2 id="dash-insights-reach-title" className="dash-insights-reach__title">
                Scaling farmer-centered advisories across{' '}
                <span className="dash-insights-reach__highlight">Ethiopia</span>
              </h2>
              <p className="dash-insights-reach__text">
                HaFAS connects geospatial intelligence, soil data, and climate analytics to deliver
                actionable guidance at national scale.
              </p>
            </div>
            <div className="dash-insights-reach__badge" aria-hidden="true">
              <i className="bi bi-leaf-fill" />
            </div>
          </div>
        </header>

        <ul className="dash-insights-metrics">
          {PLATFORM_METRICS.map((metric, index) => (
            <li
              key={metric.key}
              className={`dash-insights-metric ${metric.featured ? 'dash-insights-metric--featured' : ''}`}
              style={{
                '--metric-accent': metric.accent,
                '--metric-delay': `${index * 0.07}s`,
              }}
            >
              <span className="dash-insights-metric__bar" aria-hidden="true" />
              <span className="dash-insights-metric__icon" aria-hidden="true">
                <i className={`bi ${metric.icon}`} />
              </span>
              <span className="dash-insights-metric__value">{formatMetricValue(metric.value)}</span>
              <span className="dash-insights-metric__label">{metric.label}</span>
              <span className="dash-insights-metric__detail">{metric.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default DashboardInsights;
