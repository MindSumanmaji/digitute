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
          const errorMsg = retryData?.detail || retryData?.message || `Request failed with status ${retryResponse.status}`;
          throw new Error(errorMsg);
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
    const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};
