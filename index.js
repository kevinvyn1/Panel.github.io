
import { isLoggedIn, setSession, clearSession, authFetch } from './js/auth.js'

const appEl = document.getElementById('app')

function viewLogin() {
  appEl.innerHTML = `
  <div class="login-wrap">
    <h2>Masuk Admin</h2>
    <form id="f" class="row">
      <input id="username" class="input" type="text" placeholder="Username" autocomplete="username" required>
      <input id="password" class="input" type="password" placeholder="Password" autocomplete="current-password" required>
      <div class="row">
        <button id="btn-login" class="btn" type="submit">Masuk</button>
        <span id="msg" class="muted"></span>
        <span class="badge">Sesi 2 jam</span>
      </div>
      <p class="hint">HTTPS disarankan. Cookie SameSite=Strict.</p>
    </form>
  </div>`

  const form = document.getElementById('f')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = document.getElementById('btn-login')
    btn.disabled = true
    btn.textContent = 'Memproses…'
    const u = document.getElementById('username').value.trim()
    const p = document.getElementById('password').value.trim()
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) })
      if (!r.ok) throw new Error()
      const data = await r.json()
      setSession(data.token, data.exp)
      viewAdmin()
    } catch {
      document.getElementById('msg').textContent = 'Login gagal'
      btn.disabled = false
      btn.textContent = 'Masuk'
    }
  })
}

