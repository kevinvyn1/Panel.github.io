import { hasValidSession } from './auth/auth.js';
(function(){
  // Only gatekeep when this file is loaded, which we only include on admin.html
  if (!hasValidSession()) {
    // redirect using relative URL to avoid 404 on Pages subpaths
    window.location.replace('index.html');
  }
})();
