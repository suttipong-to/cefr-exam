/**
 * CEFR A2 Online Exam — Google Apps Script backend (Option A)
 * -----------------------------------------------------------
 * หน้าที่:
 *   1) รับคำตอบจากหน้าเว็บ (POST) แล้ว "ตรวจคะแนนฝั่ง server" ด้วยเฉลยด้านล่าง
 *   2) บันทึกผลลงชีต Results (export เป็น CSV ได้)
 *   3) ไม่คืนคะแนนให้ผู้สอบ (คืนแค่ status: ok)
 *   4) หน้าแอดมิน: ตรวจ passphrase ฝั่ง server ก่อนคืนผล
 *
 * ติดตั้ง:
 *   - เปิด Google Sheet ใหม่ 1 ไฟล์ -> Extensions -> Apps Script -> วางโค้ดนี้
 *   - แก้ CONFIG.ADMIN_PASSPHRASE เป็นรหัสของคุณ
 *   - Deploy -> New deployment -> Web app
 *       Execute as: Me | Who has access: Anyone
 *   - คัดลอก Web app URL ไปวางใน assets/js/config.js (API_URL)
 *
 * หมายเหตุ: เฉลยอยู่ในไฟล์นี้เท่านั้น ไม่เคยถูกส่งไปฝั่ง client
 */

const CONFIG = {
  ADMIN_PASSPHRASE: 'CHANGE_ME_admin_2026', // <<< เปลี่ยนก่อนใช้จริง
  PASS_PERCENT: 60,                          // เกณฑ์ผ่าน (%)
  RESULTS_SHEET: 'Results'
};

// เฉลย: { "เลขข้อ": "ตัวเลือกที่ถูก" }  (สร้างจากไฟล์ต้นฉบับ ตรวจแล้ว 0 mismatch)
const ANSWER_KEYS = {
  'Set 1': {"1":"C","2":"D","3":"A","4":"A","5":"B","6":"D","7":"C","8":"A","9":"D","10":"C","11":"B","12":"B","13":"C","14":"C","15":"C","16":"B","17":"A","18":"A","19":"A","20":"B","21":"B","22":"C","23":"A","24":"A","25":"B","26":"C","27":"D","28":"D","29":"D","30":"D","31":"A","32":"B","33":"C","34":"C","35":"B","36":"C","37":"C","38":"B","39":"A","40":"C","41":"D","42":"A","43":"D","44":"B","45":"D","46":"D","47":"D","48":"A","49":"D","50":"B"},
  'Set 2': {"1":"C","2":"D","3":"A","4":"A","5":"B","6":"D","7":"C","8":"A","9":"D","10":"C","11":"B","12":"B","13":"C","14":"C","15":"C","16":"B","17":"A","18":"A","19":"A","20":"B","21":"B","22":"C","23":"A","24":"A","25":"B","26":"C","27":"D","28":"D","29":"D","30":"D","31":"A","32":"B","33":"C","34":"C","35":"B","36":"C","37":"C","38":"B","39":"A","40":"C","41":"D","42":"A","43":"D","44":"B","45":"D","46":"D","47":"D","48":"A","49":"D","50":"B"},
  'Set 3': {"1":"C","2":"D","3":"A","4":"A","5":"B","6":"D","7":"C","8":"A","9":"D","10":"C","11":"B","12":"B","13":"C","14":"C","15":"C","16":"B","17":"A","18":"A","19":"A","20":"B","21":"B","22":"C","23":"A","24":"A","25":"B","26":"C","27":"D","28":"D","29":"D","30":"D","31":"A","32":"B","33":"C","34":"C","35":"B","36":"C","37":"C","38":"B","39":"A","40":"C","41":"D","42":"A","43":"D","44":"B","45":"D","46":"D","47":"D","48":"A","49":"D","50":"B"}
};

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter && (e.parameter.payload || e.parameter.action)) {
      body = e.parameter.payload ? JSON.parse(e.parameter.payload) : e.parameter;
    }
    
    switch (body.action) {
      case 'submit':     return handleSubmit_(body);
      case 'getResults': return handleGetResults_(body);
      default:           return json_({ status: 'ok', message: 'CEFR exam backend is running' });
    }
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  }
}

function handleSubmit_(body) {
  const set = body.set;
  const key = ANSWER_KEYS[set];
  if (!key) return json_({ status: 'error', message: 'invalid set' });

  const answers = body.answers || {};
  const total = Object.keys(key).length;
  let score = 0;
  for (const no in key) {
    const a = answers[no] || answers[String(no)];
    if (a && String(a).toUpperCase() === key[no]) score++;
  }
  const percent = Math.round((score / total) * 1000) / 10;
  const result = percent >= CONFIG.PASS_PERCENT ? 'PASS' : 'FAIL';

  const sheet = getResultsSheet_();
  sheet.appendRow([
    new Date(),
    String(body.firstName || '').trim(),
    String(body.lastName || '').trim(),
    set, score, total, percent, result,
    orderedAnswers_(answers, total),
    Number(body.durationSec || 0)
  ]);

  // ผู้สอบไม่เห็นคะแนน — คืนแค่สถานะ
  return json_({ status: 'ok' });
}

function handleGetResults_(body) {
  if (String(body.passphrase || '') !== CONFIG.ADMIN_PASSPHRASE) {
    return json_({ status: 'error', message: 'unauthorized' });
  }
  const sheet = getResultsSheet_();
  const values = sheet.getDataRange().getValues();
  values.shift(); // ตัด header
  const rows = values.map(function (r) {
    return {
      timestamp: r[0], firstName: r[1], lastName: r[2], set: r[3],
      score: r[4], total: r[5], percent: r[6], result: r[7],
      answers: r[8], durationSec: r[9]
    };
  });
  return json_({ status: 'ok', rows: rows, passPercent: CONFIG.PASS_PERCENT });
}

function getResultsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.RESULTS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.RESULTS_SHEET);
    sheet.appendRow(['timestamp','first_name','last_name','set','score','total','percent','result','answers','duration_sec']);
  }
  return sheet;
}

function orderedAnswers_(answers, total) {
  const out = [];
  for (let i = 1; i <= total; i++) out.push(answers[i] || answers[String(i)] || '-');
  return out.join(',');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
