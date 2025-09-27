const AUTH_STORAGE_KEY = 'usup_auth_session';
const AUTH_EXPIRY_MINUTES = 240;

function nowTs() { return Math.floor(Date.now() / 1000); }

export function setSession() {
  const token = crypto.getRandomValues(new Uint8Array(16));
  const tokenHex = Array.from(token).map(b => b.toString(16).padStart(2, '0')).join('');
  const payload = { token: tokenHex, ts: nowTs(), exp: nowTs() + AUTH_EXPIRY_MINUTES * 60 };
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
    return nowTs() < data.exp;
  } catch(e) {
    return false;
  }
}
