/**
 * Human-readable label from Redux report location pairs.
 *
 * Formats (see Home.js / CountrySelection.js):
 * - country: [name, id]
 * - region, zone, woreda: [id, name, ext_id]
 * - kebele: [id, name, ext_id, aclimate_id]
 */
function isMongoId(value) {
  return typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
}

export function locationPairLabel(pair) {
  if (pair == null) return null;
  if (!Array.isArray(pair)) return String(pair);

  const [first, second] = pair;
  if (isMongoId(first)) {
    return second ?? first;
  }
  return first;
}

/** True when selected country is Ethiopia (by label or stored name strings). */
export function isEthiopiaCountry(pair, label) {
  if (label != null && /ethiopia/i.test(String(label))) return true;
  if (pair == null || !Array.isArray(pair)) return false;
  return pair.some((v) => typeof v === 'string' && /ethiopia/i.test(v));
}

export default locationPairLabel;
