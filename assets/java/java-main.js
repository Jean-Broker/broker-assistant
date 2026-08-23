// --- تحديد اللي بيظهر أول ما الصفحة تفتح ---
if (sessionStorage.getItem('isSystemOpen') === 'true') {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('systemApp').style.display = 'flex';
} else {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('systemApp').style.display = 'none';
}

// --- Language Translation Logic ---
let currentLang = 'ar';
function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-ar]').forEach(el => { el.innerHTML = el.getAttribute('data-' + currentLang); });
}

function openSystemLogin() { document.getElementById('paywallModal').style.display = 'flex'; }
function closeLoginModal() { document.getElementById('paywallModal').style.display = 'none'; }
function backToLanding() { document.getElementById('systemApp').style.display = 'none'; document.getElementById('landingPage').style.display = 'block'; }

const firebaseConfig = {
  apiKey: "AIzaSyApvrK13v-5nIB7TzhrN-M4-1Y8PSEhKoE",
  authDomain: "broker-assistant-63277.firebaseapp.com",
  projectId: "broker-assistant-63277",
  storageBucket: "broker-assistant-63277.firebasestorage.app",
  messagingSenderId: "434808917289",
  appId: "1:434808917289:web:1012be2fa30cf80cfefb38"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryApp");

window.addEventListener('load', () => {
    if(localStorage.getItem('savedEmail')) {
        document.getElementById('loginEmail').value = localStorage.getItem('savedEmail');
        document.getElementById('loginPassword').value = localStorage.getItem('savedPassword');
        document.getElementById('rememberMe').checked = true;
    }
    
    document.getElementById('fldPriceMeterMin')?.addEventListener('input', updatePriceMeterAvg);
    document.getElementById('fldPriceMeterMax')?.addEventListener('input', updatePriceMeterAvg);
    document.getElementById('fldProjectType')?.addEventListener('change', onProjectTypeChange);
    
    document.querySelectorAll('.comm-price-input').forEach(el => {
        el.addEventListener('input', () => { tempUnits.forEach(u => updateUnitArea(u.id, u.area)); });
    });
});

let currentUser = null, isAdmin = false, isEditor = false;
let mainLocations = [], compounds = [], activeSelection = 'all', activeProjectType = 'all';
let editingCompoundId = null, viewingCompoundId = null;
let tempUnits = [], tempPlans = [], tempDecrees = [], filters = {}, openMainLocIds = {}; 
let activeDetailCategory = null, activeDetailUnitId = null, calcCustomBullets = [];

const PROJECT_TYPES = { residential: 'سكني', commercial: 'تجاري / إداري', hotel: 'شقق فندقية' };
const BEDROOM_TYPES = { 
  studio: 'استوديو (Studio)', '1br': '1 غرفة نوم', '2br': '2 غرفة نوم', '3br': '3 غرف نوم', '4br': '4 غرف نوم', duplex: 'دوبلكس', penthouse: 'بنتهاوس',
  commercial: 'تجاري (Commercial)', admin: 'إداري (Admin)', clinic: 'عيادة / طبي (Clinic)', recreational: 'ترفيهي (Recreational)'
};
const FINISHING_TYPES = { core_shell: 'Core & Shell', semi: 'نصف تشطيب', full: 'تشطيب كامل' };
const FREQ_LABEL = {12:'شهري', 4:'ربع سنوي', 2:'نصف سنوي', 1:'سنوي'};
const DELIVERY_TIMELINES = [
  {value:'immediate', label:'تسليم فوري'}, {value:'6m', label:'6 أشهر'}, {value:'1y', label:'سنة'},
  {value:'1.5y', label:'سنة ونصف'}, {value:'2y', label:'سنتين'}, {value:'2.5y', label:'سنتين ونصف'},
  {value:'3y', label:'3 سنوات'}, {value:'4y', label:'4 سنوات'},
];

auth.onAuthStateChanged(async (user) => {
  if (user) {
    if (sessionStorage.getItem('isSystemOpen') !== 'true') { auth.signOut(); return; }
    let userDoc;
    try { userDoc = await db.collection('users').doc(user.email.toLowerCase()).get(); } catch(e) {}

    let role = 'viewer', expiryDate = '2024-01-01'; 
    if (userDoc && userDoc.exists) { role = userDoc.data().role || 'viewer'; expiryDate = userDoc.data().expiryDate || '2024-01-01'; } 
    else if (user.email.toLowerCase() === 'jeanhany04@gmail.com') { role = 'admin'; expiryDate = '2099-12-31'; await db.collection('users').doc(user.email.toLowerCase()).set({ role: 'admin', expiryDate: '2099-12-31' }); } 
    else { auth.signOut(); alert("هذا الحساب غير مسجل."); return; }

    if (new Date() > new Date(expiryDate)) { auth.signOut(); alert("لقد انتهت فترة اشتراكك."); return; }

    currentUser = user; isAdmin = (role === 'admin'); isEditor = (role === 'admin' || role === 'editor');
    document.getElementById('userEmailLabel').textContent = user.email.split('@')[0] + (isAdmin ? ' (المدير)' : (isEditor ? ' (محرر)' : ' (مشترك)'));
    document.getElementById('authActionBtn').textContent = 'خروج';
    document.getElementById('superAdminActions').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('addMainLocWrap').style.display = isEditor ? 'flex' : 'none';
    document.getElementById('adminActions').style.display = isEditor ? 'flex' : 'none';
    
    await syncCloudData();
    document.getElementById('paywallModal').style.display = 'none';
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('systemApp').style.display = 'flex';
  } else {
    currentUser = null; isAdmin = false; isEditor = false; sessionStorage.removeItem('isSystemOpen');
    document.getElementById('userEmailLabel').textContent = 'يرجى تسجيل الدخول';
    document.getElementById('authActionBtn').textContent = 'دخول';
    document.getElementById('systemApp').style.display = 'none';
    document.getElementById('landingPage').style.display = 'block';
  }
});

function submitLogin() {
  const email = document.getElementById('loginEmail').value.trim(), password = document.getElementById('loginPassword').value.trim();
  if(!email || !password) { alert("من فضلك أدخل الإيميل والباسورد"); return; }
  document.getElementById('rememberMe').checked ? (localStorage.setItem('savedEmail', email), localStorage.setItem('savedPassword', password)) : (localStorage.removeItem('savedEmail'), localStorage.removeItem('savedPassword'));
  sessionStorage.setItem('isSystemOpen', 'true');
  auth.signInWithEmailAndPassword(email, password).catch(err => { sessionStorage.removeItem('isSystemOpen'); alert("بيانات الدخول غير صحيحة."); });
}

function handleAuthAction() { currentUser ? (auth.signOut(), sessionStorage.removeItem('isSystemOpen'), backToLanding()) : document.getElementById('paywallModal').style.display = 'flex'; }

function openUsersManager() { document.getElementById('newAccEmail').value = ''; document.getElementById('newAccResult').style.display = 'none'; document.getElementById('usersOverlay').classList.add('open'); }

async function createNewSubscriber() {
    const email = document.getElementById('newAccEmail').value.trim().toLowerCase(), duration = parseInt(document.getElementById('newAccDuration').value), role = document.getElementById('newAccRole').value;
    if(!email) { showToast('يرجى كتابة الإيميل!'); return; }
    const password = Math.random().toString(36).slice(-6) + Math.floor(Math.random()*100), expDate = new Date(); expDate.setDate(expDate.getDate() + duration);
    try {
        await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
        await db.collection('users').doc(email).set({ role: role, expiryDate: expDate.toISOString().split('T')[0] });
        await secondaryApp.auth().signOut();
        document.getElementById('resEmail').textContent = email; document.getElementById('resPass').textContent = password; document.getElementById('resDate').textContent = expDate.toISOString().split('T')[0];
        document.getElementById('newAccResult').style.display = 'block'; showToast('تم تسجيل الحساب بنجاح!');
    } catch (error) { alert('حدث خطأ: ' + error.message); }
}

async function syncCloudData() {
  document.getElementById('pageSub').textContent = "جاري تحميل البيانات...";
  db.collection('system').doc('locations').onSnapshot(doc => { mainLocations = doc.exists ? doc.data().mainLocations || [] : []; renderLocationTree(); });
  db.collection('compounds').onSnapshot(snapshot => { compounds = []; snapshot.forEach(doc => compounds.push({ id: doc.id, ...doc.data() })); renderGrid(); });
}

async function saveMainLocationsToCloud() { if(isEditor) { try { await db.collection('system').doc('locations').set({ mainLocations }); } catch (error) { alert('خطأ في الحفظ!'); } } }

function getCorrectedUnitType(typeStr, projectType) {
    if (projectType === 'commercial') {
        if (typeStr === '1br') return 'admin';
        if (typeStr === '2br' || typeStr === 'studio') return 'commercial';
        if (!['commercial', 'admin', 'clinic', 'recreational'].includes(typeStr)) return 'commercial';
    } else {
        if (['commercial', 'admin', 'clinic', 'recreational'].includes(typeStr)) return 'studio';
    }
    return typeStr || (projectType === 'commercial' ? 'commercial' : 'studio');
}

async function saveCompoundToCloud() {
  if(!isEditor) return;
  const projectName = document.getElementById('fldProject').value.trim();
  if(!projectName){ showToast('أدخل اسم المشروع'); return; }

  const data = {
    locationId: document.getElementById('fldLocation').value || '',
    projectType: document.getElementById('fldProjectType').value,
    companyName: document.getElementById('fldCompany').value.trim(),
    projectName: projectName,
    ownerName: document.getElementById('fldOwner').value.trim(),
    consultant: document.getElementById('fldConsultant').value.trim(),
    pricePerMeterMin: parseFloat(document.getElementById('fldPriceMeterMin').value) || 0,
    pricePerMeterMax: parseFloat(document.getElementById('fldPriceMeterMax').value) || 0,
    commercialPrices: {
        adminMin: parseFloat(document.getElementById('fldAdminMin').value) || 0,
        adminMax: parseFloat(document.getElementById('fldAdminMax').value) || 0,
        adminFinish: document.getElementById('fldAdminFinish').value || 'core_shell',
        commMin: parseFloat(document.getElementById('fldCommMin').value) || 0,
        commMax: parseFloat(document.getElementById('fldCommMax').value) || 0,
        commFinish: document.getElementById('fldCommFinish').value || 'core_shell',
        clinicMin: parseFloat(document.getElementById('fldClinicMin').value) || 0,
        clinicMax: parseFloat(document.getElementById('fldClinicMax').value) || 0,
        clinicFinish: document.getElementById('fldClinicFinish').value || 'core_shell',
        recMin: parseFloat(document.getElementById('fldRecMin').value) || 0,
        recMax: parseFloat(document.getElementById('fldRecMax').value) || 0,
        recFinish: document.getElementById('fldRecFinish').value || 'core_shell',
    },
    maintenancePercent: parseFloat(document.getElementById('fldMaintenancePercent').value) || 0,
    parkingFee: parseFloat(document.getElementById('fldParkingFee').value) || 0,
    projectSize: parseFloat(document.getElementById('fldProjectSize').value) || 0,
    deliveryDate: document.getElementById('fldDeliveryDate').value.trim(),
    finishingStatus: document.getElementById('fldFinishingStatus').value,
    compoundLocationDetail: document.getElementById('fldLocationDetail').value.trim(),
    locationLink: document.getElementById('fldLocationLink').value.trim(),
    unitTypes: tempUnits.map(u => ({ id: u.id || uid(), bedroomType: getCorrectedUnitType(u.bedroomType, document.getElementById('fldProjectType').value), area: parseFloat(u.area) || 0, price: parseFloat(u.price) || 0 })),
    paymentPlans: tempPlans,
    ministerialDecrees: tempDecrees.filter(d=>d.decreeNumber || d.description),
  };

  try { await db.collection('compounds').doc(editingCompoundId || uid()).set(data, { merge: true }); closeModal('formOverlay'); showToast('تم حفظ المشروع بنجاح'); } 
  catch (error) { alert('خطأ! الفايربيز رفض الحفظ.'); }
}

async function deleteCurrentCompoundFromCloud() {
  if(!isEditor || !confirm('متأكد من الحذف؟')) return;
  await db.collection('compounds').doc(viewingCompoundId).delete();
  closeModal('detailOverlay'); showToast('تم الحذف');
}

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function showToast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); }
function formatNum(n){ return Number(n).toLocaleString('en-US'); }
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function deliveryLabel(v){ const d = DELIVERY_TIMELINES.find(x=>x.value===v); return d ? d.label : '-'; }
function populateDeliverySelects(){
  const opts = DELIVERY_TIMELINES.map(d=>`<option value="${d.value}">${d.label}</option>`).join('');
  document.getElementById('fldDeliveryDate').innerHTML = opts; document.getElementById('fDeliveryTimeline').innerHTML = '<option value="">كل المواعيد</option>' + opts;
}

