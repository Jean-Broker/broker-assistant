// --- الدوال الأساسية ---
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function showToast(msg){ const t = document.getElementById('toast'); if(!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); }
function formatNum(n){ if(n === null || n === undefined || n === '') return ''; if(isNaN(n)) return n; return Number(n).toLocaleString('en-US'); }
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function highlightText(text, term) { const escaped = escapeHtml(text); if (!term) return escaped; const escapedTerm = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); try { return escaped.replace(new RegExp('(' + escapedTerm + ')', 'ig'), '<mark>$1</mark>'); } catch (e) { return escaped; } }
function deliveryLabel(v){ const d = DELIVERY_TIMELINES.find(x=>x.value===v); return d ? d.label : '-'; }
function formatInput(el) { let val = String(el.value).replace(/,/g, ''); if (val.trim() === '') return; if (/^-?\d+(\.\d+)?$/.test(val)) { el.value = Number(val).toLocaleString('en-US'); } }
function getRawNum(val) { if(val === null || val === undefined) return null; let str = String(val).replace(/,/g, '').trim(); if(str === '') return null; if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str); return null; }
function getSafeVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setSafeVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

function normalizeArabic(text) {
    if (!text) return '';
    return text.replace(/[أإآ]/g, 'ا')
               .replace(/ة/g, 'ه')
               .replace(/[يى]/g, 'ي')
               .toLowerCase();
}

function populateDeliverySelects(){ 
    const opts = DELIVERY_TIMELINES.map(d=>`<option value="${d.value}">${d.label}</option>`).join(''); 
    const el = document.getElementById('fldDeliveryDate'); 
    if(el) el.innerHTML = opts; 
}

// --- Theme & Setup ---
function setNavForApp(isAppView) { const links = document.getElementById('siteBarLinks'), loginBtn = document.getElementById('siteBarLoginBtn'); if (links) links.classList.toggle('nav-app-hidden', isAppView); if (loginBtn) loginBtn.classList.toggle('nav-app-hidden', isAppView); }
if (sessionStorage.getItem('isSystemOpen') === 'true') { document.getElementById('landingPageContainer').style.display = 'none'; document.getElementById('systemApp').style.display = 'flex'; setNavForApp(true); } else { document.getElementById('landingPageContainer').style.display = 'block'; document.getElementById('systemApp').style.display = 'none'; setNavForApp(false); }

let currentLang = 'ar';
function toggleLanguage() { currentLang = currentLang === 'ar' ? 'en' : 'ar'; document.documentElement.lang = currentLang; document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr'; document.querySelectorAll('[data-ar]').forEach(el => { el.innerHTML = el.getAttribute('data-' + currentLang); }); }
function openSystemLogin() { document.getElementById('paywallModal').style.display = 'flex'; }
function closeLoginModal() { document.getElementById('paywallModal').style.display = 'none'; }
function backToLanding() { document.getElementById('systemApp').style.display = 'none'; document.getElementById('landingPageContainer').style.display = 'block'; setNavForApp(false); }
function handleAuthAction() { currentUser ? (auth.signOut(), sessionStorage.removeItem('isSystemOpen'), backToLanding()) : document.getElementById('paywallModal').style.display = 'flex'; }

function toggleTheme() { document.body.classList.toggle('light-mode'); localStorage.setItem('appTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark'); }
if (localStorage.getItem('appTheme') === 'light') { document.body.classList.add('light-mode'); }

const firebaseConfig = { apiKey: "AIzaSyApvrK13v-5nIB7TzhrN-M4-1Y8PSEhKoE", authDomain: "broker-assistant-63277.firebaseapp.com", projectId: "broker-assistant-63277", storageBucket: "broker-assistant-63277.firebasestorage.app", messagingSenderId: "434808917289", appId: "1:434808917289:web:1012be2fa30cf80cfefb38" };
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
let secondaryApp;
if (!firebase.apps.some(app => app.name === "SecondaryApp")) {
    secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryApp");
} else {
    secondaryApp = firebase.app("SecondaryApp");
}

function updateAllUnitsPrice() {
    tempUnits.forEach(u => updateUnitData(u.id, 'recalc', null));
}

window.addEventListener('load', () => {
    populateDeliverySelects();
    if(localStorage.getItem('savedEmail')) { document.getElementById('loginEmail').value = localStorage.getItem('savedEmail'); document.getElementById('loginPassword').value = localStorage.getItem('savedPassword'); document.getElementById('rememberMe').checked = true; }
    const pt = document.getElementById('fldProjectType'); if (pt) pt.addEventListener('change', onProjectTypeChange);
    const footerYearEl = document.getElementById('footerYear'); if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeAllDropdowns();
    if (document.getElementById('filterDrawer') && document.getElementById('filterDrawer').classList.contains('open')) closeFilterDrawer();
    if (document.getElementById('paywallModal').style.display === 'flex') closeLoginModal();
    document.querySelectorAll('.overlay.open').forEach(ov => { if (ov.id === 'formOverlay' || ov.id === 'typesOverlay') return; ov.classList.remove('open'); });
});

function toggleDropdown(id) { const wrapper = document.getElementById(id).parentElement; const isActive = wrapper.classList.contains('active'); closeAllDropdowns(); if (!isActive) wrapper.classList.add('active'); }
function closeAllDropdowns() { document.querySelectorAll('.filter-dropdown-wrapper').forEach(el => el.classList.remove('active')); }
document.addEventListener('click', function(event) { if (!event.target.closest('.filter-dropdown-wrapper') && !event.target.closest('.glass-search-container') && !event.target.closest('.filter-drawer')) { closeAllDropdowns(); } });

let selectedBeds = [];
let selectedDelivery = [];
let selectedFinishing = [];

function selectPill(groupId, val) { 
    const el = event.target; el.classList.toggle('active'); 
    if (el.classList.contains('active')) { selectedBeds.push(val); } 
    else { selectedBeds = selectedBeds.filter(v => v !== val); } 
}
function selectDelivery(val, el) {
    el.classList.toggle('active');
    if (el.classList.contains('active')) { selectedDelivery.push(val); }
    else { selectedDelivery = selectedDelivery.filter(v => v !== val); }
}
function selectFinishing(val, el) {
    el.classList.toggle('active');
    if (el.classList.contains('active')) { selectedFinishing.push(val); }
    else { selectedFinishing = selectedFinishing.filter(v => v !== val); }
}
function openFilterDrawer() {
    const ov = document.getElementById('filterDrawerOverlay');
    const dr = document.getElementById('filterDrawer');
    if(ov) ov.classList.add('open');
    if(dr) dr.classList.add('open');
}
function closeFilterDrawer() {
    const ov = document.getElementById('filterDrawerOverlay');
    const dr = document.getElementById('filterDrawer');
    if(ov) ov.classList.remove('open');
    if(dr) dr.classList.remove('open');
}

let currentUser = null, isAdmin = false, isEditor = false;
let mainLocations = [], compounds = [], activeProjectType = 'all';
let viewingCompoundId = null;
let editingCompoundId = null;
let tempUnits = [], tempPlans = [], tempDecrees = [], openMainLocIds = {}; 
let activeDetailCategory = null, activeDetailUnitId = null, calcCustomBullets = [];
let activeLocationIds = []; 
let filters = {};
let completionFilter = 'all'; 

let appSettings = {
    resTypes: ['Studio', '1 Bedroom', '2 Bedrooms', '3 Bedrooms', '4 Bedrooms', '5 Bedrooms', 'Duplex', 'Penthouse', 'Townhouse', 'Twinhouse', 'Villa', 'Chalet', 'Apartment'],
    commTypes: ['Commercial', 'Administrative', 'Clinic', 'Recreational']
};

const UNIT_EN_NAMES = { 'استوديو': 'Studio', '1 غرفة نوم': '1 Bedroom', '2 غرفة نوم': '2 Bedrooms', '3 غرف نوم': '3 Bedrooms', '4 غرف نوم': '4 Bedrooms', '5 غرف نوم': '5 Bedrooms', 'دوبلكس': 'Duplex', 'بنتهاوس': 'Penthouse', 'تاون هاوس': 'Townhouse', 'توين هاوس': 'Twinhouse', 'فيلا': 'Villa', 'شاليه': 'Chalet', 'شقة': 'Apartment', 'تجاري': 'Commercial', 'إداري': 'Administrative', 'عيادة': 'Clinic', 'ترفيهي': 'Recreational' };
const UNIT_ORDER = { 'Studio': 1, '1 Bedroom': 2, '2 Bedrooms': 3, '3 Bedrooms': 4, '4 Bedrooms': 5, '5 Bedrooms': 6, 'Apartment': 7, 'Duplex': 8, 'Penthouse': 9, 'Townhouse': 10, 'Twinhouse': 11, 'Villa': 12, 'Chalet': 13, 'Commercial': 20, 'Administrative': 21, 'Clinic': 22, 'Recreational': 23 };

function getUnitEnName(name) { return UNIT_EN_NAMES[name] || name || 'Other'; }

const PROJECT_TYPES = { residential: 'سكني', commercial: 'تجاري / إداري', hotel: 'شقق فندقية' };
const FINISHING_TYPES = { core_shell: 'طوب أحمر', semi: 'نصف تشطيب', full: 'تشطيب كامل', mixed: 'متنوع' };
const FREQ_LABEL = {12:'شهري', 4:'ربع سنوي', 2:'نصف سنوي', 1:'سنوي'};
const DELIVERY_TIMELINES = [ {value:'immediate', label:'فوري'}, {value:'6m', label:'6 أشهر'}, {value:'1y', label:'سنة'}, {value:'1.5y', label:'سنة ونصف'}, {value:'2y', label:'سنتين'}, {value:'2.5y', label:'سنتين ونصف'}, {value:'3y', label:'3 سنوات'}, {value:'4y', label:'4 سنوات'} ];

function submitLogin() { 
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim(); 
    const btn = document.getElementById('loginSubmitBtn');
    if(!email || !password) { alert("من فضلك أدخل الإيميل والباسورد"); return; } 
    
    if (btn) btn.innerHTML = 'جاري الدخول... ⏳';
    
    document.getElementById('rememberMe').checked ? (localStorage.setItem('savedEmail', email), localStorage.setItem('savedPassword', password)) : (localStorage.removeItem('savedEmail'), localStorage.removeItem('savedPassword')); 
    sessionStorage.setItem('isSystemOpen', 'true'); 
    
    auth.signInWithEmailAndPassword(email, password).catch(err => { 
        sessionStorage.removeItem('isSystemOpen'); 
        if (btn) btn.innerHTML = 'دخول';
        alert("بيانات الدخول غير صحيحة."); 
    }); 
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    if (sessionStorage.getItem('isSystemOpen') !== 'true') { auth.signOut(); return; }
    let userDoc; try { userDoc = await db.collection('users').doc(user.email.toLowerCase()).get(); } catch(e) {}
    let role = 'viewer', expiryDate = '2024-01-01'; 
    if (userDoc && userDoc.exists) { role = userDoc.data().role || 'viewer'; expiryDate = userDoc.data().expiryDate || '2024-01-01'; } else if (user.email.toLowerCase() === 'jeanhany04@gmail.com') { role = 'admin'; expiryDate = '2099-12-31'; await db.collection('users').doc(user.email.toLowerCase()).set({ role: 'admin', expiryDate: '2099-12-31' }); } else { auth.signOut(); alert("هذا الحساب غير مسجل."); return; }
    if (new Date() > new Date(expiryDate)) { auth.signOut(); alert("لقد انتهت فترة اشتراكك."); return; }
    currentUser = user; isAdmin = (role === 'admin'); isEditor = (role === 'admin' || role === 'editor');
    
    let uLabel = document.getElementById('userEmailLabel');
    if(uLabel) uLabel.textContent = user.email.split('@')[0] + (isAdmin ? ' (المدير)' : (isEditor ? ' (محرر)' : ' (مشترك)'));
    
    let suAct = document.getElementById('superAdminActions'); if(suAct) suAct.style.display = isAdmin ? 'flex' : 'none'; 
    let addLoc = document.getElementById('addMainLocWrap'); if(addLoc) addLoc.style.display = isEditor ? 'flex' : 'none'; 
    let adAct = document.getElementById('adminActions'); if(adAct) adAct.style.display = isEditor ? 'flex' : 'none';
    
    let btnLog = document.getElementById('loginSubmitBtn');
    if(btnLog) btnLog.innerHTML = 'دخول';
    
    await syncCloudData(); 
    document.getElementById('paywallModal').style.display = 'none'; 
    document.getElementById('landingPageContainer').style.display = 'none'; 
    document.getElementById('systemApp').style.display = 'flex'; 
    setNavForApp(true);
  } else { 
      currentUser = null; isAdmin = false; isEditor = false; sessionStorage.removeItem('isSystemOpen'); 
      let uLabel = document.getElementById('userEmailLabel');
      if(uLabel) uLabel.textContent = 'يرجى تسجيل الدخول'; 
      document.getElementById('systemApp').style.display = 'none'; 
      document.getElementById('landingPageContainer').style.display = 'block'; 
      setNavForApp(false); 
  }
});

function openUsersManager() { document.getElementById('newAccEmail').value = ''; document.getElementById('newAccResult').style.display = 'none'; document.getElementById('usersOverlay').classList.add('open'); }
async function createNewSubscriber() { const email = document.getElementById('newAccEmail').value.trim().toLowerCase(), duration = parseInt(document.getElementById('newAccDuration').value), role = document.getElementById('newAccRole').value; if(!email) { showToast('يرجى كتابة الإيميل!'); return; } const password = Math.random().toString(36).slice(-6) + Math.floor(Math.random()*100), expDate = new Date(); expDate.setDate(expDate.getDate() + duration); try { await secondaryApp.auth().createUserWithEmailAndPassword(email, password); await db.collection('users').doc(email).set({ role: role, expiryDate: expDate.toISOString().split('T')[0] }); await secondaryApp.auth().signOut(); document.getElementById('resEmail').textContent = email; document.getElementById('resPass').textContent = password; document.getElementById('resDate').textContent = expDate.toISOString().split('T')[0]; document.getElementById('newAccResult').style.display = 'block'; showToast('تم تسجيل الحساب بنجاح!'); } catch (error) { alert('حدث خطأ: ' + error.message); } }

