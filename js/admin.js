import {
  DATA_PROVIDER,
  SHEET_API_URL_V1, SHEET_API_URL_V2, SHEET_TOKEN,
  SUPABASE_URL,      SUPABASE_ANON_KEY
} from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Elemen ---------- */
const links  = document.querySelectorAll('.sidebar nav a');
const pages  = {home:'#home-page', v1:'#v1-page', v2:'#v2-page', logs:'#logs-page'};
const title  = document.getElementById('page-title');

/* ---------- NAV ---------- */
links.forEach(a => a.onclick = (e) => { e.preventDefault(); switchPage(a.dataset.page); });
switchPage('home');

function switchPage(p){
  for (const [k, sel] of Object.entries(pages)) {
    const el = document.querySelector(sel);
    if (el) el.hidden = (k !== p);
  }
  links.forEach(a => a.classList.toggle('active', a.dataset.page === p));
  title.textContent = p === 'home' ? 'Home' : p === 'v1' ? 'Whitelist V1' : p === 'v2' ? 'Whitelist V2' : 'Logs';
  if (p === 'v1') loadV1();
  if (p === 'v2') loadV2();
  if (p === 'logs') loadLogs();
}

/* ---------- FETCH HELPERS ---------- */
const qsToken    = v => `${v}${v.includes('?') ? '&' : '?'}token=${encodeURIComponent(SHEET_TOKEN)}`;
const fetchSheet = (url) => fetch(qsToken(url)).then(r => { if(!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json(); });
const fetchSupabase = (path) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
  headers:{ apikey:SUPABASE_ANON_KEY, authorization:`Bearer ${SUPABASE_ANON_KEY}` }
}).then(r=>{ if(!r.ok) throw new Error(r.statusText); return r.json(); });

/* ---------- utils template ---------- */
const esc  = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
const to10 = v => (String(v) === '1' || String(v).toLowerCase() === 'true' || v === true) ? 1 : 0;

/* ---------- Modal CREATE (define first) ---------- */
const modal       = document.getElementById('modal');
const labelExtra  = document.getElementById('label-extra');
const fieldExtra  = document.getElementById('f-extra');
const wrapNamaV2  = document.getElementById('wrap-v2-nama');
const fieldNamaV2 = document.getElementById('f-nama-v2');
let targetSheet   = 'v1';

function openModal(sheet){
  targetSheet = sheet;
  if (sheet === 'v1'){
    if (labelExtra) labelExtra.textContent = 'Nama (D)';
    if (wrapNamaV2) wrapNamaV2.style.display = 'none';
  } else {
    if (labelExtra) labelExtra.textContent = 'Kode (D)';
    if (wrapNamaV2) wrapNamaV2.style.display = '';
  }
  if (fieldExtra)  fieldExtra.value  = '';
  if (fieldNamaV2) fieldNamaV2.value = '';
  if (modal) modal.showModal();
}

const btnCancel = document.getElementById('btn-cancel');
if (btnCancel && modal) btnCancel.onclick = () => modal.close();

const form = document.getElementById('form-create');
if (form) form.onsubmit = async (e) => {
  e.preventDefault();
  const payload = {
    user_id: document.getElementById('f-userid').value.trim(),
    angka  : document.getElementById('f-angka').value.trim(),
    flag   : document.getElementById('f-flag').value === '1',
  };
  if (targetSheet === 'v1'){
    payload.nama = fieldExtra ? fieldExtra.value.trim() : '';
  } else {
    payload.kode = fieldExtra ? fieldExtra.value.trim() : '';
    payload.nama = fieldNamaV2 ? fieldNamaV2.value.trim() : '';
  }

  const state = document.getElementById('create-state');
  if (state) state.textContent = 'Menyimpan…';

  try{
    if (DATA_PROVIDER === 'sheet'){
      const body = new URLSearchParams({ token:SHEET_TOKEN, ...payload, flag: payload.flag ? '1' : '0' });
      const url  = targetSheet === 'v1' ? SHEET_API_URL_V1 : SHEET_API_URL_V2;
      await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' }, body, mode:'no-cors' });
    } else {
      const table = targetSheet === 'v1' ? 'whitelist_v1' : 'whitelist_v2';
      await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method:'POST',
        headers:{ apikey:SUPABASE_ANON_KEY, authorization:`Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      }).then(r=>{ if(!r.ok) throw new Error(r.statusText); });
    }

    // log ADD
    try {
      const who = (await sb.auth.getUser()).data?.user?.email || 'anonymous';
      await fetch(`${SUPABASE_URL}/rest/v1/wl_logs`, {
        method:'POST',
        headers:{ apikey:SUPABASE_ANON_KEY, authorization:`Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ actor:who, action:'add', sheet:targetSheet, rownum:null, user_id:payload.user_id, nama:payload.nama||'' })
      });
    } catch(_) {}

    if (state) state.textContent = 'Berhasil.';
    if (modal) modal.close();
    targetSheet === 'v1' ? loadV1() : loadV2();
  }catch(err){
    console.error(err);
    if (state) state.textContent = 'Gagal menyimpan.';
  }
};

