
// Auth
function login(e){
  e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();
  if(user === 'lama' && pass === '12345'){
    localStorage.setItem('mp_user', user);
    // seed ests
    seedEstablishments();
    // nice transition
    playTone();
    setTimeout(()=>{ window.location.href='dashboard.html'; }, 700);
  } else {
    alert('اسم المستخدم أو كلمة المرور غير صحيحة');
  }
}
function logout(){ localStorage.removeItem('mp_user'); window.location.href='login.html'; }
function ensureAuth(){ const u = localStorage.getItem('mp_user'); if(!u) window.location.href='login.html'; return u; }

// WebAudio tone
function playTone(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type='sine'; o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    setTimeout(()=>{ o.stop(); ctx.close(); }, 600);
  }catch(e){ console.log(e); }
}

// seed establishments
function seedEstablishments(){
  if(localStorage.getItem('mp_establishments')) return;
  const ests = [
    {id:'A', name:'المنشأة A', addr:'الرياض', compliant:true},
    {id:'B', name:'المنشأة B', addr:'جدة', compliant:false},
    {id:'C', name:'المنشأة C', addr:'الدمام', compliant:true}
  ];
  localStorage.setItem('mp_establishments', JSON.stringify(ests));
}

// sidebar toggle
function toggleSub(id){
  const el = document.getElementById(id);
  if(el) el.classList.toggle('open');
  playTone();
}

// render dashboard
function renderDashboard(){
  const user = ensureAuth();
  document.getElementById('userName').innerText = user;
  renderSidebarCounts();
  const ests = JSON.parse(localStorage.getItem('mp_establishments')||'[]');
  const grid = document.getElementById('estGrid'); grid.innerHTML='';
  ests.forEach(est => {
    const card = document.createElement('div'); card.className='card est-card';
    card.innerHTML = `
      <div class="meta">
        <div><div style="font-weight:800">${est.name}</div><div class="small">${est.addr}</div></div>
        <div style="text-align:left"><div class="status ${est.compliant? 'ok':'warn'}">${est.compliant? 'مستوفية':'ناقصة'}</div></div>
      </div>
      <div class="small">تحقق من وسائل الحماية وعدد عناصر السلامة في الموقع.</div>
      <div class="uploader">
        <label class="btn ghost">اختيار تقرير PDF
          <input type="file" accept="application/pdf" style="display:none" onchange="handleUpload(event,'${est.id}')">
        </label>
        <button class="btn" onclick="toggleCompliance('${est.id}')">تغيير الحالة</button>
        <button class="btn" onclick="viewReports('${est.id}')">عرض التقارير</button>
      </div>
      <div class="file-list" id="files_${est.id}"></div>
    `;
    grid.appendChild(card);
    renderFilesForEst(est.id);
  });
}

// toggle compliance
function toggleCompliance(id){
  const ests = JSON.parse(localStorage.getItem('mp_establishments')||'[]');
  const idx = ests.findIndex(e=>e.id===id);
  if(idx>=0){ ests[idx].compliant = !ests[idx].compliant; localStorage.setItem('mp_establishments', JSON.stringify(ests)); renderDashboard(); playTone(); }
}

// upload handling
function handleUpload(evt, estId){
  const file = evt.target.files[0]; if(!file) return;
  if(file.type !== 'application/pdf'){ alert('الرجاء رفع ملف PDF'); return; }
  const reader = new FileReader();
  reader.onload = function(e){
    const base64 = e.target.result.split(',')[1];
    const reports = JSON.parse(localStorage.getItem('mp_reports')||'[]');
    reports.push({id:'r'+Date.now(), estId, name:file.name, data:base64, mime:file.type, uploader: localStorage.getItem('mp_user')||'غير معروف', ts:Date.now()});
    localStorage.setItem('mp_reports', JSON.stringify(reports));
    renderFilesForEst(estId);
    renderSidebarCounts();
    playTone();
    alert('تم رفع التقرير بنجاح (تخزين محلي مؤقت)');
  };
  reader.readAsDataURL(file);
  evt.target.value='';
}

