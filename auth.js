// === INDEX PAGE (LOGIN: email+password only) ===
const statusEl = document.getElementById("status");
function setStatus(msg) { statusEl.textContent = msg || ""; }

async function signIn() {
  try {
    setStatus("Masuk...");
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setStatus("Gagal masuk: " + error.message); return; }
    window.location.href = "dashboard.html";
  } catch (e) {
    console.error(e);
    setStatus("Gagal masuk: " + (e?.message || "Network/CSP/CORS error"));
  }
}

document.getElementById("btn-login").addEventListener("click", signIn);

// Auto-redirect jika sudah punya sesi
(async () => {
  const { data } = await supabase.auth.getSession();
  if (data?.session?.user) window.location.href = "dashboard.html";
})();
