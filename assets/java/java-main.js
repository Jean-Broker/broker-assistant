// --- Theme & Setup ---
function setNavForApp(isAppView) { const links = document.getElementById('siteBarLinks'), loginBtn = document.getElementById('siteBarLoginBtn'); if (links) links.classList.toggle('nav-app-hidden', isAppView); if (loginBtn) loginBtn.classList.toggle('nav-app-hidden', isAppView); }
if (sessionStorage.getItem('isSystemOpen') === 'true') { document.getElementById('landingPageContainer').style.display = 'none'; document.getElementById('systemApp').style.display = 'flex'; setNavForApp(true); } else { document.getElementById('landingPageContainer').style.display = 'block'; document.getElementById('systemApp').style.display = 'none'; setNavForApp(false); }

let currentLang = 'ar';
function toggleLanguage() { currentLang = currentLang === 'ar' ? 'en' : 'ar'; document.documentElement.lang = currentLang; document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr'; document.querySelectorAll('[data-ar]').forEach(el => { el.innerHTML = el.getAttribute('data-' + currentLang); }); }
function openSystemLogin() { document.getElementById('paywallModal').style.display = 'flex'; }
function closeLoginModal() { document.getElementById('paywallModal').style.display = 'none'; }
function backToLanding() { document.getElementById('systemApp').style.display = 'none'; document.getElementById('landingPageContainer').style.display = 'block'; setNavForApp(false); }

function toggleTheme() { document.body.classList.toggle('light-mode'); localStorage.setItem('appTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark'); }
if (localStorage.getItem('appTheme') === 'light') { document.body.classList.add('light-mode'); }

const firebaseConfig = { apiKey: "AIzaSyApvrK13v-5nIB7TzhrN-M4-1Y8PSEhKoE", authDomain: "broker-assistant-63277.firebaseapp.com", projectId: "broker-assistant-63277", storageBucket: "broker-assistant-63277.firebasestorage.app", messagingSenderId: "434808917289", appId: "1:434808917289:web:1012be2fa30cf80cfefb38" };
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// ✨ السحر هنا: تفعيل الكاش المحلي لسرعة الصاروخ ✨
// بمجرد تفعيله، السيستم هيحمل الـ 200+ مشروع في لمح البصر من الذاكرة
db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
    console.log("تعذر تفعيل الكاش المحلي: ", err);
});

const auth = firebase.auth();
const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryApp");

window.updateAllUnitsPrice = function() {
    tempUnits.forEach(u => updateUnitData(u.id, 'recalc', null));
};

window.addEventListener('load', () => {
    if(localStorage.getItem('savedEmail')) { document.getElementById('loginEmail').value = localStorage.getItem('savedEmail'); document.getElementById('loginPassword').value = localStorage.getItem('savedPassword'); document.getElementById('rememberMe').checked = true; }
    const pt = document.getElementById('fldProjectType'); if (pt) pt.addEventListener('change', onProjectTypeChange);
    const footerYearEl = document.getElementById('footerYear'); if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeAllDropdowns();
    if (document.getElementById('paywallModal').style.display === 'flex') closeLoginModal();
    document.querySelectorAll('.overlay.open').forEach(ov => { if (ov.id === 'formOverlay' || ov.id === 'typesOverlay') return; ov.classList.remove('open'); });
});

function toggleDropdown(id) { const wrapper = document.getElementById(id).parentElement; const isActive = wrapper.classList.contains('active'); closeAllDropdowns(); if (!isActive) wrapper.classList.add('active'); }
function closeAllDropdowns() { document.querySelectorAll('.filter-dropdown-wrapper').forEach(el => el.classList.remove('active')); }
document.addEventListener('click', function(event) { if (!event.target.closest('.filter-dropdown-wrapper')) { closeAllDropdowns(); } });

let selectedBeds = [];
function selectPill(groupId, val) { const el = event.target; el.classList.toggle('active'); if (el.classList.contains('active')) { selectedBeds.push(val); } else { selectedBeds = selectedBeds.filter(v => v !== val); } applyFilters(); }

let currentUser = null, isAdmin = false, isEditor = false;
let mainLocations = [], compounds = [], activeProjectType = 'all';
let editingCompoundId = null, viewingCompoundId = null;
let tempUnits = [], tempPlans = [], tempDecrees = [], openMainLocIds = {}; 
let activeDetailCategory = null, activeDetailUnitId = null, calcCustomBullets = [];
let activeLocationIds = []; 
let filters = {};
let completionFilter = 'all'; 

let appSettings = {
    resTypes: ['Studio', '1 Bedroom', '2 Bedrooms', '3 Bedrooms', '4 Bedrooms', '5 Bedrooms', 'Duplex', 'Penthouse', 'Townhouse', 'Twinhouse', 'Villa', 'Chalet', 'Apartment'],
    commTypes: ['Commercial', 'Administrative', 'Clinic', 'Recreational']
};

const UNIT_EN_NAMES = {
    'استوديو': 'Studio', '1 غرفة نوم': '1 Bedroom', '2 غرفة نوم': '2 Bedrooms',
    '3 غرف نوم': '3 Bedrooms', '4 غرف نوم': '4 Bedrooms', '5 غرف نوم': '5 Bedrooms',
    'دوبلكس': 'Duplex', 'بنتهاوس': 'Penthouse', 'تاون هاوس': 'Townhouse',
    'توين هاوس': 'Twinhouse', 'فيلا': 'Villa', 'شاليه': 'Chalet', 'شقة': 'Apartment',
    'تجاري': 'Commercial', 'إداري': 'Administrative', 'عيادة': 'Clinic', 'ترفيهي': 'Recreational'
};

const UNIT_ORDER = {
    'Studio': 1, '1 Bedroom': 2, '2 Bedrooms': 3, '3 Bedrooms': 4, '4 Bedrooms': 5, '5 Bedrooms': 6,
    'Apartment': 7, 'Duplex': 8, 'Penthouse': 9, 'Townhouse': 10, 'Twinhouse': 11, 'Villa': 12, 'Chalet': 13,
    'Commercial': 20, 'Administrative': 21, 'Clinic': 22, 'Recreational': 23
};

function getUnitEnName(name) {
    if(!name) return 'Other';
    return UNIT_EN_NAMES[name] || name;
}

const PROJECT_TYPES = { residential: 'سكني', commercial: 'تجاري / إداري', hotel: 'شقق فندقية' };
const FINISHING_TYPES = { core_shell: 'طوب أحمر', semi: 'نصف تشطيب', full: 'تشطيب كامل', mixed: 'متنوع' };
const FREQ_LABEL = {12:'شهري', 4:'ربع سنوي', 2:'نصف سنوي', 1:'سنوي'};
const DELIVERY_TIMELINES = [ {value:'immediate', label:'فوري'}, {value:'6m', label:'6 أشهر'}, {value:'1y', label:'سنة'}, {value:'1.5y', label:'سنة ونصف'}, {value:'2y', label:'سنتين'}, {value:'2.5y', label:'سنتين ونصف'}, {value:'3y', label:'3 سنوات'}, {value:'4y', label:'4 سنوات'} ];

function formatInput(el) { let val = String(el.value).replace(/,/g, ''); if (val.trim() === '') return; if (/^-?\d+(\.\d+)?$/.test(val)) { el.value = Number(val).toLocaleString('en-US'); } }
function getRawNum(val) { if(val === null || val === undefined) return null; let str = String(val).replace(/,/g, '').trim(); if(str === '') return null; if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str); return null; }

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
    document.getElementById('userEmailLabel').textContent = user.email.split('@')[0] + (isAdmin ? ' (المدير)' : (isEditor ? ' (محرر)' : ' (مشترك)'));
    document.getElementById('superAdminActions').style.display = isAdmin ? 'flex' : 'none'; document.getElementById('addMainLocWrap').style.display = isEditor ? 'flex' : 'none'; document.getElementById('adminActions').style.display = isEditor ? 'flex' : 'none';
    
    if(document.getElementById('loginSubmitBtn')) document.getElementById('loginSubmitBtn').innerHTML = 'دخول';
    
    await syncCloudData(); document.getElementById('paywallModal').style.display = 'none'; document.getElementById('landingPageContainer').style.display = 'none'; document.getElementById('systemApp').style.display = 'flex'; setNavForApp(true);
  } else { currentUser = null; isAdmin = false; isEditor = false; sessionStorage.removeItem('isSystemOpen'); document.getElementById('userEmailLabel').textContent = 'يرجى تسجيل الدخول'; document.getElementById('systemApp').style.display = 'none'; document.getElementById('landingPageContainer').style.display = 'block'; setNavForApp(false); }
});

function handleAuthAction() { currentUser ? (auth.signOut(), sessionStorage.removeItem('isSystemOpen'), backToLanding()) : document.getElementById('paywallModal').style.display = 'flex'; }
function openUsersManager() { document.getElementById('newAccEmail').value = ''; document.getElementById('newAccResult').style.display = 'none'; document.getElementById('usersOverlay').classList.add('open'); }
async function createNewSubscriber() { const email = document.getElementById('newAccEmail').value.trim().toLowerCase(), duration = parseInt(document.getElementById('newAccDuration').value), role = document.getElementById('newAccRole').value; if(!email) { showToast('يرجى كتابة الإيميل!'); return; } const password = Math.random().toString(36).slice(-6) + Math.floor(Math.random()*100), expDate = new Date(); expDate.setDate(expDate.getDate() + duration); try { await secondaryApp.auth().createUserWithEmailAndPassword(email, password); await db.collection('users').doc(email).set({ role: role, expiryDate: expDate.toISOString().split('T')[0] }); await secondaryApp.auth().signOut(); document.getElementById('resEmail').textContent = email; document.getElementById('resPass').textContent = password; document.getElementById('resDate').textContent = expDate.toISOString().split('T')[0]; document.getElementById('newAccResult').style.display = 'block'; showToast('تم تسجيل الحساب بنجاح!'); } catch (error) { alert('حدث خطأ: ' + error.message); } }