function viewAdmin() {
  appEl.innerHTML = `
  <aside class="sidebar">
    <h2 class="logo">INFERNO</h2>
    <nav>
      <ul>
        <li><a href="#" data-page="home" class="active">Home</a></li>
        <li><a href="#" data-page="v1">Whitelist V1</a></li>
        <li><a href="#" data-page="v2">Whitelist V2</a></li>
        <li><a href="#" data-page="logs">Logs</a></li>
      </ul>
    </nav>
  </aside>
  <div class="panel">
    <header class="topbar">
      <h1 id="page-title">Home</h1>
      <div style="flex:1"></div>
      <button id="btn-logout" class="btn-outline">Keluar</button>
    </header>
    <main class="container">
      <section id="home-page">
        <h2>Selamat datang di Admin Panel</h2>
        <p>Pilih menu di kiri untuk mengelola whitelist.</p>
        <p class="muted">Sesi login 2 jam. Jika kedaluwarsa, login ulang.</p>
      </section>
      <section class="card" id="v1-page" hidden>
        <header class="card-head">
          <h2 style="flex:1">Whitelist V1</h2>
          <div style="display:flex;gap:.5rem">
            <button id="btn-open-v1" class="btn">Buat Whitelist</button>
            <button id="btn-reload-v1" class="btn-outline">Muat Ulang</button>
          </div>
        </header>
        <div class="table-wrap">
          <table class="table" aria-describedby="desc-v1">
            <thead>
              <tr><th>UserID</th><th>Angka</th><th>1/0</th><th>Nama</th><th>Dibuat</th><th>Aksi</th></tr>
            </thead>
            <tbody id="body-v1"><tr><td colspan="6" class="center muted">Memuat…</td></tr></tbody>
          </table>
        </div>
      </section>
      <section class="card" id="v2-page" hidden>
        <header class="card-head">
          <h2 style="flex:1">Whitelist V2</h2>
          <div style="display:flex;gap:.5rem">
            <button id="btn-open-v2" class="btn">Buat Whitelist</button>
            <button id="btn-reload-v2" class="btn-outline">Muat Ulang</button>
          </div>
        </header>
        <div class="table-wrap">
          <table class="table" aria-describedby="desc-v2">
            <thead>
              <tr><th>UserID</th><th>Key</th><th>Status</th><th>Nama</th><th>Dibuat</th><th>Aksi</th></tr>
            </thead>
            <tbody id="body-v2"><tr><td colspan="6" class="center muted">Memuat…</td></tr></tbody>
          </table>
        </div>
      </section>
      <section class="card" id="logs-page" hidden>
        <header class="card-head">
          <h2 style="flex:1">Logs</h2>
          <button id="btn-reload-logs" class="btn-outline">Muat Ulang</button>
        </header>
        <div id="logs" class="mono small muted">Memuat…</div>
      </section>
    </main>
  </div>`

  const links = appEl.querySelectorAll('aside a[data-page]')
  const pages = {
    home: appEl.querySelector('#home-page'),
    v1: appEl.querySelector('#v1-page'),
    v2: appEl.querySelector('#v2-page'),
    logs: appEl.querySelector('#logs-page'),
  }
  function show(page) {
    Object.values(pages).forEach(el => el.hidden = true)
    pages[page].hidden = false
    appEl.querySelector('#page-title').textContent = page === 'home' ? 'Home' : page.toUpperCase()
    links.forEach(a => a.classList.toggle('active', a.dataset.page === page))
  }
  links.forEach(a => a.addEventListener('click', e => { e.preventDefault(); show(a.dataset.page) }))
  show('home')

  appEl.querySelector('#btn-logout').addEventListener('click', () => {
    clearSession()
    viewLogin()
  })

  async function loadV1() {
    const tbody = appEl.querySelector('#body-v1')
    tbody.innerHTML = `<tr><td colspan="6" class="center muted">Memuat…</td></tr>`
    try {
      const r = await authFetch('/api/whitelist/v1', { method: 'GET' })
      if (!r.ok) throw new Error()
      const rows = await r.json()
      if (!Array.isArray(rows) || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="center muted">Kosong</td></tr>`
        return
      }
      tbody.innerHTML = rows.map(x => {
        const t = [x.user_id||'', x.num||'', x.flag?'1':'0', x.name||'', x.created_at||'', `<button data-id="${x.user_id}" class="btn-outline btn-del">Hapus</button>`]
          .map(s => `<td>${String(s)}</td>`).join('')
        return `<tr>${t}</tr>`
      }).join('')
    } catch {
      tbody.innerHTML = `<tr><td colspan="6" class="center error">Gagal memuat</td></tr>`
    }
  }
  async function loadV2() {
    const tbody = appEl.querySelector('#body-v2')
    tbody.innerHTML = `<tr><td colspan="6" class="center muted">Memuat…</td></tr>`
    try {
      const r = await authFetch('/api/whitelist/v2', { method: 'GET' })
      if (!r.ok) throw new Error()
      const rows = await r.json()
      if (!Array.isArray(rows) || rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="center muted">Kosong</td></tr>`
        return
      }
      tbody.innerHTML = rows.map(x => {
        const t = [x.user_id||'', x.key||'', x.status||'', x.name||'', x.created_at||'', `<button data-id="${x.user_id}" class="btn-outline btn-del">Hapus</button>`]
          .map(s => `<td>${String(s)}</td>`).join('')
        return `<tr>${t}</tr>`
      }).join('')
    } catch {
      tbody.innerHTML = `<tr><td colspan="6" class="center error">Gagal memuat</td></tr>`
    }
  }
  async function loadLogs() {
    const box = appEl.querySelector('#logs')
    box.textContent = 'Memuat…'
    try {
      const r = await authFetch('/api/logs', { method: 'GET' })
      if (!r.ok) throw new Error()
      const txt = await r.text()
      box.textContent = txt || 'Kosong'
    } catch {
      box.textContent = 'Gagal memuat'
    }
  }

  appEl.querySelector('#btn-reload-v1').addEventListener('click', loadV1)
  appEl.querySelector('#btn-reload-v2').addEventListener('click', loadV2)
  appEl.querySelector('#btn-reload-logs').addEventListener('click', loadLogs)

  loadV1(); loadV2(); loadLogs();
}

function boot() {
  if (isLoggedIn()) viewAdmin()
  else viewLogin()
}
boot()
