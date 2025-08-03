// === COMMON: Supabase init + shared helpers ===
// Rely on RLS for security; anon key is public by design in JAMstack.
const SUPABASE_URL = "https://ucvvgppywnkgoxlqxkpn.supabase.co/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnZncHB5d25rZ294bHF4a3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjAxODYsImV4cCI6MjA2OTc5NjE4Nn0.DFEXqKTki567d72z0IiQOFZaSzGUEz_stma9NodZLJw";

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Username-only mapping (UI gate; keamanan tetap pada Supabase Auth + RLS)
const ALLOWED_USERNAME = "adminis";
const EMAIL_ALIAS_DOMAIN = "example.local";
const usernameToEmail = (u) => `${u}@${EMAIL_ALIAS_DOMAIN}`;

// === Crypto helpers (Web Crypto) ===
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
async function deriveKeyFromPassphrase(passphrase, saltB64) {
  const enc = new TextEncoder();
  const salt = b642ab(saltB64);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 310000, // lebih kuat
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
async function encryptText(plainText, passphrase) {
  const ivB64 = randomB64(12);
  const saltB64 = randomB64(16);
  const key = await deriveKeyFromPassphrase(passphrase, saltB64);
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: b642ab(ivB64) },
    key,
    enc.encode(plainText)
  );
  return { ciphertext: ab2b64(cipherBuf), iv: ivB64, salt: saltB64 };
}
async function decryptText({ ciphertext, iv, salt }, passphrase) {
  const key = await deriveKeyFromPassphrase(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b642ab(iv) },
    key,
    b642ab(ciphertext)
  );
  const dec = new TextDecoder();
  return dec.decode(plainBuf);
}
