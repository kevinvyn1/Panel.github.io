import { clearSession } from './auth/auth.js';
clearSession();
window.location.replace('/auth/login.html');
