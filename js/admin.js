/* admin.js — FIXED */
import {
  DATA_PROVIDER,
  SHEET_API_URL_V1,
  SHEET_API_URL_V2,
  SHEET_TOKEN
} from './config.js';

/* ============ NAVIGATION ============ */
const links = document.querySelectorAll('.sidebar nav a');
const pages = {
  home: document.getElementById('home-page'),
  v1  : document.getElementById('v1-page'),
  v2  : document.getElementById('v2-page')
};
const titleEl = document.getElementById('page-title');

links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    switchPage(link.dataset.page);
  });
});

function switchPage(page) {
  Object.entries(pages).forEach(([k, el]) => (el.style.display = k === page ? '' : 'none'));
  links.forEach(a => a.classList.toggle('active', a.dataset.page === page));
  titleEl.textContent = page === 'home' ? 'Home' : page === 'v1' ? 'Whitelist V1' : 'Whitelist V2';

  if (page === 'v1') loadV1();
  if (page === 'v2') loadV2();
}

/* ============ FETCH HELPERS ============ */
async function fetchWithToken(url) {
  /* header x-api-key */
  let res = await fetch(url, { headers: { 'x-api-key': SHEET_TOKEN } });

  /* fallback query ?token= (karena Apps Script tak bisa baca header) */
  if (res.status === 401) {
    const u = new URL(url);
    u.searchParams.set('token', SHEET_TOKEN);
    res = await fetch(u.toString());
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* alias — supaya kode lama yang pakai fetchSheet tetap jalan */
const fetchSheet = fetchWithToken;

/* ============ V1 ============ */
const bodyV1 = document.getElementById('body-v1');
document.getElementById('btn-reload-v1').addEventListener('click', loadV1);

async function loadV1() {
  bodyV1.innerHTML = '<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try {
    const data = await fetchSheet(SHEET_API_URL_V1);
    renderRows(
      bodyV1,
      data,
      r => `<td>${r.user_id}</td><td>${r.angka}</td><td>${r.flag ? 1 : 0}</td><td>${r.nama}</td><td>${r.created ?? ''}</td>`
    );
  } catch (err) {
    showError(bodyV1, err);
  }
}

/* ============ V2 ============ */
const bodyV2 = document.getElementById('body-v2');
document.getElementById('btn-reload-v2').addEventListener('click', loadV2);

async function loadV2() {
  bodyV2.innerHTML = '<tr><td colspan="5" class="center muted">Memuat…</td></tr>';
  try {
    const data = await fetchSheet(SHEET_API_URL_V2);
    renderRows(
      bodyV2,
      data,
      r => `<td>${r.user_id}</td><td>${r.angka}</td><td>${r.flag ? 1 : 0}</td><td>${r.kode}</td><td>${r.name}</td>`
    );
  } catch (err) {
    showError(bodyV2, err);
  }
}

/* ============ UTILITIES ============ */
function renderRows(tbody, rows, tplFn) {
  tbody.innerHTML = '';
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="99" class="center muted">Kosong</td></tr>';
    return;
  }
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = tplFn(r);
    tbody.appendChild(tr);
  });
}
function showError(tbody, err) {
  console.error(err);
  tbody.innerHTML = '<tr><td colspan="99" class="center muted">Gagal memuat</td></tr>';
}

/* pertama kali buka */
switchPage('home');
