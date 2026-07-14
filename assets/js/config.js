/* ตั้งค่าหลักของระบบสอบ — แก้ค่าตรงนี้ที่เดียว */
window.EXAM_CONFIG = {
  // วาง URL ของ Apps Script Web App ที่ deploy แล้วตรงนี้ (ลงท้ายด้วย /exec)
  API_URL: 'https://script.google.com/macros/s/AKfycbxr17rYHZD1HsJrZ32AJctpY1vc8Ld9nR3uA9sqWDCkzr3bJQXACYjzMsx8wTtUIu_f/exec',

  PASS_PERCENT: 60,            // เกณฑ์ผ่าน (ใช้แสดงผลฝั่ง admin เท่านั้น)
  RANDOM_SET: true,            // true = สุ่มชุดให้ผู้สอบ, false = ให้ผู้สอบเลือกชุดเอง
  REQUIRE_ALL_ANSWERED: true,  // true = ต้องตอบครบทุกข้อก่อนส่ง
  TIME_LIMIT_MIN: 45,           // 0 = ไม่จับเวลา, เช่น 45 = ให้เวลา 45 นาที

  SETS: [
    { id: 'Set 1', file: 'data/questions_set1.csv' },
    { id: 'Set 2', file: 'data/questions_set2.csv' }
  ]
};
