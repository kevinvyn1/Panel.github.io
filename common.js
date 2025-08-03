// === COMMON: Supabase init + shared helpers ===
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Username-only mapping
const ALLOWED_USERNAME = "adminis";
const EMAIL_ALIAS_DOMAIN = "example.local";
const usernameToEmail = (u) => `${u}@${EMAIL_ALIAS_DOMAIN}`;

// Crypto helpers
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
    { name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" },
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
  const ivB64 = randomB64(12);
  const saltB64 = randomB64(16);
  const key = await deriveKeyFromPassword(password, saltB64);
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: b642ab(ivB64) },
    key,
    enc.encode(plainText)
  );
  return { ciphertext: ab2b64(cipherBuf), iv: ivB64, salt: saltB64 };
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
