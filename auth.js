// === INDEX PAGE (LOGIN) ===
const statusEl = document.getElementById("status");
function setStatus(msg) { statusEl.textContent = msg || ""; }

async function signIn() {
  setStatus("Masuk...");
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username !== ALLOWED_USERNAME) { setStatus("Username tidak diizinkan."); return; }

  const email = usernameToEmail(username);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { setStatus("Gagal masuk: " + error.message); return; }

  // Tidak menyimpan password di mana pun; redirect saja
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
