import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../services/authService';
import { setReportInput } from './reportSlice';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authService.login({ email, password });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, fullName }, { rejectWithValue }) => {
    try {
      const data = await authService.register({ email, password, fullName });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    const token = authService.getStoredToken();
    if (!token) return rejectWithValue('no_token');
    try {
      const user = await authService.fetchMe();
      return { user, token };
    } catch (err) {
      authService.logout();
      return rejectWithValue('session_expired');
    }
  }
);

export const saveUserPreferences = createAsyncThunk(
  'auth/savePreferences',
  async (location, { rejectWithValue }) => {
    try {
      const data = await authService.savePreferences(location);
      return data.location;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not save preferences');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: authService.getStoredToken(),
    status: 'idle',
    error: null,
    preferencesStatus: 'idle',
    preferencesError: null,
  },
  reducers: {
    logout: (state) => {
      authService.logout();
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const onAuthPending = (state) => {
      state.status = 'loading';
      state.error = null;
    };
    const onAuthFulfilled = (state, action) => {
      state.status = 'authenticated';
      state.user = action.payload.user;
      state.token = action.payload.token;
    };
    const onAuthRejected = (state, action) => {
      if (action.payload === 'no_token' || action.payload === 'session_expired') {
        state.status = 'anonymous';
        state.user = null;
        state.token = null;
        return;
      }
      state.status = 'anonymous';
      state.error = action.payload;
    };

    builder
      .addCase(loginUser.pending, onAuthPending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, onAuthRejected)
      .addCase(registerUser.pending, onAuthPending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, onAuthRejected)
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        if (action.payload === 'no_token') {
          state.status = 'anonymous';
        } else {
          state.status = 'anonymous';
          state.user = null;
          state.token = null;
        }
      })
      .addCase(saveUserPreferences.pending, (state) => {
        state.preferencesStatus = 'saving';
        state.preferencesError = null;
      })
      .addCase(saveUserPreferences.fulfilled, (state, action) => {
        state.preferencesStatus = 'saved';
        if (state.user) state.user.location = action.payload;
      })
      .addCase(saveUserPreferences.rejected, (state, action) => {
        state.preferencesStatus = 'error';
        state.preferencesError = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

/** Apply saved DB location into report slice after login/restore */
export function applySavedLocation(dispatch, location) {
  if (!location) return;
  dispatch(
    setReportInput({
      formValues: {
        country: location.country ?? null,
        type: location.type ?? null,
        region: location.region ?? null,
        zone: location.zone ?? null,
        woreda: location.woreda ?? null,
        kebele: location.kebele ?? null,
        ad_fertilizer: location.ad_fertilizer ?? null,
        ad_aclimate: location.ad_aclimate ?? null,
        ad_risk: location.ad_risk ?? null,
        ad_optimal: location.ad_optimal ?? null,
      },
    })
  );
}
