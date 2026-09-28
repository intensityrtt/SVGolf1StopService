/** * RT Digital Assessment & Management System - Nan Area 1 
 * Full Version with Student Detail Reporting
 */

const ASSESSMENT_SPREADSHEET_ID = '1HsXF1_m_EUMQ8SsnFYSHTZrU_Ztdx2zWXcnyG-SYnOk'; // ใส่ ID ของชีตคุณพุฒิพงษ์ที่นี่

function doGetAssessment() {
  const tmp = HtmlService.createTemplateFromFile('html_assessment');
  tmp.url = ScriptApp.getService().getUrl();
  tmp.manualUrl = PropertiesService.getScriptProperties().getProperty('manual_assessment') || '#';
  return tmp.evaluate()
      .setTitle('Pre-RT Online NAN1')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSheet(name) {
  let ss;
  try {
    ss = SpreadsheetApp.openById(ASSESSMENT_SPREADSHEET_ID);
  } catch (e) {
    throw new Error("ไม่สามารถเปิด Spreadsheet ได้ (ID: " + ASSESSMENT_SPREADSHEET_ID + ") กรุณาตรวจสอบว่าใส่ ID ถูกต้องและมีการแชร์สิทธิ์เข้าถึงแล้ว");
  }
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'Users') {
      sheet.appendRow(['Name', 'Username', 'Password', 'Role', 'Cluster', 'School', 'Date', 'CreatedBy']);
      sheet.appendRow(['System Admin', 'admin', '1234', 'SuperAdmin', '-', '-', new Date(), 'System']);
    }
    if (name === 'Exams') sheet.appendRow(['ID', 'Title', 'PDF_URL', 'Key', 'Total', 'Status', 'Category', 'SetNumber']);
    if (name === 'Results') sheet.appendRow(['Timestamp', 'Username', 'Name', 'ExamID', 'Answers', 'Score', 'Cluster', 'School', 'Category']);
  }
  
  // Ensure new columns exist for existing sheets
  if (name === 'Users' && sheet.getLastColumn() < 9) {
    sheet.getRange(1, 9).setValue('Room');
  }
  if (name === 'Exams' && sheet.getLastColumn() < 9) {
    if (sheet.getLastColumn() < 8) {
      sheet.getRange(1, 7).setValue('Category');
      sheet.getRange(1, 8).setValue('SetNumber');
    }
    sheet.getRange(1, 9).setValue('Teacher_PDF_URL');
  }
  if (name === 'Results' && sheet.getLastColumn() < 10) {
    if (sheet.getLastColumn() < 9) {
      sheet.getRange(1, 9).setValue('Category');
    }
    sheet.getRange(1, 10).setValue('Room');
  }
  
  return sheet;
}

function getSchoolListData() {
  try {
    const sheet = getSheet('School_List');
    const data = sheet.getDataRange().getValues();
    const schoolObj = {};
    for (let i = 1; i < data.length; i++) {
      const schoolName = data[i][0];
      const clusterName = data[i][1];
      if (clusterName && schoolName) {
        if (!schoolObj[clusterName]) schoolObj[clusterName] = [];
        schoolObj[clusterName].push(schoolName);
      }
    }
    return schoolObj;
  } catch (e) {
    // Return empty object if sheet doesn't exist or is inaccessible
    return {};
  }
}


function checkLoginAssessment(u, p) {
  const uInput = (u || '').toString().trim().toLowerCase();
  const pInput = (p || '').toString().trim();
  
  // 1. Admin Fallback (matching platform admin password for consistency)
  if (uInput === 'admin' && (pInput === '1234' || pInput === 'SVGolf@2026')) {
    return { status: 'success', name: 'System Admin', username: 'admin', role: 'SuperAdmin', cluster: '-', school: '-', room: '-' };
  }

  try {
    const data = getSheet('Users').getDataRange().getValues();
    
    // 2. Check in sheet
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length < 3) continue; 
      
      const dbUser = (row[1] || '').toString().trim().toLowerCase();
      const dbPass = (row[2] || '').toString().trim();
      
      if (dbUser === uInput && dbPass === pInput) {
        return { 
          status: 'success', 
          name: row[0], 
          username: row[1], 
          role: row[3], 
          cluster: row[4], 
          school: row[5],
          room: row[8] || '-'
        };
      }
    }
    return { status: 'error', msg: '❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  } catch (e) {
    return { status: 'error', msg: '❌ เกิดข้อผิดพลาด: ' + e.toString() };
  }
}

