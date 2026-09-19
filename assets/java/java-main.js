window.findSubLocationName = function(id) {
    if(!id) return '-';
    for(let m of mainLocations) {
        if(m.id === id) return m.name;
        if(m.subLocations) {
            let s = m.subLocations.find(x => x.id === id);
            if(s) return s.name;
        }
    }
    return '-';
};

window.syncCloudData = async function() {
    try {
        const settingsDoc = await db.collection('system').doc('settings').get();
        if(settingsDoc.exists) {
            const s = settingsDoc.data();
            if(s.resTypes) appSettings.resTypes = s.resTypes;
            if(s.commTypes) appSettings.commTypes = s.commTypes;
        }

        const locDoc = await db.collection('system').doc('locations').get();
        if(locDoc.exists) {
            mainLocations = locDoc.data().mainLocations || [];
        } else {
            mainLocations = [];
        }
        if(typeof window.renderLocationTree === 'function') window.renderLocationTree();

        db.collection('compounds').onSnapshot(snapshot => {
            compounds = [];
            snapshot.forEach(doc => {
                let data = doc.data();
                data.id = doc.id;
                compounds.push(data);
            });
            const ps = document.getElementById('pageSub');
            if(ps) ps.textContent = `${compounds.length} مشروع مسجل بالسحابة`;
            if(typeof window.renderAdminStats === 'function') window.renderAdminStats();
            if(typeof window.renderGrid === 'function') window.renderGrid();
        }, error => {
            console.error("Error fetching compounds: ", error);
        });
    } catch (error) {
        console.error("Sync Error:", error);
    }
};

