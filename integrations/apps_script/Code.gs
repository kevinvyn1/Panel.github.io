// === Google Apps Script Web App untuk sinkronisasi Whitelist ===
// Buat spreadsheet dengan sheet bernama 'Whitelist' dan header baris 1:
// A:user_id | B:angka | C:flag | D:nama | E:created_at
// Deploy: Publish → Deploy as web app → Execute as Me → Who has access: Anyone
// Salin URL Web App ke SHEET_API_URL dan set TOKEN ke SHEET_TOKEN di config.js

const SHEET_NAME = 'Whitelist';
const TOKEN = 'SHARED_TOKEN'; // ganti sama nilai di config.js

function _sheet_(){ return SpreadsheetApp.getActive().getSheetByName(SHEET_NAME); }

function doGet(e){
  if (!e || e.parameter.token !== TOKEN) return _forbidden_();
  const sh = _sheet_();
  const values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return _json_([]);

  const [hdr, ...rows] = values;
  const idx = { user_id:0, angka:1, flag:2, nama:3, created_at:4 };

  const data = rows
    .filter(r => (r[idx.user_id] || '').trim() !== '')
    .map(r => ({
      user_id: r[idx.user_id],
      angka: Number(r[idx.angka] || 0),
      flag: (String(r[idx.flag]).trim() === '1' || String(r[idx.flag]).toLowerCase() === 'true'),
      nama: r[idx.nama],
      created_at: r[idx.created_at]
    }));
  return _json_(data);
}

function doPost(e){
  if (!e || (e.parameter.token !== TOKEN)) return _forbidden_();

  // Gunakan form-url-encoded agar tidak perlu preflight CORS
  const user_id = (e.parameter.user_id || '').trim();
  const angka   = Number(e.parameter.angka || 0);
  const flag    = String(e.parameter.flag || '0') === '1';
  const nama    = (e.parameter.nama || '').trim();

  if (!user_id || !nama) return _json_({ ok:false, error:'invalid_input' });

  const sh = _sheet_();
  const now = new Date();
  sh.appendRow([user_id, angka, flag ? 1 : 0, nama, now]);
  return _json_({ ok:true });
}

function _json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _forbidden_(){
  return ContentService.createTextOutput('forbidden').setMimeType(ContentService.MimeType.TEXT);
}
