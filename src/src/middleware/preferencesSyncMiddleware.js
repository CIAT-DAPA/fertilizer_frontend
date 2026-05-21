import { setReportInput } from '../slices/reportSlice';
import { saveUserPreferences } from '../slices/authSlice';

let syncTimer = null;

/**
 * When a logged-in user updates location in Redux, persist to MongoDB (debounced).
 */
export const preferencesSyncMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  if (action.type === setReportInput.type) {
    const { auth, report } = store.getState();
    if (auth.status === 'authenticated' && auth.token) {
      const formValues = action.payload?.formValues ?? {};
      const location = {
        country: formValues.country ?? report.country,
        type: formValues.type ?? report.type,
        region: formValues.region ?? report.region,
        zone: formValues.zone ?? report.zone,
        woreda: formValues.woreda ?? report.woreda,
        kebele: formValues.kebele ?? report.kebele,
        ad_fertilizer: formValues.ad_fertilizer ?? report.ad_fertilizer,
        ad_aclimate: formValues.ad_aclimate ?? report.ad_aclimate,
        ad_risk: formValues.ad_risk ?? report.ad_risk,
        ad_optimal: formValues.ad_optimal ?? report.ad_optimal,
      };

      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        store.dispatch(saveUserPreferences(location));
      }, 800);
    }
  }

  return result;
};
