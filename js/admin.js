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

links.forEach(a => a.onclick = (e) => { e.preventDefault(); switchPage(a.dataset.page); });
switchPage('home');

/* ---------- NAV ---------- */
function switchPage(p){
  for (const [k, sel] of Object.entries(pages)) {
    const el = document.querySelector(sel);
    if (el) el.hidden = (k !== p);
  }
  links.forEach(a => a.classList.toggle('active', a.dataset.page === p));
  title.textContent = p === 'home' ? 'Home' : p === 'v1' ? 'Whitelist V1' : p==='v2' ? 'Whitelist V2' : 'Logs';
  if (p === 'v1') loadV1();
  if (p === 'v2') loadV2();
  if (p === 'logs') loadLogs();
}

/* ---------- helpers ---------- */
const qsToken = v=>`${v}${v.includes('?')?'&':'?'}token=${encodeURIComponent(SHEET_TOKEN)}`;
const fetchSheet = (url) => fetch(qsToken(url)).then(r=>{ if(!r.ok) throw new Error(r.statusText); return r.json(); });
const fetchSupabase = (tbl)=> fetch(`${SUPABASE_URL}/rest/v1/${tbl}?select=*&order=created_at.desc`,{
  headers:{apikey:SUPABASE_ANON_KEY,authorization:`Bearer ${SUPABASE_ANON_KEY}`}
}).then(r=>{ if(!r.ok) throw new Error(r.statusText); return r.json(); });

