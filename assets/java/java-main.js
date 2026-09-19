// --- الدوال الأساسية للسيستم ---
window.uid = function(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); };
window.showToast = function(msg){ const t = document.getElementById('toast'); if(!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); };
window.formatNum = function(n){ if(n === null || n === undefined || n === '') return ''; if(isNaN(n)) return n; return Number(n).toLocaleString('en-US'); };
window.escapeHtml = function(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); };
window.highlightText = function(text, term) { const escaped = escapeHtml(text); if (!term) return escaped; const escapedTerm = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); try { return escaped.replace(new RegExp('(' + escapedTerm + ')', 'ig'), '<mark>$1</mark>'); } catch (e) { return escaped; } };
window.deliveryLabel = function(v){ const d = DELIVERY_TIMELINES.find(x=>x.value===v); return d ? d.label : '-'; };
window.formatInput = function(el) { let val = String(el.value).replace(/,/g, ''); if (val.trim() === '') return; if (/^-?\d+(\.\d+)?$/.test(val)) { el.value = Number(val).toLocaleString('en-US'); } };
window.getRawNum = function(val) { if(val === null || val === undefined) return null; let str = String(val).replace(/,/g, '').trim(); if(str === '') return null; if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str); return null; };
window.getSafeVal = function(id) { const el = document.getElementById(id); return el ? el.value : ''; };
window.setSafeVal = function(id, val) { const el = document.getElementById(id); if (el) el.value = val; };

window.normalizeArabic = function(text) {
    if (!text) return '';
    return text.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[يى]/g, 'ي').toLowerCase();
};

window.populateDeliverySelects = function(){ 
    const opts = DELIVERY_TIMELINES.map(d=>`<option value="${d.value}">${d.label}</option>`).join(''); 
    const el = document.getElementById('fldDeliveryDate'); 
    if(el) el.innerHTML = opts; 
};

// --- Theme & Setup ---
window.setNavForApp = function(isAppView) { 
    const links = document.getElementById('siteBarLinks'), loginBtn = document.getElementById('siteBarLoginBtn'); 
    if (links) links.classList.toggle('nav-app-hidden', isAppView); 
    if (loginBtn) loginBtn.classList.toggle('nav-app-hidden', isAppView); 
};

if (sessionStorage.getItem('isSystemOpen') === 'true') { 
    const land = document.getElementById('landingPageContainer');
    const sys = document.getElementById('systemApp');
    if(land) land.style.display = 'none'; 
    if(sys) sys.style.display = 'flex'; 
    window.setNavForApp(true); 
} else { 
    const land = document.getElementById('landingPageContainer');
    const sys = document.getElementById('systemApp');
    if(land) land.style.display = 'block'; 
    if(sys) sys.style.display = 'none'; 
    window.setNavForApp(false); 
}

let currentLang = 'ar';
window.toggleLanguage = function() { 
    currentLang = currentLang === 'ar' ? 'en' : 'ar'; 
    document.documentElement.lang = currentLang; 
    document.body.classList.toggle('lang-en', currentLang === 'en');
    document.querySelectorAll('[data-ar]').forEach(el => { el.innerHTML = el.getAttribute('data-' + currentLang); }); 
};

// 🚨 دوال الدخول والتسجيل شغالين 100% 🚨
window.openSystemLogin = function() { 
    const modal = document.getElementById('paywallModal');
    if(modal) modal.style.display = 'flex'; 
};

window.closeLoginModal = function() { 
    const modal = document.getElementById('paywallModal');
    if(modal) modal.style.display = 'none'; 
};

window.backToLanding = function() { 
    const sys = document.getElementById('systemApp');
    const land = document.getElementById('landingPageContainer');
    if(sys) sys.style.display = 'none'; 
    if(land) land.style.display = 'block'; 
    window.setNavForApp(false); 
};

window.handleAuthAction = function() { 
    if (typeof currentUser !== 'undefined' && currentUser) { 
        auth.signOut(); 
        sessionStorage.removeItem('isSystemOpen'); 
        window.backToLanding(); 
    } else { 
        window.openSystemLogin(); 
    } 
};

window.toggleTheme = function() { 
    document.body.classList.toggle('light-mode'); 
    localStorage.setItem('appTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark'); 
};
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

window.updateAllUnitsPrice = function() {
    if (typeof tempUnits !== 'undefined') {
        tempUnits.forEach(u => window.updateUnitData(u.id, 'recalc', null));
    }
};

window.addEventListener('load', () => {
    window.populateDeliverySelects();
    if(localStorage.getItem('savedEmail')) { 
        const em = document.getElementById('loginEmail');
        const pw = document.getElementById('loginPassword');
        const rem = document.getElementById('rememberMe');
        if(em) em.value = localStorage.getItem('savedEmail'); 
        if(pw) pw.value = localStorage.getItem('savedPassword'); 
        if(rem) rem.checked = true; 
    }
    const pt = document.getElementById('fldProjectType'); 
    if (pt) pt.addEventListener('change', window.onProjectTypeChange);
    const footerYearEl = document.getElementById('footerYear'); 
    if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    window.closeAllDropdowns();
    const dr = document.getElementById('filterDrawer');
    if (dr && dr.classList.contains('open')) window.closeFilterDrawer();
    const pw = document.getElementById('paywallModal');
    if (pw && pw.style.display === 'flex') window.closeLoginModal();
    document.querySelectorAll('.overlay.open').forEach(ov => { if (ov.id === 'formOverlay' || ov.id === 'typesOverlay') return; ov.classList.remove('open'); });
});

window.toggleDropdown = function(id) { 
    const el = document.getElementById(id);
    if(!el) return;
    const wrapper = el.parentElement; 
    const isActive = wrapper.classList.contains('active'); 
    window.closeAllDropdowns(); 
    if (!isActive) wrapper.classList.add('active'); 
};

window.closeAllDropdowns = function() { 
    document.querySelectorAll('.filter-dropdown-wrapper').forEach(el => el.classList.remove('active')); 
};

document.addEventListener('click', function(event) { 
    if (!event.target.closest('.filter-dropdown-wrapper') && !event.target.closest('.glass-search-container') && !event.target.closest('.filter-drawer')) { 
        window.closeAllDropdowns(); 
    } 
});

let selectedBeds = [];
let selectedDelivery = [];
let selectedFinishing = [];

window.selectPill = function(groupId, val) { 
    const el = event.target; el.classList.toggle('active'); 
    if (el.classList.contains('active')) { selectedBeds.push(val); } 
    else { selectedBeds = selectedBeds.filter(v => v !== val); } 
};

window.selectDelivery = function(val, el) {
    el.classList.toggle('active');
    if (el.classList.contains('active')) { selectedDelivery.push(val); }
    else { selectedDelivery = selectedDelivery.filter(v => v !== val); }
};

window.selectFinishing = function(val, el) {
    el.classList.toggle('active');
    if (el.classList.contains('active')) { selectedFinishing.push(val); }
    else { selectedFinishing = selectedFinishing.filter(v => v !== val); }
};

window.openFilterDrawer = function() {
    const ov = document.getElementById('filterDrawerOverlay');
    const dr = document.getElementById('filterDrawer');
    if(ov) ov.classList.add('open');
    if(dr) dr.classList.add('open');
};

window.closeFilterDrawer = function() {
    const ov = document.getElementById('filterDrawerOverlay');
    const dr = document.getElementById('filterDrawer');
    if(ov) ov.classList.remove('open');
    if(dr) dr.classList.remove('open');
};

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

window.getUnitEnName = function(name) { return UNIT_EN_NAMES[name] || name || 'Other'; };

const PROJECT_TYPES = { residential: 'سكني', commercial: 'تجاري / إداري', hotel: 'شقق فندقية' };
const FINISHING_TYPES = { core_shell: 'طوب أحمر', semi: 'نصف تشطيب', full: 'تشطيب كامل', mixed: 'متنوع' };
const FREQ_LABEL = {12:'شهري', 4:'ربع سنوي', 2:'نصف سنوي', 1:'سنوي'};
const DELIVERY_TIMELINES = [ {value:'immediate', label:'فوري'}, {value:'6m', label:'6 أشهر'}, {value:'1y', label:'سنة'}, {value:'1.5y', label:'سنة ونصف'}, {value:'2y', label:'سنتين'}, {value:'2.5y', label:'سنتين ونصف'}, {value:'3y', label:'3 سنوات'}, {value:'4y', label:'4 سنوات'} ];

window.submitLogin = async function() { 
    try {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim(); 
        const btn = document.getElementById('loginSubmitBtn');
        
        if(!email || !password) { alert("من فضلك أدخل الإيميل والباسورد"); return; } 
        
        if (btn) btn.innerHTML = 'جاري الدخول... ⏳';
        
        const rem = document.getElementById('rememberMe');
        if (rem && rem.checked) {
            localStorage.setItem('savedEmail', email);
            localStorage.setItem('savedPassword', password);
        } else {
            localStorage.removeItem('savedEmail');
            localStorage.removeItem('savedPassword');
        }
        
        sessionStorage.setItem('isSystemOpen', 'true'); 
        
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        sessionStorage.removeItem('isSystemOpen'); 
        const btn = document.getElementById('loginSubmitBtn');
        if (btn) btn.innerHTML = 'دخول';
        alert("بيانات الدخول غير صحيحة."); 
        console.error("Login Error:", err);
    }
};

