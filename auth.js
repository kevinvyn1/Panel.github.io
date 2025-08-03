// === INDEX PAGE (LOGIN) ===
let currentPassword = null;

const statusEl = document.getElementById("status");
function setStatus(msg) { statusEl.textContent = msg || ""; }

async function signIn() {
  setStatus("Masuk...");
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  if (username !== ALLOWED_USERNAME) {
    setStatus("Username tidak diizinkan.");
    return;
  }
  const email = usernameToEmail(username);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { setStatus("Gagal masuk: " + error.message); return; }
  // simpan password sementara di sessionStorage agar bisa dipakai dekripsi di dashboard (opsional)
  sessionStorage.setItem("enc_password", password);
  // redirect ke "channel" (dashboard)
  window.location.href = "dashboard.html";
}

document.getElementById("btn-login").addEventListener("click", signIn);

// Auto-redirect jika sudah punya sesi (opsional)
(async () => {
  const { data } = await supabase.auth.getSession();
  if (data?.session?.user) {
    window.location.href = "dashboard.html";
  }
})();