// render files for est
function renderFilesForEst(estId){
  const list = document.getElementById('files_'+estId);
  const reports = JSON.parse(localStorage.getItem('mp_reports')||'[]').filter(r=>r.estId===estId);
  list.innerHTML='';
  if(reports.length===0){ list.innerHTML='<div class="small">لا توجد تقارير مرفوعة بعد.</div>'; return; }
  reports.forEach(r=>{
    const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center';
    const left = document.createElement('div'); left.innerText = r.name + ' · ' + (new Date(r.ts)).toLocaleString();
    const actions = document.createElement('div');
    const view = document.createElement('button'); view.className='btn ghost'; view.innerText='عرض'; view.onclick = ()=>viewReport(r);
    const dl = document.createElement('button'); dl.className='btn'; dl.style.marginLeft='8px'; dl.innerText='تحميل'; dl.onclick = ()=>downloadReport(r);
    actions.appendChild(view); actions.appendChild(dl);
    row.appendChild(left); row.appendChild(actions);
    list.appendChild(row);
  });
}

// view/download helpers
function viewReport(r){ const byteChars = atob(r.data); const byteNumbers = new Array(byteChars.length); for(let i=0;i<byteChars.length;i++){ byteNumbers[i]=byteChars.charCodeAt(i); } const byteArray = new Uint8Array(byteNumbers); const blob = new Blob([byteArray], {type:r.mime}); const url = URL.createObjectURL(blob); window.open(url,'_blank'); }
function downloadReport(r){ const byteChars = atob(r.data); const byteNumbers = new Array(byteChars.length); for(let i=0;i<byteChars.length;i++){ byteNumbers[i]=byteChars.charCodeAt(i); } const byteArray = new Uint8Array(byteNumbers); const blob = new Blob([byteArray], {type:r.mime}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = r.name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// view reports (open first)
function viewReports(estId){
  const reports = JSON.parse(localStorage.getItem('mp_reports')||'[]').filter(r=>r.estId===estId);
  if(reports.length===0){ alert('لا توجد تقارير لهذا المنشأ'); return; }
  viewReport(reports[0]);
}

// global upload (general reports)
function handleGlobalUpload(evt){
  const file = evt.target.files[0]; if(!file) return;
  if(file.type !== 'application/pdf'){ alert('الرجاء رفع ملف PDF'); return; }
  const reader = new FileReader();
  reader.onload = function(e){
    const base64 = e.target.result.split(',')[1];
    const reports = JSON.parse(localStorage.getItem('mp_reports')||'[]');
    reports.push({id:'r'+Date.now(), estId:'GLOBAL', name:file.name, data:base64, mime:file.type, uploader: localStorage.getItem('mp_user')||'غير معروف', ts:Date.now()});
    localStorage.setItem('mp_reports', JSON.stringify(reports));
    renderGlobalFiles();
    renderSidebarCounts();
    playTone();
    alert('تم رفع التقرير العام بنجاح');
  };
  reader.readAsDataURL(file);
  evt.target.value='';
}

function renderGlobalFiles(){
  const list = document.getElementById('globalFiles');
  const reports = JSON.parse(localStorage.getItem('mp_reports')||'[]').filter(r=>r.estId==='GLOBAL');
  list.innerHTML='';
  if(reports.length===0){ list.innerHTML='<div class="small">لا توجد تقارير عامة بعد.</div>'; return; }
  reports.forEach(r=>{
    const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center';
    const left = document.createElement('div'); left.innerText = r.name + ' · ' + (new Date(r.ts)).toLocaleString();
    const actions = document.createElement('div');
    const view = document.createElement('button'); view.className='btn ghost'; view.innerText='عرض'; view.onclick = ()=>viewReport(r);
    const dl = document.createElement('button'); dl.className='btn'; dl.style.marginLeft='8px'; dl.innerText='تحميل'; dl.onclick = ()=>downloadReport(r);
    actions.appendChild(view); actions.appendChild(dl);
    row.appendChild(left); row.appendChild(actions);
    list.appendChild(row);
  });
}

// zip all reports (create blob zip client-side)
function downloadAllZip(){
  const reports = JSON.parse(localStorage.getItem('mp_reports')||'[]');
  if(reports.length===0){ alert('لا توجد تقارير لتحميلها'); return; }
  // create zip via JSZip if available; fallback: download each file sequentially (simpler)
  if(typeof JSZip !== 'undefined'){
    const zip = new JSZip();
    reports.forEach(r=>{
      const byteChars = atob(r.data);
      const byteNumbers = new Array(byteChars.length);
      for(let i=0;i<byteChars.length;i++){ byteNumbers[i]=byteChars.charCodeAt(i); }
      const u8 = new Uint8Array(byteNumbers);
      zip.file(r.name, u8);
    });
    zip.generateAsync({type:'blob'}).then(function(content){
      const a = document.createElement('a'); a.href = URL.createObjectURL(content); a.download = 'reports_all.zip'; document.body.appendChild(a); a.click(); a.remove();
    });
  } else {
    // simple: create a folder-like download by zipping on the client is not available -> prompt user to individually download or use server
    alert('ميزة تحميل جميع التقارير كمضغوط تتطلب اتصال إنترنت لتنزيل مكتبة JSZip (مضمنة إن لزم) أو تحميل فردي للملفات.');
  }
}

// sidebar counts
function renderSidebarCounts(){
  const ests = JSON.parse(localStorage.getItem('mp_establishments')||'[]');
  const ok = ests.filter(e=>e.compliant).length;
  const warn = ests.length - ok;
  const el = document.getElementById('sideCounts');
  if(el) el.innerText = `المستوفية ${ok} · الناقصة ${warn}`;
}

// Video helper - uses embedded iframes in HTML
// PPE gallery render
function renderPPE(){
  const container = document.getElementById('ppeGallery');
  if(!container) return;
  const imgs = Array.from(document.querySelectorAll('.ppe-src'));
  container.innerHTML='';
  imgs.forEach(img=>{
    const c = document.createElement('div'); c.className='ppe-card';
    c.innerHTML = `<img src="${img.src}" style="width:100%;height:120px;object-fit:cover;border-radius:6px"><div style="font-weight:700;margin-top:6px">${img.alt}</div><div class="small">${img.dataset.desc||''}</div>`;
    container.appendChild(c);
  });
}

// About page render
function initAbout(){ ensureAuth(); document.getElementById('userName').innerText = localStorage.getItem('mp_user')||''; }

document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('estGrid')){ seedEstablishments(); renderDashboard(); renderPPE(); renderGlobalFiles(); }
  if(document.getElementById('aboutPage')){ initAbout(); }
});



