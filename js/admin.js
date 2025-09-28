// Admin page logic
import { requireAuth } from '../protect.js';
import { clearSession } from '../auth/auth.js';

requireAuth();

// page switcher
const nav = document.querySelector('.sidebar');
const pages = {
  home: document.querySelector('#home-page'),
  v1: document.querySelector('#v1-page'),
  v2: document.querySelector('#v2-page'),
  logs: document.querySelector('#logs-page')
};
function show(name) {
  Object.entries(pages).forEach(([k, el]) => {
    if (!el) return;
    if (k === name) el.removeAttribute('hidden');
    else el.setAttribute('hidden', '');
  });
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
  const a = document.querySelector(`.sidebar a[data-page="${name}"]`);
  a?.classList.add('active');
  const title = document.querySelector('#page-title');
  if (title) title.textContent = name === 'home' ? 'Home' : name.toUpperCase();
}
nav?.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-page]');
  if (!a) return;
  e.preventDefault();
  const name = a.getAttribute('data-page');
  show(name);
});

// logout
document.getElementById('btn-logout')?.addEventListener('click', () => {
  clearSession();
  location.href = 'index.html';
});

// Optional data loaders (stub). Ganti URL dengan Apps Script milikmu jika ada.
async function fetchJSON(url, init) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function loadV1() {
  const body = document.getElementById('body-v1');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="6" class="center muted">Tidak ada data</td></tr>';
}

async function loadV2() {
  const body = document.getElementById('body-v2');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="6" class="center muted">Tidak ada data</td></tr>';
}

async function loadLogs() {
  const body = document.getElementById('body-logs');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="3" class="center muted">Tidak ada log</td></tr>';
}

// initial state
show('home');
