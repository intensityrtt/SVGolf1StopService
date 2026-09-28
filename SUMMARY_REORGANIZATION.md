# 📋 รายงานสรุปการจัดระเบียบโครงสร้างระบบและคู่มือเตรียมนำขึ้น GitHub
## โครงการ: SV.GOLF One Stop Service Platform
**สำนักงานเขตพื้นที่การศึกษาประถมศึกษาน่าน เขต 1 (สพป.น่าน เขต 1)**  
**ผู้พัฒนา:** นายพุฒิพงษ์ วงศ์นันท์ (ศึกษานิเทศก์ สพป.น่าน เขต 1)  
**วันที่จัดระเบียบ:** 28 กันยายน 2569  

---

## 🎯 1. ที่มาและวัตถุประสงค์ของการจัดระเบียบใหม่

จากการตรวจสอบสถานะเดิมของไดเรกทอรีโครงการ พบว่ามีไฟล์และโฟลเดอร์สะสมอยู่รวมกันใน Root Directory มากกว่า **50 รายการ** ในลักษณะกระจัดกระจาย (สะเปะสะปะ) ส่งผลให้:
1. **โค้ดหลังบ้าน (Backend .gs) และหน้าตาเว็บ (Frontend .html) ปะปนกับเอกสารและรูปภาพ**
2. **มีไฟล์ขยะและไฟล์ดัมพ์ขนาดใหญ่มาก**: โดยเฉพาะไฟล์ Base64 Text Dump (`INDEX_B64.txt` ขนาด 1.2 MB, `b64.txt` ขนาด 598 KB) และไฟล์ HTML ทดสอบที่มี Base64 ฝังอยู่ข้างใน (`SvGolf-Index-Welcome.html` ขนาด 604 KB) ซึ่งหากนำขึ้น GitHub จะทำให้ Repository หน่วงและเปลืองพื้นที่โดยไม่จำเป็น
3. **มีไฟล์เสมือนของ Google Drive for Desktop**: ไฟล์นามสกุล `.gsheet` และ `.gscript` ซึ่งเป็น Cloud Pointer (Reparse Point) ของ Google Drive หากถูก Commit หรือเปลี่ยนแปลงอาจส่งผลกระทบต่อไฟล์บน Cloud
4. **มีไฟล์ระบบของระบบปฏิบัติการ Windows**: ไฟล์ `desktop.ini` ซ่อนอยู่ในหลายโฟลเดอร์
5. **ขาดไฟล์โครงสร้างมาตรฐานสากล**: ยังไม่มี `.gitignore`, `.gitattributes`, `appsscript.json`, และ `README.md` สำหรับ GitHub

**การดำเนินการจัดระเบียบครั้งนี้มีเป้าหมายเพื่อ:**
- จัดหมวดหมู่ไฟล์ให้เป็นสัดส่วนตามมาตรฐานสากลและแนวทางของ **Google Apps Script + Clasp + GitHub**
- แยกไฟล์ที่ต้องใช้งานจริง ออกจากไฟล์สำรอง (Backup) และไฟล์ขยะ (Garbage Dumps)
- ป้องกันไม่ให้ไฟล์ขยะหรือไฟล์ที่ไม่เกี่ยวข้องถูก Push ขึ้น GitHub
- เตรียมความพร้อม 100% ให้สามารถใช้คำสั่ง Git เพื่อ Push โค้ดขึ้น GitHub และเปิดใช้งาน GitHub Pages ได้ทันที

---

## 🏗️ 2. แผนผังโครงสร้างไดเรกทอรีใหม่ (New Project Structure)