function openTypesManager() { document.getElementById('resTypesInput').value = appSettings.resTypes.join(' ، '); document.getElementById('commTypesInput').value = appSettings.commTypes.join(' ، '); document.getElementById('typesOverlay').classList.add('open'); }
async function saveCustomTypes() { if(!isEditor) return; const r = document.getElementById('resTypesInput').value.split(/[,،\n]+/).map(s=>s.trim()).filter(Boolean); const c = document.getElementById('commTypesInput').value.split(/[,،\n]+/).map(s=>s.trim()).filter(Boolean); appSettings.resTypes = r.length ? r : appSettings.resTypes; appSettings.commTypes = c.length ? c : appSettings.commTypes; try { await db.collection('system').doc('settings').set({ resTypes: appSettings.resTypes, commTypes: appSettings.commTypes }, { merge: true }); closeModal('typesOverlay'); showToast('تم الحفظ 💾'); if(document.getElementById('formOverlay').classList.contains('open')) renderUnitRows(); } catch(e) { alert('خطأ في الحفظ!'); } }

function isCompoundComplete(c) {
    try {
        if (!c.companyName || String(c.companyName).trim() === '') return false;
        if (!c.projectName || String(c.projectName).trim() === '') return false;
        if (!c.locationId || String(c.locationId).trim() === '') return false;
        
        let hasPrice = false;
        if (c.projectType === 'commercial' && c.commercialPrices) { 
            if (c.commercialPrices.adminMin > 0 || c.commercialPrices.commMin > 0 || c.commercialPrices.clinicMin > 0 || c.commercialPrices.recMin > 0) hasPrice = true; 
        } else { 
            if ((c.pricePerMeter && c.pricePerMeter > 0) || 
                (c.pricePerMeterMin && c.pricePerMeterMin > 0) || 
                (c.priceCore && c.priceCore > 0) || 
                (c.priceSemi && c.priceSemi > 0) || 
                (c.priceFull && c.priceFull > 0) ||
                (c.priceCoreMin && c.priceCoreMin > 0) ||
                (c.priceSemiMin && c.priceSemiMin > 0) ||
                (c.priceFullMin && c.priceFullMin > 0)) {
                hasPrice = true;
            }
        }
        if (!hasPrice) return false;

        if (!c.unitTypes || !Array.isArray(c.unitTypes) || c.unitTypes.length < 1) return false;
        if (!c.paymentPlans || !Array.isArray(c.paymentPlans) || c.paymentPlans.length < 1) return false;
        
        return true;
    } catch (e) {
        return false;
    }
}

function renderAdminStats() {
    const board = document.getElementById('adminStatsBoard'); if (!board) return;
    if (!isEditor && !isAdmin) { board.style.display = 'none'; return; }
    board.style.display = 'flex';
    let completed = compounds.filter(c => isCompoundComplete(c)).length;
    document.getElementById('statTotal').textContent = compounds.length;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statIncomplete').textContent = compounds.length - completed;
}

