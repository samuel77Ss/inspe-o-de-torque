/* Sincronização das baixas de torque – Firebase (Firestore + Auth) ou modo demonstração.
   Usado pelo app de campo e pelo sistema do escritório. */
(function(){
  const CFG = window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && !/COLE_AQUI/.test(window.FIREBASE_CONFIG.apiKey) ? window.FIREBASE_CONFIG : null;
  const C = window.CLOUD = { mode: CFG ? 'firebase' : 'demo', user: null, pending: 0, ready: false };
  let H = {}; // handlers

  // ---------------- MODO DEMONSTRAÇÃO (sem servidor: guarda no navegador, sincroniza entre abas) ----------------
  const DK = 'torque_demo_cloud_v1', UK = DK+'_user_'+location.pathname;
  const dLoad = ()=>{ try{ return JSON.parse(localStorage.getItem(DK))||{baixas:{},tm:null,users:{},log:[]}; }catch(e){ return {baixas:{},tm:null,users:{},log:[]}; } };
  const dSave = o=>localStorage.setItem(DK, JSON.stringify(o));
  function demoEmit(){ const o=dLoad(); H.onBaixas && H.onBaixas(o.baixas); if(o.tm && H.onTm) H.onTm(o.tm); }

  // ---------------- FIREBASE ----------------
  let app, auth, db, unsubs=[];
  function fbInit(){
    app = FB.initializeApp(CFG);
    auth = FB.getAuth(app);
    try{ db = FB.initializeFirestore(app, { localCache: FB.persistentLocalCache({ tabManager: FB.persistentMultipleTabManager() }) }); }
    catch(e){ db = FB.initializeFirestore(app, {}); }
    FB.setPersistence(auth, FB.browserLocalPersistence).catch(()=>{});
    FB.onAuthStateChanged(auth, async u=>{
      unsubs.forEach(f=>f()); unsubs=[];
      if(!u){ C.user=null; H.onUser && H.onUser(null); return; }
      let nome = '';
      try{ const s = await FB.getDoc(FB.doc(db,'usuarios',u.uid)); if(s.exists()) nome = s.data().nome||''; }catch(e){}
      C.user = { uid:u.uid, email:u.email, nome };
      H.onUser && H.onUser(C.user);
      unsubs.push(FB.onSnapshot(FB.collection(db,'baixas'), {includeMetadataChanges:true}, snap=>{
        const map = {}; let pend=0;
        snap.forEach(d=>{ const v=d.data(); map[d.id]=v; if(d.metadata.hasPendingWrites) pend++; });
        C.pending = pend; C.ready = true;
        H.onBaixas && H.onBaixas(map, snap.metadata.fromCache);
        H.onStatus && H.onStatus();
      }, err=>{ H.onStatus && H.onStatus('Erro de acesso ao banco: '+err.code); }));
      unsubs.push(FB.onSnapshot(FB.doc(db,'config','torquimetros'), s=>{ if(s.exists() && H.onTm) H.onTm(s.data().lista||[]); }, ()=>{}));
    });
  }

  // ---------------- API ----------------
  C.init = function(handlers){
    H = handlers||{};
    if(C.mode==='firebase'){ fbInit(); }
    else {
      const u = JSON.parse(localStorage.getItem(UK)||'null'); C.user=u; C.ready=true;
      setTimeout(()=>{ H.onUser && H.onUser(u); if(u) demoEmit(); },0);
      window.addEventListener('storage', e=>{ if(e.key===DK && C.user) demoEmit(); });
    }
  };
  C.login = async function(email, pass){
    email=String(email||'').trim().toLowerCase();
    if(C.mode==='firebase'){ await FB.signInWithEmailAndPassword(auth, email, pass); return; }
    if(!email) throw new Error('Informe o e-mail');
    const o=dLoad(); const nome=(o.users[email]||{}).nome||'';
    C.user={uid:email,email,nome}; localStorage.setItem(UK,JSON.stringify(C.user)); H.onUser&&H.onUser(C.user); demoEmit();
  };
  C.logout = async function(){ if(C.mode==='firebase') await FB.signOut(auth); else { localStorage.removeItem(UK); C.user=null; H.onUser&&H.onUser(null); } };
  C.resetPass = async function(email){ if(C.mode==='firebase') await FB.sendPasswordResetEmail(auth, String(email).trim()); };
  C.setNome = async function(nome){
    C.user.nome=nome;
    if(C.mode==='firebase') await FB.setDoc(FB.doc(db,'usuarios',C.user.uid), {nome, email:C.user.email}, {merge:true});
    else { const o=dLoad(); o.users[C.user.email]={nome}; dSave(o); localStorage.setItem(UK,JSON.stringify(C.user)); }
  };
  const stamp = ()=> C.mode==='firebase'? FB.serverTimestamp() : new Date().toISOString();
  C.setBaixa = function(item, v, origem){
    const data = Object.assign({}, v, { item:Number(item), por:C.user?C.user.email:'', origem:origem||'', upd:stamp() });
    Object.keys(data).forEach(k=>{ if(data[k]===undefined) delete data[k]; });
    const log = { item:Number(item), acao:'baixa', por:data.por, origem:data.origem, quando:stamp(), dados:v };
    if(C.mode==='firebase'){
      return Promise.all([ FB.setDoc(FB.doc(db,'baixas',String(item)), data), FB.addDoc(FB.collection(db,'historico'), log) ]);
    }
    const o=dLoad(); o.baixas[String(item)]=data; o.log.push(log); dSave(o); setTimeout(demoEmit,0); return Promise.resolve();
  };
  C.delBaixa = function(item, origem){
    const log = { item:Number(item), acao:'desfeita', por:C.user?C.user.email:'', origem:origem||'', quando:stamp() };
    if(C.mode==='firebase') return Promise.all([ FB.deleteDoc(FB.doc(db,'baixas',String(item))), FB.addDoc(FB.collection(db,'historico'), log) ]);
    const o=dLoad(); delete o.baixas[String(item)]; o.log.push(log); dSave(o); setTimeout(demoEmit,0); return Promise.resolve();
  };
  C.setTm = function(lista){
    if(C.mode==='firebase') return FB.setDoc(FB.doc(db,'config','torquimetros'), { lista, upd:stamp(), por:C.user?C.user.email:'' });
    const o=dLoad(); o.tm=lista; dSave(o); return Promise.resolve();
  };
})();
