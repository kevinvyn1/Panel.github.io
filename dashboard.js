// === DASHBOARD PAGE (CHANNEL) ===
const statusEl = document.getElementById("status");
function setStatus(msg) { statusEl.textContent = msg || ""; }
function show(elm, show) { if (show) elm.classList.remove("hidden"); else elm.classList.add("hidden"); }

let currentUser = null;
let currentPassword = sessionStorage.getItem("enc_password") || null;

const decryptBox = document.getElementById("decrypt-box");
const decryptPassword = document.getElementById("decrypt-password");
const noteForm = document.getElementById("note-form");
const noteInput = document.getElementById("note-input");
const noteList = document.getElementById("note-list");
const logoutBtn = document.getElementById("btn-logout");

async function guard() {
  const { data } = await supabase.auth.getSession();
  currentUser = data?.session?.user ?? null;
  if (!currentUser) {
    // tidak ada sesi, balik ke login
    window.location.href = "index.html";
    return false;
  }
  renderAuthState();
  return true;
}

function renderAuthState() {
  show(decryptBox, !!currentUser && !currentPassword);
}

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
    li.title = "Klik untuk dekripsi (butuh password)";
    li.addEventListener("click", async () => {
      try {
        const pass = currentPassword || decryptPassword.value;
        if (!pass) { alert("Masukkan password pada kotak dekripsi."); return; }
        const plain = await decryptText(
          { ciphertext: li.dataset.ciphertext, iv: li.dataset.iv, salt: li.dataset.salt },
          pass
        );
        li.textContent = plain;
      } catch (e) { alert("Gagal dekripsi. Password salah?"); }
    });
    noteList.appendChild(li);
  }
}

noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const text = noteInput.value.trim();
  if (!text) return;
  if (!currentPassword) {
    alert("Untuk menyimpan catatan terenkripsi, masukkan password pada kotak dekripsi atau login ulang.");
    return;
  }
  setStatus("Menyimpan catatan terenkripsi...");
  try {
    const payload = await encryptText(text, currentPassword);
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

document.getElementById("btn-decrypt-all").addEventListener("click", async () => {
  const pass = currentPassword || decryptPassword.value;
  if (!pass) { alert("Masukkan password pada kotak dekripsi."); return; }
  for (const li of noteList.querySelectorAll("li")) {
    try {
      const plain = await decryptText(
        { ciphertext: li.dataset.ciphertext, iv: li.dataset.iv, salt: li.dataset.salt },
        pass
      );
      li.textContent = plain;
    } catch {}
  }
});

logoutBtn.addEventListener("click", async () => {
  sessionStorage.removeItem("enc_password");
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// Init
(async () => {
  if (await guard()) {
    await loadNotes();
  }
})();

// Pantau perubahan sesi
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  if (!currentUser) window.location.href = "index.html";
});
