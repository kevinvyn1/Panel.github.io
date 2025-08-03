// === LOGIN (Diagnostics) ===
(function(){
  const $ = id => document.getElementById(id);
  const statusEl = $('status');
  const diagEl = $('diag');
  const setStatus = msg => { if(statusEl) statusEl.textContent = msg || ''; };
  const log = (...args) => { if(diagEl){ diagEl.textContent += args.join(' ') + '\n'; } console.log(...args); };

  async function diagnose(){
    log('== DIAGNOSE START ==');
    log('SUPABASE_URL =', SUPABASE_URL);
    try{
      const r1 = await fetch(SUPABASE_URL + '/auth/v1/settings', { headers: { apikey: SUPABASE_ANON_KEY } });
      log('GET /auth/v1/settings →', r1.status, r1.statusText);
      const r2 = await fetch(SUPABASE_URL + '/rest/v1/', { headers: { apikey: SUPABASE_ANON_KEY } });
      log('GET /rest/v1/ →', r2.status, r2.statusText);
    }catch(e){ log('Fetch error:', e?.message || e); }
    log('== DIAGNOSE END ==');
  }

  async function signIn(){
    try{
      setStatus('Masuk...');
      const emailEl = $('email'), passEl = $('password');
      if(!emailEl || !passEl){ setStatus('Form tidak lengkap di DOM.'); return; }
      const email = emailEl.value.trim();
      const password = passEl.value;
      const { data, error } = await _secureCommon.supabase.auth.signInWithPassword({ email, password });
      if(error){ setStatus('Gagal masuk: ' + error.message); return; }
      window.location.href = 'dashboard.html';
    }catch(e){
      console.error(e);
      setStatus('Gagal masuk: ' + (e?.message || 'Network/CSP/CORS error'));
    }
  }

  function attach(){
    const btn = $('btn-login'), btnDiag = $('btn-diagnose');
    if(btn) btn.addEventListener('click', signIn);
    if(btnDiag) btnDiag.addEventListener('click', diagnose);
    _secureCommon.supabase.auth.getSession().then(({data}) => { if(data?.session?.user) window.location.href = 'dashboard.html'; });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
})();