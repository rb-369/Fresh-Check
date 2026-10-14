/**
 * FreshCheck API Configuration & Client
 * =====================================
 * Handles connecting the frontend (local or deployed on Vercel) to the
 * backend FastAPI / ML inference service.
 *
 * Supports:
 *  1. User manual override via UI (stored in localStorage)
 *  2. Environment variable (VITE_API_BASE_URL) set in Vercel
 *  3. Fallback to relative URLs for local Vite dev proxy
 */

const STORAGE_KEY = 'freshcheck_backend_url';
export const BACKEND_URL_CHANGED_EVENT = 'freshcheck:backend-url-changed';

/**
 * Returns the currently active Backend Base URL (stripped of trailing slashes).
 * Priority:
 *  1. localStorage override
 *  2. import.meta.env.VITE_API_BASE_URL
 *  3. empty string (relative URL)
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return '';
}

/**
 * Saves a new backend URL override to localStorage and fires a change event.
 * Pass empty string or null to reset back to environment default.
 */
export function setApiBaseUrl(url) {
  if (typeof window === 'undefined') return;

  const cleaned = (url || '').trim().replace(/\/+$/, '');
  if (cleaned) {
    localStorage.setItem(STORAGE_KEY, cleaned);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Notify components that the backend URL changed
  window.dispatchEvent(
    new CustomEvent(BACKEND_URL_CHANGED_EVENT, { detail: { url: cleaned } })
  );
}

/**
 * Formats a relative path into a full URL using the active Backend Base URL.
 */
export function getApiUrl(path) {
  if (!path) return '';
  // If it's already an absolute http/https/blob/data URL, return as is
  if (/^(https?:|blob:|data:)/i.test(path)) {
    return path;
  }

  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Wrapper for standard fetch that:
 *  - Resolves target path against active Backend URL
 *  - Injects 'ngrok-skip-browser-warning' header to bypass ngrok free tier warning pages
 *  - Normalizes headers
 */
export async function apiFetch(path, options = {}) {
  const url = getApiUrl(path);
  const headers = new Headers(options.headers || {});

  // ngrok free tier displays an HTML interstitial unless this header is present
  if (!headers.has('ngrok-skip-browser-warning')) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }

  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Pings the /api/health probe of the backend.
 * Returns { ok: boolean, data?: object, error?: string }
 */
export async function checkBackendHealth(targetBaseUrl = null) {
  try {
    const base =
      targetBaseUrl !== null
        ? targetBaseUrl.trim().replace(/\/+$/, '')
        : getApiBaseUrl();

    const targetUrl = base ? `${base}/api/health` : '/api/health';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        ok: false,
        error: `Server returned HTTP ${res.status} (${res.statusText || 'Error'})`
      };
    }

    const data = await res.json();
    if (data.status === 'online') {
      return { ok: true, data };
    }

    return {
      ok: false,
      error: `Unexpected response from server: ${JSON.stringify(data)}`
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { ok: false, error: 'Connection timed out (7 seconds).' };
    }
    return {
      ok: false,
      error: err.message || 'Network request failed. Is the backend and tunnel running?'
    };
  }
}
