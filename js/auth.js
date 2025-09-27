
const COOKIE_KEY = 'auth_token'
const COOKIE_EXP_KEY = 'auth_exp'

function setCookie(name, value, expiresMs) {
  const d = new Date(expiresMs || Date.now() + 2*60*60*1000)
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${d.toUTCString()}; Path=/; SameSite=Strict`
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

function delCookie(name) {
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`
}

export function setSession(token, expMs) {
  setCookie(COOKIE_KEY, token, expMs)
  setCookie(COOKIE_EXP_KEY, String(expMs), expMs)
}

export function clearSession() {
  delCookie(COOKIE_KEY)
  delCookie(COOKIE_EXP_KEY)
}

export function getToken() {
  return getCookie(COOKIE_KEY) || ''
}

export function isExpired() {
  const exp = Number(getCookie(COOKIE_EXP_KEY) || 0)
  return !exp || Date.now() > exp
}

export function isLoggedIn() {
  const t = getToken()
  return Boolean(t) && !isExpired()
}

export async function authFetch(url, init) {
  const token = getToken()
  const headers = new Headers((init && init.headers) || {})
  if (token) headers.set('Authorization', 'Bearer ' + token)
  const res = await fetch(url, { ...(init || {}), headers, credentials: 'same-origin' })
  if (res.status === 401) {
    clearSession()
  }
  return res
}
