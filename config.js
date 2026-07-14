/* ตั้งค่าหลักของระบบสอบ — แก้ค่าตรงนี้ที่เดียว */
window.EXAM_CONFIG = {
  // วาง URL ของ Apps Script Web App ที่ deploy แล้วตรงนี้ (ลงท้ายด้วย /exec)
  API_URL: 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',

  PASS_PERCENT: 50,            // เกณฑ์ผ่าน (ใช้แสดงผลฝั่ง admin เท่านั้น)
  RANDOM_SET: false,           // false = ให้ผู้สอบกดเลือกชุดเอง, true = สุ่มชุดให้อัตโนมัติ
  REQUIRE_ALL_ANSWERED: true,  // true = ต้องตอบครบทุกข้อก่อนส่ง
  TIME_LIMIT_MIN: 45,           // 0 = ไม่จับเวลา, เช่น 45 = ให้เวลา 45 นาที

  // label = ชื่อที่แสดงบนการ์ด, desc = คำอธิบายใต้ชื่อ
  SETS: [
    { id: 'Set 1', label: 'ชุดที่ 1', desc: '50 ข้อ · ปรนัย 4 ตัวเลือก', file: 'data/questions_set1.csv' },
    { id: 'Set 2', label: 'ชุดที่ 2', desc: '50 ข้อ · ปรนัย 4 ตัวเลือก', file: 'data/questions_set2.csv' }
  ]
};
