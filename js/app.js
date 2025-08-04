import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { SUPABASE_URL, SUPABASE_ANON_KEY, SESSION_INACTIVITY_MINUTES } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Anti‑scraping ringan (mudah dibypass)
window.addEventListener('contextmenu', e => e.preventDefault(), { passive:false });
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p')) ||
      (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'j')) ||
      (e.key === 'F12')) e.preventDefault();
}, { passive:false });

// Fingerprint sederhana (bisa salah-positif, hanya tambahan)
function computeFingerprint(){
  const data = [
    navigator.userAgent, navigator.platform, navigator.language,
    screen.width, screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('|');
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(data)).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  });
}

function setYear(){ document.getElementById('y').textContent = new Date().getFullYear(); }
setYear();

const form = document.getElementById('login-form');
const state = document.getElementById('login-state');
const btn = document.getElementById('btn-login');
const toggle = document.getElementById('toggle-pass');
const pass = document.getElementById('password');
if (toggle) toggle.addEventListener('click', () => {
  pass.type = pass.type === 'password' ? 'text' : 'password';
});

// Redirect jika sudah login
supabase.auth.getSession().then(({ data }) => {
  if (data.session) window.location.replace('admin.html');
});

let lastAttempt = 0;
const ATTEMPT_WINDOW_MS = 3000; // rate limit ringan di klien

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const now = Date.now();
  if (now - lastAttempt < ATTEMPT_WINDOW_MS){
    return; // tahan spam
  }
  lastAttempt = now;

  state.textContent = 'Memproses…';
  btn.disabled = true;

  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    // Login email/password (kolom "username" dipetakan ke email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Catat fingerprint di storage untuk pemeriksaan dasar
    const fp = await computeFingerprint();
    localStorage.setItem('fp', fp);
    localStorage.setItem('lastActive', String(Date.now()));

    state.textContent = 'Berhasil. Mengalihkan…';
    setTimeout(() => window.location.replace('admin.html'), 300);
  } catch (err) {
    console.warn(err);
    state.textContent = 'Gagal login. Coba lagi.'; // jangan expose detail
  } finally {
    btn.disabled = false;
  }
});

// Timeout sesi via aktivitas pengguna (tambahan selain pengaturan dashboard)
function updateActivity(){
  localStorage.setItem('lastActive', String(Date.now()));
}
['click','keydown','mousemove','scroll','visibilitychange'].forEach(ev => {
  document.addEventListener(ev, updateActivity, { passive:true });
});

setInterval(async () => {
  const last = Number(localStorage.getItem('lastActive') || Date.now());
  const diffMin = (Date.now() - last) / 60000;
  if (diffMin > SESSION_INACTIVITY_MINUTES){
    await supabase.auth.signOut();
    localStorage.removeItem('lastActive');
    location.reload();
  }
}, 15_000);
