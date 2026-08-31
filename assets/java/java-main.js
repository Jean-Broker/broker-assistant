// --- Theme & Setup ---
function setNavForApp(isAppView) { const links = document.getElementById('siteBarLinks'), loginBtn = document.getElementById('siteBarLoginBtn'); if (links) links.classList.toggle('nav-app-hidden', isAppView); if (loginBtn) loginBtn.classList.toggle('nav-app-hidden', isAppView); }
if (sessionStorage.getItem('isSystemOpen') === 'true') { document.getElementById('landingPage').style.display = 'none'; document.getElementById('systemApp').style.display = 'flex'; setNavForApp(true); } else { document.getElementById('landingPage').style.display = 'block'; document.getElementById('systemApp').style.display = 'none'; setNavForApp(false); }
function toggleTheme() { document.body.classList.toggle('light-mode'); localStorage.setItem('appTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark'); }
if (localStorage.getItem('appTheme') === 'light') { document.body.classList.add('light-mode'); }
let currentLang = 'ar';
function toggleLanguage() { currentLang = currentLang === 'ar' ? 'en' : 'ar'; document.documentElement.lang = currentLang; document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr'; document.querySelectorAll('[data-ar]').forEach(el => { el.innerHTML = el.getAttribute('data-' + currentLang); }); }
function openSystemLogin() { document.getElementById('paywallModal').style.display = 'flex'; }
function closeLoginModal() { document.getElementById('paywallModal').style.display = 'none'; }
function backToLanding() { document.getElementById('systemApp').style.display = 'none'; document.getElementById('landingPage').style.display = 'block'; setNavForApp(false); }

const firebaseConfig = { apiKey: "AIzaSyApvrK13v-5nIB7TzhrN-M4-1Y8PSEhKoE", authDomain: "broker-assistant-63277.firebaseapp.com", projectId: "broker-assistant-63277", storageBucket: "broker-assistant-63277.firebasestorage.app", messagingSenderId: "434808917289", appId: "1:434808917289:web:1012be2fa30cf80cfefb38" };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(), db = firebase.firestore();
const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryApp");

window.addEventListener('load', () => {
    if(localStorage.getItem('savedEmail')) { document.getElementById('loginEmail').value = localStorage.getItem('savedEmail'); document.getElementById('loginPassword').value = localStorage.getItem('savedPassword'); document.getElementById('rememberMe').checked = true; }
    document.getElementById('fldPriceMeterMin')?.addEventListener('input', updatePriceMeterAvg); document.getElementById('fldPriceMeterMax')?.addEventListener('input', updatePriceMeterAvg); document.getElementById('fldProjectType')?.addEventListener('change', onProjectTypeChange);
    document.querySelectorAll('.comm-price-input').forEach(el => { el.addEventListener('input', () => { tempUnits.forEach(u => updateUnitData(u.id, 'recalc', null)); }); });
    const footerYearEl = document.getElementById('footerYear'); if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeAllDropdowns();
    if (document.getElementById('paywallModal').style.display === 'flex') closeLoginModal();
    document.querySelectorAll('.overlay.open').forEach(ov => { if (ov.id === 'formOverlay') return; ov.classList.remove('open'); });
});

function toggleDropdown(id) { const wrapper = document.getElementById(id).parentElement; const isActive = wrapper.classList.contains('active'); closeAllDropdowns(); if (!isActive) wrapper.classList.add('active'); }
function closeAllDropdowns() { document.querySelectorAll('.filter-dropdown-wrapper').forEach(el => el.classList.remove('active')); }
document.addEventListener('click', function(event) { if (!event.target.closest('.filter-dropdown-wrapper')) { closeAllDropdowns(); } });

let selectedBeds = [];
function selectPill(groupId, val) { const el = event.target; el.classList.toggle('active'); if (el.classList.contains('active')) { selectedBeds.push(val); } else { selectedBeds = selectedBeds.filter(v => v !== val); } }

let currentUser = null, isAdmin = false, isEditor = false;
let mainLocations = [], compounds = [], activeProjectType = 'all';
let editingCompoundId = null, viewingCompoundId = null;
let tempUnits = [], tempPlans = [], tempDecrees = [], openMainLocIds = {}; 
let activeDetailCategory = null, activeDetailUnitId = null, calcCustomBullets = [];
let activeLocationIds = []; 
let filters = {};

const PROJECT_TYPES = { residential: 'سكني', commercial: 'تجاري / إداري', hotel: 'شقق فندقية' };
const BEDROOM_TYPES = { 'apartment': 'شقة', 'villa': 'فيلا', 'twinhouse': 'توين هاوس', 'townhouse': 'تاون هاوس', 'chalet': 'شاليه', studio: 'استوديو (Studio)', '1br': '1 غرفة نوم', '2br': '2 غرفة نوم', '3br': '3 غرف نوم', '4br': '4 غرف نوم', duplex: 'دوبلكس', penthouse: 'بنتهاوس', commercial: 'تجاري (Commercial)', admin: 'إداري (Admin)', clinic: 'عيادة / طبي (Clinic)', recreational: 'ترفيهي (Recreational)' };
const FINISHING_TYPES = { core_shell: 'Core & Shell', semi: 'نصف تشطيب', full: 'تشطيب كامل' };
const FREQ_LABEL = {12:'شهري', 4:'ربع سنوي', 2:'نصف سنوي', 1:'سنوي'};
const DELIVERY_TIMELINES = [ {value:'immediate', label:'تسليم فوري'}, {value:'6m', label:'6 أشهر'}, {value:'1y', label:'سنة'}, {value:'1.5y', label:'سنة ونصف'}, {value:'2y', label:'سنتين'}, {value:'2.5y', label:'سنتين ونصف'}, {value:'3y', label:'3 سنوات'}, {value:'4y', label:'4 سنوات'}, ];

function formatInput(el) { let raw = String(el.value).replace(/[^0-9]/g, ''); el.value = raw ? Number(raw).toLocaleString('en-US') : ''; }
function getRawNum(val) { return parseFloat(String(val).replace(/,/g, '')) || null; }

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
    await syncCloudData(); document.getElementById('paywallModal').style.display = 'none'; document.getElementById('landingPage').style.display = 'none'; document.getElementById('systemApp').style.display = 'flex'; setNavForApp(true);
  } else { currentUser = null; isAdmin = false; isEditor = false; sessionStorage.removeItem('isSystemOpen'); document.getElementById('userEmailLabel').textContent = 'يرجى تسجيل الدخول'; document.getElementById('systemApp').style.display = 'none'; document.getElementById('landingPage').style.display = 'block'; setNavForApp(false); }
});

function submitLogin() { const email = document.getElementById('loginEmail').value.trim(), password = document.getElementById('loginPassword').value.trim(); if(!email || !password) { alert("من فضلك أدخل الإيميل والباسورد"); return; } document.getElementById('rememberMe').checked ? (localStorage.setItem('savedEmail', email), localStorage.setItem('savedPassword', password)) : (localStorage.removeItem('savedEmail'), localStorage.removeItem('savedPassword')); sessionStorage.setItem('isSystemOpen', 'true'); auth.signInWithEmailAndPassword(email, password).catch(err => { sessionStorage.removeItem('isSystemOpen'); alert("بيانات الدخول غير صحيحة."); }); }
function handleAuthAction() { currentUser ? (auth.signOut(), sessionStorage.removeItem('isSystemOpen'), backToLanding()) : document.getElementById('paywallModal').style.display = 'flex'; }
function openUsersManager() { document.getElementById('newAccEmail').value = ''; document.getElementById('newAccResult').style.display = 'none'; document.getElementById('usersOverlay').classList.add('open'); }
async function createNewSubscriber() { const email = document.getElementById('newAccEmail').value.trim().toLowerCase(), duration = parseInt(document.getElementById('newAccDuration').value), role = document.getElementById('newAccRole').value; if(!email) { showToast('يرجى كتابة الإيميل!'); return; } const password = Math.random().toString(36).slice(-6) + Math.floor(Math.random()*100), expDate = new Date(); expDate.setDate(expDate.getDate() + duration); try { await secondaryApp.auth().createUserWithEmailAndPassword(email, password); await db.collection('users').doc(email).set({ role: role, expiryDate: expDate.toISOString().split('T')[0] }); await secondaryApp.auth().signOut(); document.getElementById('resEmail').textContent = email; document.getElementById('resPass').textContent = password; document.getElementById('resDate').textContent = expDate.toISOString().split('T')[0]; document.getElementById('newAccResult').style.display = 'block'; showToast('تم تسجيل الحساب بنجاح!'); } catch (error) { alert('حدث خطأ: ' + error.message); } }

function skeletonCardsHtml(count) {
    let card = `<div class="dossier skeleton-card" aria-hidden="true"><div class="skeleton-line" style="width:40%;height:10px;margin-bottom:10px;"></div><div class="skeleton-line" style="width:75%;height:16px;margin-bottom:14px;"></div><div class="skeleton-line" style="width:55%;height:9px;margin-bottom:8px;"></div><div class="skeleton-line" style="width:45%;height:9px;margin-bottom:8px;"></div><div class="skeleton-line" style="width:60%;height:9px;margin-bottom:14px;"></div><div style="display:flex;gap:10px;"><div class="skeleton-line" style="flex:1;height:34px;"></div><div class="skeleton-line" style="flex:1;height:34px;"></div></div></div>`;
    return card.repeat(count);
}