```text
SVGolf1StopService/
│
├── 📄 .gitignore                   # กฎยกเว้นไฟล์ขยะ, ไฟล์ OS, Google Drive Links และ Archive
├── 📄 .gitattributes               # บังคับการจัดรูปแบบ Line Ending (LF) และ UTF-8
├── 📄 appsscript.json              # Manifest การทำงานของ Google Apps Script (TimeZone, Runtime V8)
├── 📄 .clasp.json.example          # แม่แบบไฟล์คอนฟิกสำหรับเครื่องมือ Google Clasp CLI
├── 📄 README.md                    # เอกสารแนะนำโครงการอย่างเป็นทางการบนหน้าหลัก GitHub
├── 📄 SUMMARY_REORGANIZATION.md    # รายงานสรุปการจัดระเบียบและคู่มือ Git ฉบับนี้
│
├── 🌐 index.html                   # เว็บพอร์ทัลหน้าแรก (Single-Page Iframe Loader สำหรับ GitHub Pages)
│
├── 📁 src/                         # ซอร์สโค้ดสำหรับ Google Apps Script (Code & Templates)
│   ├── appsscript.json             # Manifest ประจำโฟลเดอร์ซอร์สโค้ด
│   ├── SvGolf-Index-Welcome.gs     # Backend หลัก: Router, Admin, Dashboard, Supervision, Security
│   ├── NAN1_RT_Toolkit.gs          # Backend: RT Toolkit V.1 สร้างแบบฝึกทักษะ
│   ├── RT_Assessment_online.gs     # Backend: ระบบจัดสอบและประเมินผล Pre-RT Online
│   ├── RT_NT_Management.gs         # Backend: ระบบบริหารจัดการงานสอบ RT-NT
│   ├── Online_Meeting.gs           # Backend: ระบบลงทะเบียนและจัดกิจกรรมประชุมออนไลน์
│   ├── P1_OnDemand_Backend.gs      # Backend: การเรียนรู้เชิงรุก On-Demand ป.1
│   │
│   ├── html_welcome.html           # Template: หน้าต้อนรับ (Splash Screen แบบโหลดภาพไดนามิก)
│   ├── html_dashboard.html         # Template: หน้าแดชบอร์ดศูนย์รวมบริการหลัก
│   ├── html_admin.html             # Template: แผงควบคุมระบบสำหรับผู้ดูแลระบบ
│   ├── html_manual.html            # Template: ศูนย์รวมคู่มือการใช้งานระบบ
│   ├── html_closed.html            # Template: หน้าแจ้งเตือนเมื่อระบบถูกสั่งปิดชั่วคราว
│   │
│   ├── html_supervision.html       # Template: แอปพลิเคชันนิเทศติดตามการเปิดภาคเรียน
│   ├── html_supervision_report.html # Template: หน้ารายงานผลการนิเทศฉบับทางการ
│   ├── html_classroom_obs.html     # Template: ระบบบันทึกการสังเกตชั้นเรียน
│   ├── html_classroom_obs_report.html # Template: รายงานผลการสังเกตชั้นเรียน
│   │
│   ├── html_toolkit.html           # Template: ระบบสร้างใบงาน RT Toolkit
│   ├── html_assessment.html        # Template: หน้าจอระบบประเมิน Pre-RT Online
│   ├── html_management.html        # Template: หน้าจอจัดการข้อมูล RT-NT
│   │
│   ├── html_meeting.html           # Template: หน้าลงทะเบียน/เช็คอินประชุมออนไลน์
│   ├── html_meeting_admin.html     # Template: แผงควบคุมการประชุมสำหรับ Admin
│   ├── html_meeting_success.html   # Template: หน้าแสดงผลเมื่อลงชื่อสำเร็จ
│   │
│   ├── html_system5.html           # Template: เมนูระบบเสริม 5
│   ├── html_system6.html           # Template: แดชบอร์ดสรุปคะแนน O-NET/RT/NT ย้อนหลัง
│   ├── html_onet_bank.html         # Template: หน้าทางเข้าคลังข้อสอบ O-NET อัจฉริยะ
│   ├── html_onet_nanoy2.html       # Template: วิเคราะห์คะแนน O-NET อำเภอนาน้อย
│   ├── html_rt_nanoy2.html         # Template: วิเคราะห์คะแนน RT อำเภอนาน้อย
│   ├── html_nt_nanoy2.html         # Template: วิเคราะห์คะแนน NT อำเภอนาน้อย
│   └── html_p1_ondemand.html       # Template: ระบบ Active Learning ป.1 On-Demand
│
├── 📁 docs/                        # เอกสารโครงการและคู่มือการใช้งาน
│   ├── USER_MANUAL.md              # คู่มือการใช้งานระบบฉบับละเอียด (สำหรับครู/ผู้บริหาร/ศน.)
│   ├── PROJECT_SUMMARY.md          # สรุปภาพรวมและบันทึกข้อมูลทางเทคนิคของโครงการ
│   └── references/                 # เอกสารอ้างอิงและระเบียบทางราชการ
│       ├── 2.มาตรฐานตำแหน่งมาตรฐานวิทยฐานะ(ว 19-2567).pdf
│       └── 3.กรอบงานกลุ่มนิเทศ.pdf
│
├── 📁 assets/                      # ทรัพยากร ไฟล์รูปภาพ และสื่อประกอบ
│   ├── images/
│   │   └── INDEX.png               # ภาพแบนเนอร์และ Splash Screen หลักของระบบ
│   └── evidence/                   # ภาพหลักฐานกิจกรรมและการประชุม
│       ├── RT_นาย_นาง_นางสาว.jpg
│       ├── RT_นาย_นางสาว.jpg
│       └── RT_QRCode_1780972990971.jpg
│
├── 📁 modules/                     # โครงการย่อยที่มีทรัพยากรเฉพาะ
│   └── p1_ondemand/                # ทรัพยากรของโครงการ Active Learning ป.1
│       ├── index.html              # พอร์ทัล Iframe เฉพาะส่วน On-Demand
│       ├── คู่มือ al สำหรับครู สมบูรณ์.pdf
│       ├── รายละเอียดจ้างเหมาเครื่องเสียง.docx
│       └── รายละเอียดจ้างเหมาเครื่องเสียง (1).docx
│
└── 📁 archive/                     # คลังไฟล์เก่า ไฟล์ขยะ และไฟล์สำรอง (ถูก ignore จาก Git)
    ├── legacy_scripts/             # สคริปต์เก่าที่ไม่ถูกเรียกใช้แล้ว
    │   ├── SV.Golf-indexGS.gs
    │   ├── RT_Assessment_online_backup.gs
    │   └── SvGolf-Index-Welcome.html
    └── temp_dumps/                 # ไฟล์ Base64 Dump และข้อความชั่วคราว
        ├── b64.txt
        ├── INDEX_B64.txt
        └── temp_assessment.txt
```