function toggleMainLoc(mainId, e){ e.stopPropagation(); openMainLocIds[mainId] = !openMainLocIds[mainId]; renderLocationTree(); }

function renderLocationTree(){
  const wrap = document.getElementById('locationTree');
  let html = `<div class="sub-loc-tab ${activeSelection==='all'?'active':''}" onclick="selectLocationNode('all')"><span>🌐 كل المشروعات</span><span style="font-family:'IBM Plex Mono',monospace; font-size:11px;">${compounds.length}</span></div>`;
  mainLocations.forEach((mainLoc) => {
    let mainCount = 0; mainLoc.subLocations.forEach(sub => { mainCount += compounds.filter(c => c.locationId === sub.id).length; });
    const isOpen = !!openMainLocIds[mainLoc.id];
    html += `<div class="loc-group"><div class="loc-group-header-row"><div class="loc-main-clickable ${activeSelection === mainLoc.id ? 'active' : ''}" onclick="selectLocationNode('${mainLoc.id}')"><span>📍 ${escapeHtml(mainLoc.name)}</span></div><div style="display:flex; align-items:center; gap:6px;"><span style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:#D9C5B2; font-weight:bold;">${mainCount}</span><span class="arrow-toggle ${isOpen ? 'open' : ''}" onclick="toggleMainLoc('${mainLoc.id}', event)">▶</span>${isEditor ? `<button class="loc-del-btn" onclick="deleteMainLocation('${mainLoc.id}')">✕</button>` : ''}</div></div><div class="sub-loc-list ${isOpen ? 'show' : ''}">`;
    mainLoc.subLocations.forEach(sub => {
      const subCount = compounds.filter(c => c.locationId === sub.id).length;
      html += `<div class="sub-loc-tab ${activeSelection === sub.id?'active':''}" onclick="selectLocationNode('${sub.id}')"><span>↳ ${escapeHtml(sub.name)}</span><div style="display:flex; align-items:center; gap:6px;"><span style="font-family:'IBM Plex Mono',monospace; font-size:11px; opacity:0.9;">${subCount}</span>${isEditor ? `<button class="loc-del-btn" onclick="event.stopPropagation(); deleteSubLocation('${mainLoc.id}', '${sub.id}')">✕</button>` : ''}</div></div>`;
    });
    html += `</div>${isEditor ? `<div class="add-sub-loc-box"><input id="subInput_${mainLoc.id}" placeholder="+ فرع جديد" onkeydown="if(event.key==='Enter') addSubLocation('${mainLoc.id}')"><button onclick="addSubLocation('${mainLoc.id}')">إضافة</button></div>` : ''}</div>`;
  });
  wrap.innerHTML = html;
  if(document.getElementById('fldLocation')) document.getElementById('fldLocation').innerHTML = `<option value="">-- لم يتم تحديد فرع --</option>` + mainLocations.map(m => `<optgroup label="${escapeHtml(m.name)}">` + m.subLocations.map(s => `<option value="${s.id}">${escapeHtml(m.name)} ⬅️ ${escapeHtml(s.name)}</option>`).join('') + `</optgroup>`).join('');
}