function openTypesManager() { document.getElementById('resTypesInput').value = appSettings.resTypes.join(' ، '); document.getElementById('commTypesInput').value = appSettings.commTypes.join(' ، '); document.getElementById('typesOverlay').classList.add('open'); }
async function saveCustomTypes() { if(!isEditor) return; const r = document.getElementById('resTypesInput').value.split(/[,،\n]+/).map(s=>s.trim()).filter(Boolean); const c = document.getElementById('commTypesInput').value.split(/[,،\n]+/).map(s=>s.trim()).filter(Boolean); appSettings.resTypes = r.length ? r : appSettings.resTypes; appSettings.commTypes = c.length ? c : appSettings.commTypes; try { await db.collection('system').doc('settings').set({ resTypes: appSettings.resTypes, commTypes: appSettings.commTypes }, { merge: true }); closeModal('typesOverlay'); showToast('تم الحفظ 💾'); if(document.getElementById('formOverlay').classList.contains('open')) renderUnitRows(); } catch(e) { alert('خطأ في الحفظ!'); } }

async function saveCompoundToCloud() {
    if(!isEditor) return;
    
    const cName = getSafeVal('fldCompany').trim();
    const pName = getSafeVal('fldProject').trim();
    const locId = getSafeVal('fldLocation');
    
    if(!cName || !pName || !locId) {
        return alert('يرجى إدخال اسم الشركة واسم المشروع والفرع كحد أدنى.');
    }

    let pCoreMin = getRawNum(getSafeVal('fldPriceCoreMin')), pCoreMax = getRawNum(getSafeVal('fldPriceCoreMax'));
    let pCoreAvg = (pCoreMin > 0 && pCoreMax > 0) ? (pCoreMin + pCoreMax) / 2 : (pCoreMin || pCoreMax || 0);
    
    let pSemiMin = getRawNum(getSafeVal('fldPriceSemiMin')), pSemiMax = getRawNum(getSafeVal('fldPriceSemiMax'));
    let pSemiAvg = (pSemiMin > 0 && pSemiMax > 0) ? (pSemiMin + pSemiMax) / 2 : (pSemiMin || pSemiMax || 0);

    let pFullMin = getRawNum(getSafeVal('fldPriceFullMin')), pFullMax = getRawNum(getSafeVal('fldPriceFullMax'));
    let pFullAvg = (pFullMin > 0 && pFullMax > 0) ? (pFullMin + pFullMax) / 2 : (pFullMin || pFullMax || 0);

    const compoundData = {
        locationId: locId,
        projectType: getSafeVal('fldProjectType'),
        companyName: cName,
        projectName: pName,
        phaseName: getSafeVal('fldPhaseName').trim(),
        ownerName: getSafeVal('fldOwner').trim(),
        consultant: getSafeVal('fldConsultant').trim(),
        
        whatsapp: getSafeVal('fldWhatsapp').trim(),
        projectPDF: getSafeVal('fldProjectPDF').trim(),
        previousWorks: getSafeVal('fldPreviousWorks').trim(),
        
        projectSize: getRawNum(getSafeVal('fldProjectSize')),
        floors: getSafeVal('fldFloors').trim(),
        compoundLocationDetail: getSafeVal('fldLocationDetail').trim(),
        locationLink: getSafeVal('fldLocationLink').trim(),
        
        pricePerMeterMin: getRawNum(getSafeVal('fldPriceMeterMin')),
        pricePerMeterMax: getRawNum(getSafeVal('fldPriceMeterMax')),
        pricePerMeter: getRawNum(getSafeVal('fldPriceMeter')),
        
        isAdvancedPricing: (document.getElementById('advPricingWrap') && document.getElementById('advPricingWrap').style.display !== 'none'),
        priceCoreMin: pCoreMin, priceCoreMax: pCoreMax, priceCore: pCoreAvg,
        priceSemiMin: pSemiMin, priceSemiMax: pSemiMax, priceSemi: pSemiAvg,
        priceFullMin: pFullMin, priceFullMax: pFullMax, priceFull: pFullAvg,

        commercialPrices: {
            adminMin: getRawNum(getSafeVal('fldAdminMin')),
            adminMax: getRawNum(getSafeVal('fldAdminMax')),
            adminFinish: getSafeVal('fldAdminFinish') || 'core_shell',
            commMin: getRawNum(getSafeVal('fldCommMin')),
            commMax: getRawNum(getSafeVal('fldCommMax')),
            commFinish: getSafeVal('fldCommFinish') || 'core_shell',
            clinicMin: getRawNum(getSafeVal('fldClinicMin')),
            clinicMax: getRawNum(getSafeVal('fldClinicMax')),
            clinicFinish: getSafeVal('fldClinicFinish') || 'core_shell',
            recMin: getRawNum(getSafeVal('fldRecMin')),
            recMax: getRawNum(getSafeVal('fldRecMax')),
            recFinish: getSafeVal('fldRecFinish') || 'core_shell'
        },
        
        deliveryDate: getSafeVal('fldDeliveryDate'),
        finishingStatus: getSafeVal('fldFinishingStatus'),
        
        maintenanceValue: getRawNum(getSafeVal('fldMaintenanceValue')),
        maintenanceType: getSafeVal('fldMaintenanceType') || 'percent',
        
        parkingType: getSafeVal('fldParkingType') || 'extra',
        parkingFee: getRawNum(getSafeVal('fldParkingFee')),
        
        cashDiscount: getRawNum(getSafeVal('fldCashDiscount')),
        
        unitTypes: tempUnits,
        paymentPlans: tempPlans,
        ministerialDecrees: tempDecrees,
        
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const loadOv = document.getElementById('loadingOverlay');
        if(loadOv) loadOv.style.display = 'flex';
        
        if (editingCompoundId) {
            await db.collection('compounds').doc(editingCompoundId).update(compoundData);
            showToast('تم تحديث المشروع بنجاح!');
        } else {
            await db.collection('compounds').add(compoundData);
            showToast('تم إضافة المشروع بنجاح!');
        }
        closeModal('formOverlay');
    } catch(e) {
        console.error("Save Error: ", e);
        alert("حدث خطأ أثناء الحفظ.");
    } finally {
        const loadOv = document.getElementById('loadingOverlay');
        if(loadOv) loadOv.style.display = 'none';
    }
}

async function deleteCurrentCompoundFromCloud() {
    if(!isEditor || !viewingCompoundId) return;
    if(!confirm('هل أنت متأكد من حذف هذا المشروع نهائياً؟')) return;
    
    try {
        const loadOv = document.getElementById('loadingOverlay');
        if(loadOv) loadOv.style.display = 'flex';
        
        await db.collection('compounds').doc(viewingCompoundId).delete();
        closeModal('detailOverlay');
        showToast('تم حذف المشروع بنجاح.');
    } catch(e) {
        alert("حدث خطأ أثناء الحذف.");
    } finally {
        const loadOv = document.getElementById('loadingOverlay');
        if(loadOv) loadOv.style.display = 'none';
    }
}

function isCompoundComplete(c) {
    try {
        if (!c.companyName || String(c.companyName).trim() === '') return false;
        if (!c.projectName || String(c.projectName).trim() === '') return false;
        if (!c.locationId || String(c.locationId).trim() === '') return false;
        
        let hasPrice = false;
        if (c.projectType === 'commercial' && c.commercialPrices) { 
            if (c.commercialPrices.adminMin > 0 || c.commercialPrices.commMin > 0 || c.commercialPrices.clinicMin > 0 || c.commercialPrices.recMin > 0) hasPrice = true; 
        } else { 
            if ((c.pricePerMeter && c.pricePerMeter > 0) || (c.pricePerMeterMin && c.pricePerMeterMin > 0) || (c.priceCore && c.priceCore > 0) || (c.priceSemi && c.priceSemi > 0) || (c.priceFull && c.priceFull > 0) || (c.priceCoreMin && c.priceCoreMin > 0) || (c.priceSemiMin && c.priceSemiMin > 0) || (c.priceFullMin && c.priceFullMin > 0)) { hasPrice = true; }
        }
        if (!hasPrice) return false;
        if (!c.unitTypes || !Array.isArray(c.unitTypes) || c.unitTypes.length < 1) return false;
        if (!c.paymentPlans || !Array.isArray(c.paymentPlans) || c.paymentPlans.length < 1) return false;
        
        return true;
    } catch (e) { return false; }
}

function renderAdminStats() {
    try {
        const board = document.getElementById('adminStatsBoard'); if (!board) return;
        if (!isEditor && !isAdmin) { board.style.display = 'none'; return; }
        board.style.display = 'flex';
        let completed = compounds.filter(c => isCompoundComplete(c)).length;
        
        let stTotal = document.getElementById('statTotal');
        let stComp = document.getElementById('statCompleted');
        let stInc = document.getElementById('statIncomplete');
        if(stTotal) stTotal.textContent = compounds.length;
        if(stComp) stComp.textContent = completed;
        if(stInc) stInc.textContent = compounds.length - completed;
    } catch(e) { console.error("Stats Error:", e); }
}

function setCompletionFilter(filterType, btnElem) { completionFilter = filterType; document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active')); btnElem.classList.add('active'); renderGrid(); }

function skeletonCardsHtml(count) {
    let card = `<div class="dossier skeleton-card" aria-hidden="true"><div class="skeleton-line" style="width:40%;height:0.625rem;margin-bottom:0.625rem;"></div><div class="skeleton-line" style="width:75%;height:1rem;margin-bottom:0.875rem;"></div><div class="skeleton-line" style="width:55%;height:0.5625rem;margin-bottom:0.5rem;"></div><div class="skeleton-line" style="width:45%;height:0.5625rem;margin-bottom:0.5rem;"></div><div class="skeleton-line" style="width:60%;height:0.5625rem;margin-bottom:0.875rem;"></div><div style="display:flex;gap:0.625rem;"><div class="skeleton-line" style="flex:1;height:2.125rem;"></div><div class="skeleton-line" style="flex:1;height:2.125rem;"></div></div></div>`;
    return card.repeat(count);
}

async function syncCloudData() { 
    try {
        const grid = document.getElementById('compoundGrid'); 
        if (grid && !grid.children.length) {
            const sub = document.getElementById('pageSub');
            if(sub) sub.textContent = "جاري تحميل الداتا..."; 
            grid.innerHTML = skeletonCardsHtml(6);
        }
        
        db.collection('system').doc('settings').onSnapshot(doc => { 
            try {
                if (doc.exists) { 
                    let d = doc.data(); 
                    if(d.resTypes) appSettings.resTypes = d.resTypes; 
                    if(d.commTypes) appSettings.commTypes = d.commTypes; 
                } 
            } catch(e) { console.error(e); }
        });
        
        db.collection('system').doc('locations').onSnapshot(doc => { 
            try {
                mainLocations = doc.exists ? (doc.data().mainLocations || []) : []; 
                renderLocationTree(); 
                applyFilters(); 
            } catch(e) { console.error(e); }
        }); 
        
        db.collection('compounds').onSnapshot(snapshot => { 
            try {
                let tempCompounds = [];
                snapshot.forEach(doc => tempCompounds.push({ id: doc.id, ...doc.data() })); 
                compounds = tempCompounds;
                
                renderAdminStats(); 
                renderLocationTree(); 
                applyFilters(); 
                
                let sub = document.getElementById('pageSub');
                if(sub) sub.textContent = `${compounds.length} مشروع مسجل بالسحابة`;
            } catch(e) { console.error("Data Snapshot Error:", e); }
        }, (error) => {
            console.error("Firebase Snapshot Error:", error);
            if (grid) grid.innerHTML = `<div class="empty-state"><div class="empty-state-title">حدث خطأ في جلب البيانات من السيرفر. تأكد من اتصالك بالإنترنت.</div></div>`;
        }); 
    } catch (err) { console.error("Critical Sync Error:", err); }
}

async function saveMainLocationsToCloud() { if(isEditor) { try { await db.collection('system').doc('locations').set({ mainLocations }); } catch (error) {} } }

function renderLocationTree(){
  try {
      const wrap = document.getElementById('locationTree'); 
      if(!wrap) return;
      const isAllActive = activeLocationIds.length === 0;
      let html = `<div class="sub-loc-tab ${isAllActive ? 'active' : ''}" onclick="selectLocationNode('all')"><span>🌐 كل المشروعات</span><span class="num">${compounds ? compounds.length : 0}</span></div>`;
      
      if (Array.isArray(mainLocations)) {
          mainLocations.forEach((mainLoc) => { 
              if(!mainLoc) return;
              let mainCount = 0; 
              let subs = Array.isArray(mainLoc.subLocations) ? mainLoc.subLocations : [];
              subs.forEach(sub => { 
                  if(sub && compounds) mainCount += compounds.filter(c => c.locationId === sub.id).length; 
              }); 
              
              const isOpen = !!openMainLocIds[mainLoc.id]; const isMainActive = activeLocationIds.includes(mainLoc.id);
              html += `<div class="loc-group"><div class="loc-group-header-row"><div class="loc-main-clickable ${isMainActive ? 'active' : ''}" onclick="selectLocationNode('${mainLoc.id}')"><span>📍 ${escapeHtml(mainLoc.name||'')}</span></div><div style="display:flex; align-items:center; gap:0.375rem;"><span class="num" style="color:var(--text-muted);">${mainCount}</span><span class="arrow-toggle ${isOpen ? 'open' : ''}" onclick="toggleMainLoc('${mainLoc.id}', event)" role="button" tabindex="0">▶</span>${isEditor ? `<button class="loc-del-btn" onclick="deleteMainLocation('${mainLoc.id}')">✕</button>` : ''}</div></div><div class="sub-loc-list ${isOpen ? 'show' : ''}">`; 
              
              subs.forEach(sub => { 
                  if(!sub) return;
                  const subCount = compounds ? compounds.filter(c => c.locationId === sub.id).length : 0; 
                  const isSubActive = activeLocationIds.includes(sub.id);
                  html += `<div class="sub-loc-tab ${isSubActive ? 'active' : ''}" onclick="selectLocationNode('${sub.id}')"><span>↳ ${escapeHtml(sub.name||'')}</span><div style="display:flex; align-items:center; gap:0.375rem;"><span class="num" style="opacity:0.9;">${subCount}</span>${isEditor ? `<button class="loc-del-btn" onclick="event.stopPropagation(); deleteSubLocation('${mainLoc.id}', '${sub.id}')">✕</button>` : ''}</div></div>`; 
              }); 
              html += `</div>${isEditor ? `<div class="add-sub-loc-box"><input id="subInput_${mainLoc.id}" placeholder="+ فرع جديد" onkeydown="if(event.key==='Enter') addSubLocation('${mainLoc.id}')"><button class="btn btn-outline-light btn-pill" style="padding:0.25rem 0.75rem; font-size:0.625rem;" onclick="addSubLocation('${mainLoc.id}')">إضافة</button></div>` : ''}</div>`; 
          }); 
      }
      wrap.innerHTML = html; 
      
      const fldLoc = document.getElementById('fldLocation');
      if(fldLoc && Array.isArray(mainLocations)) {
          fldLoc.innerHTML = `<option value="">-- لم يتم تحديد فرع --</option>` + mainLocations.map(m => {
              if(!m) return '';
              let subOptions = Array.isArray(m.subLocations) ? m.subLocations.map(s => `<option value="${s.id}">${escapeHtml(m.name||'')} ⬅️ ${escapeHtml(s.name||'')}</option>`).join('') : '';
              return `<optgroup label="${escapeHtml(m.name||'')}">${subOptions}</optgroup>`;
          }).join('');
      }
  } catch(e) { console.error("Render Location Error:", e); }
}

function selectLocationNode(nodeId){ 
    if(nodeId === 'all') { activeLocationIds = []; } else {
        const index = activeLocationIds.indexOf(nodeId);
        if(index > -1) { activeLocationIds.splice(index, 1); } else { activeLocationIds.push(nodeId); }
    }
    renderLocationTree(); renderGrid(); 
}

function toggleMainLoc(mainId, e){ e.stopPropagation(); openMainLocIds[mainId] = !openMainLocIds[mainId]; renderLocationTree(); }

function toggleMobileLoc() {
    const wrap = document.getElementById('locWrapperMobile'); const btn = document.getElementById('mobileLocToggleBtn');
    if(wrap.classList.contains('show')) { wrap.classList.remove('show'); btn.classList.remove('active'); btn.innerHTML = '📍 تصفية بالمناطق والمدن ▼'; } 
    else { wrap.classList.add('show'); btn.classList.add('active'); btn.innerHTML = '📍 إخفاء المناطق ▲'; }
}

async function addMainLocation(){ if(!isEditor) return; const input = document.getElementById('newMainLocInput'); if(!input.value.trim()) return; const newId = uid(); mainLocations.push({ id: newId, name: input.value.trim(), subLocations: [] }); openMainLocIds[newId] = true; input.value = ''; await saveMainLocationsToCloud(); }
async function deleteMainLocation(mainId){ if(!isEditor || !confirm('حذف المنطقة؟')) return; const subIds = mainLocations.find(m => m.id === mainId)?.subLocations.map(s=>s.id) || []; mainLocations = mainLocations.filter(m => m.id !== mainId); const batch = db.batch(); compounds.filter(c => subIds.includes(c.locationId)).forEach(c => { batch.delete(db.collection('compounds').doc(c.id)); }); await batch.commit(); activeLocationIds = activeLocationIds.filter(id => id !== mainId && !subIds.includes(id)); await saveMainLocationsToCloud(); }
async function addSubLocation(mainId){ if(!isEditor) return; const input = document.getElementById(`subInput_${mainId}`); if(!input || !input.value.trim()) return; mainLocations.find(m => m.id === mainId)?.subLocations.push({ id: uid(), name: input.value.trim() }); openMainLocIds[mainId] = true; await saveMainLocationsToCloud(); }
async function deleteSubLocation(mainId, subId){ if(!isEditor || !confirm('حذف الفرع؟')) return; const m = mainLocations.find(m => m.id === mainId); if(m) m.subLocations = m.subLocations.filter(s => s.id !== subId); const batch = db.batch(); compounds.filter(c => c.locationId === subId).forEach(c => { batch.delete(db.collection('compounds').doc(c.id)); }); await batch.commit(); activeLocationIds = activeLocationIds.filter(id => id !== subId); await saveMainLocationsToCloud(); }

function selectProjectType(type, btnElem){ 
    activeProjectType = type; 
    document.querySelectorAll('.glass-tab').forEach(b => b.classList.remove('active')); 
    if(btnElem) btnElem.classList.add('active'); 
    renderGrid(); 
}

let searchDebounceTimer = null;
function handleSearchInput() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(applyFilters, 300);
}

