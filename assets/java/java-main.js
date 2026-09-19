window.submitLogin = async function() { 
    try {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim(); 
        const btn = document.getElementById('loginSubmitBtn');
        
        if(!email || !password) { 
            alert("من فضلك أدخل الإيميل والباسورد"); 
            return; 
        } 
        
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
        alert("بيانات الدخول غير صحيحة أو يوجد مشكلة في الاتصال."); 
        console.error("Login Error:", err);
    }
};

auth.onAuthStateChanged(async (user) => {
  try {
      if (user) {
        if (sessionStorage.getItem('isSystemOpen') !== 'true') { auth.signOut(); return; }
        let userDoc; 
        try { userDoc = await db.collection('users').doc(user.email.toLowerCase()).get(); } catch(e) { console.warn("Fetching user doc failed:", e); }
        
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
            const btnLog = document.getElementById('loginSubmitBtn');
            if(btnLog) btnLog.innerHTML = 'دخول';
            alert("هذا الحساب غير مسجل."); 
            return; 
        }
        
        if (new Date() > new Date(expiryDate)) { 
            auth.signOut(); 
            const btnLog = document.getElementById('loginSubmitBtn');
            if(btnLog) btnLog.innerHTML = 'دخول';
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
        
        // الحماية اللي هتمنع السيستم إنه يعلق لو الدالة ممسوحة
        if (typeof window.syncCloudData === 'function') {
            await window.syncCloudData(); 
        } else {
            console.warn("syncCloudData is missing, skipping sync process.");
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
      alert("حدث خطأ غير متوقع أثناء الدخول. راجع الكونسول.");
  }
});