function selectLocationNode(nodeId){ activeSelection = nodeId; renderLocationTree(); renderGrid(); }
async function addMainLocation(){ if(!isEditor) return; const input = document.getElementById('newMainLocInput'); if(!input.value.trim()) return; const newId = uid(); mainLocations.push({ id: newId, name: input.value.trim(), subLocations: [] }); openMainLocIds[newId] = true; input.value = ''; await saveMainLocationsToCloud(); }
async function deleteMainLocation(mainId){ if(!isEditor || !confirm('حذف المنطقة؟')) return; const subIds = mainLocations.find(m => m.id === mainId)?.subLocations.map(s=>s.id) || []; mainLocations = mainLocations.filter(m => m.id !== mainId); const batch = db.batch(); compounds.filter(c => subIds.includes(c.locationId)).forEach(c => { batch.delete(db.collection('compounds').doc(c.id)); }); await batch.commit(); if(activeSelection === mainId || subIds.includes(activeSelection)) activeSelection = 'all'; await saveMainLocationsToCloud(); }
async function addSubLocation(mainId){ if(!isEditor) return; const input = document.getElementById(`subInput_${mainId}`); if(!input || !input.value.trim()) return; mainLocations.find(m => m.id === mainId)?.subLocations.push({ id: uid(), name: input.value.trim() }); openMainLocIds[mainId] = true; await saveMainLocationsToCloud(); }
async function deleteSubLocation(mainId, subId){ if(!isEditor || !confirm('حذف الفرع؟')) return; const m = mainLocations.find(m => m.id === mainId); if(m) m.subLocations = m.subLocations.filter(s => s.id !== subId); const batch = db.batch(); compounds.filter(c => c.locationId === subId).forEach(c => { batch.delete(db.collection('compounds').doc(c.id)); }); await batch.commit(); if(activeSelection === subId) activeSelection = 'all'; await saveMainLocationsToCloud(); }

function selectProjectType(type, btnElem){ activeProjectType = type; document.querySelectorAll('.type-nav-btn').forEach(b => b.classList.remove('active')); btnElem.classList.add('active'); renderGrid(); }

function applyFilters(){
  filters = { searchText: (document.getElementById('fSearchText').value || '').trim().toLowerCase(), meterPrice: parseFloat(document.getElementById('fMeterPrice').value) || null, totalTarget: parseFloat(document.getElementById('fTotalMin').value) || null, downPaymentTarget: parseFloat(document.getElementById('fDownPayment').value) || null, bedroomType: document.getElementById('fBedroomType').value || null, deliveryTimeline: document.getElementById('fDeliveryTimeline').value || null, sortOrder: document.getElementById('fSortOrder').value || 'default', maxMonthlyInstallment: parseFloat(document.getElementById('fMonthlyInstallment').value) || null }; renderGrid();
}
function resetFilters(){ ['fSearchText','fMeterPrice','fTotalMin','fDownPayment','fBedroomType','fDeliveryTimeline','fSortOrder','fMonthlyInstallment'].forEach(id => document.getElementById(id).value=''); filters = {}; renderGrid(); }

function findSubLocationName(subId){ for(const m of mainLocations){ const s = m.subLocations.find(x => x.id === subId); if(s) return `${m.name} ⬅️ ${s.name}`; } return '-'; }

