import { hasValidSession } from './auth/auth.js';

(function(){
  if (!hasValidSession()) {
    window.location.replace('index.html');
  }
})();