auth.onAuthStateChanged(async (user) => {
    try {
        if (user) {
            if (sessionStorage.getItem('isSystemOpen') !== 'true') { auth.signOut(); return; }
            let userDoc; 
            try { userDoc = await db.collection('users').doc(user.email.toLowerCase()).get(); } catch(e) {}
            
            let role = 'viewer', expiryDate = '2024-01-01'; 
            if (userDoc && userDoc.exists) { 
                role = userDoc.data().role || 'viewer'; 
                expiryDate = userDoc.data().expiryDate || '2024-01-01'; 
            } else if (user.email.toLowerCase() === 'jeanhany04@gmail.com') { 
                role = 'admin'; 
                expiryDate = '2099-12-31'; 
                await db.collection('users').doc(user.email.toLowerCase()).set({ role: 'admin', expiryDate: '2099-12-31' }); 
            } else { 
                auth.signOut(); 
                alert("هذا الحساب غير مسجل."); 
                return; 
            }
            
            if (new Date() > new Date(expiryDate)) { 
                auth.signOut(); 
                alert("لقد انتهت فترة اشتراكك."); 
                return; 
            }
            
            currentUser = user; 
            isAdmin = (role === 'admin'); 
            isEditor = (role === 'admin' || role === 'editor');
            
            let uLabel = document.getElementById('userEmailLabel');
            if(uLabel) uLabel.textContent = user.email.split('@')[0] + (isAdmin ? ' (المدير)' : (isEditor ? ' (محرر)' : ' (مشترك)'));
            
            let suAct = document.getElementById('superAdminActions'); if(suAct) suAct.style.display = isAdmin ? 'flex' : 'none'; 
            let addLoc = document.getElementById('addMainLocWrap'); if(addLoc) addLoc.style.display = isEditor ? 'flex' : 'none'; 
            let adAct = document.getElementById('adminActions'); if(adAct) adAct.style.display = isEditor ? 'flex' : 'none';
            
            let btnLog = document.getElementById('loginSubmitBtn');
            if(btnLog) btnLog.innerHTML = 'دخول';
            
            if (typeof window.syncCloudData === 'function') {
                await window.syncCloudData(); 
            }
            
            const pw = document.getElementById('paywallModal');
            const land = document.getElementById('landingPageContainer');
            const sys = document.getElementById('systemApp');
            if(pw) pw.style.display = 'none'; 
            if(land) land.style.display = 'none'; 
            if(sys) sys.style.display = 'flex'; 
            window.setNavForApp(true);
        } else { 
            currentUser = null; isAdmin = false; isEditor = false; sessionStorage.removeItem('isSystemOpen'); 
            let uLabel = document.getElementById('userEmailLabel');
            if(uLabel) uLabel.textContent = 'يرجى تسجيل الدخول'; 
            window.backToLanding();
        }
    } catch (error) {
        console.error("Critical Auth Error:", error);
        const btnLog = document.getElementById('loginSubmitBtn');
        if(btnLog) btnLog.innerHTML = 'دخول';
    }
});

window.openUsersManager = function() { document.getElementById('newAccEmail').value = ''; document.getElementById('newAccResult').style.display = 'none'; document.getElementById('usersOverlay').classList.add('open'); };
window.createNewSubscriber = async function() { const email = document.getElementById('newAccEmail').value.trim().toLowerCase(), duration = parseInt(document.getElementById('newAccDuration').value), role = document.getElementById('newAccRole').value; if(!email) { window.showToast('يرجى كتابة الإيميل!'); return; } const password = Math.random().toString(36).slice(-6) + Math.floor(Math.random()*100), expDate = new Date(); expDate.setDate(expDate.getDate() + duration); try { await secondaryApp.auth().createUserWithEmailAndPassword(email, password); await db.collection('users').doc(email).set({ role: role, expiryDate: expDate.toISOString().split('T')[0] }); await secondaryApp.auth().signOut(); document.getElementById('resEmail').textContent = email; document.getElementById('resPass').textContent = password; document.getElementById('resDate').textContent = expDate.toISOString().split('T')[0]; document.getElementById('newAccResult').style.display = 'block'; window.showToast('تم تسجيل الحساب بنجاح!'); } catch (error) { alert('حدث خطأ: ' + error.message); } };

window.openTypesManager = function() { document.getElementById('resTypesInput').value = appSettings.resTypes.join(' ، '); document.getElementById('commTypesInput').value = appSettings.commTypes.join(' ، '); document.getElementById('typesOverlay').classList.add('open'); };
window.saveCustomTypes = async function() { if(!isEditor) return; const r = document.getElementById('resTypesInput').value.split(/[,،\n]+/).map(s=>s.trim()).filter(Boolean); const c = document.getElementById('commTypesInput').value.split(/[,،\n]+/).map(s=>s.trim()).filter(Boolean); appSettings.resTypes = r.length ? r : appSettings.resTypes; appSettings.commTypes = c.length ? c : appSettings.commTypes; try { await db.collection('system').doc('settings').set({ resTypes: appSettings.resTypes, commTypes: appSettings.commTypes }, { merge: true }); window.closeModal('typesOverlay'); window.showToast('تم الحفظ 💾'); if(document.getElementById('formOverlay').classList.contains('open')) window.renderUnitRows(); } catch(e) { alert('خطأ في الحفظ!'); } };

window.saveCompoundToCloud = async function() {
    if(!isEditor) return;
    
    const cName = window.getSafeVal('fldCompany').trim();
    const pName = window.getSafeVal('fldProject').trim();
    const locId = window.getSafeVal('fldLocation');
    
    if(!cName || !pName || !locId) {
        return alert('يرجى إدخال اسم الشركة واسم المشروع والفرع كحد أدنى.');
    }

    let pCoreMin = window.getRawNum(window.getSafeVal('fldPriceCoreMin')), pCoreMax = window.getRawNum(window.getSafeVal('fldPriceCoreMax'));
    let pCoreAvg = (pCoreMin > 0 && pCoreMax > 0) ? (pCoreMin + pCoreMax) / 2 : (pCoreMin || pCoreMax || 0);
    
    let pSemiMin = window.getRawNum(window.getSafeVal('fldPriceSemiMin')), pSemiMax = window.getRawNum(window.getSafeVal('fldPriceSemiMax'));
    let pSemiAvg = (pSemiMin > 0 && pSemiMax > 0) ? (pSemiMin + pSemiMax) / 2 : (pSemiMin || pSemiMax || 0);

    let pFullMin = window.getRawNum(window.getSafeVal('fldPriceFullMin')), pFullMax = window.getRawNum(window.getSafeVal('fldPriceFullMax'));
    let pFullAvg = (pFullMin > 0 && pFullMax > 0) ? (pFullMin + pFullMax) / 2 : (pFullMin || pFullMax || 0);

    const compoundData = {
        locationId: locId,
        projectType: window.getSafeVal('fldProjectType'),
        companyName: cName,
        projectName: pName,
        phaseName: window.getSafeVal('fldPhaseName').trim(),
        ownerName: window.getSafeVal('fldOwner').trim(),
        consultant: window.getSafeVal('fldConsultant').trim(),
        
        whatsapp: window.getSafeVal('fldWhatsapp').trim(),
        projectPDF: window.getSafeVal('fldProjectPDF').trim(),
        previousWorks: window.getSafeVal('fldPreviousWorks').trim(),
        
        projectSize: window.getRawNum(window.getSafeVal('fldProjectSize')),
        floors: window.getSafeVal('fldFloors').trim(),
        compoundLocationDetail: window.getSafeVal('fldLocationDetail').trim(),
        locationLink: window.getSafeVal('fldLocationLink').trim(),
        
        pricePerMeterMin: window.getRawNum(window.getSafeVal('fldPriceMeterMin')),
        pricePerMeterMax: window.getRawNum(window.getSafeVal('fldPriceMeterMax')),
        pricePerMeter: window.getRawNum(window.getSafeVal('fldPriceMeter')),
        
        isAdvancedPricing: (document.getElementById('advPricingWrap') && document.getElementById('advPricingWrap').style.display !== 'none'),
        priceCoreMin: pCoreMin, priceCoreMax: pCoreMax, priceCore: pCoreAvg,
        priceSemiMin: pSemiMin, priceSemiMax: pSemiMax, priceSemi: pSemiAvg,
        priceFullMin: pFullMin, priceFullMax: pFullMax, priceFull: pFullAvg,

        commercialPrices: {
            adminMin: window.getRawNum(window.getSafeVal('fldAdminMin')),
            adminMax: window.getRawNum(window.getSafeVal('fldAdminMax')),
            adminFinish: window.getSafeVal('fldAdminFinish') || 'core_shell',
            commMin: window.getRawNum(window.getSafeVal('fldCommMin')),
            commMax: window.getRawNum(window.getSafeVal('fldCommMax')),
            commFinish: window.getSafeVal('fldCommFinish') || 'core_shell',
            clinicMin: window.getRawNum(window.getSafeVal('fldClinicMin')),
            clinicMax: window.getRawNum(window.getSafeVal('fldClinicMax')),
            clinicFinish: window.getSafeVal('fldClinicFinish') || 'core_shell',
            recMin: window.getRawNum(window.getSafeVal('fldRecMin')),
            recMax: window.getRawNum(window.getSafeVal('fldRecMax')),
            recFinish: window.getSafeVal('fldRecFinish') || 'core_shell'
        },
        
        deliveryDate: window.getSafeVal('fldDeliveryDate'),
        finishingStatus: window.getSafeVal('fldFinishingStatus'),
        
        maintenanceValue: window.getRawNum(window.getSafeVal('fldMaintenanceValue')),
        maintenanceType: window.getSafeVal('fldMaintenanceType') || 'percent',
        
        parkingType: window.getSafeVal('fldParkingType') || 'extra',
        parkingFee: window.getRawNum(window.getSafeVal('fldParkingFee')),
        
        cashDiscount: window.getRawNum(window.getSafeVal('fldCashDiscount')),
        
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
            window.showToast('تم تحديث المشروع بنجاح!');
        } else {
            await db.collection('compounds').add(compoundData);
            window.showToast('تم إضافة المشروع بنجاح!');
        }
        window.closeModal('formOverlay');
    } catch(e) {
        console.error("Save Error: ", e);
        alert("حدث خطأ أثناء الحفظ.");
    } finally {
        const loadOv = document.getElementById('loadingOverlay');
        if(loadOv) loadOv.style.display = 'none';
    }
};