function renderGrid(){
  let targetSubIds = []; if(activeSelection !== 'all'){ const main = mainLocations.find(m => m.id === activeSelection); targetSubIds = main ? main.subLocations.map(s => s.id) : [activeSelection]; }

  let list = compounds.filter(c=>{
    if(activeSelection !== 'all' && !targetSubIds.includes(c.locationId)) return false;
    if(activeProjectType !== 'all' && (c.projectType || 'residential') !== activeProjectType) return false;
    if(filters.searchText && !(c.projectName||'').toLowerCase().includes(filters.searchText) && !(c.companyName||'').toLowerCase().includes(filters.searchText)) return false;
    if(filters.deliveryTimeline && c.deliveryDate!==filters.deliveryTimeline) return false;

    let cUnits = c.unitTypes||[];
    if(filters.bedroomType) cUnits = cUnits.filter(u => getCorrectedUnitType(u.bedroomType, c.projectType) === filters.bedroomType);
    if(filters.bedroomType && cUnits.length===0) return false;
    if(filters.totalTarget != null && !cUnits.some(u => Math.abs((u.price||0) - filters.totalTarget) <= filters.totalTarget * 0.15)) return false;
    if(filters.meterPrice != null && !((c.pricePerMeterMax||c.pricePerMeterMin||0) >= filters.meterPrice && (c.pricePerMeterMin||0) <= filters.meterPrice)) return false;
    if(filters.downPaymentTarget != null || filters.maxMonthlyInstallment != null){
      const plans = c.paymentPlans || []; if(!plans.length) return false;
      let pass = false;
      for(const u of cUnits){
        for(const p of plans){
          const r = calcInstallmentWithDiscount(u.price||0, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12);
          const dpMatch = filters.downPaymentTarget == null || Math.abs(r.downPayment - filters.downPaymentTarget) <= filters.downPaymentTarget * 0.20;
          const instMatch = filters.maxMonthlyInstallment == null || r.monthlyEquivalent <= filters.maxMonthlyInstallment;
          if(dpMatch && instMatch){ pass = true; break; }
        } if(pass) break;
      } if(!pass) return false;
    } return true;
  });

  if(filters.sortOrder && filters.sortOrder !== 'default') list.sort((a, b) => filters.sortOrder === 'asc' ? (a.pricePerMeterMin||0) - (b.pricePerMeterMin||0) : (b.pricePerMeterMin||0) - (a.pricePerMeterMin||0));

  document.getElementById('pageTitle').textContent = activeSelection === 'all' ? 'كل المشروعات' : (mainLocations.find(m => m.id === activeSelection)?.name + ' (الكل)' || findSubLocationName(activeSelection));
  document.getElementById('pageSub').textContent = `${list.length} مشروع مسجل بالسحابة`;

  const grid = document.getElementById('compoundGrid');
  if(!list.length) return grid.innerHTML = `<div class="empty-state"><div class="big">لا توجد مشروعات مطابقة</div></div>`;
  
  grid.innerHTML = list.map(c=>{
    const minPrice = (c.unitTypes||[]).length ? Math.min(...c.unitTypes.map(u=>u.price||Infinity)) : null;
    let pDisplay = '';
    if (c.projectType === 'commercial' && c.commercialPrices) {
        let mins = [c.commercialPrices.adminMin, c.commercialPrices.commMin, c.commercialPrices.clinicMin, c.commercialPrices.recMin].filter(x => x > 0);
        let absoluteMin = mins.length > 0 ? Math.min(...mins) : (c.pricePerMeterMin || 0);
        pDisplay = absoluteMin > 0 ? `يبدأ من ${formatNum(absoluteMin)}` : '-';
    } else {
        pDisplay = (c.pricePerMeterMin && c.pricePerMeterMax) ? `${formatNum(c.pricePerMeterMin)} - ${formatNum(c.pricePerMeterMax)}` : formatNum(c.pricePerMeterMin||0);
    }
    
    return `<div class="dossier" onclick="openDetail('${c.id}')">
      ${c.ministerialDecrees?.length ? '<div class="stamp">معتمد<br>وزارياً</div>' : ''}
      <div class="dossier-header-row"><div class="dossier-company">${escapeHtml(c.companyName||'')}</div></div>
      <div class="dossier-title">${escapeHtml(c.projectName||'بدون اسم')}</div>
      <span class="dossier-badge">${PROJECT_TYPES[c.projectType||'residential']}</span>
      <div class="dossier-row" style="margin-top:6px;"><b>الفرع:</b> <span style="font-size:12px;color:var(--primary-color);">${findSubLocationName(c.locationId)}</span></div>
      <div class="dossier-row"><b>المساحة:</b> ${c.projectSize ? c.projectSize+' فدان':'-'}</div>
      <div class="dossier-row"><b>التسليم:</b> ${deliveryLabel(c.deliveryDate)}</div>
      <div class="dossier-row" style="border-bottom:none;"><b>التشطيب:</b> ${c.projectType === 'commercial' ? 'حسب النشاط' : (FINISHING_TYPES[c.finishingStatus]||'-')}</div>
      <div class="dossier-meta">
        <div class="meta-chip">${pDisplay}<span>سعر المتر</span></div>
        <div class="meta-chip">${minPrice!==Infinity ? formatNum(minPrice):'-'}<span>أقل سعر وحدة</span></div>
      </div>
    </div>`;
  }).join('');
}

