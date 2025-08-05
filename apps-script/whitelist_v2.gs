/**
 * WebApp endpoint untuk Whitelist V2
 * Return JSON: [{userid, angka, flag, kode, nama}]
 */
function doGet() {
  const ss = SpreadsheetApp.openById('REPLACE_V2_SHEET_ID');
  const sh = ss.getSheets()[0];
  const values = sh.getDataRange().getValues();
  const out = [];
  values.forEach(r=>{
    out.push({
      userid: r[0],
      angka:  r[1],
      flag:   r[2],
      kode:   r[3],
      nama:   r[4]
    });
  });
  return ContentService.createTextOutput(JSON.stringify(out))
                       .setMimeType(ContentService.MimeType.JSON);
}