function saveRegistration(regData, currentUser) {
  const sheet = getSheet('Users');
  const existing = sheet.getDataRange().getValues().map(r => r[1].toString());
  if (existing.includes(regData.username.toString())) throw new Error('Username นี้มีในระบบแล้ว');
  sheet.appendRow([
    regData.name, 
    regData.username, 
    regData.password, 
    regData.targetRole, 
    regData.cluster, 
    regData.school, 
    new Date(), 
    currentUser.name,
    regData.room || '-'
  ]);
  return true;
}

function importUsersCSV(csvContent, currentUser) {
  if (!currentUser || (currentUser.role !== 'Teacher' && currentUser.role !== 'Supervisor' && currentUser.role !== 'SuperAdmin')) {
    throw new Error('คุณไม่มีสิทธิ์ในการนำเข้าข้อมูล');
  }

  const sheet = getSheet('Users');
  const existingRows = sheet.getDataRange().getValues();
  const existingUsernames = new Set(existingRows.map(r => r[1].toString().trim().toLowerCase()));
  
  const rows = parseCSVString(csvContent);
  if (rows.length <= 1) {
    throw new Error('ไม่พบข้อมูลในไฟล์ CSV (หรือไฟล์ว่างเปล่า)');
  }
  
  const newUsers = [];
  const duplicates = [];
  const errors = [];
  
  const roleMap = {
    'student': 'Student', 'นักเรียน': 'Student',
    'teacher': 'Teacher', 'ครู': 'Teacher',
    'supervisor': 'Supervisor', 'ศน': 'Supervisor', 'ศน.': 'Supervisor',
    'executive': 'Executive', 'ผู้บริหาร': 'Executive', 'ผู้บริหารเขต': 'Executive', 'ผู้บริหารโรงเรียน': 'Executive'
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
    
    const name = (row[0] || '').trim();
    const username = (row[1] || '').trim().toLowerCase();
    const password = (row[2] || '').trim();
    let roleThai = (row[3] || '').trim().toLowerCase();
    let cluster = (row[4] || '').trim();
    let school = (row[5] || '').trim();
    let room = (row[6] || '').trim();
    
    if (!name || !username || !password) {
      errors.push(`แถวที่ ${i + 1}: ข้อมูล ชื่อ, Username หรือ รหัสผ่าน ไม่ครบถ้วน`);
      continue;
    }
    
    if (existingUsernames.has(username)) {
      duplicates.push(username);
      continue;
    }
    
    let role = roleMap[roleThai] || 'Student';
    
    if (currentUser.role === 'Teacher') {
      role = 'Student';
      cluster = currentUser.cluster;
      school = currentUser.school;
    } else if (currentUser.role === 'Supervisor') {
      role = 'Teacher';
      cluster = currentUser.cluster;
    } else if (currentUser.role === 'SuperAdmin') {
      // Keep CSV values
    } else {
      errors.push(`แถวที่ ${i + 1}: คุณไม่มีสิทธิ์สร้างบทบาทนี้`);
      continue;
    }
    
    newUsers.push([
      name,
      username,
      password,
      role,
      cluster || '-',
      school || '-',
      new Date(),
      currentUser.name,
      room || '-'
    ]);
    
    existingUsernames.add(username);
  }
  
  if (newUsers.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newUsers.length, 9).setValues(newUsers);
  }
  
  return {
    success: true,
    importedCount: newUsers.length,
    duplicateCount: duplicates.length,
    errorCount: errors.length,
    duplicates: duplicates,
    errors: errors
  };
}