// Helper: show temporary popup notification in center
function showPopup(message, duration=2000){
  let el = document.createElement('div');
  el.style.position='fixed';
  el.style.zIndex=99999;
  el.style.left='50%';
  el.style.top='50%';
  el.style.transform='translate(-50%,-50%)';
  el.style.background='linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9))';
  el.style.color='#2f2f2f';
  el.style.padding='14px 18px';
  el.style.borderRadius='10px';
  el.style.boxShadow='0 10px 30px rgba(0,0,0,0.4)';
  el.style.fontWeight='700';
  el.innerText = message;
  document.body.appendChild(el);
  setTimeout(()=>{ el.remove(); }, duration);
}

// Play completion tone
function playCompletionTone(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type='sine'; o.frequency.value = 660;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.6);
    setTimeout(()=>{ o.stop(); ctx.close(); }, 700);
  }catch(e){ console.log(e); }
}

// Enhance downloadAllZip to trigger popup and completion tone (if JSZip present)
if(typeof downloadAllZip === 'function'){
  const _origDownloadAllZip = downloadAllZip;
  downloadAllZip = function(){
    // call original; but if JSZip is available, intercept to show popup on completion
    if(typeof JSZip !== 'undefined'){
      const reports = JSON.parse(localStorage.getItem('mp_reports')||'[]');
      if(reports.length===0){ alert('لا توجد تقارير لتحميلها'); return; }
      const zip = new JSZip();
      reports.forEach(r=>{
        const byteChars = atob(r.data);
        const byteNumbers = new Array(byteChars.length);
        for(let i=0;i<byteChars.length;i++){ byteNumbers[i]=byteChars.charCodeAt(i); }
        const u8 = new Uint8Array(byteNumbers);
        zip.file(r.name, u8);
      });
      zip.generateAsync({type:'blob'}).then(function(content){
        const a = document.createElement('a'); a.href = URL.createObjectURL(content); a.download = 'reports_all.zip'; document.body.appendChild(a); a.click(); a.remove();
        playCompletionTone();
        showPopup('✅ تم إنشاء الملف المضغوط بنجاح — يحمل الآن', 2400);
      });
    } else {
      // fallback to original (which prompts user)
      _origDownloadAllZip();
    }
  }
}
