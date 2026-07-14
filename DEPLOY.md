# คู่มือติดตั้งระบบสอบออนไลน์ CEFR A2 (ละเอียดทุกขั้นตอน)

คู่มือนี้พาทำตั้งแต่ศูนย์จนเปิดใช้จริง ใช้เวลาประมาณ 20–30 นาที
ทำ **ตามลำดับ** อย่าข้าม และหยุดเช็คทุกจุดที่มีเครื่องหมาย ✅ ก่อนไปต่อ

**ภาพรวม 6 เฟส**
1. เตรียมของ
2. สร้าง Backend (Google Sheet + Apps Script)
3. ใส่ URL ลงในแอป (config.js)
4. อัปโหลดขึ้น GitHub
5. เปิด GitHub Pages
6. ทดสอบใช้งานจริง

> ต้องมี: บัญชี **Google** 1 บัญชี และบัญชี **GitHub** 1 บัญชี (สมัครฟรีที่ github.com)

---

## เฟส 1 — เตรียมของ

1.1 แตกไฟล์ `cefr-exam-app.zip` จะได้โฟลเดอร์ `scaffold/` ข้างในมีไฟล์เหล่านี้
```
index.html  exam.html  done.html  admin.html  README.md  .nojekyll
assets/     data/     apps-script/Code.gs
```

1.2 เปิดไฟล์ `apps-script/Code.gs` ด้วยโปรแกรมแก้ข้อความ (Notepad, VS Code ฯลฯ) ค้างไว้ เดี๋ยวต้องคัดลอกเนื้อหาทั้งหมด

✅ **เช็ค:** เห็นไฟล์ครบตามด้านบน และเปิด `Code.gs` อ่านได้

---

## เฟส 2 — สร้าง Backend (Google Sheet + Apps Script)

ส่วนนี้คือ "สมอง" ของระบบ เก็บเฉลย ตรวจคะแนน และบันทึกผล

### 2.1 สร้าง Google Sheet
1. เปิด https://sheets.google.com → คลิก **Blank spreadsheet** (สร้างไฟล์ว่าง)
2. ตั้งชื่อไฟล์ (มุมซ้ายบน) เช่น `CEFR Exam Results`
3. **ไม่ต้อง** สร้างหัวตารางเอง สคริปต์จะสร้างชีต `Results` ให้อัตโนมัติ

### 2.2 เปิด Apps Script
1. บนเมนูของ Sheet คลิก **Extensions** → **Apps Script**
2. จะเปิดแท็บใหม่ มีไฟล์ชื่อ `Code.gs` และมีโค้ดตัวอย่าง `function myFunction() {}`
3. **ลบโค้ดตัวอย่างทั้งหมด** (Ctrl+A แล้ว Delete)

### 2.3 วางโค้ดของเรา
1. กลับไปที่ไฟล์ `apps-script/Code.gs` (ที่เปิดค้างไว้จากเฟส 1) → เลือกทั้งหมด (Ctrl+A) → คัดลอก (Ctrl+C)
2. กลับมาที่หน้า Apps Script → วาง (Ctrl+V)

### 2.4 แก้รหัสผ่านแอดมิน (สำคัญมาก)
หาบรรทัดนี้ใกล้ ๆ ด้านบน:
```js
const CONFIG = {
  ADMIN_PASSPHRASE: 'CHANGE_ME_admin_2026', // <<< เปลี่ยนก่อนใช้จริง
  PASS_PERCENT: 60,
```
- เปลี่ยน `'CHANGE_ME_admin_2026'` เป็นรหัสของคุณ เช่น `'RtafExam#2026'` (เก็บเป็นความลับ ใช้เข้าหน้าแอดมิน)
- `PASS_PERCENT: 60` = เกณฑ์ผ่าน 60% ปรับได้ตามต้องการ

### 2.5 บันทึก
คลิกไอคอน 💾 (Save) หรือ Ctrl+S

