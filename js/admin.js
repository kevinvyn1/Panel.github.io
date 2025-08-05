import { DATA_PROVIDER, SHEET_API_URL_V1, SHEET_API_URL_V2, SHEET_TOKEN } from './config.js';

const links = document.querySelectorAll('.sidebar nav a');
const pages = {
  home: document.getElementById('home-page'),
  v1  : document.getElementById('v1-page'),
  v2  : document.getElementById('v2-page')
};
const titleEl = document.getElementById('page-title');

links.forEach(a => {
  a.addEventListener('click', e=>{
    e.preventDefault();
    switchPage(a.dataset.page);
  });
});
function switchPage(page){
  Object.entries(pages).forEach(([k,sec])=>sec.style.display = k===page ? '' : 'none');
  links.forEach(a=>a.classList.toggle('active',a.dataset.page===page));
  titleEl.textContent = page==='home'?'Home':(page==='v1'?'Whitelist V1':'Whitelist V2');
  if(page==='v1') loadV1(); 
  if(page==='v2') loadV2();
}

// Generic fetch for spreadsheet with token
async function fetchSheet(url){
  const res = await fetch(url,{ headers:{ 'x-api-key': SHEET_TOKEN } });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

// === V1 ===
const bodyV1 = document.getElementById('body-v1');
document.getElementById('btn-reload-v1').addEventListener('click', loadV1);
async function loadV1(){
  bodyV1.innerHTML='<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try{
    const data = await fetchSheet(SHEET_API_URL_V1);
    renderRows(bodyV1,data,r=>\`
      <td>\${r.userid}</td><td>\${r.angka}</td><td>\${r.flag}</td><td>\${r.nama}</td><td>\${r.created}</td>
    \`);
  }catch(err){ showError(bodyV1,err); }
}

// === V2 ===
const bodyV2 = document.getElementById('body-v2');
document.getElementById('btn-reload-v2').addEventListener('click', loadV2);
async function loadV2(){
  bodyV2.innerHTML='<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try{
    const data = await fetchSheet(SHEET_API_URL_V2);
    renderRows(bodyV2,data,r=>\`
      <td>\${r.userid}</td><td>\${r.angka}</td><td>\${r.flag}</td><td>\${r.kode}</td><td>\${r.nama}</td>
    \`);
  }catch(err){ showError(bodyV2,err); }
}

// Helpers
function renderRows(tbody, rows, tplFn){
  tbody.innerHTML='';
  if(!rows.length){ tbody.innerHTML='<tr><td colspan="99" class="center muted">Kosong</td></tr>'; return; }
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=tplFn(r);
    tbody.appendChild(tr);
  });
}
function showError(tbody, err){
  console.error(err);
  tbody.innerHTML='<tr><td colspan="99" class="center muted">Gagal memuat</td></tr>';
}

// default
switchPage('home');