function setCompletionFilter(filterType, btnElem) { completionFilter = filterType; document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active')); btnElem.classList.add('active'); renderGrid(); }

function skeletonCardsHtml(count) {
    let card = `<div class="dossier skeleton-card" aria-hidden="true"><div class="skeleton-line" style="width:40%;height:10px;margin-bottom:10px;"></div><div class="skeleton-line" style="width:75%;height:16px;margin-bottom:14px;"></div><div class="skeleton-line" style="width:55%;height:9px;margin-bottom:8px;"></div><div class="skeleton-line" style="width:45%;height:9px;margin-bottom:8px;"></div><div class="skeleton-line" style="width:60%;height:9px;margin-bottom:14px;"></div><div style="display:flex;gap:10px;"><div class="skeleton-line" style="flex:1;height:34px;"></div><div class="skeleton-line" style="flex:1;height:34px;"></div></div></div>`;
    return card.repeat(count);
}

async function syncCloudData() { 
    const grid = document.getElementById('compoundGrid'); 
    if (grid && !grid.children.length) {
        document.getElementById('pageSub').textContent = "جاري تحميل الداتا..."; 
        grid.innerHTML = skeletonCardsHtml(6);
    }
    
    db.collection('system').doc('settings').onSnapshot(doc => { if (doc.exists) { let d = doc.data(); if(d.resTypes) appSettings.resTypes = d.resTypes; if(d.commTypes) appSettings.commTypes = d.commTypes; } });
    db.collection('system').doc('locations').onSnapshot(doc => { mainLocations = doc.exists ? doc.data().mainLocations || [] : []; renderLocationTree(); applyFilters(); }); 
    db.collection('compounds').onSnapshot(snapshot => { compounds = []; snapshot.forEach(doc => compounds.push({ id: doc.id, ...doc.data() })); renderAdminStats(); renderLocationTree(); applyFilters(); }); 
}

async function saveMainLocationsToCloud() { if(isEditor) { try { await db.collection('system').doc('locations').set({ mainLocations }); } catch (error) {} } }

function extractValueAfterKeyword(line, keywords) {
    const lowerLine = line.toLowerCase();
    for (let kw of keywords) {
        if (lowerLine.includes(kw.toLowerCase())) {
            let splitChar = line.includes(':') ? ':' : (line.includes('-') ? '-' : kw);
            let val = line.substring(line.toLowerCase().indexOf(kw.toLowerCase()) + kw.length).split(splitChar).pop().replace(/[*_]/g, '').trim();
            if (val) return val;
        }
    } return null;
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

window.updateFinishingAvgs = function() {
    let fields = [
        {min: 'fldPriceCoreMin', max: 'fldPriceCoreMax', avg: 'fldPriceCoreAvg'},
        {min: 'fldPriceSemiMin', max: 'fldPriceSemiMax', avg: 'fldPriceSemiAvg'},
        {min: 'fldPriceFullMin', max: 'fldPriceFullMax', avg: 'fldPriceFullAvg'}
    ];

    fields.forEach(f => {
        let min = getRawNum(document.getElementById(f.min).value) || 0;
        let max = getRawNum(document.getElementById(f.max).value) || 0;
        let avg = (min > 0 && max > 0) ? (min + max) / 2 : (min || max || 0);
        let avgInput = document.getElementById(f.avg);
        if (avgInput) {
            avgInput.value = avg > 0 ? formatNum(Math.round(avg)) : '';
        }
    });

    updateAllUnitsPrice();
};

window.toggleAdvPricing = function(forceState) {
    const wrap = document.getElementById('advPricingWrap');
    const btn = document.getElementById('btnToggleAdvPricing');
    
    let isOpening = forceState !== undefined ? forceState : wrap.style.display === 'none';
    
    if (isOpening) {
        wrap.style.display = 'block';
        btn.innerHTML = '✕ إخفاء أسعار التشطيب المخصصة';
        btn.style.color = 'var(--danger)';
        btn.style.borderColor = 'var(--danger)';
        btn.style.borderStyle = 'solid';
    } else {
        wrap.style.display = 'none';
        btn.innerHTML = '+ تخصيص أسعار متر لكل تشطيب على حدة (اختياري)';
        btn.style.color = 'var(--text-muted)';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.borderStyle = 'dashed';
    }
    updateAllUnitsPrice();
};

window.updatePriceMeterAvg = function() { 
    const min = getRawNum(document.getElementById('fldPriceMeterMin').value) || 0; 
    const max = getRawNum(document.getElementById('fldPriceMeterMax').value) || 0; 
    let avg = 0;
    if(min > 0 && max > 0) avg = (min + max) / 2; 
    else avg = min || max || 0; 
    
    const avgInput = document.getElementById('fldPriceMeterAvg'); 
    if (avgInput) {
        if(avg > 0) avgInput.value = formatNum(Math.round(avg));
        else avgInput.value = '';
    }
    updateAllUnitsPrice(); 
}

function renderGrid(){
  let list = compounds.filter(c=>{
    if (completionFilter === 'completed' && !isCompoundComplete(c)) return false;
    if (completionFilter === 'incomplete' && isCompoundComplete(c)) return false;

    if (activeLocationIds.length > 0) {
        let parentMain = mainLocations.find(m => {
            if(m && m.subLocations) {
                return m.subLocations.some(s => s.id === c.locationId);
            }
            return false;
        });
        let parentId = parentMain ? parentMain.id : null;
        if (!activeLocationIds.includes(c.locationId) && !activeLocationIds.includes(parentId)) { return false; }
    }
    
    if(activeProjectType !== 'all' && (c.projectType || 'residential') !== activeProjectType) return false;
    
    if(filters.searchText) {
        const searchable = [String(c.projectName||''), String(c.companyName||''), String(c.ownerName||''), String(c.consultant||''), findSubLocationName(c.locationId)].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(filters.searchText)) return false;
    }
    
    let cUnits = c.unitTypes||[]; 
    
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
        if (p > 0) return p;
        
        let effArea = (parseFloat(u.area) || 0) + (parseFloat(u.gardenArea) || 0)/3 + (parseFloat(u.roofArea) || 0)/3;
        if (effArea <= 0) return 0;
        
        let meterPrice = 0;
        if (c.projectType === 'commercial') {
             let cp = c.commercialPrices || {};
             let aMin = getRawNum(cp.adminMin) || 0;
             let aMax = getRawNum(cp.adminMax) || 0;
             meterPrice = (aMin > 0 && aMax > 0) ? (aMin + aMax)/2 : (aMin || aMax || 0); 
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
        return Math.round(effArea * meterPrice);
    });

    if(filters.minPrice != null || filters.maxPrice != null) {
        let passPrice = false;
        for (let i = 0; i < unitPricesArray.length; i++) {
            let p = unitPricesArray[i];
            if (p <= 0) continue;
            let okMin = filters.minPrice != null ? (p >= filters.minPrice) : true;
            let okMax = filters.maxPrice != null ? (p <= filters.maxPrice) : true;
            if (okMin && okMax) { passPrice = true; break; }
        }
        if(!passPrice) return false;
    }
    
    if(filters.downPaymentTarget != null || filters.maxMonthlyInstallment != null){
        const plans = c.paymentPlans || []; 
        if(!plans.length) return false; 
        let pass = false;
        
        for (let i = 0; i < cUnits.length; i++) {
            let u = cUnits[i];
            let baseUnitP = unitPricesArray[i];
            if (baseUnitP <= 0) continue;
            
            let effArea = (parseFloat(u.area) || 0) + (parseFloat(u.gardenArea) || 0)/3 + (parseFloat(u.roofArea) || 0)/3;

            for(let j = 0; j < plans.length; j++) {
                let p = plans[j];
                let planBasePrice = baseUnitP;
                if (p.pricePerMeter > 0 && effArea > 0) {
                    planBasePrice = Math.round(effArea * p.pricePerMeter);
                }

                const r = calcInstallmentWithDiscount(planBasePrice, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
                
                let okDP = filters.downPaymentTarget != null ? (r.downPayment >= 0 && r.downPayment <= filters.downPaymentTarget) : true;
                let okInst = filters.maxMonthlyInstallment != null ? (r.monthlyEquivalent >= 0 && r.monthlyEquivalent <= filters.maxMonthlyInstallment) : true;
                
                if (okDP && okInst) { pass = true; break; } 
            }
            if(pass) break;
        }
        if(!pass) return false;
    } 
    
    return true;
  });
  
  if(filters.sortOrder && filters.sortOrder !== 'default') {
      list.sort((a, b) => {
          let aPrice = a.pricePerMeterMin || a.pricePerMeter || a.priceCoreMin || a.priceCore || 0;
          let bPrice = b.pricePerMeterMin || b.pricePerMeter || b.priceCoreMin || b.priceCore || 0;
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
  document.getElementById('pageSub').textContent = `${list.length} مشروع مسجل بالسحابة`;
  const grid = document.getElementById('compoundGrid');
  if(!list.length) return grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">لا توجد مشروعات مطابقة</div><div class="empty-state-sub">جرّب تعديل كلمة البحث أو الفلاتر المستخدمة</div><button class="btn btn-outline-light btn-pill" onclick="resetFilters()">مسح كل الفلاتر</button></div>`;
  
  let groups = {};
  list.forEach(c => {
      let key = `${String(c.projectName||'').trim().toLowerCase()}|${String(c.companyName||'').trim().toLowerCase()}`;
      if(!groups[key]) groups[key] = [];
      groups[key].push(c);
  });
   
  grid.innerHTML = Object.values(groups).map(group => {
      if(group.length === 1) { return generateDossierHTML(group[0]); } 
      else { return generateMasterDossierHTML(group); }
  }).join('');
}

async function saveCompoundToCloud() {
  if(!isEditor) return;
  const projectName = document.getElementById('fldProject').value.trim();
  if(!projectName){ showToast('أدخل اسم المشروع'); return; }
  
  let pSingle = getRawNum(document.getElementById('fldPriceMeter').value) || 0;
  let pMin = getRawNum(document.getElementById('fldPriceMeterMin').value) || 0;
  let pMax = getRawNum(document.getElementById('fldPriceMeterMax').value) || 0;
  
  let isAdvOpen = document.getElementById('advPricingWrap').style.display !== 'none';
  
  let pCoreMin = isAdvOpen ? (getRawNum(document.getElementById('fldPriceCoreMin').value) || 0) : 0;
  let pCoreMax = isAdvOpen ? (getRawNum(document.getElementById('fldPriceCoreMax').value) || 0) : 0;
  let pSemiMin = isAdvOpen ? (getRawNum(document.getElementById('fldPriceSemiMin').value) || 0) : 0;
  let pSemiMax = isAdvOpen ? (getRawNum(document.getElementById('fldPriceSemiMax').value) || 0) : 0;
  let pFullMin = isAdvOpen ? (getRawNum(document.getElementById('fldPriceFullMin').value) || 0) : 0;
  let pFullMax = isAdvOpen ? (getRawNum(document.getElementById('fldPriceFullMax').value) || 0) : 0;
  
  let validPrices = [pCoreMin, pSemiMin, pFullMin].filter(p => p > 0);
  let finStat = document.getElementById('fldFinishingStatus').value;
  if(isAdvOpen && validPrices.length > 1) finStat = 'mixed';

  const data = {
    locationId: document.getElementById('fldLocation').value || '', projectType: document.getElementById('fldProjectType').value, companyName: document.getElementById('fldCompany').value.trim(), projectName: projectName, phaseName: document.getElementById('fldPhaseName').value.trim(), floors: document.getElementById('fldFloors').value.trim() || '', ownerName: document.getElementById('fldOwner').value.trim(), consultant: document.getElementById('fldConsultant').value.trim(),
    pricePerMeter: pSingle, pricePerMeterMin: pMin, pricePerMeterMax: pMax, 
    priceCoreMin: pCoreMin, priceCoreMax: pCoreMax, 
    priceSemiMin: pSemiMin, priceSemiMax: pSemiMax, 
    priceFullMin: pFullMin, priceFullMax: pFullMax, 
    finishingStatus: finStat, isAdvancedPricing: isAdvOpen,
    commercialPrices: { adminMin: getRawNum(document.getElementById('fldAdminMin').value)||0, adminMax: getRawNum(document.getElementById('fldAdminMax').value)||0, adminFinish: document.getElementById('fldAdminFinish').value || 'core_shell', commMin: getRawNum(document.getElementById('fldCommMin').value)||0, commMax: getRawNum(document.getElementById('fldCommMax').value)||0, commFinish: document.getElementById('fldCommFinish').value || 'core_shell', clinicMin: getRawNum(document.getElementById('fldClinicMin').value)||0, clinicMax: getRawNum(document.getElementById('fldClinicMax').value)||0, clinicFinish: document.getElementById('fldClinicFinish').value || 'core_shell', recMin: getRawNum(document.getElementById('fldRecMin').value)||0, recMax: getRawNum(document.getElementById('fldRecMax').value)||0, recFinish: document.getElementById('fldRecFinish').value || 'core_shell', },
    maintenanceValue: document.getElementById('fldMaintenanceValue').value.trim() || '', maintenanceType: document.getElementById('fldMaintenanceType').value || 'percent', parkingType: document.getElementById('fldParkingType').value || 'extra', parkingFee: getRawNum(document.getElementById('fldParkingFee').value)||0, projectSize: parseFloat(document.getElementById('fldProjectSize').value) || 0, deliveryDate: document.getElementById('fldDeliveryDate').value.trim(), compoundLocationDetail: document.getElementById('fldLocationDetail').value.trim(), locationLink: document.getElementById('fldLocationLink').value.trim(), cashDiscount: parseFloat(document.getElementById('fldCashDiscount').value) || 0,
    unitTypes: tempUnits.map(u => ({ id: u.id || uid(), bedroomType: u.bedroomType || '', rooms: u.rooms || '', area: parseFloat(u.area) || 0, gardenArea: parseFloat(u.gardenArea) || 0, roofArea: parseFloat(u.roofArea) || 0, price: getRawNum(u.price) || u.price || 0, finishing: u.finishing || 'core_shell' })),
    paymentPlans: tempPlans.map(p => ({ ...p, pricePerMeter: getRawNum(p.pricePerMeter) || 0 })), ministerialDecrees: tempDecrees.filter(d=>d.decreeNumber || d.description),
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  try { 
      if (editingCompoundId) {
          await db.collection('compounds').doc(editingCompoundId).set(data, { merge: true }); 
      } else {
          await db.collection('compounds').add(data);
      }
      document.getElementById('formOverlay').classList.remove('open'); 
      showToast('تم الحفظ 💾'); 
  } catch (error) { 
      alert('خطأ في الحفظ!'); 
  }
}

async function deleteCurrentCompoundFromCloud() { if(!isEditor || !confirm('متأكد من الحذف؟')) return; await db.collection('compounds').doc(viewingCompoundId).delete(); document.getElementById('detailOverlay').classList.remove('open'); showToast('تم الحذف'); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function showToast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); }
function formatNum(n){ if(n === null || n === undefined || n === '') return ''; if(isNaN(n)) return n; return Number(n).toLocaleString('en-US'); }
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function highlightText(text, term) { const escaped = escapeHtml(text); if (!term) return escaped; const escapedTerm = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); try { return escaped.replace(new RegExp('(' + escapedTerm + ')', 'ig'), '<mark>$1</mark>'); } catch (e) { return escaped; } }
function deliveryLabel(v){ const d = DELIVERY_TIMELINES.find(x=>x.value===v); return d ? d.label : '-'; }
function populateDeliverySelects(){ const opts = DELIVERY_TIMELINES.map(d=>`<option value="${d.value}">${d.label}</option>`).join(''); document.getElementById('fldDeliveryDate').innerHTML = opts; }
function toggleMainLoc(mainId, e){ e.stopPropagation(); openMainLocIds[mainId] = !openMainLocIds[mainId]; renderLocationTree(); }

function toggleMobileLoc() {
    const wrap = document.getElementById('locWrapperMobile'); const btn = document.getElementById('mobileLocToggleBtn');
    if(wrap.classList.contains('show')) { wrap.classList.remove('show'); btn.classList.remove('active'); btn.innerHTML = '📍 تصفية بالمناطق والمدن ▼'; } 
    else { wrap.classList.add('show'); btn.classList.add('active'); btn.innerHTML = '📍 إخفاء المناطق ▲'; }
}

function renderLocationTree(){
  const wrap = document.getElementById('locationTree'); const isAllActive = activeLocationIds.length === 0;
  let html = `<div class="sub-loc-tab ${isAllActive ? 'active' : ''}" onclick="selectLocationNode('all')"><span>🌐 كل المشروعات</span><span class="num">${compounds.length}</span></div>`;
  mainLocations.forEach((mainLoc) => { 
      let mainCount = 0; mainLoc.subLocations.forEach(sub => { mainCount += compounds.filter(c => c.locationId === sub.id).length; }); 
      const isOpen = !!openMainLocIds[mainLoc.id]; const isMainActive = activeLocationIds.includes(mainLoc.id);
      html += `<div class="loc-group"><div class="loc-group-header-row"><div class="loc-main-clickable ${isMainActive ? 'active' : ''}" onclick="selectLocationNode('${mainLoc.id}')"><span>📍 ${escapeHtml(mainLoc.name)}</span></div><div style="display:flex; align-items:center; gap:6px;"><span class="num" style="color:var(--text-muted);">${mainCount}</span><span class="arrow-toggle ${isOpen ? 'open' : ''}" onclick="toggleMainLoc('${mainLoc.id}', event)" role="button" tabindex="0">▶</span>${isEditor ? `<button class="loc-del-btn" onclick="deleteMainLocation('${mainLoc.id}')">✕</button>` : ''}</div></div><div class="sub-loc-list ${isOpen ? 'show' : ''}">`; 
      mainLoc.subLocations.forEach(sub => { 
          const subCount = compounds.filter(c => c.locationId === sub.id).length; const isSubActive = activeLocationIds.includes(sub.id);
          html += `<div class="sub-loc-tab ${isSubActive ? 'active' : ''}" onclick="selectLocationNode('${sub.id}')"><span>↳ ${escapeHtml(sub.name)}</span><div style="display:flex; align-items:center; gap:6px;"><span class="num" style="opacity:0.9;">${subCount}</span>${isEditor ? `<button class="loc-del-btn" onclick="event.stopPropagation(); deleteSubLocation('${mainLoc.id}', '${sub.id}')">✕</button>` : ''}</div></div>`; 
      }); 
      html += `</div>${isEditor ? `<div class="add-sub-loc-box"><input id="subInput_${mainLoc.id}" placeholder="+ فرع جديد" onkeydown="if(event.key==='Enter') addSubLocation('${mainLoc.id}')"><button class="btn btn-outline-light btn-pill" style="padding:4px 12px; font-size:10px;" onclick="addSubLocation('${mainLoc.id}')">إضافة</button></div>` : ''}</div>`; 
  }); 
  wrap.innerHTML = html; 
  if(document.getElementById('fldLocation')) document.getElementById('fldLocation').innerHTML = `<option value="">-- لم يتم تحديد فرع --</option>` + mainLocations.map(m => `<optgroup label="${escapeHtml(m.name)}">` + m.subLocations.map(s => `<option value="${s.id}">${escapeHtml(m.name)} ⬅️ ${escapeHtml(s.name)}</option>`).join('') + `</optgroup>`).join('');
}

function selectLocationNode(nodeId){ 
    if(nodeId === 'all') { activeLocationIds = []; } else {
        const index = activeLocationIds.indexOf(nodeId);
        if(index > -1) { activeLocationIds.splice(index, 1); } else { activeLocationIds.push(nodeId); }
    }
    renderLocationTree(); renderGrid(); 
}

async function addMainLocation(){ if(!isEditor) return; const input = document.getElementById('newMainLocInput'); if(!input.value.trim()) return; const newId = uid(); mainLocations.push({ id: newId, name: input.value.trim(), subLocations: [] }); openMainLocIds[newId] = true; input.value = ''; await saveMainLocationsToCloud(); }
async function deleteMainLocation(mainId){ if(!isEditor || !confirm('حذف المنطقة؟')) return; const subIds = mainLocations.find(m => m.id === mainId)?.subLocations.map(s=>s.id) || []; mainLocations = mainLocations.filter(m => m.id !== mainId); const batch = db.batch(); compounds.filter(c => subIds.includes(c.locationId)).forEach(c => { batch.delete(db.collection('compounds').doc(c.id)); }); await batch.commit(); activeLocationIds = activeLocationIds.filter(id => id !== mainId && !subIds.includes(id)); await saveMainLocationsToCloud(); }
async function addSubLocation(mainId){ if(!isEditor) return; const input = document.getElementById(`subInput_${mainId}`); if(!input || !input.value.trim()) return; mainLocations.find(m => m.id === mainId)?.subLocations.push({ id: uid(), name: input.value.trim() }); openMainLocIds[mainId] = true; await saveMainLocationsToCloud(); }
async function deleteSubLocation(mainId, subId){ if(!isEditor || !confirm('حذف الفرع؟')) return; const m = mainLocations.find(m => m.id === mainId); if(m) m.subLocations = m.subLocations.filter(s => s.id !== subId); const batch = db.batch(); compounds.filter(c => c.locationId === subId).forEach(c => { batch.delete(db.collection('compounds').doc(c.id)); }); await batch.commit(); activeLocationIds = activeLocationIds.filter(id => id !== subId); await saveMainLocationsToCloud(); }
function selectProjectType(type, btnElem){ activeProjectType = type; document.querySelectorAll('.type-nav-btn').forEach(b => b.classList.remove('active')); btnElem.classList.add('active'); renderGrid(); }

let searchDebounceTimer = null;
function handleSearchInput() {
    const val = document.getElementById('fSearchText').value;
    const clearBtn = document.getElementById('searchClearBtn'); if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(applyFilters, 300);
}
function clearSearchOnly() {
    document.getElementById('fSearchText').value = '';
    const clearBtn = document.getElementById('searchClearBtn'); if (clearBtn) clearBtn.style.display = 'none';
    clearTimeout(searchDebounceTimer);
    applyFilters();
    document.getElementById('fSearchText').focus();
}

function applyFilters(){ 
    const checkedTypes = Array.from(document.querySelectorAll('.prop-type-cb:checked')).map(cb => cb.value);
    filters = { 
        searchText: (document.getElementById('fSearchText').value || '').trim().toLowerCase(), 
        minPrice: getRawNum(document.getElementById('fMinPrice').value), 
        maxPrice: getRawNum(document.getElementById('fMaxPrice').value), 
        downPaymentTarget: getRawNum(document.getElementById('fDownPayment').value), 
        maxMonthlyInstallment: getRawNum(document.getElementById('fMonthlyInstallment').value),
        propertyTypes: checkedTypes.length > 0 ? checkedTypes : null,
        bedrooms: selectedBeds.length > 0 ? selectedBeds : null,
        sortOrder: document.getElementById('fSortOrder').value || 'default'
    }; 
    closeAllDropdowns(); renderGrid(); 
}

function resetFilters(){ 
    document.getElementById('fSearchText').value = ''; document.getElementById('fMinPrice').value = ''; document.getElementById('fMaxPrice').value = ''; document.getElementById('fDownPayment').value = ''; document.getElementById('fMonthlyInstallment').value = ''; document.getElementById('fSortOrder').value = 'default';
    document.querySelectorAll('.prop-type-cb').forEach(cb => cb.checked = false); document.querySelectorAll('.pill').forEach(p => p.classList.remove('active')); selectedBeds = [];
    const clearBtn = document.getElementById('searchClearBtn'); if (clearBtn) clearBtn.style.display = 'none';
    clearTimeout(searchDebounceTimer);
    applyFilters(); 
}

function findSubLocationName(subId){ for(let i=0; i<mainLocations.length; i++){ let m=mainLocations[i]; if(m && m.subLocations) { let s = m.subLocations.find(x => x.id === subId); if(s) return `${m.name} ⬅️ ${s.name}`; } } return '-'; }

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
        <div class="dossier-meta" style="margin-top:15px; grid-template-columns: 1fr;">
            <div class="meta-chip" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.05); border:1px dashed var(--border-color);">
                <span>اضغط لاختيار المرحلة (${group.length})</span>
                <div style="font-size:16px;">➤</div>
            </div>
        </div>
    </div>`;
}

function openPhasesModal(projName, compName) {
    let group = compounds.filter(c => String(c.projectName||'') === projName && String(c.companyName||'') === compName);
    document.getElementById('phasesTitle').textContent = `مراحل مشروع: ${projName}`;
    
    let html = group.map(c => {
        return `<div class="detail-item" style="cursor:pointer; margin-bottom:10px;" onclick="closeModal('phasesOverlay'); setTimeout(()=>openDetail('${c.id}'), 300)">
            <div style="color:var(--danger); font-size:18px; font-weight:800; margin-bottom:5px;">${escapeHtml(c.phaseName || 'المرحلة الأساسية')}</div>
            <div style="font-size:12px; color:var(--text-muted);">عمارات: <span class="num">${c.floors ? escapeHtml(c.floors) : '-'}</span> | تسليم: ${deliveryLabel(c.deliveryDate)}</div>
        </div>`;
    }).join('');
    
    document.getElementById('phasesBody').innerHTML = html;
    document.getElementById('phasesOverlay').classList.add('open');
}

function updateUnitData(id, field, val) {
    const u = tempUnits.find(x => x.id === id);
    if (!u) return;
    
    if (field === 'bedroomType') { 
        if (val === '__manage__') { openTypesManager(); renderUnitRows(); return; }
        u.bedroomType = val; 
        renderUnitRows(); 
    } 
    else if (field === 'rooms') { u.rooms = val; return; }
    else if (field === 'price') { 
        let raw = getRawNum(val);
        if(raw === null) { u.price = ''; u.lockedPrice = false; } 
        else if (isNaN(raw)) { u.price = val; u.lockedPrice = true; } 
        else { u.price = raw; u.lockedPrice = true; }
        return; 
    } 
    else if (field === 'finishing') { 
        u.finishing = val; 
    }
    else if (field === 'area' || field === 'gardenArea' || field === 'roofArea') { u[field] = parseFloat(val) || 0; }

    if (u.lockedPrice) return;

    const pType = document.getElementById('fldProjectType').value;
    let meterPrice = 0;

    if (pType === 'commercial') {
        meterPrice = getAverageCommercialPrice(u.bedroomType);
    } else {
        let pSingle = getRawNum(document.getElementById('fldPriceMeter').value) || 0;
        let pMin = getRawNum(document.getElementById('fldPriceMeterMin').value) || 0;
        let pMax = getRawNum(document.getElementById('fldPriceMeterMax').value) || 0;
        let pAvg = (pMin > 0 && pMax > 0) ? (pMin + pMax) / 2 : (pMin || pMax || 0);

        let isAdvOpen = document.getElementById('advPricingWrap').style.display !== 'none';
        
        let pCoreAvg = 0, pSemiAvg = 0, pFullAvg = 0;
        if (isAdvOpen) {
            let pCoreMin = getRawNum(document.getElementById('fldPriceCoreMin').value) || 0;
            let pCoreMax = getRawNum(document.getElementById('fldPriceCoreMax').value) || 0;
            pCoreAvg = (pCoreMin > 0 && pCoreMax > 0) ? (pCoreMin + pCoreMax) / 2 : (pCoreMin || pCoreMax || getRawNum(document.getElementById('fldPriceCore').value) || 0);

            let pSemiMin = getRawNum(document.getElementById('fldPriceSemiMin').value) || 0;
            let pSemiMax = getRawNum(document.getElementById('fldPriceSemiMax').value) || 0;
            pSemiAvg = (pSemiMin > 0 && pSemiMax > 0) ? (pSemiMin + pSemiMax) / 2 : (pSemiMin || pSemiMax || getRawNum(document.getElementById('fldPriceSemi').value) || 0);

            let pFullMin = getRawNum(document.getElementById('fldPriceFullMin').value) || 0;
            let pFullMax = getRawNum(document.getElementById('fldPriceFullMax').value) || 0;
            pFullAvg = (pFullMin > 0 && pFullMax > 0) ? (pFullMin + pFullMax) / 2 : (pFullMin || pFullMax || getRawNum(document.getElementById('fldPriceFull').value) || 0);
        }

        if (isAdvOpen && u.finishing === 'core_shell' && pCoreAvg > 0) meterPrice = pCoreAvg;
        else if (isAdvOpen && u.finishing === 'semi' && pSemiAvg > 0) meterPrice = pSemiAvg;
        else if (isAdvOpen && u.finishing === 'full' && pFullAvg > 0) meterPrice = pFullAvg;
        else if (pAvg > 0) meterPrice = pAvg;
        else meterPrice = pSingle;
    }
    
    if (meterPrice > 0) {
        let mainPrice = (u.area || 0) * meterPrice; 
        let gardenPrice = (u.gardenArea || 0) * (meterPrice / 3); 
        let roofPrice = (u.roofArea || 0) * (meterPrice / 3);
        
        if (mainPrice > 0 || gardenPrice > 0 || roofPrice > 0) {
            u.price = Math.round(mainPrice + gardenPrice + roofPrice); 
            let pInput = document.getElementById(`price-input-${u.id}`);
            if(pInput) pInput.value = formatNum(u.price);
        }
    } else {
        u.price = '';
        let pInput = document.getElementById(`price-input-${u.id}`);
        if(pInput) pInput.value = '';
    }
}

function renderUnitRows(){ 
    const pType = document.getElementById('fldProjectType').value; 
    let typeOptions = pType === 'commercial' ? appSettings.commTypes : appSettings.resTypes;
    
    tempUnits.sort((a, b) => {
        let orderA = UNIT_ORDER[a.bedroomType] || 99;
        let orderB = UNIT_ORDER[b.bedroomType] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return (parseFloat(a.area) || 0) - (parseFloat(b.area) || 0);
    });
    
    document.getElementById('unitRows').innerHTML = tempUnits.map(u=> { 
        let selectOptions = `<option value="" disabled ${!u.bedroomType ? 'selected' : ''}>اختر النوع...</option>`;
        if (u.bedroomType && !typeOptions.includes(u.bedroomType) && u.bedroomType !== '__manage__') {
             selectOptions += `<option value="${escapeHtml(u.bedroomType)}" selected>${escapeHtml(u.bedroomType)}</option>`;
        }
        selectOptions += typeOptions.map(t => `<option value="${escapeHtml(t)}" ${u.bedroomType === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
        selectOptions += `<option value="__manage__" style="color:var(--danger); font-weight:bold;">+ إضافة/حذف نوع ⚙️</option>`;

        return `<div class="repeat-row" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <select style="flex:1.2; min-width:90px;" onchange="updateUnitData('${u.id}','bedroomType',this.value)">${selectOptions}</select>
                    <input type="number" placeholder="غرف" class="num" style="flex:0.6; min-width:55px;" value="${u.rooms||''}" oninput="updateUnitData('${u.id}', 'rooms', this.value)">
                    <input type="number" placeholder="مباني(م²)" class="num" style="flex:1; min-width:60px;" value="${u.area||''}" oninput="updateUnitData('${u.id}', 'area', this.value)">
                    <input type="number" placeholder="جاردن(م²)" class="num" style="flex:1; min-width:60px;" value="${u.gardenArea||''}" oninput="updateUnitData('${u.id}', 'gardenArea', this.value)">
                    <input type="number" placeholder="روف(م²)" class="num" style="flex:1; min-width:60px;" value="${u.roofArea||''}" oninput="updateUnitData('${u.id}', 'roofArea', this.value)">
                    <select style="flex:1; min-width:85px; font-size:11px;" onchange="updateUnitData('${u.id}','finishing',this.value)">
                        <option value="" disabled ${!u.finishing ? 'selected' : ''}>اختر التشطيب</option>
                        <option value="core_shell" ${u.finishing==='core_shell'?'selected':''}>طوب أحمر</option>
                        <option value="semi" ${u.finishing==='semi'?'selected':''}>نصف تشطيب</option>
                        <option value="full" ${u.finishing==='full'?'selected':''}>تشطيب كامل</option>
                    </select>
                    <input type="text" id="price-input-${u.id}" class="num" placeholder="إجمالي السعر" style="flex:1.5; min-width:90px; color:var(--primary); font-weight:bold;" value="${u.price ? formatNum(u.price) : ''}" oninput="formatInput(this); updateUnitData('${u.id}','price',this.value)" autocomplete="off">
                    <button class="row-del" style="flex-shrink:0;" onclick="removeUnitRow('${u.id}')">✕</button>
                </div>` 
    }).join('') || '<div style="color:var(--text-muted); text-align:center; padding:10px;">مفيش وحدات مسجلة!</div>'; 
}