auth.onAuthStateChanged(async (user) => {
    try {
        if (user) {
            if (sessionStorage.getItem('isSystemOpen') !== 'true') { auth.signOut(); return; }
            
            let userDoc; try { userDoc = await db.collection('users').doc(user.email.toLowerCase()).get(); } catch(e) {}
            let role = 'viewer', expiryDate = '2024-01-01'; 
            if (userDoc && userDoc.exists) { role = userDoc.data().role || 'viewer'; expiryDate = userDoc.data().expiryDate || '2024-01-01'; } 
            else if (user.email.toLowerCase() === 'jeanhany04@gmail.com') { role = 'admin'; expiryDate = '2099-12-31'; await db.collection('users').doc(user.email.toLowerCase()).set({ role: 'admin', expiryDate: '2099-12-31' }); } 
            else { auth.signOut(); alert("هذا الحساب غير مسجل."); return; }
            
            if (new Date() > new Date(expiryDate)) { auth.signOut(); alert("لقد انتهت فترة اشتراكك."); return; }
            
            currentUser = user; isAdmin = (role === 'admin'); isEditor = (role === 'admin' || role === 'editor');
            
            let uLabel = document.getElementById('userEmailLabel');
            if(uLabel) uLabel.textContent = user.email.split('@')[0] + (isAdmin ? ' (المدير)' : (isEditor ? ' (محرر)' : ' (مشترك)'));
            
            let suAct = document.getElementById('superAdminActions'); if(suAct) suAct.style.display = isAdmin ? 'flex' : 'none'; 
            let addLoc = document.getElementById('addMainLocWrap'); if(addLoc) addLoc.style.display = isEditor ? 'flex' : 'none'; 
            let adAct = document.getElementById('adminActions'); if(adAct) adAct.style.display = isEditor ? 'flex' : 'none';
            
            let btnLog = document.getElementById('loginSubmitBtn');
            if(btnLog) btnLog.innerHTML = 'دخول';
            
            await window.syncCloudData(); 
            
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
    } catch (err) {
        console.error("Auth Error:", err);
        const btnLog = document.getElementById('loginSubmitBtn');
        if(btnLog) btnLog.innerHTML = 'دخول';
    }
});

// --- دوال المناطق والشجرة (مضبوطة بالأسهم) ---
window.renderLocationTree = function() {
    const tree = document.getElementById('locationTree');
    if(!tree) return;
    let html = '';
    mainLocations.forEach(m => {
        let isOpen = openMainLocIds[m.id] ? 'open' : '';
        let subListShow = openMainLocIds[m.id] ? 'show' : '';
        let isMainActive = (activeLocationIds.length === 1 && activeLocationIds[0] === m.id) ? 'active' : '';
        
        html += `<div class="loc-group">
            <div class="loc-group-header-row">
                <div class="loc-main-clickable ${isMainActive}" onclick="window.toggleMainLocFilter('${m.id}', event)">
                    <span>${window.escapeHtml(m.name)}</span>
                </div>
                <div style="display:flex; align-items:center; gap:0.25rem;">
                    ${isEditor ? `<button class="loc-del-btn" onclick="window.deleteMainLocation('${m.id}', event)">✕</button>` : ''}
                    <div class="arrow-toggle ${isOpen}" onclick="window.toggleLocSublist('${m.id}', event)">▶</div>
                </div>
            </div>
            <div class="sub-loc-list ${subListShow}" id="sublist-${m.id}">`;
        
        if (m.subLocations && m.subLocations.length > 0) {
            m.subLocations.forEach(s => {
                let isSubActive = activeLocationIds.includes(s.id) ? 'active' : '';
                html += `<div class="sub-loc-tab ${isSubActive}" onclick="window.toggleSubLocFilter('${s.id}')">
                    <span>${window.escapeHtml(s.name)}</span>
                    ${isEditor ? `<button class="loc-del-btn" style="width:1.25rem; height:1.25rem; font-size:0.625rem;" onclick="window.deleteSubLocation('${m.id}', '${s.id}', event)">✕</button>` : ''}
                </div>`;
            });
        }
        if (isEditor) {
            html += `<div class="add-sub-loc-box">
                <input type="text" id="newSubLocInput-${m.id}" placeholder="+ مدينة/حي جديد" onkeydown="if(event.key==='Enter') window.addSubLocation('${m.id}')">
                <button class="btn btn-primary-style btn-pill" style="padding:0 0.5rem; font-size:0.6875rem;" onclick="window.addSubLocation('${m.id}')">إضافة</button>
            </div>`;
        }
        html += `</div></div>`;
    });
    tree.innerHTML = html;
    const mobTree = document.getElementById('locWrapperMobile');
    if(mobTree) mobTree.innerHTML = html;
};

window.toggleLocSublist = function(id, e) {
    if(e) e.stopPropagation();
    openMainLocIds[id] = !openMainLocIds[id];
    window.renderLocationTree();
};

window.toggleMainLocFilter = function(id, e) {
    if(e) e.stopPropagation();
    if (activeLocationIds.length === 1 && activeLocationIds[0] === id) {
        activeLocationIds = [];
    } else {
        activeLocationIds = [id];
    }
    window.renderLocationTree();
    window.renderGrid();
};

window.toggleSubLocFilter = function(id) {
    if (activeLocationIds.includes(id)) {
        activeLocationIds = activeLocationIds.filter(x => x !== id);
    } else {
        activeLocationIds.push(id);
    }
    window.renderLocationTree();
    window.renderGrid();
};

window.deleteMainLocation = async function(id, e) {
    if(e) e.stopPropagation();
    if(!confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return;
    mainLocations = mainLocations.filter(m => m.id !== id);
    await db.collection('system').doc('locations').set({ mainLocations });
    window.renderLocationTree();
};

window.deleteSubLocation = async function(mainId, subId, e) {
    if(e) e.stopPropagation();
    if(!confirm('هل أنت متأكد من حذف هذا الحي؟')) return;
    let main = mainLocations.find(m => m.id === mainId);
    if(main && main.subLocations) {
        main.subLocations = main.subLocations.filter(s => s.id !== subId);
        await db.collection('system').doc('locations').set({ mainLocations });
        window.renderLocationTree();
    }
};

window.addMainLocation = async function() {
    const input = document.getElementById('newMainLocInput');
    const name = input ? input.value.trim() : '';
    if(!name) return;
    mainLocations.push({ id: window.uid(), name: name, subLocations: [] });
    await db.collection('system').doc('locations').set({ mainLocations });
    if(input) input.value = '';
    window.renderLocationTree();
};

window.addSubLocation = async function(mainId) {
    const input = document.getElementById(`newSubLocInput-${mainId}`);
    const name = input ? input.value.trim() : '';
    if(!name) return;
    let main = mainLocations.find(m => m.id === mainId);
    if(main) {
        if(!main.subLocations) main.subLocations = [];
        main.subLocations.push({ id: window.uid(), name: name });
        openMainLocIds[mainId] = true;
        await db.collection('system').doc('locations').set({ mainLocations });
        if(input) input.value = '';
        window.renderLocationTree();
    }
};

window.toggleMobileLoc = function() {
    const wrap = document.getElementById('locWrapperMobile');
    const btn = document.getElementById('mobileLocToggleBtn');
    if(wrap) {
        wrap.classList.toggle('show');
        if(btn) btn.classList.toggle('active');
    }
};

window.applyFilters = function(){
    filters.searchText = window.getSafeVal('fSearchText').trim();
    filters.propertyTypes = Array.from(document.querySelectorAll('.prop-type-cb:checked')).map(cb => cb.value);
    filters.bedrooms = selectedBeds.slice();
    filters.delivery = selectedDelivery.slice();
    filters.finishing = selectedFinishing.slice();
    filters.minPrice = window.getRawNum(window.getSafeVal('fMinPrice'));
    filters.maxPrice = window.getRawNum(window.getSafeVal('fMaxPrice'));
    filters.downPaymentTarget = window.getRawNum(window.getSafeVal('fDownPayment'));
    filters.maxMonthlyInstallment = window.getRawNum(window.getSafeVal('fMonthlyInstallment'));
    filters.sortOrder = window.getSafeVal('fSortOrder');
    window.renderGrid();
};

let searchDebounceTimer = null;
window.handleSearchInput = function(){
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => { window.applyFilters(); }, 300);
};

window.resetFilters = function(){
    filters = {};
    selectedBeds = []; selectedDelivery = []; selectedFinishing = [];
    document.querySelectorAll('.prop-type-cb').forEach(cb => cb.checked = false);
    document.querySelectorAll('#filterDrawer .pill').forEach(p => p.classList.remove('active'));
    ['fSearchText','fMinPrice','fMaxPrice','fDownPayment','fMonthlyInstallment'].forEach(id => window.setSafeVal(id, ''));
    const sortEl = document.getElementById('fSortOrder'); if (sortEl) sortEl.selectedIndex = 0;
    window.renderGrid();
};

window.selectProjectType = function(type, el){
    activeProjectType = type;
    document.querySelectorAll('.glass-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    window.renderGrid();
};

window.setCompletionFilter = function(val, el){
    completionFilter = val;
    document.querySelectorAll('.stat-card').forEach(s => s.classList.remove('active'));
    if (el) el.classList.add('active');
    window.renderGrid();
};

// 🔥 حماية إضافية للزراير 🔥
window.addEventListener('DOMContentLoaded', () => {
    const loginBtn1 = document.getElementById('siteBarLoginBtn');
    const loginBtn2 = document.getElementById('heroStartBtn');
    const modal = document.getElementById('paywallModal');

    if(loginBtn1) {
        loginBtn1.addEventListener('click', function(e) {
            e.preventDefault();
            if(modal) modal.style.display = 'flex';
        });
    }

    if(loginBtn2) {
        loginBtn2.addEventListener('click', function(e) {
            e.preventDefault();
            if(modal) modal.style.display = 'flex';
        });
    }
});
