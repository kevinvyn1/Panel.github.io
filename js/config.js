// Konfigurasi sederhana
export const CONFIG = {
  // ================== AUTH ==================
  // Password default untuk login. Ganti di sini atau set lewat DevTools:
  // localStorage.setItem('ADMIN_PASS', 'passwordBaruAnda')
  ADMIN_PASS: 'demo',
  // TTL sesi (hari)
  SESSION_TTL_DAYS: 7,

  // ================== DATA PROVIDER ==================
  // Pilihan: 'mock' | 'apps_script' | 'supabase'
  PROVIDER: 'mock',

  // Apps Script endpoint (Web App /exec). Contoh:
  // 'https://script.google.com/macros/s/AKfycbx.../exec'
  APPS_SCRIPT_URL: '',

  // Supabase (opsional — hanya jika Anda mau pakai)
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: ''
};