### 2.6 Deploy เป็น Web app
1. มุมขวาบน คลิกปุ่มสีน้ำเงิน **Deploy** → **New deployment**
2. ในหน้าต่างที่เปิดมา คลิกไอคอนเฟือง ⚙️ (Select type) → เลือก **Web app**
3. ตั้งค่าดังนี้:
   - **Description:** พิมพ์อะไรก็ได้ เช่น `v1`
   - **Execute as:** **Me (อีเมลคุณ)**
   - **Who has access:** **Anyone**  ← ต้องเป็น Anyone เพราะหน้าเว็บสาธารณะต้องเรียกได้
4. คลิก **Deploy**

### 2.7 อนุญาตสิทธิ์ (Authorize) — ทำครั้งเดียว
ครั้งแรกจะให้อนุญาตสิทธิ์:
1. คลิก **Authorize access** → เลือกบัญชี Google ของคุณ
2. ถ้าเจอหน้า **"Google hasn't verified this app"** (เป็นเรื่องปกติเพราะเป็นสคริปต์ของเราเอง):
   - คลิก **Advanced** (มุมล่างซ้าย)
   - คลิก **Go to <ชื่อโปรเจกต์> (unsafe)**
3. คลิก **Allow**

### 2.8 คัดลอก Web app URL
- หลัง Deploy สำเร็จ จะเห็นช่อง **Web app URL** ลงท้ายด้วย `/exec`
  เช่น `https://script.google.com/macros/s/AKfy..../exec`
- คลิก **Copy** เก็บ URL นี้ไว้ (เดี๋ยวใช้ในเฟส 3)

> ⚠️ ต้องเป็น URL ที่ลงท้าย **`/exec`** เท่านั้น ไม่ใช่ `/dev`

### 2.9 ทดสอบ backend
- วาง URL ที่คัดลอกไว้ในเบราว์เซอร์แล้วกด Enter
- ต้องขึ้นข้อความประมาณ `{"status":"ok","message":"CEFR exam backend is running"}`

✅ **เช็ค:** เห็นข้อความ `backend is running` = backend พร้อมแล้ว

---

## เฟส 3 — ใส่ URL ลงในแอป

3.1 เปิดไฟล์ `assets/js/config.js`

3.2 หาบรรทัด:
```js
API_URL: 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',
```
แก้เป็น URL จริงที่คัดลอกจากข้อ 2.8 เช่น:
```js
API_URL: 'https://script.google.com/macros/s/AKfy..../exec',
```

3.3 (ถ้าต้องการ) ปรับตั้งค่าอื่นในไฟล์เดียวกัน:
| ค่า | ความหมาย |
|---|---|
| `RANDOM_SET: true` | สุ่มชุดข้อสอบให้ผู้สอบ (false = ให้เลือกเอง) |
| `REQUIRE_ALL_ANSWERED: true` | บังคับตอบครบก่อนส่ง |
| `TIME_LIMIT_MIN: 0` | 0 = ไม่จับเวลา, ใส่ 45 = ให้ 45 นาที |
| `PASS_PERCENT: 60` | เกณฑ์ผ่าน (ใช้แสดงผลฝั่ง admin) |

3.4 บันทึกไฟล์

✅ **เช็ค:** ใน `config.js` `API_URL` เป็นลิงก์จริงลงท้าย `/exec` แล้ว

---

## เฟส 4 — อัปโหลดขึ้น GitHub

เลือกทำ **วิธี A (ผ่านเว็บ ไม่ต้องใช้คำสั่ง)** หรือ **วิธี B (ใช้ git)**

### วิธี A — อัปโหลดผ่านหน้าเว็บ (แนะนำสำหรับเริ่มต้น)
1. เข้า https://github.com → ล็อกอิน
2. มุมขวาบน คลิก **+** → **New repository**
3. ตั้งชื่อ repo เช่น `cefr-exam` → เลือก **Public** → คลิก **Create repository**
4. ในหน้า repo ว่าง คลิกลิงก์ **uploading an existing file**
5. เปิดโฟลเดอร์ `scaffold/` ในเครื่อง → เลือก **ไฟล์และโฟลเดอร์ทั้งหมดข้างใน** (ไม่ใช่ตัวโฟลเดอร์ scaffold) → ลากมาวางในหน้าอัปโหลด
   > ต้องได้ `index.html` อยู่ที่ระดับบนสุดของ repo พร้อมโฟลเดอร์ `assets/`, `data/`
