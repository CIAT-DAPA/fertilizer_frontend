import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  registerUser,
  clearAuthError,
  applySavedLocation,
} from '../../slices/authSlice';
import './Login.css';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [mode, dispatch]);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (user.location) applySavedLocation(dispatch, user.location);
      navigate('/');
    }
  }, [status, user, dispatch, navigate]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      dispatch(loginUser({ email, password }));
    } else {
      dispatch(registerUser({ email, password, fullName }));
    }
  };

  return (
    <div className="auth-page">
      
        <div className="auth-card__header">
          <span className="auth-card__logo">
            <i className="bi bi-flower1" />
          </span>
          <h1>HaFAS Account</h1>
          <p>Sign in to save your country, region, zone, woreda & kebele in the database.</p>
        

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        

        <form onSubmit={onSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="mb-3">
              <label className="form-label">Full name</label>
              <input
                type="text"
                className="form-control"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            
          )}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          

          {error && {error}}

          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={status === 'loading'}
          >
            {status === 'loading'
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="auth-footer text-center mt-3 mb-0">
          <Link to="/">Continue without account</Link>
        </p>
      
    
  );
}

export default Login;