function applyFilters(){ 
    const checkedTypes = Array.from(document.querySelectorAll('.prop-type-cb:checked')).map(cb => cb.value);
    
    filters = { 
        searchText: (getSafeVal('fSearchText') || '').trim().toLowerCase(), 
        minPrice: getRawNum(getSafeVal('fMinPrice')), 
        maxPrice: getRawNum(getSafeVal('fMaxPrice')), 
        downPaymentTarget: getRawNum(getSafeVal('fDownPayment')), 
        maxMonthlyInstallment: getRawNum(getSafeVal('fMonthlyInstallment')),
        propertyTypes: checkedTypes.length > 0 ? checkedTypes : null,
        bedrooms: selectedBeds.length > 0 ? selectedBeds : null,
        delivery: selectedDelivery.length > 0 ? selectedDelivery : null,
        finishing: selectedFinishing.length > 0 ? selectedFinishing : null,
        sortOrder: getSafeVal('fSortOrder') || 'default'
    }; 
    renderGrid(); 
}

function resetFilters(){ 
    setSafeVal('fSearchText', ''); 
    setSafeVal('fMinPrice', ''); 
    setSafeVal('fMaxPrice', ''); 
    setSafeVal('fDownPayment', ''); 
    setSafeVal('fMonthlyInstallment', ''); 
    setSafeVal('fSortOrder', 'default');
    
    document.querySelectorAll('.prop-type-cb').forEach(cb => cb.checked = false); 
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active')); 
    selectedBeds = [];
    selectedDelivery = [];
    selectedFinishing = [];
    
    clearTimeout(searchDebounceTimer);
    applyFilters(); 
}

function findSubLocationName(subId){ 
    if(!Array.isArray(mainLocations)) return '-';
    for(let i=0; i<mainLocations.length; i++){ 
        let m=mainLocations[i]; 
        if(m && Array.isArray(m.subLocations)) { 
            let s = m.subLocations.find(x => x.id === subId); 
            if(s) return `${m.name||''} ⬅️ ${s.name||''}`; 
        } 
    } 
    return '-'; 
}

function generateDossierHTML(c) {
    const validPrices = (c.unitTypes||[]).map(u=>getRawNum(u.price)).filter(p => p !== null && !isNaN(p) && p > 0);
    const minPrice = validPrices.length ? Math.min(...validPrices) : null;
    let pDisplay = '';
    
    if (c.projectType === 'commercial' && c.commercialPrices) {
        let mins = [c.commercialPrices.adminMin, c.commercialPrices.commMin, c.commercialPrices.clinicMin, c.commercialPrices.recMin].filter(x => x > 0);
        let absoluteMin = mins.length > 0 ? Math.min(...mins) : 0; 
        pDisplay = absoluteMin > 0 ? `يبدأ من ${formatNum(absoluteMin)}` : '-';
    } else { 
        if (c.pricePerMeterMin > 0 && c.pricePerMeterMax > 0 && c.pricePerMeterMin !== c.pricePerMeterMax) {
            pDisplay = `${formatNum(c.pricePerMeterMin)} - ${formatNum(c.pricePerMeterMax)}`;
        } else if (c.pricePerMeterMin > 0) {
            pDisplay = `يبدأ من ${formatNum(c.pricePerMeterMin)}`;
        } else if (c.pricePerMeter > 0) {
            pDisplay = formatNum(c.pricePerMeter);
        } else {
            pDisplay = '-';
        }
    }

    let phaseTag = c.phaseName ? `<span class="phase-tag">${escapeHtml(c.phaseName)}</span>` : '';
    let finishText = c.projectType === 'commercial' ? 'متنوع' : (FINISHING_TYPES[c.finishingStatus]||'-');
    
    return `<div class="dossier" onclick="openDetail('${c.id}')">
                ${(c.ministerialDecrees && c.ministerialDecrees.length > 0) ? '<div class="stamp">معتمد</div>' : ''}
                <div class="dossier-company">${highlightText(c.companyName||'', filters.searchText)}</div>
                <div class="dossier-title">${highlightText(c.projectName||'بدون اسم', filters.searchText)} ${phaseTag}</div>
                <div class="dossier-badge">${PROJECT_TYPES[c.projectType||'residential']}</div>
                <div class="dossier-row"><b>الفرع:</b> <span>${highlightText(findSubLocationName(c.locationId), filters.searchText)}</span></div>
                <div class="dossier-row"><b>ارتفاع العمارات:</b> <span class="num">${c.floors ? escapeHtml(c.floors) : '-'}</span></div>
                <div class="dossier-row" style="border-bottom:none;"><b>التشطيب:</b> <span>${finishText}</span></div>
                <div class="dossier-meta">
                    <div class="meta-chip"><span>سعر المتر</span><div>${pDisplay}</div></div>
                    <div class="meta-chip"><span>أقل سعر وحدة</span><div>${minPrice ? formatNum(minPrice) : '-'}</div></div>
                </div>
            </div>`;
}

function generateMasterDossierHTML(group) {
    let c = group[0]; 
    return `<div class="dossier master-dossier" onclick="openPhasesModal('${escapeHtml(String(c.projectName||'')).replace(/'/g, "\\'")}', '${escapeHtml(String(c.companyName||'')).replace(/'/g, "\\'")}')">
        <div class="master-badge">مراحل متعددة</div>
        <div class="dossier-company">${highlightText(c.companyName||'', filters.searchText)}</div>
        <div class="dossier-title">${highlightText(c.projectName||'بدون اسم', filters.searchText)}</div>
        <div class="dossier-badge">${PROJECT_TYPES[c.projectType||'residential']}</div>
        <div class="dossier-row"><b>الفرع:</b> <span>${highlightText(findSubLocationName(c.locationId), filters.searchText)}</span></div>
        <div class="dossier-meta" style="margin-top:0.9375rem; grid-template-columns: 1fr;">
            <div class="meta-chip" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.05); border:1px dashed var(--border-color);">
                <span>اضغط لاختيار المرحلة (${group.length})</span>
                <div style="font-size:1rem;">➤</div>
            </div>
        </div>
    </div>`;
}

function openPhasesModal(projName, compName) {
    try {
        let group = compounds.filter(c => String(c.projectName||'') === projName && String(c.companyName||'') === compName);
        document.getElementById('phasesTitle').textContent = `مراحل مشروع: ${projName}`;
        
        let html = group.map(c => {
            return `<div class="detail-item" style="cursor:pointer; margin-bottom:0.625rem;" onclick="closeModal('phasesOverlay'); setTimeout(()=>openDetail('${c.id}'), 300)">
                <div style="color:var(--danger); font-size:1.125rem; font-weight:800; margin-bottom:0.3125rem;">${escapeHtml(c.phaseName || 'المرحلة الأساسية')}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">عمارات: <span class="num">${c.floors ? escapeHtml(c.floors) : '-'}</span> \vert{} تسليم: ${deliveryLabel(c.deliveryDate)}</div>
            </div>`;
        }).join('');
        
        document.getElementById('phasesBody').innerHTML = html;
        document.getElementById('phasesOverlay').classList.add('open');
    } catch(e) { console.error("Phases Error:", e); }
}

