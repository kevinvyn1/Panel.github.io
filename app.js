// === KONFIGURASI SUPABASE ===
// Ganti nilai berikut dengan kredensial proyek Anda
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";

// Inisialisasi klien
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === STATE SEDERHANA ===
let currentUser = null;
let currentPassword = null; // dipakai untuk enkripsi/dekripsi di sisi klien

// === ELEMEN DOM ===
const el = (id) => document.getElementById(id);
const statusEl = el("status");
const authSection = el("auth");
const notesSection = el("notes");
const decryptBox = el("decrypt-box");
const decryptPassword = el("decrypt-password");
const noteForm = el("note-form");
const noteInput = el("note-input");
const noteList = el("note-list");

// === UTIL BASE64 <-> ArrayBuffer ===
function ab2b64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function b642ab(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// === KRIPTOGRAFI (Web Crypto) ===
async function deriveKeyFromPassword(password, saltB64) {
  const enc = new TextEncoder();
  const salt = b642ab(saltB64);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 150000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function randomB64(len) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return ab2b64(a);
}

async function encryptText(plainText, password) {
  const ivB64 = randomB64(12); // IV 96-bit untuk GCM
  const saltB64 = randomB64(16); // salt 128-bit untuk PBKDF2
  const key = await deriveKeyFromPassword(password, saltB64);
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: b642ab(ivB64) },
    key,
    enc.encode(plainText)
  );
  return {
    ciphertext: ab2b64(cipherBuf),
    iv: ivB64,
    salt: saltB64,
  };
}

async function decryptText({ ciphertext, iv, salt }, password) {
  const key = await deriveKeyFromPassword(password, salt);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b642ab(iv) },
    key,
    b642ab(ciphertext)
  );
  const dec = new TextDecoder();
  return dec.decode(plainBuf);
}

// === UI HELPER ===
function setStatus(msg) {
  statusEl.textContent = msg || "";
}
function show(elm, show) {
  if (show) elm.classList.remove("hidden");
  else elm.classList.add("hidden");
}

// === AUTH ===
async function signUp() {
  setStatus("Mendaftarkan akun...");
  const email = el("email").value.trim();
  const password = el("password").value;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    setStatus("Gagal daftar: " + error.message);
  } else {
    setStatus("Berhasil daftar. Cek email untuk verifikasi (jika diaktifkan).");
  }
}

async function signIn() {
  setStatus("Masuk...");
  const email = el("email").value.trim();
  const password = el("password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setStatus("Gagal masuk: " + error.message);
    return;
  }
  currentPassword = password; // SIMPAN DI MEMORI (demonstrasi)
  await refreshSession();
  setStatus("Berhasil masuk.");
}

async function signOut() {
  await supabase.auth.signOut();
  currentUser = null;
  currentPassword = null;
  renderAuthState();
}

// Cek sesi awal
async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  currentUser = data?.session?.user ?? null;
  renderAuthState();
  if (currentUser) await loadNotes();
}

function renderAuthState() {
  show(notesSection, !!currentUser);
  show(decryptBox, !!currentUser && !currentPassword);
}

// === CATATAN ===
async function loadNotes() {
  setStatus("Memuat catatan...");
  noteList.innerHTML = "";
  const { data, error } = await supabase.from("notes").select("*").order("inserted_at", { ascending: false });
  if (error) {
    setStatus("Gagal memuat: " + error.message);
    return;
  }
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
        if (!pass) {
          alert("Masukkan password pada kotak dekripsi.");
          return;
        }
        const plain = await decryptText(
          { ciphertext: li.dataset.ciphertext, iv: li.dataset.iv, salt: li.dataset.salt },
          pass
        );
        li.textContent = plain;
      } catch (e) {
        alert("Gagal dekripsi. Password salah?");
      }
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
    alert("Untuk menyimpan catatan terenkripsi, masukkan password saat login terlebih dahulu.");
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
  } catch (err) {
    setStatus("Gagal menyimpan: " + err.message);
  }
});

// Dekripsi massal
el("btn-decrypt-all").addEventListener("click", async () => {
  const pass = currentPassword || decryptPassword.value;
  if (!pass) {
    alert("Masukkan password pada kotak dekripsi.");
    return;
  }
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

// Tombol auth
el("btn-signup").addEventListener("click", signUp);
el("btn-login").addEventListener("click", signIn);
el("btn-logout").addEventListener("click", signOut);

// Pantau perubahan sesi
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  renderAuthState();
  if (currentUser) loadNotes();
});

// Inisialisasi
refreshSession();