const actor = async () => {
  try{ const { data } = await sb.auth.getUser(); return data?.user?.email || data?.user?.id || 'anonymous'; }
  catch{ return 'anonymous'; }
};
const logAction = async ({action,sheet,rownum,user_id,nama})=>{
  try{
    const who = await actor();
    await fetch(`${SUPABASE_URL}/rest/v1/wl_logs`, {
      method:'POST',
      headers:{
        apikey:SUPABASE_ANON_KEY,
        authorization:`Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':'application/json'
      },
      body: JSON.stringify({ actor:who, action, sheet, rownum, user_id, nama })
    });
  }catch(e){ console.warn('log failed', e); }
};

/* ---------- V1 ---------- */
const tbody1 = document.querySelector('#body-v1');
document.querySelector('#btn-reload-v1').onclick = loadV1;
document.querySelector('#btn-open-v1' ).onclick = () => openModal('v1');

async function loadV1(){
  tbody1.innerHTML = rowLoading(6);
  try{
    const raw = DATA_PROVIDER==='sheet' ? await fetchSheet(SHEET_API_URL_V1) : await fetchSupabase('whitelist_v1');
    const data = (raw||[]).map(r=>({
      row:r.row, user_id:r.user_id||r.userid, angka:r.angka, flag:(String(r.flag)==='1'||r.flag===true), nama:r.nama||r.name, created:r.created_at||r.created||''
    }));
    renderRows(tbody1, data, rowTplV1, 'v1');
  }catch(err){
    console.error(err);
    tbody1.innerHTML = `<tr><td colspan="6" class="center muted">Gagal memuat</td></tr>`;
  }
}

/* ---------- V2 ---------- */
const tbody2 = document.querySelector('#body-v2');
document.querySelector('#btn-reload-v2').onclick = loadV2;
document.querySelector('#btn-open-v2' ).onclick = () => openModal('v2');

async function loadV2(){
  tbody2.innerHTML = rowLoading(6);
  try{
    const raw = DATA_PROVIDER==='sheet' ? await fetchSheet(SHEET_API_URL_V2) : await fetchSupabase('whitelist_v2');
    const data = (raw||[]).map(r=>({
      row:r.row, user_id:r.user_id||r.userid, angka:r.angka, flag:(String(r.flag)==='1'||r.flag===true), kode:r.kode||'', nama:r.nama||r.name
    }));
    renderRows(tbody2, data, rowTplV2, 'v2');
  }catch(err){
    console.error(err);
    tbody2.innerHTML = `<tr><td colspan="6" class="center muted">Gagal memuat</td></tr>`;
  }
}

/* ---------- row templates (dengan tombol hapus) ---------- */
const esc = (s)=>String(s??'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const to10=(v)=>(String(v)==='1'||String(v).toLowerCase()==='true')?1:0;

const rowTplV1 = (r) => `
  <tr data-row="${r.row||''}" data-userid="${esc(r.user_id)}" data-nama="${esc(r.nama)}">
    <td>${esc(r.user_id)}</td>
    <td>${esc(r.angka)}</td>
    <td>${to10(r.flag)}</td>
    <td>${esc(r.nama)}</td>
    <td>${esc(r.created||'')}</td>
    <td style="width:40px;text-align:center;"><button class="btn-icon btn-del" title="Hapus">X</button></td>
  </tr>`;

const rowTplV2 = (r) => `
  <tr data-row="${r.row||''}" data-userid="${esc(r.user_id)}" data-nama="${esc(r.nama)}">
    <td>${esc(r.user_id)}</td>
    <td>${esc(r.angka)}</td>
    <td>${to10(r.flag)}</td>
    <td>${esc(r.kode)}</td>
    <td>${esc(r.nama)}</td>
    <td style="width:40px;text-align:center;"><button class="btn-icon btn-del" title="Hapus">X</button></td>
  </tr>`;

/* ---------- render + attach delete handlers ---------- */
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

/* ---------- confirm modal ---------- */
const confirmDlg  = document.getElementById('confirm');
const confirmText = document.getElementById('confirm-text');
document.getElementById('btn-no').onclick  = ()=>confirmDlg.close();

async function doDelete({sheet,row,userid,nama}){
  if (!row) return;
  const url = sheet==='v1' ? SHEET_API_URL_V1 : SHEET_API_URL_V2;
  const body = new URLSearchParams({ token:SHEET_TOKEN, action:'delete', row:String(row) });
  await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body });
  await logAction({ action:'delete', sheet, rownum:row, user_id:userid, nama });
  sheet==='v1' ? loadV1() : loadV2();
}

function confirmDelete({sheet,row,userid,nama}){
  confirmText.innerHTML = `Apakah anda yakin ingin menghapus baris <b>${row}</b> dengan nama <b>${esc(nama)}</b> dengan userid <b>${esc(userid)}</b>?`;
  confirmDlg.showModal();
  const yes = document.getElementById('btn-yes');
  const handler = async ()=>{ confirmDlg.close(); yes.removeEventListener('click', handler); await doDelete({sheet,row,userid,nama}); };
  yes.addEventListener('click', handler);
}

/* ---------- Logs page ---------- */
const tbodyLogs = document.getElementById('body-logs');
const btnReloadLogs = document.getElementById('btn-reload-logs');
if (btnReloadLogs) btnReloadLogs.onclick = loadLogs;

async function loadLogs(){
  if (!tbodyLogs) return;
  tbodyLogs.innerHTML = rowLoading(7);
  try{
    const data = await fetchSupabase('wl_logs');
    if (!data.length){ tbodyLogs.innerHTML = `<tr><td colspan="7" class="center muted">Kosong</td></tr>`; return; }
    tbodyLogs.innerHTML = data.map(l=>`
      <tr>
        <td>${new Date(l.created_at).toLocaleString()}</td>
        <td>${esc(l.actor)}</td>
        <td>${esc(l.action)}</td>
        <td>${esc(l.sheet)}</td>
        <td>${esc(l.user_id||'')}</td>
        <td>${esc(l.nama||'')}</td>
        <td>${esc(l.rownum||'')}</td>
      </tr>
    `).join('');
  }catch(e){
    console.error(e);
    tbodyLogs.innerHTML = `<tr><td colspan="7" class="center muted">Gagal memuat</td></tr>`;
  }
}

/* ---------- Utils ---------- */
const rowLoading = (colspan) => `<tr><td colspan="${colspan}" class="center muted">Memuat…</td></tr>`;
