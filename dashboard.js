// === DASHBOARD (Diagnostics) ===
(function(){
  const $ = id => document.getElementById(id);
  const setStatus = msg => { const el=$('status'); if(el) el.textContent = msg || ''; };

  let currentUser=null, passphrase=null;
  const passphraseInput = $('enc-passphrase');
  const btnSetPass = $('btn-set-passphrase');
  const btnClearPass = $('btn-clear-passphrase');
  const noteForm = $('note-form');
  const noteInput = $('note-input');
  const noteList = $('note-list');
  const logoutBtn = $('btn-logout');

  let idleTimer=null; const IDLE_MS=5*60*1000;
  function resetIdleTimer(){ if(idleTimer) clearTimeout(idleTimer); idleTimer=setTimeout(()=>{ passphrase=null; setStatus('Passphrase dihapus (idle timeout).'); }, IDLE_MS); }
  ['click','keydown','mousemove','touchstart','scroll'].forEach(evt=>window.addEventListener(evt,resetIdleTimer,{passive:true})); resetIdleTimer();

  async function guard(){
    const { data } = await _secureCommon.supabase.auth.getSession();
    currentUser = data?.session?.user ?? null;
    if(!currentUser){ window.location.href='index.html'; return false; }
    return true;
  }

  function wireUI(){
    if(btnSetPass) btnSetPass.addEventListener('click', ()=>{ const p=passphraseInput?.value||''; if(!p){ setStatus('Isi passphrase enkripsi.'); return; } passphrase=p; if(passphraseInput) passphraseInput.value=''; setStatus('Passphrase aktif di memori.'); resetIdleTimer(); });
    if(btnClearPass) btnClearPass.addEventListener('click', ()=>{ passphrase=null; setStatus('Passphrase dihapus dari memori.'); });
    if(noteForm) noteForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const text = noteInput?.value?.trim(); if(!text) return;
      if(!passphrase){ setStatus('Set passphrase enkripsi dulu.'); return; }
      setStatus('Menyimpan catatan terenkripsi...');
      try{
        const payload = await _secureCommon.encryptText(text, passphrase);
        const { error } = await _secureCommon.supabase.from('notes').insert({
          user_id: currentUser.id,
          content_ciphertext: payload.ciphertext,
          iv: payload.iv,
          salt: payload.salt,
        });
        if(error) throw error;
        if(noteInput) noteInput.value='';
        setStatus('Tersimpan.');
        await loadNotes();
      }catch(err){ setStatus('Gagal menyimpan: ' + err.message); }
    });
    if(logoutBtn) logoutBtn.addEventListener('click', async ()=>{ passphrase=null; await _secureCommon.supabase.auth.signOut(); window.location.href='index.html'; });
    document.addEventListener('visibilitychange', ()=>{ if(document.hidden) passphrase=null; });
  }

  async function loadNotes(){
    setStatus('Memuat catatan...');
    if(noteList) noteList.innerHTML='';
    const { data, error } = await _secureCommon.supabase.from('notes').select('*').order('inserted_at',{ascending:false});
    if(error){ setStatus('Gagal memuat: ' + error.message); return; }
    setStatus('');
    if(!noteList) return;
    for(const row of data){
      const li=document.createElement('li');
      li.textContent='(terenkripsi) ' + row.content_ciphertext.slice(0,30) + '...';
      li.dataset.ciphertext=row.content_ciphertext; li.dataset.iv=row.iv; li.dataset.salt=row.salt;
      li.style.cursor='pointer'; li.title='Klik untuk dekripsi';
      li.addEventListener('click', async ()=>{
        try{
          if(!passphrase){ alert('Masukkan passphrase.'); return; }
          const plain = await _secureCommon.decryptText({ciphertext:li.dataset.ciphertext,iv:li.dataset.iv,salt:li.dataset.salt}, passphrase);
          li.textContent=plain;
        }catch(e){ alert('Dekripsi gagal. Passphrase salah?'); }
      });
      noteList.appendChild(li);
    }
  }

  async function init(){
    wireUI();
    if(await guard()) await loadNotes();
    _secureCommon.supabase.auth.onAuthStateChange((_e, s)=>{ if(!s?.user) window.location.href='index.html'; });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();