function openCompoundForm(existing){
  editingCompoundId = existing ? existing.id : null;
  document.getElementById('formTitle').textContent = existing ? 'تعديل المشروع' : 'إضافة مشروع جديد';
  
  if(existing) document.getElementById('fldLocation').value = existing.locationId || '';
  else document.getElementById('fldLocation').value = (activeSelection !== 'all' && !mainLocations.find(m=>m.id===activeSelection)) ? activeSelection : '';
  
  if (existing) {
      document.getElementById('fldProjectType').value = existing.projectType || 'residential';
      document.getElementById('fldCompany').value = existing.companyName || '';
      document.getElementById('fldProject').value = existing.projectName || '';
      document.getElementById('fldOwner').value = existing.ownerName || '';
      document.getElementById('fldConsultant').value = existing.consultant || '';
      document.getElementById('fldPriceMeterMin').value = existing.pricePerMeterMin || '';
      document.getElementById('fldPriceMeterMax').value = existing.pricePerMeterMax || '';
      
      let cp = existing.commercialPrices || {};
      document.getElementById('fldAdminMin').value = cp.adminMin || ''; document.getElementById('fldAdminMax').value = cp.adminMax || ''; document.getElementById('fldAdminFinish').value = cp.adminFinish || 'core_shell';
      document.getElementById('fldCommMin').value = cp.commMin || ''; document.getElementById('fldCommMax').value = cp.commMax || ''; document.getElementById('fldCommFinish').value = cp.commFinish || 'core_shell';
      document.getElementById('fldClinicMin').value = cp.clinicMin || ''; document.getElementById('fldClinicMax').value = cp.clinicMax || ''; document.getElementById('fldClinicFinish').value = cp.clinicFinish || 'core_shell';
      document.getElementById('fldRecMin').value = cp.recMin || ''; document.getElementById('fldRecMax').value = cp.recMax || ''; document.getElementById('fldRecFinish').value = cp.recFinish || 'core_shell';

      document.getElementById('fldMaintenancePercent').value = existing.maintenancePercent || '';
      document.getElementById('fldParkingFee').value = existing.parkingFee || '';
      document.getElementById('fldProjectSize').value = existing.projectSize || '';
      document.getElementById('fldDeliveryDate').value = existing.deliveryDate || '';
      document.getElementById('fldFinishingStatus').value = existing.finishingStatus || 'core_shell';
      document.getElementById('fldLocationDetail').value = existing.compoundLocationDetail || '';
      document.getElementById('fldLocationLink').value = existing.locationLink || '';
  } else {
      document.getElementById('fldProjectType').value = 'residential';
      ['fldCompany','fldProject','fldOwner','fldConsultant','fldPriceMeterMin','fldPriceMeterMax','fldAdminMin','fldAdminMax','fldCommMin','fldCommMax','fldClinicMin','fldClinicMax','fldRecMin','fldRecMax','fldMaintenancePercent','fldParkingFee','fldProjectSize','fldDeliveryDate','fldLocationDetail','fldLocationLink'].forEach(id => { document.getElementById(id).value = ''; });
      ['fldFinishingStatus', 'fldAdminFinish', 'fldCommFinish', 'fldClinicFinish', 'fldRecFinish'].forEach(id => { document.getElementById(id).value = 'core_shell'; });
  }
  
  onProjectTypeChange();

  tempUnits = existing ? JSON.parse(JSON.stringify(existing.unitTypes||[])) : [];
  if (existing) { tempUnits.forEach(u => { u.bedroomType = getCorrectedUnitType(u.bedroomType, existing.projectType); }); }

  tempPlans = existing ? JSON.parse(JSON.stringify(existing.paymentPlans||[])) : [];
  tempDecrees = existing ? JSON.parse(JSON.stringify(existing.ministerialDecrees||[])) : [];
  updatePriceMeterAvg(); renderUnitRows(); renderPlanRows(); renderDecreeRows();
  document.getElementById('formOverlay').classList.add('open');
}

function onProjectTypeChange() {
  const isComm = document.getElementById('fldProjectType').value === 'commercial';
  document.querySelectorAll('.res-price-field').forEach(el => el.style.display = isComm ? 'none' : 'block');
  document.querySelectorAll('.res-field').forEach(el => el.style.display = isComm ? 'none' : 'block');
  document.getElementById('commercialPriceWrap').style.display = isComm ? 'block' : 'none';
  if (isComm) document.getElementById('priceMeterAvgWrap').style.display = 'none';
  renderUnitRows();
}

function getAverageCommercialPrice(bType) {
    let min = 0, max = 0;
    if (bType === 'admin') { min = parseFloat(document.getElementById('fldAdminMin').value); max = parseFloat(document.getElementById('fldAdminMax').value); }
    else if (bType === 'commercial') { min = parseFloat(document.getElementById('fldCommMin').value); max = parseFloat(document.getElementById('fldCommMax').value); }
    else if (bType === 'clinic') { min = parseFloat(document.getElementById('fldClinicMin').value); max = parseFloat(document.getElementById('fldClinicMax').value); }
    else if (bType === 'recreational') { min = parseFloat(document.getElementById('fldRecMin').value); max = parseFloat(document.getElementById('fldRecMax').value); }
    if (min > 0 && max > 0) return (min + max) / 2;
    return min || max || getAveragePricePerMeter();
}

function getAveragePricePerMeter(){
  const min = parseFloat(document.getElementById('fldPriceMeterMin').value) || 0;
  const max = parseFloat(document.getElementById('fldPriceMeterMax').value) || 0;
  if(min > 0 && max > 0) return (min + max) / 2;
  return min || max || 0;
}

function updatePriceMeterAvg(){
  const isComm = document.getElementById('fldProjectType').value === 'commercial';
  const avg = getAveragePricePerMeter();
  const wrap = document.getElementById('priceMeterAvgWrap');
  if (wrap) wrap.style.display = (avg > 0 && !isComm) ? 'block' : 'none';
  const avgInput = document.getElementById('fldPriceMeterAvg');
  if (avgInput) avgInput.value = formatNum(Math.round(avg)) + ' جنيه';
  tempUnits.forEach(u => updateUnitArea(u.id, u.area));
}

function addUnitRow(){ 
  const pType = document.getElementById('fldProjectType').value;
  tempUnits.push({id:uid(), bedroomType: pType === 'commercial' ? 'commercial' : 'studio', area:'', price:''}); 
  renderUnitRows(); 
}

function removeUnitRow(id){ tempUnits = tempUnits.filter(u=>u.id!==id); renderUnitRows(); }

function renderUnitRows(){
  const pType = document.getElementById('fldProjectType').value;
  let optionsHtml = pType === 'commercial' ? `<option value="commercial">تجاري (Commercial)</option><option value="admin">إداري (Admin)</option><option value="clinic">عيادة / طبي (Clinic)</option><option value="recreational">ترفيهي (Recreational)</option>` : `<option value="studio">استوديو (Studio)</option><option value="1br">1 غرفة نوم</option><option value="2br">2 غرفة نوم</option><option value="3br">3 غرف نوم</option><option value="4br">4 غرف نوم</option><option value="duplex">دوبلكس</option><option value="penthouse">بنتهاوس</option>`;

  document.getElementById('unitRows').innerHTML = tempUnits.map(u=> {
      let bType = getCorrectedUnitType(u.bedroomType, pType);
      return `<div class="repeat-row">
      <select style="flex:1.4;" onchange="updateUnit('${u.id}','bedroomType',this.value)">${optionsHtml.includes(`value="${bType}"`) ? optionsHtml.replace(`value="${bType}"`, `value="${bType}" selected`) : optionsHtml}</select>
      <input type="number" placeholder="المساحة (م²)" style="flex:1;" value="${u.area}" oninput="updateUnitArea('${u.id}', this.value)">
      <input type="number" id="price-input-${u.id}" placeholder="إجمالي السعر" style="flex:1.2;" value="${u.price}" oninput="updateUnit('${u.id}','price',this.value)">
      <button class="row-del" onclick="removeUnitRow('${u.id}')">✕</button>
    </div>`
  }).join('') || '<div style="font-size:12.5px;color:var(--text-muted);">لا يوجد وحدات مضافة</div>';
}

