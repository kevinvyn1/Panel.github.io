// Apps Script Web App (target by GID + no auto-create)
const SPREADSHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE';
const SHEET_GID      = 0; // ganti sesuai gid tab
const TOKEN          = 'SHARED_TOKEN';
const CREATED_AT_COL = 0; // set 5 kalau mau timestamp ke kolom E

function _sheet_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets=ss.getSheets();
  for (const s of sheets){ if(s.getSheetId()===SHEET_GID) return s; }
  throw new Error('sheet_not_found');
}

function _outJSONP(e,p){
  const s=JSON.stringify(p);
  const cb=e&&e.parameter&&e.parameter.callback;
  if(cb) return ContentService.createTextOutput(`${cb}(${s})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}
function _json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function _forbidden_(){ return ContentService.createTextOutput('forbidden').setMimeType(ContentService.MimeType.TEXT); }

function doGet(e){
  try{
    if(!e||e.parameter.token!==TOKEN) return _forbidden_();
    const sh=_sheet_();
    const lastRow=sh.getLastRow();
    if(lastRow<1) return _outJSONP(e,[]);
    const values=sh.getRange(1,1,lastRow,Math.min(4,sh.getLastColumn())).getDisplayValues();
    const data=[];
    for(let i=0;i<values.length;i++){
      const r=values[i]; const uid=String(r[0]||'').trim();
      if(!uid) continue;
      data.push({ user_id:uid, angka:String(r[1]||'').trim(), flag:String(r[2]||'0').trim()==='1'||String(r[2]||'').toLowerCase()==='true', nama:String(r[3]||'').trim(), created_at:'' });
    }
    return _outJSONP(e,data);
  }catch(err){
    return _json_({ ok:false, error:String(err) });
  }
}

function doPost(e){
  try{
    if(!e||e.parameter.token!==TOKEN) return _forbidden_();
    const user_id=String(e.parameter.user_id||'').trim();
    const angka=String(e.parameter.angka||'').trim();
    const flag=String(e.parameter.flag||'0')==='1';
    const nama=String(e.parameter.nama||'').trim();
    if(!user_id||!nama) return _json_({ok:false,error:'invalid_input'});
    const sh=_sheet_();
    const nextRow=sh.getLastRow()+1;
    sh.getRange(nextRow,1,1,4).setValues([[user_id, angka, flag?1:0, nama]]);
    if(CREATED_AT_COL>0) sh.getRange(nextRow,CREATED_AT_COL).setValue(new Date());
    return _json_({ok:true});
  }catch(err){
    return _json_({ ok:false, error:String(err) });
  }
}