function addPlanRow(){ tempPlans.push({id:uid(), name:'', discountPercent:'', downPaymentPercent:'', years:'', frequency:'12', pricePerMeter:'', notes:'', customBullets:[]}); renderPlanRows(); }
function removePlanRow(id){ tempPlans = tempPlans.filter(p=>p.id!==id); renderPlanRows(); }
function addBulletRow(pId){ tempPlans.find(p=>p.id===pId)?.customBullets.push({id:uid(), type:'annual', percent:'', selectedYears:[]}); renderPlanRows(); }
function removeBulletRow(pId, bId){ const p=tempPlans.find(x=>x.id===pId); if(p && p.customBullets) p.customBullets=p.customBullets.filter(b=>b.id!==bId); renderPlanRows(); }

function toggleYearSelection(pId, bId, y){ 
    const p = tempPlans.find(x=>x.id===pId); 
    if(p && p.customBullets){ 
        const b = p.customBullets.find(x=>x.id===bId);
        if(b) {
            if(!b.selectedYears) b.selectedYears = []; 
            const i = b.selectedYears.indexOf(y); 
            i > -1 ? b.selectedYears.splice(i,1) : b.selectedYears.push(y); 
            renderPlanRows(); 
        }
    } 
}

function renderPlanRows(){ 
    document.getElementById('planRows').innerHTML = tempPlans.map(p=>`<div class="plan-card">
        <div class="plan-card-header">
            <input placeholder="اسم الخطة" style="flex:2; min-width:120px;" value="${escapeHtml(p.name)}" oninput="updatePlan('${p.id}','name',this.value)" autocomplete="off">
            <input type="number" placeholder="% خصم" class="num" style="width:70px; flex-shrink:0;" value="${p.discountPercent||''}" oninput="updatePlan('${p.id}','discountPercent',this.value)">
            <input type="number" placeholder="% مقدم" class="num" style="width:70px; flex-shrink:0;" value="${p.downPaymentPercent}" oninput="updatePlan('${p.id}','downPaymentPercent',this.value)">
            <input type="number" placeholder="سنوات" class="num" style="width:70px; flex-shrink:0;" value="${p.years}" oninput="updatePlan('${p.id}','years',this.value)">
            <select style="min-width:100px; flex-shrink:0;" onchange="updatePlan('${p.id}','frequency',this.value)">${Object.entries(FREQ_LABEL).map(([k,v])=>`<option value="${k}" ${p.frequency==k?'selected':''}>${v}</option>`).join('')}</select>
            <input type="text" placeholder="سعر متر الخطة (اختياري)" class="num" style="width:140px; flex-shrink:0;" value="${p.pricePerMeter ? formatNum(p.pricePerMeter) : ''}" oninput="formatInput(this); updatePlan('${p.id}','pricePerMeter',this.value)" autocomplete="off">
            <button class="row-del" style="flex-shrink:0;" onclick="removePlanRow('${p.id}')">✕</button>
        </div>
        <input placeholder="ملاحظات اضافية" style="width:100%; margin-top:10px;" value="${escapeHtml(p.notes||'')}" oninput="updatePlan('${p.id}','notes',this.value)" autocomplete="off">
        <div class="bullets-container">
            ${(p.customBullets || []).map(b=>`<div class="bullet-row" style="display:flex; gap:10px; align-items:center;">
                    <select style="flex:1; min-width:100px;" onchange="updateBullet('${p.id}','${b.id}','type',this.value)">
                        <option value="annual" ${b.type==='annual'?'selected':''}>دفعة سنوية</option>
                        <option value="deferred" ${b.type==='deferred'?'selected':''}>مؤجلة</option>
                        <option value="delivery" ${b.type==='delivery'?'selected':''}>استلام</option>
                        <option value="after_3m" ${b.type==='after_3m'?'selected':''}>بعد 3 شهور</option>
                        <option value="after_6m" ${b.type==='after_6m'?'selected':''}>بعد 6 شهور</option>
                        <option value="after_9m" ${b.type==='after_9m'?'selected':''}>بعد 9 شهور</option>
                    </select>
                    <input type="number" placeholder="%" class="num" style="width:80px; flex-shrink:0;" value="${b.percent}" oninput="updateBullet('${p.id}','${b.id}','percent',this.value)">
                    <button class="row-del" style="flex-shrink:0;" onclick="removeBulletRow('${p.id}','${b.id}')">✕</button>
                </div>
                ${b.type==='annual'?`<div class="years-pills" style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; justify-content:center; width:100%;">${[1,2,3,4,5,6,7].map(yr=>`<div class="year-pill ${(b.selectedYears||[]).includes(yr)?'selected':''}" onclick="toggleYearSelection('${p.id}','${b.id}',${yr})">${yr}</div>`).join('')}</div>`:''}
            `).join('')}
            <button class="btn btn-outline-light w-100 btn-pill" style="margin-top:10px;" onclick="addBulletRow('${p.id}')">+ دفعة خاصة</button>
        </div>
    </div>`).join('') || '<div style="color:var(--text-muted); text-align:center; padding:10px;">مفيش خطط سداد!</div>'; 
}