window.deleteCurrentCompoundFromCloud = async function() {
    if(!isEditor || !viewingCompoundId) return;
    if(!confirm('هل أنت متأكد من حذف هذا المشروع نهائياً؟')) return;
    
    try {
        const loadOv = document.getElementById('loadingOverlay');
        if(loadOv) loadOv.style.display = 'flex';
        
        await db.collection('compounds').doc(viewingCompoundId).delete();
        window.closeModal('detailOverlay');
        window.showToast('تم حذف المشروع بنجاح.');
    } catch(e) {
        alert("حدث خطأ أثناء الحذف.");
    } finally {
        const loadOv = document.getElementById('loadingOverlay');
        if(loadOv) loadOv.style.display = 'none';
    }
};

window.isCompoundComplete = function(c) {
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
};

window.renderAdminStats = function() {
    try {
        const board = document.getElementById('adminStatsBoard'); if (!board) return;
        if (!isEditor && !isAdmin) { board.style.display = 'none'; return; }
        board.style.display = 'flex';
        let completed = compounds.filter(c => window.isCompoundComplete(c)).length;
        
        let stTotal = document.getElementById('statTotal');
        let stComp = document.getElementById('statCompleted');
        let stInc = document.getElementById('statIncomplete');
        if(stTotal) stTotal.textContent = compounds.length;
        if(stComp) stComp.textContent = completed;
        if(stInc) stInc.textContent = compounds.length - completed;
    } catch(e) { console.error("Stats Error:", e); }
};

