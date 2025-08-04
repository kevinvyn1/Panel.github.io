// Salin file ini menjadi js/config.js lalu isi dengan kredensial proyek Anda.
// Perhatian: HANYA gunakan ANON KEY di sisi klien. JANGAN pernah mengekspos service_role key.
export const SUPABASE_URL = "https://lnmlsrvdjnhnfrcmnqgr.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubWxzcnZkam5obmZyY21ucWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzQ4MzMsImV4cCI6MjA2OTg1MDgzM30.6SenlB4sNkzbrvmI_diD6-oxVPXE6sZyESbfoT3l1sQ";
export const SESSION_INACTIVITY_MINUTES = 15;
export const REQUIRE_ADMIN = true;

// Bot Protection
export const CAPTCHA_PROVIDER = "hcaptcha";   // atau "hcaptcha"
export const CAPTCHA_SITE_KEY = "d87070f2-8a06-40aa-90d8-e186f224c03a";


// Sumber data whitelist: 'supabase' atau 'sheet'
export const DATA_PROVIDER = 'sheet';

// Jika DATA_PROVIDER === 'sheet', isi URL Web App (Apps Script) dan token bersama
export const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbypoWegPze9QH5ZwCHQoT1li0grTiUa49yy83jfi6KdP9kN3X88VsBsWLjwvDVKt4zX/exec";
export const SHEET_TOKEN   = "2099812378781239012221";