function updatePlan(id, field, val){ 
    const p = tempPlans.find(x=>x.id===id); 
    if(p) {
        if (field === 'name' || field === 'notes' || field === 'frequency') { p[field] = val; } 
        else if (field === 'pricePerMeter') { p[field] = getRawNum(val); } 
        else { p[field] = parseFloat(val)||0; }
    } 
}

function updateBullet(pId, bId, field, val){ 
    const p = tempPlans.find(x=>x.id===pId); 
    if(p && p.customBullets){ 
        const b = p.customBullets.find(x=>x.id===bId); 
        if(b){ 
            b[field] = field==='type'?val:(parseFloat(val)||0); 
            if(field==='type') renderPlanRows();
        } 
    } 
}

function addDecreeRow(){ tempDecrees.push({id:uid(), decreeNumber:'', description:'', date:''}); renderDecreeRows(); }
function removeDecreeRow(id){ tempDecrees = tempDecrees.filter(d=>d.id!==id); renderDecreeRows(); }
function renderDecreeRows(){ document.getElementById('decreeRows').innerHTML = tempDecrees.map(d=>`<div class="repeat-row" style="display:flex; gap:10px;"><input placeholder="الرقم" class="num" style="width:100px;" value="${escapeHtml(d.decreeNumber)}" oninput="tempDecrees.find(x=>x.id==='${d.id}').decreeNumber=this.value" autocomplete="off"><input placeholder="الوصف" style="flex:1;" value="${escapeHtml(d.description)}" oninput="tempDecrees.find(x=>x.id==='${d.id}').description=this.value" autocomplete="off"><input type="date" value="${d.date}" oninput="tempDecrees.find(x=>x.id==='${d.id}').date=this.value"><button class="row-del" onclick="removeDecreeRow('${d.id}')">✕</button></div>`).join(''); }