window.renderGrid = function(){
  try {
      const grid = document.getElementById('compoundGrid');
      if(!grid) return;
      
      if (!Array.isArray(compounds)) compounds = [];

      let list = compounds.filter(c => {
          try {
              if(!c || typeof c !== 'object') return false;

              if (completionFilter === 'completed' && !window.isCompoundComplete(c)) return false;
              if (completionFilter === 'incomplete' && window.isCompoundComplete(c)) return false;
          
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
                  let searchTxt = window.normalizeArabic(filters.searchText);
                  let searchableStr = [String(c.projectName||''), String(c.companyName||''), String(c.ownerName||''), String(c.consultant||''), window.findSubLocationName(c.locationId)].filter(Boolean).join(' ');
                  let normalizedSearchable = window.normalizeArabic(searchableStr);
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
                  let p = window.getRawNum(u.price);
                  let effArea = (parseFloat(u.area) || 0) + (parseFloat(u.gardenArea) || 0)/3 + (parseFloat(u.roofArea) || 0)/3;
                  
                  let meterPrice = 0;
                  if (c.projectType === 'commercial') {
                       let cp = c.commercialPrices || {};
                       let aMin = window.getRawNum(cp.adminMin) || 0, aMax = window.getRawNum(cp.adminMax) || 0;
                       let cMin = window.getRawNum(cp.commMin) || 0, cMax = window.getRawNum(cp.commMax) || 0;
                       let clMin = window.getRawNum(cp.clinicMin) || 0, clMax = window.getRawNum(cp.clinicMax) || 0;
                       let rMin = window.getRawNum(cp.recMin) || 0, rMax = window.getRawNum(cp.recMax) || 0;
                       
                       let bType = window.getUnitEnName(u.bedroomType);
                       let min = 0, max = 0;
                       if (bType === 'Administrative') { min = aMin; max = aMax; }
                       else if (bType === 'Commercial') { min = cMin; max = cMax; }
                       else if (bType === 'Clinic') { min = clMin; max = clMax; }
                       else if (bType === 'Recreational') { min = rMin; max = rMax; }
                       else { min = cMin || aMin || clMin || rMin || 0; max = cMax || aMax || clMax || rMax || 0; }
                       meterPrice = (min > 0 && max > 0) ? (min + max)/2 : (min || max || 0); 
                  } else {
                       let pSingle = window.getRawNum(c.pricePerMeter) || 0;
                       let pMin = window.getRawNum(c.pricePerMeterMin) || 0;
                       let pMax = window.getRawNum(c.pricePerMeterMax) || 0;
                       let pAvg = (pMin > 0 && pMax > 0) ? (pMin + pMax) / 2 : (pMin || pMax || 0);
          
                       if (c.isAdvancedPricing) {
                           let pCoreMin = window.getRawNum(c.priceCoreMin) || 0, pCoreMax = window.getRawNum(c.priceCoreMax) || 0;
                           let pCoreAvg = (pCoreMin > 0 && pCoreMax > 0) ? (pCoreMin + pCoreMax)/2 : (pCoreMin || pCoreMax || window.getRawNum(c.priceCore) || 0);
                           let pSemiMin = window.getRawNum(c.priceSemiMin) || 0, pSemiMax = window.getRawNum(c.priceSemiMax) || 0;
                           let pSemiAvg = (pSemiMin > 0 && pSemiMax > 0) ? (pSemiMin + pSemiMax)/2 : (pSemiMin || pSemiMax || window.getRawNum(c.priceSemi) || 0);
                           let pFullMin = window.getRawNum(c.priceFullMin) || 0, pFullMax = window.getRawNum(c.priceFullMax) || 0;
                           let pFullAvg = (pFullMin > 0 && pFullMax > 0) ? (pFullMin + pFullMax)/2 : (pFullMin || pFullMax || window.getRawNum(c.priceFull) || 0);
          
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
          
                          const r = window.calcInstallmentWithDiscount(planBasePrice, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
                          
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
          else pageTitleText = window.findSubLocationName(selectedId);
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
          let key = `${String(c.projectName\vert{}\vert{}'').trim().toLowerCase()}\vert{}\vert{}${String(c.companyName||'').trim().toLowerCase()}`;
          if(!groups[key]) groups[key] = [];
          groups[key].push(c);
      });
       
      let htmlString = "";
      Object.values(groups).forEach(group => {
          try {
              if(group.length === 1) { htmlString += window.generateDossierHTML(group[0]); } 
              else { htmlString += window.generateMasterDossierHTML(group); }
          } catch(err) { console.error("Dossier Error", err); }
      });
      grid.innerHTML = htmlString;
  } catch (error) { console.log("Grid Render Error:", error); }
};

window.openCompoundForm = function(existing){
  try {
      editingCompoundId = existing ? existing.id : null; 
      document.getElementById('formTitle').textContent = existing ? 'تعديل المشروع' : 'إضافة مشروع جديد';
      
      let defaultLoc = '';
      if (activeLocationIds.length === 1) { let isSub = mainLocations.some(m => (m.subLocations || []).some(s => s.id === activeLocationIds[0])); if (isSub) defaultLoc = activeLocationIds[0]; }
      if(existing) window.setSafeVal('fldLocation', existing.locationId || ''); else window.setSafeVal('fldLocation', defaultLoc);
      
      ['fldCompany','fldProject','fldPhaseName','fldWhatsapp','fldProjectPDF','fldPreviousWorks','fldFloors','fldOwner','fldConsultant',
       'fldPriceMeter', 'fldPriceMeterMin', 'fldPriceMeterMax', 'fldPriceMeterAvg',
       'fldPriceCore', 'fldPriceSemi', 'fldPriceFull',
       'fldPriceCoreMin', 'fldPriceCoreMax', 'fldPriceCoreAvg',
       'fldPriceSemiMin', 'fldPriceSemiMax', 'fldPriceSemiAvg',
       'fldPriceFullMin', 'fldPriceFullMax', 'fldPriceFullAvg',
       'fldAdminMin','fldAdminMax','fldCommMin','fldCommMax','fldClinicMin','fldClinicMax','fldRecMin','fldRecMax',
       'fldParkingFee','fldProjectSize','fldDeliveryDate','fldLocationDetail','fldLocationLink','fldCashDiscount'].forEach(id => { 
           window.setSafeVal(id, ''); 
       }); 
       
      ['fldAdminFinish', 'fldCommFinish', 'fldClinicFinish', 'fldRecFinish'].forEach(id => { window.setSafeVal(id, 'core_shell'); });
    
      if (existing) {
          window.setSafeVal('fldProjectType', existing.projectType || 'residential'); 
          window.setSafeVal('fldCompany', existing.companyName || ''); 
          window.setSafeVal('fldProject', existing.projectName || ''); 
          window.setSafeVal('fldPhaseName', existing.phaseName || ''); 
          
          window.setSafeVal('fldWhatsapp', existing.whatsapp || ''); 
          window.setSafeVal('fldProjectPDF', existing.projectPDF || ''); 
          window.setSafeVal('fldPreviousWorks', existing.previousWorks || ''); 

          window.setSafeVal('fldFloors', existing.floors || ''); 
          window.setSafeVal('fldOwner', existing.ownerName || ''); 
          window.setSafeVal('fldConsultant', existing.consultant || ''); 
          
          window.setSafeVal('fldPriceMeterMin', existing.pricePerMeterMin ? window.formatNum(existing.pricePerMeterMin) : '');
          window.setSafeVal('fldPriceMeterMax', existing.pricePerMeterMax ? window.formatNum(existing.pricePerMeterMax) : '');
          if(existing.pricePerMeter) window.setSafeVal('fldPriceMeter', window.formatNum(existing.pricePerMeter));
          
          let hasAdv = existing.isAdvancedPricing || existing.priceCore > 0 || existing.priceSemi > 0 || existing.priceFull > 0 || existing.priceCoreMin > 0 || existing.priceSemiMin > 0 || existing.priceFullMin > 0;
          
          if(hasAdv) {
              window.setSafeVal('fldPriceCoreMin', existing.priceCoreMin ? window.formatNum(existing.priceCoreMin) : '');
              window.setSafeVal('fldPriceCoreMax', existing.priceCoreMax ? window.formatNum(existing.priceCoreMax) : '');
              window.setSafeVal('fldPriceCoreAvg', existing.priceCore ? window.formatNum(existing.priceCore) : '');
              
              window.setSafeVal('fldPriceSemiMin', existing.priceSemiMin ? window.formatNum(existing.priceSemiMin) : '');
              window.setSafeVal('fldPriceSemiMax', existing.priceSemiMax ? window.formatNum(existing.priceSemiMax) : '');
              window.setSafeVal('fldPriceSemiAvg', existing.priceSemi ? window.formatNum(existing.priceSemi) : '');
              
              window.setSafeVal('fldPriceFullMin', existing.priceFullMin ? window.formatNum(existing.priceFullMin) : '');
              window.setSafeVal('fldPriceFullMax', existing.priceFullMax ? window.formatNum(existing.priceFullMax) : '');
              window.setSafeVal('fldPriceFullAvg', existing.priceFull ? window.formatNum(existing.priceFull) : '');
              
              window.toggleAdvPricing(true);
          } else {
              window.toggleAdvPricing(false);
          }
    
          let cp = existing.commercialPrices || {}; 
          window.setSafeVal('fldAdminMin', cp.adminMin ? window.formatNum(cp.adminMin) : ''); 
          window.setSafeVal('fldAdminMax', cp.adminMax ? window.formatNum(cp.adminMax) : ''); 
          window.setSafeVal('fldAdminFinish', cp.adminFinish || 'core_shell'); 
          window.setSafeVal('fldCommMin', cp.commMin ? window.formatNum(cp.commMin) : ''); 
          window.setSafeVal('fldCommMax', cp.commMax ? window.formatNum(cp.commMax) : ''); 
          window.setSafeVal('fldCommFinish', cp.commFinish || 'core_shell'); 
          window.setSafeVal('fldClinicMin', cp.clinicMin ? window.formatNum(cp.clinicMin) : ''); 
          window.setSafeVal('fldClinicMax', cp.clinicMax ? window.formatNum(cp.clinicMax) : ''); 
          window.setSafeVal('fldClinicFinish', cp.clinicFinish || 'core_shell'); 
          window.setSafeVal('fldRecMin', cp.recMin ? window.formatNum(cp.recMin) : ''); 
          window.setSafeVal('fldRecMax', cp.recMax ? window.formatNum(cp.recMax) : ''); 
          window.setSafeVal('fldRecFinish', cp.recFinish || 'core_shell');
          
          window.setSafeVal('fldFinishingStatus', (existing.finishingStatus && existing.finishingStatus !== 'mixed') ? existing.finishingStatus : 'core_shell');
    
          window.setSafeVal('fldMaintenanceValue', existing.maintenanceValue || existing.maintenancePercent || ''); 
          window.setSafeVal('fldMaintenanceType', existing.maintenanceType || 'percent');
          
          window.setSafeVal('fldParkingType', existing.parkingType || 'extra');
          window.setSafeVal('fldParkingFee', existing.parkingFee ? window.formatNum(existing.parkingFee) : ''); 
          
          const pkFeeEl = document.getElementById('fldParkingFee');
          if(pkFeeEl) pkFeeEl.style.display = (existing.parkingType === 'included') ? 'none' : 'block';
    
          window.setSafeVal('fldProjectSize', existing.projectSize || ''); 
          window.setSafeVal('fldDeliveryDate', existing.deliveryDate || ''); 
          window.setSafeVal('fldLocationDetail', existing.compoundLocationDetail || ''); 
          window.setSafeVal('fldLocationLink', existing.locationLink || ''); 
          window.setSafeVal('fldCashDiscount', existing.cashDiscount || ''); 
          
      } else {
          window.setSafeVal('fldProjectType', 'residential'); 
          window.setSafeVal('fldMaintenanceValue', ''); 
          window.setSafeVal('fldMaintenanceType', 'percent');
          window.setSafeVal('fldParkingType', 'extra'); 
          
          const pkFeeEl = document.getElementById('fldParkingFee');
          if(pkFeeEl) pkFeeEl.style.display = 'block';
          window.toggleAdvPricing(false);
      }
      
      window.onProjectTypeChange(); 
      
      tempUnits = existing ? JSON.parse(JSON.stringify(existing.unitTypes||[])) : []; 
      if (existing) { 
          tempUnits.forEach(u => { u.bedroomType = window.getUnitEnName(u.bedroomType); }); 
      } 
      tempPlans = existing ? JSON.parse(JSON.stringify(existing.paymentPlans||[])) : []; 
      tempDecrees = existing ? JSON.parse(JSON.stringify(existing.ministerialDecrees||[])) : []; 
      
      window.renderUnitRows(); 
      window.renderPlanRows(); 
      window.renderDecreeRows(); 
      const ov = document.getElementById('formOverlay');
      if (ov) ov.classList.add('open');
  } catch (error) {
      console.error("Form Open Error:", error);
  }
};

window.processMagicPaste = function() {
    const text = document.getElementById('magicPasteInput').value;
    if (!text.trim()) return window.showToast('برجاء لصق نص المشروع أولاً!');
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
        let developer = window.extractValueAfterKeyword(cleanLine, ['Developer', 'المطور', 'شركة', 'Development']); if (developer && !document.getElementById('fldCompany').value) { document.getElementById('fldCompany').value = developer; fieldsFilled++; }
        let owner = window.extractValueAfterKeyword(cleanLine, ['Owner', 'المالك']); if (owner && !document.getElementById('fldOwner').value) { document.getElementById('fldOwner').value = owner; fieldsFilled++; }
        let consultant = window.extractValueAfterKeyword(cleanLine, ['Consultant', 'استشاري', 'الاستشاري']); if (consultant && !document.getElementById('fldConsultant').value) { document.getElementById('fldConsultant').value = consultant; fieldsFilled++; }
        let delivery = window.extractValueAfterKeyword(cleanLine, ['Delivery Date', 'Delivery', 'التسليم', 'استلام']);
        if (delivery) { let dSelect = document.getElementById('fldDeliveryDate'); if (lowerLine.includes('immediate') || lowerLine.includes('فوري')) dSelect.value = 'immediate'; else if (lowerLine.includes('1') || lowerLine.includes('one')) dSelect.value = '1y'; else if (lowerLine.includes('2') || lowerLine.includes('two')) dSelect.value = '2y'; else if (lowerLine.includes('3') || lowerLine.includes('three')) dSelect.value = '3y'; else if (lowerLine.includes('4') || lowerLine.includes('four')) dSelect.value = '4y'; }
        
        let finishingMatch = window.extractValueAfterKeyword(cleanLine, ['Finishing', 'التشطيب', 'تشطيب']);
        if (finishingMatch) { 
            if (lowerLine.includes('core') || lowerLine.includes('shell') || lowerLine.includes('بدون')) defaultFinishing = 'core_shell'; 
            else if (lowerLine.includes('semi') || lowerLine.includes('نصف')) defaultFinishing = 'semi'; 
            else if (lowerLine.includes('fully') || lowerLine.includes('كامل')) defaultFinishing = 'full'; 
        }
        
        let maintenance = window.extractValueAfterKeyword(cleanLine, ['Maintenance', 'صيانة', 'الصيانة']);
        if (maintenance) { let mVal = maintenance.replace(/[^0-9.]/g, ''); if (mVal && !document.getElementById('fldMaintenanceValue').value) { document.getElementById('fldMaintenanceValue').value = mVal; if (maintenance.includes('%')) { document.getElementById('fldMaintenanceType').value = 'percent'; } else { document.getElementById('fldMaintenanceType').value = 'per_meter'; } fieldsFilled++; } }
        if (lowerLine.includes('cash discount') || lowerLine.includes('خصم كاش')) { let cdMatch = cleanLine.match(/(\d+(?:\.\d+)?)%/); if (cdMatch && !document.getElementById('fldCashDiscount').value) { document.getElementById('fldCashDiscount').value = cdMatch[1]; fieldsFilled++; } }
        if (lowerLine.includes('parking') || lowerLine.includes('جراج') || lowerLine.includes('بارك')) {
            let pSelect = document.getElementById('fldParkingType');
            if(lowerLine.includes('free') || lowerLine.includes('شامل') || lowerLine.includes('مجان')) { pSelect.value = 'included'; document.getElementById('fldParkingFee').style.display = 'none'; } 
            else if (lowerLine.includes('optional') || lowerLine.includes('اختيار')) { pSelect.value = 'optional'; document.getElementById('fldParkingFee').style.display = 'block'; } 
            else { pSelect.value = 'extra'; document.getElementById('fldParkingFee').style.display = 'block'; let pMatch = cleanLine.match(/([\d,]+(?:\.\d+)?)\s*(k|egp|ج|جنيه|الف)?/i); if (pMatch && !document.getElementById('fldParkingFee').value) { let pVal = parseFloat(pMatch[1].replace(/,/g, '')); let mult = pMatch[2] ? pMatch[2].toLowerCase() : ''; if (mult === 'k' || mult === 'الف') pVal *= 1000; document.getElementById('fldParkingFee').value = window.formatNum(pVal); fieldsFilled++; } }
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
            if (area > 10) { tempUnits.push({ id: window.uid(), bedroomType: currentType, rooms: '', area: area, gardenArea: garden, roofArea: roof, price: '', finishing: defaultFinishing }); unitsAdded++; }
        }
        if (!lowerLine.includes('delivery') && !lowerLine.includes('تسليم') && !lowerLine.includes('استلام')) {
            const planMatch = cleanLine.match(/(?:(\d+)%\s*(?:discount|خصم).*?)?(?:(\d+)%\s*(?:DP|Down Payment|d\.p|مقدم).*?)?(?:discount\s*(\d+)%)?.*?(\d+)\s*(?:years?|سن)/i);
            if (planMatch && !cleanLine.includes('?')) {
                const discount = planMatch[1] ? parseFloat(planMatch[1]) : (planMatch[3] ? parseFloat(planMatch[3]) : ''); let dpText = cleanLine.match(/(\d+)%\s*(?:dp|d\.p|down|مقدم)/i); const dp = dpText ? parseFloat(dpText[1]) : 0; const years = parseFloat(planMatch[4]);
                if (!tempPlans.some(p => p.notes === cleanLine.replace(/^[▫️\-\s]+/,''))) { tempPlans.push({ id: window.uid(), name: `خطة ${years} سنوات`, discountPercent: discount, downPaymentPercent: dp, years: years, frequency: '12', pricePerMeter: '', notes: cleanLine.replace(/^[▫️\-\s]+/,''), customBullets: [] }); plansAdded++; }
            }
        }
    });
    window.renderUnitRows(); window.renderPlanRows(); document.getElementById('magicPasteInput').value = ''; window.showToast(`تم الاستخراج بنجاح 🚀`);
};

window.extractValueAfterKeyword = function(line, keywords) {
    for (let k of keywords) {
        let idx = line.toLowerCase().indexOf(k.toLowerCase());
        if (idx !== -1) {
            let val = line.substring(idx + k.length).replace(/[:\-=>]/g, '').trim();
            if (val) return val.split(/\s{2,}/)[0]; 
        }
    }
    return null;
};

window.openDetail = function(id){
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
        const availTypes = Array.from(new Set(rawTypes.map(u => window.getUnitEnName(u.bedroomType))));
        availTypes.sort((a,b) => (UNIT_ORDER[a]||99) - (UNIT_ORDER[b]||99));
        
        activeDetailCategory = availTypes.length ? availTypes[0] : null; 
        if (activeDetailCategory) {
            let filtered = rawTypes.filter(u => window.getUnitEnName(u.bedroomType) === activeDetailCategory);
            filtered.sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0));
            activeDetailUnitId = filtered.length > 0 ? filtered[0].id : null;
        } else {
            activeDetailUnitId = null;
        }
        
        window.renderDetailModalContent(); 
    } catch(e) {
        console.error("Detail Error:", e);
        document.getElementById('detailBody').innerHTML = `<div style="text-align:center; color:var(--danger); padding:30px;"><b>حدث خطأ في تحميل بيانات هذا المشروع.</b><br><br>${e.message}</div>`;
    }
};

