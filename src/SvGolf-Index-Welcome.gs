// กำหนดรหัสผ่านสำหรับ Admin ที่นี่
const ADMIN_PASSWORD = "SVGolf@2026"; 

// กำหนด URL ของระบบ Frontend หลักบน Vercel (GAS ทำหน้าที่เป็น Headless Backend Server เท่านั้น)
const VERCEL_FRONTEND_URL = "https://svgolf-1-stop-service.vercel.app";

function getSystemUrl() {
  return PropertiesService.getScriptProperties().getProperty('FRONTEND_URL') || VERCEL_FRONTEND_URL;
}

function doGet(e) {
  var startTime = Date.now();
  var page = (e && e.parameter) ? e.parameter.page : 'welcome';
  if (!page) page = 'welcome';
  
  try {
    var output = processRequest(e);
    var duration = Date.now() - startTime;
    logExecutionTime(page, duration);
    return output;
  } catch (err) {
    var duration = Date.now() - startTime;
    logExecutionTime('error', duration);
    return HtmlService.createHtmlOutput('<h3>Error occurred: ' + err.toString() + '</h3>');
  }
}

function processRequest(e) {
  var page = (e && e.parameter) ? e.parameter.page : null;
  var pw = (e && e.parameter) ? e.parameter.pw : null;
  
  if (!page) {
    var template = HtmlService.createTemplateFromFile('html_welcome');
    template.url = getSystemUrl();
    template.imageData = getImageBase64('INDEX.png');
    return template.evaluate().setTitle('ยินดีต้อนรับสู่ SV.GOLF One Stop Service').addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  if (page === 'dashboard') {
    logVisit('dashboard');
    var template = HtmlService.createTemplateFromFile('html_dashboard');
    template.url = getSystemUrl();
    template.statuses = getSystemStatuses();
    template.manualUrls = getManualUrls();
    template.totalVisits = PropertiesService.getScriptProperties().getProperty('stats_dashboard') || '0';
    
    // ดึงสถิติการนิเทศสำหรับแสดงบน Card
    try {
      const summary = getSupervisionSummaryData();
      template.supervisionCount = summary.totalInspected || 0;
      template.supervisionTotal = summary.totalSchools || 0;
    } catch (e) {
      template.supervisionCount = 0;
      template.supervisionTotal = 0;
    }
    
    return template.evaluate().setTitle('SV.GOLF One Stop Service').addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  if (page === 'admin') {
    if (pw === ADMIN_PASSWORD) {
      var template = HtmlService.createTemplateFromFile('html_admin');
      template.url = getSystemUrl();
      template.manualUrls = getManualUrls();
      return template.evaluate().setTitle('Admin Control - SV.GOLF').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } else {
      return HtmlService.createHtmlOutput("<div style='text-align:center; padding:50px; font-family:sans-serif;'><h2>🔒 รหัสผ่านไม่ถูกต้อง</h2><p>กรุณาระบุรหัสผ่านให้ถูกต้องเพื่อเข้าใช้งานหน้า Admin</p><a href='?page=dashboard' style='display:inline-block; margin-top:15px; padding:10px 20px; background:#4f46e5; color:white; text-decoration:none; border-radius:8px;'>กลับหน้าหลัก</a></div>").setTitle('Access Denied').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  }

  if (page === 'supervision') return serveProtectedPage(e, 'supervision', 'html_supervision', 'doGetSupervision');
  if (page === 'supervision_report') return serveSupervisionReport(e);
  if (page === 'classroom_obs_report') return serveClassroomObsReport(e);
  if (page === 'toolkit') return serveProtectedPage(e, 'toolkit', 'html_toolkit', 'doGetToolkit');
  if (page === 'assessment') return serveProtectedPage(e, 'assessment', 'html_assessment', 'doGetAssessment');
  if (page === 'management') return serveProtectedPage(e, 'management', 'html_management', 'doGetManagement');
  if (page === 'meeting') return serveProtectedPage(e, 'meeting', 'html_meeting', 'doGetMeeting');
  if (page === 'system5') return serveProtectedPage(e, 'system5', 'html_system5', 'doGetSystem5');
  if (page === 'system6') return serveProtectedPage(e, 'system6', 'html_system6', 'doGetSystem6');
  if (page === 'onet_bank') return serveProtectedPage(e, 'onet_bank', 'html_onet_bank');
  if (page === 'onet_nanoy2') return serveProtectedPage(e, 'system6', 'html_onet_nanoy2');
  if (page === 'rt_nanoy2') return serveProtectedPage(e, 'system6', 'html_rt_nanoy2');
  if (page === 'nt_nanoy2') return serveProtectedPage(e, 'system6', 'html_nt_nanoy2');
  if (page === 'classroom_obs') return serveProtectedPage(e, 'classroom_obs', 'html_classroom_obs', 'doGetClassroomObs');
  if (page === 'p1_ondemand') return serveProtectedPage(e, 'p1_ondemand', 'html_p1_ondemand');
  
  if (page === 'manual') {
    var template = HtmlService.createTemplateFromFile('html_manual');
    template.url = getSystemUrl();
    template.activeTab = (e && e.parameter && e.parameter.tab) ? e.parameter.tab : 'main';
    template.statuses = getSystemStatuses();
    return template.evaluate()
      .setTitle('คู่มือการใช้งาน - SV.GOLF')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutput('<h3>404 - Page not found</h3>').setTitle('Page Not Found');
}

function serveProtectedPage(e, systemKey, fileName, fallbackFunc) {
  var status = PropertiesService.getScriptProperties().getProperty('status_' + systemKey) || 'open';
  var isAdmin = (e && e.parameter && e.parameter.admin === 'true');
  if (status === 'closed' && !isAdmin) {
    var template = HtmlService.createTemplateFromFile('html_closed');
    template.url = getSystemUrl();
    return template.evaluate().setTitle('System Closed - SV.GOLF').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  logVisit(systemKey);

  if (fallbackFunc && typeof this[fallbackFunc] === 'function') {
    return this[fallbackFunc](e);
  }

  var template = HtmlService.createTemplateFromFile(fileName);
  template.url = getSystemUrl();
  var manualUrlProp = PropertiesService.getScriptProperties().getProperty('manual_' + systemKey);
  var tabName = systemKey;
  if (systemKey === 'classroom_obs' || systemKey === 'system6') tabName = 'supervision';
  template.manualUrl = manualUrlProp ? manualUrlProp : (template.url + '?page=manual&tab=' + tabName);
  return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getImageBase64(fileName) {
  try {
    var files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
      var file = files.next();
      var blob = file.getBlob();
      return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
    }
  } catch (err) {}
  return ''; 
}

// ---------------------------------------------------------
// Execution Time Tracking System
// ---------------------------------------------------------

function logExecutionTime(mode, durationMs) {
  try {
    var props = PropertiesService.getScriptProperties();
    var today = new Date().toISOString().split('T')[0];
    
    // Overall total execution time (all time)
    var totalKey = 'exec_time_total';
    var currentTotal = parseInt(props.getProperty(totalKey)) || 0;
    props.setProperty(totalKey, (currentTotal + durationMs).toString());
    
    // Mode specific execution time (all time)
    var modeKey = 'exec_time_mode_' + mode;
    var currentMode = parseInt(props.getProperty(modeKey)) || 0;
    props.setProperty(modeKey, (currentMode + durationMs).toString());
    
  } catch (e) {
    // Ignore errors to not break execution
  }
}

function getExecutionStats() {
  try {
    var props = PropertiesService.getScriptProperties();
    var allProps = props.getProperties();
    
    var totalMs = parseInt(allProps['exec_time_total']) || 0;
    var modes = {};
    
    for (var key in allProps) {
      if (key.startsWith('exec_time_mode_')) {
        var modeName = key.replace('exec_time_mode_', '');
        modes[modeName] = parseInt(allProps[key]) || 0;
      }
    }
    
    return {
      status: 'success',
      totalSeconds: (totalMs / 1000).toFixed(2),
      modes: modes
    };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function doGetSupervision(e) {
  var template = HtmlService.createTemplateFromFile('html_supervision');
  template.url = getSystemUrl();
  return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

const MAIN_SPREADSHEET_ID = '11yGuC2wfJOM1Ibqfb0wCo9J9_mNlJjbZKq-YtVpDGl0';

function setupSupervisionDatabase() {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    let schoolSheet = ss.getSheetByName('SV_Schools');
    if (!schoolSheet) {
      schoolSheet = ss.insertSheet('SV_Schools');
      schoolSheet.appendRow(['school_id', 'school_name', 'district', 'group_name', 'director_name', 'phone']);
      const nanoy2 = [
        ['SCH01','รร.บ้านนาน้อย','นาน้อย','นาน้อย 2','-','-'],
        ['SCH02','รร.ชุมชนบ้านอ้อย','นาน้อย','นาน้อย 2','-','-'],
        ['SCH03','รร.ประปริตวรวัฒน์','นาน้อย','นาน้อย 2','-','-'],
        ['SCH04','รร.บ้านหนองห้า','นาน้อย','นาน้อย 2','-','-'],
        ['SCH05','รร.บ้านทัพทับทอง','นาน้อย','นาน้อย 2','-','-'],
        ['SCH06','รร.บ้านน้ำตก','นาน้อย','นาน้อย 2','-','-'],
        ['SCH07','รร.บ้านเขตเขตวน','นาน้อย','นาน้อย 2','-','-'],
        ['SCH08','รร.บ้านน้ำมวบกลาง','นาน้อย','นาน้อย 2','-','-']
      ];
      schoolSheet.getRange(2, 1, nanoy2.length, 6).setValues(nanoy2);
    }
    let insSheet = ss.getSheetByName('SV_Inspections');
    const headers = ['inspection_id', 'school_id', 'inspector', 'date', 'score_1', 'score_2', 'score_3', 'score_4', 'score_5', 'strengths', 'improvements', 'suggestions', 'gps', 'image_ids', 'dir_phone', 'dep_name', 'dep_phone', 'staff_adm', 'staff_tch', 'staff_oth', 'staff_tot', 'std_pre', 'std_pri', 'std_sec', 'std_tot'];
    if (!insSheet) {
      insSheet = ss.insertSheet('SV_Inspections');
      insSheet.appendRow(headers);
      insSheet.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('white');
    }
  } catch (e) {}
}

function getSupervisionInitialData() {
  const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
  setupSupervisionDatabase();
  const schools = ss.getSheetByName('SV_Schools').getDataRange().getValues();
  const items = ss.getSheetByName('SV_ChecklistItems').getDataRange().getValues();
  return {
    schools: schools.slice(1).map(r => ({ id: r[0], name: r[1], district: r[2], group: r[3], director: r[4], phone: r[5] })),
    checklist: items.slice(1).map(r => ({ id: r[0], category: r[1], name: r[2] }))
  };
}

function saveSupervisionData(data) {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    let insSheet = ss.getSheetByName('SV_Inspections');
    let resSheet = ss.getSheetByName('SV_Results');
    const isUpdate = !!data.inspection_id;
    const inspectionId = isUpdate ? data.inspection_id : ('INS' + new Date().getTime());
    const mainData = [inspectionId, data.school_id, data.inspector, new Date(), (data.scores[0]||0), (data.scores[1]||0), (data.scores[2]||0), (data.scores[3]||0), (data.scores[4]||0), data.strengths||'-', data.improvements||'-', data.suggestions||'-', data.gps||'', '', data.dir_phone||'', data.dep_name||'', data.dep_phone||'', (data.staff_adm||0), (data.staff_tch||0), (data.staff_oth||0), (data.staff_tot||0), (data.std_pre||0), (data.std_pri||0), (data.std_sec||0), (data.std_tot||0)];
    if (isUpdate) {
      const ids = insSheet.getRange("A:A").getValues().map(r => r[0].toString());
      const rowIdx = ids.indexOf(inspectionId) + 1;
      if (rowIdx > 0) insSheet.getRange(rowIdx, 1, 1, mainData.length).setValues([mainData]);
      const resIds = resSheet.getRange("B:B").getValues().map(r => r[0].toString());
      for (let i = resIds.length; i >= 1; i--) { if (resIds[i-1] === inspectionId) resSheet.deleteRow(i); }
    } else { insSheet.appendRow(mainData); }
    if (data.results && data.results.length > 0) {
      const rows = data.results.map(r => ['RES'+Math.random().toString(36).substr(2,9), inspectionId, r.item_id, r.score, r.comment, '']);
      resSheet.getRange(resSheet.getLastRow()+1, 1, rows.length, 6).setValues(rows);
    }
    return { success: true };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function getInspectionDetails(id) {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const insSheet = ss.getSheetByName('SV_Inspections');
    const resSheet = ss.getSheetByName('SV_Results');
    const rows = insSheet.getDataRange().getValues();
    const m = rows.find(r => r[0].toString() === id);
    if (!m) return { success: false, error: "ไม่พบข้อมูลการนิเทศรหัส: " + id };
    
    const resRows = resSheet.getDataRange().getValues();
    const results = resRows.filter(r => r[1].toString() === id).map(r => ({ item_id: r[2], score: r[3], comment: r[4] }));
    
    const safeStr = (v) => {
      if (v instanceof Date) {
        if (v.getFullYear() < 1910) return Utilities.formatDate(v, "GMT+7", "HH:mm");
        return Utilities.formatDate(v, "GMT+7", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      }
      return (v == null ? '' : String(v));
    };

    return { 
      success: true, 
      data: { 
        id: safeStr(m[0]), 
        school_id: safeStr(m[1]), 
        inspector: safeStr(m[2]), 
        scores: [parseFloat(m[4]||0), parseFloat(m[5]||0), parseFloat(m[6]||0), parseFloat(m[7]||0), parseFloat(m[8]||0)],
        strengths: safeStr(m[9]), 
        improvements: safeStr(m[10]), 
        suggestions: safeStr(m[11]), 
        dir_phone: safeStr(m[14]), 
        dep_name: safeStr(m[15]), 
        dep_phone: safeStr(m[16]), 
        staff_adm: m[17], 
        staff_tch: m[18], 
        staff_oth: m[19], 
        staff_tot: m[20], 
        std_pre: m[21], 
        std_pri: m[22], 
        std_sec: m[23], 
        std_tot: m[24], 
        date: safeStr(m[3]),
        results 
      } 
    };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function deleteInspection(id) {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const insSheet = ss.getSheetByName('SV_Inspections');
    const resSheet = ss.getSheetByName('SV_Results');
    const ids = insSheet.getRange("A:A").getValues().map(r => r[0].toString());
    const row = ids.indexOf(id) + 1;
    if (row > 0) insSheet.deleteRow(row);
    const resIds = resSheet.getRange("B:B").getValues().map(r => r[0].toString());
    for (let i = resIds.length; i >= 1; i--) { if (resIds[i-1] === id) resSheet.deleteRow(i); }
    return { success: true };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function getSupervisionDashboardData() {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const insSheet = ss.getSheetByName('SV_Inspections');
    const data = insSheet.getDataRange().getValues().slice(1);
    
    const list = data.map(r => {
      let dateStr = '-';
      try {
        if (r[3] instanceof Date) {
          dateStr = Utilities.formatDate(r[3], "GMT+7", "dd/MM/yyyy");
        } else if (r[3]) {
          dateStr = String(r[3]);
        }
      } catch (e) {}
      
      const score = ((parseFloat(r[4]||0)+parseFloat(r[5]||0)+parseFloat(r[6]||0)+parseFloat(r[7]||0)+parseFloat(r[8]||0))/5).toFixed(2);
      
      return { 
        id: r[0], 
        school_id: r[1], 
        inspector: r[2], 
        date: dateStr, 
        score: isNaN(score) ? '0.00' : score 
      };
    }).reverse();

    return { total: list.length, list: list };
  } catch (e) { return { total: 0, list: [] }; }
}

function getSupervisionSummaryData() {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const rows = ss.getSheetByName('SV_Inspections').getDataRange().getValues().slice(1);
    const schools = ss.getSheetByName('SV_Schools').getDataRange().getValues().slice(1);
    
    const latestPerSchool = {};
    rows.forEach(r => { latestPerSchool[r[1]] = r; });
    const latestRows = Object.values(latestPerSchool);
    
    const staffSum = { adm: 0, tch: 0, oth: 0, tot: 0 };
    const stdSum = { pre: 0, pri: 0, sec: 0, tot: 0 };
    
    latestRows.forEach(r => {
      staffSum.adm += (parseFloat(r[17]) || 0); staffSum.tch += (parseFloat(r[18]) || 0); staffSum.oth += (parseFloat(r[19]) || 0); staffSum.tot += (parseFloat(r[20]) || 0);
      stdSum.pre += (parseFloat(r[21]) || 0); stdSum.pri += (parseFloat(r[22]) || 0); stdSum.sec += (parseFloat(r[23]) || 0); stdSum.tot += (parseFloat(r[24]) || 0);
    });
    
    const schoolStats = schools.map(s => {
      const ins = rows.filter(r => r[1] === s[0]);
      if (ins.length === 0) return { name: s[1], score: 0, count: 0 };
      const total = ins.reduce((acc, r) => acc + (parseFloat(r[4]||0)+parseFloat(r[5]||0)+parseFloat(r[6]||0)+parseFloat(r[7]||0)+parseFloat(r[8]||0))/5, 0);
      return { name: s[1], score: (total / ins.length).toFixed(2), count: ins.length };
    });
    
    const categoryAverages = [0,1,2,3,4].map(i => {
      const vals = rows.map(r => parseFloat(r[4+i]||0)).filter(v => v > 0);
      return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : 0;
    });
    
    const totals = {
      staff_adm: staffSum.adm, staff_tch: staffSum.tch, staff_oth: staffSum.oth, staff_tot: staffSum.tot,
      std_pre: stdSum.pre, std_pri: stdSum.pri, std_sec: stdSum.sec, std_tot: stdSum.tot
    };
    
    return {
      success: true,
      totalCount: rows.length,
      totalInspected: latestRows.length,
      totalSchools: schools.length,
      schoolStats: schoolStats,
      categoryAverages: categoryAverages,
      totals: totals
    };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function getClassroomObsSSID() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('CLASSROOM_OBS_SSID_V2'); 
  if (!id) {
    const ss = SpreadsheetApp.create('SV_GOLF_Classroom_Observation_DB');
    id = ss.getId();
    props.setProperty('CLASSROOM_OBS_SSID_V2', id);
    
    const obsSheet = ss.insertSheet('SV_ClassroomObs');
    obsSheet.appendRow([
      'obs_id', 'school_id', 'grade_level', 'teacher_name', 'topic', 'activity_name', 
      'obs_date', 'start_time', 'end_time', 'observer_name',
      'std_male', 'std_female', 'std_total', 'std_special', 'std_absent',
      'obj_text', 'intro_teach', 'intro_std', 'intro_note',
      'dev_teach', 'dev_std', 'dev_note', 'con_teach', 'con_std', 'con_note',
      'strengths', 'improvements', 'suggestions', 'score_avg',
      'photo_1', 'photo_2', 'photo_3', 'photo_4'
    ]);
    
    const resSheet = ss.insertSheet('SV_ClassroomObsResults');
    resSheet.appendRow(['res_id', 'obs_id', 'item_id', 'score', 'comment']);
    
    const itemsSheet = ss.insertSheet('SV_ClassroomObsItems');
    itemsSheet.appendRow(['item_id', 'item_name']);
    const defaultItems = [
      ['OBS1', 'จัดทำแผนการจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ'],
      ['OBS2', 'จัดกิจกรรมการเรียนรู้ด้วยวิธีที่หลากหลาย'],
      ['OBS3', 'จัดกิจกรรมการเรียนรู้ให้ผู้เรียนฝึกค้นคว้า สังเกต รวบรวมข้อมูล วิเคราะห์ คิดอย่างหลากหลาย และสร้างสรรค์ สามารถสรุปองค์ความรู้ได้ด้วยตนเอง'],
      ['OBS4', 'กระตุ้นให้ผู้เรียนมีส่วนร่วมแสดงความคิดเห็น ค้นคว้า แสวงหาคำตอบด้วยตนเอง'],
      ['OBS5', 'ให้ผู้เรียนมีการเรียนรู้จากสื่อที่หลากหลายรูปแบบ'],
      ['OBS6', 'มีการสอดแทรกคุณธรรม จริยธรรม ให้แรงเสริมแก่ผู้เรียนในการจัดกิจกรรมการเรียนรู้'],
      ['OBS7', 'จัดบรรยากาศการเรียนรู้ที่ดึงดูดความสนใจ ก่อให้เกิดความสุขและเพลิดเพลินแก่ผู้เรียน'],
      ['OBS8', 'มีกระบวนการวัดผลและประเมินผลตามสภาพจริง'],
      ['OBS9', 'มีเครื่องมือการวัดผลและประเมินผลที่มีคุณภาพ'],
      ['OBS10', 'นักเรียนมีส่วนร่วมในการวัดผลและประเมินผล']
    ];
    itemsSheet.getRange(2, 1, defaultItems.length, 2).setValues(defaultItems);
    
    const s1 = ss.getSheetByName('Sheet1');
    if (s1) ss.deleteSheet(s1);
  }
  return id;
}

function setupClassroomObsDatabase() {
  try {
    getClassroomObsSSID();
  } catch (e) {}
}

function getClassroomObsInitialData() {
  const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
  setupClassroomObsDatabase();
  const schools = ss.getSheetByName('SV_Schools').getDataRange().getValues();
  const items = ss.getSheetByName('SV_ClassroomObsItems').getDataRange().getValues();
  return {
    schools: schools.slice(1).map(r => ({ id: r[0], name: r[1], group: r[3] })),
    checklist: items.slice(1).map(r => ({ id: r[0], name: r[1] }))
  };
}

function saveClassroomObsData(data) {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    let obsSheet = ss.getSheetByName('SV_ClassroomObs');
    let resSheet = ss.getSheetByName('SV_ClassroomObsResults');
    
    const isUpdate = !!data.obs_id;
    const obsId = isUpdate ? data.obs_id : ('OBS' + new Date().getTime());
    
    let totalScore = 0;
    if (data.results && data.results.length > 0) {
      totalScore = data.results.reduce((a, b) => a + (parseFloat(b.score) || 0), 0) / data.results.length;
    }

    const mainData = [
      obsId, data.school_id, data.grade_level, data.teacher_name, data.topic, data.activity_name,
      data.obs_date, data.start_time, data.end_time, data.observer_name,
      data.std_male, data.std_female, data.std_total, data.std_special, data.std_absent,
      data.obj_text, data.intro_teach, data.intro_std, data.intro_note,
      data.dev_teach, data.dev_std, data.dev_note, data.con_teach, data.con_std, data.con_note,
      data.strengths, data.improvements, data.suggestions, totalScore.toFixed(2),
      data.photo_1 || '', data.photo_2 || '', data.photo_3 || '', data.photo_4 || ''
    ];

    if (isUpdate) {
      const ids = obsSheet.getRange("A:A").getValues().map(r => r[0].toString());
      const rowIdx = ids.indexOf(obsId) + 1;
      if (rowIdx > 0) obsSheet.getRange(rowIdx, 1, 1, mainData.length).setValues([mainData]);
      
      const resIds = resSheet.getRange("B:B").getValues().map(r => r[0].toString());
      for (let i = resIds.length; i >= 1; i--) { if (resIds[i-1] === obsId) resSheet.deleteRow(i); }
    } else {
      obsSheet.appendRow(mainData);
    }
    
    if (data.results && data.results.length > 0) {
      const rows = data.results.map(r => ['CRES'+Math.random().toString(36).substr(2,9), obsId, r.item_id, r.score, r.comment]);
      resSheet.getRange(resSheet.getLastRow()+1, 1, rows.length, 5).setValues(rows);
    }
    return { success: true, id: obsId };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function getClassroomObsDashboardData() {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const obsSheet = ss.getSheetByName('SV_ClassroomObs');
    const rawData = obsSheet.getDataRange().getValues();
    
    const data = rawData.filter(r => r[0] && r[0] !== 'obs_id');
    const safeStr = (v) => {
      if (v instanceof Date) {
        if (v.getFullYear() < 1910) return Utilities.formatDate(v, "GMT+7", "HH:mm");
        return Utilities.formatDate(v, "GMT+7", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      }
      return (v == null ? '' : String(v));
    };
    
    return { 
      total: data.length, 
      list: data.map(r => ({ 
        id: safeStr(r[0]), school_id: safeStr(r[1]), grade: safeStr(r[2]), teacher: safeStr(r[3]), 
        date: safeStr(r[6]), score: safeStr(r[28]) 
      })).reverse() 
    };
  } catch (e) { return { total: 0, list: [], error: e.toString() }; }
}

function getClassroomObsDetails(id) {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const obsSheet = ss.getSheetByName('SV_ClassroomObs');
    const resSheet = ss.getSheetByName('SV_ClassroomObsResults');
    
    const rows = obsSheet.getDataRange().getValues();
    const m = rows.find(r => r[0].toString() === id);
    if (!m) return { success: false, error: "Not found" };
    
    const resRows = resSheet.getDataRange().getValues();
    const results = resRows.filter(r => r[1].toString() === id).map(r => ({ item_id: r[2], score: r[3], comment: r[4] }));
    
    const safeStr = (v) => {
      if (v instanceof Date) {
        if (v.getFullYear() < 1910) return Utilities.formatDate(v, "GMT+7", "HH:mm");
        return Utilities.formatDate(v, "GMT+7", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      }
      return (v == null ? '' : String(v));
    };
    const data = {
      id: safeStr(m[0]), school_id: safeStr(m[1]), grade_level: safeStr(m[2]), teacher_name: safeStr(m[3]), topic: safeStr(m[4]), activity_name: safeStr(m[5]),
      obs_date: safeStr(m[6]), start_time: safeStr(m[7]), end_time: safeStr(m[8]), observer_name: safeStr(m[9]),
      std_male: m[10], std_female: m[11], std_total: m[12], std_special: m[13], std_absent: m[14],
      obj_text: safeStr(m[15]), intro_teach: safeStr(m[16]), intro_std: safeStr(m[17]), intro_note: safeStr(m[18]),
      dev_teach: safeStr(m[19]), dev_std: safeStr(m[20]), dev_note: safeStr(m[21]), con_teach: safeStr(m[22]), con_std: safeStr(m[23]), con_note: safeStr(m[24]),
      strengths: safeStr(m[25]), improvements: safeStr(m[26]), suggestions: safeStr(m[27]), score_avg: safeStr(m[28]),
      photo_1: safeStr(m[29]), photo_2: safeStr(m[30]), photo_3: safeStr(m[31]), photo_4: safeStr(m[32]),
      results: results
    };
    return { success: true, data: data };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function deleteClassroomObs(id) {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const obsSheet = ss.getSheetByName('SV_ClassroomObs');
    const resSheet = ss.getSheetByName('SV_ClassroomObsResults');
    
    const ids = obsSheet.getRange("A:A").getValues().map(r => r[0].toString());
    const row = ids.indexOf(id) + 1;
    if (row > 0) obsSheet.deleteRow(row);
    
    const resIds = resSheet.getRange("B:B").getValues().map(r => r[0].toString());
    for (let i = resIds.length; i >= 1; i--) { if (resIds[i-1] === id) resSheet.deleteRow(i); }
    
    return { success: true };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function getClassroomObsSummaryData() {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    
    const rawRows = ss.getSheetByName('SV_ClassroomObs').getDataRange().getValues();
    const rows = rawRows.filter(r => r[0] && r[0] !== 'obs_id');
    
    const rawResRows = ss.getSheetByName('SV_ClassroomObsResults').getDataRange().getValues();
    const resRows = rawResRows.filter(r => r[0] && r[0] !== 'res_id');
    
    const rawItems = ss.getSheetByName('SV_ClassroomObsItems').getDataRange().getValues();
    const items = rawItems.filter(r => r[0] && r[0] !== 'item_id');
    
    const itemAverages = items.map(item => {
      const scores = resRows.filter(r => r[2] === item[0]).map(r => parseFloat(r[3]) || 0);
      const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;
      return { id: item[0], name: item[1], avg: avg };
    });

    const uniqueSchools = new Set(rows.map(r => r[1])).size;
    const uniqueTeachers = new Set(rows.map(r => r[3])).size;
    const totalStudents = rows.reduce((acc, r) => acc + (parseInt(r[12]) || 0), 0);

    return { 
      success: true, 
      totalObs: rows.length,
      avgScore: rows.length > 0 ? (rows.reduce((a, b) => a + (parseFloat(b[28]) || 0), 0) / rows.length).toFixed(2) : 0,
      itemAverages: itemAverages,
      uniqueSchools: uniqueSchools,
      uniqueTeachers: uniqueTeachers,
      totalStudents: totalStudents
    };
  } catch (e) { return { success: false, error: e.toString() }; }
}

function logVisit(key) {
  var props = PropertiesService.getScriptProperties();
  var count = parseInt(props.getProperty('stats_' + key) || '0');
  props.setProperty('stats_' + key, (count + 1).toString());
}

function getSystemStatuses() {
  var props = PropertiesService.getScriptProperties();
  return {
    supervision: props.getProperty('status_supervision') || 'open',
    toolkit: props.getProperty('status_toolkit') || 'open',
    assessment: props.getProperty('status_assessment') || 'open',
    management: props.getProperty('status_management') || 'open',
    meeting: props.getProperty('status_meeting') || 'open',
    system5: props.getProperty('status_system5') || 'open',
    system6: props.getProperty('status_system6') || 'open',
    onet_bank: props.getProperty('status_onet_bank') || 'open',
    classroom_obs: props.getProperty('status_classroom_obs') || 'open',
    p1_ondemand: props.getProperty('status_p1_ondemand') || 'open'
  };
}

function getManualUrls() {
  var props = PropertiesService.getScriptProperties();
  var baseUrl = getSystemUrl() + '?page=manual';
  return {
    dashboard: props.getProperty('manual_dashboard') || (baseUrl + '&tab=main'),
    supervision: props.getProperty('manual_supervision') || (baseUrl + '&tab=supervision'),
    toolkit: props.getProperty('manual_toolkit') || (baseUrl + '&tab=toolkit'),
    assessment: props.getProperty('manual_assessment') || (baseUrl + '&tab=assessment'),
    management: props.getProperty('manual_management') || (baseUrl + '&tab=main'),
    meeting: props.getProperty('manual_meeting') || (baseUrl + '&tab=main'),
    system5: props.getProperty('manual_system5') || (baseUrl + '&tab=main'),
    system6: props.getProperty('manual_system6') || (baseUrl + '&tab=supervision'),
    onet_bank: props.getProperty('manual_onet_bank') || (baseUrl + '&tab=main'),
    classroom_obs: props.getProperty('manual_classroom_obs') || (baseUrl + '&tab=supervision'),
    p1_ondemand: props.getProperty('manual_p1_ondemand') || (baseUrl + '&tab=main')
  };
}
function serveSupervisionReport(e) {
  const id = e.parameter.id;
  const template = HtmlService.createTemplateFromFile('html_supervision_report');
  template.inspectionId = id;
  template.url = getSystemUrl();
  return template.evaluate()
    .setTitle('รายงานผลการนิเทศ - SV.GOLF')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveClassroomObsReport(e) {
  const id = e.parameter.id;
  const template = HtmlService.createTemplateFromFile('html_classroom_obs_report');
  template.obsId = id;
  template.url = getSystemUrl();
  return template.evaluate()
    .setTitle('รายงานการนิเทศชั้นเรียน - SV.GOLF')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * --- Administrative & Feedback Functions ---
 */

function getAdminContent(pw) {
  if (pw !== ADMIN_PASSWORD) return "INVALID";
  var template = HtmlService.createTemplateFromFile('html_admin');
  template.url = getSystemUrl();
  template.manualUrls = getManualUrls();
  return template.evaluate().getContent();
}

function saveFeedback(data) {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    let sheet = ss.getSheetByName("SV_Feedbacks");
    if (!sheet) {
      sheet = ss.insertSheet("SV_Feedbacks");
      sheet.appendRow(["วัน-เวลา", "ระบบ", "ข้อความ/ปัญหา", "ข้อมูลติดต่อ"]);
    }
    sheet.appendRow([new Date(), data.system, data.message, data.contact]);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getFeedbackData() {
  try {
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const sheet = ss.getSheetByName("SV_Feedbacks");
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues().slice(1);
    return data.map(r => ({
      timestamp: Utilities.formatDate(new Date(r[0]), "GMT+7", "dd/MM/yyyy HH:mm"),
      system: r[1],
      message: r[2],
      contact: r[3]
    })).reverse().slice(0, 50);
  } catch (e) { return []; }
}

function getUsageStats() {
  const props = PropertiesService.getScriptProperties();
  const keys = ['dashboard', 'toolkit', 'assessment', 'management', 'meeting', 'system5', 'system6', 'classroom_obs', 'onet_bank', 'p1_ondemand'];
  let stats = { totalOverall: 0 };
  
  keys.forEach(k => {
    const count = parseInt(props.getProperty('stats_' + k) || '0');
    stats[k] = { count: count };
    stats.totalOverall += count;
  });
  
  return stats;
}

function toggleSystemStatus(key, status) {
  PropertiesService.getScriptProperties().setProperty('status_' + key, status);
  return true;
}

function updateManualUrl(key, url) {
  PropertiesService.getScriptProperties().setProperty('manual_' + key, url);
  return { success: true };
}