function updateUnitArea(id, val){
  const u = tempUnits.find(x=>x.id===id);
  if(u){
    u.area = parseFloat(val) || 0;
    const pType = document.getElementById('fldProjectType').value;
    let avg = pType === 'commercial' ? getAverageCommercialPrice(u.bedroomType) : getAveragePricePerMeter();
    if(avg > 0 && u.area > 0) u.price = Math.round(u.area * avg);
    document.getElementById(`price-input-${u.id}`).value = u.price || '';
  }
}

function updateUnit(id, field, val){ 
  const u = tempUnits.find(x=>x.id===id); 
  if(u) { u[field] = field==='bedroomType'?val:(parseFloat(val)||0); if (field === 'bedroomType') updateUnitArea(id, u.area); } 
}

function addPlanRow(){ tempPlans.push({id:uid(), name:'', discountPercent:'', downPaymentPercent:'', years:'', frequency:'12', notes:'', customBullets:[]}); renderPlanRows(); }
function removePlanRow(id){ tempPlans = tempPlans.filter(p=>p.id!==id); renderPlanRows(); }
function addBulletRow(pId){ tempPlans.find(p=>p.id===pId)?.customBullets.push({id:uid(), type:'annual', percent:'', selectedYears:[]}); renderPlanRows(); }
function removeBulletRow(pId, bId){ const p=tempPlans.find(x=>x.id===pId); if(p) p.customBullets=p.customBullets.filter(b=>b.id!==bId); renderPlanRows(); }
function toggleYearSelection(pId, bId, y){ const b = tempPlans.find(p=>p.id===pId)?.customBullets.find(x=>x.id===bId); if(b){ const i=b.selectedYears.indexOf(y); i>-1?b.selectedYears.splice(i,1):b.selectedYears.push(y); renderPlanRows(); } }
function renderPlanRows(){
  document.getElementById('planRows').innerHTML = tempPlans.map(p=>`
    <div class="plan-card">
      <div class="plan-card-header"><input placeholder="اسم الخطة" style="flex:2;" value="${escapeHtml(p.name)}" oninput="updatePlan('${p.id}','name',this.value)"><input type="number" placeholder="% خصم" style="width:70px;" value="${p.discountPercent||''}" oninput="updatePlan('${p.id}','discountPercent',this.value)"><input type="number" placeholder="% مقدم" style="width:70px;" value="${p.downPaymentPercent}" oninput="updatePlan('${p.id}','downPaymentPercent',this.value)"><input type="number" placeholder="سنوات" style="width:70px;" value="${p.years}" oninput="updatePlan('${p.id}','years',this.value)"><select onchange="updatePlan('${p.id}','frequency',this.value)">${Object.entries(FREQ_LABEL).map(([k,v])=>`<option value="${k}" ${p.frequency==k?'selected':''}>${v}</option>`).join('')}</select><button class="row-del" onclick="removePlanRow('${p.id}')">✕</button></div>
      <input placeholder="ملاحظات" style="width:100%;margin-bottom:8px;padding:6px;border-radius:4px;border:1px solid #ddd;" value="${escapeHtml(p.notes||'')}" oninput="updatePlan('${p.id}','notes',this.value)">
      <div class="bullets-container">${p.customBullets.map(b=>`<div class="bullet-row"><div class="bullet-top"><select style="flex:1;" onchange="updateBullet('${p.id}','${b.id}','type',this.value)"><option value="annual" ${b.type==='annual'?'selected':''}>دفعة سنوية</option><option value="deferred" ${b.type==='deferred'?'selected':''}>دفعة مؤجلة</option><option value="delivery" ${b.type==='delivery'?'selected':''}>دفعة استلام</option></select><input type="number" placeholder="%" style="width:70px;" value="${b.percent}" oninput="updateBullet('${p.id}','${b.id}','percent',this.value)"><button class="row-del" onclick="removeBulletRow('${p.id}','${b.id}')">✕</button></div>${b.type==='annual'?`<div class="years-pills" style="margin-top:4px;">${[1,2,3,4,5].map(yr=>`<div class="year-pill ${b.selectedYears.includes(yr)?'selected':''}" onclick="toggleYearSelection('${p.id}','${b.id}',${yr})">${yr}</div>`).join('')}</div>`:''}</div>`).join('')}<button class="add-row-btn" onclick="addBulletRow('${p.id}')">+ دفعة خاصة</button></div>
    </div>`).join('') || '<div style="font-size:12.5px;color:var(--text-muted);">لا توجد خطط سداد</div>';
}
function updatePlan(id, field, val){ const p = tempPlans.find(x=>x.id===id); if(p) p[field] = (field==='name'||field==='notes'||field==='frequency')?val:(parseFloat(val)||0); }
function updateBullet(pId, bId, field, val){ const b = tempPlans.find(x=>x.id===pId)?.customBullets.find(x=>x.id===bId); if(b){ b[field] = field==='type'?val:(parseFloat(val)||0); if(field==='type')renderPlanRows();} }

function addDecreeRow(){ tempDecrees.push({id:uid(), decreeNumber:'', description:'', date:''}); renderDecreeRows(); }
function removeDecreeRow(id){ tempDecrees = tempDecrees.filter(d=>d.id!==id); renderDecreeRows(); }
function renderDecreeRows(){ document.getElementById('decreeRows').innerHTML = tempDecrees.map(d=>`<div class="repeat-row"><input placeholder="الرقم" style="width:100px;" value="${escapeHtml(d.decreeNumber)}" oninput="tempDecrees.find(x=>x.id==='${d.id}').decreeNumber=this.value"><input placeholder="الوصف" style="flex:1;" value="${escapeHtml(d.description)}" oninput="tempDecrees.find(x=>x.id==='${d.id}').description=this.value"><input type="date" value="${d.date}" oninput="tempDecrees.find(x=>x.id==='${d.id}').date=this.value"><button class="row-del" onclick="removeDecreeRow('${d.id}')">✕</button></div>`).join(''); }

function openDetail(id){
  const c = compounds.find(x=>x.id===id);
  if(!c) return;
  viewingCompoundId = id;
  const availTypes = Array.from(new Set((c.unitTypes||[]).map(u => getCorrectedUnitType(u.bedroomType, c.projectType))));
  activeDetailCategory = availTypes.length ? availTypes[0] : null;
  activeDetailUnitId = (c.unitTypes||[]).filter(u => getCorrectedUnitType(u.bedroomType, c.projectType) === activeDetailCategory)[0]?.id || null;
  renderDetailModalContent();
  document.getElementById('detailOverlay').classList.add('open');
}

function setDetailCategory(catKey) {
  activeDetailCategory = catKey; const c = compounds.find(x => x.id === viewingCompoundId);
  if (c && c.unitTypes) { const matched = c.unitTypes.filter(u => getCorrectedUnitType(u.bedroomType, c.projectType) === catKey); if (matched.length > 0) activeDetailUnitId = matched[0].id; }
  renderDetailModalContent();
}

