export const SUPABASE_URL = "https://YOUR-PROJECT.ref.supabase.co";
export const SUPABASE_ANON_KEY = "ey...YOUR-ANON-KEY...";
export const SESSION_INACTIVITY_MINUTES = 15;
export const REQUIRE_ADMIN = true;

// CAPTCHA opsional
export const CAPTCHA_PROVIDER = ""; // 'turnstile' | 'hcaptcha' | ''
export const CAPTCHA_SITE_KEY = "";

// Data provider
export const DATA_PROVIDER = 'sheet'; // 'sheet' atau 'supabase'

// Jika 'sheet'
export const SHEET_API_URL = "https://script.google.com/macros/s/DEPLOYMENT_ID/exec";
export const SHEET_TOKEN   = "SHARED_TOKEN";
