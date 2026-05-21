import { setReportInput } from '../slices/reportSlice';
import { saveCachedReportLocation } from '../services/locationCacheService';

/**
 * Persist advisory location to localStorage when the user updates Redux report state.
 */
export const locationCacheMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  if (action.type === setReportInput.type) {
    const { report } = store.getState();
    saveCachedReportLocation(report);
  }

  return result;
};