function parseCSVString(text) {
  const p = [[]];
  let r = p[0];
  let q = false;
  let c;
  
  for (let i = 0; i < text.length; i++) {
    c = text[i];
    if (c === '"') {
      if (q && text[i + 1] === '"') {
        r[r.length - 1] += c;
        i++;
      } else {
        q = !q;
      }
    } else if (c === ',') {
      if (q) {
        r[r.length - 1] += c;
      } else {
        r.push('');
      }
    } else if (c === '\r' || c === '\n') {
      if (q) {
        r[r.length - 1] += c;
      } else {
        if (c === '\r' && text[i + 1] === '\n') {
          i++;
        }
        p.push(r = ['']);
      }
    } else {
      if (r.length === 0) {
        r.push(c);
      } else {
        r[r.length - 1] += c;
      }
    }
  }
  return p.filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));
}

function getActiveExams() {
  const data = getSheet('Exams').getDataRange().getValues().slice(1);
  return data.filter(r => r[5] === 'เปิด').map(r => ({ id: r[0], title: r[1], pdfUrl: r[2], teacherPdfUrl: r[8] || '' }));
}

function getAllExams() {
  const data = getSheet('Exams').getDataRange().getValues().slice(1);
  return data.map(r => ({ 
    id: r[0], 
    title: r[1], 
    pdfUrl: r[2],
    status: r[5] || 'ปิด', 
    key: r[3] || "",
    category: r[6] || 'Comprehension',
    setNumber: r[7] || 1,
    teacherPdfUrl: r[8] || ''
  }));
}

function getExam(id) {
  const data = getSheet('Exams').getDataRange().getValues();
  const exam = data.find(r => r[0] == id);
  return exam ? { 
    id: exam[0], 
    title: exam[1], 
    pdfUrl: exam[2], 
    key: exam[3], 
    total: exam[4],
    status: exam[5],
    category: exam[6] || 'Comprehension',
    setNumber: exam[7] || 1,
    teacherPdfUrl: exam[8] || ''
  } : null;
}

function getExamsFolder() {
  const folderName = "RT_Assessment_Exams";
  const props = PropertiesService.getScriptProperties();
  let folderId = props.getProperty('exams_folder_id');
  
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch(e) {}
  }
  
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    const folder = folders.next();
    props.setProperty('exams_folder_id', folder.getId());
    return folder;
  }
  
  const folder = DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  props.setProperty('exams_folder_id', folder.getId());
  return folder;
}

