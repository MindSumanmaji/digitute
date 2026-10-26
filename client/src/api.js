// ==============================================================================
// DIGITUTE CENTRALIZED API CLIENT & MOBILE-GRADE JWT SESSION MANAGER
// Handles dynamic endpoints, automatic token injection, concurrency-safe
// silent JWT refresh token retries, and session persistence.
// ==============================================================================

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Returns the fully qualified API endpoint URL.
 */
export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

/**
 * Token accessor helpers
 */
export const getAuthToken = () => {
  try {
    return localStorage.getItem('digitute_token');
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem('digitute_refresh_token');
  } catch {
    return null;
  }
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('digitute_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Persist authenticated session
 */
export const setAuthSession = ({ access_token, refresh_token, user }) => {
  try {
    if (access_token) {
      localStorage.setItem('digitute_token', access_token);
    }
    if (refresh_token) {
      localStorage.setItem('digitute_refresh_token', refresh_token);
    }
    if (user) {
      localStorage.setItem('digitute_user', JSON.stringify(user));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('digitute:auth-updated', { detail: { user } }));
    }
  } catch (e) {
    console.warn('Storage set notice:', e);
  }
};

/**
 * Clear session. Only notifies UI of expiration if notifyExpired is explicitly true.
 */
export const clearAuthSession = (notifyExpired = false) => {
  try {
    localStorage.removeItem('digitute_token');
    localStorage.removeItem('digitute_refresh_token');
    localStorage.removeItem('digitute_user');
    localStorage.setItem('digitute_active_view', 'landing');
    if (notifyExpired && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('digitute:auth-expired'));
    }
  } catch (e) {
    console.warn('Storage clear notice:', e);
  }
};

// Concurrency-safe refresh promise singleton
let refreshPromise = null;

/**
 * Refresh current JWT session using the stored refresh token.
 * Prevents multiple simultaneous refresh requests when parallel API calls fail.
 */
export const refreshAuthSession = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    throw new Error('No refresh token available');
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(getApiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.access_token) {
        clearAuthSession();
        throw new Error(data?.detail || 'Session expired. Please sign in again.');
      }

      setAuthSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      });

      return data.access_token;
    } catch (err) {
      clearAuthSession();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Proactively validate token or refresh session upon app boot
 */
export const validateOrRefreshSession = async () => {
  const token = getAuthToken();
  const refreshToken = getRefreshToken();

  if (!token && !refreshToken) {
    return null;
  }

  try {
    const res = await apiRequest('/api/auth/me');
    if (res?.user) return res.user;
  } catch {
    // apiRequest automatically tried silent refresh if token was expired
  }

  return null;
};

/**
 * Safely extracts a concise, human-readable error message from diverse API error payloads:
 * - FastAPI / Pydantic validation errors where `detail` is an array of error objects
 * - FastAPI HTTPException string or object details
 * - Standard JSON message / error fields
 * - Network / TypeError exceptions
 * - HTTP status code fallbacks
 */
export const formatApiErrorMessage = (data, status = null) => {
  if (!data) {
    return status ? `Request failed with status ${status}` : 'Unknown error occurred';
  }

  // Handle Error instances (e.g. network errors or caught exceptions)
  if (data instanceof Error || (typeof data === 'object' && typeof data.message === 'string')) {
    if (data.data) {
      return formatApiErrorMessage(data.data, data.status || status);
    }
    const msg = data.message;
    if (msg && !msg.includes('[object Object]')) {
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return 'Network error: Unable to reach the server. Please check your connection or server status.';
      }
      return msg.trim();
    }
  }

  // Direct string payload
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed && !trimmed.includes('[object Object]')) return trimmed;
  }

  // FastAPI validation errors: `detail` is an array of error objects
  if (Array.isArray(data.detail)) {
    const errorItems = data.detail.map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const field = Array.isArray(item.loc)
          ? item.loc.filter((loc) => loc !== 'body').join('.')
          : item.loc || '';
        const msg = item.msg || item.message || '';
        if (field && msg) {
          return `${field}: ${msg}`;
        }
        return msg || field || JSON.stringify(item);
      }
      return String(item);
    }).filter(Boolean);

    if (errorItems.length > 0) {
      return errorItems.join('; ');
    }
  }

  // Detail is a string
  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail.trim();
  }

  // Detail is a nested object
  if (data.detail && typeof data.detail === 'object') {
    const inner = data.detail.message || data.detail.error || data.detail.msg || data.detail.detail;
    if (typeof inner === 'string' && inner.trim()) {
      return inner.trim();
    }
    try {
      return JSON.stringify(data.detail);
    } catch {
      // ignore
    }
  }

  // Common message or error keys at root
  const candidate = data.message || data.error_description || data.error || data.msg;
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }
  if (candidate && typeof candidate === 'object') {
    const innerMsg = candidate.message || candidate.error || candidate.msg;
    if (typeof innerMsg === 'string' && innerMsg.trim()) {
      return innerMsg.trim();
    }
    try {
      return JSON.stringify(candidate);
    } catch {
      // ignore
    }
  }

  return status ? `Request failed with status ${status}` : 'Unexpected server error';
};

/**
 * Enterprise standard fetch wrapper with Mobile-Grade JWT Auto-Refresh:
 * - Automatically injects JWT Bearer token
 * - Intercepts 401 Unauthorized errors
 * - Automatically uses refresh_token to obtain a new access_token
 * - Retries the failed request seamlessly without user disruption
 */
export const apiRequest = async (endpoint, options = {}, isRetry = false) => {
  const url = getApiUrl(endpoint);
  const token = getAuthToken();

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isAuthEndpoint = endpoint.includes('/api/auth/login') || endpoint.includes('/api/auth/refresh');

  // If 401 Unauthorized on a protected route, attempt silent refresh like a mobile app
  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const newAccessToken = await refreshAuthSession();

        // Retry the original request with the fresh token
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newAccessToken}`,
        };

        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        const retryData = await retryResponse.json().catch(() => null);

        if (!retryResponse.ok) {
          const errorMsg = formatApiErrorMessage(retryData, retryResponse.status);
          const error = new Error(errorMsg);
          error.status = retryResponse.status;
          error.data = retryData;
          throw error;
        }

        return retryData;
      } catch {
        throw new Error('Your session has expired. Please sign in again.');
      }
    } else {
      clearAuthSession();
      throw new Error('Authentication required. Please sign in.');
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = formatApiErrorMessage(data, response.status);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
