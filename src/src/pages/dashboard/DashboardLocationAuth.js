import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPageHeader from '../../components/dashboard/DashboardPageHeader';
import { locationPairLabel } from '../../components/dashboard/locationPairLabel';
import { saveUserPreferences } from '../../slices/authSlice';
import './DashboardLocation.css';

function Row({ label, value }) {
  return (
    <div className="dash-loc-row">
      <span className="dash-loc-row__label">{label}</span>
      <span className="dash-loc-row__value">{value || '—'}</span>
    </div>
  );
}

function DashboardLocationAuth() {
  const dispatch = useDispatch();
  const report = useSelector((state) => state.report);
  const { status, preferencesStatus, preferencesError } = useSelector((state) => state.auth);
  const country = report.country;
  const openPath = country
    ? `/country_selected/${country[0]}/${country[1]}`
    : '/';

  const saveNow = () => {
    dispatch(
      saveUserPreferences({
        country: report.country,
        type: report.type,
        region: report.region,
        zone: report.zone,
        woreda: report.woreda,
        kebele: report.kebele,
        ad_fertilizer: report.ad_fertilizer,
        ad_aclimate: report.ad_aclimate,
        ad_risk: report.ad_risk,
        ad_optimal: report.ad_optimal,
      })
    );
  };

  return (
    <div className="dash-page dash-location">
      <DashboardPageHeader
        title="Selected location"
        subtitle={
          status === 'authenticated'
            ? 'Synced to your account in MongoDB when you change location (auto-save) or use Save now.'
            : 'Sign in to persist this selection to the database.'
        }
        actions={
          <>
            <Link className="btn btn-outline-secondary btn-sm" to={openPath}>
              <i className="bi bi-pencil-square me-1" /> Edit location
            </Link>
            {status === 'authenticated' ? (
              <button type="button" className="btn btn-success btn-sm" onClick={saveNow}>
                <i className="bi bi-cloud-upload me-1" />
                {preferencesStatus === 'saving' ? 'Saving…' : 'Save to account'}
              </button>
            ) : (
              <Link className="btn btn-success btn-sm" to="/login">
                Sign in to save
              </Link>
            )}
          </>
        }
      />

      {preferencesError && (
        <div className="alert alert-warning py-2 mb-3">{preferencesError}</div>
      )}

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="dash-panel">
            <h3 className="dash-panel__title">Hierarchy</h3>
            <Row label="Country" value={locationPairLabel(report.country)} />
            <Row label="Report type" value={report.type} />
            <Row label="Region" value={locationPairLabel(report.region)} />
            <Row label="Zone" value={locationPairLabel(report.zone)} />
            <Row label="Woreda" value={locationPairLabel(report.woreda)} />
            <Row label="Kebele" value={locationPairLabel(report.kebele)} />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="dash-panel">
            <h3 className="dash-panel__title">Advisory layers enabled</h3>
            <ul className="dash-check-list">
              <li className={report.ad_fertilizer ? 'on' : ''}>Fertilizer advisory</li>
              <li className={report.ad_optimal ? 'on' : ''}>Optimal yield</li>
              <li className={report.ad_risk ? 'on' : ''}>Risk</li>
              <li className={report.ad_aclimate ? 'on' : ''}>Aclimate</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLocationAuth;
