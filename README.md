# ระบบสอบออนไลน์ CEFR A2 (Online Exam)

เว็บแอป static สำหรับสอบวัดระดับ CEFR A1 → A2 · deploy บน **GitHub Pages** · ตรวจคะแนนและเก็บผลด้วย **Google Apps Script + Google Sheet**

- ผู้สอบกรอกชื่อ–นามสกุล → ทำข้อสอบ 50 ข้อ → ส่งคำตอบ
- **ตรวจคะแนนฝั่ง server** (เฉลยไม่อยู่ในโค้ดฝั่งผู้ใช้)
- ผู้สอบ **ไม่เห็นคะแนน** — ดูผลได้เฉพาะหน้าแอดมิน (มีรหัสผ่าน)
- export ผลเป็น CSV ได้

## โครงสร้างไฟล์
```
index.html            หน้ากรอกชื่อ-นามสกุล
exam.html             หน้าทำข้อสอบ
done.html             หน้ายืนยันส่งสำเร็จ (ไม่แสดงคะแนน)
admin.html            หน้าผู้ดูแล (passphrase + ตาราง + export)
assets/css/style.css
assets/js/config.js   *** แก้ API_URL และการตั้งค่าที่นี่ ***
assets/js/api.js      CSV parser + POST helper
assets/js/exam.js
assets/js/admin.js
data/questions_set1.csv   โจทย์ (ไม่มีเฉลย)
data/questions_set2.csv
apps-script/Code.gs   *** วางใน Google Apps Script — เก็บเฉลย+ตรวจคะแนน ***
.nojekyll
```

## ตั้งค่า Backend (ครั้งเดียว)
1. สร้าง Google Sheet ใหม่ 1 ไฟล์
2. `Extensions → Apps Script` วางเนื้อหาจาก `apps-script/Code.gs`
3. แก้ `CONFIG.ADMIN_PASSPHRASE` เป็นรหัสของคุณ (และตั้ง `PASS_PERCENT` ตามต้องการ)
4. `Deploy → New deployment → Web app`
   - **Execute as:** Me
   - **Who has access:** Anyone
5. คัดลอก **Web app URL** (ลงท้าย `/exec`)

## ตั้งค่า Frontend
- เปิด `assets/js/config.js` วาง URL ที่ได้ลงใน `API_URL`
- ตั้งค่าอื่น: `RANDOM_SET`, `REQUIRE_ALL_ANSWERED`, `TIME_LIMIT_MIN`, `PASS_PERCENT`

## Deploy บน GitHub Pages
1. push ทุกไฟล์ขึ้น repo (public บน free plan)
2. `Settings → Pages → Build and deployment → Deploy from a branch`
3. เลือก branch (เช่น `main`) โฟลเดอร์ `/ (root)` → Save
4. เปิด URL ที่ได้ (`https://<user>.github.io/<repo>/`)

## ทดสอบ
- ทำข้อสอบ 1 ครั้ง → ตรวจว่ามีแถวใหม่ในชีต `Results` และผู้สอบไม่เห็นคะแนน
- เปิด `admin.html` → ใส่รหัส → เห็นผล/สรุป/ปุ่ม export

## ข้อควรรู้ด้านความปลอดภัย
- ไฟล์ `data/*.csv` **ต้องไม่มีคอลัมน์เฉลย** (เวอร์ชันนี้ตัดออกแล้ว)
- เฉลยอยู่ใน `Code.gs` ฝั่ง Apps Script เท่านั้น
- passphrase แอดมินถูกตรวจฝั่ง server — อย่าใส่รหัสจริงลงในไฟล์ JS ฝั่ง client
- บน GitHub Pages free plan โค้ด repo เป็น public (ตัวเว็บก็ public) วางแผนเนื้อหาให้เหมาะสม
