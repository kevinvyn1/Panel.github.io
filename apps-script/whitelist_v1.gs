/**
 * WebApp endpoint untuk Whitelist V1
 * Return JSON: [{userid, angka, flag, nama, created}]
 */
function doGet() {
  const ss = SpreadsheetApp.openById('REPLACE_V1_SHEET_ID');
  const sh = ss.getSheets()[0];      // asumsi data di sheet pertama
  const values = sh.getDataRange().getValues();
  const out = [];
  // asumsi header tidak ada; baris pertama data
  values.forEach(r=>{
    out.push({
      userid: r[0],
      angka:  r[1],
      flag:   r[2],
      nama:   r[3],
      created: Utilities.formatDate(new Date(r[4]), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
    });
  });
  return ContentService.createTextOutput(JSON.stringify(out))
                       .setMimeType(ContentService.MimeType.JSON);
}