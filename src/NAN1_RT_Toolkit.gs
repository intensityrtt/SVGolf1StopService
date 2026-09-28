/**
 * RT NAN1 Toolkit V.1 (Stable)
 * พัฒนาโดย: ศึกษานิเทศก์พุฒิพงษ์ สพป.น่าน เขต 1
 */

const MAIN_SHEET_ID = "12nuP1dNlCHa-Lr0IWLpLHuRCtZNEFhfWIKOInIiGGY0";
const SLIDE_TEMPLATES = {
  "sheet1": "1dv47ptXzdl-U3qBYp339Khea-xKN6q_s3TrgbHFxgYY",
  "sheet2": "1CCO2tiwMOh0vgu3HP3krrtiB5_sedbbEgfoxGepiM0I",
  "sheet3": "142TfrQx88apqzRpxuz5qXST0GtDDuu-KVOSxP65J8xM"
};

function doGetToolkit(e) {
  const tmp = HtmlService.createTemplateFromFile('html_toolkit');
  tmp.url = getSystemUrl();
  tmp.manualUrl = PropertiesService.getScriptProperties().getProperty('manual_toolkit') || '#';
  tmp.isAdmin = (e && e.parameter && e.parameter.admin === 'true');
  return tmp.evaluate()
      .setTitle('RT NAN1 Toolkit V.1 - สพป.น่าน เขต 1')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getWords() {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SHEET_ID);
    const sheet = ss.getSheets()[0]; 
    const data = sheet.getDataRange().getValues();
    
    // ตัดแถวที่ 1 (หัวตาราง) ออก
    // row[0] = คำศัพท์, row[1] = หมวดหมู่/คำอธิบาย
    return data.slice(1).map(row => ({
      word: row[0] ? row[0].toString().trim() : "",
      category: row[1] ? row[1].toString().trim() : "ทั่วไป"
    })).filter(item => item.word !== ""); 
    
  } catch (e) {
    return "Error: " + e.toString();
  }
}

function createWorksheet(selectedWords, templateKey, teacherName) {
  try {
    // 1. ระบุ ID ของโฟลเดอร์ปลายทางที่ท่านต้องการ
    const folderId = "1cGIe0hjBcPXvC35H-a7nqOL97kQ5SsnG";
    const targetFolder = DriveApp.getFolderById(folderId);
    
    // 2. ดึงไฟล์ต้นฉบับ
    const templateFile = DriveApp.getFileById(SLIDE_TEMPLATES[templateKey]);
    
    // 3. สร้างไฟล์ใหม่โดยระบุให้ไปอยู่ในโฟลเดอร์ปลายทางทันที
    const newFile = templateFile.makeCopy(`ใบงาน_${templateKey}_${selectedWords.length}คำ`, targetFolder);
    
    // 4. เปิดไฟล์เพื่อแก้ไขข้อมูล
    const presentation = SlidesApp.openById(newFile.getId());
    
    // แทนที่ชื่อครู
    presentation.replaceAllText('{{Teacher}}', teacherName || ""); 
    
    const config = { "sheet1": 12, "sheet2": 5, "sheet3": 6 };
    const maxWords = config[templateKey] || 12;

    // แทนที่คำศัพท์
    selectedWords.forEach((word, index) => {
      if (index < maxWords) {
        presentation.replaceAllText(`{{W${index + 1}}}`, word);
      }
    });

    // ล้างช่องที่เหลือ
    for (let i = selectedWords.length + 1; i <= maxWords; i++) {
      presentation.replaceAllText(`{{W${i}}}`, "");
    }
    
    presentation.saveAndClose();
    
    // บันทึกสถิติ
    saveLog(teacherName, templateKey, selectedWords.length, selectedWords);

    return newFile.getUrl();
  } catch (e) {
    return "Error: " + e.toString();
  }
}
// ฟังก์ชันบันทึกสถิติลงใน Sheet "Log"
function saveLog(teacherName, templateKey, wordCount, wordList) {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SHEET_ID);
    let logSheet = ss.getSheetByName("Log");
    
    // ถ้ายังไม่มีหน้า Log ให้สร้างอัตโนมัติ
    if (!logSheet) {
      logSheet = ss.insertSheet("Log");
      logSheet.appendRow(["วันที่-เวลา", "ชื่อครูผู้สอน", "รูปแบบใบงาน", "จำนวนคำ", "รายชื่อคำศัพท์"]);
    }
    
    const timeStamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    const templateNames = { "sheet1": "บันไดอ่านคล่อง", "sheet2": "คัดลายมือ", "sheet3": "แต่งประโยค" };
    const templateDisplayName = templateNames[templateKey] || templateKey;
    
    // บันทึกข้อมูลลงแถวใหม่
    logSheet.appendRow([
      timeStamp, 
      teacherName, 
      templateDisplayName, 
      wordCount, 
      wordList.join(", ")
    ]);
    
  } catch (e) {
    console.log("Log Error: " + e.toString());
  }
}

function getToolkitStats() {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SHEET_ID);
    const logSheet = ss.getSheetByName("Log");
    if (!logSheet) return { total: 0, teachers: [], words: [], templates: [] };

    const data = logSheet.getDataRange().getValues().slice(1);
    const teacherMap = {};
    const wordMap = {};
    const templateMap = {};

    data.forEach(row => {
      // row: [timeStamp, teacherName, templateDisplayName, wordCount, wordList]
      const teacher = row[1];
      const template = row[2];
      const words = row[4] ? row[4].split(',').map(s => s.trim()) : [];

      teacherMap[teacher] = (teacherMap[teacher] || 0) + 1;
      templateMap[template] = (templateMap[template] || 0) + 1;
      words.forEach(w => { if(w) wordMap[w] = (wordMap[w] || 0) + 1; });
    });

    const teacherArr = Object.keys(teacherMap).map(k => ({ name: k, count: teacherMap[k] })).sort((a,b) => b.count - a.count);
    const wordArr = Object.keys(wordMap).map(k => ({ word: k, count: wordMap[k] })).sort((a,b) => b.count - a.count).slice(0, 15);
    const templateArr = Object.keys(templateMap).map(k => ({ name: k, count: templateMap[k] }));

    return {
      total: data.length,
      teachers: teacherArr,
      words: wordArr,
      templates: templateArr
    };
  } catch (e) {
    return "Error: " + e.toString();
  }
}