function uploadExamFile(fileData, fileName, contentType) {
  const folder = getExamsFolder();
  const data = Utilities.base64Decode(fileData.split(',')[1]);
  const blob = Utilities.newBlob(data, contentType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function saveExamData(exam) {
  const sheet = getSheet('Exams');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => r[0] == exam.id);
  
  const rowData = [
    exam.id,
    exam.title,
    exam.pdfUrl,
    exam.key,
    exam.total || 30,
    exam.status || 'ปิด',
    exam.category,
    exam.setNumber,
    exam.teacherPdfUrl || ''
  ];
  
  if (rowIndex > -1) {
    sheet.getRange(rowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { success: true };
}

function deleteExam(id) {
  const sheet = getSheet('Exams');
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => r[0] == id);
  if (rowIndex > -1) {
    sheet.deleteRow(rowIndex + 1);
    return true;
  }
  return false;
}

function submitExam(userData, examId, studentAns) {
  const examData = getSheet('Exams').getDataRange().getValues().find(r => r[0] == examId);
  const key = examData[3].toString().split(',').map(s => s.trim());
  const category = examData[6] || 'Comprehension';
  let score = 0; let totalPossible = 0;
  key.forEach((ans, i) => {
    if (i >= 10 && i <= 14) {
      // Questions 11-15: Numeric scoring (0, 1, 2)
      totalPossible += 2;
      score += (parseInt(studentAns[i]) || 0);
    } else if (ans !== '-' && ans !== '' && ans !== undefined) {
      if (i >= 15 && i <= 29) {
        totalPossible += 2;
        if (studentAns[i] && studentAns[i].toString() === ans) score += 2;
      } else {
        totalPossible++;
        if (studentAns[i] && studentAns[i].toString() === ans) score++;
      }
    }
  });
  const sheet = getSheet('Results');
  const existingRows = sheet.getDataRange().getValues();
  let updated = false;
  for (let i = 1; i < existingRows.length; i++) {
    if (existingRows[i][1].toString() === userData.username.toString() && existingRows[i][8] === category) {
        sheet.getRange(i+1, 1, 1, 10).setValues([[
          new Date(), 
          userData.username, 
          userData.name, 
          examId, 
          studentAns.join(','), 
          score, 
          userData.cluster, 
          userData.school, 
          category,
          userData.room || '-'
        ]]);
        updated = true;
        break;
    }
  }
  if (!updated) {
    sheet.appendRow([
      new Date(), 
      userData.username, 
      userData.name, 
      examId, 
      studentAns.join(','), 
      score, 
      userData.cluster, 
      userData.school, 
      category,
      userData.room || '-'
    ]);
  }
  return { score: score, total: totalPossible, key: key.join(',') };
}

// ข้อมูลรวมสำหรับกราฟ
function getExecutiveStats(user, clusterFilter) {
  const results = getSheet('Results').getDataRange().getValues().slice(1);
  const exams = getSheet('Exams').getDataRange().getValues().slice(1);
  const keyMap = {};
  exams.forEach(ex => keyMap[ex[0]] = (ex[3] || "").split(',').map(s => s.trim()));

  let filtered = results;
  if (user.role === 'Supervisor') {
    filtered = results.filter(r => r[6] === user.cluster);
  } else if (user.role === 'Teacher') {
    filtered = results.filter(r => r[7] === user.school);
  } else if (clusterFilter) {
    filtered = results.filter(r => r[6] === clusterFilter);
  }
  
  // Stats per category
  const stats = {
    Comprehension: { total: 0, sum: 0 },
    Aloud: { total: 0, sum: 0 }
  };

  filtered.forEach(r => {
    const cat = r[8] || 'Comprehension';
    if (stats[cat]) {
      stats[cat].total++;
      stats[cat].sum += Number(r[5]);
    }
  });

  const uniqueUsers = new Set(filtered.map(r => r[1].toString().trim()));
  const total = uniqueUsers.size;
  const avg = stats.Comprehension.total > 0 ? (stats.Comprehension.sum / stats.Comprehension.total).toFixed(2) : 0;
  const aloudAvg = stats.Aloud.total > 0 ? (stats.Aloud.sum / stats.Aloud.total).toFixed(2) : 0;
  
  const catStats = {
    word: { sum: 0, totalPossible: 0 },
    story: { sum: 0, totalPossible: 0 },
    sentence: { sum: 0, totalPossible: 0 },
    passage: { sum: 0, totalPossible: 0 }
  };
  
  const aloudCatStats = {
    c1: { sum: 0, totalPossible: 0 },
    c2: { sum: 0, totalPossible: 0 },
    c3: { sum: 0, totalPossible: 0 },
    c4: { sum: 0, totalPossible: 0 },
    c5: { sum: 0, totalPossible: 0 },
    c6: { sum: 0, totalPossible: 0 },
    c7: { sum: 0, totalPossible: 0 },
    c8: { sum: 0, totalPossible: 0 },
    c9: { sum: 0, totalPossible: 0 },
    c10: { sum: 0, totalPossible: 0 },
    c11: { sum: 0, totalPossible: 0 },
    sentences: { sum: 0, totalPossible: 0 }
  };

  const aloudRanges = {
    c1: [0, 0], c2: [1, 1], c3: [2, 3], c4: [4, 5], c5: [6, 7], c6: [8, 9], 
    c7: [10, 11], c8: [12, 13], c9: [14, 15], c10: [16, 17], c11: [18, 19]
  };

  const schoolStats = {};
  filtered.forEach(r => {
    const sName = r[7];
    const cat = r[8] || 'Comprehension';
    
    if(!schoolStats[sName]) {
      schoolStats[sName] = { 
        compSum: 0, compCount: 0,
        aloudSum: 0, aloudCount: 0
      };
    }
    
    if (cat === 'Comprehension') {
      schoolStats[sName].compSum += Number(r[5]);
      schoolStats[sName].compCount += 1;
    } else if (cat === 'Aloud') {
      schoolStats[sName].aloudSum += Number(r[5]);
      schoolStats[sName].aloudCount += 1;
    }

    // Skill Analysis
    const ans = (r[4] || "").split(',').map(s => s.trim());
    
    if (cat === 'Comprehension') {
      const key = keyMap[r[3]];
      if(key) {
        const ranges = { word: [0, 9], story: [10, 14], sentence: [15, 24], passage: [25, 29] };
        for(let k in ranges) {
          for(let i = ranges[k][0]; i <= ranges[k][1]; i++) {
            if (k === 'story') {
              catStats[k].totalPossible += 2;
              catStats[k].sum += (parseInt(ans[i]) || 0);
            } else if (key[i] && key[i] !== '-') {
              if (i >= 15 && i <= 29) {
                catStats[k].totalPossible += 2;
                if(ans[i] === key[i]) catStats[k].sum += 2;
              } else {
                catStats[k].totalPossible++;
                if(ans[i] === key[i]) catStats[k].sum++;
              }
            }
          }
        }
      }
    } else if (cat === 'Aloud') {
      for(let k in aloudRanges) {
        for(let i = aloudRanges[k][0]; i <= aloudRanges[k][1]; i++) {
          aloudCatStats[k].totalPossible += 1;
          aloudCatStats[k].sum += (parseInt(ans[i]) || 0);
        }
      }
      for(let i = 20; i <= 29; i++) {
        aloudCatStats.sentences.totalPossible += 3;
        aloudCatStats.sentences.sum += (parseInt(ans[i]) || 0);
      }
    }
  });

  return { 
    summary: { total: total, average: avg, aloudAverage: aloudAvg }, 
    chartData: Object.keys(schoolStats).map(n => {
      const s = schoolStats[n];
      const compAvg = s.compCount > 0 ? (s.compSum / s.compCount) : 0;
      const aloudAvg = s.aloudCount > 0 ? (s.aloudSum / s.aloudCount) : 0;
      return { 
        school: n, 
        compAvg: compAvg.toFixed(2),
        aloudAvg: aloudAvg.toFixed(2),
        combinedAvg: (compAvg + aloudAvg).toFixed(2)
      };
    }),
    catStats: catStats,
    aloudCatStats: aloudCatStats
  };
}

// ข้อมูลรายบุคคลสำหรับตาราง
function getStudentResults(user, clusterFilter) {
  const results = getSheet('Results').getDataRange().getValues().slice(1);
  let filtered = results;
  if (user.role === 'Supervisor') {
    filtered = results.filter(r => r[6] === user.cluster);
  } else if (user.role === 'Teacher') {
    filtered = results.filter(r => r[7] === user.school);
  } else if (clusterFilter) {
    filtered = results.filter(r => r[6] === clusterFilter);
  }

  const studentMap = {};
  
  filtered.forEach(r => {
    const uname = r[1];
    if (!studentMap[uname]) {
      studentMap[uname] = {
        name: r[2],
        username: uname,
        school: r[7],
        room: r[9] || '-',
        comprehension: null,
        aloud: null
      };
    }
    
    const res = {
      timestamp: r[0] instanceof Date ? r[0].toISOString() : r[0],
      examId: r[3],
      answers: r[4],
      score: r[5],
      category: r[8] || 'Comprehension'
    };

    if (res.category === 'Comprehension') {
      // Keep latest
      if (!studentMap[uname].comprehension || res.timestamp > studentMap[uname].comprehension.timestamp) {
        studentMap[uname].comprehension = res;
      }
    } else {
      if (!studentMap[uname].aloud || res.timestamp > studentMap[uname].aloud.timestamp) {
        studentMap[uname].aloud = res;
      }
    }
  });

  return Object.values(studentMap).reverse();
}

function submitReadingAloud(teacherUser, studentData, examId, scores) {
  const examData = getSheet('Exams').getDataRange().getValues().find(r => r[0] == examId);
  if (!examData) throw new Error('ไม่พบข้อมูลชุดข้อสอบ');
  
  const totalScore = scores.reduce((s, v) => s + Number(v), 0);
  const answersStr = scores.join(',');
  const category = 'Aloud';

  const sheet = getSheet('Results');
  const existingRows = sheet.getDataRange().getValues();
  let updated = false;
  for (let i = 1; i < existingRows.length; i++) {
    if (existingRows[i][1].toString() === studentData.username.toString() && existingRows[i][8] === category) {
       sheet.getRange(i+1, 1, 1, 10).setValues([[
         new Date(), 
         studentData.username, 
         studentData.name, 
         examId, 
         answersStr, 
         totalScore, 
         studentData.cluster || '-', 
         studentData.school || teacherUser.school, 
         category,
         studentData.room || '-'
       ]]);
       updated = true;
       break;
    }
  }
  if (!updated) {
    sheet.appendRow([
      new Date(), 
      studentData.username, 
      studentData.name, 
      examId, 
      answersStr, 
      totalScore, 
      studentData.cluster || '-', 
      studentData.school || teacherUser.school,
      category,
      studentData.room || '-'
    ]);
  }
  
  return { success: true, score: totalScore };
}

function updateExamCategory(id, category, setNumber) {
  const sheet = getSheet('Exams');
  const data = sheet.getDataRange().getValues();
  for(let i=1; i<data.length; i++) { 
    if(data[i][0] == id) { 
      sheet.getRange(i+1, 7).setValue(category);
      sheet.getRange(i+1, 8).setValue(setNumber);
      return true;
    } 
  }
  return false;
}

function toggleExamStatus(id, cur) {
  const sheet = getSheet('Exams');
  const data = sheet.getDataRange().getValues();
  const next = cur === 'เปิด' ? 'ปิด' : 'เปิด';
  for(let i=1; i<data.length; i++) { if(data[i][0] == id) { sheet.getRange(i+1, 6).setValue(next); return next; } }
}

function updateExamKey(id, key) {
  const sheet = getSheet('Exams');
  const data = sheet.getDataRange().getValues();
  for(let i=1; i<data.length; i++) { 
    if(data[i][0] == id) { 
      sheet.getRange(i+1, 4).setValue(key); // Column D (4) is the Key
      return { success: true }; 
    } 
  }
  return { success: false, msg: "ไม่พบข้อมูลชุดข้อสอบ" };
}

function deleteStudentResult(ts, user) {
  const sheet = getSheet('Results');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    let rowTs = data[i][0];
    if (rowTs instanceof Date) rowTs = rowTs.toISOString();
    if (rowTs.toString() === ts.toString()) {
      if (user.role === 'SuperAdmin' || (user.role === 'Teacher' && data[i][7].toString().trim() === user.school.toString().trim())) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }
  }
  return false;
}

function clearAllResults(user) {
  const sheet = getSheet('Results');
  const data = sheet.getDataRange().getValues();
  let count = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (user.role === 'SuperAdmin' || (user.role === 'Teacher' && data[i][7].toString().trim() === user.school.toString().trim())) {
      sheet.deleteRow(i + 1);
      count++;
    }
  }
  return count;
}

