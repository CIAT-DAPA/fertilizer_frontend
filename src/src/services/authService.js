import axios from 'axios';
import Configuration from '../conf/Configuration';

const TOKEN_KEY = 'hafas_auth_token';

const authApi = axios.create({
  baseURL: Configuration.get_url_api_base(),
  headers: { 'Content-Type': 'application/json' },
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function register({ email, password, fullName }) {
  const { data } = await authApi.post('auth/register', {
    email,
    password,
    full_name: fullName,
  });
  setStoredToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const { data } = await authApi.post('auth/login', { email, password });
  setStoredToken(data.token);
  return data;
}

export async function fetchMe() {
  const { data } = await authApi.get('auth/me');
  return data;
}

export async function savePreferences(location) {
  const { data } = await authApi.put('auth/preferences', { location });
  return data;
}

export async function fetchPreferences() {
  const { data } = await authApi.get('auth/preferences');
  return data.location;
}

export function logout() {
  setStoredToken(null);
}

export default authApi;
