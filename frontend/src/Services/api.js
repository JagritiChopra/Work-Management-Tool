import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. http://localhost:5002/api/v1
  withCredentials: true,                  // needed for cookie-based auth
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Public routes that should never trigger a /login redirect
const PUBLIC_PATHS = /^\/(login|register|forgot-password|reset-password|verify-email)/;

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // FIX #4: response is wrapped — use data.data.accessToken
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');

        // FIX #1: only redirect if NOT already on a public page
        // (prevents the infinite reload loop on /login and /register)
        if (!PUBLIC_PATHS.test(window.location.pathname)) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;