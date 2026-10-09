import { getApplicationConfig, storage } from '@msflib/core';

export function jwtExpiry(token: string): number | null {
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return null;
    const payload = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) ? payload.exp * 1000 : null;
  } catch { return null; }
}

export function rememberTokenExpiry(result: { access_token: string; expires?: string }) {
  const key = getApplicationConfig().accessTokenKey;
  const date = result.expires ? Date.parse(result.expires) : NaN;
  const expiresAt = Number.isFinite(date) ? date : jwtExpiry(result.access_token);
  if (expiresAt !== null) storage.setItem(`${key}_expiry`, JSON.stringify({ token: result.access_token, expiresAt }));
  else storage.removeItem(`${key}_expiry`);
  window.dispatchEvent(new Event('procureguard-auth-updated'));
}

export function getTokenExpiry(token: string): number | null {
  const jwt = jwtExpiry(token);
  try {
    const raw = storage.getItem(`${getApplicationConfig().accessTokenKey}_expiry`);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved?.token === token && typeof saved.expiresAt === 'number' && Number.isFinite(saved.expiresAt)) {
      return jwt === null ? saved.expiresAt : Math.min(jwt, saved.expiresAt);
    }
  } catch { /* Fall back to the JWT expiry when metadata is missing or invalid. */ }
  return jwt;
}