async function syncCloudData() { 
    document.getElementById('pageSub').textContent = "جاري تحميل البيانات..."; 
    const grid = document.getElementById('compoundGrid'); if (grid && !grid.children.length) grid.innerHTML = skeletonCardsHtml(6);
    db.collection('system').doc('locations').onSnapshot(doc => { mainLocations = doc.exists ? doc.data().mainLocations || [] : []; renderLocationTree(); applyFilters(); }); 
    db.collection('compounds').onSnapshot(snapshot => { compounds = []; snapshot.forEach(doc => compounds.push({ id: doc.id, ...doc.data() })); renderLocationTree(); applyFilters(); }); 
}

async function saveMainLocationsToCloud() { if(isEditor) { try { await db.collection('system').doc('locations').set({ mainLocations }); } catch (error) { alert('خطأ في الحفظ!'); } } }

function getCorrectedUnitType(typeStr, projectType) { if (projectType === 'commercial') { if (typeStr === '1br') return 'admin'; if (typeStr === '2br' || typeStr === 'studio') return 'commercial'; if (!['commercial', 'admin', 'clinic', 'recreational'].includes(typeStr)) return 'commercial'; } else { if (['commercial', 'admin', 'clinic', 'recreational'].includes(typeStr)) return 'studio'; } return typeStr || (projectType === 'commercial' ? 'commercial' : 'studio'); }

function extractValueAfterKeyword(line, keywords) {
    const lowerLine = line.toLowerCase();
    for (let kw of keywords) {
        if (lowerLine.includes(kw.toLowerCase())) {
            let splitChar = line.includes(':') ? ':' : (line.includes('-') ? '-' : kw);
            let val = line.substring(line.toLowerCase().indexOf(kw.toLowerCase()) + kw.length).split(splitChar).pop().replace(/[*_]/g, '').trim();
            if (val) return val;
        }
    }
    return null;
}

