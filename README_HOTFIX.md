# HOTFIX
- Mengganti import di `js/index.js` menjadi `import * as Auth from './auth.js'` agar kompatibel bila `auth.js` versi lama tidak mengekspor `getSession`.
- Menambah cache-busting `?v=2` pada `index.html` untuk mencegah cache browser.
