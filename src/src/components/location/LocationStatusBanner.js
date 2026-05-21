import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  formatSavedLocationLabel,
  getLocationSelectionPath,
  isReportLocationComplete,
} from '../../utils/reportLocationUtils';
import './LocationStatusBanner.css';

function LocationStatusBanner({ variant = 'landing' }) {
  const report = useSelector((state) => state.report);
  const hasSavedLocation = isReportLocationComplete(report);
  const savedLocationLabel = formatSavedLocationLabel(report);
  const locationSelectionPath = getLocationSelectionPath(report);

  if (hasSavedLocation) {
    return (
      <section
        className="location-status location-status--set"
        role="status"
        aria-live="polite"
      >
        <i className="bi bi-check-circle-fill" aria-hidden="true" />
        <p>
          You have already selected your location
          {savedLocationLabel ? ` (${savedLocationLabel})` : ''}. You can go to the{' '}
          <Link to="/dashboard">Dashboard</Link>, or if you need a different location, select it
          below.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`location-status location-status--prompt${variant === 'dashboard' ? ' location-status--dashboard' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="location-status__text">
        <i className="bi bi-geo-alt" aria-hidden="true" />
        <div>
          {variant === 'landing' ? (
            <p>
              Please set your country, region, zone, woreda &amp; kebele below or{' '}
              <Link to={locationSelectionPath}>set it here</Link>.
            </p>
          ) : (
            <p>Please set your country, region, zone, woreda &amp; kebele.</p>
          )}
        </div>
      </div>
      {variant === 'dashboard' && (
        <Link to={locationSelectionPath} className="location-status__action">
          Set location
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

export default LocationStatusBanner;
