import {
  DATA_PROVIDER,
  SHEET_API_URL_V1, SHEET_API_URL_V2, SHEET_TOKEN,
  SUPABASE_URL,      SUPABASE_ANON_KEY
} from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/* ---------- Supabase client (kalau dipakai) ---------- */
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Elemen ---------- */
const links  = document.querySelectorAll('.sidebar nav a');
const pages  = {home:'#home-page', v1:'#v1-page', v2:'#v2-page'};
const title  = document.getElementById('page-title');

links.forEach(a=>a.onclick = e => {e.preventDefault(); switchPage(a.dataset.page);});
switchPage('home');

/* ---------- NAV ---------- */
function switchPage(p){
  for(const [k,sel] of Object.entries(pages)) document.querySelector(sel).hidden = k!==p;
  links.forEach(a=>a.classList.toggle('active', a.dataset.page===p));
  title.textContent = p==='home' ? 'Home' : p==='v1' ? 'Whitelist V1' : 'Whitelist V2';
  if(p==='v1') loadV1(); if(p==='v2') loadV2();
}

/* ---------- FETCH HELPERS ---------- */
const qsToken = v=>`${v}${v.includes('?')?'&':'?'}token=${encodeURIComponent(SHEET_TOKEN)}`;
const fetchSheet = url => fetch(qsToken(url)).then(r=>r.json());

const fetchSupabase = tbl =>
  fetch(`${SUPABASE_URL}/rest/v1/${tbl}?select=*`,{
    headers:{ apikey:SUPABASE_ANON_KEY, authorization:`Bearer ${SUPABASE_ANON_KEY}` }
  }).then(r=>r.json());

/* ---------- V1 ---------- */
const tbody1 = document.querySelector('#body-v1');
document.querySelector('#btn-reload-v1').onclick = loadV1;
document.querySelector('#btn-open-v1' ).onclick = ()=>openModal('v1');

async function loadV1(){
  tbody1.innerHTML = rowLoading(5);
  const data = DATA_PROVIDER==='sheet' ? await fetchSheet(SHEET_API_URL_V1)
                                       : await fetchSupabase('whitelist_v1');
  render(tbody1, data, r=>`
    <td>${r.user_id||r.userid}</td><td>${r.angka}</td><td>${r.flag?1:0}</td><td>${r.nama||r.name}</td><td>${r.created_at||''}</td>`);
}

/* ---------- V2 ---------- */
const tbody2 = document.querySelector('#body-v2');
document.querySelector('#btn-reload-v2').onclick = loadV2;
document.querySelector('#btn-open-v2' ).onclick = ()=>openModal('v2');

async function loadV2(){
  tbody2.innerHTML = rowLoading(5);
  const data = DATA_PROVIDER==='sheet' ? await fetchSheet(SHEET_API_URL_V2)
                                       : await fetchSupabase('whitelist_v2');
  render(tbody2, data, r=>`
    <td>${r.user_id||r.userid}</td><td>${r.angka}</td><td>${r.flag?1:0}</td><td>${r.kode}</td><td>${r.nama||r.name}</td>`);
}

/* ---------- Modal create (both sheets) ---------- */
const modal = document.getElementById('modal');
const labelExtra = document.getElementById('label-extra');
const fieldExtra = document.getElementById('f-extra');
let targetSheet = 'v1';       // default

function openModal(sheet){
  targetSheet = sheet;
  labelExtra.textContent = sheet==='v1' ? 'Nama (D)' : 'Kode (D)';
  fieldExtra.value = '';
  modal.showModal();
}
document.getElementById('btn-cancel').onclick = ()=>modal.close();

document.getElementById('form-create').onsubmit = async e=>{
  e.preventDefault();
  const payload = {
    user_id: document.getElementById('f-userid').value.trim(),
    angka  : document.getElementById('f-angka').value.trim(),
    flag   : document.getElementById('f-flag').value==='1',
  };
  if(targetSheet==='v1') payload.nama = fieldExtra.value.trim();
  else { payload.kode = fieldExtra.value.trim(); payload.nama = document.getElementById('f-nama').value.trim(); }

  const state = document.getElementById('create-state');
  state.textContent = 'Menyimpan…';

  try{
    if(DATA_PROVIDER==='sheet'){
      const body = new URLSearchParams({ token:SHEET_TOKEN, ...payload, flag:payload.flag?'1':'0' });
      const url  = targetSheet==='v1'? SHEET_API_URL_V1 : SHEET_API_URL_V2;
      await fetch(url, { method:'POST', mode:'no-cors',
        headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body });
    }else{
      const table = targetSheet==='v1' ? 'whitelist_v1' : 'whitelist_v2';
      await fetchSupabaseInsert(table, payload);
    }
    state.textContent = 'Berhasil.';
    modal.close();
    targetSheet==='v1' ? loadV1() : loadV2();
  }catch(err){
    console.error(err);
    state.textContent = 'Gagal menyimpan.';
  }
};

function fetchSupabaseInsert(table, payload){
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:'POST',
    headers:{
      apikey:SUPABASE_ANON_KEY,
      authorization:`Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type':'application/json'
    },
    body: JSON.stringify(payload)
  }).then(r=>{ if(!r.ok) throw new Error(r.statusText); });
}

/* ---------- Utils ---------- */
const rowLoading = colspan => `<tr><td colspan="${colspan}" class="center muted">Memuat…</td></tr>`;
function render(tbody, arr, tpl){
  if(!arr.length){ tbody.innerHTML = rowLoading(99).replace('Memuat…', 'Kosong'); return; }
  tbody.innerHTML = arr.map(tpl).join('');
}

