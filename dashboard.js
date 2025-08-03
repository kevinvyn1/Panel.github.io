// === DASHBOARD PAGE (E2E notes) ===
const statusEl = document.getElementById("status");
function setStatus(msg) { statusEl.textContent = msg || ""; }
function show(elm, show) { if (show) elm.classList.remove("hidden"); else elm.classList.add("hidden"); }

let currentUser = null;
let passphrase = null; // hanya di memori

const passphraseInput = document.getElementById("enc-passphrase");
const btnSetPass = document.getElementById("btn-set-passphrase");
const btnClearPass = document.getElementById("btn-clear-passphrase");
const noteForm = document.getElementById("note-form");
const noteInput = document.getElementById("note-input");
const noteList = document.getElementById("note-list");
const logoutBtn = document.getElementById("btn-logout");

let idleTimer = null;
const IDLE_MS = 5 * 60 * 1000; // 5 menit
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    passphrase = null;
    setStatus("Passphrase dihapus (idle timeout).");
  }, IDLE_MS);
}
["click","keydown","mousemove","touchstart","scroll"].forEach(evt => {
  window.addEventListener(evt, resetIdleTimer, { passive: true });
});
resetIdleTimer();

async function guard() {
  const { data } = await supabase.auth.getSession();
  currentUser = data?.session?.user ?? null;
  if (!currentUser) { window.location.href = "index.html"; return false; }
  return true;
}

btnSetPass.addEventListener("click", () => {
  const p = passphraseInput.value;
  if (!p) { setStatus("Isi passphrase enkripsi."); return; }
  passphrase = p;
  passphraseInput.value = "";
  setStatus("Passphrase aktif di memori.");
  resetIdleTimer();
});
btnClearPass.addEventListener("click", () => { passphrase = null; setStatus("Passphrase dihapus dari memori."); });

async function loadNotes() {
  setStatus("Memuat catatan...");
  noteList.innerHTML = "";
  const { data, error } = await supabase.from("notes").select("*").order("inserted_at", { ascending: false });
  if (error) { setStatus("Gagal memuat: " + error.message); return; }
  setStatus("");
  for (const row of data) {
    const li = document.createElement("li");
    li.textContent = "(terenkripsi) " + row.content_ciphertext.slice(0, 30) + "...";
    li.dataset.ciphertext = row.content_ciphertext;
    li.dataset.iv = row.iv;
    li.dataset.salt = row.salt;
    li.style.cursor = "pointer";
    li.title = "Klik untuk dekripsi (butuh passphrase)";
    li.addEventListener("click", async () => {
      try {
        if (!passphrase) { alert("Masukkan passphrase enkripsi terlebih dahulu."); return; }
        const plain = await _secureCommon.decryptText(
          { ciphertext: li.dataset.ciphertext, iv: li.dataset.iv, salt: li.dataset.salt },
          passphrase
        );
        li.textContent = plain;
      } catch (e) { alert("Gagal dekripsi. Passphrase salah?"); }
    });
    noteList.appendChild(li);
  }
}

noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = noteInput.value.trim();
  if (!text) return;
  if (!passphrase) { setStatus("Set passphrase enkripsi dulu."); return; }
  setStatus("Menyimpan catatan terenkripsi...");
  try {
    const payload = await _secureCommon.encryptText(text, passphrase);
    const { error } = await supabase.from("notes").insert({
      user_id: currentUser.id,
      content_ciphertext: payload.ciphertext,
      iv: payload.iv,
      salt: payload.salt,
    });
    if (error) throw error;
    noteInput.value = "";
    setStatus("Tersimpan.");
    await loadNotes();
  } catch (err) { setStatus("Gagal menyimpan: " + err.message); }
});

logoutBtn.addEventListener("click", async () => {
  passphrase = null;
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

document.addEventListener("visibilitychange", () => { if (document.hidden) passphrase = null; });

(async () => { if (await guard()) await loadNotes(); })();
supabase.auth.onAuthStateChange((_event, session) => { if (!session?.user) window.location.href = "index.html"; });
