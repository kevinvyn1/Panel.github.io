const links = document.querySelectorAll('.sidebar nav a');
const pages = {
  home: document.getElementById('home-page'),
  v1: document.getElementById('v1-page'),
  v2: document.getElementById('v2-page')
};
const titleEl = document.getElementById('page-title');

links.forEach(l=>{
  l.addEventListener('click',e=>{
    e.preventDefault();
    const page = l.dataset.page;
    switchPage(page);
  });
});

function switchPage(page){
  Object.keys(pages).forEach(k=>pages[k].style.display = k===page ? '' : 'none');
  links.forEach(a=>a.classList.toggle('active', a.dataset.page===page));
  titleEl.textContent = page==='home'?'Home':(page==='v1'?'Whitelist V1':'Whitelist V2');
  if(page==='v1'){ loadV1(); }
  if(page==='v2'){ loadV2(); }
}

async function fetchJson(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

/* === V1 === */
const bodyV1 = document.getElementById('body-v1');
document.getElementById('btn-reload-v1').addEventListener('click', loadV1);
async function loadV1(){
  bodyV1.innerHTML='<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try{
    // Ganti URL di bawah dengan WebApp Apps Script spreadsheet V1
    const data = await fetchJson('https://script.google.com/macros/s/REPLACE_V1_ENDPOINT/exec');
    bodyV1.innerHTML='';
    data.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${r.userid}</td><td>${r.angka}</td><td>${r.flag}</td><td>${r.nama}</td><td>${r.created}</td>`;
      bodyV1.appendChild(tr);
    });
    if(!data.length) bodyV1.innerHTML='<tr><td colspan="5" class="center muted">Kosong</td></tr>';
  }catch(err){
    bodyV1.innerHTML='<tr><td colspan="5" class="center muted">Gagal memuat</td></tr>';
    console.error(err);
  }
}

/* === V2 === */
const bodyV2 = document.getElementById('body-v2');
document.getElementById('btn-reload-v2').addEventListener('click', loadV2);
async function loadV2(){
  bodyV2.innerHTML='<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try{
    // Ganti URL di bawah dengan WebApp Apps Script spreadsheet V2
    const data = await fetchJson('https://script.google.com/macros/s/REPLACE_V2_ENDPOINT/exec');
    bodyV2.innerHTML='';
    data.forEach(r=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${r.userid}</td><td>${r.angka}</td><td>${r.flag}</td><td>${r.kode}</td><td>${r.nama}</td>`;
      bodyV2.appendChild(tr);
    });
    if(!data.length) bodyV2.innerHTML='<tr><td colspan="5" class="center muted">Kosong</td></tr>';
  }catch(err){
    bodyV2.innerHTML='<tr><td colspan="5" class="center muted">Gagal memuat</td></tr>';
    console.error(err);
  }
}

/* default */
switchPage('home');