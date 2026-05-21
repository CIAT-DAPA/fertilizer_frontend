import { configureStore } from '@reduxjs/toolkit';
import report from '../../slices/reportSlice';
import auth from '../../slices/authSlice';
import { preferencesSyncMiddleware } from '../../middleware/preferencesSyncMiddleware';

export default configureStore({
  reducer: {
    report,
    auth,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(preferencesSyncMiddleware),
});
