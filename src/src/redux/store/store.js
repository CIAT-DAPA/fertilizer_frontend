import { configureStore } from '@reduxjs/toolkit';
import report from '../../slices/reportSlice';
import { getInitialReportPreloadedState } from '../../services/locationCacheService';
import { locationCacheMiddleware } from '../../middleware/locationCacheMiddleware';

export default configureStore({
  reducer: {
    report,
  },
  preloadedState: getInitialReportPreloadedState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(locationCacheMiddleware),
});