window.editCurrentCompound = function(){ 
    try {
        const c = compounds.find(x=>x.id===viewingCompoundId); 
        if(!c) return; 
        window.closeModal('detailOverlay'); 
        window.openCompoundForm(c); 
    } catch(e) {
        console.error("Edit Button Error:", e);
        alert("زرار التعديل متوقف لخطأ في بيانات المشروع.");
    }
};

window.editCompoundById = function(id) {
    try {
        const c = compounds.find(x => x.id === id); 
        if(!c) return; 
        window.closeModal('detailOverlay'); 
        window.openCompoundForm(c); 
    } catch(e) {
        console.error("Edit Button Error:", e);
        alert("زرار التعديل متوقف لخطأ في بيانات المشروع.");
    }
};

window.setDetailCategory = function(catKey) { 
    try {
        activeDetailCategory = catKey; 
        const c = compounds.find(x => x.id === viewingCompoundId); 
        if (c && c.unitTypes) { 
            const rawTypes = Array.isArray(c.unitTypes) ? c.unitTypes : [];
            const matched = rawTypes.filter(u => window.getUnitEnName(u.bedroomType) === catKey); 
            matched.sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0));
            if (matched.length > 0) activeDetailUnitId = matched[0].id; 
        } 
        window.renderDetailModalContent(); 
    } catch(e) { console.error(e); }
};

window.setDetailUnit = function(unitId) { activeDetailUnitId = unitId; window.renderDetailModalContent(); };