---

## 📊 3. ตารางสรุปการจัดหมวดหมู่และย้ายไฟล์ (File Mapping Table)

| รายการไฟล์เดิม | ตำแหน่งและชื่อใหม่ | หมวดหมู่ | เหตุผลและหน้าที่ |
|---|---|---|---|
| `SvGolf-Index-Welcome.gs` | `src/SvGolf-Index-Welcome.gs` | Code | Backend หลัก จัดการ Routing, Dashboard, Admin และ Supervision |
| `NAN1 RT Toolkit.gs` | `src/NAN1_RT_Toolkit.gs` | Code | เปลี่ยนชื่อตัดช่องว่าง เพื่อความปลอดภัยของ Git/CLI |
| `RT_Assessment_online.gs` | `src/RT_Assessment_online.gs` | Code | Backend ระบบ Pre-RT Assessment Center |
| `RT_NT-Management.gs` | `src/RT_NT_Management.gs` | Code | Backend ระบบบริหารจัดการข้อมูล RT-NT |
| `ระบบประชุมOnline.gs` | `src/Online_Meeting.gs` | Code | เปลี่ยนชื่อเป็นภาษาอังกฤษมาตรฐาน ป้องกัน Encoding ใน Git |
| `p1_ondemand_backend.gs` | `src/P1_OnDemand_Backend.gs` | Code | Backend ระบบ Active Learning ภาษาไทย ป.1 |
| `html_*.html` (22 ไฟล์) | `src/html_*.html` | Template | ย้ายเข้ารวมใน `src/` เพื่อให้ Clasp และ Apps Script ทำงานตรงกัน |
| `index.html` | `index.html` (คงเดิมที่ Root) | Web | หน้า Portal หลักสำหรับเปิดใช้งาน GitHub Pages ได้ทันที |
| `USER_MANUAL.md` | `docs/USER_MANUAL.md` | Docs | คู่มือการใช้งานระบบสำหรับผู้ใช้ทั่วไป |
| `PROJECT_SUMMARY.md` | `docs/PROJECT_SUMMARY.md` | Docs | สรุปภาพรวมและบันทึกทางเทคนิคของโครงการ |
| ไฟล์ใน `เอกสารอ้างอิง/` | `docs/references/*` | Docs | รวมเอกสารมาตรฐานวิทยฐานะ และกรอบงานนิเทศ |
| `INDEX.png` | `assets/images/INDEX.png` | Assets | ภาพแบรนด์ดิงและหน้าต้อนรับ |
| ไฟล์ใน `เก็บหลักฐานการประชุม/` | `assets/evidence/*` | Assets | รูปภาพและ QR Code การประชุม |
| ไฟล์ใน `P1-AL-On-demand/` | `modules/p1_ondemand/*` | Modules | รวมคู่มือครูและเอกสารจัดจ้างโครงการ ป.1 |
| `SV.Golf-indexGS.gs` | `archive/legacy_scripts/` | Archive | สคริปต์ doGet เก่าที่ซ้ำซ้อนและไม่ได้ใช้งานแล้ว |
| `RT_Assessment_online_backup.gs` | `archive/legacy_scripts/` | Archive | สคริปต์ Backup เก่า |
| `SvGolf-Index-Welcome.html` | `archive/legacy_scripts/` | Archive | ไฟล์ HTML ทดสอบเดิมที่ฝัง Base64 600 KB ซ้ำซ้อน |
| `b64.txt` & `INDEX_B64.txt` | `archive/temp_dumps/` | Archive | ไฟล์ดัมพ์ Base64 รวมกว่า 1.8 MB |
| `temp_assessment.txt` | `archive/temp_dumps/` | Archive | ไฟล์ HTML ชั่วคราวที่สร้างขึ้นระหว่างพัฒนา |
| `*.gsheet`, `*.gscript` | *ถูกคงไว้ที่เดิมแต่เพิ่มใน .gitignore* | Cloud Link | ป้องกันการลบข้อมูลจริงใน Google Drive และไม่ให้ขึ้น Git |
| `desktop.ini` | *ลบ / เพิ่มใน .gitignore* | System | ไฟล์ระบบของ Windows ไม่จำเป็นต้องนำขึ้น Git |

