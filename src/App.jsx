import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
db, collection, doc, getDocs, setDoc, updateDoc, addDoc,
query, orderBy, onSnapshot, serverTimestamp, where
} from './lib/firebase.js'
import { STUDENTS_SEED } from './lib/students.js'
/* ═══════════════════════════════════════════════
CONFIG
═══════════════════════════════════════════════ */
const ADMINS = {
pco: { id: 'pco2026admin', pw: 'Bal56Med2026', role: 'pco', name: 'PCO' }
}
const TRES_LOGINS = [
{ id: 'djeni2026', pw: 'DjeniBal56', name: 'Djeni', phone: '2250564924202', role: 'tr
{ id: 'yarabe2026', pw: 'YarabeBal56', name: 'Yarabe', phone: '2250544993454', role: 'tr
{ id: 'assassy2026', pw: 'AssassyBal56', name: 'Assassy', phone: '2250788222743', role: 'tr
]
/* ═══════════════════════════════════════════════
HELPERS
═══════════════════════════════════════════════ */
const initials = nom => nom.trim().split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCas
const pct = (paye, total) => total > 0 ? Math.min(100, Math.round((paye/total)*100)) : 0
const fmtF = n => Number(n||0).toLocaleString('fr-FR') + ' F'
const ordinal = n => n === 1 ? '1er' : `${n}ème`
const slideUp = {
initial: { opacity: 0, y: 28 },
animate: { opacity: 1, y: 0 },
exit: { opacity: 0, y: -16 },
transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
}
const stagger = { animate: { transition: { staggerChildren: 0.06 } } }
const item = { initial: { opacity:0, y:20 }, animate: { opacity:1, y:0 }, transition:{dura
/* ═══════════════════════════════════════════════
COUNTDOWN
═══════════════════════════════════════════════ */
function Countdown() {
const [time, setTime] = useState({j:'--',h:'--',m:'--'})
useEffect(() => {
const target = new Date('2026-09-06T20:00:00')
const tick = () => {
const diff = target - new Date()
if (diff <= 0) return
setTime({
j: Math.floor(diff/864e5),
h: String(Math.floor((diff%864e5)/36e5)).padStart(2,'0'),
m: String(Math.floor((diff%36e5)/6e4)).padStart(2,'0')
})
}
tick(); const t = setInterval(tick,60000); return ()=>clearInterval(t)
}, [])
return (
<div className="countdown">
{[['j','Jours'],['h','Heures'],['m','Min']].map(([k,l])=>(
<div key={k} className="cd-box">
<div className="cd-num">{time[k]}</div>
<div className="cd-lbl">{l}</div>
</div>
))}
</div>
)
}
function Hero() {
return (
<div className="hero">
<motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration
<div className="hero-badge">56ème Promotion · Médecine Abidjan</div>
<h1 className="hero-title"><small>Bal de Promotion</small>African Red Carpet</h1>
<div className="hero-sub">Septembre 2026</div>
</motion.div>
<Countdown/>
</div>
)
}
function ProgressBar({ value, done }) {
return (
<div className="pbar-wrap">
<div className="pbar">
<motion.div
className={`pfill${done?' done':''}`}
initial={{ width: 0 }}
animate={{ width: `${value}%` }}
transition={{ duration: 1, ease: [0.22,1,0.36,1], delay: 0.2 }}
/>
</div>
</div>
)
}
/* ═══════════════════════════════════════════════
APP
═══════════════════════════════════════════════ */
export default function App() {
const [screen, setScreen] = useState('home')
const [loading, setLoading] = useState(true)
const [students, setStudents] = useState({})
const [duoGroups, setDuoGroups] = useState({}) // duoId -> {student1Id, student2Id, tota
const [versements, setVersements] = useState([])
const [currentUser, setCurrentUser]= useState(null)
const [selectedId, setSelectedId] = useState(null)
const [loginTarget, setLoginTarget]= useState('pco')
useEffect(() => {
async function init() {
try {
const snap = await getDocs(collection(db,'students'))
if (snap.empty) {
// Batch writes -- 317 etudiants en 1 seule requete rapide
const { writeBatch } = await import('firebase/firestore')
const BATCH_SIZE = 499
for (let start = 0; start < STUDENTS_SEED.length; start += BATCH_SIZE) {
const batch = writeBatch(db)
const chunk = STUDENTS_SEED.slice(start, start + BATCH_SIZE)
chunk.forEach((s, offset) => {
const i = start + offset
const t = TRES_LOGINS[i % TRES_LOGINS.length]
batch.set(doc(db,'students',s.id), {
nom: s.nom, ticket:'Solo', total:30000,
tresoriere: t.name, tresPhone: t.phone,
pin: null, paye: s.paye||0,
duoId: null,
createdAt: serverTimestamp()
})
})
await batch.commit()
}
console.log('317 etudiants charges instantanement')
}
onSnapshot(collection(db,'students'), snap2 => {
const map = {}
snap2.docs.forEach(d => { map[d.id] = {id:d.id,...d.data()} })
setStudents(map)
})
onSnapshot(collection(db,'duoGroups'), snap2 => {
const map = {}
snap2.docs.forEach(d => { map[d.id] = {id:d.id,...d.data()} })
setDuoGroups(map)
})
onSnapshot(
query(collection(db,'versements'), orderBy('createdAt','desc')),
snap2 => setVersements(snap2.docs.map(d=>({id:d.id,...d.data()})))
)
} catch(e) { console.error(e) }
setTimeout(()=>setLoading(false), 1400)
}
init()
}, [])
const go = useCallback(s => { setScreen(s); window.scrollTo(0,0) }, [])
const logout = () => { setCurrentUser(null); go('home') }
const studentVersements = id => versements.filter(v=>v.studentId===id||v.studentId2===id)
// Récupérer le duo d'un étudiant
const getStudentDuo = (studentId) => {
const s = students[studentId]
if (!s?.duoId) return null
return duoGroups[s.duoId] || null
}
// Paye effectif pour un étudiant (solo ou via duo)
const getEffectivePaye = (studentId) => {
const duo = getStudentDuo(studentId)
if (duo) return duo.paye || 0
return students[studentId]?.paye || 0
}
const getEffectiveTotal = (studentId) => {
const duo = getStudentDuo(studentId)
if (duo) return 55000
return students[studentId]?.total || 30000
}
const screens = {
home: <HomeScreen go={go} />,
adminChoice: <AdminChoiceScreen go={go} setLoginTarget={setLoginTarget} />,
login: <LoginScreen go={go} loginTarget={loginTarget} setCurrentUser={setCurrentUse
pco: <PCOScreen go={go} logout={logout} students={students} versements={versement
tres: etuSearch: <TresScreen go={go} logout={logout} currentUser={currentUser} students={stud
<EtuSearchScreen go={go} students={students} setSelectedId={setSelectedId} /
etuPin: etuDash: versement: <EtuPinScreen go={go} students={students} selectedId={selectedId} />,
<EtuDashScreen go={go} students={students} versements={versements} selectedI
studentVersements={studentVersements} getStudentDuo={getStudentDuo}
getEffectivePaye={getEffectivePaye} getEffectiveTotal={getEffectiveTotal}
duoGroups={duoGroups} />,
<VersementScreen go={go} students={students} versements={versements} selecte
studentVersements={studentVersements} getStudentDuo={getStudentDuo}
getEffectivePaye={getEffectivePaye} getEffectiveTotal={getEffectiveTotal}
duoSetup: <DuoSetupScreen go={go} students={students} selectedId={selectedId}
duoGroups={duoGroups} setScreen={setScreen} />,
}
return (
<>
<div className={`loader-screen${loading?'':' hide'}`}>
<motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition=
<div className="loader-title">Bal de Promotion</div>
<div className="loader-sub">56ème Promo · Médecine Abidjan</div>
<div className="loader-bar"><div className="loader-fill"/></div>
</motion.div>
</div>
<div style={{display:'flex',flexDirection:'column',minHeight:'100svh'}}>
<Hero/>
<AnimatePresence mode="wait">
<motion.div key={screen} {...slideUp} style={{flex:1,display:'flex',flexDirection:'
{screens[screen] || screens.home}
</motion.div>
</AnimatePresence>
</div>
</>
)
}
/* ═══════════════════════════════════════════════
HOME
═══════════════════════════════════════════════ */
function HomeScreen({ go }) {
return (
<div className="screen">
<div className="scroll">
<motion.div variants={stagger} initial="initial" animate="animate">
<motion.p variants={item} style={{textAlign:'center',fontSize:13,color:'var(--muted
Solo&nbsp;·&nbsp;<strong style={{color:'var(--gold)'}}>30 000 F</strong>
&nbsp;&nbsp;|&nbsp;&nbsp;
Duo&nbsp;·&nbsp;<strong style={{color:'var(--gold)'}}>55 000 F</strong>
</motion.p>
<motion.button variants={item} className="home-cta" onClick={()=>go('etuSearch')}>
<div className="cta-icon"> </div>
<div>
<div className="cta-title">Espace Étudiant</div>
<div className="cta-sub">Voir mon solde · Effectuer un versement</div>
</div>
<div className="cta-arrow">›</div>
</motion.button>
<motion.div variants={item} style={{textAlign:'center',marginTop:'1.5rem'}}>
<button className="admin-link" onClick={()=>go('adminChoice')}>Accès administrati
</motion.div>
</motion.div>
</div>
</div>
)
}
/* ═══════════════════════════════════════════════
ADMIN CHOICE
═══════════════════════════════════════════════ */
function AdminChoiceScreen({ go, setLoginTarget }) {
return (
<div className="screen"><div className="scroll">
<button className="back-nav" onClick={()=>go('home')}>← Retour</button>
<motion.div variants={stagger} initial="initial" animate="animate">
<motion.div variants={item} className="card">
<div className="section-title" style={{marginBottom:'1rem'}}>Administration</div>
<div style={{display:'grid',gap:10}}>
<button className="btn btn-gold" onClick={()=>{setLoginTarget('pco');go('login')}
<button className="btn btn-ghost" onClick={()=>{setLoginTarget('tres');go('login'
</div>
</motion.div>
</motion.div>
</div></div>
)
}
/* ═══════════════════════════════════════════════
LOGIN
═══════════════════════════════════════════════ */
function LoginScreen({ go, loginTarget, setCurrentUser }) {
const [id, setId] = useState('')
const [pw, setPw] = useState('')
const [err, setErr] = useState('')
const [busy, setBusy] = useState(false)
const submit = async () => {
setErr(''); setBusy(true)
await new Promise(r=>setTimeout(r,400))
if (loginTarget==='pco') {
if (id===ADMINS.pco.id && pw===ADMINS.pco.pw) { setCurrentUser(ADMINS.pco); go('pco') }
else setErr('Identifiants incorrects.')
} else {
const tres = TRES_LOGINS.find(t=>t.id===id&&t.pw===pw)
if (tres) { setCurrentUser(tres); go('tres') }
else setErr('Identifiants incorrects.')
}
setBusy(false)
}
return (
<div className="screen"><div className="scroll">
<button className="back-nav" onClick={()=>go('adminChoice')}>← Retour</button>
<motion.div variants={stagger} initial="initial" animate="animate">
<motion.div variants={item} className="card">
<div className="section-title">{loginTarget==='pco'?'Espace PCO':'Espace Trésorière
{err && <div className="alert alert-err">{err}</div>}
<div className="field">
<label className="field-label">Identifiant</label>
<input className="field-input" value={id} onChange={e=>setId(e.target.value)} pla
</div>
<div className="field">
<label className="field-label">Mot de passe</label>
<input className="field-input" type="password" value={pw} onChange={e=>setPw(e.ta
</div>
<button className="btn btn-gold" onClick={submit} disabled={busy} style={{opacity:b
{busy?'Connexion…':'Se connecter →'}
</button>
</motion.div>
</motion.div>
</div></div>
)
}
/* ═══════════════════════════════════════════════
PCO
═══════════════════════════════════════════════ */
function PCOScreen({ go, logout, students, versements, duoGroups }) {
const [tab, setTab] = useState('dashboard')
const [search, setSearch] = useState('')
const [addNom, setAddNom] = useState('')
const [addTicket, setAddTicket] = useState('30000')
const [addMsg, setAddMsg] = useState('')
const sList = Object.values(students)
const total = sList.length
const duoCount = Object.keys(duoGroups).length
const collecte = sList.reduce((a,s)=>a+(s.paye||0),0) +
Object.values(duoGroups).reduce((a,d)=>a+(d.paye||0),0)
const pending = versements.filter(v=>v.status==='pending').length
const filtered = sList.filter(s=>s.nom.toLowerCase().includes(search.toLowerCase()))
const addStudent = async () => {
if(!addNom.trim()){setAddMsg(' Entrez le nom.'); return}
const idx = sList.length
const t = TRES_LOGINS[idx % TRES_LOGINS.length]
const id = 'custom_'+Date.now()
await setDoc(doc(db,'students',id),{
nom:addNom.trim(), ticket:addTicket==='55000'?'Duo':'Solo',
total:parseInt(addTicket), tresoriere:t.name, tresPhone:t.phone,
pin:null, paye:0, duoId:null, createdAt:serverTimestamp()
})
setAddMsg(' Inscrit !'); setAddNom(''); setTimeout(()=>setAddMsg(''),3000)
}
return (
<div className="screen"><div className="scroll">
<div className="topbar">
<div><div className="topbar-role">Espace PCO</div><div className="topbar-title">Table
<button className="btn btn-ghost btn-sm" onClick={logout}>Déco.</button>
</div>
<div className="tabs">
{[['dashboard','Vue globale'],['students','Étudiants'],['versements','Versements'],['
<button key={k} className={`tab${tab===k?' active':''}`} onClick={()=>setTab(k)}>{l
))}
</div>
<AnimatePresence mode="wait">
{tab==='dashboard' && (
<motion.div key="dash" {...slideUp}>
<div className="stats-grid">
{[[total,'Inscrits'],[duoCount,'Duos liés'],[Math.round(collecte/1000)+'k','FCF
<div key={l} className="stat-box"><div className="stat-n">{n}</div><div class
))}
</div>
<div className="card">
<div className="section-title" style={{fontSize:16,marginBottom:'0.75rem'}}>Tré
<div>{TRES_LOGINS.map(t=><span key={t.name} className="tres-chip"> {t.name}
</div>
<div className="card">
<div className="section-title" style={{fontSize:16,marginBottom:'0.75rem'}}>Ver
{versements.slice(0,8).map(v=>{
const s=students[v.studentId]
return <div key={v.id} className="v-item">
<div><div style={{fontSize:13,fontWeight:500,color:'var(--cream)'}}>{s?.nom
<div style={{textAlign:'right'}}>
<div className="v-amt">{fmtF(v.montant)}</div>
<span className={`badge badge-${v.status==='valid'?'ok':v.status==='rejec
</div>
</div>
})}
</div>
</motion.div>
{versements.length===0 && <div className="empty">Aucun versement.</div>}
)}
onChan
{tab==='students' && (
<motion.div key="students" {...slideUp}>
<div className="search-wrap">
<span className="search-icon"> </span>
<input className="search-input" placeholder="Rechercher…" value={search} </div>
<motion.div variants={stagger} initial="initial" animate="animate">
{filtered.slice(0,50).map(s=>{
const isDuo = !!s.duoId
const payeVal = s.paye||0
const totalVal = s.total||30000
const pc = pct(payeVal, totalVal)
const done = payeVal >= totalVal
return <motion.div key={s.id} variants={item} className="scard" style={{curso
<div className="avatar">{initials(s.nom)}</div>
<div style={{flex:1}}>
<div style={{display:'flex',alignItems:'center',gap:6}}>
<div className="scard-name">{s.nom}</div>
{isDuo && <span className="badge badge-pend" style={{fontSize:9}}>DUO</
</div>
<div className="scard-sub">{s.tresoriere} · {fmtF(totalVal)}</div>
<ProgressBar value={pc} done={done}/>
<div className="pbar-labels">
<span>{fmtF(payeVal)}</span>
<span style={{color:done?'#86efac':'var(--gold)'}}>{done?'Soldé':fmtF(t
</div>
</div>
</motion.div>
})}
</motion.div>
</motion.div>
{filtered.length===0 && <div className="empty">Aucun résultat.</div>}
)}
{tab==='versements' && (
<motion.div key="vers" {...slideUp}>
<div className="card">
<div className="section-title" style={{fontSize:16,marginBottom:'0.75rem'}}>Tou
{versements.map(v=>{
const s=students[v.studentId]
return <div key={v.id} className="v-item">
<div><div style={{fontSize:13,fontWeight:500,color:'var(--cream)'}}>{s?.nom
<div style={{textAlign:'right'}}>
<div className="v-amt">{fmtF(v.montant)}</div>
<span className={`badge badge-${v.status==='valid'?'ok':v.status==='rejec
</div>
</div>
})}
</div>
</motion.div>
{versements.length===0 && <div className="empty">Aucun versement.</div>}
)}
{tab==='add' && (
<motion.div key="add" {...slideUp}>
<div className="card">
<div className="section-title" style={{fontSize:16,marginBottom:'1rem'}}>Inscri
{addMsg && <div className={`alert ${addMsg.startsWith(' ')?'alert-ok':'alert-e
<div className="field">
<label className="field-label">Nom complet</label>
<input className="field-input" value={addNom} onChange={e=>setAddNom(e.target
</div>
<div className="field">
<label className="field-label">Type de ticket</label>
<select className="field-input" value={addTicket} onChange={e=>setAddTicket(e
<option value="30000">Solo -- 30 000 FCFA</option>
<option value="55000">Duo -- 55 000 FCFA</option>
</select>
</div>
<button className="btn btn-gold" onClick={addStudent}>Inscrire →</button>
</div>
</motion.div>
)}
</AnimatePresence>
</div></div>
)
}
/* ═══════════════════════════════════════════════
TRESORIERE
═══════════════════════════════════════════════ */
function TresScreen({ go, logout, currentUser, students, versements }) {
if (!currentUser) return null
const myPending = versements.filter(v=>v.tresoriere===currentUser.name&&v.status==='pending
const myValid = versements.filter(v=>v.tresoriere===currentUser.name&&v.status==='valid')
const valider = async vid => {
const v = versements.find(x=>x.id===vid)
if(!v) return
await updateDoc(doc(db,'versements',vid),{status:'valid',validatedAt:serverTimestamp()})
const s = students[v.studentId]
if (s) {
if (s.duoId) {
// Mise à jour du duo group
const duoSnap = await getDocs(collection(db,'duoGroups'))
const duoDoc = duoSnap.docs.find(d=>d.id===s.duoId)
if (duoDoc) {
const currentPaye = duoDoc.data().paye || 0
await updateDoc(doc(db,'duoGroups',s.duoId), { paye: Math.min(55000, currentPaye +
}
} else {
await updateDoc(doc(db,'students',v.studentId),{paye:Math.min(s.total,(s.paye||0)+v.m
}
}
}
const rejeter = async vid => updateDoc(doc(db,'versements',vid),{status:'rejected'})
return (
<div className="screen"><div className="scroll">
<div className="topbar">
<div><div className="topbar-role">Trésorière</div><div className="topbar-title">{curr
<button className="btn btn-ghost btn-sm" onClick={logout}>Déco.</button>
</div>
<div className="alert alert-info">Validez uniquement les versements reçus sur votre Wha
<motion.div variants={stagger} initial="initial" animate="animate">
<motion.div variants={item} className="card">
<div className="section-title" style={{fontSize:16,marginBottom:'0.75rem'}}>
À valider <span style={{color:'var(--gold)',fontFamily:'var(--font-body)',font
</div>
{myPending.length===0 && <div className="empty"><div className="empty-icon"> {myPending.map(v=>{
const s=students[v.studentId]
return <motion.div key={v.id} variants={item} className="v-item" style={{alignIte
<div style={{flex:1}}>
<div style={{fontSize:13,fontWeight:500,color:'var(--cream)'}}>{s?.nom||'?'}<
<div className="v-meta">{v.date} · Versement #{v.num}{s?.duoId?' · Duo':''
<div className="v-amt" style={{marginTop:4}}>{fmtF(v.montant)}</div>
</div>
<div style={{display:'flex',gap:6,flexShrink:0,marginTop:2}}>
<button className="val-yes" onClick={()=>valider(v.id)}>✓ Valider</button>
<button className="val-no" onClick={()=>rejeter(v.id)}>✗</button>
</div
</div>
</motion.div>
Vali
})}
</motion.div>
<motion.div variants={item} className="card">
<div className="section-title" style={{fontSize:16,marginBottom:'0.75rem'}}> {myValid.length===0 && <div className="empty">Aucune validation récente.</div>}
{myValid.map(v=>{
const s=students[v.studentId]
return <div key={v.id} className="v-item">
<div><div style={{fontSize:13,fontWeight:500,color:'var(--cream)'}}>{s?.nom||'?
<div style={{textAlign:'right'}}><div className="v-amt">{fmtF(v.montant)}</div>
</div>
})}
</motion.div>
</motion.div>
</div></div>
)
}
/* ═══════════════════════════════════════════════
ETU SEARCH
═══════════════════════════════════════════════ */
function EtuSearchScreen({ go, students, setSelectedId }) {
const [q, setQ] = useState('')
const found = q.length>=2
? Object.values(students).filter(s=>s.nom.toLowerCase().includes(q.toLowerCase())).slice(
: []
return (
<div className="screen"><div className="scroll">
<button className="back-nav" onClick={()=>go('home')}>← Accueil</button>
<motion.div variants={stagger} initial="initial" animate="animate">
<motion.div variants={item}>
<div className="section-title">Mon espace paiement</div>
<p style={{fontSize:13,color:'var(--muted)',marginBottom:'1.25rem'}}>Recherchez vot
</motion.div>
<motion.div variants={item} className="search-wrap">
<span className="search-icon"> </span>
<input className="search-input" placeholder="Tapez votre nom ou prénom…" value={q}
</motion.div>
{q.length<2 && <motion.div variants={item} style={{textAlign:'center',color:'var(--mu
{q.length>=2 && found.length===0 && <div className="alert alert-warn">Nom non trouvé.
<motion.div variants={stagger} initial="initial" animate="animate">
{found.map(s=>(
<motion.div key={s.id} variants={item} className="scard" onClick={()=>{setSelecte
<div className="avatar">{initials(s.nom)}</div>
<div style={{flex:1}}>
<div className="scard-name">{s.nom}</div>
<div className="scard-sub">Ticket {s.duoId?'Duo':'Solo'} · {fmtF(s.duoId?5500
</div>
<div className="scard-arrow">›</div>
</motion.div>
))}
</motion.div>
</motion.div>
</div></div>
)
}
/* ═══════════════════════════════════════════════
ETU PIN
═══════════════════════════════════════════════ */
function EtuPinScreen({ go, students, selectedId }) {
const [pin, setPin] = useState('')
const [err, setErr] = useState('')
const [busy, setBusy] = useState(false)
const s = students[selectedId]
const isNew = !s?.pin
const handlePin = e => { const v=e.target.value.replace(/\D/g,'').slice(0,4); setPin(v); se
const submit = async () => {
if(pin.length!==4){setErr('Le PIN doit contenir exactement 4 chiffres.'); return}
setBusy(true)
if(isNew){ await updateDoc(doc(db,'students',selectedId),{pin}); go('etuDash') }
else { pin===s.pin ? go('etuDash') : (setErr('Code PIN incorrect.'), setPin('')) }
setBusy(false)
}
if(!s) return null
return (
<div className="screen"><div className="scroll">
<button className="back-nav" onClick={()=>go('etuSearch')}>← Retour</button>
<motion.div variants={stagger} initial="initial" animate="animate">
<motion.div variants={item} className="card">
<div style={{textAlign:'center',marginBottom:'1rem'}}>
<div className="avatar" style={{width:52,height:52,fontSize:16,margin:'0 auto 12p
<div className="section-title" style={{marginBottom:4}}>{s.nom}</div>
<div style={{fontSize:12,color:'var(--muted)'}}>{isNew?'Première connexion </div>
{err && <div className="alert alert-err">{err}</div>}
<div className="pin-dots">{[1,2,3,4].map(i=><div key={i} className={`pin-dot${pin.l
<input className="field-input big" type="number" inputMode="numeric" pattern="[0-9]
value={pin} onChange={handlePin} onKeyDown={e=>e.key==='Enter'&&submit()}
-- Crée
style={{textAlign:'center',marginBottom:16}} autoFocus/>
<button className="btn btn-gold" onClick={submit} disabled={busy}>
{isNew?'Créer mon PIN →':'Accéder →'}
</button>
</motion.div>
</motion.div>
</div></div>
)
}
/* ═══════════════════════════════════════════════
DUO SETUP
═══════════════════════════════════════════════ */
function DuoSetupScreen({ go, students, selectedId, duoGroups }) {
const [q, setQ] = useState('')
const [msg, setMsg] = useState('')
const [busy, setBusy] = useState(false)
const s = students[selectedId]
const found = q.length>=2
? Object.values(students).filter(st =>
st.id !== selectedId &&
!st.duoId &&
st.nom.toLowerCase().includes(q.toLowerCase())
).slice(0,8)
: []
const lierDuo = async (binomeId) => {
setBusy(true)
const binome = students[binomeId]
if(!binome){setMsg('Étudiant introuvable.'); setBusy(false); return}
if(binome.duoId){setMsg(`${binome.nom} est déjà dans un duo.`); setBusy(false); return}
const duoId = `duo_${selectedId}_${binomeId}`
// Créer le groupe duo
await setDoc(doc(db,'duoGroups',duoId),{
student1Id: selectedId,
student2Id: binomeId,
nom1: s.nom,
nom2: binome.nom,
total: 55000,
paye: 0,
createdAt: serverTimestamp()
})
// Lier les deux étudiants
await updateDoc(doc(db,'students',selectedId), { duoId, total:55000, ticket:'Duo' })
await updateDoc(doc(db,'students',binomeId), { duoId, total:55000, ticket:'Duo' })
setBusy(false)
go('etuDash')
}
if(!s) return null
return (
<div className="screen"><div className="scroll">
<button className="back-nav" onClick={()=>go('etuDash')}>← Mon espace</button>
<motion.div variants={stagger} initial="initial" animate="animate">
<motion.div variants={item} className="card card-gold">
<div className="section-title" style={{fontSize:16}}> Passer en Tarif Duo</div>
<p style={{fontSize:13,color:'var(--muted)',marginBottom:'0.75rem',lineHeight:1.6}}
Recherchez le nom de votre binôme dans la liste officielle de la promo. Vos deux
</p>
<div className="alert alert-info" style={{fontSize:12,marginBottom:'1rem'}}>
Cette action est irréversible. Contactez la PCO pour toute correction.
</div>
</motion.div>
{msg && <div className="alert alert-err">{msg}</div>}
<motion.div variants={item} className="search-wrap">
<span className="search-icon"> </span>
<input className="search-input" placeholder="Nom de votre binôme…" value={q} </motion.div>
{q.length>=2 && found.length===0 && <div className="alert alert-warn">Aucun résultat
<motion.div variants={stagger} initial="initial" animate="animate">
{found.map(st=>(
<motion.div key={st.id} variants={item} className="scard">
<div className="avatar">{initials(st.nom)}</div>
<div style={{flex:1}}>
<div className="scard-name">{st.nom}</div>
<div className="scard-sub">Ticket Solo · Disponible pour duo</div>
</div>
<button
className="btn btn-gold btn-sm"
onClick={()=>lierDuo(st.id)}
disabled={busy}
style={{flexShrink:0,opacity:busy?0.7:1}}
>Lier</button>
</motion.div>
onChan
))}
</motion.div>
</motion.div>
</div></div>
)
}
/* ═══════════════════════════════════════════════
ETU DASHBOARD
═══════════════════════════════════════════════ */
function EtuDashScreen({ go, students, versements, selectedId, studentVersements, getStudentD
const s = students[selectedId]
if(!s) return null
const duo = getStudentDuo(selectedId)
const payeVal = duo ? (duo.paye||0) : (s.paye||0)
const totalVal = duo ? 55000 : (s.total||30000)
const pc = pct(payeVal, totalVal)
const done = payeVal >= totalVal
const reste = Math.max(0, totalVal - payeVal)
const vers = studentVersements(selectedId)
// Binôme info
const binomeId = duo ? (duo.student1Id===selectedId ? duo.student2Id : duo.student1Id) : n
const binome = binomeId ? students[binomeId] : null
return (
<div className="screen"><div className="scroll">
<button className="back-nav" onClick={()=>go('home')}>← Accueil</button>
<motion.div variants={stagger} initial="initial" animate="animate">
{/* Profil */}
<motion.div variants={item} className="card card-gold" style={{textAlign:'center',mar
<div className="avatar" style={{width:56,height:56,fontSize:18,margin:'0 auto 12px'
<div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:600,color:'var
<div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>
Trésorière : <strong style={{color:'var(--gold-l)'}}>{s.tresoriere}</strong>
{duo && <span style={{marginLeft:8}}>· Duo avec <strong style={{color:'var(--g
</div>
{/* Bouton passer en Duo si pas encore en duo */}
{!duo && !done && (
<button
className="btn btn-ghost"
style={{marginTop:'0.75rem',fontSize:12,padding:'9px 14px',borderColor:'rgba(20
onClick={()=>go('duoSetup')}
>
Je paie en Tarif Duo (55 000 F pour 2)
</button>
)}
</motion.div>
{/* Duo info banner */}
{duo && (
<motion.div variants={item} className="alert alert-info" style={{marginBottom:12,fo
Jauge commune avec <strong>{binome?.nom||'...'}</strong> -- Les versements des
</motion.div>
)}
{/* Progress */}
<motion.div variants={item} className="card">
<div className="big-pct-wrap">
<motion.div className={`big-pct${done?' done':''}`}
initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}}
transition={{duration:0.6,delay:0.2,ease:[0.22,1,0.36,1]}}
>{pc}%</motion.div>
<div className="big-pct-sub">{duo?'jauge commune':'de votre ticket réglé'}</div>
</div>
<ProgressBar value={pc} done={done}/>
<div className="amount-grid" style={{marginTop:'0.75rem'}}>
<div className="amt-box"><div className="amt-n">{fmtF(payeVal)}</div><div classNa
<div className="amt-box"><div className="amt-n" style={{color:done?'#86efac':'var
</div>
{duo && <div style={{textAlign:'center',fontSize:11,color:'var(--muted)',marginTop:
{done
? <div className="alert alert-ok" style={{textAlign:'center',marginTop:'0.75rem',
: <button className="btn btn-gold" style={{marginTop:'0.75rem'}} onClick={()=>go(
}
</motion.div>
{/* Historique */}
<motion.div variants={item} className="card">
<div className="section-title" style={{fontSize:16,marginBottom:'0.75rem'}}>
Historique <span style={{color:'var(--muted)',fontFamily:'var(--font-body)',fontS
</div>
{vers.length===0 && <div className="empty">Aucun versement enregistré.</div>}
{[...vers].map(v=>(
<div key={v.id} className="v-item">
<div>
<div style={{fontSize:13,fontWeight:500,color:'var(--cream)'}}>Versement {ord
<div className="v-meta">{v.date}{v.studentId!==selectedId?' · via binôme':''}
</div>
<div style={{textAlign:'right'}}>
<div className="v-amt">{fmtF(v.montant)}</div>
<span className={`badge badge-${v.status==='valid'?'ok':v.status==='rejected'
</div>
</div>
))}
</motion.div>
</motion.div>
</div></div>
)
}
/* ═══════════════════════════════════════════════
VERSEMENT
═══════════════════════════════════════════════ */
function VersementScreen({ go, students, versements, selectedId, studentVersements, getStuden
const [montant, setMontant] = useState('')
const [sending, setSending] = useState(false)
const s = students[selectedId]
const duo = getStudentDuo(selectedId)
const payeVal = getEffectivePaye(selectedId)
const totalVal = getEffectiveTotal(selectedId)
const vers = studentVersements(selectedId)
const nVers = vers.length + 1
if(!s) return null
const pc = pct(payeVal, totalVal)
const reste = Math.max(0, totalVal - payeVal)
const amt = parseInt(montant)||0
const newTotal = Math.min(totalVal, payeVal + amt)
const newReste = Math.max(0, totalVal - newTotal)
const newPct = Math.round((newTotal/totalVal)*100)
const binomeId = duo ? (duo.student1Id===selectedId ? duo.student2Id : duo.student1Id) : nu
const binome = binomeId ? students[binomeId] : null
const msg = amt>0
: ''
? `Bonjour ${s.tresoriere},\n\nJe suis ${s.nom}${duo?` (Duo avec ${binome?.nom||'...'})`:
const envoyer = async () => {
if(!amt||amt<=0) return
setSending(true)
// Créer le lien WA AVANT l'opération async pour rester dans le même tap
const waUrl = `https://wa.me/${s.tresPhone}?text=${encodeURIComponent(msg)}`
await addDoc(collection(db,'versements'),{
studentId: selectedId,
duoId: s.duoId||null,
montant: amt,
num: nVers,
status: 'pending',
tresoriere: s.tresoriere,
tresPhone: s.tresPhone,
date: new Date().toLocaleDateString('fr-FR'),
createdAt: serverTimestamp()
})
setSending(false)
go('etuDash')
// Redirection directe -- fonctionne sur tous les navigateurs mobiles
window.location.href = waUrl
}
return (
<div className="screen"><div className="scroll">
<button className="back-nav" onClick={()=>go('etuDash')}>← Mon espace</button>
<motion.div variants={stagger} initial="initial" animate="animate">
<motion.div variants={item} className="card" style={{marginBottom:12}}>
<div style={{fontSize:12,color:'var(--muted)',marginBottom:6}}>
Trésorière : <strong style={{color:'var(--gold-l)'}}>{s.tresoriere}</strong>
{duo && <span style={{marginLeft:8}}>· Duo avec <strong style={{color:'var(--g
</div>
<ProgressBar value={pc} done={false}/>
<div className="pbar-labels">
<span>{fmtF(payeVal)} payés</span>
<span style={{color:'var(--gold)'}}>{fmtF(reste)} restant{duo?' (jauge commune)':
</div>
</motion.div>
<motion.div variants={item} className="card">
<div className="section-title" style={{fontSize:16,marginBottom:'1rem'}}>Versement
<div className="field">
<label className="field-label">Montant à verser (FCFA)</label>
<input className="field-input number" type="number" inputMode="numeric"
value={montant} onChange={e=>setMontant(e.target.value)} placeholder="0"/>
</div>
<AnimatePresence>
{amt>0 && (
<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}
<div className="msg-preview">{msg}</div>
<button className="btn btn-wa" onClick={envoyer} disabled={sending} style={{o
<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d
{sending?`Envoi…`:`Envoyer à ${s.tresoriere} sur WhatsApp`}
</button>
<p style={{fontSize:11,color:'var(--muted)',textAlign:'center',marginTop:10,l
Versement confirmé après validation par la trésorière.
</p>
</motion.div>
)}
</AnimatePresence>
</motion.div>
</motion.div>
</div></div>
)
}
