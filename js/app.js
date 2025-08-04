import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SESSION_INACTIVITY_MINUTES, CAPTCHA_PROVIDER, CAPTCHA_SITE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
});

window.addEventListener('contextmenu', e => e.preventDefault(), { passive:false });
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p')) ||
      (e.ctrlKey && e.shiftKey && ['i','c','j'].includes(e.key.toLowerCase())) ||
      (e.key === 'F12')) e.preventDefault();
}, { passive:false });

async function computeFingerprint(){
  const data = [navigator.userAgent, navigator.platform, navigator.language, screen.width, screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
function setYear(){ const y=document.getElementById('y'); if(y) y.textContent=new Date().getFullYear(); } setYear();

const form = document.getElementById('login-form');
const state = document.getElementById('login-state');
const btn = document.getElementById('btn-login');
const toggle = document.getElementById('toggle-pass');
const pass = document.getElementById('password');
if (toggle) toggle.addEventListener('click', () => { pass.type = pass.type === 'password' ? 'text' : 'password'; });

supabase.auth.getSession().then(({ data }) => { if (data?.session) window.location.replace('admin.html'); });

let captchaToken = null; const slot = document.getElementById('captcha-slot');
function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.async=true; s.defer=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
async function renderCaptcha(provider, siteKey){
  if (!slot) return; slot.innerHTML='';
  if (provider === 'turnstile'){
    await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js');
    const el=document.createElement('div'); el.id='cf-turnstile-widget'; slot.appendChild(el);
    const wait=()=>new Promise(r=>{ if(window.turnstile) return r(); const i=setInterval(()=>{ if(window.turnstile){clearInterval(i); r();}},50);});
    await wait(); window.turnstile.render('#cf-turnstile-widget',{ sitekey:siteKey, theme:'dark', callback:(t)=>{captchaToken=t;} });
  } else if (provider === 'hcaptcha'){
    await loadScript('https://hcaptcha.com/1/api.js'); const el=document.createElement('div'); el.id='hcaptcha-widget'; slot.appendChild(el);
    const wait=()=>new Promise(r=>{ if(window.hcaptcha) return r(); const i=setInterval(()=>{ if(window.hcaptcha){clearInterval(i); r();}},50);});
    await wait(); window.hcaptcha.render('hcaptcha-widget',{ sitekey:siteKey, theme:'dark', callback:(t)=>{captchaToken=t;} });
  }
}
if (CAPTCHA_PROVIDER && CAPTCHA_SITE_KEY && CAPTCHA_SITE_KEY!=='YOUR_SITE_KEY'){ renderCaptcha(CAPTCHA_PROVIDER, CAPTCHA_SITE_KEY).catch(console.error); }

let lastAttempt=0; const ATTEMPT_WINDOW_MS=3000;
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const now=Date.now(); if(now-lastAttempt<ATTEMPT_WINDOW_MS) return; lastAttempt=now;
  state.textContent='Memproses…'; btn.disabled=true;
  const email=document.getElementById('username').value.trim();
  const password=document.getElementById('password').value;
  try {
    if (CAPTCHA_PROVIDER && CAPTCHA_SITE_KEY && CAPTCHA_SITE_KEY!=='YOUR_SITE_KEY' && !captchaToken){
      state.textContent='Selesaikan verifikasi CAPTCHA.'; btn.disabled=false; return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password, options:{ captchaToken } });
    if (error) throw error;
    const fp=await computeFingerprint(); localStorage.setItem('fp', fp); localStorage.setItem('lastActive', String(Date.now()));
    state.textContent='Berhasil. Mengalihkan…'; setTimeout(()=>window.location.replace('admin.html'), 300);
  } catch(err){ console.warn(err); state.textContent='Gagal login. Coba lagi.'; captchaToken=null; }
  finally{ btn.disabled=false; }
});

function updateActivity(){ localStorage.setItem('lastActive', String(Date.now())); }
['click','keydown','mousemove','scroll','visibilitychange'].forEach(ev => { document.addEventListener(ev, updateActivity, { passive:true }); });
setInterval(async () => {
  const last = Number(localStorage.getItem('lastActive') || Date.now());
  const diffMin=(Date.now()-last)/60000;
  if (diffMin > SESSION_INACTIVITY_MINUTES){ await supabase.auth.signOut(); localStorage.removeItem('lastActive'); location.reload(); }
}, 15000);