function setDetailUnit(unitId) { activeDetailUnitId = unitId; renderDetailModalContent(); }

function editCurrentCompound(){ const c = compounds.find(x=>x.id===viewingCompoundId); if(!c) return; closeModal('detailOverlay'); openCompoundForm(c); }

function renderDetailModalContent() {
  const c = compounds.find(x => x.id === viewingCompoundId); if (!c) return;
  document.getElementById('detailTitle').textContent = c.projectName;
  document.getElementById('btnEditCompound').style.display = isEditor ? 'inline-block' : 'none';
  document.getElementById('btnDeleteCompound').style.display = isEditor ? 'inline-block' : 'none';

  let finishText = FINISHING_TYPES[c.finishingStatus] || '-';
  let parkingText = formatNum(c.parkingFee || 0) + ' ج';
  let pText = '';

  if (c.projectType === 'commercial') {
      finishText = 'حسب النشاط (موضح بالأسعار)';
      parkingText = 'لا يوجد';
      let cp = c.commercialPrices || {}; let parts = [];
      const fName = { core_shell: 'Core & Shell', semi: 'نصف تشطيب', full: 'تشطيب كامل' };
      if (cp.adminMin || cp.adminMax) parts.push(`<b>إداري:</b> ${formatNum(cp.adminMin)} - ${formatNum(cp.adminMax)} <span style="color:#888; font-size:11px;">(${fName[cp.adminFinish||'core_shell']})</span>`);
      if (cp.commMin || cp.commMax) parts.push(`<b>تجاري:</b> ${formatNum(cp.commMin)} - ${formatNum(cp.commMax)} <span style="color:#888; font-size:11px;">(${fName[cp.commFinish||'core_shell']})</span>`);
      if (cp.clinicMin || cp.clinicMax) parts.push(`<b>طبي:</b> ${formatNum(cp.clinicMin)} - ${formatNum(cp.clinicMax)} <span style="color:#888; font-size:11px;">(${fName[cp.clinicFinish||'core_shell']})</span>`);
      if (cp.recMin || cp.recMax) parts.push(`<b>ترفيهي:</b> ${formatNum(cp.recMin)} - ${formatNum(cp.recMax)} <span style="color:#888; font-size:11px;">(${fName[cp.recFinish||'core_shell']})</span>`);
      pText = parts.length > 0 ? `<div style="display:flex; flex-direction:column; gap:4px; font-size:12.5px; margin-top:4px;">${parts.join('')}</div>` : ((c.pricePerMeterMin && c.pricePerMeterMax) ? `${formatNum(c.pricePerMeterMin)} - ${formatNum(c.pricePerMeterMax)} ج` : `${formatNum(c.pricePerMeterMin||0)} ج`);
  } else {
      pText = (c.pricePerMeterMin && c.pricePerMeterMax) ? `${formatNum(c.pricePerMeterMin)} - ${formatNum(c.pricePerMeterMax)} ج` : `${formatNum(c.pricePerMeterMin||c.pricePerMeter||0)} ج`;
  }

  const locLinkHtml = c.locationLink ? `<br><a href="${escapeHtml(c.locationLink)}" target="_blank" style="color:var(--primary-color); font-size:13px; text-decoration:underline; display:inline-block; margin-top:6px; font-weight:bold;">📍 عرض على الخريطة (Google Maps)</a>` : '';

  let html = `<div class="detail-grid"><div class="detail-item"><b>النوع</b><span>${PROJECT_TYPES[c.projectType || 'residential']}</span></div><div class="detail-item"><b>المطور</b><span>${escapeHtml(c.companyName || '-')}</span></div><div class="detail-item"><b>المالك</b><span>${escapeHtml(c.ownerName || '-')}</span></div><div class="detail-item"><b>الاستشاري الهندسي</b><span>${escapeHtml(c.consultant || '-')}</span></div><div class="detail-item"><b>المنطقة والفرع</b><span>${escapeHtml(findSubLocationName(c.locationId))}</span></div><div class="detail-item"><b>التسليم والتشطيب</b><span>${deliveryLabel(c.deliveryDate)} | ${finishText}</span></div><div class="detail-item" ${c.projectType === 'commercial' ? 'style="align-items:start;"' : ''}><b>سعر المتر</b><span>${pText}</span></div><div class="detail-item"><b>الصيانة والجراج</b><span>صيانة: ${c.maintenancePercent || 0}% | جراج: ${parkingText}</span></div><div class="detail-item"><b>المساحة الإجمالية</b><span>${c.projectSize ? c.projectSize + ' فدان' : '-'}</span></div><div class="detail-item full"><b>الموقع بالتفصيل</b><span>${escapeHtml(c.compoundLocationDetail || '-')} ${locLinkHtml}</span></div></div>`;

  const grouped = {}; 
  (c.unitTypes||[]).forEach(u => { let t = getCorrectedUnitType(u.bedroomType, c.projectType); (grouped[t] = grouped[t] || []).push(u); });
  const cats = Object.keys(grouped);
  
  if(cats.length){
    if(!activeDetailCategory || !grouped[activeDetailCategory]) activeDetailCategory = cats[0];
    if(!activeDetailUnitId && grouped[activeDetailCategory] && grouped[activeDetailCategory].length > 0) activeDetailUnitId = grouped[activeDetailCategory][0].id;
    html += `<div class="section-label">حساب الأقساط</div><div class="unit-cat-tabs">` + cats.map(k => `<button class="unit-cat-btn ${k === activeDetailCategory ? 'active' : ''}" onclick="setDetailCategory('${k}')">${BEDROOM_TYPES[k] || k}</button>`).join('') + `</div>`;
    html += `<div class="size-picker-container">` + (grouped[activeDetailCategory] || []).map(u => `<div class="size-chip ${u.id === activeDetailUnitId ? 'active' : ''}" onclick="setDetailUnit('${u.id}')">${u.area} م² | ${formatNum(u.price)} ج</div>`).join('') + `</div>`;
    const sUnit = (c.unitTypes || []).find(u => u.id === activeDetailUnitId) || (grouped[activeDetailCategory] ? grouped[activeDetailCategory][0] : null);
    if(sUnit && c.paymentPlans && c.paymentPlans.length > 0){
      html += `<div class="category-box"><table class="spec-table"><tr><th>الخطة</th><th>خصم</th><th>مقدم</th><th>دفعات</th><th>قسط شهري</th><th>قسط ربع سنوي</th></tr>`;
      c.paymentPlans.forEach(p => {
        const r = calcInstallmentWithDiscount(sUnit.price || 0, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12);
        html += `<tr><td class="txt"><b>${escapeHtml(p.name)}</b></td><td>${p.discountPercent ? p.discountPercent + '%' : '-'}</td><td>${formatNum(Math.round(r.downPayment))} ج<br><small>(%${p.downPaymentPercent || 0})</small></td><td class="txt">${r.bulletsSummary.map(b => b.label).join('<br>') || '-'}</td><td><b>${formatNum(Math.round(r.monthlyEquivalent))} ج</b></td><td><b>${formatNum(Math.round(r.quarterlyEquivalent))} ج</b></td></tr>`;
      }); html += `</table></div>`;
    }
  } document.getElementById('detailBody').innerHTML = html;
}

