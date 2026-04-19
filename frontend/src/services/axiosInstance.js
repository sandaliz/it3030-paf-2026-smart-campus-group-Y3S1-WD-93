import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const normalizeUrl = (baseURL, requestUrl) => {
  if (!requestUrl || !baseURL) {
    return requestUrl;
  }

  const normalizedBase = baseURL.replace(/\/+$/, '');
  const normalizedRequest = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`;

  // Avoid `/api/api/...` when the base URL already includes the API prefix.
  if (normalizedBase.endsWith('/api') && normalizedRequest.startsWith('/api/')) {
    return normalizedRequest.slice(4);
  }

  return normalizedRequest;
};

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
apiInstance.interceptors.request.use(
  (config) => {
    config.url = normalizeUrl(config.baseURL, config.url);

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      console.error('Unauthorized access - redirecting to login');
      // Standardize key here as well if needed
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiInstance;
