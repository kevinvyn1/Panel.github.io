import * as CFG from './config.js';
const STORE_KEY='session.v1';const ADMIN_PASS=CFG.ADMIN_PASS||localStorage.getItem('ADMIN_PASS')||'demo';const INACT_MIN=Number(CFG.SESSION_INACTIVITY_MINUTES||15);function now(){return Date.now()}const MIN=60*1000;
export function getSession(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return null;const s=JSON.parse(raw);if(!s?.token)return null;if(s?.last&&(now()-s.last)>INACT_MIN*MIN){localStorage.removeItem(STORE_KEY);return null}return s}catch{return null}}
function touch(){const s=getSession();if(!s)return;s.last=now();localStorage.setItem(STORE_KEY,JSON.stringify(s))}
['click','keydown','mousemove','touchstart','scroll','visibilitychange'].forEach(evt=>{document.addEventListener(evt,()=>{if(!document.hidden)touch()},{passive:true})});
setInterval(()=>{const s=getSession();if(!s)return;if((now()-s.last)>INACT_MIN*MIN){clearSession();alert('Sesi berakhir karena tidak aktif.');location.replace('index.html?next='+encodeURIComponent(location.pathname))}},30*1000);
export function setSession(token){localStorage.setItem(STORE_KEY,JSON.stringify({token,last:now()}))}
export function clearSession(){localStorage.removeItem(STORE_KEY)}
export function requireAuth(){if(CFG.REQUIRE_ADMIN===false)return;const s=getSession();if(!s){const next=encodeURIComponent(location.pathname.replace(/\+/g,'/'));location.replace(`index.html?next=${next}`);throw new Error('Unauthenticated')}}
export async function login({password,captchaToken}){if(CFG.CAPTCHA_PROVIDER&&String(CFG.CAPTCHA_PROVIDER).toLowerCase()==='hcaptcha'){if(!captchaToken)throw new Error('Captcha belum terverifikasi')}await new Promise(r=>setTimeout(r,150));if(password===ADMIN_PASS){const token=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);setSession(token);return true}throw new Error('Password salah')}
export function logout(){clearSession();const next=encodeURIComponent(location.pathname.replace(/\+/g,'/'));location.replace(`index.html?next=${next}`)}