6. เลื่อนลง คลิก **Commit changes**

> หมายเหตุ: ไฟล์ `.nojekyll` เป็นไฟล์ซ่อน ถ้าลากไม่ติดให้สร้างใหม่ในเว็บ: **Add file → Create new file** → ชื่อ `.nojekyll` → เว้นว่าง → Commit (ช่วยให้ Pages ไม่ประมวลผลด้วย Jekyll)

### วิธี B — ใช้ git (สำหรับคนที่ dev ใน IDE)
```bash
cd scaffold
git init
git add .
git commit -m "CEFR A2 online exam"
git branch -M main
git remote add origin https://github.com/<username>/cefr-exam.git
git push -u origin main
```

✅ **เช็ค:** เปิดหน้า repo เห็น `index.html` อยู่ระดับบนสุด (ไม่ได้ซ้อนอยู่ในโฟลเดอร์ scaffold)

---

## เฟส 5 — เปิด GitHub Pages

1. ในหน้า repo คลิกแท็บ **Settings**
2. เมนูซ้าย คลิก **Pages**
3. หัวข้อ **Build and deployment** → **Source** เลือก **Deploy from a branch**
4. **Branch** เลือก **main** และโฟลเดอร์ **/ (root)** → คลิก **Save**
5. รอ 1–2 นาที รีเฟรชหน้า จะเห็นข้อความ **"Your site is live at"** พร้อมลิงก์
   เช่น `https://<username>.github.io/cefr-exam/`

✅ **เช็ค:** เปิดลิงก์นั้นแล้วเห็นหน้ากรอกชื่อ–นามสกุล

> ถ้าเปิดแล้วขึ้น 404 ให้รออีก 1–2 นาที (ครั้งแรกใช้เวลา build) แล้วรีเฟรช

---

## เฟส 6 — ทดสอบใช้งานจริง (End-to-End)

6.1 **ทดสอบในฐานะผู้สอบ**
- เปิดลิงก์เว็บ → กรอกชื่อ-นามสกุล (เช่น `ทดสอบ ระบบ`) → ติ๊กยินยอม → **เริ่มทำข้อสอบ**
- ลองตอบสัก 2–3 ข้อ (ถ้า `REQUIRE_ALL_ANSWERED: true` ต้องตอบครบ 50 ข้อ; ช่วงทดสอบจะตั้งเป็น false ชั่วคราวก็ได้)
- กด **ส่งคำตอบ** → ต้องไปหน้า **"ส่งคำตอบเรียบร้อยแล้ว"** โดย **ไม่โชว์คะแนน**

6.2 **ตรวจว่าบันทึกผลจริง**
- กลับไปที่ Google Sheet → ต้องมีชีตชื่อ **Results** และมี **แถวใหม่** (เวลา, ชื่อ, นามสกุล, ชุด, คะแนน, ...)

6.3 **ทดสอบหน้าแอดมิน**
- เปิดลิงก์เว็บต่อท้ายด้วย `/admin.html` เช่น `https://<username>.github.io/cefr-exam/admin.html`
- ใส่รหัสที่ตั้งไว้ในข้อ 2.4 → **เข้าสู่ระบบ**
- ต้องเห็นตารางผล + สรุป (จำนวน/เฉลี่ย/%ผ่าน) + ปุ่ม **ดาวน์โหลด CSV**
- ลองกดดาวน์โหลด CSV เปิดดูว่าข้อมูลครบ

✅ **เช็ค:** ครบ 3 ข้อข้างบน = ระบบพร้อมใช้งานจริง 🎉

---

## การใช้งานจริงและการดูแล

