import { login, getSession } from './auth.js';

const form = document.getElementById('login-form');
const passwordEl = document.getElementById('password');
const stateEl = document.getElementById('login-state');

// Kalau sudah login, langsung lempar ke admin
const s = getSession();
if (s) {
  const params = new URLSearchParams(location.search);
  const next = params.get('next') || 'admin.html';
  location.replace(next);
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  stateEl.textContent = 'Memeriksa…';
  try {
    await login({ password: passwordEl.value });
    stateEl.textContent = 'Berhasil login. Mengalihkan…';
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || 'admin.html';
    location.replace(next);
  } catch (err) {
    console.error(err);
    stateEl.textContent = err?.message || 'Gagal login';
  }
});