/* ---------- V1 ---------- */
const tbody1      = document.querySelector('#body-v1');
const btnReloadV1 = document.querySelector('#btn-reload-v1');
const btnOpenV1   = document.querySelector('#btn-open-v1');
if (btnReloadV1) btnReloadV1.onclick = loadV1;
if (btnOpenV1)   btnOpenV1.onclick   = () => openModal('v1');

async function loadV1(){
  if (tbody1) tbody1.innerHTML = rowLoading(6);
  try{
    const raw  = DATA_PROVIDER === 'sheet' ? await fetchSheet(SHEET_API_URL_V1)
                                           : await fetchSupabase('whitelist_v1?select=*');
    const data = (raw||[]).map(r=>({
      row:r.row, user_id:r.user_id||r.userid, angka:r.angka, flag:(String(r.flag)==='1'||r.flag===true),
      nama:r.nama||r.name, created:r.created_at||r.created||''
    }));
    if (tbody1) renderRows(tbody1, data, rowTplV1, 'v1');
  }catch(err){
    console.error(err);
    if (tbody1) tbody1.innerHTML = `<tr><td colspan="6" class="center muted">Gagal memuat</td></tr>`;
  }
}

/* ---------- V2 ---------- */
const tbody2      = document.querySelector('#body-v2');
const btnReloadV2 = document.querySelector('#btn-reload-v2');
const btnOpenV2   = document.querySelector('#btn-open-v2');
if (btnReloadV2) btnReloadV2.onclick = loadV2;
if (btnOpenV2)   btnOpenV2.onclick   = () => openModal('v2');

async function loadV2(){
  if (tbody2) tbody2.innerHTML = rowLoading(6);
  try{
    const raw  = DATA_PROVIDER === 'sheet' ? await fetchSheet(SHEET_API_URL_V2)
                                           : await fetchSupabase('whitelist_v2?select=*');
    const data = (raw||[]).map(r=>({
      row:r.row, user_id:r.user_id||r.userid, angka:r.angka, flag:(String(r.flag)==='1'||r.flag===true),
      kode:r.kode||'', nama:r.nama||r.name
    }));
    if (tbody2) renderRows(tbody2, data, rowTplV2, 'v2');
  }catch(err){
    console.error(err);
    if (tbody2) tbody2.innerHTML = `<tr><td colspan="6" class="center muted">Gagal memuat</td></tr>`;
  }
}

/* ---------- row templates (dengan tombol X) ---------- */
const rowTplV1 = (r) => `
  <tr data-row="${r.row||''}" data-userid="${esc(r.user_id)}" data-nama="${esc(r.nama)}">
    <td>${esc(r.user_id)}</td>
    <td>${esc(r.angka)}</td>
    <td>${to10(r.flag)}</td>
    <td>${esc(r.nama)}</td>
    <td>${esc(r.created||'')}</td>
    <td style="width:40px;text-align:center;"><button class="btn-icon btn-del" aria-label="Hapus">✕</button></td>
  </tr>`;