window.renderDetailModalContent = function() {
  try {
      const c = compounds.find(x => x.id === viewingCompoundId); if (!c) return;
      
      document.getElementById('detailTitle').textContent = c.projectName || '';
      
      let finishText = FINISHING_TYPES[c.finishingStatus] || '-'; let pText = '';
      let parkingText = '';
      if (c.parkingType === 'included') parkingText = 'شامل السعر';
      else if (c.parkingType === 'optional') parkingText = c.parkingFee ? 'اختياري (' + window.formatNum(c.parkingFee) + ' ج)' : 'اختياري';
      else parkingText = c.parkingFee ? window.formatNum(c.parkingFee) + ' ج' : 'رسوم إضافية';
    
      let heroPriceText = '';

      if (c.projectType === 'commercial') {
          finishText = 'متنوع (بالأسعار)';
          let cp = c.commercialPrices || {}; let parts = []; const fName = { core_shell: 'طوب', semi: 'نصف', full: 'كامل' };
          
          let mins = [cp.adminMin, cp.commMin, cp.clinicMin, cp.recMin].map(x => window.getRawNum(x)).filter(x => x > 0);
          let absoluteMin = mins.length > 0 ? Math.min(...mins) : 0; 
          heroPriceText = absoluteMin > 0 ? `${window.formatNum(absoluteMin)} ج.م` : '-';

          if (cp.adminMin || cp.adminMax) parts.push(`<b>إداري:</b> <span class="num">${window.formatNum(cp.adminMin)} - ${window.formatNum(cp.adminMax)}</span> <span style="font-size:0.625rem;">(${fName[cp.adminFinish||'core_shell']})</span>`);
          if (cp.commMin || cp.commMax) parts.push(`<b>تجاري:</b> <span class="num">${window.formatNum(cp.commMin)} - ${window.formatNum(cp.commMax)}</span> <span style="font-size:0.625rem;">(${fName[cp.commFinish||'core_shell']})</span>`);
          if (cp.clinicMin || cp.clinicMax) parts.push(`<b>طبي:</b> <span class="num">${window.formatNum(cp.clinicMin)} - ${window.formatNum(cp.clinicMax)}</span> <span style="font-size:0.625rem;">(${fName[cp.clinicFinish||'core_shell']})</span>`);
          if (cp.recMin || cp.recMax) parts.push(`<b>ترفيهي:</b> <span class="num">${window.formatNum(cp.recMin)} - ${window.formatNum(cp.recMax)}</span> <span style="font-size:0.625rem;">(${fName[cp.recFinish||'core_shell']})</span>`);
          pText = parts.length > 0 ? `<div style="display:flex; flex-direction:column; gap:0.25rem; font-size:0.875rem;">${parts.join('')}</div>` : `<span class="num">${window.formatNum(c.pricePerMeterMin||0)}</span> ج`;
      } else { 
          if (c.pricePerMeterMin > 0) heroPriceText = `${window.formatNum(c.pricePerMeterMin)} ج.م`;
          else if (c.pricePerMeter > 0) heroPriceText = `${window.formatNum(c.pricePerMeter)} ج.م`;
          else heroPriceText = '-';

          let pParts = [];
          if(c.isAdvancedPricing) {
              if (c.pricePerMeter > 0) pParts.push(`<b>متوسط السعر للمتر:</b> <span class="num" style="color:var(--success);">${window.formatNum(c.pricePerMeter)}</span> ج/م²`);
              if(c.pricePerMeterMin > 0 || c.pricePerMeterMax > 0) {
                  let rng = (c.pricePerMeterMin > 0 && c.pricePerMeterMax > 0 && c.pricePerMeterMin !== c.pricePerMeterMax) ? window.formatNum(c.pricePerMeterMin) + ' - ' + window.formatNum(c.pricePerMeterMax) : window.formatNum(c.pricePerMeterMin || c.pricePerMeterMax);
                  pParts.push(`<b>نطاق السعر للمتر:</b> <span class="num">${rng}</span> ج/م²`);
              }
              let fPriceCore = (c.priceCoreMin > 0 && c.priceCoreMax > 0 && c.priceCoreMin !== c.priceCoreMax) ? `${window.formatNum(c.priceCoreMin)} - ${window.formatNum(c.priceCoreMax)}` : window.formatNum(c.priceCoreMin || c.priceCoreMax || c.priceCore || 0);
              if (c.priceCoreMin > 0 || c.priceCoreMax > 0 || c.priceCore > 0) pParts.push(`<b>طوب أحمر:</b> <span class="num">${fPriceCore}</span> ج`);
              let fPriceSemi = (c.priceSemiMin > 0 && c.priceSemiMax > 0 && c.priceSemiMin !== c.priceSemiMax) ? `${window.formatNum(c.priceSemiMin)} - ${window.formatNum(c.priceSemiMax)}` : window.formatNum(c.priceSemiMin || c.priceSemiMax || c.priceSemi || 0);
              if (c.priceSemiMin > 0 || c.priceSemiMax > 0 || c.priceSemi > 0) pParts.push(`<b>نصف تشطيب:</b> <span class="num">${fPriceSemi}</span> ج`);
              let fPriceFull = (c.priceFullMin > 0 && c.priceFullMax > 0 && c.priceFullMin !== c.priceFullMax) ? `${window.formatNum(c.priceFullMin)} - ${window.formatNum(c.priceFullMax)}` : window.formatNum(c.priceFullMin || c.priceFullMax || c.priceFull || 0);
              if (c.priceFullMin > 0 || c.priceFullMax > 0 || c.priceFull > 0) pParts.push(`<b>تشطيب كامل:</b> <span class="num">${fPriceFull}</span> ج`);
          } else {
              if (c.pricePerMeter > 0) pParts.push(`<b>متوسط السعر للمتر:</b> <span class="num" style="color:var(--success);">${window.formatNum(c.pricePerMeter)}</span> ج/م²`);
              if (c.pricePerMeterMin > 0 || c.pricePerMeterMax > 0) {
                  let rng = (c.pricePerMeterMin > 0 && c.pricePerMeterMax > 0 && c.pricePerMeterMin !== c.pricePerMeterMax) ? window.formatNum(c.pricePerMeterMin) + ' - ' + window.formatNum(c.pricePerMeterMax) : window.formatNum(c.pricePerMeterMin || c.pricePerMeterMax);
                  pParts.push(`<b>نطاق السعر للمتر:</b> <span class="num">${rng}</span> ج/م²`);
              }
          }
          pText = pParts.length > 0 ? `<div style="display:flex; flex-direction:column; gap:0.25rem; font-size:0.875rem;">${pParts.join('')}</div>` : `-`;
      }
      
      const locLinkHtml = c.locationLink ? `<br><a href="${window.escapeHtml(c.locationLink)}" target="_blank" style="color:var(--primary); font-size:0.75rem; font-weight:bold; background:var(--item-bg); padding:0.375rem 0.75rem; border-radius:0.25rem; border:1px solid var(--primary); display:inline-block; margin-top:0.3125rem;">📍 الخريطة</a>` : '';
      let maintText = c.maintenanceValue ? (c.maintenanceType === 'per_meter' ? `${c.maintenanceValue} ج/م²` : `${c.maintenanceValue}%`) : '-';
    
      let detailsGridHtml = `<div class="detail-grid"><div class="detail-item"><b>النوع</b><span>${PROJECT_TYPES[c.projectType || 'residential']}</span></div><div class="detail-item"><b>المطور</b><span>${window.escapeHtml(c.companyName || '-')}</span></div><div class="detail-item"><b>المالك</b><span>${window.escapeHtml(c.ownerName || '-')}</span></div><div class="detail-item"><b>الاستشاري</b><span>${window.escapeHtml(c.consultant || '-')}</span></div><div class="detail-item"><b>الفرع</b><span>${window.escapeHtml(window.findSubLocationName(c.locationId))}</span></div><div class="detail-item"><b>التسليم والتشطيب</b><span>${window.deliveryLabel(c.deliveryDate)} | ${finishText}</span></div><div class="detail-item"><b>الصيانة والجراج</b><span>صيانة: <span class="num">${maintText}</span> | جراج: <span class="num">${parkingText}</span></span></div><div class="detail-item"><b>المساحة الإجمالية</b><span><span class="num">${c.projectSize ? c.projectSize : '-'}</span> فدان</span></div><div class="detail-item"><b>ارتفاع العمارات</b><span class="num">${c.floors ? window.escapeHtml(c.floors) : '-'}</span></div><div class="detail-item full"><b>الموقع التفصيلي</b><span>${window.escapeHtml(c.compoundLocationDetail || '-')} ${locLinkHtml}</span></div></div>`;
    
      const grouped = {}; 
      const rawTypesModal = Array.isArray(c.unitTypes) ? c.unitTypes : [];
      rawTypesModal.forEach(u => { 
          let t = window.getUnitEnName(u.bedroomType); 
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
            return `<button class="unit-cat-btn ${k === activeDetailCategory ? 'active' : ''}" onclick="window.setDetailCategory('${k}')">${window.escapeHtml(k)}</button>`;
        }).join('') + `</div>`;
        
        const fNamesAr = { 'core_shell': 'طوب أحمر', 'semi': 'نصف تشطيب', 'full': 'تشطيب كامل' };
        
        unitsSection += `<div class="size-picker-container">` + (grouped[activeDetailCategory] || []).sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0)).map(u => {
            let rmText = u.rooms ? ` | <span class="num">${u.rooms}</span> غرف` : '';
            let gText = u.gardenArea ? ` <span style="color:var(--success); font-size:0.6875rem; font-weight:bold;">+ ${u.gardenArea}m² Garden</span>` : '';
            let rText = u.roofArea ? ` <span style="color:var(--danger); font-size:0.6875rem; font-weight:bold;">+ ${u.roofArea}m² Roof</span>` : '';
            let fText = u.finishing ? ` | ${fNamesAr[u.finishing] || u.finishing || ''}` : '';
            let pText = u.price ? window.formatNum(u.price) + ' ج' : 'حسب المتر';
            return `<div class="size-chip ${u.id === activeDetailUnitId ? 'active' : ''}" onclick="window.setDetailUnit('${u.id}')"><span class="num">${u.area}</span>m²${rmText}${gText}${rText}${fText} | <span class="num">${pText}</span></div>`
        }).join('') + `</div>`;
        
        const sUnit = rawTypesModal.find(u => u.id === activeDetailUnitId) || (grouped[activeDetailCategory] ? grouped[activeDetailCategory][0] : null);
        
        let isTextPrice = false;
        let sUnitNumericPrice = 0;
        if (sUnit) {
            sUnitNumericPrice = window.getRawNum(sUnit.price);
            if (sUnitNumericPrice === null || isNaN(sUnitNumericPrice)) isTextPrice = true;
        }
        
        let cashDiscount = c.cashDiscount || 0;
        if (sUnit && !isTextPrice && cashDiscount > 0 && sUnitNumericPrice > 0) {
            let discountAmount = sUnitNumericPrice * (cashDiscount / 100);
            let finalCashPrice = sUnitNumericPrice - discountAmount;
            unitsSection += `<div class="cash-discount-box">
                        <div class="cash-row"><span>السعر الأساسي</span><b class="num">${window.formatNum(sUnitNumericPrice)} ج</b></div>
                        <div class="cash-row highlight"><span>قيمة خصم الكاش (${cashDiscount}%)</span><b class="num">- ${window.formatNum(Math.round(discountAmount))} ج</b></div>
                        <div class="cash-row final"><span>النهائي (كاش)</span><b class="num">${window.formatNum(Math.round(finalCashPrice))} ج</b></div>
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
                  planMeterText = `<br><span style="color:var(--primary); font-size:0.625rem; background:var(--item-bg); padding:0.125rem 0.375rem; border-radius:0.25rem; border:1px dashed var(--primary); display:inline-block; margin-top:0.25rem;">سعر المتر: ${window.formatNum(p.pricePerMeter)} ج</span>`;
              }
              
              const r = window.calcInstallmentWithDiscount(planBasePrice, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
              
              let planNameCol = `<b>${window.escapeHtml(p.name)}</b>${planMeterText}`;
              if (p.discountPercent > 0) planNameCol += `<br><small style="color:var(--danger); font-weight:bold; display:block; margin-top:0.25rem;">خصم ${p.discountPercent}%</small>`;
              
              let unitPriceCol = `<span class="num" style="font-size:0.85rem; font-weight:bold;">${window.formatNum(planBasePrice)} ج</span>`;
              if (p.discountPercent > 0) unitPriceCol = `<del style="color:var(--text-muted);font-size:0.7rem;" class="num">${window.formatNum(planBasePrice)}</del><br><span style="color:var(--success); font-weight:bold; font-size:0.85rem;" class="num">${window.formatNum(Math.round(r.netTotal))} ج</span>`;

              unitsSection += `<tr>
                  <td>${planNameCol}</td>
                  <td>${unitPriceCol}</td>
                  <td><span class="num" style="font-size:0.85rem; font-weight:bold;">${window.formatNum(Math.round(r.downPayment))} ج</span><br><small style="font-size:0.65rem;">(%${p.downPaymentPercent || 0})</small></td>
                  <td class="num" style="font-size:0.8rem;">${r.bulletsSummary.map(b => b.label).join('<br>') || '-'}</td>
                  <td style="color:var(--primary);" class="num"><span style="font-size:0.85rem; font-weight:bold;">${window.formatNum(Math.round(r.monthlyEquivalent))} ج</span></td>
                  <td class="num"><span style="font-size:0.85rem; font-weight:bold;">${window.formatNum(Math.round(r.quarterlyEquivalent))} ج</span></td>
              </tr>`; 
          }); 
          unitsSection += `</table></div>`;
        }
      } 
      
      unitsSection += `<div class="section-label" style="margin-top:2.5rem; color:var(--success); border-color:var(--success);">🧮 الحاسبة السريعة للمشروع</div>
               <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.9375rem;">اكتب المساحة عشان تحسبلها الأقساط على كل خطط السداد الخاصة بالمشروع ده فوراً.</p>
               <div style="display:flex; gap:0.625rem; background:var(--item-bg); padding:0.9375rem; border-radius:var(--radius-card); border:1px solid var(--border-color); margin-bottom:1.25rem; align-items:center; flex-wrap:wrap;">
                   <input type="number" id="miniCalcArea" placeholder="مباني (م²)" class="num" style="flex:1; min-width:7.5rem; padding:0.625rem; border-radius:var(--radius-input); background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-main); outline:none;" oninput="window.runProjectMiniCalc('${c.id}')">
                   <input type="number" id="miniCalcGarden" placeholder="جاردن (م²)" class="num" style="flex:1; min-width:6.25rem; padding:0.625rem; border-radius:var(--radius-input); background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-main); outline:none;" oninput="window.runProjectMiniCalc('${c.id}')">
                   <input type="number" id="miniCalcRoof" placeholder="روف (م²)" class="num" style="flex:1; min-width:6.25rem; padding:0.625rem; border-radius:var(--radius-input); background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-main); outline:none;" oninput="window.runProjectMiniCalc('${c.id}')">
               </div>
               <div id="miniCalcResult"></div>`;
               
      let whatsappNum = c.whatsapp ? String(c.whatsapp).replace(/[^0-9]/g, '') : '';
      let whatsappBtn = whatsappNum ? `<a href="https://wa.me/${whatsappNum}" target="_blank" class="btn w-100 btn-pill" style="margin-bottom:0.625rem; background:#25D366; color:#fff; font-size:1rem; text-decoration:none;"><b style="font-family:Cairo;">تواصل واتساب | WhatsApp</b></a>` : '';
      let pdfBtn = c.projectPDF ? `<a href="${window.escapeHtml(c.projectPDF)}" target="_blank" class="btn btn-outline-light w-100 btn-pill" style="margin-bottom:0.625rem; font-size:0.85rem; text-decoration:none;"><b>بروشور المشروع | PDF Brochure</b></a>` : '';
      let worksBtn = c.previousWorks ? `<a href="${window.escapeHtml(c.previousWorks)}" target="_blank" class="btn btn-outline-light w-100 btn-pill" style="margin-bottom:0.625rem; font-size:0.85rem; text-decoration:none;"><b>سابقة الأعمال | Previous Works</b></a>` : '';

      let sideActions = `
          <div class="action-card" style="background:var(--item-bg); padding:1.5rem; border-radius:1rem; border:1px solid var(--border-color); position:sticky; top:0; z-index:10; width:100%;">
              <h4 style="margin-bottom:1rem; color:var(--text-main); font-weight:800; font-size:1.1rem; text-align:center;">تواصل للحجز والتفاصيل<br><span style="color:var(--text-muted); font-size:0.8rem;">Contact & Reserve</span></h4>
              ${whatsappBtn}
              ${pdfBtn}
              ${worksBtn}
              ${(!whatsappNum && !c.projectPDF && !c.previousWorks) ? `<p style="text-align:center; color:var(--text-muted); font-size:0.8rem;">لا توجد روابط تواصل مسجلة.</p>` : ''}
              
              <hr style="border-color:var(--border-color); margin:1.5rem 0;">
              
              <div style="display:flex; gap:0.5rem; width:100%;">
                  <button class="btn btn-outline-light btn-pill w-100" onclick="window.editCompoundById('${c.id}')" style="display:${isEditor ? 'flex' : 'none'}; font-size:0.85rem; justify-content:center;">تعديل ⚙️</button>
                  <button class="btn w-100 btn-pill" onclick="window.deleteCurrentCompoundFromCloud()" style="display:${isEditor ? 'flex' : 'none'}; background:var(--danger); color:#fff; border:none; font-size:0.85rem; justify-content:center;">حذف 🗑️</button>
              </div>
          </div>
      `;

      let mainLayout = `
      <div class="detail-page-layout" style="display:flex; gap:2rem; align-items:flex-start; flex-wrap:wrap; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:2rem;">
          <div class="detail-main-col" style="flex:1; min-width:18.75rem;">
               <h1 style="font-size:2rem; font-weight:800; color:var(--text-main); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.625rem; flex-wrap:wrap;">
                  ${window.highlightText(c.projectName||'بدون اسم', filters.searchText)} 
                  ${c.phaseName ? `<span style="font-size:0.9rem; background:var(--primary); color:#fff; padding:0.2rem 0.8rem; border-radius:2rem;">${window.escapeHtml(c.phaseName)}</span>` : ''}
               </h1>
               <p style="color:var(--text-muted); font-size:1rem; margin-bottom:1rem;">📍 ${window.escapeHtml(window.findSubLocationName(c.locationId))} - ${window.escapeHtml(c.companyName)}</p>
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
};

