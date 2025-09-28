// Login page logic
import { setSession } from '../auth/auth.js';

const form = document.querySelector('#login-form');
const emailEl = document.querySelector('#email');
const passEl = document.querySelector('#password');
const errEl  = document.querySelector('#login-error');

async function fakeVerify(email, password) {
  // Ganti dengan verifikasi nyata jika dibutuhkan: Apps Script, Supabase, dsb.
  // Untuk dev, minimal panjang password 4.
  await new Promise(r => setTimeout(r, 300));
  return typeof password === 'string' && password.length >= 4 && String(email).includes('@');
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.hidden = true;
  const email = String(emailEl.value || '').trim();
  const pwd   = String(passEl.value || '').trim();
  const ok = await fakeVerify(email, pwd);
  if (!ok) {
    errEl.hidden = false;
    return;
  }
  setSession({ user: email }, 180);
  location.href = 'admin.html';
});
