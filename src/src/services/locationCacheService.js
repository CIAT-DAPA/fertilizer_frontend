const CACHE_KEY = 'hafas_report_location';

const REPORT_FIELDS = [
  'country',
  'type',
  'region',
  'zone',
  'woreda',
  'kebele',
  'ad_fertilizer',
  'ad_aclimate',
  'ad_risk',
  'ad_optimal',
];

export function loadCachedReportLocation() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const state = {};
    for (const key of REPORT_FIELDS) {
      if (parsed[key] !== undefined) state[key] = parsed[key];
    }
    return Object.keys(state).length ? state : null;
  } catch {
    return null;
  }
}

export function saveCachedReportLocation(report) {
  if (!report) return;
  try {
    const payload = {};
    for (const key of REPORT_FIELDS) {
      if (report[key] !== undefined) payload[key] = report[key];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearCachedReportLocation() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function getInitialReportPreloadedState() {
  const cached = loadCachedReportLocation();
  if (!cached) return undefined;
  return { report: cached };
}