function calcInstallmentWithDiscount(originalTotal, discountPct, downPct, customBullets, years, freq){
  const discountVal = originalTotal * ((discountPct||0)/100), netTotal = originalTotal - discountVal, downPayment = netTotal * ((downPct||0)/100);
  let extraPaymentsTotal = 0; let bulletsSummary = [];
  (customBullets || []).forEach(b => {
    const pct = parseFloat(b.percent) || 0;
    if(pct > 0){
      if(b.type === 'annual'){ const count = (b.selectedYears || []).length, perYearVal = netTotal * (pct / 100), totalBulletVal = perYearVal * count; extraPaymentsTotal += totalBulletVal; bulletsSummary.push({ type: 'annual', label: `%${pct} سنوي = ${formatNum(Math.round(totalBulletVal))} ج`, perYearVal });
      } else { const val = netTotal * (pct / 100); extraPaymentsTotal += val; bulletsSummary.push({ type: b.type, label: b.type === 'delivery' ? `استلام: %${pct}` : `مؤجلة: %${pct}`, val }); }
    }
  });
  const remaining = netTotal - (downPayment + extraPaymentsTotal), monthlyEquivalent = (years || 1) > 0 ? remaining / ((years || 1) * 12) : remaining;
  return { originalTotal, discountVal, netTotal, downPayment, extraPaymentsTotal, bulletsSummary, remaining, monthlyEquivalent, quarterlyEquivalent: monthlyEquivalent * 3 };
}

function openCalculator(){ calcCustomBullets=[]; ['calcTotal','calcDiscountPct','calcDownPct','calcYears'].forEach(id=>document.getElementById(id).value=''); document.getElementById('calcResult').style.display='none'; renderCalcBulletsRows(); document.getElementById('calcOverlay').classList.add('open'); }
function addCalcBulletRow(){ calcCustomBullets.push({id:uid(), type:'annual', percent:'', selectedYears:[]}); renderCalcBulletsRows(); }
function removeCalcBulletRow(id){ calcCustomBullets=calcCustomBullets.filter(b=>b.id!==id); renderCalcBulletsRows(); }
function toggleCalcYearSelection(bId, y){ const b=calcCustomBullets.find(x=>x.id===bId); if(b){ const i=b.selectedYears.indexOf(y); i>-1?b.selectedYears.splice(i,1):b.selectedYears.push(y); renderCalcBulletsRows(); } }
function updateCalcBullet(id, f, v){ const b=calcCustomBullets.find(x=>x.id===id); if(b){ b[f]=f==='type'?v:(parseFloat(v)||0); if(f==='type')renderCalcBulletsRows(); } }
function renderCalcBulletsRows(){ document.getElementById('calcBulletsRows').innerHTML = calcCustomBullets.map(b=>`<div class="bullet-row"><div class="bullet-top"><select style="flex:1;" onchange="updateBullet('${b.id}','type',this.value)"><option value="annual" ${b.type=='annual'?'selected':''}>سنوية</option><option value="deferred" ${b.type=='deferred'?'selected':''}>مؤجلة</option><option value="delivery" ${b.type=='delivery'?'selected':''}>استلام</option></select><input type="number" placeholder="%" style="width:80px;" value="${b.percent}" oninput="updateBullet('${b.id}','percent',this.value)"><button class="row-del" onclick="removeBulletRow('${b.id}')">✕</button></div>${b.type==='annual'?`<div class="years-pills" style="margin-top:4px;">${[1,2,3,4,5].map(yr=>`<div class="year-pill ${b.selectedYears.includes(yr)?'selected':''}" onclick="toggleYearSelection('${b.id}',${yr})">${yr}</div>`).join('')}</div>`:''}</div>`).join(''); }
function runUniversalCalculator(){
  const t = parseFloat(document.getElementById('calcTotal').value); if(!t) return showToast('أدخل إجمالي السعر');
  const r = calcInstallmentWithDiscount(t, parseFloat(document.getElementById('calcDiscountPct').value)||0, parseFloat(document.getElementById('calcDownPct').value)||0, calcCustomBullets, parseFloat(document.getElementById('calcYears').value)||0, 12);
  const box = document.getElementById('calcResult'); box.style.display='grid'; box.innerHTML = `<div class="item"><span>السعر الصافي</span><b>${formatNum(Math.round(r.netTotal))}</b></div><div class="item"><span>المقدم</span><b>${formatNum(Math.round(r.downPayment))}</b></div><div class="highlight"><span>القسط الشهري</span><b>${formatNum(Math.round(r.monthlyEquivalent))} جنيه</b></div>`;
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', (e)=>{ if(e.target.classList.contains('overlay')) e.target.classList.remove('open'); });

function handleJSONUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) { alert("الملف غير صحيح! يجب أن يحتوي على قائمة مشاريع."); event.target.value = ''; return; }
            if (!confirm(`تم العثور على ${data.length} مشروع في الملف. هل أنت متأكد من رفعهم لقاعدة البيانات؟`)) { event.target.value = ''; return; }
            showToast("جاري رفع المشاريع... يرجى عدم إغلاق الصفحة");
            const db = firebase.firestore(); let batch = db.batch(), count = 0, totalUploaded = 0;
            for (let i = 0; i < data.length; i++) {
                let proj = data[i]; proj.timestamp = firebase.firestore.FieldValue.serverTimestamp();
                let docRef = db.collection("compounds").doc(); batch.set(docRef, proj);
                count++; totalUploaded++;
                if (count === 400 || i === data.length - 1) { await batch.commit(); batch = db.batch(); count = 0; }
            }
            showToast(`✅ تم إضافة ${totalUploaded} مشروع بنجاح!`); event.target.value = ''; setTimeout(() => { location.reload(); }, 2000);
        } catch (error) { alert("حدث خطأ أثناء قراءة الملف. تأكد أنه ملف JSON سليم."); event.target.value = ''; }
    }; reader.readAsText(file);
}
populateDeliverySelects();
