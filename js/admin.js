import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SESSION_INACTIVITY_MINUTES, REQUIRE_ADMIN, DATA_PROVIDER, SHEET_API_URL, SHEET_TOKEN } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });

window.addEventListener('contextmenu', e => e.preventDefault(), { passive:false });

const tbody = document.getElementById('whitelist-body');
const modal = document.getElementById('modal');
const form = document.getElementById('form-create');
const createState = document.getElementById('create-state');
const btnOpen = document.getElementById('btn-open-modal');
const btnCancel = document.getElementById('btn-cancel');
const btnLogout = document.getElementById('btn-logout');
const btnReload = document.getElementById('btn-reload');
const indicator = document.getElementById('source-indicator');

indicator.textContent = `Sumber data: Google Sheets (JSONP)`;

btnLogout.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.replace('index.html'); });
btnOpen.addEventListener('click', () => modal.showModal());
btnCancel.addEventListener('click', () => modal.close());
btnReload.addEventListener('click', () => loadTable());

async function ensureAuth(){
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.replace('index.html'); return null; }
  if (REQUIRE_ADMIN){
    const { data: admins, error } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).limit(1);
    if (error) { console.error(error); alert('Kesalahan akses.'); return null; }
    if (!admins || admins.length === 0){ await supabase.auth.signOut(); alert('Akses admin diperlukan.'); window.location.replace('index.html'); return null; }
  }
  return session;
}

// === JSONP helper untuk GET (hindari CORS) ===
function jsonp(url){
  return new Promise((resolve, reject) => {
    const cb = 'cb_'+Math.random().toString(36).slice(2);
    const s = document.createElement('script');
    window[cb] = (data) => { resolve(data); delete window[cb]; s.remove(); };
    s.onerror = () => { reject(new Error('JSONP error')); delete window[cb]; s.remove(); };
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
    document.body.appendChild(s);
  });
}

async function sheetList(){
  const url = `${SHEET_API_URL}?token=${encodeURIComponent(SHEET_TOKEN)}`;
  const data = await jsonp(url);
  return data;
}

async function sheetInsert(payload){
  // POST tanpa CORS: kirim sebagai x-www-form-urlencoded & tidak membaca response
  const body = new URLSearchParams({ token: SHEET_TOKEN, ...payload, flag: payload.flag ? '1':'0' });
  await fetch(SHEET_API_URL, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' }, body });
  return { ok:true };
}

function rowHTML(r){
  return `<tr>
    <td>${r.user_id ?? ''}</td>
    <td>${r.angka ?? ''}</td>
    <td>${Number(r.flag) ? 1 : 0}</td>
    <td>${(r.nama ?? '').replace(/[<>]/g,'')}</td>
    <td>${r.created_at ?? ''}</td>
  </tr>`;
}

async function loadTable(){
  tbody.innerHTML = `<tr><td colspan="5" class="muted center">Memuat…</td></tr>`;
  try{
    const data = await sheetList();
    if (!data || data.length === 0){ tbody.innerHTML = `<tr><td colspan="5" class="center muted">Belum ada data.</td></tr>`; return; }
    tbody.innerHTML = data.map(rowHTML).join('');
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="center">Gagal memuat.</td></tr>`;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  createState.textContent = 'Menyimpan…';
  const payload = {
    user_id: document.getElementById('f-userid').value.trim(),
    angka: Number(document.getElementById('f-angka').value),
    flag: document.getElementById('f-flag').value === '1',
    nama: document.getElementById('f-nama').value.trim()
  };
  try{
    await sheetInsert(payload);
    createState.textContent = 'Berhasil disimpan (cek ulang)…';
    form.reset(); modal.close();
    setTimeout(loadTable, 800); // beri waktu appendRow tereksekusi
  }catch(err){
    console.error(err);
    createState.textContent = 'Gagal menyimpan.';
  }
});

function updateActivity(){ localStorage.setItem('lastActive', String(Date.now())); }
['click','keydown','mousemove','scroll','visibilitychange'].forEach(ev => { document.addEventListener(ev, updateActivity, { passive:true }); });
setInterval(async () => {
  const last = Number(localStorage.getItem('lastActive') || Date.now());
  if ((Date.now()-last)/60000 > SESSION_INACTIVITY_MINUTES){ await supabase.auth.signOut(); window.location.replace('index.html'); }
}, 15000);

(async () => { const session = await ensureAuth(); if (session) await loadTable(); })();