/* ✨ الاستيراد الذكي V3 ✨ */
function processMagicPaste() {
    const text = document.getElementById('magicPasteInput').value;
    if (!text.trim()) return showToast('برجاء لصق نص المشروع أولاً!');

    let cleanText = text.replace(/[\u200B-\u200D\uFEFF\u2060\u200E\u200F\u00A0]/g, ' ');
    const lines = cleanText.split('\n');
    let currentType = 'apartment'; 
    let unitsAdded = 0, plansAdded = 0, fieldsFilled = 0;

    let firstLine = lines.find(l => l.replace(/[*🚨\-\s📢🏡]/g, '').length > 0);
    if (firstLine && !document.getElementById('fldProject').value) {
        let projName = firstLine.replace(/[*🚨\-By📢🏡]/ig, '')
                                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g, '')
                                .trim();
        document.getElementById('fldProject').value = projName;
        fieldsFilled++;
    }

    let foundBy = false;
    for (let i = 0; i < lines.length; i++) {
        let l = lines[i].trim().replace(/[*]/g, '');
        if (l.toLowerCase().endsWith('by')) { foundBy = true; continue; }
        if (foundBy && l) {
            if (!document.getElementById('fldCompany').value) { document.getElementById('fldCompany').value = l; fieldsFilled++; }
            foundBy = false;
        }
    }

    lines.forEach(line => {
        const cleanLine = line.replace(/[*`~•▫️▶️➡️📍🔧🏢🚨🏡📢]/g, '').trim();
        const lowerLine = cleanLine.toLowerCase();
        if (!cleanLine) return; 

        let developer = extractValueAfterKeyword(cleanLine, ['Developer', 'المطور', 'شركة', 'Development']);
        if (developer && !document.getElementById('fldCompany').value) { document.getElementById('fldCompany').value = developer; fieldsFilled++; }

        let owner = extractValueAfterKeyword(cleanLine, ['Owner', 'المالك']);
        if (owner && !document.getElementById('fldOwner').value) { document.getElementById('fldOwner').value = owner; fieldsFilled++; }

        let consultant = extractValueAfterKeyword(cleanLine, ['Consultant', 'استشاري', 'الاستشاري']);
        if (consultant && !document.getElementById('fldConsultant').value) { document.getElementById('fldConsultant').value = consultant; fieldsFilled++; }

        let delivery = extractValueAfterKeyword(cleanLine, ['Delivery Date', 'Delivery', 'التسليم', 'استلام']);
        if (delivery) {
            let dSelect = document.getElementById('fldDeliveryDate');
            if (lowerLine.includes('immediate') || lowerLine.includes('فوري')) dSelect.value = 'immediate';
            else if (lowerLine.includes('1') || lowerLine.includes('one')) dSelect.value = '1y';
            else if (lowerLine.includes('2') || lowerLine.includes('two')) dSelect.value = '2y';
            else if (lowerLine.includes('3') || lowerLine.includes('three')) dSelect.value = '3y';
            else if (lowerLine.includes('4') || lowerLine.includes('four')) dSelect.value = '4y';
        }

        let finishing = extractValueAfterKeyword(cleanLine, ['Finishing', 'التشطيب', 'تشطيب']);
        if (finishing) {
            let fSelect = document.getElementById('fldFinishingStatus');
            if (lowerLine.includes('core') || lowerLine.includes('shell') || lowerLine.includes('بدون')) fSelect.value = 'core_shell';
            else if (lowerLine.includes('semi') || lowerLine.includes('نصف')) fSelect.value = 'semi';
            else if (lowerLine.includes('fully') || lowerLine.includes('كامل')) fSelect.value = 'full';
        }

        let maintenance = extractValueAfterKeyword(cleanLine, ['Maintenance', 'صيانة', 'الصيانة']);
        if (maintenance) {
            let mVal = maintenance.replace(/[^0-9.]/g, '');
            if (mVal && !document.getElementById('fldMaintenancePercent').value) { document.getElementById('fldMaintenancePercent').value = mVal; fieldsFilled++; }
        }

        if (lowerLine.includes('cash discount') || lowerLine.includes('خصم كاش')) {
            let cdMatch = cleanLine.match(/(\d+(?:\.\d+)?)%/);
            if (cdMatch && !document.getElementById('fldCashDiscount').value) { document.getElementById('fldCashDiscount').value = cdMatch[1]; fieldsFilled++; }
        }

        if (lowerLine.includes('parking') || lowerLine.includes('جراج') || lowerLine.includes('بارك')) {
            let pMatch = cleanLine.match(/([\d,]+(?:\.\d+)?)\s*(k|egp|ج|جنيه|الف)?/i);
            if (pMatch && !document.getElementById('fldParkingFee').value) { 
                let pVal = parseFloat(pMatch[1].replace(/,/g, ''));
                let mult = pMatch[2] ? pMatch[2].toLowerCase() : '';
                if (mult === 'k' || mult === 'الف') pVal *= 1000;
                document.getElementById('fldParkingFee').value = formatNum(pVal); 
                fieldsFilled++; 
            }
        }

        const sizeMatch = cleanLine.match(/(\d+(?:\.\d+)?)\s*(acres?|فدان)/i);
        if (sizeMatch && !document.getElementById('fldProjectSize').value) { document.getElementById('fldProjectSize').value = sizeMatch[1]; fieldsFilled++; }

        const linkMatch = cleanLine.match(/https?:\/\/[^\s]+/);
        if (linkMatch && !document.getElementById('fldLocationLink').value) { document.getElementById('fldLocationLink').value = linkMatch[0]; fieldsFilled++; }

        const floorMatch = cleanLine.match(/G\s*\+\s*(\d+)/i);
        if (floorMatch && !document.getElementById('fldFloors').value) { document.getElementById('fldFloors').value = floorMatch[1]; fieldsFilled++; }

        const bedRegexes = [
            {regex: /\b1\s*bed(rooms?)?|\b1\s*br|غرفة\s*واحدة|\b1\s*غرف/i, type: '1br'},
            {regex: /\b2\s*bed(rooms?)?|\b2\s*br|غرفتين|\b2\s*غرف/i, type: '2br'},
            {regex: /\b3\s*bed(rooms?)?|\b3\s*br|\b3\s*غرف/i, type: '3br'},
            {regex: /\b4\s*bed(rooms?)?|\b4\s*br|\b4\s*غرف/i, type: '4br'},
            {regex: /penthouse|بنتهاوس/i, type: 'penthouse'},
            {regex: /duplex|دوبلكس/i, type: 'duplex'},
            {regex: /family house|villa|twin|town|فيلا|توين|تاون/i, type: 'villa'},
            {regex: /chalet|شاليه/i, type: 'chalet'},
            {regex: /studio|استوديو/i, type: 'studio'}
        ];
        
        for(let br of bedRegexes) {
            if(br.regex.test(cleanLine)) { currentType = br.type; break; }
        }

        let processingLine = cleanLine.replace(/\b\d+\s*(?:bedrooms?|beds?|br|غرف(?:ة|تين)?)\b/ig, '');

        const unitMatch = processingLine.match(/(?:(?:\d+\s*up\s*to\s*)|\b|\()(\d+)\s*(?:[mM]2?|m²|م|متر)?(?:\s*(?:\+|\/)\s*(?:garden|roof|جاردن|روف)?\s*(\d+)\s*(?:[mM]2?|m²|م|متر)?)?.*?[\s:=→>/\-_—–]+\s*([\d,]+(?:\.\d+)?)\s*([mMkK]|مليون|الف)?/i); 
        
        if (unitMatch) {
            const area = parseFloat(unitMatch[1]);
            const garden = unitMatch[2] ? parseFloat(unitMatch[2]) : '';
            if (area > 10) { 
                tempUnits.push({ id: uid(), bedroomType: currentType, area: area, gardenArea: garden, price: '' });
                unitsAdded++;
            }
        }

        if (!lowerLine.includes('delivery') && !lowerLine.includes('تسليم') && !lowerLine.includes('استلام')) {
            const planMatch = cleanLine.match(/(?:(\d+)%\s*(?:discount|خصم).*?)?(?:(\d+)%\s*(?:DP|Down Payment|d\.p|مقدم).*?)?(?:discount\s*(\d+)%)?.*?(\d+)\s*(?:years?|سن)/i);
            if (planMatch && !cleanLine.includes('?')) {
                const discount = planMatch[1] ? parseFloat(planMatch[1]) : (planMatch[3] ? parseFloat(planMatch[3]) : '');
                let dpText = cleanLine.match(/(\d+)%\s*(?:dp|d\.p|down|مقدم)/i);
                const dp = dpText ? parseFloat(dpText[1]) : 0;
                const years = parseFloat(planMatch[4]);
                
                if (!tempPlans.some(p => p.notes === cleanLine.replace(/^[▫️\-\s]+/,''))) {
                    tempPlans.push({ id: uid(), name: `خطة ${years} سنوات`, discountPercent: discount, downPaymentPercent: dp, years: years, frequency: '12', notes: cleanLine.replace(/^[▫️\-\s]+/,''), customBullets: [] });
                    plansAdded++;
                }
            }
        }
    });

    renderUnitRows();
    renderPlanRows();
    document.getElementById('magicPasteInput').value = '';
    showToast(`تم سحب ${fieldsFilled} بيانات أساسية، ${unitsAdded} مساحة، و ${plansAdded} خطة بنجاح! 🚀`);
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
    phaseName: document.getElementById('fldPhaseName').value.trim(),
    floors: parseInt(document.getElementById('fldFloors').value) || '',
    ownerName: document.getElementById('fldOwner').value.trim(), 
    consultant: document.getElementById('fldConsultant').value.trim(),
    pricePerMeterMin: getRawNum(document.getElementById('fldPriceMeterMin').value)||0, pricePerMeterMax: getRawNum(document.getElementById('fldPriceMeterMax').value)||0,
    commercialPrices: { adminMin: getRawNum(document.getElementById('fldAdminMin').value)||0, adminMax: getRawNum(document.getElementById('fldAdminMax').value)||0, adminFinish: document.getElementById('fldAdminFinish').value || 'core_shell', commMin: getRawNum(document.getElementById('fldCommMin').value)||0, commMax: getRawNum(document.getElementById('fldCommMax').value)||0, commFinish: document.getElementById('fldCommFinish').value || 'core_shell', clinicMin: getRawNum(document.getElementById('fldClinicMin').value)||0, clinicMax: getRawNum(document.getElementById('fldClinicMax').value)||0, clinicFinish: document.getElementById('fldClinicFinish').value || 'core_shell', recMin: getRawNum(document.getElementById('fldRecMin').value)||0, recMax: getRawNum(document.getElementById('fldRecMax').value)||0, recFinish: document.getElementById('fldRecFinish').value || 'core_shell', },
    maintenancePercent: parseFloat(document.getElementById('fldMaintenancePercent').value) || 0, parkingFee: getRawNum(document.getElementById('fldParkingFee').value)||0, projectSize: parseFloat(document.getElementById('fldProjectSize').value) || 0, deliveryDate: document.getElementById('fldDeliveryDate').value.trim(), finishingStatus: document.getElementById('fldFinishingStatus').value, compoundLocationDetail: document.getElementById('fldLocationDetail').value.trim(), locationLink: document.getElementById('fldLocationLink').value.trim(), cashDiscount: parseFloat(document.getElementById('fldCashDiscount').value) || 0,
    unitTypes: tempUnits.map(u => ({ id: u.id || uid(), bedroomType: getCorrectedUnitType(u.bedroomType, document.getElementById('fldProjectType').value), area: parseFloat(u.area) || 0, gardenArea: parseFloat(u.gardenArea) || 0, price: parseFloat(u.price) || 0 })),
    paymentPlans: tempPlans, ministerialDecrees: tempDecrees.filter(d=>d.decreeNumber || d.description),
  };
  try { await db.collection('compounds').doc(editingCompoundId || uid()).set(data, { merge: true }); document.getElementById('formOverlay').classList.remove('open'); showToast('تم حفظ المشروع بنجاح'); } 
  catch (error) { alert('خطأ! الفايربيز رفض الحفظ.'); }
}

async function deleteCurrentCompoundFromCloud() { if(!isEditor || !confirm('متأكد من الحذف؟')) return; await db.collection('compounds').doc(viewingCompoundId).delete(); document.getElementById('detailOverlay').classList.remove('open'); showToast('تم الحذف'); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function showToast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2200); }
function formatNum(n){ return Number(n).toLocaleString('en-US'); }
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ✨ وظيفة تحديد النص للبحث ✨ */
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
  let html = `<div class="sub-loc-tab ${isAllActive ? 'active' : ''}" onclick="selectLocationNode('all')"><span>🌐 كل المشروعات</span><span style="font-family:'IBM Plex Mono',monospace; font-size:11px;">${compounds.length}</span></div>`;
  mainLocations.forEach((mainLoc) => { 
      let mainCount = 0; mainLoc.subLocations.forEach(sub => { mainCount += compounds.filter(c => c.locationId === sub.id).length; }); 
      const isOpen = !!openMainLocIds[mainLoc.id]; const isMainActive = activeLocationIds.includes(mainLoc.id);
      html += `<div class="loc-group"><div class="loc-group-header-row"><div class="loc-main-clickable ${isMainActive ? 'active' : ''}" onclick="selectLocationNode('${mainLoc.id}')"><span>📍 ${escapeHtml(mainLoc.name)}</span></div><div style="display:flex; align-items:center; gap:6px;"><span style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); font-weight:bold;">${mainCount}</span><span class="arrow-toggle ${isOpen ? 'open' : ''}" onclick="toggleMainLoc('${mainLoc.id}', event)" role="button" tabindex="0" aria-label="عرض الفروع">▶</span>${isEditor ? `<button class="loc-del-btn" onclick="deleteMainLocation('${mainLoc.id}')" aria-label="حذف ${escapeHtml(mainLoc.name)}">✕</button>` : ''}</div></div><div class="sub-loc-list ${isOpen ? 'show' : ''}">`; 
      mainLoc.subLocations.forEach(sub => { 
          const subCount = compounds.filter(c => c.locationId === sub.id).length; const isSubActive = activeLocationIds.includes(sub.id);
          html += `<div class="sub-loc-tab ${isSubActive ? 'active' : ''}" onclick="selectLocationNode('${sub.id}')"><span>↳ ${escapeHtml(sub.name)}</span><div style="display:flex; align-items:center; gap:6px;"><span style="font-family:'IBM Plex Mono',monospace; font-size:11px; opacity:0.9;">${subCount}</span>${isEditor ? `<button class="loc-del-btn" onclick="event.stopPropagation(); deleteSubLocation('${mainLoc.id}', '${sub.id}')" aria-label="حذف ${escapeHtml(sub.name)}">✕</button>` : ''}</div></div>`; 
      }); 
      html += `</div>${isEditor ? `<div class="add-sub-loc-box"><input id="subInput_${mainLoc.id}" placeholder="+ فرع جديد" onkeydown="if(event.key==='Enter') addSubLocation('${mainLoc.id}')"><button class="btn btn-outline-light btn-pill" style="padding:4px 12px;" onclick="addSubLocation('${mainLoc.id}')">إضافة</button></div>` : ''}</div>`; 
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

/* ✨ دوال تأخير البحث (Debounce) لضمان السرعة في الكتابة ✨ */
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

function findSubLocationName(subId){ for(const m of mainLocations){ const s = m.subLocations.find(x => x.id === subId); if(s) return `${m.name} ⬅️ ${s.name}`; } return '-'; }

/* ✨ دوال تصميم الكروت والمراحل ✨ */
function generateDossierHTML(c) {
    const minPrice = (c.unitTypes||[]).length ? Math.min(...c.unitTypes.map(u=>u.price||Infinity)) : null;
    let pDisplay = '';
    if (c.projectType === 'commercial' && c.commercialPrices) {
        let mins = [c.commercialPrices.adminMin, c.commercialPrices.commMin, c.commercialPrices.clinicMin, c.commercialPrices.recMin].filter(x => x > 0);
        let absoluteMin = mins.length > 0 ? Math.min(...mins) : (c.pricePerMeterMin || 0); pDisplay = absoluteMin > 0 ? `يبدأ من ${formatNum(absoluteMin)}` : '-';
    } else { pDisplay = (c.pricePerMeterMin && c.pricePerMeterMax) ? `${formatNum(c.pricePerMeterMin)} - ${formatNum(c.pricePerMeterMax)}` : formatNum(c.pricePerMeterMin||0); }
    
    let phaseTag = c.phaseName ? `<span class="phase-tag">${escapeHtml(c.phaseName)}</span>` : '';
    
    return `<div class="dossier" onclick="openDetail('${c.id}')">${c.ministerialDecrees?.length ? '<div class="stamp">معتمد</div>' : ''}<div class="dossier-company">${highlightText(c.companyName||'', filters.searchText)}</div><div class="dossier-title">${highlightText(c.projectName||'بدون اسم', filters.searchText)} ${phaseTag}</div><div class="dossier-badge">${PROJECT_TYPES[c.projectType||'residential']}</div><div class="dossier-row"><b>الفرع:</b> <span>${highlightText(findSubLocationName(c.locationId), filters.searchText)}</span></div><div class="dossier-row"><b>ارتفاع العمارات:</b> <span>${c.floors ? 'G + '+c.floors : '-'}</span></div><div class="dossier-row" style="border-bottom:none;"><b>التشطيب:</b> <span>${c.projectType === 'commercial' ? 'حسب النشاط' : (FINISHING_TYPES[c.finishingStatus]||'-')}</span></div><div class="dossier-meta"><div class="meta-chip"><span>سعر المتر</span><div>${pDisplay}</div></div><div class="meta-chip"><span>أقل سعر وحدة</span><div>${minPrice!==Infinity ? formatNum(minPrice):'-'}</div></div></div></div>`;
}

function generateMasterDossierHTML(group) {
    let c = group[0]; 
    return `<div class="dossier master-dossier" onclick="openPhasesModal('${escapeHtml(c.projectName)}', '${escapeHtml(c.companyName)}')">
        <div class="master-badge">مراحل متعددة</div>
        <div class="dossier-company">${highlightText(c.companyName||'', filters.searchText)}</div>
        <div class="dossier-title">${highlightText(c.projectName||'بدون اسم', filters.searchText)} <span class="phase-tag" style="background:#3B82F6;">${group.length} مراحل</span></div>
        <div class="dossier-badge">${PROJECT_TYPES[c.projectType||'residential']}</div>
        <div class="dossier-row"><b>الفرع:</b> <span>${highlightText(findSubLocationName(c.locationId), filters.searchText)}</span></div>
        <div class="dossier-meta" style="margin-top:15px;"><div class="meta-chip" style="grid-column: 1 / -1; display:flex; justify-content:space-between; align-items:center; border-color:#3B82F6; background:rgba(59,130,246,0.1);"><span>اضغط لعرض المراحل والتفاصيل</span><div style="font-size:16px; color:#3B82F6;">➤</div></div></div>
    </div>`;
}

function openPhasesModal(projName, compName) {
    let group = compounds.filter(c => (c.projectName||'') === projName && (c.companyName||'') === compName);
    document.getElementById('phasesTitle').textContent = `مراحل مشروع: ${projName}`;
    
    let html = group.map(c => {
        return `<div class="dossier mini-phase" onclick="closeModal('phasesOverlay'); setTimeout(()=>openDetail('${c.id}'), 300)">
            <div class="dossier-title" style="color:var(--primary); font-size:18px;">${escapeHtml(c.phaseName || 'المرحلة الأساسية')}</div>
            <div class="dossier-row"><b>ارتفاع العمارات:</b> <span>${c.floors ? 'G + ' + c.floors : '-'}</span></div>
            <div class="dossier-row"><b>التسليم:</b> <span>${deliveryLabel(c.deliveryDate)}</span></div>
            <div class="dossier-row" style="border-bottom:none;"><b>المساحة:</b> <span>${c.projectSize ? c.projectSize+' فدان':'-'}</span></div>
        </div>`;
    }).join('');
    
    document.getElementById('phasesBody').innerHTML = html;
    document.getElementById('phasesOverlay').classList.add('open');
}

function renderGrid(){
  let list = compounds.filter(c=>{
    if (activeLocationIds.length > 0) {
        let parentMain = mainLocations.find(m => m.subLocations.some(s => s.id === c.locationId));
        let parentId = parentMain ? parentMain.id : null;
        if (!activeLocationIds.includes(c.locationId) && !activeLocationIds.includes(parentId)) { return false; }
    }
    
    if(activeProjectType !== 'all' && (c.projectType || 'residential') !== activeProjectType) return false;
    if(filters.searchText) {
        const searchable = [c.projectName, c.companyName, c.ownerName, c.consultant, findSubLocationName(c.locationId)].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(filters.searchText)) return false;
    }
    
    let cUnits = c.unitTypes||[]; 
    
    if(filters.propertyTypes) {
        cUnits = cUnits.filter(u => {
            let t = u.bedroomType;
            if (filters.propertyTypes.includes('apartment') && ['1br', '2br', '3br', '4br', 'apartment'].includes(t)) return true;
            if (filters.propertyTypes.includes('commercial') && ['commercial', 'admin', 'clinic', 'recreational'].includes(t)) return true;
            return filters.propertyTypes.includes(t);
        });
        if(cUnits.length === 0) return false;
    }
    
    if(filters.bedrooms) {
        cUnits = cUnits.filter(u => {
            let t = u.bedroomType;
            if (t === 'studio' && filters.bedrooms.includes('1')) return true;
            if (t === '1br' && filters.bedrooms.includes('1')) return true;
            if (t === '2br' && filters.bedrooms.includes('2')) return true;
            if (t === '3br' && filters.bedrooms.includes('3')) return true;
            if (t === '4br' && filters.bedrooms.includes('4')) return true;
            if (['duplex', 'penthouse', 'villa', 'twinhouse', 'townhouse'].includes(t) && filters.bedrooms.includes('5+')) return true;
            return false;
        });
        if(cUnits.length === 0) return false;
    }
    
    if(filters.minPrice != null || filters.maxPrice != null) {
        let passPrice = false;
        for(const u of cUnits){
            let p = u.price || 0;
            if(p <= 0) continue; 
            let okMin = filters.minPrice != null ? (p >= filters.minPrice) : true;
            let okMax = filters.maxPrice != null ? (p <= filters.maxPrice) : true;
            if (okMin && okMax) { passPrice = true; break; }
        }
        if(!passPrice) return false;
    }
    
    if(filters.downPaymentTarget != null || filters.maxMonthlyInstallment != null){
      const plans = c.paymentPlans || []; if(!plans.length) return false; let pass = false;
      for(const u of cUnits){ 
          if ((u.price || 0) <= 0) continue; 
          for(const p of plans){ 
              const r = calcInstallmentWithDiscount(u.price, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); 
              let okDP = filters.downPaymentTarget != null ? (r.downPayment > 0 && r.downPayment <= filters.downPaymentTarget) : true;
              let okInst = filters.maxMonthlyInstallment != null ? (r.monthlyEquivalent > 0 && r.monthlyEquivalent <= filters.maxMonthlyInstallment) : true;
              if (okDP && okInst) { pass = true; break; } 
          } 
          if(pass) break; 
      } 
      if(!pass) return false;
    } 
    return true;
  });
  
  if(filters.sortOrder && filters.sortOrder !== 'default') list.sort((a, b) => filters.sortOrder === 'asc' ? (a.pricePerMeterMin||0) - (b.pricePerMeterMin||0) : (b.pricePerMeterMin||0) - (a.pricePerMeterMin||0));
  
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
  
  // تجميع المراحل
  let groups = {};
  list.forEach(c => {
      let key = `${(c.projectName||'').trim().toLowerCase()}|${(c.companyName||'').trim().toLowerCase()}`;
      if(!groups[key]) groups[key] = [];
      groups[key].push(c);
  });
   
  grid.innerHTML = Object.values(groups).map(group => {
      if(group.length === 1) {
          return generateDossierHTML(group[0]);
      } else {
          return generateMasterDossierHTML(group);
      }
  }).join('');
}

function openCompoundForm(existing){
  editingCompoundId = existing ? existing.id : null; document.getElementById('formTitle').textContent = existing ? 'تعديل المشروع' : 'إضافة مشروع جديد';
  
  let defaultLoc = '';
  if (activeLocationIds.length === 1) { let isSub = mainLocations.some(m => m.subLocations.some(s => s.id === activeLocationIds[0])); if (isSub) defaultLoc = activeLocationIds[0]; }
  if(existing) document.getElementById('fldLocation').value = existing.locationId || ''; else document.getElementById('fldLocation').value = defaultLoc;
  
  if (existing) {
      document.getElementById('fldProjectType').value = existing.projectType || 'residential'; document.getElementById('fldCompany').value = existing.companyName || ''; document.getElementById('fldProject').value = existing.projectName || ''; document.getElementById('fldPhaseName').value = existing.phaseName || ''; document.getElementById('fldFloors').value = existing.floors || ''; document.getElementById('fldOwner').value = existing.ownerName || ''; document.getElementById('fldConsultant').value = existing.consultant || ''; 
      document.getElementById('fldPriceMeterMin').value = existing.pricePerMeterMin ? formatNum(existing.pricePerMeterMin) : ''; document.getElementById('fldPriceMeterMax').value = existing.pricePerMeterMax ? formatNum(existing.pricePerMeterMax) : '';
      let cp = existing.commercialPrices || {}; document.getElementById('fldAdminMin').value = cp.adminMin ? formatNum(cp.adminMin) : ''; document.getElementById('fldAdminMax').value = cp.adminMax ? formatNum(cp.adminMax) : ''; document.getElementById('fldAdminFinish').value = cp.adminFinish || 'core_shell'; document.getElementById('fldCommMin').value = cp.commMin ? formatNum(cp.commMin) : ''; document.getElementById('fldCommMax').value = cp.commMax ? formatNum(cp.commMax) : ''; document.getElementById('fldCommFinish').value = cp.commFinish || 'core_shell'; document.getElementById('fldClinicMin').value = cp.clinicMin ? formatNum(cp.clinicMin) : ''; document.getElementById('fldClinicMax').value = cp.clinicMax ? formatNum(cp.clinicMax) : ''; document.getElementById('fldClinicFinish').value = cp.clinicFinish || 'core_shell'; document.getElementById('fldRecMin').value = cp.recMin ? formatNum(cp.recMin) : ''; document.getElementById('fldRecMax').value = cp.recMax ? formatNum(cp.recMax) : ''; document.getElementById('fldRecFinish').value = cp.recFinish || 'core_shell';
      document.getElementById('fldMaintenancePercent').value = existing.maintenancePercent || ''; document.getElementById('fldParkingFee').value = existing.parkingFee ? formatNum(existing.parkingFee) : ''; document.getElementById('fldProjectSize').value = existing.projectSize || ''; document.getElementById('fldDeliveryDate').value = existing.deliveryDate || ''; document.getElementById('fldFinishingStatus').value = existing.finishingStatus || 'core_shell'; document.getElementById('fldLocationDetail').value = existing.compoundLocationDetail || ''; document.getElementById('fldLocationLink').value = existing.locationLink || ''; document.getElementById('fldCashDiscount').value = existing.cashDiscount || ''; 
  } else {
      document.getElementById('fldProjectType').value = 'residential'; ['fldCompany','fldProject','fldPhaseName','fldFloors','fldOwner','fldConsultant','fldPriceMeterMin','fldPriceMeterMax','fldAdminMin','fldAdminMax','fldCommMin','fldCommMax','fldClinicMin','fldClinicMax','fldRecMin','fldRecMax','fldMaintenancePercent','fldParkingFee','fldProjectSize','fldDeliveryDate','fldLocationDetail','fldLocationLink','fldCashDiscount'].forEach(id => { document.getElementById(id).value = ''; }); ['fldFinishingStatus', 'fldAdminFinish', 'fldCommFinish', 'fldClinicFinish', 'fldRecFinish'].forEach(id => { document.getElementById(id).value = 'core_shell'; });
  }
  onProjectTypeChange(); tempUnits = existing ? JSON.parse(JSON.stringify(existing.unitTypes||[])) : []; if (existing) { tempUnits.forEach(u => { u.bedroomType = getCorrectedUnitType(u.bedroomType, existing.projectType); }); } tempPlans = existing ? JSON.parse(JSON.stringify(existing.paymentPlans||[])) : []; tempDecrees = existing ? JSON.parse(JSON.stringify(existing.ministerialDecrees||[])) : []; updatePriceMeterAvg(); renderUnitRows(); renderPlanRows(); renderDecreeRows(); document.getElementById('formOverlay').classList.add('open');
}

function onProjectTypeChange() { const isComm = document.getElementById('fldProjectType').value === 'commercial'; document.querySelectorAll('.res-price-field').forEach(el => el.style.display = isComm ? 'none' : 'block'); document.querySelectorAll('.res-field').forEach(el => el.style.display = isComm ? 'none' : 'block'); document.getElementById('commercialPriceWrap').style.display = isComm ? 'block' : 'none'; if (isComm) document.getElementById('priceMeterAvgWrap').style.display = 'none'; renderUnitRows(); }
function getAverageCommercialPrice(bType) { let min = 0, max = 0; if (bType === 'admin') { min = getRawNum(document.getElementById('fldAdminMin').value); max = getRawNum(document.getElementById('fldAdminMax').value); } else if (bType === 'commercial') { min = getRawNum(document.getElementById('fldCommMin').value); max = getRawNum(document.getElementById('fldCommMax').value); } else if (bType === 'clinic') { min = getRawNum(document.getElementById('fldClinicMin').value); max = getRawNum(document.getElementById('fldClinicMax').value); } else if (bType === 'recreational') { min = getRawNum(document.getElementById('fldRecMin').value); max = getRawNum(document.getElementById('fldRecMax').value); } if (min > 0 && max > 0) return (min + max) / 2; return min || max || getAveragePricePerMeter(); }
function getAveragePricePerMeter(){ const min = getRawNum(document.getElementById('fldPriceMeterMin').value); const max = getRawNum(document.getElementById('fldPriceMeterMax').value); if(min > 0 && max > 0) return (min + max) / 2; return min || max || 0; }
function updatePriceMeterAvg(){ const isComm = document.getElementById('fldProjectType').value === 'commercial'; const avg = getAveragePricePerMeter(); const wrap = document.getElementById('priceMeterAvgWrap'); if (wrap) wrap.style.display = (avg > 0 && !isComm) ? 'block' : 'none'; const avgInput = document.getElementById('fldPriceMeterAvg'); if (avgInput) avgInput.value = formatNum(Math.round(avg)) + ' جنيه'; tempUnits.forEach(u => updateUnitData(u.id, 'recalc', null)); }

function addUnitRow(){ const pType = document.getElementById('fldProjectType').value; tempUnits.push({id:uid(), bedroomType: pType === 'commercial' ? 'commercial' : 'studio', area:'', gardenArea:'', price:''}); renderUnitRows(); }
function removeUnitRow(id){ tempUnits = tempUnits.filter(u=>u.id!==id); renderUnitRows(); }

function updateUnitData(id, field, val) {
    const u = tempUnits.find(x => x.id === id);
    if (!u) return;
    if (field === 'bedroomType') { u.bedroomType = val; } else if (field === 'price') { u.price = getRawNum(val); return; } else if (field === 'area' || field === 'gardenArea') { u[field] = parseFloat(val) || 0; }

    const pType = document.getElementById('fldProjectType').value;
    let avg = pType === 'commercial' ? getAverageCommercialPrice(u.bedroomType) : getAveragePricePerMeter();
    
    if (avg > 0) {
        let mainPrice = (u.area || 0) * avg; let gardenPrice = (u.gardenArea || 0) * (avg / 3); 
        if (mainPrice > 0 || gardenPrice > 0) {
            u.price = Math.round(mainPrice + gardenPrice); document.getElementById(`price-input-${u.id}`).value = u.price ? formatNum(u.price) : '';
        }
    }
}

function renderUnitRows(){ 
    const pType = document.getElementById('fldProjectType').value; 
    let optionsHtml = pType === 'commercial' ? `<option value="commercial">تجاري (Commercial)</option><option value="admin">إداري (Admin)</option><option value="clinic">عيادة / طبي (Clinic)</option><option value="recreational">ترفيهي (Recreational)</option>` : `<option value="apartment">شقة (Apartment)</option><option value="studio">استوديو (Studio)</option><option value="1br">1 غرفة نوم</option><option value="2br">2 غرفة نوم</option><option value="3br">3 غرف نوم</option><option value="4br">4 غرف نوم</option><option value="villa">فيلا (Villa)</option><option value="twinhouse">توين هاوس</option><option value="townhouse">تاون هاوس</option><option value="duplex">دوبلكس</option><option value="penthouse">بنتهاوس</option><option value="chalet">شاليه</option>`; 
    document.getElementById('unitRows').innerHTML = tempUnits.map(u=> { 
        let bType = getCorrectedUnitType(u.bedroomType, pType); 
        return `<div class="repeat-row" style="display:flex; gap:10px; align-items:center;">
                    <select style="flex:1.2; min-width:90px;" onchange="updateUnitData('${u.id}','bedroomType',this.value)">${optionsHtml.includes(`value="${bType}"`) ? optionsHtml.replace(`value="${bType}"`, `value="${bType}" selected`) : optionsHtml}</select>
                    <input type="number" placeholder="مباني(م²)" style="flex:1; min-width:70px;" value="${u.area||''}" oninput="updateUnitData('${u.id}', 'area', this.value)">
                    <input type="number" placeholder="جاردن(م²)" style="flex:1; min-width:70px;" value="${u.gardenArea||''}" oninput="updateUnitData('${u.id}', 'gardenArea', this.value)">
                    <input type="text" id="price-input-${u.id}" placeholder="إجمالي السعر" style="flex:1.5; min-width:100px; font-weight:800; color:var(--text-main);" value="${u.price ? formatNum(u.price) : ''}" oninput="formatInput(this); updateUnitData('${u.id}','price',this.value)" autocomplete="off">
                    <button class="row-del" style="flex-shrink:0;" onclick="removeUnitRow('${u.id}')" aria-label="حذف الوحدة">✕</button>
                </div>` 
    }).join('') || '<div style="color:var(--text-muted); text-align:center; padding:10px;">لا يوجد وحدات مضافة</div>'; 
}

function addPlanRow(){ tempPlans.push({id:uid(), name:'', discountPercent:'', downPaymentPercent:'', years:'', frequency:'12', notes:'', customBullets:[]}); renderPlanRows(); }
function removePlanRow(id){ tempPlans = tempPlans.filter(p=>p.id!==id); renderPlanRows(); }
function addBulletRow(pId){ tempPlans.find(p=>p.id===pId)?.customBullets.push({id:uid(), type:'annual', percent:'', selectedYears:[]}); renderPlanRows(); }
function removeBulletRow(pId, bId){ const p=tempPlans.find(x=>x.id===pId); if(p) p.customBullets=p.customBullets.filter(b=>b.id!==bId); renderPlanRows(); }

function toggleYearSelection(pId, bId, y){ 
    const b = tempPlans.find(p=>p.id===pId)?.customBullets.find(x=>x.id===bId); 
    if(b){ if(!b.selectedYears) b.selectedYears = []; const i = b.selectedYears.indexOf(y); i > -1 ? b.selectedYears.splice(i,1) : b.selectedYears.push(y); renderPlanRows(); } 
}

function renderPlanRows(){ 
    document.getElementById('planRows').innerHTML = tempPlans.map(p=>`<div class="plan-card">
        <div class="plan-card-header" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <input placeholder="اسم الخطة" style="flex:2; min-width:120px;" value="${escapeHtml(p.name)}" oninput="updatePlan('${p.id}','name',this.value)" autocomplete="off">
            <input type="number" placeholder="% خصم" style="width:70px; flex-shrink:0;" value="${p.discountPercent||''}" oninput="updatePlan('${p.id}','discountPercent',this.value)">
            <input type="number" placeholder="% مقدم" style="width:70px; flex-shrink:0;" value="${p.downPaymentPercent}" oninput="updatePlan('${p.id}','downPaymentPercent',this.value)">
            <input type="number" placeholder="سنوات" style="width:70px; flex-shrink:0;" value="${p.years}" oninput="updatePlan('${p.id}','years',this.value)">
            <select style="min-width:100px; flex-shrink:0;" onchange="updatePlan('${p.id}','frequency',this.value)">${Object.entries(FREQ_LABEL).map(([k,v])=>`<option value="${k}" ${p.frequency==k?'selected':''}>${v}</option>`).join('')}</select>
            <button class="row-del" style="flex-shrink:0;" onclick="removePlanRow('${p.id}')" aria-label="حذف الخطة">✕</button>
        </div>
        <input placeholder="ملاحظات" style="width:100%;margin-bottom:8px;padding:12px;border-radius:var(--radius-input);border:1px solid var(--border-color);background:var(--item-bg);color:var(--text-main);" value="${escapeHtml(p.notes||'')}" oninput="updatePlan('${p.id}','notes',this.value)" autocomplete="off">
        <div class="bullets-container">
            ${p.customBullets.map(b=>`<div class="bullet-row">
                <div class="bullet-top" style="display:flex; gap:10px; align-items:center;">
                    <select style="flex:1; min-width:100px;" onchange="updateBullet('${p.id}','${b.id}','type',this.value)">
                        <option value="annual" ${b.type==='annual'?'selected':''}>دفعة سنوية</option>
                        <option value="deferred" ${b.type==='deferred'?'selected':''}>دفعة مؤجلة</option>
                        <option value="delivery" ${b.type==='delivery'?'selected':''}>استلام</option>
                        <option value="after_3m" ${b.type==='after_3m'?'selected':''}>بعد 3 شهور</option>
                        <option value="after_6m" ${b.type==='after_6m'?'selected':''}>بعد 6 شهور</option>
                        <option value="after_9m" ${b.type==='after_9m'?'selected':''}>بعد 9 شهور</option>
                    </select>
                    <input type="number" placeholder="%" style="width:80px; flex-shrink:0;" value="${b.percent}" oninput="updateBullet('${p.id}','${b.id}','percent',this.value)">
                    <button class="row-del" style="flex-shrink:0;" onclick="removeBulletRow('${p.id}','${b.id}')" aria-label="حذف الدفعة">✕</button>
                </div>
                ${b.type==='annual'?`<div class="years-pills" style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; justify-content:center; width:100%;">${[1,2,3,4,5].map(yr=>`<div class="year-pill ${(b.selectedYears || []).includes(yr)?'selected':''}" onclick="toggleYearSelection('${p.id}','${b.id}',${yr})">${yr}</div>`).join('')}</div>`:''}
            </div>`).join('')}
            <button class="btn btn-outline-light w-100 btn-pill" onclick="addBulletRow('${p.id}')">+ دفعة خاصة</button>
        </div>
    </div>`).join('') || '<div style="color:var(--text-muted); text-align:center; padding:10px;">لا توجد خطط سداد</div>'; 
}

function updatePlan(id, field, val){ const p = tempPlans.find(x=>x.id===id); if(p) p[field] = (field==='name'||field==='notes'||field==='frequency')?val:(parseFloat(val)||0); }
function updateBullet(pId, bId, field, val){ const b = tempPlans.find(x=>x.id===pId)?.customBullets.find(x=>x.id===bId); if(b){ b[field] = field==='type'?val:(parseFloat(val)||0); if(field==='type')renderPlanRows();} }
function addDecreeRow(){ tempDecrees.push({id:uid(), decreeNumber:'', description:'', date:''}); renderDecreeRows(); }
function removeDecreeRow(id){ tempDecrees = tempDecrees.filter(d=>d.id!==id); renderDecreeRows(); }
function renderDecreeRows(){ document.getElementById('decreeRows').innerHTML = tempDecrees.map(d=>`<div class="repeat-row"><input placeholder="الرقم" style="width:100px;" value="${escapeHtml(d.decreeNumber)}" oninput="tempDecrees.find(x=>x.id==='${d.id}').decreeNumber=this.value" autocomplete="off"><input placeholder="الوصف" style="flex:1;" value="${escapeHtml(d.description)}" oninput="tempDecrees.find(x=>x.id==='${d.id}').description=this.value" autocomplete="off"><input type="date" value="${d.date}" oninput="tempDecrees.find(x=>x.id==='${d.id}').date=this.value"><button class="row-del" onclick="removeDecreeRow('${d.id}')" aria-label="حذف القرار">✕</button></div>`).join(''); }

function openDetail(id){
  const c = compounds.find(x=>x.id===id); if(!c) return; viewingCompoundId = id;
  const availTypes = Array.from(new Set((c.unitTypes||[]).map(u => getCorrectedUnitType(u.bedroomType, c.projectType))));
  activeDetailCategory = availTypes.length ? availTypes[0] : null; activeDetailUnitId = (c.unitTypes||[]).filter(u => getCorrectedUnitType(u.bedroomType, c.projectType) === activeDetailCategory)[0]?.id || null;
  renderDetailModalContent(); document.getElementById('detailOverlay').classList.add('open');
}
function setDetailCategory(catKey) { activeDetailCategory = catKey; const c = compounds.find(x => x.id === viewingCompoundId); if (c && c.unitTypes) { const matched = c.unitTypes.filter(u => getCorrectedUnitType(u.bedroomType, c.projectType) === catKey); if (matched.length > 0) activeDetailUnitId = matched[0].id; } renderDetailModalContent(); }
function setDetailUnit(unitId) { activeDetailUnitId = unitId; renderDetailModalContent(); }
function editCurrentCompound(){ const c = compounds.find(x=>x.id===viewingCompoundId); if(!c) return; closeModal('detailOverlay'); openCompoundForm(c); }

function renderDetailModalContent() {
  const c = compounds.find(x => x.id === viewingCompoundId); if (!c) return;
  
  let modalTitle = c.projectName;
  if(c.phaseName) modalTitle += ` - ${c.phaseName}`;
  document.getElementById('detailTitle').textContent = modalTitle;
  
  document.getElementById('btnEditCompound').style.display = isEditor ? 'inline-block' : 'none';
  document.getElementById('btnDeleteCompound').style.display = isEditor ? 'inline-block' : 'none';

  let finishText = FINISHING_TYPES[c.finishingStatus] || '-'; let parkingText = formatNum(c.parkingFee || 0) + ' ج'; let pText = '';
  if (c.projectType === 'commercial') {
      finishText = 'حسب النشاط (موضح بالأسعار)'; parkingText = 'لا يوجد';
      let cp = c.commercialPrices || {}; let parts = []; const fName = { core_shell: 'Core & Shell', semi: 'نصف تشطيب', full: 'تشطيب كامل' };
      if (cp.adminMin || cp.adminMax) parts.push(`<b>إداري:</b> ${formatNum(cp.adminMin)} - ${formatNum(cp.adminMax)} <span style="color:var(--primary); font-size:11px;">(${fName[cp.adminFinish||'core_shell']})</span>`);
      if (cp.commMin || cp.commMax) parts.push(`<b>تجاري:</b> ${formatNum(cp.commMin)} - ${formatNum(cp.commMax)} <span style="color:var(--primary); font-size:11px;">(${fName[cp.commFinish||'core_shell']})</span>`);
      if (cp.clinicMin || cp.clinicMax) parts.push(`<b>طبي:</b> ${formatNum(cp.clinicMin)} - ${formatNum(cp.clinicMax)} <span style="color:var(--primary); font-size:11px;">(${fName[cp.clinicFinish||'core_shell']})</span>`);
      if (cp.recMin || cp.recMax) parts.push(`<b>ترفيهي:</b> ${formatNum(cp.recMin)} - ${formatNum(cp.recMax)} <span style="color:var(--primary); font-size:11px;">(${fName[cp.recFinish||'core_shell']})</span>`);
      pText = parts.length > 0 ? `<div style="display:flex; flex-direction:column; gap:6px; font-size:13px; margin-top:4px;">${parts.join('')}</div>` : ((c.pricePerMeterMin && c.pricePerMeterMax) ? `${formatNum(c.pricePerMeterMin)} - ${formatNum(c.pricePerMeterMax)} ج` : `${formatNum(c.pricePerMeterMin||0)} ج`);
  } else { pText = (c.pricePerMeterMin && c.pricePerMeterMax) ? `${formatNum(c.pricePerMeterMin)} - ${formatNum(c.pricePerMeterMax)} ج` : `${formatNum(c.pricePerMeterMin||c.pricePerMeter||0)} ج`; }
  const locLinkHtml = c.locationLink ? `<br><a href="${escapeHtml(c.locationLink)}" target="_blank" style="color:var(--primary); font-size:12px; text-decoration:none; display:inline-block; margin-top:8px; font-weight:bold; background:var(--item-bg); padding:6px 12px; border-radius:50px; border:1px solid var(--primary);">📍 عرض على الخريطة</a>` : '';
  
  let html = `<div class="detail-grid"><div class="detail-item"><b>النوع</b><span>${PROJECT_TYPES[c.projectType || 'residential']}</span></div><div class="detail-item"><b>المطور</b><span>${escapeHtml(c.companyName || '-')}</span></div><div class="detail-item"><b>المالك</b><span>${escapeHtml(c.ownerName || '-')}</span></div><div class="detail-item"><b>الاستشاري الهندسي</b><span>${escapeHtml(c.consultant || '-')}</span></div><div class="detail-item"><b>المنطقة والفرع</b><span>${escapeHtml(findSubLocationName(c.locationId))}</span></div><div class="detail-item"><b>التسليم والتشطيب</b><span>${deliveryLabel(c.deliveryDate)} | ${finishText}</span></div><div class="detail-item" ${c.projectType === 'commercial' ? 'style="align-items:start;"' : ''}><b>سعر المتر</b><span>${pText}</span></div><div class="detail-item"><b>الصيانة والجراج</b><span>صيانة: ${c.maintenancePercent || 0}% | جراج: ${parkingText}</span></div><div class="detail-item"><b>المساحة الإجمالية</b><span>${c.projectSize ? c.projectSize + ' فدان' : '-'}</span></div><div class="detail-item"><b>ارتفاع العمارات</b><span>${c.floors ? 'أرضي + ' + c.floors + ' أدوار' : '-'}</span></div><div class="detail-item full"><b>الموقع بالتفصيل</b><span>${escapeHtml(c.compoundLocationDetail || '-')} ${locLinkHtml}</span></div></div>`;

  const grouped = {}; (c.unitTypes||[]).forEach(u => { let t = getCorrectedUnitType(u.bedroomType, c.projectType); (grouped[t] = grouped[t] || []).push(u); }); const cats = Object.keys(grouped);
  if(cats.length){
    if(!activeDetailCategory || !grouped[activeDetailCategory]) activeDetailCategory = cats[0]; if(!activeDetailUnitId && grouped[activeDetailCategory] && grouped[activeDetailCategory].length > 0) activeDetailUnitId = grouped[activeDetailCategory][0].id;
    html += `<div class="section-label">حساب الأقساط والكاش</div><div class="unit-cat-tabs">` + cats.map(k => `<button class="unit-cat-btn ${k === activeDetailCategory ? 'active' : ''}" onclick="setDetailCategory('${k}')">${BEDROOM_TYPES[k] || k}</button>`).join('') + `</div>`;
    
    html += `<div class="size-picker-container">` + (grouped[activeDetailCategory] || []).map(u => {
        let gText = u.gardenArea ? ` + جاردن ${u.gardenArea}م²` : '';
        return `<div class="size-chip ${u.id === activeDetailUnitId ? 'active' : ''}" onclick="setDetailUnit('${u.id}')">${u.area}م²${gText} | ${formatNum(u.price)} ج</div>`
    }).join('') + `</div>`;
    
    const sUnit = (c.unitTypes || []).find(u => u.id === activeDetailUnitId) || (grouped[activeDetailCategory] ? grouped[activeDetailCategory][0] : null);
    
    let cashDiscount = c.cashDiscount || 0;
    if (sUnit && cashDiscount > 0) {
        let discountAmount = sUnit.price * (cashDiscount / 100);
        let finalCashPrice = sUnit.price - discountAmount;
        html += `<div class="cash-discount-box">
                    <div class="cash-row"><span>السعر الأساسي</span><b>${formatNum(sUnit.price)} ج</b></div>
                    <div class="cash-row highlight"><span>قيمة خصم الكاش (${cashDiscount}%)</span><b>- ${formatNum(Math.round(discountAmount))} ج</b></div>
                    <div class="cash-row final"><span>السعر النهائي (كاش)</span><b>${formatNum(Math.round(finalCashPrice))} ج</b></div>
                 </div>`;
    }

    if(sUnit && c.paymentPlans && c.paymentPlans.length > 0){
      html += `<div class="category-box"><table class="spec-table"><tr><th>الخطة</th><th>خصم</th><th>مقدم</th><th>دفعات</th><th>قسط شهري</th><th>قسط ربع سنوي</th></tr>`;
      c.paymentPlans.forEach(p => { const r = calcInstallmentWithDiscount(sUnit.price || 0, p.discountPercent, p.downPaymentPercent, p.customBullets, p.years, 12); html += `<tr><td>${escapeHtml(p.name)}</td><td>${p.discountPercent ? p.discountPercent + '%' : '-'}</td><td>${formatNum(Math.round(r.downPayment))} ج<br><small>(%${p.downPaymentPercent || 0})</small></td><td>${r.bulletsSummary.map(b => b.label).join('<br>') || '-'}</td><td style="color:var(--primary);"><b>${formatNum(Math.round(r.monthlyEquivalent))} ج</b></td><td><b>${formatNum(Math.round(r.quarterlyEquivalent))} ج</b></td></tr>`; }); html += `</table></div>`;
    }
  } document.getElementById('detailBody').innerHTML = html;
}

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
                const perYearVal = netTotal * (pct / 100);
                const totalBulletVal = perYearVal * count; 
                extraPaymentsTotal += totalBulletVal; 
                bulletsSummary.push({ type: 'annual', label: `دفعة سنوية: %${pct} (${count} سنوات) = ${formatNum(Math.round(totalBulletVal))} ج`, perYearVal }); 
            } else { 
                const val = netTotal * (pct / 100); 
                extraPaymentsTotal += val; 
                let name = 'دفعة مؤجلة';
                if (b.type === 'delivery') name = 'دفعة استلام';
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

function updateCalcBullet(id, f, v){ const b = calcCustomBullets.find(x=>x.id===id); if(b){ b[f] = f==='type' ? v : (parseFloat(v)||0); if(f==='type') renderCalcBulletsRows(); } }

function renderCalcBulletsRows(){ 
    document.getElementById('calcBulletsRows').innerHTML = calcCustomBullets.map(b=>`<div class="bullet-row">
        <div class="bullet-top" style="display:flex; gap:10px; align-items:center;">
            <select style="flex:1; min-width:100px;" onchange="updateCalcBullet('${b.id}','type',this.value)">
                <option value="annual" ${b.type=='annual'?'selected':''}>سنوية</option>
                <option value="deferred" ${b.type=='deferred'?'selected':''}>مؤجلة</option>
                <option value="delivery" ${b.type=='delivery'?'selected':''}>استلام</option>
                <option value="after_3m" ${b.type=='after_3m'?'selected':''}>بعد 3 شهور</option>
                <option value="after_6m" ${b.type=='after_6m'?'selected':''}>بعد 6 شهور</option>
                <option value="after_9m" ${b.type=='after_9m'?'selected':''}>بعد 9 شهور</option>
            </select>
            <input type="number" placeholder="%" style="width:80px; flex-shrink:0;" value="${b.percent}" oninput="updateCalcBullet('${b.id}','percent',this.value)">
            <button class="row-del" style="flex-shrink:0;" onclick="removeCalcBulletRow('${b.id}')">✕</button>
        </div>
        ${b.type==='annual'?`<div class="years-pills" style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; justify-content:center; width:100%;">${[1,2,3,4,5].map(yr=>`<div class="year-pill ${(b.selectedYears || []).includes(yr)?'selected':''}" onclick="toggleCalcYearSelection('${b.id}',${yr})">${yr}</div>`).join('')}</div>`:''}
    </div>`).join(''); 
}

function runUniversalCalculator(){ 
    const inputVal = document.getElementById('calcTotal').value.replace(/,/g, '');
    const t = parseFloat(inputVal); 
    if(!t) return showToast('أدخل إجمالي السعر'); 
    
    const r = calcInstallmentWithDiscount(t, parseFloat(document.getElementById('calcDiscountPct').value)||0, parseFloat(document.getElementById('calcDownPct').value)||0, calcCustomBullets, parseFloat(document.getElementById('calcYears').value)||0, 12); 
    
    const box = document.getElementById('calcResult'); 
    box.style.display='grid'; 
    
    let bulletsHtml = r.bulletsSummary.length > 0 
        ? `<div class="calc-item" style="grid-column: 1 / -1; background: var(--bg-main); padding: 12px; border-radius: var(--radius-input); border: 1px dashed var(--primary); text-align:right;">
            <span style="display:block; margin-bottom:6px; color:var(--primary); font-weight:800;">الدفعات الخاصة المحسوبة:</span>
            ${r.bulletsSummary.map(b => `<div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:4px;">• ${b.label}</div>`).join('')}
           </div>` 
        : '';

    box.innerHTML = `
        <div class="calc-item"><span>السعر الصافي</span><b>${formatNum(Math.round(r.netTotal))} ج</b></div>
        <div class="calc-item"><span>المقدم</span><b>${formatNum(Math.round(r.downPayment))} ج</b></div>
        ${bulletsHtml}
        <div class="calc-highlight"><span>القسط الشهري</span><b>${formatNum(Math.round(r.monthlyEquivalent))} جنيه</b></div>
        <div class="calc-item" style="background: var(--bg-main); padding: 10px; border-radius: var(--radius-input);"><span>قسط ربع سنوي</span><b style="color:var(--text-main); font-size:16px;">${formatNum(Math.round(r.quarterlyEquivalent))} ج</b></div>
        <div class="calc-item" style="background: var(--bg-main); padding: 10px; border-radius: var(--radius-input);"><span>قسط سنوي</span><b style="color:var(--text-main); font-size:16px;">${formatNum(Math.round(r.monthlyEquivalent * 12))} ج</b></div>
    `; 
}

document.getElementById('calcTotal').addEventListener('input', function() { let raw = this.value.replace(/[^0-9]/g, ''); this.value = raw ? Number(raw).toLocaleString('en-US') : ''; });

function closeModal(id){ 
    if (id === 'formOverlay') { if(!confirm('هل أنت متأكد من إغلاق النافذة؟ لن يتم حفظ التعديلات الأخيرة.')) return; }
    document.getElementById(id).classList.remove('open'); 
}

document.addEventListener('click', (e)=>{ 
    if(e.target.classList.contains('overlay')) {
        if(e.target.id === 'formOverlay' || e.target.id === 'phasesOverlay') return; 
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
    try { await ensureXLSXLoaded(); } catch (e) { alert("تعذر تحميل مكتبة قراءة ملفات الإكسيل. تأكد من اتصال الإنترنت وحاول مرة أخرى."); document.getElementById('loadingOverlay').style.display = 'none'; event.target.value = ''; return; }
    document.getElementById('loadingMsg').textContent = "جاري قراءة الشيت وتجهيز المشاريع...";
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, {type: 'array'}); let compoundsToUpload = {}; const mainLocId = uid(); let excelMainLoc = { id: mainLocId, name: "استيراد سكني", subLocations: [] };
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName]; const rows = XLSX.utils.sheet_to_json(worksheet, { range: 1, defval: "" }); if (rows.length === 0) return; const subLocId = uid(); excelMainLoc.subLocations.push({ id: subLocId, name: sheetName });
                rows.forEach(row => {
                    let projName = row['Project'] || row['project'] || ''; let devName = row['Developer'] || row['developer'] || ''; if (!projName && !devName) return; let compKey = `${projName}_${devName}`;
                    if (!compoundsToUpload[compKey]) { compoundsToUpload[compKey] = { id: uid(), locationId: subLocId, projectType: 'residential', companyName: String(devName).trim(), projectName: String(projName).trim(), ownerName: '', consultant: String(row['Engineering Consult'] || row['Engineering Consultant'] || '').trim(), pricePerMeterMin: parseFloat(row['Price Per Meter']) || 0, pricePerMeterMax: parseFloat(row['Price Per Meter']) || 0, maintenancePercent: parseFloat(row['Maintenance Fees %']) || 0, projectSize: parseFloat(row['Project area']) || 0, deliveryDate: String(row['Delivery Date'] || '').trim(), finishingStatus: String(row['Finishing type'] || '').toLowerCase().includes('core') ? 'core_shell' : (String(row['Finishing type'] || '').toLowerCase().includes('full') ? 'full' : 'semi'), compoundLocationDetail: String(row['Location On Map'] || '').trim(), locationLink: String(row['Location On Map'] || '').includes('http') ? String(row['Location On Map'] || '').trim() : '', cashDiscount: 0, unitTypes: [], paymentPlans: [], ministerialDecrees: row['قرار وزاري'] ? [{id: uid(), decreeNumber: '', description: String(row['قرار وزاري']), date: ''}] : [] }; }
                    
                    let area = parseFloat(row['BUA From']) || parseFloat(row['BUA To']) || parseFloat(row['Area']) || 0; 
                    let gardenArea = parseFloat(row['Garden Area']) || parseFloat(row['Garden']) || parseFloat(row['جاردن']) || 0;
                    let price = parseFloat(row['Price From']) || parseFloat(row['Price To']) || 0; 
                    let bedStr = String(row['No of Bedrooms'] || '').toLowerCase(); let unitTypeStr = String(row['Unit Type'] || '').toLowerCase(); let bType = 'studio'; if(bedStr.includes('1')) bType = '1br'; else if(bedStr.includes('2')) bType = '2br'; else if(bedStr.includes('3')) bType = '3br'; else if(bedStr.includes('4')) bType = '4br'; else if(bedStr.includes('duplex') || unitTypeStr.includes('duplex')) bType = 'duplex'; else if(bedStr.includes('penthouse') || unitTypeStr.includes('penthouse')) bType = 'penthouse'; else if(bedStr.includes('villa') || unitTypeStr.includes('villa')) bType = 'villa'; else if(bedStr.includes('chalet') || unitTypeStr.includes('chalet')) bType = 'chalet';
                    if (area > 0 || price > 0 || gardenArea > 0) { compoundsToUpload[compKey].unitTypes.push({ id: uid(), bedroomType: bType, area: area, gardenArea: gardenArea, price: price }); }
                    let planStr = String(row['Payment Plan'] || '').trim(); if (planStr) { if (!compoundsToUpload[compKey].paymentPlans.some(p => p.notes === planStr)) { compoundsToUpload[compKey].paymentPlans.push({ id: uid(), name: "خطة سداد", notes: planStr, discountPercent: parseFloat(row['Cash Discount']) || 0, downPaymentPercent: 0, years: 0, frequency: '12', customBullets: [] }); } }
                });
            });
            const projectsArray = Object.values(compoundsToUpload);
            if (projectsArray.length === 0) { alert("لم يتم العثور على مشاريع أو البيانات غير متطابقة مع أسماء العواميد المطلوبة."); document.getElementById('loadingOverlay').style.display = 'none'; event.target.value = ''; return; }
            if (!confirm(`تم تجهيز وتجميع ${projectsArray.length} مشروع من ملف الإكسيل. هل تريد رفعهم للسيستم؟`)) { document.getElementById('loadingOverlay').style.display = 'none'; event.target.value = ''; return; }
            document.getElementById('loadingMsg').textContent = "جاري الحفظ في قاعدة البيانات...";
            if(excelMainLoc.subLocations.length > 0){ mainLocations.push(excelMainLoc); await db.collection('system').doc('locations').set({ mainLocations }); }
            let batch = db.batch(), count = 0, totalUploaded = 0;
            for (let i = 0; i < projectsArray.length; i++) { let proj = projectsArray[i]; proj.timestamp = firebase.firestore.FieldValue.serverTimestamp(); let docRef = db.collection("compounds").doc(proj.id); batch.set(docRef, proj); count++; totalUploaded++; if (count === 400 || i === projectsArray.length - 1) { await batch.commit(); batch = db.batch(); count = 0; } }
            showToast(`✅ تم استيراد ${totalUploaded} مشروع من الإكسيل بنجاح!`); event.target.value = ''; setTimeout(() => { location.reload(); }, 2000);
        } catch (error) { console.error("Error parsing Excel:", error); alert("حدث خطأ أثناء معالجة ملف الإكسيل. برجاء التأكد من تطابق أسماء العواميد مع النظام."); document.getElementById('loadingOverlay').style.display = 'none'; event.target.value = ''; }
    }; reader.readAsArrayBuffer(file);
}
populateDeliverySelects();
