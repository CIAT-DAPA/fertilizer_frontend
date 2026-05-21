import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreSession, applySavedLocation } from '../../slices/authSlice';

/**
 * Restores JWT session on app load and hydrates Redux report from MongoDB.
 */
function AuthBootstrap({ children }) {
  const dispatch = useDispatch();
  const authStatus = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (authStatus === 'idle') {
      dispatch(restoreSession()).then((result) => {
        if (restoreSession.fulfilled.match(result) && result.payload?.user?.location) {
          applySavedLocation(dispatch, result.payload.user.location);
        }
      });
    }
  }, [dispatch, authStatus]);

  return children;
}

export default AuthBootstrap;