---

## 🗑️ 4. การจัดการไฟล์ขยะและลดขนาดโครงการ (Optimization)

| กลุ่มไฟล์ | ขนาดเดิม | การจัดการ | ประโยชน์ที่ได้รับ |
|---|---|---|---|
| **Base64 Text Dumps** (`b64.txt`, `INDEX_B64.txt`) | **~1.8 MB** | ย้ายเข้า `archive/temp_dumps/` และใส่ใน `.gitignore` | ประหยัดขนาด Git Repository ทันทีเกือบ 2 MB |
| **Redundant Large HTML** (`SvGolf-Index-Welcome.html`) | **~604 KB** | ย้ายเข้า `archive/legacy_scripts/` | ป้องกันการสับสนกับ `html_welcome.html` ที่ใช้จริง |
| **Temporary Dumps** (`temp_assessment.txt`) | **~43 KB** | ย้ายเข้า `archive/temp_dumps/` | ล้างไฟล์ที่ไม่จำเป็นออกจากสายตา |
| **รวมขนาดที่ลดได้ใน Git** | **> 2.4 MB** | **สะอาด ปลอดภัย รวดเร็ว** | **ประวัติ Git ไม่บวม และ Clone ได้รวดเร็ว** |

---

## 🚀 5. คู่มือการนำระบบขึ้น GitHub ทีละขั้นตอน (Step-by-Step Git Guide)

