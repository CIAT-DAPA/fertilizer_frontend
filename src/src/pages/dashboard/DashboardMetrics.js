import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import Configuration from '../../conf/Configuration';
import DashboardPageHeader from '../../components/dashboard/DashboardPageHeader';
import ColumnChart from '../../components/chart/ColumnChart';
import Spinners from '../../components/loading/Spinners';
import { locationPairLabel } from '../../components/dashboard/locationPairLabel';
import './DashboardMetrics.css';

/**
 * Metrics preview — data flow (see docs/dashboard-metrics.md):
 * - Kebele: report.kebele = [adm4MongoId, name, ext_id, aclimate_id] from Home / location cache.
 * - GET /metrics/{adm4MongoId} → all metric rows for that kebele; filter client-side by forecast id.
 * - Each row: { id, adm4, forecast, type, type_name?, values } — values[] entries use { s: season, values: [number] }.
 */

function DashboardMetrics() {
  const report = useSelector((state) => state.report);
  /** MongoEngine id for adm4 (24 hex) — must match metric.adm4 in DB, not ext_id alone. */
  const kebeleId = report.kebele?.[0];

  const [crops, setCrops] = useState([]);
  const [crop, setCrop] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  /** Month string from API, e.g. "2025-07" — avoids react-select dropping custom `id` on the value object. */
  const [selectedForecastMonth, setSelectedForecastMonth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forecastsLoading, setForecastsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);

  const resolvedForecastId = useMemo(() => {
    if (!selectedForecastMonth) return null;
    return forecasts.find((f) => f.value === selectedForecastMonth)?.id ?? null;
  }, [selectedForecastMonth, forecasts]);

  useEffect(() => {
    axios.get(Configuration.get_url_api_base() + 'crops').then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      const opts = list.map((c) => ({ label: c.name, value: c.id }));
      setCrops(opts);
      if (opts.length) setCrop(opts[0]);
    });
  }, []);

  const MAX_FORECAST_YEAR = 2025;

  useEffect(() => {
    if (!crop?.value) return;
    setForecastsLoading(true);
    axios
      .get(Configuration.get_url_api_base() + 'forecast/' + crop.value)
      .then((res) => {
        const opts = (Array.isArray(res.data) ? res.data : [])
          .filter((f) => {
            const year = parseInt(String(f.date).split('-')[0], 10);
            return !Number.isNaN(year) && year <= MAX_FORECAST_YEAR;
          })
          .map((f) => ({
            label: f.date,
            value: f.date,
            id: f.id,
          }));
        setForecasts(opts);
        if (opts.length) {
          setSelectedForecastMonth(opts[opts.length - 1].value);
        } else {
          setSelectedForecastMonth(null);
        }
      })
      .catch(() => {
        setForecasts([]);
        setSelectedForecastMonth(null);
      })
      .finally(() => setForecastsLoading(false));
  }, [crop]);

  useEffect(() => {
    if (!kebeleId || !resolvedForecastId) {
      setMetrics(null);
      setMetricsError(null);
      return;
    }
    const fid = String(resolvedForecastId);
    setLoading(true);
    setMetricsError(null);
    axios
      .get(Configuration.get_url_api_base() + 'metrics/' + encodeURIComponent(String(kebeleId)))
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setMetrics(rows.filter((m) => String(m.forecast) === fid));
      })
      .catch((err) => {
        setMetrics([]);
        setMetricsError(
          err.response?.data?.message ||
            err.message ||
            (err.response ? `HTTP ${err.response.status}` : 'Network error')
        );
      })
      .finally(() => setLoading(false));
  }, [kebeleId, resolvedForecastId]);

  const kebeleLabel = locationPairLabel(report.kebele);
  const woredaLabel = locationPairLabel(report.woreda);

  return (
    <div className="dash-page dash-metrics">
      <DashboardPageHeader
        title="Metrics preview"
        subtitle="Same /metrics API as the PDF report — preview bar charts before opening the full report."
      />

      {!kebeleId ? (
        <div className="dash-panel dash-metrics__empty">
          <i className="bi bi-geo-alt display-4 text-secondary" />
          <h3>No kebele selected</h3>
          <p className="text-secondary mb-0">
            Use the location selector to choose a kebele (kebele-level report). Woreda-level
            reports use aggregated data on the dedicated report page.
          </p>
        </div>
      ) : (
        <>
          <div className="dash-panel mb-3">
            <p className="mb-2">
              <strong>Kebele:</strong> {kebeleLabel}
              {woredaLabel && (
                <>
                  {' '}
                  · <strong>Woreda:</strong> {woredaLabel}
                </>
              )}
            </p>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Crop</label>
                <Select options={crops} value={crop} onChange={setCrop} />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Forecast month</label>
                <Select
                  options={forecasts}
                  value={forecasts.find((f) => f.value === selectedForecastMonth) ?? null}
                  onChange={(opt) => setSelectedForecastMonth(opt?.value ?? null)}
                />
              </div>
            </div>
          </div>

          {loading || forecastsLoading ? (
            <Spinners />
          ) : metricsError ? (
            <div className="dash-panel dash-metrics__empty border border-warning">
              <p className="fw-semibold mb-1">Could not load metrics from the API</p>
              <p className="text-secondary small mb-0">{metricsError}</p>
              <p className="text-secondary small mt-2 mb-0">
                Confirm HaFAS API is running at {Configuration.get_url_api_base()} and restart it after backend
                updates. Orphan <code>metric</code> rows pointing at deleted forecasts used to cause HTTP 500; the
                API should return JSON for this kebele id: <code>{String(kebeleId)}</code>.
              </p>
            </div>
          ) : !selectedForecastMonth || forecasts.length === 0 ? (
            <div className="dash-panel dash-metrics__empty">
              <p className="text-secondary mb-0">
                No forecast months for this crop (or still loading). Pick another crop or check{' '}
                <code>/forecast/&apos;cropId&apos;</code>.
              </p>
            </div>
          ) : metrics && metrics.length > 0 ? (
            <div className="row g-3">
              <div className="col-lg-6">
                <div className="dash-panel">
                  <h3 className="dash-panel__title">Fertilizer rate (NPS & Urea)</h3>
                  <ColumnChart data={metrics} type="Fertilizer rate" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="dash-panel">
                  <h3 className="dash-panel__title">Optimal yield</h3>
                  <ColumnChart data={metrics} type="Optimal yield" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="dash-panel">
                  <h3 className="dash-panel__title">ISFM (compost)</h3>
                  <ColumnChart data={metrics} type="Fertilizer rate (ISFM)" />
                </div>
              </div>
            </div>
          ) : (
            <div className="dash-panel dash-metrics__empty">
              <p className="text-secondary mb-2">
                No metric rows returned for this kebele and forecast month after filtering the{' '}
                <code>/metrics/{String(kebeleId)}</code> response by forecast id{' '}
                <code>{String(resolvedForecastId)}</code>.
              </p>
              <p className="text-secondary small mb-0">
                In MongoDB Compass or mongosh, count documents on collection <code>metric</code> with{' '}
                <code>adm4</code> equal to this kebele&apos;s ObjectId and <code>forecast</code> equal to the selected
                forecast ObjectId. See <code>docs/dashboard-metrics.md</code> for the <code>values</code> array shape (
                <code>s</code> = scenario step, <code>values</code> = numeric list).
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardMetrics;