function openDetail(id){
  const c = compounds.find(x=>x.id===id); if(!c) return; viewingCompoundId = id;
  const availTypes = Array.from(new Set((c.unitTypes||[]).map(u => getUnitEnName(u.bedroomType))));
  availTypes.sort((a,b) => (UNIT_ORDER[a]||99) - (UNIT_ORDER[b]||99));
  
  activeDetailCategory = availTypes.length ? availTypes[0] : null; 
  if (activeDetailCategory) {
      let filtered = (c.unitTypes||[]).filter(u => getUnitEnName(u.bedroomType) === activeDetailCategory);
      filtered.sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0));
      activeDetailUnitId = filtered.length > 0 ? filtered[0].id : null;
  }
  
  renderDetailModalContent(); document.getElementById('detailOverlay').classList.add('open');
}

function setDetailCategory(catKey) { 
    activeDetailCategory = catKey; 
    const c = compounds.find(x => x.id === viewingCompoundId); 
    if (c && c.unitTypes) { 
        const matched = c.unitTypes.filter(u => getUnitEnName(u.bedroomType) === catKey); 
        matched.sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0));
        if (matched.length > 0) activeDetailUnitId = matched[0].id; 
    } 
    renderDetailModalContent(); 
}

function setDetailUnit(unitId) { activeDetailUnitId = unitId; renderDetailModalContent(); }
function editCurrentCompound(){ const c = compounds.find(x=>x.id===viewingCompoundId); if(!c) return; closeModal('detailOverlay'); openCompoundForm(c); }

