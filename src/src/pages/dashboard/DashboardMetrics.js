import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import Configuration from '../../conf/Configuration';
import DashboardPageHeader from '../../components/dashboard/DashboardPageHeader';
import ColumnChart from '../../components/chart/ColumnChart';
import Spinners from '../../components/loading/Spinners';
import { locationPairLabel } from '../../components/dashboard/locationPairLabel';
import './DashboardMetrics.css';

function DashboardMetrics() {
  const report = useSelector((state) => state.report);
  const kebeleId = report.kebele?.[0];

  const [crops, setCrops] = useState([]);
  const [crop, setCrop] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [forecastDate, setForecastDate] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(Configuration.get_url_api_base() + 'crops').then((res) => {
      const opts = res.data.map((c) => ({ label: c.name, value: c.id }));
      setCrops(opts);
      if (opts.length) setCrop(opts[0]);
    });
  }, []);

  useEffect(() => {
    if (!crop?.value) return;
    axios.get(Configuration.get_url_api_base() + 'forecast/' + crop.value).then((res) => {
      const opts = res.data.map((f) => ({
        label: f.date,
        value: f.date,
        id: f.id,
      }));
      setForecasts(opts);
      if (opts.length) setForecastDate(opts[opts.length - 1]);
    });
  }, [crop]);

  useEffect(() => {
    if (!kebeleId || !forecastDate?.id) {
      setMetrics(null);
      return;
    }
    setLoading(true);
    axios
      .get(Configuration.get_url_api_base() + 'metrics/' + kebeleId)
      .then((res) => {
        setMetrics(res.data.filter((m) => m.forecast === forecastDate.id));
      })
      .catch(() => setMetrics([]))
      .finally(() => setLoading(false));
  }, [kebeleId, forecastDate]);

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
                <Select options={forecasts} value={forecastDate} onChange={setForecastDate} />
              </div>
            </div>
          </div>

          {loading ? (
            <Spinners />
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
              <p className="text-secondary mb-0">
                No metrics for this kebele and forecast. Run the MongoDB import notebook and ensure
                forecast months match imported data.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardMetrics;
