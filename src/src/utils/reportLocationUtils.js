import { locationPairLabel } from '../components/dashboard/locationPairLabel';
import { getDefaultEthiopiaCountryId } from '../services/countryApiService';

/** Default country for location selection (HaFAS Ethiopia). */
export const DEFAULT_COUNTRY_NAME = 'Ethiopia';
/** Resolved from active API; override via REACT_APP_DEFAULT_COUNTRY_ID for local Mongo. */
export const DEFAULT_COUNTRY_ID = getDefaultEthiopiaCountryId();

/**
 * Comma-separated location summary for display (country → kebele).
 */
export function formatSavedLocationLabel(report) {
  if (!report) return '';

  const parts = [
    locationPairLabel(report.country),
    locationPairLabel(report.region),
    locationPairLabel(report.zone),
    locationPairLabel(report.woreda),
  ];

  if (report.type !== 'woreda') {
    const kebele = locationPairLabel(report.kebele);
    if (kebele) parts.push(kebele);
  }

  return parts.filter(Boolean).join(', ');
}

/** Route to the region / zone / woreda / kebele selection page (Home). */
export function getLocationSelectionPath(report) {
  if (report?.country) {
    const [name, id] = report.country;
    return `/country_selected/${encodeURIComponent(name)}/${id}`;
  }
  // Default Ethiopia path (production API id; override via REACT_APP_DEFAULT_COUNTRY_ID for local).
  return `/country_selected/${encodeURIComponent(DEFAULT_COUNTRY_NAME)}/${DEFAULT_COUNTRY_ID}`;
}

/** Resolve dashboard quick-link / nav paths (location picker, report, static routes). */
export function resolveDashboardLinkPath(item, report, reportPath) {
  if (item?.dynamicLocation) return getLocationSelectionPath(report);
  if (item?.dynamicReport && reportPath) return reportPath;
  return item?.path ?? item?.to ?? '/';
}

/**
 * Whether the user has a complete advisory location in Redux (report slice).
 * Mirrors completion rules in Home.js / DashboardHomeModern.
 */
export function isReportLocationComplete(report) {
  if (!report?.country) return false;
  if (!report.region || !report.zone || !report.woreda) return false;
  if (report.type === 'woreda') return true;
  return !!report.kebele;
}

export default isReportLocationComplete;
