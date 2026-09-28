/**
 * ระบบเช็คอิน RT สพป.น่าน เขต 1
 * Sheet ID: 1i6O1xa-HXwiK4OKY5atEPd1eA4cM5td7pxpOr0QjxjI
 * Folder ID: 1190d8L-7HAk_vneJHO5SkepVTqPfgSPyW
 */

const MEETING_SHEET_ID = '1i6O1xa-HXwiK4OKY5atEPd1eA4cM5td7pxpOr0QjxjI';
const MEETING_FOLDER_ID = '190d8L-7HAk_vneJHO5SkepVTqPfgSPyW';

function doGetMeeting(e) {
  var mode = (e && e.parameter) ? e.parameter.mode : null;
  var templateName = (mode === 'admin') ? 'html_meeting_admin' : 'html_meeting';
  var tmp = HtmlService.createTemplateFromFile(templateName);
  tmp.url = ScriptApp.getService().getUrl();
  tmp.manualUrl = PropertiesService.getScriptProperties().getProperty('manual_meeting') || '#';
  tmp.config = getMeetingConfig();
  return tmp.evaluate()
    .setTitle('ระบบการประชุมชี้แจง RT - สพป.น่าน เขต 1')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getScriptUrl() { return ScriptApp.getService().getUrl(); }

function getCurrentAllowedStep() {
  const ss = SpreadsheetApp.openById(MEETING_SHEET_ID);
  const configSheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
  if(configSheet.getLastRow() === 0) {
    configSheet.getRange('A1:B4').setValues([
      ['CurrentStep', 1],
      ['Title', 'การประชุมกรรมการระดับสนามสอบ RT'],
      ['Subtitle', 'สพป.น่าน เขต 1'],
      ['Roles', 'ผู้แทนศูนย์สอบ,ประธานสนามสอบ,กรรมการคุมสอบคนที่ 1,กรรมการคุมสอบคนที่ 2,กรรมการบันทึกคะแนน'],
      ['Question', 'ท่านมีความพร้อมในการจัดสอบเพียงใด?'],
      ['FinishLink', ''],
      ['FinishQR', ''],
      ['FinishText', '']
    ]);
  }
  return configSheet.getRange('B1').getValue();
}

function getMeetingConfig() {
  try {
    const ss = SpreadsheetApp.openById(MEETING_SHEET_ID);
    const configSheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
    if(configSheet.getLastRow() === 0) getCurrentAllowedStep(); // Initialize
    
    return {
      title: configSheet.getRange('B2').getValue() || 'การประชุม',
      subtitle: configSheet.getRange('B3').getValue() || '',
      roles: configSheet.getRange('B4').getValue() || 'ผู้เข้าร่วม',
      question: configSheet.getRange('B5').getValue() || 'ท่านมีความพร้อมในการจัดสอบเพียงใด?',
      finishLink: configSheet.getRange('B6').getValue() || '',
      finishQr: configSheet.getRange('B7').getValue() || '',
      finishText: configSheet.getRange('B8').getValue() || ''
    };
  } catch(e) {
    return { title: 'การประชุม', subtitle: '', roles: 'ผู้เข้าร่วม', question: 'ท่านมีความพร้อมในการจัดสอบเพียงใด?', finishLink: '', finishQr: '', finishText: '' };
  }
}

function saveMeetingConfig(configData) {
  try {
    const ss = SpreadsheetApp.openById(MEETING_SHEET_ID);
    const configSheet = ss.getSheetByName('Config');
    configSheet.getRange('B2').setValue(configData.title);
    configSheet.getRange('B3').setValue(configData.subtitle);
    configSheet.getRange('B4').setValue(configData.roles);
    configSheet.getRange('B5').setValue(configData.question);
    configSheet.getRange('B6').setValue(configData.finishLink);
    configSheet.getRange('B8').setValue(configData.finishText);
    return { status: 'success', message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' };
  } catch(e) {
    return { status: 'error', message: e.toString() };
  }
}

function updateAllowedStep(step) {
  const ss = SpreadsheetApp.openById(MEETING_SHEET_ID);
  const configSheet = ss.getSheetByName('Config');
  configSheet.getRange('B1').setValue(step);
  return step;
}

function resetSystem() {
  updateAllowedStep(1);
  return "ระบบถูกล็อกกลับไปที่ภารกิจที่ 1 เรียบร้อยแล้ว";
}

// *** ฟังก์ชันอัปโหลดรูปและเปลี่ยนชื่อตามชื่อคน ***
function uploadImageOnly(base64Data, userName) {
  try {
    const folder = DriveApp.getFolderById(MEETING_FOLDER_ID);
    // เปลี่ยนชื่อไฟล์เป็น: RT_ชื่อนามสกุล.jpg
    const fileName = "RT_" + userName.replace(/\s/g, '_') + ".jpg";
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data.split(',')[1]), 'image/jpeg', fileName);
    const file = folder.createFile(blob);
    return { status: 'success', url: file.getUrl() };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function uploadData(data) {
  try {
    const ss = SpreadsheetApp.openById(MEETING_SHEET_ID);
    const sheet = ss.getSheetByName('Data') || ss.insertSheet('Data');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'บทบาทหน้าที่', 'URL รูปภาพ', 'Q1', 'Q2', 'Q3', 'สถานะ']);
    }
    
    // บันทึกข้อมูล (fileUrl ได้มาจากอาสาภารกิจที่ 2)
    sheet.appendRow([new Date(), data.name, "กรรมการ RT", data.role, data.fileUrl, "", data.q2, "", 'สำเร็จ']);
    return { status: 'success' };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function getSuccessPage() { 
  const tmp = HtmlService.createTemplateFromFile('html_meeting_success');
  tmp.url = ScriptApp.getService().getUrl();
  tmp.config = getMeetingConfig();
  return tmp.evaluate().getContent();
}

function getRegisteredUsers() {
  try {
    const ss = SpreadsheetApp.openById(MEETING_SHEET_ID);
    const sheet = ss.getSheetByName('Data');
    if (!sheet) return { status: 'success', data: [] };
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { status: 'success', data: [] };
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const formattedData = data.map(row => {
      let timestampStr = '';
      if (row[0]) {
        try {
          timestampStr = Utilities.formatDate(new Date(row[0]), "GMT+7", "dd/MM/yyyy HH:mm:ss");
        } catch(e) {
          timestampStr = row[0].toString();
        }
      }
      return {
        timestamp: timestampStr,
        name: row[1],
        position: row[2],
        role: row[3],
        imageUrl: row[4],
        status: row[8]
      };
    });
    return { status: 'success', data: formattedData };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}