const rowTplV2 = (r) => `
  <tr data-row="${r.row||''}" data-userid="${esc(r.user_id)}" data-nama="${esc(r.nama)}">
    <td>${esc(r.user_id)}</td>
    <td>${esc(r.angka)}</td>
    <td>${to10(r.flag)}</td>
    <td>${esc(r.kode)}</td>
    <td>${esc(r.nama)}</td>
    <td style="width:40px;text-align:center;"><button class="btn-icon btn-del" aria-label="Hapus">✕</button></td>
  </tr>`;

/* ---------- render + attach delete ---------- */
function renderRows(tbody, rows, tpl, sheet){
  if (!rows || !rows.length){ tbody.innerHTML = `<tr><td colspan="99" class="center muted">Kosong</td></tr>`; return; }
  tbody.innerHTML = rows.map(tpl).join('');
  tbody.querySelectorAll('.btn-del').forEach(btn=>{
    btn.onclick = (e)=>{
      const tr = e.currentTarget.closest('tr');
      const row = parseInt(tr.dataset.row||'0',10);
      const userid = tr.dataset.userid || '';
      const nama = tr.dataset.nama || '';
      confirmDelete({sheet,row,userid,nama});
    };
  });
}

/* ---------- Confirm delete ---------- */
const confirmDlg  = document.getElementById('confirm');
const confirmText = document.getElementById('confirm-text');
const btnNo       = document.getElementById('btn-no');
const btnYes      = document.getElementById('btn-yes');
if (btnNo  && confirmDlg) btnNo.onclick  = () => confirmDlg.close();

async function doDelete({sheet,row,userid,nama}){
  if (!row) return;
  const url  = sheet==='v1' ? SHEET_API_URL_V1 : SHEET_API_URL_V2;
  const body = new URLSearchParams({ token:SHEET_TOKEN, action:'delete', row:String(row) });
  await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body });

  // log DELETE
  try {
    const who = (await sb.auth.getUser()).data?.user?.email || 'anonymous';
    await fetch(`${SUPABASE_URL}/rest/v1/wl_logs`, {
      method:'POST',
      headers:{ apikey:SUPABASE_ANON_KEY, authorization:`Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ actor:who, action:'delete', sheet, rownum:row, user_id:userid, nama })
    });
  } catch(_) {}

  sheet==='v1' ? loadV1() : loadV2();
}

function confirmDelete({sheet,row,userid,nama}){
  confirmText.innerHTML = `Apakah anda yakin ingin menghapus baris <b>${row}</b> dengan nama <b>${esc(nama)}</b> dengan userid <b>${esc(userid)}</b>?`;
  confirmDlg.showModal();
  const handler = async ()=>{ confirmDlg.close(); btnYes.removeEventListener('click', handler); await doDelete({sheet,row,userid,nama}); };
  btnYes.addEventListener('click', handler);
}

/* ---------- Logs ---------- */
const tbodyLogs = document.getElementById('body-logs');
const btnReloadLogs = document.getElementById('btn-reload-logs');
if (btnReloadLogs) btnReloadLogs.onclick = loadLogs;

async function loadLogs(){
  if (!tbodyLogs) return;
  tbodyLogs.innerHTML = rowLoading(7);
  try{
    const data = await fetchSupabase('wl_logs?select=*&order=created_at.desc');
    if (!data.length){ tbodyLogs.innerHTML = `<tr><td colspan="7" class="center muted">Kosong</td></tr>`; return; }
    tbodyLogs.innerHTML = data.map(l => `
      <tr>
        <td>${new Date(l.created_at).toLocaleString()}</td>
        <td>${esc(l.actor || '')}</td>
        <td>${esc(l.action || '')}</td>
        <td>${esc(l.sheet  || '')}</td>
        <td>${esc(l.user_id|| '')}</td>
        <td>${esc(l.nama   || '')}</td>
        <td>${esc(l.rownum || '')}</td>
      </tr>
    `).join('');
  }catch(err){
    console.error(err);
    tbodyLogs.innerHTML = `<tr><td colspan="7" class="center muted">Gagal memuat</td></tr>`;
  }
}

/* ---------- Helpers ---------- */
const rowLoading = (colspan) => `<tr><td colspan="${colspan}" class="center muted">Memuat…</td></tr>`;
