// Simple auth storage using localStorage
const AUTH_STORAGE_KEY = 'usup_auth_session';
const AUTH_EXPIRY_MINUTES = 240; // 4 jam

function nowTs() { return Math.floor(Date.now() / 1000); }

export function setSession() {
  const token = crypto.getRandomValues(new Uint8Array(16));
  const tokenHex = Array.from(token).map(b => b.toString(16).padStart(2, '0')).join('');
  const payload = {
    token: tokenHex,
    ts: nowTs(),
    exp: nowTs() + AUTH_EXPIRY_MINUTES * 60
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function hasValidSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (typeof data.exp !== 'number') return false;
    return nowTs() < data.exp;
  } catch(e) {
    return false;
  }
}

export async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b => b.toString(16).padStart(2, '0')).join('');
}