function renderDetailModalContent() {
  const c = compounds.find(x => x.id === viewingCompoundId); if (!c) return;
  
  let modalTitle = c.projectName;
  if(c.phaseName) modalTitle += ` - ${c.phaseName}`;
  document.getElementById('detailTitle').textContent = modalTitle;
  
  document.getElementById('btnEditCompound').style.display = isEditor ? 'inline-block' : 'none';
  document.getElementById('btnDeleteCompound').style.display = isEditor ? 'inline-block' : 'none';

  let finishText = FINISHING_TYPES[c.finishingStatus] || '-'; let pText = '';
  
  let parkingText = '';
  if (c.parkingType === 'included') parkingText = 'شامل السعر';
  else if (c.parkingType === 'optional') parkingText = c.parkingFee ? 'اختياري (' + formatNum(c.parkingFee) + ' ج)' : 'اختياري';
  else parkingText = c.parkingFee ? formatNum(c.parkingFee) + ' ج' : 'رسوم إضافية';

  if (c.projectType === 'commercial') {
      finishText = 'متنوع (بالأسعار)';
      let cp = c.commercialPrices || {}; let parts = []; const fName = { core_shell: 'طوب', semi: 'نصف', full: 'كامل' };
      if (cp.adminMin || cp.adminMax) parts.push(`<b>إداري:</b> <span class="num">${formatNum(cp.adminMin)} - ${formatNum(cp.adminMax)}</span> <span style="font-size:10px;">(${fName[cp.adminFinish||'core_shell']})</span>`);
      if (cp.commMin || cp.commMax) parts.push(`<b>تجاري:</b> <span class="num">${formatNum(cp.commMin)} - ${formatNum(cp.commMax)}</span> <span style="font-size:10px;">(${fName[cp.commFinish||'core_shell']})</span>`);
      if (cp.clinicMin || cp.clinicMax) parts.push(`<b>طبي:</b> <span class="num">${formatNum(cp.clinicMin)} - ${formatNum(cp.clinicMax)}</span> <span style="font-size:10px;">(${fName[cp.clinicFinish||'core_shell']})</span>`);
      if (cp.recMin || cp.recMax) parts.push(`<b>ترفيهي:</b> <span class="num">${formatNum(cp.recMin)} - ${formatNum(cp.recMax)}</span> <span style="font-size:10px;">(${fName[cp.recFinish||'core_shell']})</span>`);
      pText = parts.length > 0 ? `<div style="display:flex; flex-direction:column; gap:4px; font-size:14px;">${parts.join('')}</div>` : `<span class="num">${formatNum(c.pricePerMeterMin||0)}</span> ج`;
  } else { 
      let pParts = [];
      if(c.isAdvancedPricing) {
          if(c.pricePerMeterMin > 0 || c.pricePerMeterMax > 0) {
              let rng = (c.pricePerMeterMin > 0 && c.pricePerMeterMax > 0 && c.pricePerMeterMin !== c.pricePerMeterMax) ? formatNum(c.pricePerMeterMin) + ' - ' + formatNum(c.pricePerMeterMax) : formatNum(c.pricePerMeterMin || c.pricePerMeterMax);
              pParts.push(`<b>نطاق السعر:</b> <span class="num">${rng}</span> ج`);
          } else if (c.pricePerMeter > 0) {
              pParts.push(`<b>سعر المتر:</b> <span class="num">${formatNum(c.pricePerMeter)}</span> ج`);
          }
          
          let fPriceCore = (c.priceCoreMin > 0 && c.priceCoreMax > 0 && c.priceCoreMin !== c.priceCoreMax) ? `${formatNum(c.priceCoreMin)} - ${formatNum(c.priceCoreMax)}` : formatNum(c.priceCoreMin || c.priceCoreMax || c.priceCore || 0);
          if (c.priceCoreMin > 0 || c.priceCoreMax > 0 || c.priceCore > 0) pParts.push(`<b>طوب أحمر:</b> <span class="num">${fPriceCore}</span> ج`);
          
          let fPriceSemi = (c.priceSemiMin > 0 && c.priceSemiMax > 0 && c.priceSemiMin !== c.priceSemiMax) ? `${formatNum(c.priceSemiMin)} - ${formatNum(c.priceSemiMax)}` : formatNum(c.priceSemiMin || c.priceSemiMax || c.priceSemi || 0);
          if (c.priceSemiMin > 0 || c.priceSemiMax > 0 || c.priceSemi > 0) pParts.push(`<b>نصف تشطيب:</b> <span class="num">${fPriceSemi}</span> ج`);
          
          let fPriceFull = (c.priceFullMin > 0 && c.priceFullMax > 0 && c.priceFullMin !== c.priceFullMax) ? `${formatNum(c.priceFullMin)} - ${formatNum(c.priceFullMax)}` : formatNum(c.priceFullMin || c.priceFullMax || c.priceFull || 0);
          if (c.priceFullMin > 0 || c.priceFullMax > 0 || c.priceFull > 0) pParts.push(`<b>تشطيب كامل:</b> <span class="num">${fPriceFull}</span> ج`);
      } else {
          if (c.pricePerMeter > 0) pParts.push(`<b>سعر المتر:</b> <span class="num">${formatNum(c.pricePerMeter)}</span> ج`);
          if (c.pricePerMeterMin > 0 || c.pricePerMeterMax > 0) {
              let rng = (c.pricePerMeterMin > 0 && c.pricePerMeterMax > 0 && c.pricePerMeterMin !== c.pricePerMeterMax) ? formatNum(c.pricePerMeterMin) + ' - ' + formatNum(c.pricePerMeterMax) : formatNum(c.pricePerMeterMin || c.pricePerMeterMax);
              pParts.push(`<b>نطاق السعر:</b> <span class="num">${rng}</span> ج`);
          }
      }
      pText = pParts.length > 0 ? `<div style="display:flex; flex-direction:column; gap:4px; font-size:14px;">${pParts.join('')}</div>` : `-`;
  }
  
  const locLinkHtml = c.locationLink ? `<br><a href="${escapeHtml(c.locationLink)}" target="_blank" style="color:var(--primary); font-size:12px; font-weight:bold; background:var(--item-bg); padding:6px 12px; border-radius:4px; border:1px solid var(--primary); display:inline-block; margin-top:5px;">📍 الخريطة</a>` : '';
  
  let maintText = c.maintenanceValue ? (c.maintenanceType === 'per_meter' ? `${c.maintenanceValue} ج/م²` : `${c.maintenanceValue}%`) : '-';

  let html = `<div class="detail-grid"><div class="detail-item"><b>النوع</b><span>${PROJECT_TYPES[c.projectType || 'residential']}</span></div><div class="detail-item"><b>المطور</b><span>${escapeHtml(c.companyName || '-')}</span></div><div class="detail-item"><b>المالك</b><span>${escapeHtml(c.ownerName || '-')}</span></div><div class="detail-item"><b>الاستشاري</b><span>${escapeHtml(c.consultant || '-')}</span></div><div class="detail-item"><b>الفرع</b><span>${escapeHtml(findSubLocationName(c.locationId))}</span></div><div class="detail-item"><b>التسليم والتشطيب</b><span>${deliveryLabel(c.deliveryDate)} | ${finishText}</span></div><div class="detail-item"><b>أسعار المتر</b><span style="color:var(--primary);">${pText}</span></div><div class="detail-item"><b>الصيانة والجراج</b><span>صيانة: <span class="num">${maintText}</span> | جراج: <span class="num">${parkingText}</span></span></div><div class="detail-item"><b>المساحة الإجمالية</b><span><span class="num">${c.projectSize ? c.projectSize : '-'}</span> فدان</span></div><div class="detail-item"><b>ارتفاع العمارات</b><span class="num">${c.floors ? escapeHtml(c.floors) : '-'}</span></div><div class="detail-item full"><b>الموقع التفصيلي</b><span>${escapeHtml(c.compoundLocationDetail || '-')} ${locLinkHtml}</span></div></div>`;

  const grouped = {}; 
  (c.unitTypes||[]).forEach(u => { 
      let t = getUnitEnName(u.bedroomType); 
      (grouped[t] = grouped[t] || []).push(u); 
  }); 
  const cats = Object.keys(grouped).sort((a,b) => (UNIT_ORDER[a]||99) - (UNIT_ORDER[b]||99));
  
  if(cats.length){
    if(!activeDetailCategory || !grouped[activeDetailCategory]) activeDetailCategory = cats[0]; 
    if(!activeDetailUnitId && grouped[activeDetailCategory] && grouped[activeDetailCategory].length > 0) {
        grouped[activeDetailCategory].sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0));
        activeDetailUnitId = grouped[activeDetailCategory][0].id;
    }
    
    html += `<div class="section-label">الأسعار والكاش</div><div class="unit-cat-tabs">` + cats.map(k => {
        return `<button class="unit-cat-btn ${k === activeDetailCategory ? 'active' : ''}" onclick="setDetailCategory('${k}')">${escapeHtml(k)}</button>`;
    }).join('') + `</div>`;
    
    const fNamesAr = { 'core_shell': 'طوب أحمر', 'semi': 'نصف تشطيب', 'full': 'تشطيب كامل' };
    
    html += `<div class="size-picker-container">` + (grouped[activeDetailCategory] || []).sort((a,b) => (parseFloat(a.area)||0) - (parseFloat(b.area)||0)).map(u => {
        let rmText = u.rooms ? ` | <span class="num">${u.rooms}</span> غرف` : '';
        let gText = u.gardenArea ? ` <span style="color:var(--success); font-size:11px; font-weight:bold;">+ ${u.gardenArea}m² Garden</span>` : '';
        let rText = u.roofArea ? ` <span style="color:var(--danger); font-size:11px; font-weight:bold;">+ ${u.roofArea}m² Roof</span>` : '';
        let fText = u.finishing ? ` | ${fNamesAr[u.finishing]}` : '';
        let pText = u.price ? formatNum(u.price) + ' ج' : 'حسب المتر';
        return `<div class="size-chip ${u.id === activeDetailUnitId ? 'active' : ''}" onclick="setDetailUnit('${u.id}')"><span class="num">${u.area}</span>m²${rmText}${gText}${rText}${fText} | <span class="num">${pText}</span></div>`
    }).join('') + `</div>`;
    
    const sUnit = (c.unitTypes || []).find(u => u.id === activeDetailUnitId) || (grouped[activeDetailCategory] ? grouped[activeDetailCategory][0] : null);
    
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
        html += `<div class="cash-discount-box">
                    <div class="cash-row"><span>السعر الأساسي</span><b class="num">${formatNum(sUnitNumericPrice)} ج</b></div>
                    <div class="cash-row highlight"><span>قيمة خصم الكاش (${cashDiscount}%)</span><b class="num">- ${formatNum(Math.round(discountAmount))} ج</b></div>
                    <div class="cash-row final"><span>النهائي (كاش)</span><b class="num">${formatNum(Math.round(finalCashPrice))} ج</b></div>
                 </div>`;
    }

    if(sUnit && c.paymentPlans && c.paymentPlans.length > 0 && !isTextPrice && sUnitNumericPrice > 0){
      html += `<div class="category-box"><table class="spec-table"><tr><th>الخطة</th><th>سعر الوحدة</th><th>مقدم</th><th>دفعات</th><th>قسط شهري</th><th>قسط ربع سنوي</th></tr>`;
      c.paymentPlans.forEach(p => { 
          let planBasePrice = sUnitNumericPrice;
          let planMeterText = '';
          
          if (p.pricePerMeter > 0) {
              let effArea = (sUnit.area || 0) + (sUnit.gardenArea || 0)/3 + (sUnit.roofArea || 0)/3;
              planBasePrice = Math.round(effArea * p.pricePerMeter);
              planMeterText = `<br><span style="color:var(--primary); font-size:10px; background:var(--item-bg); padding:2px 6px; border-radius:4px; border:1px dashed var(--primary); display:inline-block; margin-top:4px;">سعر المتر: ${formatNum(p.pricePerMeter)} ج</span>`;
          }
          
          const r = calcInstallmentWithDiscount(planBasePrice, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
          
          let planNameCol = `<b>${escapeHtml(p.name)}</b>${planMeterText}`;
          if (p.discountPercent > 0) planNameCol += `<br><small style="color:var(--danger); font-weight:bold; display:block; margin-top:4px;">خصم ${p.discountPercent}%</small>`;
          
          let unitPriceCol = `<b class="num">${formatNum(planBasePrice)} ج</b>`;
          if (p.discountPercent > 0) unitPriceCol = `<del style="color:var(--text-muted);font-size:11px;" class="num">${formatNum(planBasePrice)}</del><br><span style="color:var(--success); font-weight:bold;" class="num">${formatNum(Math.round(r.netTotal))} ج</span>`;

          html += `<tr>
              <td>${planNameCol}</td>
              <td>${unitPriceCol}</td>
              <td><span class="num">${formatNum(Math.round(r.downPayment))} ج</span><br><small>(%${p.downPaymentPercent || 0})</small></td>
              <td class="num">${r.bulletsSummary.map(b => b.label).join('<br>') || '-'}</td>
              <td style="color:var(--primary);" class="num"><b>${formatNum(Math.round(r.monthlyEquivalent))} ج</b></td>
              <td class="num"><b>${formatNum(Math.round(r.quarterlyEquivalent))} ج</b></td>
          </tr>`; 
      }); 
      html += `</table></div>`;
    }
  } 
  
  html += `<div class="section-label" style="margin-top:40px; color:var(--success); border-color:var(--success);">🧮 الحاسبة السريعة للمشروع</div>
           <p style="font-size:12px; color:var(--text-muted); margin-bottom:15px;">اكتب المساحة عشان تحسبلها الأقساط على كل خطط السداد الخاصة بالمشروع ده فوراً.</p>
           <div style="display:flex; gap:10px; background:var(--item-bg); padding:15px; border-radius:var(--radius-card); border:1px solid var(--border-color); margin-bottom:20px; align-items:center; flex-wrap:wrap;">
               <input type="number" id="miniCalcArea" placeholder="مباني (م²)" class="num" style="flex:1; min-width:120px; padding:10px; border-radius:var(--radius-input); background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-main); outline:none;" oninput="runProjectMiniCalc('${c.id}')">
               <input type="number" id="miniCalcGarden" placeholder="جاردن (م²)" class="num" style="flex:1; min-width:100px; padding:10px; border-radius:var(--radius-input); background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-main); outline:none;" oninput="runProjectMiniCalc('${c.id}')">
               <input type="number" id="miniCalcRoof" placeholder="روف (م²)" class="num" style="flex:1; min-width:100px; padding:10px; border-radius:var(--radius-input); background:var(--card-bg); border:1px solid var(--border-color); color:var(--text-main); outline:none;" oninput="runProjectMiniCalc('${c.id}')">
           </div>
           <div id="miniCalcResult"></div>`;

  document.getElementById('detailBody').innerHTML = html;
}

