const MANAGEMENT_SPREADSHEET_ID = "11yGuC2wfJOM1Ibqfb0wCo9J9_mNlJjbZKq-YtVpDGl0";
const MANAGEMENT_FOLDER_ID = "1aRf_Tz8bQuobLut_1XCPzgzgto4M79jr";

function doGetManagement(e) {
  const tmp = HtmlService.createTemplateFromFile('html_management');
  tmp.url = ScriptApp.getService().getUrl();
  tmp.manualUrl = PropertiesService.getScriptProperties().getProperty('manual_management') || '#';
  return tmp.evaluate()
    .setTitle('ระบบ RT-NT สพป.น่าน เขต 1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function checkLoginManagement(username, password) {
  // 1. Admin Fallback (matching platform admin password)
  const uInput = (username || '').toString().trim().toLowerCase();
  const pInput = (password || '').toString().trim();
  
  if (uInput === 'admin' && pInput === 'SVGolf@2026') {
    return { 
      success: true, 
      username: 'admin', 
      school: 'System Admin', 
      role: 'admin',
      permission: 'ALL'
    };
  }

  try {
    const ss = SpreadsheetApp.openById(MANAGEMENT_SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Users");
    if (!sheet) return { success: false, msg: "❌ ไม่พบหน้า 'Users' ใน Spreadsheet" };
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const dbUser = (data[i][0] || '').toString().trim().toLowerCase();
      const dbPass = (data[i][1] || '').toString().trim();
      
      if (dbUser === uInput && dbPass === pInput) {
        return { 
          success: true, 
          username: data[i][0], 
          school: data[i][3], 
          role: (data[i][2] || '').toString().toLowerCase(),
          permission: data[i][4] || "" 
        };
      }
    }
    return { success: false, msg: "❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  } catch (e) {
    return { success: false, msg: "❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Spreadsheet: " + e.toString() };
  }
}


// --- การจัดการเฉลย ---
function getKeyStatus() {
  const props = PropertiesService.getScriptProperties();
  return { 
    rt_url: props.getProperty('RT_URL') || "", 
    nt_thai_url: props.getProperty('NT_THAI_URL') || "", 
    nt_math_url: props.getProperty('NT_MATH_URL') || "", 
    is_open: props.getProperty('KEY_OPEN') === 'true' 
  };
}

function updateKeySettings(rtUrl, ntThai, ntMath, isOpen) {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    'RT_URL': rtUrl,
    'NT_THAI_URL': ntThai,
    'NT_MATH_URL': ntMath,
    'KEY_OPEN': isOpen
  });
  return "✅ อัปเดตการตั้งค่าสำเร็จ";
}

function getSecureKey(examType, userPermission) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('KEY_OPEN') !== 'true') return { success: false, msg: "ระบบปิดดาวน์โหลด" };
  
  const now = new Date();
  
  // ตรวจสอบเงื่อนไขเฉพาะ NT
  if (examType === 'NT') {
     // 1. เช็คสิทธิ์รายโรงเรียน
     if (userPermission !== 'NT_ALLOW') {
       return { success: false, msg: "❌ ดาวน์โหลดได้เฉพาะโรงเรียนที่เป็นสถานที่ตรวจข้อสอบเท่านั้น" };
     }
     
     // 2. เช็คเวลา (สมมติเปิด 15:30 ถึง 16:30 ตามโค้ดเดิม)
     const openTime = new Date('2026-02-25T12:30:00'); // ปรับเวลาเปิดที่นี่
     const limitTime = new Date('2026-02-25T14:00:00');
     
     if (now < openTime) return { success: false, msg: "⏳ ยังไม่ถึงเวลาเปิดให้ดาวน์โหลด (เริ่ม 12:30 น.)" };
     if (now > limitTime) return { success: false, msg: "❌ หมดเวลาดาวน์โหลดแล้ว" };
  }
  
  // เงื่อนไข RT (คงเดิมหรือปรับตามต้องการ)
  if (examType === 'RT') {
     const limitRT = new Date('2026-02-11T15:30:00');
     if (now > limitRT) return { success: false, msg: "❌ หมดเวลาดาวน์โหลดแล้ว" };
  }

  return { 
    success: true, 
    rt: props.getProperty('RT_URL'),
    thai: props.getProperty('NT_THAI_URL'), 
    math: props.getProperty('NT_MATH_URL') 
  };
}

