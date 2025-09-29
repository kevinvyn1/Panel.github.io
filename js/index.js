import * as CFG from './config.js';
import * as Auth from './auth.js';

const form = document.getElementById('login-form');
const passwordEl = document.getElementById('password');
const stateEl = document.getElementById('login-state');
const captchaArea = document.getElementById('captcha-area');

// If already logged in, redirect
try {
  const s = Auth.getSession ? Auth.getSession() : null;
  if (s) {
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || 'admin.html';
    location.replace(next);
  }
} catch {}

let captchaToken = null;
// hCaptcha (optional)
if (CFG.CAPTCHA_PROVIDER && String(CFG.CAPTCHA_PROVIDER).toLowerCase() === 'hcaptcha') {
  captchaArea.style.display = '';
  captchaArea.innerHTML = `<label><span>Verifikasi</span><div class="h-captcha" data-sitekey="${CFG.CAPTCHA_SITE_KEY}"></div></label>`;
  const sc = document.createElement('script');
  sc.src = 'https://hcaptcha.com/1/api.js';
  sc.async = true; sc.defer = true;
  document.head.appendChild(sc);
  window.addEventListener('message', (ev) => {
    if (typeof ev?.data === 'string' && ev.data.includes('hcaptcha')) {
      try { captchaToken = window.hcaptcha?.getResponse?.() || captchaToken; } catch {}
    }
  }, false);
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  stateEl.textContent = 'Memeriksa…';
  try {
    const login = Auth.login || (async () => { throw new Error('Auth.login tidak tersedia'); });
    await login({ password: passwordEl.value, captchaToken });
    stateEl.textContent = 'Berhasil login. Mengalihkan…';
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || 'admin.html';
    location.replace(next);
  } catch (err) {
    console.error(err);
    stateEl.textContent = err?.message || 'Gagal login';
  }
});