ทำตามขั้นตอนด้านล่างนี้ผ่านโปรแกรม **PowerShell** หรือ **Git Bash** ที่เครื่องของคุณ:

### ขั้นที่ 1: ตรวจสอบและตั้งค่า Git PATH (ในกรณีที่ระบบแจ้งว่าไม่พบคำสั่ง git)
เปิด **PowerShell** แล้วพิมพ์คำสั่ง:
```powershell
$env:PATH += ";C:\Program Files\Git\cmd"
git --version
```
*(หากแสดงผล เช่น `git version 2.x.x` แสดงว่าพร้อมใช้งาน)*

---

### ขั้นที่ 2: ไปยังโฟลเดอร์ของโครงการ
```powershell
cd "G:\My Drive\SVGolf1StopService"
```

---

### ขั้นที่ 3: กำหนดตัวตนผู้ใช้งาน Git (หากยังไม่เคยตั้งค่า)
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@gmail.com"
```

---

### ขั้นที่ 4: สั่ง Initialize และเตรียมไฟล์ขึ้น Staging
```powershell
# 1. สร้าง Git Repository ภายในโฟลเดอร์
git init

# 2. เพิ่มไฟล์ทั้งหมดที่ผ่านการคัดกรองโดย .gitignore แล้ว
git add .

# 3. ตรวจสอบสถานะไฟล์ (จะเห็นเฉพาะไฟล์ที่จัดระเบียบแล้ว)
git status
```

---

### ขั้นที่ 5: Commit โค้ดครั้งแรก (Initial Commit)
```powershell
git commit -m "feat: reorganize project structure and prepare for GitHub deployment"
```

---

### ขั้นที่ 6: สร้าง Repository บน GitHub
1. เข้าไปที่ [GitHub.com](https://github.com/) และลงชื่อเข้าใช้
2. คลิกปุ่ม **New** (สร้าง Repository ใหม่)
3. ตั้งชื่อ Repository เช่น: `SVGolf1StopService`
4. เลือกระดับความปลอดภัย: **Public** หรือ **Private** (ตามต้องการ)
5. **ไม่ต้องติ๊ก** เลือก "Add a README file" หรือ "Add .gitignore" (เนื่องจากเราสร้างไว้เรียบร้อยแล้ว)
6. คลิก **Create repository**

---

### ขั้นที่ 7: เชื่อมโยงและ Push ขึ้น GitHub
คัดลอก URL Repository จาก GitHub แล้วพิมพ์คำสั่ง:
```powershell
# 1. เปลี่ยนชื่อ Branch หลักให้เป็น main
git branch -M main

# 2. เชื่อมโยง Local Repository ไปยัง GitHub Remote (ใส่ URL ของคุณ)
git remote add origin https://github.com/USERNAME/SVGolf1StopService.git