// --- ระบบบันทึกจำนวนผู้เข้าสอบ ---
function saveExamReport(d) {
  const ss = SpreadsheetApp.openById(MANAGEMENT_SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Exam_Reports") || ss.insertSheet("Exam_Reports");
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === d.school && data[i][3] === d.examType) { rowIndex = i + 1; break; }
  }
  const rowData = [new Date(), d.school, d.username, d.examType, d.eligible, d.attended, d.absent, d.walkIn, d.normalStudent, d.specialStudent];
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return "✅ อัปเดตข้อมูลจำนวนผู้เข้าสอบเรียบร้อย";
  } else {
    sheet.appendRow(rowData);
    return "✅ บันทึกข้อมูลเรียบร้อย";
  }
}

function getDashboardStats(role, username, examFilter) {
  const sheet = SpreadsheetApp.openById(MANAGEMENT_SPREADSHEET_ID).getSheetByName("Exam_Reports");
  let stats = { totalSchools: 0, totalEligible: 0, totalAttended: 0, totalAbsent: 0, totalNormal: 0, totalSpecial: 0 };
  if (!sheet) return stats;
  const data = sheet.getDataRange().getValues();
  const schoolSet = new Set();
  for (let i = 1; i < data.length; i++) {
    if ((role === 'admin' || data[i][2] === username) && data[i][3] === examFilter) {
      stats.totalEligible += Number(data[i][4] || 0);
      stats.totalAttended += Number(data[i][5] || 0);
      stats.totalAbsent += Number(data[i][6] || 0);
      stats.totalNormal += Number(data[i][8] || 0);
      stats.totalSpecial += Number(data[i][9] || 0);
      schoolSet.add(data[i][1]);
    }
  }
  stats.totalSchools = schoolSet.size;
  return stats;
}

function getAllReports(role, username, examFilter) {
  const sheet = SpreadsheetApp.openById(MANAGEMENT_SPREADSHEET_ID).getSheetByName("Exam_Reports");
  const data = sheet.getDataRange().getValues();
  const header = ["วัน-เวลา", "โรงเรียน", "ผู้บันทึก", "ประเภท", "สิทธิ์", "มาสอบ", "ขาด", "Walk-in", "ปกติ", "พิเศษ", "ร้อยละ"];
  const rows = data.filter((row, i) => i !== 0 && (role === 'admin' || row[2] === username) && row[3] === examFilter).map(row => {
    const newRow = [...row];
    newRow[0] = Utilities.formatDate(new Date(row[0]), "GMT+7", "dd/MM/yyyy HH:mm");
    const eligible = Number(row[4] || 0);
    const attended = Number(row[5] || 0);
    newRow.push(eligible > 0 ? ((attended / eligible) * 100).toFixed(2) + "%" : "0%");
    return newRow;
  });
  return { header: header, rows: rows };
}

// --- ระบบดาวน์โหลด & อัปโหลดไฟล์ ---
function checkDownloadStatus(username) {
  const ss = SpreadsheetApp.openById(MANAGEMENT_SPREADSHEET_ID);
  const logSheet = ss.getSheetByName("Download_Logs") || ss.insertSheet("Download_Logs");
  let status = { rt: false, nt_thai: false, nt_math: false };
  const data = logSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2].toString() === username.toString()) {
      if (data[i][3] === "RT") status.rt = true;
      if (data[i][3] === "NT_THAI") status.nt_thai = true;
      if (data[i][3] === "NT_MATH") status.nt_math = true;
    }
  }
  return status;
}

function logDownload(type, username, school) {
  const ss = SpreadsheetApp.openById(MANAGEMENT_SPREADSHEET_ID);
  let logSheet = ss.getSheetByName("Download_Logs") || ss.insertSheet("Download_Logs");
  if (logSheet.getLastRow() === 0) logSheet.appendRow(["วัน-เวลา", "โรงเรียน", "Username", "ประเภท"]);
  logSheet.appendRow([new Date(), school, username, type]);
}

function uploadFiles(files, username, examType) {
  try {
    const parentFolder = DriveApp.getFolderById(MANAGEMENT_FOLDER_ID);
    const folderName = username + "_" + examType;
    const folders = parentFolder.getFoldersByName(folderName);
    const userFolder = folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
    
    files.forEach(f => {
      const existingFiles = userFolder.getFilesByName(f.label + "_" + f.name);
      while (existingFiles.hasNext()) { existingFiles.next().setTrashed(true); }
      const bytes = Utilities.base64Decode(f.data.split(',')[1]);
      const blob = Utilities.newBlob(bytes, f.mime, f.label + "_" + f.name);
      userFolder.createFile(blob);
    });
    return "✅ อัปโหลดไฟล์สำเร็จ " + files.length + " ไฟล์";
  } catch (e) {
    return "❌ เกิดข้อผิดพลาด: " + e.toString();
  }
}

function getServiceUrl() {
  return ScriptApp.getService().getUrl();
}