// Apps Script Web App (JSONP + Spreadsheet ID)
const SPREADSHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME     = 'WLS (ANT)';
const TOKEN          = 'SHARED_TOKEN';
function _sheet_(){ const ss=SpreadsheetApp.openById(SPREADSHEET_ID); let sh=ss.getSheetByName(SHEET_NAME);
  if(!sh){ sh=ss.insertSheet(SHEET_NAME); sh.getRange(1,1,1,5).setValues([['user_id','angka','flag','nama','created_at']]); } return sh; }
function doGet(e){ if(!e||e.parameter.token!==TOKEN) return _forbidden_(); const sh=_sheet_(); const values=sh.getDataRange().getDisplayValues();
  let data=[]; if(values.length>1){ const [hdr,...rows]=values; const idx={user_id:0,angka:1,flag:2,nama:3,created_at:4};
    data=rows.filter(r=>(r[idx.user_id]||'').trim()!=='').map(r=>({ user_id:r[idx.user_id], angka:Number(r[idx.angka]||0), flag:(String(r[idx.flag]).trim()==='1'||String(r[idx.flag]).toLowerCase()==='true'), nama:r[idx.nama], created_at:r[idx.created_at] })); }
  const cb=e.parameter.callback; const payload=JSON.stringify(data); if(cb){ return ContentService.createTextOutput(`${cb}(${payload})`).setMimeType(ContentService.MimeType.JAVASCRIPT); }
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON); }
function doPost(e){ if(!e||(e.parameter.token!==TOKEN)) return _forbidden_(); const user_id=(e.parameter.user_id||'').trim(); const angka=Number(e.parameter.angka||0); const flag=String(e.parameter.flag||'0')==='1'; const nama=(e.parameter.nama||'').trim();
  if(!user_id||!nama) return _json_({ok:false,error:'invalid_input'}); const sh=_sheet_(); sh.appendRow([user_id, angka, flag?1:0, nama, new Date()]); return _json_({ok:true}); }
function _json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function _forbidden_(){ return ContentService.createTextOutput('forbidden').setMimeType(ContentService.MimeType.TEXT); }
