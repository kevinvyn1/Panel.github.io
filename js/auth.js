// /js/auth.js (ES Module)
// Client-side auth demo (situs statis). Proteksi ini mudah dibypass di devtools.
// Gunakan solusi server-side untuk keamanan produksi.

const AUTH_STORAGE_KEY = 'auth';
const LOGIN_PAGE = 'index.html'; // asumsi login page ada di folder yang sama

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  const data = readAuth();
  if (!data) return false;
  const { token, exp } = data;
  if (!token || !exp) return false;
  return Date.now() < exp;
}

function redirectToLogin() {
  const next = encodeURIComponent(location.href); // arahkan balik ke URL penuh
  location.replace(`${LOGIN_PAGE}?next=${next}`);
}

export function requireAuth({ checkEveryMs = 5 * 60 * 1000 } = {}) {
  if (!isLoggedIn()) {
    redirectToLogin();
    return false;
  }
  // cek ulang tiap 5 menit
  const t = setInterval(() => {
    if (!isLoggedIn()) redirectToLogin();
  }, checkEveryMs);

  // sinkronisasi antar-tab
  window.addEventListener('storage', (e) => {
    if (e.key === AUTH_STORAGE_KEY && !isLoggedIn()) redirectToLogin();
  });

  window.addEventListener('beforeunload', () => clearInterval(t));
  return true;
}

export function login({ token, ttlMs = 30 * 60 * 1000 } = {}) {
  const exp = Date.now() + ttlMs; // default 30 menit
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, exp }));
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}