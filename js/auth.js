import { CONFIG } from './config.js';

const STORE_KEY = 'session.v1';

function now() { return Date.now(); }
function ttlMs(days) { return days * 24 * 60 * 60 * 1000; }

export function getSession() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.token || !s.exp) return null;
    if (s.exp < now()) { localStorage.removeItem(STORE_KEY); return null; }
    return s;
  } catch (e) {
    console.warn('getSession error', e);
    return null;
  }
}

export function setSession(token, ttlDays = CONFIG.SESSION_TTL_DAYS) {
  const exp = now() + ttlMs(ttlDays);
  localStorage.setItem(STORE_KEY, JSON.stringify({ token, exp }));
}

export function clearSession() {
  localStorage.removeItem(STORE_KEY);
}

export function requireAuth() {
  const s = getSession();
  if (!s) {
    const next = encodeURIComponent(location.pathname.replace(/\/+/g,'/'));
    location.replace(`index.html?next=${next}`);
    throw new Error('Unauthenticated');
  }
}

export function logout() {
  clearSession();
  const next = encodeURIComponent(location.pathname.replace(/\/+/g,'/'));
  location.replace(`index.html?next=${next}`);
}

export async function login({ password }) {
  // Password bisa diganti via localStorage.ADMIN_PASS
  const PASS = localStorage.getItem('ADMIN_PASS') || CONFIG.ADMIN_PASS;
  await new Promise(r => setTimeout(r, 200)); // sedikit delay UX
  if (password === PASS) {
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    setSession(token);
    return true;
  }
  throw new Error('Password salah');
}
