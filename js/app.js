import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SESSION_INACTIVITY_MINUTES, CAPTCHA_PROVIDER, CAPTCHA_SITE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
});

window.addEventListener('contextmenu', e => e.preventDefault(), { passive:false });

function setYear(){ const y=document.getElementById('y'); if(y) y.textContent=new Date().getFullYear(); } setYear();

const form = document.getElementById('login-form');
const state = document.getElementById('login-state');
const btn = document.getElementById('btn-login');
const toggle = document.getElementById('toggle-pass');
const pass = document.getElementById('password');
if (toggle) toggle.addEventListener('click', () => { pass.type = pass.type === 'password' ? 'text' : 'password'; });

supabase.auth.getSession().then(({ data }) => { if (data?.session) window.location.replace('admin.html'); });

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  state.textContent = 'Memproses…'; btn.disabled = true;
  const email=document.getElementById('username').value.trim();
  const password=document.getElementById('password').value;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    localStorage.setItem('lastActive', String(Date.now()));
    state.textContent='Berhasil. Mengalihkan…'; setTimeout(()=>window.location.replace('admin.html'), 300);
  } catch(err){ console.warn(err); state.textContent='Gagal login. Coba lagi.'; }
  finally{ btn.disabled=false; }
});

function updateActivity(){ localStorage.setItem('lastActive', String(Date.now())); }
['click','keydown','mousemove','scroll','visibilitychange'].forEach(ev => { document.addEventListener(ev, updateActivity, { passive:true }); });
setInterval(async () => {
  const last = Number(localStorage.getItem('lastActive') || Date.now());
  if ((Date.now()-last)/60000 > SESSION_INACTIVITY_MINUTES){ await supabase.auth.signOut(); location.reload(); }
}, 15000);