window.runProjectMiniCalc = function(cId) {
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
                        <div style="text-align:center;"><span>السعر الأساسي</span><br><b class="num" style="font-size:1.125rem;">${window.formatNum(basePrice)} ج</b></div>
                        <div style="text-align:center; color:var(--danger);"><span>خصم الكاش (${cashDiscount}%)</span><br><b class="num" style="font-size:1.125rem;">- ${window.formatNum(Math.round(discountAmount))} ج</b></div>
                        <div style="text-align:center; color:var(--success);"><span>النهائي (كاش)</span><br><b class="num" style="font-size:1.2rem;">${window.formatNum(Math.round(finalCashPrice))} ج</b></div>
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
                  planMeterText = `<br><span style="color:var(--primary); font-size:0.625rem; font-weight:800; background:var(--item-bg); padding:0.125rem 0.375rem; border-radius:0.25rem; border:1px dashed var(--primary); display:inline-block; margin-top:0.25rem;">سعر المتر: ${window.formatNum(p.pricePerMeter)} ج</span>`;
              }
              
              const r = window.calcInstallmentWithDiscount(planBasePrice, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
              
              let planNameCol = `<b>${window.escapeHtml(p.name)}</b>${planMeterText}`;
              if (p.discountPercent > 0) planNameCol += `<br><small style="color:var(--danger); font-weight:bold; display:block; margin-top:0.25rem;">خصم ${p.discountPercent}%</small>`;
              
              let unitPriceCol = `<span class="num" style="font-size:0.85rem; font-weight:bold;">${window.formatNum(planBasePrice)} ج</span>`;
              if (p.discountPercent > 0) unitPriceCol = `<del style="color:var(--text-muted);font-size:0.7rem;" class="num">${window.formatNum(planBasePrice)}</del><br><span style="color:var(--success); font-weight:bold; font-size:0.85rem;" class="num">${window.formatNum(Math.round(r.netTotal))} ج</span>`;

              html += `<tr>
                  <td>${planNameCol}</td>
                  <td>${unitPriceCol}</td>
                  <td><span class="num" style="font-size:0.85rem; font-weight:bold;">${window.formatNum(Math.round(r.downPayment))} ج</span><br><small style="font-size:0.65rem;">(%${p.downPaymentPercent || 0})</small></td>
                  <td class="num" style="font-size:0.8rem;">${r.bulletsSummary.map(b => b.label).join('<br>') || '-'}</td>
                  <td style="color:var(--primary);" class="num"><span style="font-size:0.85rem; font-weight:bold;">${window.formatNum(Math.round(r.monthlyEquivalent))} ج</span></td>
                  <td class="num"><span style="font-size:0.85rem; font-weight:bold;">${window.formatNum(Math.round(r.quarterlyEquivalent))} ج</span></td>
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
};

window.calcInstallmentWithDiscount = function(originalTotal, discountPct, downPct, customBullets, years, freq){ 
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
                        bulletsSummary.push({ type: 'annual', label: `سنة ${yName}: %${pct} = ${window.formatNum(Math.round(perYearVal))} ج`, val: perYearVal });
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
                bulletsSummary.push({ type: b.type, label: `${name}: %${pct} = ${window.formatNum(Math.round(val))} ج`, val }); 
            } 
        } 
    }); 
    
    const remaining = Math.max(0, netTotal - (downPayment + extraPaymentsTotal));
    let yrs = parseFloat(years) || 1;
    if (yrs <= 0) yrs = 1;
    const monthlyEquivalent = remaining / (yrs * 12); 
    return { originalTotal, discountVal, netTotal, downPayment, extraPaymentsTotal, bulletsSummary, remaining, monthlyEquivalent, quarterlyEquivalent: monthlyEquivalent * 3 }; 
};

window.openCalculator = function(){ calcCustomBullets=[]; ['calcTotal','calcDiscountPct','calcDownPct','calcYears'].forEach(id=>window.setSafeVal(id, '')); document.getElementById('calcResult').style.display='none'; window.renderCalcBulletsRows(); document.getElementById('calcOverlay').classList.add('open'); };
window.addCalcBulletRow = function(){ calcCustomBullets.push({id:window.uid(), type:'annual', percent:'', selectedYears:[]}); window.renderCalcBulletsRows(); };
window.removeCalcBulletRow = function(id){ calcCustomBullets=calcCustomBullets.filter(b=>b.id!==id); window.renderCalcBulletsRows(); };

window.toggleCalcYearSelection = function(bId, y){ 
    const b = calcCustomBullets.find(x=>x.id===bId); 
    if(b){ if(!b.selectedYears) b.selectedYears = []; const i = b.selectedYears.indexOf(y); i > -1 ? b.selectedYears.splice(i,1) : b.selectedYears.push(y); window.renderCalcBulletsRows(); } 
};

window.updateCalcBullet = function(id, f, v){ 
    const b = calcCustomBullets.find(x=>x.id===id); 
    if(b){ 
        b[f] = f==='type' ? v : (parseFloat(v)||0); 
        if(f==='type') window.renderCalcBulletsRows(); 
    } 
};

window.renderCalcBulletsRows = function(){ 
    const cbRows = document.getElementById('calcBulletsRows');
    if(!cbRows) return;
    cbRows.innerHTML = calcCustomBullets.map(b=>`<div class="bullet-row" style="display:flex; gap:0.625rem; align-items:center; margin-bottom:0.625rem;">
            <select style="flex:1; min-width:6.25rem; padding:0.5rem; border-radius:0.25rem; background:var(--item-bg); border:1px solid var(--border-color); color:var(--text-main);" onchange="window.updateCalcBullet('${b.id}','type',this.value)">
                <option value="annual" ${b.type=='annual'?'selected':''}>سنوية</option>
                <option value="deferred" ${b.type=='deferred'?'selected':''}>مؤجلة</option>
                <option value="delivery" ${b.type=='delivery'?'selected':''}>استلام</option>
                <option value="after_3m" ${b.type=='after_3m'?'selected':''}>بعد 3 شهور</option>
                <option value="after_6m" ${b.type=='after_6m'?'selected':''}>بعد 6 شهور</option>
                <option value="after_9m" ${b.type=='after_9m'?'selected':''}>بعد 9 شهور</option>
            </select>
            <input type="number" placeholder="%" class="num" style="width:5rem; flex-shrink:0; padding:0.5rem; border-radius:0.25rem; background:var(--item-bg); border:1px solid var(--border-color); color:var(--text-main);" value="${b.percent}" oninput="window.updateCalcBullet('${b.id}','percent',this.value)">
            <button class="btn btn-danger-style" style="flex-shrink:0; padding:0.5rem;" onclick="window.removeCalcBulletRow('${b.id}')">✕</button>
        </div>
        ${b.type==='annual'?`<div class="years-pills" style="margin-bottom:0.9375rem; display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center; width:100%;">${[1,2,3,4,5,6,7].map(yr=>`<div class="year-pill ${(b.selectedYears||[]).includes(yr)?'selected':''}" onclick="window.toggleCalcYearSelection('${b.id}',${yr})">${yr}</div>`).join('')}</div>`:''}
    `).join(''); 
};

window.runUniversalCalculator = function(){ 
    const inputVal = window.getSafeVal('calcTotal').replace(/,/g, '');
    const t = window.getRawNum(inputVal); 
    if(!t || isNaN(t)) return window.showToast('أدخل إجمالي سعر صحيح'); 
    
    const r = window.calcInstallmentWithDiscount(t, parseFloat(window.getSafeVal('calcDiscountPct'))||0, parseFloat(window.getSafeVal('calcDownPct'))||0, calcCustomBullets, parseFloat(window.getSafeVal('calcYears'))||0, 12); 
    
    const box = document.getElementById('calcResult'); 
    box.style.display='grid'; 
    
    let bulletsHtml = r.bulletsSummary.length > 0 
        ? `<div class="calc-item" style="grid-column: 1 / -1; border: 2px dashed var(--primary); text-align:right;">
            <span style="display:block; margin-bottom:0.375rem; color:var(--primary); font-weight:800;">الدفعات الخاصة:</span>
            <div class="num" style="font-size:1rem;">${r.bulletsSummary.map(b => `<div style="margin-bottom:0.25rem;">• ${b.label}</div>`).join('')}</div>
           </div>` 
        : '';

    box.innerHTML = `
        <div class="calc-item"><span>الصافي</span><b class="num">${window.formatNum(Math.round(r.netTotal))} ج</b></div>
        <div class="calc-item"><span>المقدم</span><b class="num">${window.formatNum(Math.round(r.downPayment))} ج</b></div>
        ${bulletsHtml}
        <div class="calc-highlight"><span>القسط الشهري</span><b class="num">${window.formatNum(Math.round(r.monthlyEquivalent))} ج</b></div>
        <div class="calc-item" style="background: rgba(0,0,0,0.02);"><span>قسط ربع سنوي</span><b class="num" style="color:var(--text-main);">${window.formatNum(Math.round(r.quarterlyEquivalent))} ج</b></div>
        <div class="calc-item" style="background: rgba(0,0,0,0.02);"><span>قسط سنوي</span><b class="num" style="color:var(--text-main);">${window.formatNum(Math.round(r.monthlyEquivalent * 12))} ج</b></div>
    `; 
};

const cTotal = document.getElementById('calcTotal');
if(cTotal) { cTotal.addEventListener('input', function() { window.formatInput(this); }); }

window.closeModal = function(id){ 
    if (id === 'formOverlay') { if(!confirm('هل أنت متأكد من إغلاق النافذة؟ لن يتم حفظ التعديلات الأخيرة.')) return; }
    const el = document.getElementById(id);
    if(el) el.classList.remove('open'); 
};

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

window.handleExcelUpload = async function(event) {
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
                    let bedStr = String(row['No of Bedrooms'] || '').toLowerCase(); let unitTypeStr = String(row['Unit Type'] || '').toLowerCase(); let bType = 'استوديو'; let rm = parseFloat(row['No of Bedrooms'] || '') || ''; if(bedStr.includes('1')) bType = '1 غرفة نوم'; else if(bedStr.includes('2')) bType = '2 غرفة نوم'; else if(bedStr.includes('3')) bType = '3 غرف نوم'; else if(bedStr.includes('4')) bType = '4 غرف نوم'; else if(bedStr.includes('duplex') || unitTypeStr.includes('duplex')) bType = 'دوبلكس'; else if(bedStr.includes('penthouse') || unitTypeStr.includes('penthouse')) bType = 'بنتهاوس'; else if(bedStr.includes('villa') || unitTypeStr.includes('villa')) bType = 'فيلا'; else if(bedStr.includes('chalet') || unitTypeStr.includes('chalet')) bType = 'شاليه';
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
            window.showToast(`✅ تم استيراد ${totalUploaded} مشروع!`); event.target.value = ''; setTimeout(() => { location.reload(); }, 2000);
        } catch (error) { alert("حدث خطأ."); document.getElementById('loadingOverlay').style.display = 'none'; event.target.value = ''; }
    }; reader.readAsArrayBuffer(file);
};
