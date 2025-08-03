// === COMMON: Supabase init + shared helpers (Diagnostics) ===
const SUPABASE_URL = "https://ucvvgppywnkgoxlqxkpn.supabase.co/"; // GANTI PUNYAMU
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdnZncHB5d25rZ294bHF4a3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjAxODYsImV4cCI6MjA2OTc5NjE4Nn0.DFEXqKTki567d72z0IiQOFZaSzGUEz_stma9NodZLJw"; // GANTI PUNYAMU

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Crypto helpers
function ab2b64(buf){const b=new Uint8Array(buf);let s="";for(let i=0;i<b.byteLength;i++)s+=String.fromCharCode(b[i]);return btoa(s)}
function b642ab(b64){const s=atob(b64);const b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b.buffer}
async function deriveKeyFromPassphrase(passphrase,saltB64){const enc=new TextEncoder();const salt=b642ab(saltB64);const km=await crypto.subtle.importKey("raw",enc.encode(passphrase),{name:"PBKDF2"},false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:310000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
function randomB64(l){const a=new Uint8Array(l);crypto.getRandomValues(a);return ab2b64(a)}
async function encryptText(t,p){const iv=randomB64(12),salt=randomB64(16);const k=await deriveKeyFromPassphrase(p,salt);const enc=new TextEncoder();const c=await crypto.subtle.encrypt({name:"AES-GCM",iv:b642ab(iv)},k,enc.encode(t));return {ciphertext:ab2b64(c),iv,salt}}
async function decryptText({ciphertext,iv,salt},p){const k=await deriveKeyFromPassphrase(p,salt);const buf=await crypto.subtle.decrypt({name:"AES-GCM",iv:b642ab(iv)},k,b642ab(ciphertext));return new TextDecoder().decode(buf)}

window._secureCommon = { supabase, encryptText, decryptText };
