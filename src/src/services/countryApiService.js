import axios from 'axios';
import Configuration from '../conf/Configuration';

/** Legacy Ethiopia id from local MongoDB (localhost:5000). */
export const LEGACY_LOCAL_ETHIOPIA_ID = '6a09cb20197e7cc3a221b342';

/** Ethiopia id on deployed NextGen API (https://webapi.nextgenagroadvisory.com/). */
export const PRODUCTION_ETHIOPIA_ID = '6499e7df9b53ecd65bbcf67e';

let countriesCache = null;

export async function fetchCountries() {
  if (countriesCache) return countriesCache;
  const response = await axios.get(`${Configuration.get_url_api_base()}country`);
  countriesCache = Array.isArray(response.data) ? response.data : [];
  return countriesCache;
}

export function clearCountriesCache() {
  countriesCache = null;
}

/**
 * Resolve a country record from API by Mongo id, display name, or ISO2.
 */
export function matchCountryRecord(countries, { id, name, iso2 } = {}) {
  if (!countries?.length) return null;
  if (id) {
    const byId = countries.find((c) => String(c.id) === String(id));
    if (byId) return byId;
  }
  if (name) {
    const byName = countries.find((c) => c.name === name);
    if (byName) return byName;
  }
  if (iso2) {
    const byIso = countries.find((c) => c.iso2 === iso2);
    if (byIso) return byIso;
  }
  return null;
}

/** Default Ethiopia id for the currently configured API (env override, then production). */
export function getDefaultEthiopiaCountryId() {
  return process.env.REACT_APP_DEFAULT_COUNTRY_ID || PRODUCTION_ETHIOPIA_ID;
}

/**
 * Normalize [name, id] country tuple so the id exists on the active API.
 * Clears admin levels when the country id changes (ids differ across DB instances).
 */
export function normalizeCountryTuple(countries, countryTuple) {
  if (!countryTuple || !countries?.length) return countryTuple;

  const [name, id] = countryTuple;
  const match =
    matchCountryRecord(countries, { id, name }) ||
    matchCountryRecord(countries, { name: 'Ethiopia', iso2: 'ET' });

  if (!match) return countryTuple;

  const normalized = [match.name, match.id];
  if (String(normalized[1]) === String(id)) return countryTuple;

  return normalized;
}

/**
 * Migrate cached report location: fix legacy local Ethiopia id and drop stale admin ids.
 */
export function migrateCachedReportLocation(cached) {
  if (!cached?.country) return cached;

  const [, id] = cached.country;
  const needsCountryFix =
    id === LEGACY_LOCAL_ETHIOPIA_ID || id === LEGACY_LOCAL_ETHIOPIA_ID.toString();

  if (!needsCountryFix) return cached;

  return {
    ...cached,
    country: [cached.country[0] || 'Ethiopia', getDefaultEthiopiaCountryId()],
    region: null,
    zone: null,
    woreda: null,
    kebele: null,
  };
}
