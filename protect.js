// Guard for admin pages
import { isAuthenticated, touchSession } from './auth/auth.js';
export function requireAuth() {
  if (!isAuthenticated()) {
    location.href = 'index.html';
    return;
  }
  // extend session on each visit
  touchSession(60);
}
