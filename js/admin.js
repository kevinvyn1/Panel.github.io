import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SESSION_INACTIVITY_MINUTES, REQUIRE_ADMIN } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
});

// Anti‑scraping ringan
window.addEventListener('contextmenu', e => e.preventDefault(), { passive:false });

const tbody = document.getElementById('whitelist-body');
const modal = document.getElementById('modal');
const form = document.getElementById('form-create');
const createState = document.getElementById('create-state');
const btnOpen = document.getElementById('btn-open-modal');
const btnCancel = document.getElementById('btn-cancel');
const btnLogout = document.getElementById('btn-logout');

btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.replace('index.html');
});

function rowHTML(r){
  return `<tr>
    <td>${r.user_id ?? ''}</td>
    <td>${r.angka ?? ''}</td>
    <td>${Number(r.flag) ? 1 : 0}</td>
    <td>${(r.nama ?? '').replace(/[<>]/g,'')}</td>
    <td>${new Date(r.created_at).toLocaleString()}</td>
  </tr>`;
}

async function ensureAuth(){
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.replace('index.html'); return null; }

  if (REQUIRE_ADMIN){
    const { data: admins, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .limit(1);
    if (error) { console.error(error); alert('Kesalahan akses.'); return null; }
    if (!admins || admins.length === 0){
      await supabase.auth.signOut();
      alert('Akses admin diperlukan.');
      window.location.replace('index.html');
      return null;
    }
  }
  return session;
}

async function loadTable(){
  tbody.innerHTML = `<tr><td colspan="5" class="muted center">Memuat…</td></tr>`;
  const { data, error } = await supabase
    .from('whitelist')
    .select('*')
    .order('created_at', { ascending:false })
    .limit(200);
  if (error){ console.error(error); tbody.innerHTML = `<tr><td colspan="5" class="center">Gagal memuat.</td></tr>`; return; }
  if (!data || data.length === 0){ tbody.innerHTML = `<tr><td colspan="5" class="center muted">Belum ada data.</td></tr>`; return; }
  tbody.innerHTML = data.map(rowHTML).join('');
}

btnOpen.addEventListener('click', () => modal.showModal());
btnCancel.addEventListener('click', () => modal.close());

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  createState.textContent = 'Menyimpan…';
  const payload = {
    user_id: document.getElementById('f-userid').value.trim(),
    angka: Number(document.getElementById('f-angka').value),
    flag: document.getElementById('f-flag').value === '1',
    nama: document.getElementById('f-nama').value.trim()
  };
  try{
    const { error } = await supabase.from('whitelist').insert(payload).single();
    if (error) throw error;
    createState.textContent = 'Berhasil disimpan.';
    form.reset();
    modal.close();
    await loadTable();
  }catch(err){
    console.error(err);
    createState.textContent = 'Gagal menyimpan.';
  }
});

// Timeout sesi tambahan di klien
function updateActivity(){ localStorage.setItem('lastActive', String(Date.now())); }
['click','keydown','mousemove','scroll','visibilitychange'].forEach(ev => {
  document.addEventListener(ev, updateActivity, { passive:true });
});
setInterval(async () => {
  const last = Number(localStorage.getItem('lastActive') || Date.now());
  const diffMin = (Date.now() - last) / 60000;
  if (diffMin > SESSION_INACTIVITY_MINUTES){
    await supabase.auth.signOut();
    window.location.replace('index.html');
  }
}, 15_000);

// Inisialisasi
(async () => {
  const session = await ensureAuth();
  if (session) await loadTable();
})();
