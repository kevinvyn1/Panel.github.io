/* =======================================================================
   Admin Panel – Whitelist V1 & V2
   =======================================================================
   – Navigasi sidebar (Home / Whitelist V1 / Whitelist V2)
   – Pengambilan data:
       • Spreadsheet  (Web-App + token)            → SHEET_API_URL_V1/V2 + SHEET_TOKEN
       • Supabase REST (anon-key public project)   → SUPABASE_URL + SUPABASE_ANON_KEY
   – Render tabel dan tombol “Muat Ulang”
   ======================================================================= */

import {
  DATA_PROVIDER,            // 'sheet' | 'supabase'
  SHEET_API_URL_V1,
  SHEET_API_URL_V2,
  SHEET_TOKEN,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from './config.js';

/* ---------- 1. Sidebar Navigation ---------- */
const links  = document.querySelectorAll('.sidebar nav a');
const pages  = {
  home : document.getElementById('home-page'),
  v1   : document.getElementById('v1-page'),
  v2   : document.getElementById('v2-page')
};
const titleEl = document.getElementById('page-title');

links.forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    switchPage(a.dataset.page);
  });
});

function switchPage(page){
  Object.entries(pages).forEach(([k,sec])=>sec.style.display = k===page ? '' : 'none');
  links.forEach(a=>a.classList.toggle('active', a.dataset.page===page));
  titleEl.textContent =
      page === 'home' ? 'Home'
    : page === 'v1'   ? 'Whitelist V1'
    :                   'Whitelist V2';

  if(page === 'v1') loadV1();
  if(page === 'v2') loadV2();
}

/* ---------- 2. Data Fetcher Abstraction ---------- */
async function fetchSheet(url){
  /* Header x-api-key */
  let res = await fetch(url, { headers:{ 'x-api-key': SHEET_TOKEN } });

  /* Apps Script tidak bisa baca header? pakai ?token= fallback */
  if(res.status === 401 || res.status === 403){
    const u = new URL(url);
    u.searchParams.set('token', SHEET_TOKEN);
    res = await fetch(u.toString());
  }

  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

async function fetchSupabase(table){
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=*`,
    { headers:{
        apikey:        SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }});
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

function getFetcher(tableOrUrl){
  if(DATA_PROVIDER === 'supabase') return fetchSupabase.bind(null, tableOrUrl);
  return fetchSheet.bind(null, tableOrUrl);           // default: sheet
}

/* ---------- 3. Whitelist V1 ---------- */
const bodyV1 = document.getElementById('body-v1');
document.getElementById('btn-reload-v1').addEventListener('click', loadV1);

async function loadV1(){
  bodyV1.innerHTML = '<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try{
    const data = await getFetcher(
      DATA_PROVIDER === 'supabase' ? 'whitelist_v1' : SHEET_API_URL_V1
    )();

    /* Normalisasi field agar konsisten */
    const rows = data.map(r=>({
      userid : r.userid   || r.user_id,
      angka  : r.angka,
      flag   : r.flag     ? 1 : 0,
      nama   : r.nama     || r.name,
      created: r.created  || r.created_at || ''
    }));

    renderRows(bodyV1, rows, r=>`
      <td>${r.userid}</td><td>${r.angka}</td><td>${r.flag}</td><td>${r.nama}</td><td>${r.created}</td>
    `);
  }catch(err){ showError(bodyV1, err); }
}

/* ---------- 4. Whitelist V2 ---------- */
const bodyV2 = document.getElementById('body-v2');
document.getElementById('btn-reload-v2').addEventListener('click', loadV2);

async function loadV2(){
  bodyV2.innerHTML = '<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try{
    const data = await getFetcher(
      DATA_PROVIDER === 'supabase' ? 'whitelist_v2' : SHEET_API_URL_V2
    )();

    const rows = data.map(r=>({
      userid : r.userid   || r.user_id,
      angka  : r.angka,
      flag   : r.flag     ? 1 : 0,
      kode   : r.kode,
      nama   : r.nama     || r.name
    }));

    renderRows(bodyV2, rows, r=>`
      <td>${r.userid}</td><td>${r.angka}</td><td>${r.flag}</td><td>${r.kode}</td><td>${r.nama}</td>
    `);
  }catch(err){ showError(bodyV2, err); }
}

/* ---------- 5. Utilities ---------- */
function renderRows(tbody, rows, tplFn){
  tbody.innerHTML = '';
  if(!rows.length){
    tbody.innerHTML = '<tr><td colspan="99" class="center muted">Kosong</td></tr>';
    return;
  }
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = tplFn(r);
    tbody.appendChild(tr);
  });
}
function showError(tbody, err){
  console.error(err);
  tbody.innerHTML = `<tr><td colspan="99" class="center muted">Gagal memuat: ${err.message}</td></tr>`;
}

/* ---------- 6. First Load ---------- */
switchPage('home');