window.runProjectMiniCalc = function(cId) {
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

    if(avgPrice === 0) { resultDiv.innerHTML = '<div style="color:var(--danger); padding:10px; border:1px dashed var(--danger); text-align:center; background:rgba(220,38,38,0.05); border-radius:8px;">لا يوجد متوسط سعر متر مسجل لهذا المشروع.</div>'; return; }

    let effArea = area + (garden/3) + (roof/3);
    let basePrice = Math.round(effArea * avgPrice);

    let html = '';
    let cashDiscount = c.cashDiscount || 0;
    if (cashDiscount > 0) {
        let discountAmount = basePrice * (cashDiscount / 100);
        let finalCashPrice = basePrice - discountAmount;
        html += `<div style="border:2px dashed var(--success); padding:15px; background:rgba(16,185,129,0.05); border-radius:8px; display:flex; justify-content:space-around; align-items:center; margin-bottom:20px;">
                    <div style="text-align:center;"><span>السعر الأساسي</span><br><b class="num" style="font-size:22px;">${formatNum(basePrice)} ج</b></div>
                    <div style="text-align:center; color:var(--danger);"><span>خصم الكاش (${cashDiscount}%)</span><br><b class="num" style="font-size:22px;">- ${formatNum(Math.round(discountAmount))} ج</b></div>
                    <div style="text-align:center; color:var(--success);"><span>النهائي (كاش)</span><br><b class="num" style="font-size:26px;">${formatNum(Math.round(finalCashPrice))} ج</b></div>
                 </div>`;
    }

    if(c.paymentPlans && c.paymentPlans.length > 0){
      html += `<div class="category-box"><table class="spec-table"><tr><th>الخطة</th><th>سعر الوحدة</th><th>مقدم</th><th>دفعات</th><th>قسط شهري</th><th>قسط ربع سنوي</th></tr>`;
      c.paymentPlans.forEach(p => { 
          let planBasePrice = basePrice;
          let planMeterText = '';
          
          if (p.pricePerMeter > 0) {
              planBasePrice = Math.round(effArea * p.pricePerMeter);
              planMeterText = `<br><span style="color:var(--primary); font-size:10px; font-weight:800; background:var(--item-bg); padding:2px 6px; border-radius:4px; border:1px dashed var(--primary); display:inline-block; margin-top:4px;">سعر المتر: ${formatNum(p.pricePerMeter)} ج</span>`;
          }
          
          const r = calcInstallmentWithDiscount(planBasePrice, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
          
          let planNameCol = `<b>${escapeHtml(p.name)}</b>${planMeterText}`;
          if (p.discountPercent > 0) planNameCol += `<br><small style="color:var(--danger); font-weight:bold; display:block; margin-top:4px;">خصم ${p.discountPercent}%</small>`;
          
          let unitPriceCol = `<b class="num" style="font-size:18px;">${formatNum(planBasePrice)} ج</b>`;
          if (p.discountPercent > 0) unitPriceCol = `<del style="color:var(--text-muted);font-size:12px;" class="num">${formatNum(planBasePrice)}</del><br><span style="color:var(--success); font-weight:bold;" class="num">${formatNum(Math.round(r.netTotal))} ج</span>`;

          html += `<tr>
              <td>${planNameCol}</td>
              <td>${unitPriceCol}</td>
              <td><span class="num" style="font-size:18px;">${formatNum(Math.round(r.downPayment))} ج</span><br><small>(%${p.downPaymentPercent || 0})</small></td>
              <td class="num">${r.bulletsSummary.map(b => b.label).join('<br>') || '-'}</td>
              <td style="color:var(--primary);" class="num"><b>${formatNum(Math.round(r.monthlyEquivalent))} ج</b></td>
              <td class="num"><b>${formatNum(Math.round(r.quarterlyEquivalent))} ج</b></td>
          </tr>`; 
      }); 
      html += `</table></div>`;
    } else {
        html += `<div style="text-align:center; padding:20px; color:var(--text-muted);">مفيش خطط سداد مسجلة.</div>`;
    }

    resultDiv.innerHTML = html;
};

function calcInstallmentWithDiscount(originalTotal, discountPct, downPct, customBullets, years, freq){ 
    const discountVal = originalTotal * ((discountPct||0)/100);
    const netTotal = originalTotal - discountVal;
    const downPayment = netTotal * ((downPct||0)/100);
    let extraPaymentsTotal = 0; 
    let bulletsSummary = []; 
    
    (customBullets || []).forEach(b => { 
        const pct = parseFloat(b.percent) || 0; 
        if(pct > 0){ 
            if(b.type === 'annual'){ 
                const count = (b.selectedYears || []).length;
                if (count > 0) {
                    const perYearVal = netTotal * (pct / 100);
                    const ordinals = {1: 'الأولى', 2: 'الثانية', 3: 'الثالثة', 4: 'الرابعة', 5: 'الخامسة', 6: 'السادسة', 7: 'السابعة', 8: 'الثامنة', 9: 'التاسعة', 10: 'العاشرة'};
                    
                    [...b.selectedYears].sort((a,b)=>a-b).forEach(yr => {
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
    
    const remaining = netTotal - (downPayment + extraPaymentsTotal);
    const monthlyEquivalent = (years || 1) > 0 ? remaining / ((years || 1) * 12) : remaining; 
    return { originalTotal, discountVal, netTotal, downPayment, extraPaymentsTotal, bulletsSummary, remaining, monthlyEquivalent, quarterlyEquivalent: monthlyEquivalent * 3 }; 
}

function openCalculator(){ calcCustomBullets=[]; ['calcTotal','calcDiscountPct','calcDownPct','calcYears'].forEach(id=>document.getElementById(id).value=''); document.getElementById('calcResult').style.display='none'; renderCalcBulletsRows(); document.getElementById('calcOverlay').classList.add('open'); }
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
    document.getElementById('calcBulletsRows').innerHTML = calcCustomBullets.map(b=>`<div class="bullet-row" style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
            <select style="flex:1; min-width:100px; padding:8px; border-radius:4px; background:var(--item-bg); border:1px solid var(--border-color); color:var(--text-main);" onchange="updateCalcBullet('${b.id}','type',this.value)">
                <option value="annual" ${b.type=='annual'?'selected':''}>سنوية</option>
                <option value="deferred" ${b.type=='deferred'?'selected':''}>مؤجلة</option>
                <option value="delivery" ${b.type=='delivery'?'selected':''}>استلام</option>
                <option value="after_3m" ${b.type=='after_3m'?'selected':''}>بعد 3 شهور</option>
                <option value="after_6m" ${b.type=='after_6m'?'selected':''}>بعد 6 شهور</option>
                <option value="after_9m" ${b.type=='after_9m'?'selected':''}>بعد 9 شهور</option>
            </select>
            <input type="number" placeholder="%" class="num" style="width:80px; flex-shrink:0; padding:8px; border-radius:4px; background:var(--item-bg); border:1px solid var(--border-color); color:var(--text-main);" value="${b.percent}" oninput="updateCalcBullet('${b.id}','percent',this.value)">
            <button class="btn btn-danger-style" style="flex-shrink:0; padding:8px;" onclick="removeCalcBulletRow('${b.id}')">✕</button>
        </div>
        ${b.type==='annual'?`<div class="years-pills" style="margin-bottom:15px; display:flex; flex-wrap:wrap; gap:8px; justify-content:center; width:100%;">${[1,2,3,4,5,6,7].map(yr=>`<div class="year-pill ${(b.selectedYears||[]).includes(yr)?'selected':''}" onclick="toggleYearSelection('${b.id}',${yr})">${yr}</div>`).join('')}</div>`:''}
    `).join(''); 
}

function runUniversalCalculator(){ 
    const inputVal = document.getElementById('calcTotal').value.replace(/,/g, '');
    const t = getRawNum(inputVal); 
    if(!t || isNaN(t)) return showToast('أدخل إجمالي سعر صحيح'); 
    
    const r = calcInstallmentWithDiscount(t, parseFloat(document.getElementById('calcDiscountPct').value)||0, parseFloat(document.getElementById('calcDownPct').value)||0, calcCustomBullets, parseFloat(document.getElementById('calcYears').value)||0, 12); 
    
    const box = document.getElementById('calcResult'); 
    box.style.display='grid'; 
    
    let bulletsHtml = r.bulletsSummary.length > 0 
        ? `<div class="calc-item" style="grid-column: 1 / -1; border: 2px dashed var(--primary); text-align:right;">
            <span style="display:block; margin-bottom:6px; color:var(--primary); font-weight:800;">الدفعات الخاصة:</span>
            <div class="num" style="font-size:16px;">${r.bulletsSummary.map(b => `<div style="margin-bottom:4px;">• ${b.label}</div>`).join('')}</div>
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

document.getElementById('calcTotal').addEventListener('input', function() { formatInput(this); });

function closeModal(id){ 
    if (id === 'formOverlay') { if(!confirm('هل أنت متأكد من إغلاق النافذة؟ لن يتم حفظ التعديلات الأخيرة.')) return; }
    document.getElementById(id).classList.remove('open'); 
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
populateDeliverySelects();