function updateTeacherScore(ts, scores, user) {
  const sheet = getSheet('Results');
  const data = sheet.getDataRange().getValues();
  const examSheet = getSheet('Exams');
  const exams = examSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    let rowTs = data[i][0];
    if (rowTs instanceof Date) rowTs = rowTs.toISOString();
    
    if (rowTs.toString() === ts.toString()) {
      // Security check
      if (user.role !== 'SuperAdmin' && user.role !== 'Teacher' && user.role !== 'Supervisor') return { success: false, msg: 'ไม่มีสิทธิ์' };
      
      const currentAns = data[i][4].split(',');
      // Update Q11-15 (index 10-14)
      scores.forEach((val, idx) => {
        currentAns[10 + idx] = val;
      });
      
      const newAnsStr = currentAns.join(',');
      
      // Re-calculate Total Score
      const examId = data[i][3];
      const examData = exams.find(r => r[0] == examId);
      const key = examData[3].toString().split(',').map(s => s.trim());
      
      let newScore = 0;
      key.forEach((ans, j) => {
        if (j >= 10 && j <= 14) {
          newScore += (parseInt(currentAns[j]) || 0);
        } else if (ans !== '-' && ans !== '' && ans !== undefined) {
          if (j >= 15 && j <= 29) {
            if (currentAns[j] === ans) newScore += 2;
          } else {
            if (currentAns[j] === ans) newScore++;
          }
        }
      });
      
      sheet.getRange(i + 1, 5).setValue(newAnsStr);
      sheet.getRange(i + 1, 6).setValue(newScore);
      
      return { success: true, score: newScore };
    }
  }
  return { success: false, msg: 'ไม่พบข้อมูล' };
}