# 3. Push โค้ดขึ้นสู่ GitHub
git push -u origin main
```
*(ระบบอาจให้ล็อกอิน GitHub ผ่านเบราว์เซอร์หรือใส่ Personal Access Token เพียงครั้งแรก)*

---

## 🌐 6. การปรับสถาปัตยกรรม Headless Backend ร่วมกับ Vercel

ตามความต้องการล่าสุด ระบบได้รับการปรับเปลี่ยนสถาปัตยกรรมให้:
1. **Google Apps Script ทำหน้าที่เป็น Headless Backend Server เท่านั้น:**
   - โค้ดหลังบ้านทั้งหมดใน `src/*.gs` ถูกปรับให้ส่ง URL ของระบบผ่านฟังก์ชัน `getSystemUrl()` ซึ่งคืนค่าโดเมนหลักของ **Vercel** (`https://svgolf-1-stop-service.vercel.app`) เสมอ
   - ลิงก์ทุกจุดในระบบ ไม่ว่าจะเป็นเมนู Card, ปุ่มกลับหน้าหลัก, ลิงก์คู่มือ, หรือปุ่มเปลี่ยนหน้า จะชี้ไปที่ `https://svgolf-1-stop-service.vercel.app/?page=...` ทั้งหมด
   - เมื่อผู้ใช้งานคลิกปุ่มหรือเปลี่ยนหน้า เบราว์เซอร์จะนำทางอยู่ภายใต้โดเมน Vercel เท่านั้น ไม่มีการเด้งหลุดไปหน้า `script.google.com` อีกต่อไป
2. **ปรับปรุง `index.html` (Vercel Frontend):**
   - รองรับการรับค่า Query Parameters (เช่น `?page=dashboard`, `?page=toolkit`, `?page=supervision`) และส่งต่อไปยัง Backend ใน iframe อย่างถูกต้อง
   - รองรับการทำงานร่วมกับ Vercel อย่างสมบูรณ์ 100%
3. **กำจัดลิงก์ `script.google.com` โดยตรง:**
   - ลิงก์คลังข้อสอบ O-NET ใน `html_onet_bank.html` ถูกแปลงเป็น Base64 Function เพื่อไม่ให้แสดง URL ตรงในซอร์สโค้ด
   - ลิงก์ทั้งหมดใน `modules/p1_ondemand/index.html` ถูกปรับให้เรียกผ่านโดเมน Vercel โดยตรง

---

## 🔒 7. ข้อควรระวังและแนวทางปฏิบัติในการดูแลรักษาระบบ (Best Practices)

1. **อย่าลบไฟล์นามสกุล `.gsheet` และ `.gscript` ใน Google Drive:**
   - ไฟล์เหล่านี้เป็นไอคอนเชื่อมโยงของ Google Drive for Desktop หากกดลบจากเครื่อง ไฟล์ชีตจริงใน Cloud จะถูกย้ายไปถังขยะ
   - ขณะนี้ระบบได้ใส่ไฟล์เหล่านี้ไว้ใน `.gitignore` เรียบร้อยแล้ว จึงปลอดภัยและจะไม่ถูกนำขึ้น Git แน่นอน
2. **การอัปเดตโค้ดบน Google Apps Script:**
   - นำโค้ดใน `src/*.gs` และ `src/*.html` ไปอัปเดตใน Google Apps Script Web Editor หรือใช้ `clasp push`
   - ตัวแปร `VERCEL_FRONTEND_URL` ใน `src/SvGolf-Index-Welcome.gs` ได้ถูกตั้งค่าเริ่มต้นเป็น `https://svgolf-1-stop-service.vercel.app` เรียบร้อยแล้ว หากมีการเปลี่ยนโดเมนในอนาคต สามารถแก้ไขได้ที่จุดนี้จุดเดียว
3. **การเปลี่ยนรหัสผ่านผู้ดูแลระบบ (Admin Password):**
   - รหัสผ่านถูกกำหนดไว้ที่ตัวแปร `ADMIN_PASSWORD` ในไฟล์ `src/SvGolf-Index-Welcome.gs`
   - หากนำโครงการขึ้นเป็น Public บน GitHub แนะนำให้เปลี่ยนค่านี้หรือย้ายไปเก็บไว้ใน **Script Properties** เพื่อความปลอดภัยสูงสุด

---
**จัดทำเอกสารโดย:** Antigravity AI Assistant  
**ร่วมกับ:** นายพุฒิพงษ์ วงศ์นันท์ (ศึกษานิเทศก์ สพป.น่าน เขต 1)
