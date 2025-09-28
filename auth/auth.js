// Safe session helpers backed by localStorage
const KEY = "session";
function safeRead() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function safeWrite(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch {}
}
export function setSession(payload, maxAgeMinutes = 60) {
  const exp = Date.now() + Math.max(1, maxAgeMinutes) * 60 * 1000;
  safeWrite({ ...payload, exp });
}
export function getSession() {
  return safeRead();
}
export function isAuthenticated() {
  const s = safeRead();
  return !!(s && typeof s.exp === "number" && s.exp > Date.now());
}
export function touchSession(minutes = 60) {
  const s = safeRead();
  if (!s) return;
  s.exp = Date.now() + Math.max(1, minutes) * 60 * 1000;
  safeWrite(s);
}
export function clearSession() {
  try { localStorage.removeItem(KEY); } catch {}
}
