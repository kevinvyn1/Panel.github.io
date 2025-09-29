import { requireAuth, logout as doLogout } from './auth.js';
import { CONFIG } from './config.js';

/* ======================== AUTH GUARD ======================== */
requireAuth();

/* ======================== HELPERS ======================== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const esc = (s) => (s==null?'':String(s)).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const fmtTime = (t) => {
  if (!t) return '';
  try { const d = new Date(t); return d.toLocaleString(); } catch { return String(t); }
};
const to10 = (v) => Number(v) ? 1 : 0;
function rowLoading(colspan) { return `<tr><td colspan="${colspan}" class="center muted">Memuat…</td></tr>`; }
function rowEmpty(colspan) { return `<tr><td colspan="${colspan}" class="center muted">Belum ada data</td></tr>`; }

/* ======================== NAVIGATION ======================== */
const pages = {
  home: $('#home-page'),
  v1:   $('#v1-page'),
  v2:   $('#v2-page'),
  logs: $('#logs-page'),
};
const title = $('#page-title');

function switchPage(p) {
  Object.entries(pages).forEach(([k, el]) => el?.toggleAttribute('hidden', k!==p));
  $$('.sidebar a').forEach(a => a.classList.toggle('active', a.dataset.page===p));
  if (title) title.textContent = (p==='home'?'Home':p.toUpperCase());
}
$$('.sidebar a').forEach(a => a.addEventListener('click', (e) => {
  e.preventDefault();
  const p = a.dataset.page;
  if (!p) return;
  switchPage(p);
  if (p === 'v1') loadV1();
  if (p === 'v2') loadV2();
  if (p === 'logs') loadLogs();
}));
switchPage('home');

