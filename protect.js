import { hasValidSession } from './auth/auth.js';

(function(){
  if (!hasValidSession()) {
    const here = window.location.pathname + window.location.search + window.location.hash;
    const target = '/auth/login.html?next=' + encodeURIComponent(here);
    if (window.location.pathname !== '/auth/login.html') {
      window.location.replace(target);
    }
  }
})();