**แจกให้ผู้สอบ:** ส่งลิงก์หน้าแรก `https://<username>.github.io/cefr-exam/`
**ลิงก์แอดมิน:** `.../admin.html` — เก็บเป็นความลับ อย่าแจกให้ผู้สอบ

**แก้/เพิ่มข้อสอบ:** แก้ไฟล์ `data/questions_setX.csv` (คอลัมน์ `No,Question,A,B,C,D` เท่านั้น ห้ามใส่เฉลย) แล้ว push/อัปโหลดทับ
> ถ้าเปลี่ยนตัวเลือก/ลำดับข้อ ต้องแก้ **เฉลยใน `Code.gs`** ให้ตรงด้วย แล้ว re-deploy (ดูด้านล่าง)

**เปลี่ยนรหัสแอดมิน หรือแก้ `Code.gs`:** ต้อง deploy เวอร์ชันใหม่บน URL เดิม
1. Apps Script → **Deploy** → **Manage deployments**
2. คลิกดินสอ ✏️ (Edit) ที่ deployment เดิม
3. **Version** เลือก **New version** → **Deploy**
> ⚠️ ถ้าแก้โค้ดแล้วไม่ทำขั้นตอนนี้ URL `/exec` จะยังรันโค้ดเวอร์ชันเก่า

---

## ภาคผนวก — แก้ปัญหาที่พบบ่อย (Troubleshooting)

**ส่งคำตอบไม่สำเร็จ / หน้าเว็บค้าง**
- เช็คว่า `API_URL` ใน `config.js` เป็น URL จริงลงท้าย `/exec`
- เปิด URL นั้นตรง ๆ ต้องขึ้น `backend is running` (ถ้าไม่ขึ้น = deploy ไม่ผ่าน)
- ตรวจว่า Deploy ตั้ง **Who has access = Anyone**

**เปิด admin แล้วขึ้น "รหัสไม่ถูกต้อง"**
- รหัสต้องตรงกับ `ADMIN_PASSPHRASE` ใน `Code.gs` (ตัวพิมพ์เล็ก/ใหญ่มีผล)
- ถ้าเพิ่งแก้รหัสในโค้ด ต้อง re-deploy แบบ New version (ดูหัวข้อด้านบน)

**หน้าเว็บขึ้น 404 บน GitHub Pages**
- รอ build 1–2 นาทีแล้วรีเฟรช
- ตรวจว่า `index.html` อยู่ที่ **root** ของ repo ไม่ได้ซ้อนในโฟลเดอร์ `scaffold/`
- ตรวจว่ามีไฟล์ `.nojekyll` ที่ root

**แก้ Code.gs แล้วไม่มีอะไรเปลี่ยน**
- ต้อง **Manage deployments → Edit → New version → Deploy** (การกด Save เฉย ๆ ไม่พอ)

**ภาษาไทยเพี้ยนตอน export CSV**
- ไฟล์ที่ระบบสร้างมี BOM อยู่แล้ว เปิดด้วย Excel ได้ปกติ; ถ้ายังเพี้ยนให้เปิดผ่าน Google Sheets แทน

**อยากให้ repo เป็น private**
- GitHub Pages จาก repo private ต้องใช้แพ็กเกจ Pro ขึ้นไป และตัวเว็บที่เผยแพร่ยัง public อยู่ดี
- เพราะระบบนี้ตรวจคะแนนฝั่ง server และเฉลยไม่อยู่ฝั่ง client อยู่แล้ว จึงใช้ repo public ได้อย่างปลอดภัย

---

### สรุปสั้น (เช็กลิสต์)
- [ ] สร้าง Sheet + วาง Code.gs + แก้รหัส + Save
- [ ] Deploy Web app (Execute as: Me / Access: Anyone) + Authorize
- [ ] เปิด URL `/exec` เห็น `backend is running`
- [ ] วาง URL ใน `config.js`
- [ ] อัปโหลดขึ้น GitHub (index.html อยู่ root)
- [ ] เปิด Pages (branch main / root)
- [ ] ทดสอบ: ทำข้อสอบ → มีแถวใน Sheet → admin เห็นผล → export ได้