/* ======================== DATA PROVIDERS ======================== */
async function httpJson(url, opts={}) {
  const res = await fetch(url, { headers: { 'Content-Type':'application/json' }, ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// MOCK data in-memory (persist di localStorage)
const LS_MOCK = 'mock.whitelist';
function getMock() {
  const raw = localStorage.getItem(LS_MOCK);
  return raw ? JSON.parse(raw) : { v1: [], v2: [], logs: [] };
}
function setMock(x) { localStorage.setItem(LS_MOCK, JSON.stringify(x)); }
function logMock(action, sheet, row) {
  const db = getMock();
  db.logs.unshift({ ts: Date.now(), actor: 'admin', action, sheet, user_id: row?.user_id || '', nama: row?.nama || '', row: JSON.stringify(row||{}) });
  setMock(db);
}

const Provider = {
  async listV1() {
    if (CONFIG.PROVIDER === 'apps_script' && CONFIG.APPS_SCRIPT_URL) {
      const url = CONFIG.APPS_SCRIPT_URL + '?action=list&sheet=v1';
      return httpJson(url);
    }
    if (CONFIG.PROVIDER === 'supabase' && CONFIG.SUPABASE_URL) {
      throw new Error('Provider supabase belum diinisialisasi di contoh ini');
    }
    const db = getMock();
    return db.v1;
  },
  async listV2() {
    if (CONFIG.PROVIDER === 'apps_script' && CONFIG.APPS_SCRIPT_URL) {
      const url = CONFIG.APPS_SCRIPT_URL + '?action=list&sheet=v2';
      return httpJson(url);
    }
    if (CONFIG.PROVIDER === 'supabase' && CONFIG.SUPABASE_URL) {
      throw new Error('Provider supabase belum diinisialisasi di contoh ini');
    }
    const db = getMock();
    return db.v2;
  },
  async listLogs() {
    if (CONFIG.PROVIDER === 'apps_script' && CONFIG.APPS_SCRIPT_URL) {
      const url = CONFIG.APPS_SCRIPT_URL + '?action=logs';
      return httpJson(url);
    }
    const db = getMock();
    return db.logs;
  },
  async createV1(row) {
    if (CONFIG.PROVIDER === 'apps_script' && CONFIG.APPS_SCRIPT_URL) {
      const url = CONFIG.APPS_SCRIPT_URL + '?action=create&sheet=v1';
      return httpJson(url, { method:'POST', body: JSON.stringify(row) });
    }
    const db = getMock();
    db.v1.unshift({ ...row, created_at: Date.now() });
    logMock('CREATE', 'v1', row);
    setMock(db);
    return { ok: true };
  },
  async createV2(row) {
    if (CONFIG.PROVIDER === 'apps_script' && CONFIG.APPS_SCRIPT_URL) {
      const url = CONFIG.APPS_SCRIPT_URL + '?action=create&sheet=v2';
      return httpJson(url, { method:'POST', body: JSON.stringify(row) });
    }
    const db = getMock();
    db.v2.unshift({ ...row, created_at: Date.now() });
    logMock('CREATE', 'v2', row);
    setMock(db);
    return { ok: true };
  },
  async deleteV1(user_id) {
    if (CONFIG.PROVIDER === 'apps_script' && CONFIG.APPS_SCRIPT_URL) {
      const url = CONFIG.APPS_SCRIPT_URL + '?action=delete&sheet=v1&user_id=' + encodeURIComponent(user_id);
      return httpJson(url, { method:'POST' });
    }
    const db = getMock();
    const i = db.v1.findIndex(r => String(r.user_id) === String(user_id));
    if (i >= 0) {
      const row = db.v1.splice(i,1)[0];
      logMock('DELETE', 'v1', row);
      setMock(db);
    }
    return { ok: true };
  },
  async deleteV2(user_id) {
    if (CONFIG.PROVIDER === 'apps_script' && CONFIG.APPS_SCRIPT_URL) {
      const url = CONFIG.APPS_SCRIPT_URL + '?action=delete&sheet=v2&user_id=' + encodeURIComponent(user_id);
      return httpJson(url, { method:'POST' });
    }
    const db = getMock();
    const i = db.v2.findIndex(r => String(r.user_id) === String(user_id));
    if (i >= 0) {
      const row = db.v2.splice(i,1)[0];
      logMock('DELETE', 'v2', row);
      setMock(db);
    }
    return { ok: true };
  }
};

/* ======================== UI HOOKS ======================== */
// Logout
$('#btn-logout')?.addEventListener('click', () => doLogout());

// Modal create
const dlg = $('#modal');
const form = $('#form-create');
const fieldUserId = $('#f-userid');
const fieldAngka  = $('#f-angka');
const fieldFlag   = $('#f-flag');
const fieldExtra  = $('#f-extra');     // V1: Nama (D) | V2: Kode (D)
const wrapV2Nama  = $('#wrap-v2-nama');
const fieldNamaV2 = $('#f-nama-v2');
const createState = $('#create-state');
const dlgConfirm  = $('#confirm');
const btnYes      = $('#btn-yes');
const btnNo       = $('#btn-no');
const confirmText = $('#confirm-text');

let targetSheet = 'v1';
$('#btn-open-v1')?.addEventListener('click', () => openModal('v1'));
$('#btn-open-v2')?.addEventListener('click', () => openModal('v2'));
$('#btn-cancel')?.addEventListener('click', () => dlg.close());

function openModal(sheet) {
  targetSheet = sheet;
  createState.textContent = '';
  form?.reset();
  if (sheet === 'v1') {
    $('#label-extra').textContent = 'Nama (D)';
    wrapV2Nama.style.display = 'none';
  } else {
    $('#label-extra').textContent = 'Kode (D)';
    wrapV2Nama.style.display = '';
  }
  dlg.showModal();
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const user_id = (fieldUserId.value||'').trim();
    const angka   = Number(fieldAngka.value||0);
    const flag    = to10(fieldFlag.value||0);

    if (targetSheet === 'v1') {
      const row = { user_id, angka, flag, nama: (fieldExtra.value||'').trim(), created_at: Date.now() };
      await Provider.createV1(row);
      createState.textContent = 'Berhasil disimpan.';
      await loadV1();
    } else {
      const row = { user_id, angka, flag, kode: (fieldExtra.value||'').trim(), nama: (fieldNamaV2.value||'').trim(), created_at: Date.now() };
      await Provider.createV2(row);
      createState.textContent = 'Berhasil disimpan.';
      await loadV2();
    }
    setTimeout(() => dlg.close(), 250);
  } catch (err) {
    console.error(err);
    createState.textContent = err?.message || 'Gagal menyimpan.';
  }
});

/* ======================== RENDER TABLES ======================== */
const bodyV1 = $('#body-v1');
const bodyV2 = $('#body-v2');
const bodyLogs = $('#body-logs');

function renderRows(tbody, rows, tpl, key='id') {
  if (!tbody) return;
  if (!rows || rows.length === 0) { tbody.innerHTML = rowEmpty(tbody.querySelectorAll('tr th, tr td').length || 6); return; }
  tbody.innerHTML = rows.map(tpl).join('');
  // hook delete buttons
  tbody.querySelectorAll('.btn-del[data-id]').forEach(btn => {
    btn.addEventListener('click', () => askDelete(btn.dataset.id, btn.dataset.sheet || 'v1'));
  });
}

function tplV1(r) {
  return `<tr>
    <td>${esc(r.user_id)}</td>
    <td>${esc(r.angka)}</td>
    <td>${to10(r.flag)}</td>
    <td>${esc(r.nama||'')}</td>
    <td>${esc(fmtTime(r.created_at))}</td>
    <td><button class="btn-danger btn-del" data-id="${esc(r.user_id)}" data-sheet="v1">Hapus</button></td>
  </tr>`;
}
function tplV2(r) {
  return `<tr>
    <td>${esc(r.user_id)}</td>
    <td>${esc(r.angka)}</td>
    <td>${to10(r.flag)}</td>
    <td>${esc(r.kode||'')}</td>
    <td>${esc(r.nama||'')}</td>
    <td><button class="btn-danger btn-del" data-id="${esc(r.user_id)}" data-sheet="v2">Hapus</button></td>
  </tr>`;
}
function tplLog(r) {
  return `<tr>
    <td>${esc(fmtTime(r.ts||r.created_at))}</td>
    <td>${esc(r.actor||'')}</td>
    <td>${esc(r.action||'')}</td>
    <td>${esc(r.sheet||'')}</td>
    <td>${esc(r.user_id||'')}</td>
    <td>${esc(r.nama||'')}</td>
    <td>${esc(r.row||'')}</td>
  </tr>`;
}

async function loadV1() {
  if (bodyV1) bodyV1.innerHTML = rowLoading(6);
  const rows = await Provider.listV1();
  renderRows(bodyV1, rows, tplV1, 'user_id');
}
async function loadV2() {
  if (bodyV2) bodyV2.innerHTML = rowLoading(6);
  const rows = await Provider.listV2();
  renderRows(bodyV2, rows, tplV2, 'user_id');
}
async function loadLogs() {
  if (bodyLogs) bodyLogs.innerHTML = rowLoading(7);
  const rows = await Provider.listLogs();
  renderRows(bodyLogs, rows, tplLog, 'ts');
}
$('#btn-reload-v1')?.addEventListener('click', loadV1);
$('#btn-reload-v2')?.addEventListener('click', loadV2);
$('#btn-reload-logs')?.addEventListener('click', loadLogs);

// Delete confirm
function askDelete(user_id, sheet) {
  confirmText.textContent = `Hapus data ${user_id} dari ${sheet.toUpperCase()}?`;
  dlgConfirm.showModal();
  const onNo = () => { dlgConfirm.close(); cleanup(); };
  const onYes = async () => {
    try {
      if (sheet === 'v1') await Provider.deleteV1(user_id);
      else await Provider.deleteV2(user_id);
      sheet === 'v1' ? loadV1() : loadV2();
    } finally {
      dlgConfirm.close();
      cleanup();
    }
  };
  function cleanup() {
    btnNo.removeEventListener('click', onNo);
    btnYes.removeEventListener('click', onYes);
  }
  btnNo.addEventListener('click', onNo, { once: true });
  btnYes.addEventListener('click', onYes, { once: true });
}

// Prefetch some mock data if empty
(function seed() {
  try {
    const db = JSON.parse(localStorage.getItem('mock.whitelist') || '{}');
    if (!db.v1 && !db.v2) {
      localStorage.setItem('mock.whitelist', JSON.stringify({
        v1: [
          { user_id:'12345', angka: 7, flag: 1, nama: 'User Satu', created_at: Date.now()-86400000 },
          { user_id:'67890', angka: 3, flag: 0, nama: 'User Dua', created_at: Date.now()-3600000 }
        ],
        v2: [
          { user_id:'abc', angka: 1, flag: 1, kode:'VIP', nama: 'Alpha', created_at: Date.now()-7200000 }
        ],
        logs: []
      }));
    }
  } catch {}
})();
