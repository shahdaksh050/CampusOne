export function getApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
  const hasWindow = typeof window !== 'undefined';

  const normalizeAbsolute = (value) => value.replace(/\/+$/, '');

  const appendApiSuffix = (value) => {
    if (!/\/api(?:\/|$)/i.test(value)) {
      return `${value}/api`;
    }
    return value;
  };

  if (!raw) {
    return 'http://localhost:5000/api';
  }

  if (/^https?:\/\//i.test(raw)) {
    return normalizeAbsolute(appendApiSuffix(raw));
  }

  if (raw.startsWith('//')) {
    if (!hasWindow) return 'http://localhost:5000/api';
    return normalizeAbsolute(appendApiSuffix(`${window.location.protocol}${raw}`));
  }

  if (raw.startsWith(':')) {
    if (!hasWindow) return `http://localhost${appendApiSuffix(raw.startsWith(':/') ? raw.slice(1) : raw)}`;
    return normalizeAbsolute(
      appendApiSuffix(`${window.location.protocol}//${window.location.hostname}${raw}`)
    );
  }

  if (raw.startsWith('/')) {
    if (!hasWindow) return `http://localhost:5000${appendApiSuffix(raw)}`;
    return normalizeAbsolute(appendApiSuffix(`${window.location.origin}${raw}`));
  }

  // Fallback: treat as relative path segment (e.g., "api" or "backend/api")
  if (!hasWindow) return normalizeAbsolute(appendApiSuffix(`http://localhost:5000/${raw}`));
  return normalizeAbsolute(appendApiSuffix(`${window.location.origin}/${raw}`));
}

export const API_BASE_URL = getApiBaseUrl();
