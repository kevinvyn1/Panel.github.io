import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SESSION_INACTIVITY_MINUTES, REQUIRE_ADMIN, DATA_PROVIDER, SHEET_API_URL, SHEET_TOKEN } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
});

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

btnLogout.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.replace('index.html'); });
btnOpen.addEventListener('click', () => modal.showModal());
btnCancel.addEventListener('click', () => modal.close());
btnReload.addEventListener('click', () => loadTable());

indicator.textContent = `Sumber data: ${DATA_PROVIDER === 'sheet' ? 'Google Sheets' : 'Supabase'}`;

// Provider: Supabase (tetap dipakai untuk Auth & cek admin)
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

// === Google Sheets (Apps Script Web App) ===
async function sheetList(){
  const url = new URL(SHEET_API_URL);
  url.searchParams.set('token', SHEET_TOKEN);
  const res = await fetch(url.toString(), { method:'GET' });
  if (!res.ok) throw new Error('Gagal memuat sheet');
  return await res.json();
}
async function sheetInsert(payload){
  const body = new URLSearchParams({ token: SHEET_TOKEN, ...payload, flag: payload.flag ? '1' : '0' });
  const res = await fetch(SHEET_API_URL, {
    method:'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body
  });
  if (!res.ok) throw new Error('Gagal simpan sheet');
  return await res.json().catch(()=>({ok:true}));
}

// === Supabase data provider (jika dipilih) ===
async function sbList(){
  const { data, error } = await supabase.from('whitelist').select('*').order('created_at', { ascending:false }).limit(200);
  if (error) throw error; return data;
}
async function sbInsert(payload){
  const { error } = await supabase.from('whitelist').insert(payload).single();
  if (error) throw error; return { ok:true };
}

function rowHTML(r){
  return `<tr>
    <td>${r.user_id ?? ''}</td>
    <td>${r.angka ?? ''}</td>
    <td>${Number(r.flag) ? 1 : 0}</td>
    <td>${(r.nama ?? '').replace(/[<>]/g,'')}</td>
    <td>${r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
  </tr>`;
}

async function loadTable(){
  tbody.innerHTML = `<tr><td colspan="5" class="muted center">Memuat…</td></tr>`;
  try{
    const data = (DATA_PROVIDER === 'sheet') ? await sheetList() : await sbList();
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
    const res = (DATA_PROVIDER === 'sheet') ? await sheetInsert(payload) : await sbInsert(payload);
    createState.textContent = 'Berhasil disimpan.';
    form.reset(); modal.close(); await loadTable();
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

// Init
(async () => { const session = await ensureAuth(); if (session) await loadTable(); })();