function renderGrid(){
  try {
      const grid = document.getElementById('compoundGrid');
      if(!grid) return;
      
      if (!Array.isArray(compounds)) compounds = [];

      let list = compounds.filter(c => {
          try {
              if(!c || typeof c !== 'object') return false;

              if (completionFilter === 'completed' && !isCompoundComplete(c)) return false;
              if (completionFilter === 'incomplete' && isCompoundComplete(c)) return false;
          
              if (activeLocationIds.length > 0) {
                  let parentMain = mainLocations.find(m => {
                      if(m && Array.isArray(m.subLocations)) { return m.subLocations.some(s => s.id === c.locationId); }
                      return false;
                  });
                  let parentId = parentMain ? parentMain.id : null;
                  if (!activeLocationIds.includes(c.locationId) && !activeLocationIds.includes(parentId)) { return false; }
              }
              
              if(activeProjectType !== 'all' && (c.projectType || 'residential') !== activeProjectType) return false;
              
              if(filters.searchText) {
                  let searchTxt = normalizeArabic(filters.searchText);
                  let searchableStr = [String(c.projectName||''), String(c.companyName||''), String(c.ownerName||''), String(c.consultant||''), findSubLocationName(c.locationId)].filter(Boolean).join(' ');
                  let normalizedSearchable = normalizeArabic(searchableStr);
                  if (!normalizedSearchable.includes(searchTxt)) return false;
              }
              
              if (filters.delivery && filters.delivery.length > 0) {
                  let cDel = c.deliveryDate || '';
                  let matchDel = false;
                  if (filters.delivery.includes('RTM') && (cDel === 'immediate' || cDel === '6m')) matchDel = true;
                  if (filters.delivery.includes('1y') && cDel === '1y') matchDel = true;
                  if (filters.delivery.includes('2y') && (cDel === '1.5y' || cDel === '2y')) matchDel = true;
                  if (filters.delivery.includes('3y') && (cDel === '2.5y' || cDel === '3y')) matchDel = true;
                  if (filters.delivery.includes('4y') && cDel === '4y') matchDel = true;
                  if (!matchDel) return false;
              }

              let cUnits = Array.isArray(c.unitTypes) ? c.unitTypes : []; 
              
              if (filters.finishing && filters.finishing.length > 0) {
                  let matchFin = false;
                  if (filters.finishing.includes(c.finishingStatus)) matchFin = true;
                  if (c.finishingStatus === 'mixed' || !c.finishingStatus) {
                      if (cUnits.some(u => filters.finishing.includes(u.finishing))) {
                          matchFin = true;
                      }
                  }
                  if (!matchFin) return false;
              }
              
              if(filters.propertyTypes) {
                  let isCommMatch = filters.propertyTypes.includes('commercial') && c.projectType === 'commercial';
                  
                  cUnits = cUnits.filter(u => {
                      let t = String(u.bedroomType || '').toLowerCase(); 
                      if (!t) return false;
                      if (filters.propertyTypes.includes('apartment') && (t.includes('شقة') || t.includes('غرف') || t.includes('غرفة') || t.includes('ستوديو') || t.includes('bed') || t.includes('studio'))) return true;
                      if (filters.propertyTypes.includes('commercial') && (t.includes('تجار') || t.includes('إدار') || t.includes('عياد') || t.includes('طب') || t.includes('مكتب') || t.includes('comm'))) return true;
                      if (filters.propertyTypes.includes('villa') && (t.includes('فيلا') || t.includes('villa'))) return true;
                      if (filters.propertyTypes.includes('twinhouse') && (t.includes('توين') || t.includes('twin'))) return true;
                      if (filters.propertyTypes.includes('townhouse') && (t.includes('تاون') || t.includes('town'))) return true;
                      if (filters.propertyTypes.includes('duplex') && (t.includes('دوبلكس') || t.includes('duplex'))) return true;
                      if (filters.propertyTypes.includes('penthouse') && (t.includes('بنتهاوس') || t.includes('penthouse'))) return true;
                      if (filters.propertyTypes.includes('studio') && (t.includes('استوديو') || t.includes('studio'))) return true;
                      if (filters.propertyTypes.includes('chalet') && (t.includes('شاليه') || t.includes('chalet'))) return true;
                      return false;
                  });
                  if (!isCommMatch && cUnits.length === 0) return false;
              }
              
              if(filters.bedrooms) {
                  cUnits = cUnits.filter(u => {
                      let rm = parseFloat(u.rooms);
                      if (isNaN(rm) || rm <= 0) {
                          let match = String(u.bedroomType || '').match(/(\d+)/);
                          if (match) rm = parseFloat(match[1]);
                          else if (String(u.bedroomType || '').toLowerCase().includes('studio') || String(u.bedroomType || '').includes('استوديو')) rm = 1;
                          else rm = 0;
                      }
                      if (filters.bedrooms.includes('1') && rm === 1) return true;
                      if (filters.bedrooms.includes('2') && rm === 2) return true;
                      if (filters.bedrooms.includes('3') && rm === 3) return true;
                      if (filters.bedrooms.includes('4') && rm === 4) return true;
                      if (filters.bedrooms.includes('5+') && rm >= 5) return true;
                      return false;
                  });
                  if(cUnits.length === 0) return false;
              }
              
              let unitPricesArray = cUnits.map(u => {
                  let p = getRawNum(u.price);
                  let effArea = (parseFloat(u.area) || 0) + (parseFloat(u.gardenArea) || 0)/3 + (parseFloat(u.roofArea) || 0)/3;
                  
                  let meterPrice = 0;
                  if (c.projectType === 'commercial') {
                       let cp = c.commercialPrices || {};
                       let aMin = getRawNum(cp.adminMin) || 0, aMax = getRawNum(cp.adminMax) || 0;
                       let cMin = getRawNum(cp.commMin) || 0, cMax = getRawNum(cp.commMax) || 0;
                       let clMin = getRawNum(cp.clinicMin) || 0, clMax = getRawNum(cp.clinicMax) || 0;
                       let rMin = getRawNum(cp.recMin) || 0, rMax = getRawNum(cp.recMax) || 0;
                       
                       let bType = getUnitEnName(u.bedroomType);
                       let min = 0, max = 0;
                       if (bType === 'Administrative') { min = aMin; max = aMax; }
                       else if (bType === 'Commercial') { min = cMin; max = cMax; }
                       else if (bType === 'Clinic') { min = clMin; max = clMax; }
                       else if (bType === 'Recreational') { min = rMin; max = rMax; }
                       else { min = cMin || aMin || clMin || rMin || 0; max = cMax || aMax || clMax || rMax || 0; }
                       meterPrice = (min > 0 && max > 0) ? (min + max)/2 : (min || max || 0); 
                  } else {
                       let pSingle = getRawNum(c.pricePerMeter) || 0;
                       let pMin = getRawNum(c.pricePerMeterMin) || 0;
                       let pMax = getRawNum(c.pricePerMeterMax) || 0;
                       let pAvg = (pMin > 0 && pMax > 0) ? (pMin + pMax) / 2 : (pMin || pMax || 0);
          
                       if (c.isAdvancedPricing) {
                           let pCoreMin = getRawNum(c.priceCoreMin) || 0, pCoreMax = getRawNum(c.priceCoreMax) || 0;
                           let pCoreAvg = (pCoreMin > 0 && pCoreMax > 0) ? (pCoreMin + pCoreMax)/2 : (pCoreMin || pCoreMax || getRawNum(c.priceCore) || 0);
                           let pSemiMin = getRawNum(c.priceSemiMin) || 0, pSemiMax = getRawNum(c.priceSemiMax) || 0;
                           let pSemiAvg = (pSemiMin > 0 && pSemiMax > 0) ? (pSemiMin + pSemiMax)/2 : (pSemiMin || pSemiMax || getRawNum(c.priceSemi) || 0);
                           let pFullMin = getRawNum(c.priceFullMin) || 0, pFullMax = getRawNum(c.priceFullMax) || 0;
                           let pFullAvg = (pFullMin > 0 && pFullMax > 0) ? (pFullMin + pFullMax)/2 : (pFullMin || pFullMax || getRawNum(c.priceFull) || 0);
          
                           if (u.finishing === 'core_shell' && pCoreAvg > 0) meterPrice = pCoreAvg;
                           else if (u.finishing === 'semi' && pSemiAvg > 0) meterPrice = pSemiAvg;
                           else if (u.finishing === 'full' && pFullAvg > 0) meterPrice = pFullAvg;
                           else if (pAvg > 0) meterPrice = pAvg;
                           else meterPrice = pSingle;
                       } else {
                           meterPrice = pAvg > 0 ? pAvg : pSingle;
                       }
                  }

                  let explicitMeterPrice = (effArea > 0 && p > 0) ? Math.round(p / effArea) : 0;
                  let finalMeterPrice = explicitMeterPrice > 0 ? explicitMeterPrice : meterPrice;
                  let finalTotalPrice = p > 0 ? p : Math.round(effArea * meterPrice);

                  return { totalPrice: finalTotalPrice, meterPrice: finalMeterPrice };
              });
          
              if(filters.minPrice != null || filters.maxPrice != null) {
                  let passPrice = false;
                  for (let i = 0; i < unitPricesArray.length; i++) {
                      let prices = unitPricesArray[i];
                      if (prices.totalPrice <= 0 && prices.meterPrice <= 0) continue;
                      
                      let okMinTotal = filters.minPrice != null ? (prices.totalPrice >= filters.minPrice) : true;
                      let okMaxTotal = filters.maxPrice != null ? (prices.totalPrice <= filters.maxPrice) : true;
                      let passTotal = okMinTotal && okMaxTotal && prices.totalPrice > 0;

                      let okMinMeter = filters.minPrice != null ? (prices.meterPrice >= filters.minPrice) : true;
                      let okMaxMeter = filters.maxPrice != null ? (prices.meterPrice <= filters.maxPrice) : true;
                      let passMeter = okMinMeter && okMaxMeter && prices.meterPrice > 0;

                      if (passTotal || passMeter) { passPrice = true; break; }
                  }
                  if(!passPrice) return false;
              }
              
              if(filters.downPaymentTarget != null || filters.maxMonthlyInstallment != null){
                  const plans = Array.isArray(c.paymentPlans) ? c.paymentPlans : []; 
                  if(!plans.length) return false; 
                  let pass = false;
                  
                  for (let i = 0; i < cUnits.length; i++) {
                      let u = cUnits[i];
                      let baseUnitPrices = unitPricesArray[i];
                      if (baseUnitPrices.totalPrice <= 0) continue;
                      
                      let effArea = (parseFloat(u.area) || 0) + (parseFloat(u.gardenArea) || 0)/3 + (parseFloat(u.roofArea) || 0)/3;
          
                      for(let j = 0; j < plans.length; j++) {
                          let p = plans[j];
                          let planBasePrice = baseUnitPrices.totalPrice;
                          if (p.pricePerMeter > 0 && effArea > 0) { planBasePrice = Math.round(effArea * p.pricePerMeter); }
          
                          const r = calcInstallmentWithDiscount(planBasePrice, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
                          
                          let dpVal = Math.max(0, r.downPayment);
                          let instVal = Math.max(0, r.monthlyEquivalent);

                          let okDP = filters.downPaymentTarget != null ? (dpVal <= filters.downPaymentTarget) : true;
                          let okInst = filters.maxMonthlyInstallment != null ? (instVal <= filters.maxMonthlyInstallment) : true;
                          
                          if (okDP && okInst) { pass = true; break; } 
                      }
                      if(pass) break;
                  }
                  if(!pass) return false;
              } 
              
              return true;
          } catch(e) { return false; }
      });
      
      if(filters.sortOrder && filters.sortOrder !== 'default') {
          list.sort((a, b) => {
              let aPrice = a.isAdvancedPricing ? (a.pricePerMeterMin || a.priceCoreMin || a.priceCore || 0) : (a.pricePerMeterMin || a.pricePerMeter || 0);
              let bPrice = b.isAdvancedPricing ? (b.pricePerMeterMin || b.priceCoreMin || b.priceCore || 0) : (b.pricePerMeterMin || b.pricePerMeter || 0);
              return filters.sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
          });
      }
      
      let pageTitleText = 'كل المشروعات';
      if (activeLocationIds.length === 1) {
          let selectedId = activeLocationIds[0];
          let main = mainLocations.find(m => m.id === selectedId);
          if (main) pageTitleText = main.name + ' (الكل)';
          else pageTitleText = findSubLocationName(selectedId);
      } else if (activeLocationIds.length > 1) {
          pageTitleText = `تصفية متعددة (${activeLocationIds.length} مناطق)`;
      }
      document.getElementById('pageTitle').textContent = pageTitleText;
      
      if(!list.length) {
          const sub = document.getElementById('pageSub');
          if(sub) sub.textContent = `0 مشروعات مطابقة`;
          return grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">لا توجد مشروعات مطابقة</div><div class="empty-state-sub">جرّب تعديل كلمة البحث أو الفلاتر المستخدمة</div><button class="btn btn-outline-light btn-pill" onclick="resetFilters()">مسح كل الفلاتر</button></div>`;
      }
      
      const sub = document.getElementById('pageSub');
      if(sub) sub.textContent = `${list.length} مشروع مسجل بالسحابة`;
      
      let groups = {};
      list.forEach(c => {
          let key = `${String(c.projectName\vert{}\vert{}'').trim().toLowerCase()}\vert{}${String(c.companyName||'').trim().toLowerCase()}`;
          if(!groups[key]) groups[key] = [];
          groups[key].push(c);
      });
       
      let htmlString = "";
      Object.values(groups).forEach(group => {
          try {
              if(group.length === 1) { htmlString += generateDossierHTML(group[0]); } 
              else { htmlString += generateMasterDossierHTML(group); }
          } catch(err) { console.error("Dossier Error", err); }
      });
      grid.innerHTML = htmlString;
  } catch (error) { console.log("Grid Render Error:", error); }
}

function openCompoundForm(existing){
  try {
      editingCompoundId = existing ? existing.id : null; 
      document.getElementById('formTitle').textContent = existing ? 'تعديل المشروع' : 'إضافة مشروع جديد';
      
      let defaultLoc = '';
      if (activeLocationIds.length === 1) { let isSub = mainLocations.some(m => (m.subLocations || []).some(s => s.id === activeLocationIds[0])); if (isSub) defaultLoc = activeLocationIds[0]; }
      if(existing) setSafeVal('fldLocation', existing.locationId || ''); else setSafeVal('fldLocation', defaultLoc);
      
      ['fldCompany','fldProject','fldPhaseName','fldWhatsapp','fldProjectPDF','fldPreviousWorks','fldFloors','fldOwner','fldConsultant',
       'fldPriceMeter', 'fldPriceMeterMin', 'fldPriceMeterMax', 'fldPriceMeterAvg',
       'fldPriceCore', 'fldPriceSemi', 'fldPriceFull',
       'fldPriceCoreMin', 'fldPriceCoreMax', 'fldPriceCoreAvg',
       'fldPriceSemiMin', 'fldPriceSemiMax', 'fldPriceSemiAvg',
       'fldPriceFullMin', 'fldPriceFullMax', 'fldPriceFullAvg',
       'fldAdminMin','fldAdminMax','fldCommMin','fldCommMax','fldClinicMin','fldClinicMax','fldRecMin','fldRecMax',
       'fldParkingFee','fldProjectSize','fldDeliveryDate','fldLocationDetail','fldLocationLink','fldCashDiscount'].forEach(id => { 
           setSafeVal(id, ''); 
       }); 
       
      ['fldAdminFinish', 'fldCommFinish', 'fldClinicFinish', 'fldRecFinish'].forEach(id => { setSafeVal(id, 'core_shell'); });
    
      if (existing) {
          setSafeVal('fldProjectType', existing.projectType || 'residential'); 
          setSafeVal('fldCompany', existing.companyName || ''); 
          setSafeVal('fldProject', existing.projectName || ''); 
          setSafeVal('fldPhaseName', existing.phaseName || ''); 
          
          setSafeVal('fldWhatsapp', existing.whatsapp || ''); 
          setSafeVal('fldProjectPDF', existing.projectPDF || ''); 
          setSafeVal('fldPreviousWorks', existing.previousWorks || ''); 

          setSafeVal('fldFloors', existing.floors || ''); 
          setSafeVal('fldOwner', existing.ownerName || ''); 
          setSafeVal('fldConsultant', existing.consultant || ''); 
          
          setSafeVal('fldPriceMeterMin', existing.pricePerMeterMin ? formatNum(existing.pricePerMeterMin) : '');
          setSafeVal('fldPriceMeterMax', existing.pricePerMeterMax ? formatNum(existing.pricePerMeterMax) : '');
          if(existing.pricePerMeter) setSafeVal('fldPriceMeter', formatNum(existing.pricePerMeter));
          
          let hasAdv = existing.isAdvancedPricing || existing.priceCore > 0 || existing.priceSemi > 0 || existing.priceFull > 0 || existing.priceCoreMin > 0 || existing.priceSemiMin > 0 || existing.priceFullMin > 0;
          
          if(hasAdv) {
              setSafeVal('fldPriceCoreMin', existing.priceCoreMin ? formatNum(existing.priceCoreMin) : '');
              setSafeVal('fldPriceCoreMax', existing.priceCoreMax ? formatNum(existing.priceCoreMax) : '');
              setSafeVal('fldPriceCoreAvg', existing.priceCore ? formatNum(existing.priceCore) : '');
              
              setSafeVal('fldPriceSemiMin', existing.priceSemiMin ? formatNum(existing.priceSemiMin) : '');
              setSafeVal('fldPriceSemiMax', existing.priceSemiMax ? formatNum(existing.priceSemiMax) : '');
              setSafeVal('fldPriceSemiAvg', existing.priceSemi ? formatNum(existing.priceSemi) : '');
              
              setSafeVal('fldPriceFullMin', existing.priceFullMin ? formatNum(existing.priceFullMin) : '');
              setSafeVal('fldPriceFullMax', existing.priceFullMax ? formatNum(existing.priceFullMax) : '');
              setSafeVal('fldPriceFullAvg', existing.priceFull ? formatNum(existing.priceFull) : '');
              
              toggleAdvPricing(true);
          } else {
              toggleAdvPricing(false);
          }
    
          let cp = existing.commercialPrices || {}; 
          setSafeVal('fldAdminMin', cp.adminMin ? formatNum(cp.adminMin) : ''); 
          setSafeVal('fldAdminMax', cp.adminMax ? formatNum(cp.adminMax) : ''); 
          setSafeVal('fldAdminFinish', cp.adminFinish || 'core_shell'); 
          setSafeVal('fldCommMin', cp.commMin ? formatNum(cp.commMin) : ''); 
          setSafeVal('fldCommMax', cp.commMax ? formatNum(cp.commMax) : ''); 
          setSafeVal('fldCommFinish', cp.commFinish || 'core_shell'); 
          setSafeVal('fldClinicMin', cp.clinicMin ? formatNum(cp.clinicMin) : ''); 
          setSafeVal('fldClinicMax', cp.clinicMax ? formatNum(cp.clinicMax) : ''); 
          setSafeVal('fldClinicFinish', cp.clinicFinish || 'core_shell'); 
          setSafeVal('fldRecMin', cp.recMin ? formatNum(cp.recMin) : ''); 
          setSafeVal('fldRecMax', cp.recMax ? formatNum(cp.recMax) : ''); 
          setSafeVal('fldRecFinish', cp.recFinish || 'core_shell');
          
          setSafeVal('fldFinishingStatus', (existing.finishingStatus && existing.finishingStatus !== 'mixed') ? existing.finishingStatus : 'core_shell');
    
          setSafeVal('fldMaintenanceValue', existing.maintenanceValue || existing.maintenancePercent || ''); 
          setSafeVal('fldMaintenanceType', existing.maintenanceType || 'percent');
          
          setSafeVal('fldParkingType', existing.parkingType || 'extra');
          setSafeVal('fldParkingFee', existing.parkingFee ? formatNum(existing.parkingFee) : ''); 
          
          const pkFeeEl = document.getElementById('fldParkingFee');
          if(pkFeeEl) pkFeeEl.style.display = (existing.parkingType === 'included') ? 'none' : 'block';
    
          setSafeVal('fldProjectSize', existing.projectSize || ''); 
          setSafeVal('fldDeliveryDate', existing.deliveryDate || ''); 
          setSafeVal('fldLocationDetail', existing.compoundLocationDetail || ''); 
          setSafeVal('fldLocationLink', existing.locationLink || ''); 
          setSafeVal('fldCashDiscount', existing.cashDiscount || ''); 
          
      } else {
          setSafeVal('fldProjectType', 'residential'); 
          setSafeVal('fldMaintenanceValue', ''); 
          setSafeVal('fldMaintenanceType', 'percent');
          setSafeVal('fldParkingType', 'extra'); 
          
          const pkFeeEl = document.getElementById('fldParkingFee');
          if(pkFeeEl) pkFeeEl.style.display = 'block';
          toggleAdvPricing(false);
      }
      
      onProjectTypeChange(); 
      
      tempUnits = existing ? JSON.parse(JSON.stringify(existing.unitTypes||[])) : []; 
      if (existing) { 
          tempUnits.forEach(u => { u.bedroomType = getUnitEnName(u.bedroomType); }); 
      } 
      tempPlans = existing ? JSON.parse(JSON.stringify(existing.paymentPlans||[])) : []; 
      tempDecrees = existing ? JSON.parse(JSON.stringify(existing.ministerialDecrees||[])) : []; 
      
      renderUnitRows(); 
      renderPlanRows(); 
      renderDecreeRows(); 
      const ov = document.getElementById('formOverlay');
      if (ov) ov.classList.add('open');
  } catch (error) {
      console.error("Form Open Error:", error);
  }
}

function processMagicPaste() {
    const text = document.getElementById('magicPasteInput').value;
    if (!text.trim()) return showToast('برجاء لصق نص المشروع أولاً!');
    let cleanText = text.replace(/[\u200B-\u200D\uFEFF\u2060\u200E\u200F\u00A0]/g, ' ');
    const lines = cleanText.split('\n');
    let currentType = appSettings.resTypes[0] || 'Studio'; 
    let unitsAdded = 0, plansAdded = 0, fieldsFilled = 0;
    
    let defaultFinishing = 'core_shell';

    let firstLine = lines.find(l => l.replace(/[*🚨\-\s📢🏡]/g, '').length > 0);
    if (firstLine && !document.getElementById('fldProject').value) { document.getElementById('fldProject').value = firstLine.replace(/[*🚨\-By📢🏡]/ig, '').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g, '').trim(); fieldsFilled++; }
    let foundBy = false;
    for (let i = 0; i < lines.length; i++) {
        let l = lines[i].trim().replace(/[*]/g, '');
        if (l.toLowerCase().endsWith('by')) { foundBy = true; continue; }
        if (foundBy && l) { if (!document.getElementById('fldCompany').value) { document.getElementById('fldCompany').value = l; fieldsFilled++; } foundBy = false; }
    }
    lines.forEach(line => {
        const cleanLine = line.replace(/[*`~•▫️▶️➡️📍🔧🏢🚨🏡📢]/g, '').trim(); const lowerLine = cleanLine.toLowerCase(); if (!cleanLine) return; 
        let developer = extractValueAfterKeyword(cleanLine, ['Developer', 'المطور', 'شركة', 'Development']); if (developer && !document.getElementById('fldCompany').value) { document.getElementById('fldCompany').value = developer; fieldsFilled++; }
        let owner = extractValueAfterKeyword(cleanLine, ['Owner', 'المالك']); if (owner && !document.getElementById('fldOwner').value) { document.getElementById('fldOwner').value = owner; fieldsFilled++; }
        let consultant = extractValueAfterKeyword(cleanLine, ['Consultant', 'استشاري', 'الاستشاري']); if (consultant && !document.getElementById('fldConsultant').value) { document.getElementById('fldConsultant').value = consultant; fieldsFilled++; }
        let delivery = extractValueAfterKeyword(cleanLine, ['Delivery Date', 'Delivery', 'التسليم', 'استلام']);
        if (delivery) { let dSelect = document.getElementById('fldDeliveryDate'); if (lowerLine.includes('immediate') || lowerLine.includes('فوري')) dSelect.value = 'immediate'; else if (lowerLine.includes('1') || lowerLine.includes('one')) dSelect.value = '1y'; else if (lowerLine.includes('2') || lowerLine.includes('two')) dSelect.value = '2y'; else if (lowerLine.includes('3') || lowerLine.includes('three')) dSelect.value = '3y'; else if (lowerLine.includes('4') || lowerLine.includes('four')) dSelect.value = '4y'; }
        
        let finishingMatch = extractValueAfterKeyword(cleanLine, ['Finishing', 'التشطيب', 'تشطيب']);
        if (finishingMatch) { 
            if (lowerLine.includes('core') || lowerLine.includes('shell') || lowerLine.includes('بدون')) defaultFinishing = 'core_shell'; 
            else if (lowerLine.includes('semi') || lowerLine.includes('نصف')) defaultFinishing = 'semi'; 
            else if (lowerLine.includes('fully') || lowerLine.includes('كامل')) defaultFinishing = 'full'; 
        }
        
        let maintenance = extractValueAfterKeyword(cleanLine, ['Maintenance', 'صيانة', 'الصيانة']);
        if (maintenance) { let mVal = maintenance.replace(/[^0-9.]/g, ''); if (mVal && !document.getElementById('fldMaintenanceValue').value) { document.getElementById('fldMaintenanceValue').value = mVal; if (maintenance.includes('%')) { document.getElementById('fldMaintenanceType').value = 'percent'; } else { document.getElementById('fldMaintenanceType').value = 'per_meter'; } fieldsFilled++; } }
        if (lowerLine.includes('cash discount') || lowerLine.includes('خصم كاش')) { let cdMatch = cleanLine.match(/(\d+(?:\.\d+)?)%/); if (cdMatch && !document.getElementById('fldCashDiscount').value) { document.getElementById('fldCashDiscount').value = cdMatch[1]; fieldsFilled++; } }
        if (lowerLine.includes('parking') || lowerLine.includes('جراج') || lowerLine.includes('بارك')) {
            let pSelect = document.getElementById('fldParkingType');
            if(lowerLine.includes('free') || lowerLine.includes('شامل') || lowerLine.includes('مجان')) { pSelect.value = 'included'; document.getElementById('fldParkingFee').style.display = 'none'; } 
            else if (lowerLine.includes('optional') || lowerLine.includes('اختيار')) { pSelect.value = 'optional'; document.getElementById('fldParkingFee').style.display = 'block'; } 
            else { pSelect.value = 'extra'; document.getElementById('fldParkingFee').style.display = 'block'; let pMatch = cleanLine.match(/([\d,]+(?:\.\d+)?)\s*(k|egp|ج|جنيه|الف)?/i); if (pMatch && !document.getElementById('fldParkingFee').value) { let pVal = parseFloat(pMatch[1].replace(/,/g, '')); let mult = pMatch[2] ? pMatch[2].toLowerCase() : ''; if (mult === 'k' || mult === 'الف') pVal *= 1000; document.getElementById('fldParkingFee').value = formatNum(pVal); fieldsFilled++; } }
        }
        const sizeMatch = cleanLine.match(/(\d+(?:\.\d+)?)\s*(acres?|فدان)/i); if (sizeMatch && !document.getElementById('fldProjectSize').value) { document.getElementById('fldProjectSize').value = sizeMatch[1]; fieldsFilled++; }
        const linkMatch = cleanLine.match(/https?:\/\/[^\s]+/); if (linkMatch && !document.getElementById('fldLocationLink').value) { document.getElementById('fldLocationLink').value = linkMatch[0]; fieldsFilled++; }
        const floorMatch = cleanLine.match(/G\s*\+\s*(\d+)/i); if (floorMatch && !document.getElementById('fldFloors').value) { document.getElementById('fldFloors').value = floorMatch[1]; fieldsFilled++; }
        
        let processingLine = cleanLine.replace(/\b\d+\s*(?:bedrooms?|beds?|br|غرف(?:ة|تين)?)\b/ig, '');
        const unitMatch = processingLine.match(/(?:(?:\d+\s*up\s*to\s*)|\b|\()(\d+)\s*(?:[mM]2?|m²|م|متر)?(?:\s*(?:\+|\/)\s*(?:garden|roof|جاردن|روف)?\s*(\d+)\s*(?:[mM]2?|m²|م|متر)?)?.*?[\s:=→>/\-_—–]+\s*([\d,]{4,}(?:\.\d+)?|[A-Za-z\u0600-\u06FF]+)/i); 
        if (unitMatch) {
            const area = parseFloat(unitMatch[1]); const extraArea = unitMatch[2] ? parseFloat(unitMatch[2]) : '';
            let garden = ''; let roof = '';
            if (extraArea) { if (processingLine.match(/roof|روف|بنتهاوس|penthouse/i)) { roof = extraArea; } else { garden = extraArea; } }
            if (area > 10) { tempUnits.push({ id: uid(), bedroomType: currentType, rooms: '', area: area, gardenArea: garden, roofArea: roof, price: '', finishing: defaultFinishing }); unitsAdded++; }
        }
        if (!lowerLine.includes('delivery') && !lowerLine.includes('تسليم') && !lowerLine.includes('استلام')) {
            const planMatch = cleanLine.match(/(?:(\d+)%\s*(?:discount|خصم).*?)?(?:(\d+)%\s*(?:DP|Down Payment|d\.p|مقدم).*?)?(?:discount\s*(\d+)%)?.*?(\d+)\s*(?:years?|سن)/i);
            if (planMatch && !cleanLine.includes('?')) {
                const discount = planMatch[1] ? parseFloat(planMatch[1]) : (planMatch[3] ? parseFloat(planMatch[3]) : ''); let dpText = cleanLine.match(/(\d+)%\s*(?:dp|d\.p|down|مقدم)/i); const dp = dpText ? parseFloat(dpText[1]) : 0; const years = parseFloat(planMatch[4]);
                if (!tempPlans.some(p => p.notes === cleanLine.replace(/^[▫️\-\s]+/,''))) { tempPlans.push({ id: uid(), name: `خطة ${years} سنوات`, discountPercent: discount, downPaymentPercent: dp, years: years, frequency: '12', pricePerMeter: '', notes: cleanLine.replace(/^[▫️\-\s]+/,''), customBullets: [] }); plansAdded++; }
            }
        }
    });
    renderUnitRows(); renderPlanRows(); document.getElementById('magicPasteInput').value = ''; showToast(`تم الاستخراج بنجاح 🚀`);
}

function extractValueAfterKeyword(line, keywords) {
    for (let k of keywords) {
        let idx = line.toLowerCase().indexOf(k.toLowerCase());
        if (idx !== -1) {
            let val = line.substring(idx + k.length).replace(/[:\-=>]/g, '').trim();
            if (val) return val.split(/\s{2,}/)[0]; 
        }
    }
    return null;
}

function openDetail(id){
    const ov = document.getElementById('detailOverlay');
    if(ov) ov.classList.add('open'); 
    
    try {
        const c = compounds.find(x=>x.id===id); 
        if(!c) {
            document.getElementById('detailBody').innerHTML = "<div style='color:red; text-align:center; padding:20px;'>المشروع غير موجود.</div>";
            return; 
        }
        
        viewingCompoundId = id;
        
        const rawTypes = Array.isArray(c.unitTypes) ? c.unitTypes : [];
        const availTypes = Array.from(new Set(rawTypes.map(u => getUnitEnName(u.bedroomType))));
        availTypes.sort((a,b) => (UNIT_ORDER[a]||99) - (UNIT_ORDER[b]||99));
        
        activeDetailCategory = availTypes.length ? availTypes[0] : null; 
        if (activeDetailCategory) {
            let filtered = rawTypes.filter(u => getUnitEnName(u.bedroomType) === activeDetailCategory);
            filtered.sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0));
            activeDetailUnitId = filtered.length > 0 ? filtered[0].id : null;
        } else {
            activeDetailUnitId = null;
        }
        
        renderDetailModalContent(); 
    } catch(e) {
        console.error("Detail Error:", e);
        document.getElementById('detailBody').innerHTML = `<div style="text-align:center; color:var(--danger); padding:30px;"><b>حدث خطأ في تحميل بيانات هذا المشروع.</b><br><br>${e.message}</div>`;
    }
}

function editCurrentCompound(){ 
    try {
        const c = compounds.find(x=>x.id===viewingCompoundId); 
        if(!c) return; 
        closeModal('detailOverlay'); 
        openCompoundForm(c); 
    } catch(e) {
        console.error("Edit Button Error:", e);
        alert("زرار التعديل متوقف لخطأ في بيانات المشروع.");
    }
}

function editCompoundById(id) {
    try {
        const c = compounds.find(x => x.id === id); 
        if(!c) return; 
        closeModal('detailOverlay'); 
        openCompoundForm(c); 
    } catch(e) {
        console.error("Edit Button Error:", e);
        alert("زرار التعديل متوقف لخطأ في بيانات المشروع.");
    }
}

function setDetailCategory(catKey) { 
    try {
        activeDetailCategory = catKey; 
        const c = compounds.find(x => x.id === viewingCompoundId); 
        if (c && c.unitTypes) { 
            const rawTypes = Array.isArray(c.unitTypes) ? c.unitTypes : [];
            const matched = rawTypes.filter(u => getUnitEnName(u.bedroomType) === catKey); 
            matched.sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0));
            if (matched.length > 0) activeDetailUnitId = matched[0].id; 
        } 
        renderDetailModalContent(); 
    } catch(e) { console.error(e); }
}

function setDetailUnit(unitId) { activeDetailUnitId = unitId; renderDetailModalContent(); }

function renderDetailModalContent() {
  try {
      const c = compounds.find(x => x.id === viewingCompoundId); if (!c) return;
      
      document.getElementById('detailTitle').textContent = c.projectName || '';
      
      let finishText = FINISHING_TYPES[c.finishingStatus] || '-'; let pText = '';
      let parkingText = '';
      if (c.parkingType === 'included') parkingText = 'شامل السعر';
      else if (c.parkingType === 'optional') parkingText = c.parkingFee ? 'اختياري (' + formatNum(c.parkingFee) + ' ج)' : 'اختياري';
      else parkingText = c.parkingFee ? formatNum(c.parkingFee) + ' ج' : 'رسوم إضافية';
    
      let heroPriceText = '';

      if (c.projectType === 'commercial') {
          finishText = 'متنوع (بالأسعار)';
          let cp = c.commercialPrices || {}; let parts = []; const fName = { core_shell: 'طوب', semi: 'نصف', full: 'كامل' };
          
          let mins = [cp.adminMin, cp.commMin, cp.clinicMin, cp.recMin].map(x => getRawNum(x)).filter(x => x > 0);
          let absoluteMin = mins.length > 0 ? Math.min(...mins) : 0; 
          heroPriceText = absoluteMin > 0 ? `${formatNum(absoluteMin)} ج.م` : '-';

          if (cp.adminMin || cp.adminMax) parts.push(`<b>إداري:</b> <span class="num">${formatNum(cp.adminMin)} - ${formatNum(cp.adminMax)}</span> <span style="font-size:0.625rem;">(${fName[cp.adminFinish||'core_shell']})</span>`);
          if (cp.commMin || cp.commMax) parts.push(`<b>تجاري:</b> <span class="num">${formatNum(cp.commMin)} - ${formatNum(cp.commMax)}</span> <span style="font-size:0.625rem;">(${fName[cp.commFinish||'core_shell']})</span>`);
          if (cp.clinicMin || cp.clinicMax) parts.push(`<b>طبي:</b> <span class="num">${formatNum(cp.clinicMin)} - ${formatNum(cp.clinicMax)}</span> <span style="font-size:0.625rem;">(${fName[cp.clinicFinish||'core_shell']})</span>`);
          if (cp.recMin || cp.recMax) parts.push(`<b>ترفيهي:</b> <span class="num">${formatNum(cp.recMin)} - ${formatNum(cp.recMax)}</span> <span style="font-size:0.625rem;">(${fName[cp.recFinish||'core_shell']})</span>`);
          pText = parts.length > 0 ? `<div style="display:flex; flex-direction:column; gap:0.25rem; font-size:0.875rem;">${parts.join('')}</div>` : `<span class="num">${formatNum(c.pricePerMeterMin||0)}</span> ج`;
      } else { 
          if (c.pricePerMeterMin > 0) heroPriceText = `${formatNum(c.pricePerMeterMin)} ج.م`;
          else if (c.pricePerMeter > 0) heroPriceText = `${formatNum(c.pricePerMeter)} ج.م`;
          else heroPriceText = '-';

          let pParts = [];
          if(c.isAdvancedPricing) {
              if (c.pricePerMeter > 0) pParts.push(`<b>متوسط السعر للمتر:</b> <span class="num" style="color:var(--success);">${formatNum(c.pricePerMeter)}</span> ج/م²`);
              if(c.pricePerMeterMin > 0 || c.pricePerMeterMax > 0) {
                  let rng = (c.pricePerMeterMin > 0 && c.pricePerMeterMax > 0 && c.pricePerMeterMin !== c.pricePerMeterMax) ? formatNum(c.pricePerMeterMin) + ' - ' + formatNum(c.pricePerMeterMax) : formatNum(c.pricePerMeterMin || c.pricePerMeterMax);
                  pParts.push(`<b>نطاق السعر للمتر:</b> <span class="num">${rng}</span> ج/م²`);
              }
              let fPriceCore = (c.priceCoreMin > 0 && c.priceCoreMax > 0 && c.priceCoreMin !== c.priceCoreMax) ? `${formatNum(c.priceCoreMin)} - ${formatNum(c.priceCoreMax)}` : formatNum(c.priceCoreMin || c.priceCoreMax || c.priceCore || 0);
              if (c.priceCoreMin > 0 || c.priceCoreMax > 0 || c.priceCore > 0) pParts.push(`<b>طوب أحمر:</b> <span class="num">${fPriceCore}</span> ج`);
              let fPriceSemi = (c.priceSemiMin > 0 && c.priceSemiMax > 0 && c.priceSemiMin !== c.priceSemiMax) ? `${formatNum(c.priceSemiMin)} - ${formatNum(c.priceSemiMax)}` : formatNum(c.priceSemiMin || c.priceSemiMax || c.priceSemi || 0);
              if (c.priceSemiMin > 0 || c.priceSemiMax > 0 || c.priceSemi > 0) pParts.push(`<b>نصف تشطيب:</b> <span class="num">${fPriceSemi}</span> ج`);
              let fPriceFull = (c.priceFullMin > 0 && c.priceFullMax > 0 && c.priceFullMin !== c.priceFullMax) ? `${formatNum(c.priceFullMin)} - ${formatNum(c.priceFullMax)}` : formatNum(c.priceFullMin || c.priceFullMax || c.priceFull || 0);
              if (c.priceFullMin > 0 || c.priceFullMax > 0 || c.priceFull > 0) pParts.push(`<b>تشطيب كامل:</b> <span class="num">${fPriceFull}</span> ج`);
          } else {
              if (c.pricePerMeter > 0) pParts.push(`<b>متوسط السعر للمتر:</b> <span class="num" style="color:var(--success);">${formatNum(c.pricePerMeter)}</span> ج/م²`);
              if (c.pricePerMeterMin > 0 || c.pricePerMeterMax > 0) {
                  let rng = (c.pricePerMeterMin > 0 && c.pricePerMeterMax > 0 && c.pricePerMeterMin !== c.pricePerMeterMax) ? formatNum(c.pricePerMeterMin) + ' - ' + formatNum(c.pricePerMeterMax) : formatNum(c.pricePerMeterMin || c.pricePerMeterMax);
                  pParts.push(`<b>نطاق السعر للمتر:</b> <span class="num">${rng}</span> ج/م²`);
              }
          }
          pText = pParts.length > 0 ? `<div style="display:flex; flex-direction:column; gap:0.25rem; font-size:0.875rem;">${pParts.join('')}</div>` : `-`;
      }
      
      const locLinkHtml = c.locationLink ? `<br><a href="${escapeHtml(c.locationLink)}" target="_blank" style="color:var(--primary); font-size:0.75rem; font-weight:bold; background:var(--item-bg); padding:0.375rem 0.75rem; border-radius:0.25rem; border:1px solid var(--primary); display:inline-block; margin-top:0.3125rem;">📍 الخريطة</a>` : '';
      let maintText = c.maintenanceValue ? (c.maintenanceType === 'per_meter' ? `${c.maintenanceValue} ج/م²` : `${c.maintenanceValue}%`) : '-';
    
      let detailsGridHtml = `<div class="detail-grid"><div class="detail-item"><b>النوع</b><span>${PROJECT_TYPES[c.projectType || 'residential']}</span></div><div class="detail-item"><b>المطور</b><span>${escapeHtml(c.companyName || '-')}</span></div><div class="detail-item"><b>المالك</b><span>${escapeHtml(c.ownerName || '-')}</span></div><div class="detail-item"><b>الاستشاري</b><span>${escapeHtml(c.consultant || '-')}</span></div><div class="detail-item"><b>الفرع</b><span>${escapeHtml(findSubLocationName(c.locationId))}</span></div><div class="detail-item"><b>التسليم والتشطيب</b><span>${deliveryLabel(c.deliveryDate)} | ${finishText}</span></div><div class="detail-item"><b>أسعار المتر</b><span style="color:var(--primary);">${pText}</span></div><div class="detail-item"><b>الصيانة والجراج</b><span>صيانة: <span class="num">${maintText}</span> | جراج: <span class="num">${parkingText}</span></span></div><div class="detail-item"><b>المساحة الإجمالية</b><span><span class="num">${c.projectSize ? c.projectSize : '-'}</span> فدان</span></div><div class="detail-item"><b>ارتفاع العمارات</b><span class="num">${c.floors ? escapeHtml(c.floors) : '-'}</span></div><div class="detail-item full"><b>الموقع التفصيلي</b><span>${escapeHtml(c.compoundLocationDetail || '-')} ${locLinkHtml}</span></div></div>`;
    
      const grouped = {}; 
      const rawTypesModal = Array.isArray(c.unitTypes) ? c.unitTypes : [];
      rawTypesModal.forEach(u => { 
          let t = getUnitEnName(u.bedroomType); 
          (grouped[t] = grouped[t] || []).push(u); 
      }); 
      const cats = Object.keys(grouped).sort((a,b) => (UNIT_ORDER[a]||99) - (UNIT_ORDER[b]||99));
      
      let unitsSection = '';
      if(cats.length){
        if(!activeDetailCategory || !grouped[activeDetailCategory]) activeDetailCategory = cats[0]; 
        if(!activeDetailUnitId && grouped[activeDetailCategory] && grouped[activeDetailCategory].length > 0) {
            grouped[activeDetailCategory].sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0));
            activeDetailUnitId = grouped[activeDetailCategory][0].id;
        }
        
        unitsSection += `<div class="section-label">الأسعار والكاش</div><div class="unit-cat-tabs">` + cats.map(k => {
            return `<button class="unit-cat-btn ${k === activeDetailCategory ? 'active' : ''}" onclick="setDetailCategory('${k}')">${escapeHtml(k)}</button>`;
        }).join('') + `</div>`;
        
        const fNamesAr = { 'core_shell': 'طوب أحمر', 'semi': 'نصف تشطيب', 'full': 'تشطيب كامل' };
        
        unitsSection += `<div class="size-picker-container">` + (grouped[activeDetailCategory] || []).sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0)).map(u => {
            let rmText = u.rooms ? ` | <span class="num">${u.rooms}</span> غرف` : '';
            let gText = u.gardenArea ? ` <span style="color:var(--success); font-size:0.6875rem; font-weight:bold;">+ ${u.gardenArea}m² Garden</span>` : '';
            let rText = u.roofArea ? ` <span style="color:var(--danger); font-size:0.6875rem; font-weight:bold;">+ ${u.roofArea}m² Roof</span>` : '';
            let fText = u.finishing ? ` | ${fNamesAr[u.finishing] || u.finishing || ''}` : '';
            let pText = u.price ? formatNum(u.price) + ' ج' : 'حسب المتر';
            return `<div class="size-chip ${u.id === activeDetailUnitId ? 'active' : ''}" onclick="setDetailUnit('${u.id}')"><span class="num">${u.area}</span>m²${rmText}${gText}${rText}${fText} | <span class="num">${pText}</span></div>`
        }).join('') + `</div>`;
        
        const sUnit = rawTypesModal.find(u => u.id === activeDetailUnitId) || (grouped[activeDetailCategory] ? grouped[activeDetailCategory][0] : null);
        
        let isTextPrice = false;
        let sUnitNumericPrice = 0;
        if (sUnit) {
            sUnitNumericPrice = getRawNum(sUnit.price);
            if (sUnitNumericPrice === null || isNaN(sUnitNumericPrice)) isTextPrice = true;
        }
        
        let cashDiscount = c.cashDiscount || 0;
        if (sUnit && !isTextPrice && cashDiscount > 0 && sUnitNumericPrice > 0) {
            let discountAmount = sUnitNumericPrice * (cashDiscount / 100);
            let finalCashPrice = sUnitNumericPrice - discountAmount;
            unitsSection += `<div class="cash-discount-box">
                        <div class="cash-row"><span>السعر الأساسي</span><b class="num">${formatNum(sUnitNumericPrice)} ج</b></div>
                        <div class="cash-row highlight"><span>قيمة خصم الكاش (${cashDiscount}%)</span><b class="num">- ${formatNum(Math.round(discountAmount))} ج</b></div>
                        <div class="cash-row final"><span>النهائي (كاش)</span><b class="num">${formatNum(Math.round(finalCashPrice))} ج</b></div>
                     </div>`;
        }
    
        const safePlans = Array.isArray(c.paymentPlans) ? c.paymentPlans : [];
        if(sUnit && safePlans.length > 0 && !isTextPrice && sUnitNumericPrice > 0){
          unitsSection += `<div class="category-box"><table class="spec-table"><tr><th>الخطة</th><th>سعر الوحدة</th><th>مقدم</th><th>دفعات</th><th>قسط شهري</th><th>قسط ربع سنوي</th></tr>`;
          safePlans.forEach(p => { 
              let planBasePrice = sUnitNumericPrice;
              let planMeterText = '';
              
              if (p.pricePerMeter > 0) {
                  let effArea = (sUnit.area || 0) + (sUnit.gardenArea || 0)/3 + (sUnit.roofArea || 0)/3;
                  planBasePrice = Math.round(effArea * p.pricePerMeter);
                  planMeterText = `<br><span style="color:var(--primary); font-size:0.625rem; background:var(--item-bg); padding:0.125rem 0.375rem; border-radius:0.25rem; border:1px dashed var(--primary); display:inline-block; margin-top:0.25rem;">سعر المتر: ${formatNum(p.pricePerMeter)} ج</span>`;
              }
              
              const r = calcInstallmentWithDiscount(planBasePrice, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
              
              let planNameCol = `<b>${escapeHtml(p.name)}</b>${planMeterText}`;
              if (p.discountPercent > 0) planNameCol += `<br><small style="color:var(--danger); font-weight:bold; display:block; margin-top:0.25rem;">خصم ${p.discountPercent}%</small>`;
              
              let unitPriceCol = `<span class="num" style="font-size:0.85rem; font-weight:bold;">${formatNum(planBasePrice)} ج</span>`;
              if (p.discountPercent > 0) unitPriceCol = `<del style="color:var(--text-muted);font-size:0.7rem;" class="num">${formatNum(planBasePrice)}</del><br><span style="color:var(--success); font-weight:bold; font-size:0.85rem;" class="num">${formatNum(Math.round(r.netTotal))} ج</span>`;

              unitsSection += `<tr>
                  <td>${planNameCol}</td>
                  <td>${unitPriceCol}</td>
                  <td><span class="num" style="font-size:0.85rem; font-weight:bold;">${formatNum(Math.round(r.downPayment))} ج</span><br><small style="font-size:0.65rem;">(%${p.downPaymentPercent || 0})</small></td>
                  <td class="num" style="font-size:0.8rem;">${r.bulletsSummary.map(b => b.label).join('<br>') || '-'}</td>
                  <td style="color:var(--primary);" class="num"><span style="font-size:0.85rem; font-weight:bold;">${formatNum(Math.round(r.monthlyEquivalent))} ج</span></td>
                  <td class="num"><span style="font-size:0.85rem; font-weight:bold;">${formatNum(Math.round(r.quarterlyEquivalent))} ج</span></td>
              </tr>`; 
          }); 
          unitsSection += `</table></div>`;
        }
      } 
      
      unitsSection += `<div class="section-label" style="margin-top:2.5rem; color:var(--success); border-color:var(--success);">🧮 الحاسبة السريعة للمشروع</div>
               <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.9375rem;">اكتب المساحة عشان تحسبلها الأقساط على كل خطط السداد الخاصة بالمشروع ده فوراً.</p>
               <div style="display:flex; gap:0.625rem; background:var(--item-bg); padding:0.9375rem; border-radius:var(--radius-card); border:1px solid var(--border-color); margin-bottom:1.25rem; align-items:center; flex-wrap:wrap;">
                   <input type="number" id="miniCalcArea" placeholder="مباني (م²)" class="num" style="flex:1; min-width:7.5rem; padding:0.625rem; border-radius:var(--radius-input); background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-main); outline:none;" oninput="runProjectMiniCalc('${c.id}')">
                   <input type="number" id="miniCalcGarden" placeholder="جاردن (م²)" class="num" style="flex:1; min-width:6.25rem; padding:0.625rem; border-radius:var(--radius-input); background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-main); outline:none;" oninput="runProjectMiniCalc('${c.id}')">
                   <input type="number" id="miniCalcRoof" placeholder="روف (م²)" class="num" style="flex:1; min-width:6.25rem; padding:0.625rem; border-radius:var(--radius-input); background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-main); outline:none;" oninput="runProjectMiniCalc('${c.id}')">
               </div>
               <div id="miniCalcResult"></div>`;
               
      let whatsappNum = c.whatsapp ? String(c.whatsapp).replace(/[^0-9]/g, '') : '';
      let whatsappBtn = whatsappNum ? `<a href="https://wa.me/${whatsappNum}" target="_blank" class="btn w-100 btn-pill" style="margin-bottom:0.625rem; background:#25D366; color:#fff; font-size:1rem; text-decoration:none;"><b style="font-family:Cairo;">تواصل واتساب | WhatsApp</b></a>` : '';
      let pdfBtn = c.projectPDF ? `<a href="${escapeHtml(c.projectPDF)}" target="_blank" class="btn btn-outline-light w-100 btn-pill" style="margin-bottom:0.625rem; font-size:0.85rem; text-decoration:none;"><b>بروشور المشروع | PDF Brochure</b></a>` : '';
      let worksBtn = c.previousWorks ? `<a href="${escapeHtml(c.previousWorks)}" target="_blank" class="btn btn-outline-light w-100 btn-pill" style="margin-bottom:0.625rem; font-size:0.85rem; text-decoration:none;"><b>سابقة الأعمال | Previous Works</b></a>` : '';

      let sideActions = `
          <div class="action-card" style="background:var(--item-bg); padding:1.5rem; border-radius:1rem; border:1px solid var(--border-color); position:sticky; top:0; z-index:10; width:100%;">
              <h4 style="margin-bottom:1rem; color:var(--text-main); font-weight:800; font-size:1.1rem; text-align:center;">تواصل للحجز والتفاصيل<br><span style="color:var(--text-muted); font-size:0.8rem;">Contact & Reserve</span></h4>
              ${whatsappBtn}
              ${pdfBtn}
              ${worksBtn}
              ${(!whatsappNum && !c.projectPDF && !c.previousWorks) ? `<p style="text-align:center; color:var(--text-muted); font-size:0.8rem;">لا توجد روابط تواصل مسجلة.</p>` : ''}
              
              <hr style="border-color:var(--border-color); margin:1.5rem 0;">
              
              <div style="display:flex; gap:0.5rem; width:100%;">
                  <button class="btn btn-outline-light btn-pill w-100" onclick="editCompoundById('${c.id}')" style="display:${isEditor ? 'flex' : 'none'}; font-size:0.85rem; justify-content:center;">تعديل ⚙️</button>
                  <button class="btn w-100 btn-pill" onclick="deleteCurrentCompoundFromCloud()" style="display:${isEditor ? 'flex' : 'none'}; background:var(--danger); color:#fff; border:none; font-size:0.85rem; justify-content:center;">حذف 🗑️</button>
              </div>
          </div>
      `;

      let mainLayout = `
      <div class="detail-page-layout" style="display:flex; gap:2rem; align-items:flex-start; flex-wrap:wrap; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:2rem;">
          <div class="detail-main-col" style="flex:1; min-width:18.75rem;">
               <h1 style="font-size:2rem; font-weight:800; color:var(--text-main); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.625rem; flex-wrap:wrap;">
                  ${highlightText(c.projectName||'بدون اسم', filters.searchText)} 
                  ${c.phaseName ? `<span style="font-size:0.9rem; background:var(--primary); color:#fff; padding:0.2rem 0.8rem; border-radius:2rem;">${escapeHtml(c.phaseName)}</span>` : ''}
               </h1>
               <p style="color:var(--text-muted); font-size:1rem; margin-bottom:1rem;">📍 ${escapeHtml(findSubLocationName(c.locationId))} - ${escapeHtml(c.companyName)}</p>
               <div>
                   <span style="color:var(--text-muted); font-size:0.8rem; display:block; font-weight:bold; margin-bottom:0.25rem;">يبدأ من | Starting from</span>
                   <div style="color:var(--primary); font-size:1.8rem; font-weight:800;" class="num">${heroPriceText}</div>
               </div>
          </div>
          <div class="detail-side-col" style="width:20rem; flex-shrink:0;">
               ${sideActions}
          </div>
      </div>
      <div>
         ${detailsGridHtml}
         ${unitsSection}
      </div>
      `;
    
      document.getElementById('detailBody').innerHTML = mainLayout;
  } catch (err) {
      console.error("Detail HTML Render Error:", err);
      document.getElementById('detailBody').innerHTML = `<div style="text-align:center; color:var(--danger); padding:1.875rem;"><b>حدث خطأ أثناء رسم شاشة المشروع.</b><br><br>${err.message}</div>`;
  }
}

function runProjectMiniCalc(cId) {
    try {
        const c = compounds.find(x => x.id === cId);
        if(!c) return;

        let area = parseFloat(document.getElementById('miniCalcArea').value) || 0;
        let garden = parseFloat(document.getElementById('miniCalcGarden').value) || 0;
        let roof = parseFloat(document.getElementById('miniCalcRoof').value) || 0;

        let resultDiv = document.getElementById('miniCalcResult');
        if(area === 0 && garden === 0 && roof === 0) { resultDiv.innerHTML = ''; return; }

        let avgPrice = 0;
        if (c.projectType !== 'commercial') {
            if (c.pricePerMeterMin > 0 || c.pricePerMeterMax > 0) {
                avgPrice = ((c.pricePerMeterMin || 0) + (c.pricePerMeterMax || 0)) / 2;
                if (!avgPrice) avgPrice = c.pricePerMeterMin || c.pricePerMeterMax || 0;
            } else {
                avgPrice = c.pricePerMeter || 0;
            }
        }

        if(avgPrice === 0) { resultDiv.innerHTML = '<div style="color:var(--danger); padding:0.625rem; border:1px dashed var(--danger); text-align:center; background:rgba(220,38,38,0.05); border-radius:0.5rem;">لا يوجد متوسط سعر متر مسجل لهذا المشروع.</div>'; return; }

        let effArea = area + (garden/3) + (roof/3);
        let basePrice = Math.round(effArea * avgPrice);

        let html = '';
        let cashDiscount = c.cashDiscount || 0;
        if (cashDiscount > 0) {
            let discountAmount = basePrice * (cashDiscount / 100);
            let finalCashPrice = basePrice - discountAmount;
            html += `<div style="border:2px dashed var(--success); padding:0.9375rem; background:rgba(16,185,129,0.05); border-radius:0.5rem; display:flex; justify-content:space-around; align-items:center; margin-bottom:1.25rem;">
                        <div style="text-align:center;"><span>السعر الأساسي</span><br><b class="num" style="font-size:1.125rem;">${formatNum(basePrice)} ج</b></div>
                        <div style="text-align:center; color:var(--danger);"><span>خصم الكاش (${cashDiscount}%)</span><br><b class="num" style="font-size:1.125rem;">- ${formatNum(Math.round(discountAmount))} ج</b></div>
                        <div style="text-align:center; color:var(--success);"><span>النهائي (كاش)</span><br><b class="num" style="font-size:1.2rem;">${formatNum(Math.round(finalCashPrice))} ج</b></div>
                     </div>`;
        }

        const safePlans = Array.isArray(c.paymentPlans) ? c.paymentPlans : [];
        if(safePlans.length > 0){
          html += `<div class="category-box"><table class="spec-table"><tr><th>الخطة</th><th>سعر الوحدة</th><th>مقدم</th><th>دفعات</th><th>قسط شهري</th><th>قسط ربع سنوي</th></tr>`;
          safePlans.forEach(p => { 
              let planBasePrice = basePrice;
              let planMeterText = '';
              
              if (p.pricePerMeter > 0) {
                  planBasePrice = Math.round(effArea * p.pricePerMeter);
                  planMeterText = `<br><span style="color:var(--primary); font-size:0.625rem; font-weight:800; background:var(--item-bg); padding:0.125rem 0.375rem; border-radius:0.25rem; border:1px dashed var(--primary); display:inline-block; margin-top:0.25rem;">سعر المتر: ${formatNum(p.pricePerMeter)} ج</span>`;
              }
              
              const r = calcInstallmentWithDiscount(planBasePrice, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
              
              let planNameCol = `<b>${escapeHtml(p.name)}</b>${planMeterText}`;
              if (p.discountPercent > 0) planNameCol += `<br><small style="color:var(--danger); font-weight:bold; display:block; margin-top:0.25rem;">خصم ${p.discountPercent}%</small>`;
              
              let unitPriceCol = `<span class="num" style="font-size:0.85rem; font-weight:bold;">${formatNum(planBasePrice)} ج</span>`;
              if (p.discountPercent > 0) unitPriceCol = `<del style="color:var(--text-muted);font-size:0.7rem;" class="num">${formatNum(planBasePrice)}</del><br><span style="color:var(--success); font-weight:bold; font-size:0.85rem;" class="num">${formatNum(Math.round(r.netTotal))} ج</span>`;

              html += `<tr>
                  <td>${planNameCol}</td>
                  <td>${unitPriceCol}</td>
                  <td><span class="num" style="font-size:0.85rem; font-weight:bold;">${formatNum(Math.round(r.downPayment))} ج</span><br><small style="font-size:0.65rem;">(%${p.downPaymentPercent || 0})</small></td>
                  <td class="num" style="font-size:0.8rem;">${r.bulletsSummary.map(b => b.label).join('<br>') || '-'}</td>
                  <td style="color:var(--primary);" class="num"><span style="font-size:0.85rem; font-weight:bold;">${formatNum(Math.round(r.monthlyEquivalent))} ج</span></td>
                  <td class="num"><span style="font-size:0.85rem; font-weight:bold;">${formatNum(Math.round(r.quarterlyEquivalent))} ج</span></td>
              </tr>`; 
          }); 
          html += `</table></div>`;
        } else {
            html += `<div style="text-align:center; padding:1.25rem; color:var(--text-muted);">مفيش خطط سداد مسجلة.</div>`;
        }

        resultDiv.innerHTML = html;
    } catch(e) {
        document.getElementById('miniCalcResult').innerHTML = `<div style="color:red; text-align:center; padding:0.625rem;">حدث خطأ في الحاسبة.</div>`;
    }
}

function calcInstallmentWithDiscount(originalTotal, discountPct, downPct, customBullets, years, freq){ 
    const discountVal = (originalTotal || 0) * ((discountPct||0)/100);
    const netTotal = (originalTotal || 0) - discountVal;
    const downPayment = netTotal * ((downPct||0)/100);
    let extraPaymentsTotal = 0; 
    let bulletsSummary = []; 
    
    let validBullets = Array.isArray(customBullets) ? customBullets : [];
    
    validBullets.forEach(b => { 
        const pct = parseFloat(b.percent) || 0; 
        if(pct > 0){ 
            if(b.type === 'annual'){ 
                let sYears = Array.isArray(b.selectedYears) ? b.selectedYears : [];
                if (sYears.length > 0) {
                    const perYearVal = netTotal * (pct / 100);
                    const ordinals = {1: 'الأولى', 2: 'الثانية', 3: 'الثالثة', 4: 'الرابعة', 5: 'الخامسة', 6: 'السادسة', 7: 'السابعة', 8: 'الثامنة', 9: 'التاسعة', 10: 'العاشرة'};
                    
                    [...sYears].sort((a,b)=>a-b).forEach(yr => {
                        const yName = ordinals[yr] || yr;
                        bulletsSummary.push({ type: 'annual', label: `سنة ${yName}: %${pct} = ${formatNum(Math.round(perYearVal))} ج`, val: perYearVal });
                        extraPaymentsTotal += perYearVal; 
                    });
                }
            } else { 
                const val = netTotal * (pct / 100); 
                extraPaymentsTotal += val; 
                let name = 'مؤجلة';
                if (b.type === 'delivery') name = 'استلام';
                else if (b.type === 'after_3m') name = 'بعد 3 شهور';
                else if (b.type === 'after_6m') name = 'بعد 6 شهور';
                else if (b.type === 'after_9m') name = 'بعد 9 شهور';
                bulletsSummary.push({ type: b.type, label: `${name}: %${pct} = ${formatNum(Math.round(val))} ج`, val }); 
            } 
        } 
    }); 
    
    const remaining = Math.max(0, netTotal - (downPayment + extraPaymentsTotal));
    let yrs = parseFloat(years) || 1;
    if (yrs <= 0) yrs = 1;
    const monthlyEquivalent = remaining / (yrs * 12); 
    return { originalTotal, discountVal, netTotal, downPayment, extraPaymentsTotal, bulletsSummary, remaining, monthlyEquivalent, quarterlyEquivalent: monthlyEquivalent * 3 }; 
}

function openCalculator(){ calcCustomBullets=[]; ['calcTotal','calcDiscountPct','calcDownPct','calcYears'].forEach(id=>setSafeVal(id, '')); document.getElementById('calcResult').style.display='none'; renderCalcBulletsRows(); document.getElementById('calcOverlay').classList.add('open'); }
function addCalcBulletRow(){ calcCustomBullets.push({id:uid(), type:'annual', percent:'', selectedYears:[]}); renderCalcBulletsRows(); }
function removeCalcBulletRow(id){ calcCustomBullets=calcCustomBullets.filter(b=>b.id!==id); renderCalcBulletsRows(); }

function toggleCalcYearSelection(bId, y){ 
    const b = calcCustomBullets.find(x=>x.id===bId); 
    if(b){ if(!b.selectedYears) b.selectedYears = []; const i = b.selectedYears.indexOf(y); i > -1 ? b.selectedYears.splice(i,1) : b.selectedYears.push(y); renderCalcBulletsRows(); } 
}

function updateCalcBullet(id, f, v){ 
    const b = calcCustomBullets.find(x=>x.id===id); 
    if(b){ 
        b[f] = f==='type' ? v : (parseFloat(v)||0); 
        if(f==='type') renderCalcBulletsRows(); 
    } 
}

function renderCalcBulletsRows(){ 
    const cbRows = document.getElementById('calcBulletsRows');
    if(!cbRows) return;
    cbRows.innerHTML = calcCustomBullets.map(b=>`<div class="bullet-row" style="display:flex; gap:0.625rem; align-items:center; margin-bottom:0.625rem;">
            <select style="flex:1; min-width:6.25rem; padding:0.5rem; border-radius:0.25rem; background:var(--item-bg); border:1px solid var(--border-color); color:var(--text-main);" onchange="updateCalcBullet('${b.id}','type',this.value)">
                <option value="annual" ${b.type=='annual'?'selected':''}>سنوية</option>
                <option value="deferred" ${b.type=='deferred'?'selected':''}>مؤجلة</option>
                <option value="delivery" ${b.type=='delivery'?'selected':''}>استلام</option>
                <option value="after_3m" ${b.type=='after_3m'?'selected':''}>بعد 3 شهور</option>
                <option value="after_6m" ${b.type=='after_6m'?'selected':''}>بعد 6 شهور</option>
                <option value="after_9m" ${b.type=='after_9m'?'selected':''}>بعد 9 شهور</option>
            </select>
            <input type="number" placeholder="%" class="num" style="width:5rem; flex-shrink:0; padding:0.5rem; border-radius:0.25rem; background:var(--item-bg); border:1px solid var(--border-color); color:var(--text-main);" value="${b.percent}" oninput="updateCalcBullet('${b.id}','percent',this.value)">
            <button class="btn btn-danger-style" style="flex-shrink:0; padding:0.5rem;" onclick="removeCalcBulletRow('${b.id}')">✕</button>
        </div>
        ${b.type==='annual'?`<div class="years-pills" style="margin-bottom:0.9375rem; display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center; width:100%;">${[1,2,3,4,5,6,7].map(yr=>`<div class="year-pill ${(b.selectedYears||[]).includes(yr)?'selected':''}" onclick="toggleYearSelection('${b.id}',${yr})">${yr}</div>`).join('')}</div>`:''}
    `).join(''); 
}

function runUniversalCalculator(){ 
    const inputVal = getSafeVal('calcTotal').replace(/,/g, '');
    const t = getRawNum(inputVal); 
    if(!t || isNaN(t)) return showToast('أدخل إجمالي سعر صحيح'); 
    
    const r = calcInstallmentWithDiscount(t, parseFloat(getSafeVal('calcDiscountPct'))||0, parseFloat(getSafeVal('calcDownPct'))||0, calcCustomBullets, parseFloat(getSafeVal('calcYears'))||0, 12); 
    
    const box = document.getElementById('calcResult'); 
    box.style.display='grid'; 
    
    let bulletsHtml = r.bulletsSummary.length > 0 
        ? `<div class="calc-item" style="grid-column: 1 / -1; border: 2px dashed var(--primary); text-align:right;">
            <span style="display:block; margin-bottom:0.375rem; color:var(--primary); font-weight:800;">الدفعات الخاصة:</span>
            <div class="num" style="font-size:1rem;">${r.bulletsSummary.map(b => `<div style="margin-bottom:0.25rem;">• ${b.label}</div>`).join('')}</div>
           </div>` 
        : '';

    box.innerHTML = `
        <div class="calc-item"><span>الصافي</span><b class="num">${formatNum(Math.round(r.netTotal))} ج</b></div>
        <div class="calc-item"><span>المقدم</span><b class="num">${formatNum(Math.round(r.downPayment))} ج</b></div>
        ${bulletsHtml}
        <div class="calc-highlight"><span>القسط الشهري</span><b class="num">${formatNum(Math.round(r.monthlyEquivalent))} ج</b></div>
        <div class="calc-item" style="background: rgba(0,0,0,0.02);"><span>قسط ربع سنوي</span><b class="num" style="color:var(--text-main);">${formatNum(Math.round(r.quarterlyEquivalent))} ج</b></div>
        <div class="calc-item" style="background: rgba(0,0,0,0.02);"><span>قسط سنوي</span><b class="num" style="color:var(--text-main);">${formatNum(Math.round(r.monthlyEquivalent * 12))} ج</b></div>
    `; 
}

const cTotal = document.getElementById('calcTotal');
if(cTotal) { cTotal.addEventListener('input', function() { formatInput(this); }); }

function closeModal(id){ 
    if (id === 'formOverlay') { if(!confirm('هل أنت متأكد من إغلاق النافذة؟ لن يتم حفظ التعديلات الأخيرة.')) return; }
    const el = document.getElementById(id);
    if(el) el.classList.remove('open'); 
}

document.addEventListener('click', (e)=>{ 
    if(e.target.classList.contains('overlay')) {
        if(e.target.id === 'formOverlay' || e.target.id === 'phasesOverlay' || e.target.id === 'typesOverlay') return; 
        e.target.classList.remove('open');
    }
});

let xlsxLoadPromise = null;
function ensureXLSXLoaded() {
    if (window.XLSX) return Promise.resolve();
    if (xlsxLoadPromise) return xlsxLoadPromise;
    xlsxLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => resolve();
        script.onerror = () => { xlsxLoadPromise = null; reject(new Error('XLSX load failed')); };
        document.head.appendChild(script);
    });
    return xlsxLoadPromise;
}

async function handleExcelUpload(event) {
    const file = event.target.files[0]; if (!file) return; document.getElementById('loadingOverlay').style.display = 'flex'; document.getElementById('loadingMsg').textContent = "جاري تجهيز أداة قراءة الإكسيل...";
    try { await ensureXLSXLoaded(); } catch (e) { alert("تعذر تحميل مكتبة قراءة ملفات الإكسيل."); document.getElementById('loadingOverlay').style.display = 'none'; event.target.value = ''; return; }
    document.getElementById('loadingMsg').textContent = "جاري قراءة الشيت...";
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'}); let compoundsToUpload = {}; const mainLocId = uid(); let excelMainLoc = { id: mainLocId, name: "استيراد سكني", subLocations: [] };
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName]; const rows = XLSX.utils.sheet_to_json(worksheet, { range: 1, defval: "" }); if (rows.length === 0) return; const subLocId = uid(); excelMainLoc.subLocations.push({ id: subLocId, name: sheetName });
                rows.forEach(row => {
                    let projName = row['Project'] || row['project'] || ''; let devName = row['Developer'] || row['developer'] || ''; if (!projName && !devName) return; let compKey = `${projName}_${devName}`;
                    if (!compoundsToUpload[compKey]) { compoundsToUpload[compKey] = { id: uid(), locationId: subLocId, projectType: 'residential', companyName: String(devName).trim(), projectName: String(projName).trim(), ownerName: '', consultant: String(row['Engineering Consult'] || row['Engineering Consultant'] || '').trim(), pricePerMeter: parseFloat(row['Price Per Meter']) || 0, pricePerMeterMin: parseFloat(row['Price Per Meter']) || 0, pricePerMeterMax: parseFloat(row['Price Per Meter']) || 0, maintenancePercent: parseFloat(row['Maintenance Fees %']) || 0, projectSize: parseFloat(row['Project area']) || 0, deliveryDate: String(row['Delivery Date'] || '').trim(), finishingStatus: String(row['Finishing type'] || '').toLowerCase().includes('core') ? 'core_shell' : (String(row['Finishing type'] || '').toLowerCase().includes('full') ? 'full' : 'semi'), compoundLocationDetail: String(row['Location On Map'] || '').trim(), locationLink: String(row['Location On Map'] || '').includes('http') ? String(row['Location On Map'] || '').trim() : '', cashDiscount: 0, unitTypes: [], paymentPlans: [], ministerialDecrees: row['قرار وزاري'] ? [{id: uid(), decreeNumber: '', description: String(row['قرار وزاري']), date: ''}] : [] }; }
                    
                    let area = parseFloat(row['BUA From']) || parseFloat(row['BUA To']) || parseFloat(row['Area']) || 0; 
                    let gardenArea = parseFloat(row['Garden Area']) || parseFloat(row['Garden']) || parseFloat(row['جاردن']) || 0;
                    let price = parseFloat(row['Price From']) || parseFloat(row['Price To']) || 0; 
                    let bedStr = String(row['No of Bedrooms'] || '').toLowerCase(); let unitTypeStr = String(row['Unit Type'] || '').toLowerCase(); let bType = 'استوديو'; let rm = parseFloat(row['No of Bedrooms']) || ''; if(bedStr.includes('1')) bType = '1 غرفة نوم'; else if(bedStr.includes('2')) bType = '2 غرفة نوم'; else if(bedStr.includes('3')) bType = '3 غرف نوم'; else if(bedStr.includes('4')) bType = '4 غرف نوم'; else if(bedStr.includes('duplex') || unitTypeStr.includes('duplex')) bType = 'دوبلكس'; else if(bedStr.includes('penthouse') || unitTypeStr.includes('penthouse')) bType = 'بنتهاوس'; else if(bedStr.includes('villa') || unitTypeStr.includes('villa')) bType = 'فيلا'; else if(bedStr.includes('chalet') || unitTypeStr.includes('chalet')) bType = 'شاليه';
                    if (area > 0 || price > 0 || gardenArea > 0) { compoundsToUpload[compKey].unitTypes.push({ id: uid(), bedroomType: bType, rooms: rm, area: area, gardenArea: gardenArea, price: price, finishing: compoundsToUpload[compKey].finishingStatus }); }
                    let planStr = String(row['Payment Plan'] || '').trim(); if (planStr) { if (!compoundsToUpload[compKey].paymentPlans.some(p => p.notes === planStr)) { compoundsToUpload[compKey].paymentPlans.push({ id: uid(), name: "خطة سداد", notes: planStr, discountPercent: parseFloat(row['Cash Discount']) || 0, downPaymentPercent: 0, years: 0, frequency: '12', customBullets: [] }); } }
                });
            });
            const projectsArray = Object.values(compoundsToUpload);
            if (projectsArray.length === 0) { alert("مفيش داتا متوافقة."); document.getElementById('loadingOverlay').style.display = 'none'; event.target.value = ''; return; }
            if (!confirm(`تم تجهيز ${projectsArray.length} مشروع. هل تريد الرفع؟`)) { document.getElementById('loadingOverlay').style.display = 'none'; event.target.value = ''; return; }
            document.getElementById('loadingMsg').textContent = "جاري الحفظ...";
            if(excelMainLoc.subLocations.length > 0){ mainLocations.push(excelMainLoc); await db.collection('system').doc('locations').set({ mainLocations }); }
            let batch = db.batch(), count = 0, totalUploaded = 0;
            for (let i = 0; i < projectsArray.length; i++) { let proj = projectsArray[i]; proj.timestamp = firebase.firestore.FieldValue.serverTimestamp(); let docRef = db.collection("compounds").doc(proj.id); batch.set(docRef, proj); count++; totalUploaded++; if (count === 400 || i === projectsArray.length - 1) { await batch.commit(); batch = db.batch(); count = 0; } }
            showToast(`✅ تم استيراد ${totalUploaded} مشروع!`); event.target.value = ''; setTimeout(() => { location.reload(); }, 2000);
        } catch (error) { alert("حدث خطأ."); document.getElementById('loadingOverlay').style.display = 'none'; event.target.value = ''; }
    }; reader.readAsArrayBuffer(file);
}
