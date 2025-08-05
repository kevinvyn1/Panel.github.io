/* =========================================================================
   Admin panel logic with Supabase integration
   =========================================================================
   - Menangani navigasi sidebar (Home / Whitelist V1 / Whitelist V2)
   - Mengambil data tabel whitelist_v1 & whitelist_v2 dari Supabase REST API
     menggunakan anon public key (token).
   - Bila ingin menggunakan Apps Script, abaikan bagian Supabase dan ganti URL.
   ========================================================================= */

/* === CONFIG ================================================================= */
const SUPABASE_URL = 'https://YOUR-PROJECT-ref.supabase.co';      // ganti
const SUPABASE_ANON_KEY = 'YOUR_PUBLIC_ANON_KEY';                 // ganti
/* ============================================================================ */

const links = document.querySelectorAll('.sidebar nav a');
const pages = {
  home: document.getElementById('home-page'),
  v1: document.getElementById('v1-page'),
  v2: document.getElementById('v2-page')
};
const titleEl = document.getElementById('page-title');

/* ============== Sidebar navigation ============== */
links.forEach(link=>{
  link.addEventListener('click', e=>{
    e.preventDefault();
    switchPage(link.dataset.page);
  });
});

function switchPage(page){
  Object.entries(pages).forEach(([key,section])=>{
    section.style.display = key===page ? '' : 'none';
  });
  links.forEach(a=>a.classList.toggle('active', a.dataset.page===page));
  titleEl.textContent = page==='home' ? 'Home' :
                        page==='v1'   ? 'Whitelist V1' : 'Whitelist V2';
  if(page==='v1') loadV1();
  if(page==='v2') loadV2();
}

/* ============== Supabase helper ============== */
async function supaFetch(endpoint, params=''){
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}${params}`;
  const res = await fetch(url, {
    headers:{
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ============== Whitelist V1 =================== */
const bodyV1 = document.getElementById('body-v1');
document.getElementById('btn-reload-v1').addEventListener('click', loadV1);

async function loadV1(){
  bodyV1.innerHTML = '<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try{
    const data = await supaFetch('whitelist_v1', '?select=userid,angka,flag,nama,created_at&order=created_at.desc');
    renderRows(bodyV1, data, r=>`
      <td>${r.userid}</td>
      <td>${r.angka}</td>
      <td>${r.flag}</td>
      <td>${r.nama}</td>
      <td>${toDate(r.created_at)}</td>
    `);
  }catch(err){
    showError(bodyV1, err);
  }
}

/* ============== Whitelist V2 =================== */
const bodyV2 = document.getElementById('body-v2');
document.getElementById('btn-reload-v2').addEventListener('click', loadV2);

async function loadV2(){
  bodyV2.innerHTML = '<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try{
    const data = await supaFetch('whitelist_v2', '?select=userid,angka,flag,kode,nama,created_at&order=created_at.desc');
    renderRows(bodyV2, data, r=>`
      <td>${r.userid}</td>
      <td>${r.angka}</td>
      <td>${r.flag}</td>
      <td>${r.kode}</td>
      <td>${r.nama}</td>
    `);
  }catch(err){
    showError(bodyV2, err);
  }
}

/* ============== Util =========================== */
function renderRows(tbody, rows, templateFn){
  tbody.innerHTML = '';
  if(!rows.length){
    tbody.innerHTML = '<tr><td colspan="99" class="center muted">Kosong</td></tr>';
    return;
  }
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = templateFn(r);
    tbody.appendChild(tr);
  });
}
function showError(tbody, err){
  console.error(err);
  tbody.innerHTML = '<tr><td colspan="99" class="center muted">Gagal memuat</td></tr>';
}
function toDate(str){
  if(!str) return '';
  return new Date(str).toLocaleString('id-ID');
}

/* default page */
switchPage('home');