'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownToLine, Boxes, Check, ClipboardList, Clock3, Factory, FileText,
  Languages, LogOut, Menu, Moon, Package, Plus, Search, Settings, ShieldCheck, Sun,
  UserCheck, WalletCards, Warehouse, X, AlertTriangle, Save, Camera, ChevronRight
} from 'lucide-react';
import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, runTransaction } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { APP_CONFIG } from '../config/app.config';
import { UI, type Lang } from '../config/i18n/ui';
import { NAVIGATION } from '../config/modules/navigation.config';
import { isBootstrapOwner } from '../lib/security/roles';
import { writeAudit } from '../lib/audit/audit';

type Role = 'owner' | 'manager' | 'employee' | 'watchman';
type Theme = 'light' | 'dark';
type PaymentType = 'hour' | 'kg' | 'task';
type Worker = { id: string; name: string; employeeCode: string; email: string; role: 'employee'; active: boolean; paymentType: PaymentType; rate: number; phone?: string };
type AppUser = { uid: string; email: string; displayName: string; role: Role; active: boolean; workerId?: string };
type StockItem = { id: string; yarnLabel: string; availableKg: number; reservedKg: number; poteCount: number; boxCount: number };
type Master = { id: string; name: string; active?: boolean; weightKg?: number };

const BOOTSTRAP_OWNER = APP_CONFIG.bootstrapOwnerEmail;
const tAll = UI;

function localDate() { return new Intl.DateTimeFormat('en-CA', { timeZone: APP_CONFIG.timezone }).format(new Date()); }
function money(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0); }
function safeRole(value: unknown): Role { return value === 'owner' || value === 'manager' || value === 'employee' || value === 'watchman' ? value : 'employee'; }
function roleLabel(role: Role, lang: Lang) { return tAll[lang][role]; }

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [lang, setLang] = useState<Lang>(() => (typeof window !== 'undefined' && localStorage.getItem('gaddam-lang') === 'en' ? 'en' : 'mr'));
  const [theme, setTheme] = useState<Theme>(() => (typeof window !== 'undefined' && localStorage.getItem('gaddam-theme') === 'dark' ? 'dark' : 'light'));
  const [screen, setScreen] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const t = tAll[lang];

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('gaddam-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('gaddam-lang', lang); }, [lang]);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, async (current) => {
      setUser(current);
      if (!current) { setAppUser(null); setLoading(false); return; }
      const email = (current.email || '').trim().toLowerCase();
      try {
        if (isBootstrapOwner(email)) {
          setAppUser({ uid: current.uid, email, displayName: current.displayName || email, role: 'owner', active: true });
          setLoading(false); return;
        }
        const snap = await getDoc(doc(db!, 'access_emails', email));
        if (snap.exists() && snap.data().active !== false) {
          const data = snap.data();
          setAppUser({ uid: current.uid, email, displayName: current.displayName || email, role: safeRole(data.role), active: data.active !== false, workerId: data.workerId });
          setLoading(false); return;
        }
        setAppUser(null); setError(t.restricted);
      } catch (e) {
        setAppUser(null); setError('Unable to verify factory access. Check Firestore rules and configuration.');
      }
      setLoading(false);
    });
  }, [t.restricted]);

  async function login() {
    setError('');
    if (!auth) { setError('Firebase is not configured. Update config/firebase.config.ts and redeploy.'); return; }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (e: any) { setError(e?.message || 'Google sign-in failed.'); }
  }

  if (loading) return <Loading label={t.loading} />;
  if (!appUser) return <Login lang={lang} setLang={setLang} onLogin={login} error={error} />;

  const iconMap: Record<string, any> = { Activity, Warehouse, ArrowDownToLine, Boxes, UserCheck, WalletCards, FileText, ClipboardList, Settings };
  const nav = NAVIGATION.filter(item => item.roles.includes(appUser.role));
  const titleMap: Record<string, string> = {
    dashboard: t.dashboard, stock: t.stock, inward: t.inward, batches: t.batches, workers: t.workers,
    attendance: t.attendance, payroll: t.payroll, reports: t.reports, logbook: t.logbook, settings: t.settings
  };

  return (
    <div className="app-shell">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="side-brand"><div className="mini-mark"><Factory size={18} /></div><div><strong>Gaddam</strong><span>Textile Factory</span></div><button className="mobile-close icon-btn" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
        <div className="role-chip"><ShieldCheck size={15} /> <span>{roleLabel(appUser.role, lang)}</span><span className="dot-online" /></div>
        <nav>{nav.map(item => { const Icon = iconMap[item.icon] || Activity; return <button key={item.id} className={screen === item.id ? 'nav-item active' : 'nav-item'} onClick={() => { setScreen(item.id); setMenuOpen(false); }}><Icon size={19} /><span>{titleMap[item.id] || item.id}</span></button>; })}</nav>
        <div className="sidebar-bottom">
          {appUser.role === 'owner' && <button className="nav-item" onClick={() => setScreen('settings')}><Settings size={19} /><span>{t.settings}</span></button>}
          <button className="nav-item" onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}><Languages size={19} /><span>{lang === 'en' ? t.marathi : t.english}</span></button>
          <button className="nav-item" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}<span>{theme === 'light' ? t.dark : t.light}</span></button>
          <button className="nav-item danger-text" onClick={() => auth && signOut(auth)}><LogOut size={19} /><span>{t.logout}</span></button>
        </div>
      </aside>
      <div className="mobile-header"><button className="icon-btn" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><div className="mobile-title">Gaddam Factory</div><button className="avatar" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{(appUser.displayName || 'U')[0].toUpperCase()}</button></div>
      <main className="main-content">
        <header className="topbar"><div><span className="eyebrow">{roleLabel(appUser.role, lang)} <span className="live-chip">● {t.online}</span></span><h2>{titleMap[screen] || t.dashboard}</h2></div><div className="top-actions"><button className="language-toggle" onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}><Languages size={17} />{lang === 'en' ? 'मराठी' : 'English'}</button><button className="icon-btn theme-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><div className="user-block"><div className="avatar">{(appUser.displayName || 'U')[0].toUpperCase()}</div><div><strong>{appUser.displayName}</strong><span>{appUser.email}</span></div></div></div></header>
        {screen === 'dashboard' && <Dashboard lang={lang} role={appUser.role} onNavigate={setScreen} />}
        {screen === 'workers' && <Workers lang={lang} role={appUser.role} appUser={appUser} />}
        {screen === 'attendance' && <Attendance lang={lang} role={appUser.role} appUser={appUser} />}
        {screen === 'inward' && <Inward lang={lang} appUser={appUser} />}
        {screen === 'stock' && <Stock lang={lang} />}
        {screen === 'batches' && <Batches lang={lang} appUser={appUser} />}
        {screen === 'payroll' && <Payroll lang={lang} />}
        {screen === 'reports' && <Reports lang={lang} />}
        {screen === 'logbook' && <Logbook lang={lang} />}
        {screen === 'settings' && appUser.role === 'owner' && <SettingsView lang={lang} appUser={appUser} />}
      </main>
    </div>
  );
}

function Loading({ label }: { label: string }) { return <main className="login-shell"><div className="loading-card"><div className="brand-mark"><Factory size={30} /></div><strong>{label}</strong></div></main>; }
function Login({ lang, setLang, onLogin, error }: { lang: Lang; setLang: (v: Lang) => void; onLogin: () => void; error: string }) { const t = tAll[lang]; return <main className="login-shell"><div className="login-card"><div className="brand-mark"><Factory size={30} /></div><span className="eyebrow">TEXTILE OPERATIONS</span><h1>{t.loginTitle}</h1><p>{t.loginText}</p><button className="google-btn" onClick={onLogin}><span className="google-g">G</span>{t.continueGoogle}</button>{error && <div className="error-box"><AlertTriangle size={17} />{error}</div>}<div className="language-pills"><button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>English</button><button className={lang === 'mr' ? 'active' : ''} onClick={() => setLang('mr')}>मराठी</button></div><div className="login-note">Owner: <strong>{BOOTSTRAP_OWNER}</strong></div></div></main>; }

function useCollection<T extends { id: string }>(path: string, orderField = 'createdAt') {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db!, path), orderBy(orderField, 'desc'), limit(100));
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as T))), () => setItems([]));
  }, [path, orderField]);
  return items;
}

function Dashboard({ lang, role, onNavigate }: { lang: Lang; role: Role; onNavigate: (s: string) => void }) {
  const stock = useCollection<StockItem>('stock_items');
  const workers = useCollection<Worker>('workers');
  const batches = useCollection<any>('batches');
  const today = localDate();
  const inward = useCollection<any>('goods_receipts').filter(x => x.date === today);
  const totalKg = stock.reduce((a, x) => a + Number(x.availableKg || 0), 0);
  const receivedKg = inward.reduce((a, x) => a + Number(x.totalWeightKg || 0), 0);
  const t = tAll[lang];
  return <div className="page">
    <div className="hero-row"><div><p className="muted">{t.welcome}</p><h1>{role === 'employee' ? (lang === 'mr' ? 'आजचे काम' : "Today's work") : role === 'watchman' ? (lang === 'mr' ? 'आजची कामगार हजेरी' : "Today's worker attendance") : (lang === 'mr' ? 'आजची फॅक्टरी स्थिती' : "Today's factory status")}</h1></div><div className="quick-actions">{role !== 'employee' && role !== 'watchman' && <><button className="primary" onClick={() => onNavigate('inward')}><ArrowDownToLine size={18} />{t.receive}</button><button className="secondary" onClick={() => onNavigate('batches')}><Boxes size={18} />{t.newBatch}</button></>}</div></div>
    <div className="metric-grid"><Metric icon={<Warehouse />} title={t.totalStock} value={totalKg.toLocaleString('en-IN')} suffix={t.kg} /><Metric icon={<ArrowDownToLine />} title={t.receivedToday} value={receivedKg.toLocaleString('en-IN')} suffix={t.kg} /><Metric icon={<Package />} title={t.production} value="0" suffix={t.kg} /><Metric icon={<UserCheck />} title={t.present} value={workers.length.toString()} /><Metric icon={<Boxes />} title={t.activeBatches} value={batches.filter(x => x.status !== 'Completed').length.toString()} /></div>
    <div className="quick-grid"><button onClick={() => onNavigate('attendance')}><UserCheck size={18} />{t.attendance}</button><button onClick={() => onNavigate('workers')}><ClipboardList size={18} />{t.workers}</button><button onClick={() => onNavigate('stock')}><Warehouse size={18} />{t.stock}</button><button onClick={() => onNavigate('reports')}><FileText size={18} />{t.reports}</button></div>
    <div className="content-grid"><section className="card"><CardHeader title={t.activeBatches} />{batches.length === 0 ? <Empty text={lang === 'mr' ? 'अजून कोणतीही बॅच नोंदलेली नाही.' : 'No batches recorded yet.'} /> : batches.slice(0, 5).map((b: any) => <div className="row" key={b.id}><div><strong>{b.batchNumber}</strong><small>{b.yarnLabel} · {b.inputQtyKg || 0} kg</small></div><span className="pill green">{b.status || 'Created'}</span></div>)}<button className="ghost-btn wide" onClick={() => onNavigate('batches')}>{t.batches} <ChevronRight size={16} /></button></section><section className="card"><CardHeader title={lang === 'mr' ? 'आजची आवक' : "Today's Inward"} />{inward.length === 0 ? <Empty text={lang === 'mr' ? 'आजची आवक अजून नोंदलेली नाही.' : 'No goods inward recorded today.'} /> : inward.slice(0, 5).map((r: any) => <div className="row" key={r.id}><div><strong>{r.yarnLabel}</strong><small>{r.supplier || '-'} · {r.packaging} × {r.packageQty}</small></div><b>{r.totalWeightKg || 0} kg</b></div>)}<button className="ghost-btn wide" onClick={() => onNavigate('inward')}>{t.receive} <ChevronRight size={16} /></button></section></div>
  </div>;
}

function Workers({ lang, role, appUser }: { lang: Lang; role: Role; appUser: AppUser }) {
  const workers = useCollection<Worker>('workers');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', employeeCode: '', paymentType: 'kg' as PaymentType, rate: '', phone: '' });
  const canEdit = role === 'owner' || role === 'manager';
  async function save() {
    if (!db || !form.name.trim() || !form.email.trim()) return;
    try {
      const email = form.email.trim().toLowerCase();
      const code = form.employeeCode.trim() || `W-${Date.now().toString().slice(-5)}`;
      const refDoc = await addDoc(collection(db!, 'workers'), { name: form.name.trim(), email, employeeCode: code, role: 'employee', active: true, paymentType: form.paymentType, rate: Number(form.rate || 0), phone: form.phone.trim(), createdAt: serverTimestamp() });
      await setDoc(doc(db!, 'access_emails', email), { email, role: 'employee', workerId: refDoc.id, active: true, createdAt: serverTimestamp() }, { merge: true });
      await writeAudit(appUser, 'worker', `Added worker ${form.name.trim()}`);
      setForm({ name: '', email: '', employeeCode: '', paymentType: 'kg', rate: '', phone: '' }); setOpen(false);
    } catch (e) { alert('Unable to save worker. Check Firestore permissions.'); }
  }
  async function toggleActive(w: Worker) { try { await setDoc(doc(db!, 'workers', w.id), { active: !w.active }, { merge: true }); await writeAudit(appUser, 'worker', `${w.active ? 'Deactivated' : 'Activated'} ${w.name}`); } catch { alert('Unable to update worker.'); } }
  return <div className="page"><div className="section-tools"><div className="search-wrap"><Search size={18} /><input className="search" placeholder={tAll[lang].search} /></div>{canEdit && <button className="primary" onClick={() => setOpen(true)}><Plus size={18} />{lang === 'mr' ? 'कामगार जोडा' : 'Add worker'}</button>}</div><section className="card"><CardHeader title={lang === 'mr' ? 'कामगार' : 'Workers'} />{workers.length === 0 ? <Empty text={lang === 'mr' ? 'अजून कामगार नोंदलेले नाहीत.' : 'No workers added yet.'} /> : workers.map(w => <div className="row" key={w.id}><div><strong>{w.name}</strong><small>{w.employeeCode} · {w.email} · {paymentLabel(w, lang)}</small></div><div className="row-actions"><span className={w.active ? 'pill green' : 'pill red'}>{w.active ? 'Active' : 'Inactive'}</span>{canEdit && <button className="icon-btn" onClick={() => toggleActive(w)}>{w.active ? '⏸' : '▶'}</button>}</div></div>)}</section>{open && <Modal title={lang === 'mr' ? 'कामगार जोडा' : 'Add worker'} onClose={() => setOpen(false)}><div className="form tw"><label>{lang === 'mr' ? 'नाव' : 'Name'}<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>{lang === 'mr' ? 'कर्मचारी कोड' : 'Employee code'}<input value={form.employeeCode} onChange={e => setForm({ ...form, employeeCode: e.target.value })} /></label><label>Phone<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label><label>{lang === 'mr' ? 'पगार पद्धत' : 'Payment basis'}<select value={form.paymentType} onChange={e => setForm({ ...form, paymentType: e.target.value as PaymentType })}><option value="hour">Per Hour</option><option value="kg">Per KG</option><option value="task">Per Task</option></select></label><label>{lang === 'mr' ? 'दर' : 'Rate'}<input type="number" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></label></div><ModalActions onSave={save} /></Modal>}</div>;
}

function Attendance({ lang, role, appUser }: { lang: Lang; role: Role; appUser: AppUser }) {
  const workers = useCollection<Worker>('workers');
  const today = localDate();
  const attendance = useCollection<any>('attendance');
  const byWorker = useMemo(() => new Map(attendance.filter(a => a.date === today).map(a => [a.workerId, a])), [attendance, today]);
  async function mark(w: Worker, action: 'in' | 'out' | 'tea' | 'lunch') {
    const key = `${w.id}_${today}`;
    try { await setDoc(doc(db!, 'attendance', key), { workerId: w.id, date: today, action, updatedBy: appUser.uid, updatedAt: serverTimestamp() }, { merge: true }); await writeAudit(appUser, 'attendance', `${action} · ${w.name}`); } catch { alert('Unable to save attendance.'); }
  }
  return <div className="page"><div className="section-tools"><div className="attendance-date">📅 {today}</div><span className="muted">{role === 'watchman' ? 'Check in / Check out' : (lang === 'mr' ? 'हजेरी आणि ब्रेक' : 'Attendance and breaks')}</span></div><section className="card"><CardHeader title={lang === 'mr' ? 'आजची हजेरी' : 'Today attendance'} />{workers.length === 0 ? <Empty text={lang === 'mr' ? 'अजून कामगार नोंदलेले नाहीत.' : 'No workers have been added yet.'} /> : workers.map(w => { const a = byWorker.get(w.id); return <div className="row" key={w.id}><div><strong>{w.name}</strong><small>{paymentLabel(w, lang)}</small></div><div className="actions"><button className="green" onClick={() => mark(w, 'in')}>🟢 {tAll[lang].checkIn}</button><button className="red" onClick={() => mark(w, 'out')}>🔴 {tAll[lang].checkOut}</button><button className="yellow" onClick={() => mark(w, 'tea')}>🟡 {lang === 'mr' ? 'चहा' : 'Tea'}</button><button className="yellow" onClick={() => mark(w, 'lunch')}>🟡 {lang === 'mr' ? 'जेवण' : 'Lunch'}</button>{a?.action === 'in' && <span className="pill green">In</span>}</div></div>; })}</section><section className="card"><CardHeader title={lang === 'mr' ? 'ब्रेक नियम' : 'Break policy'} /><div className="policy-grid"><div>🫖 {lang === 'mr' ? 'चहा' : 'Tea'} <strong>15 min</strong></div><div>🍱 {lang === 'mr' ? 'दुपारचे जेवण' : 'Lunch'} <strong>30 min</strong></div><div>✓ {lang === 'mr' ? 'ब्रेक ऐच्छिक आहेत' : 'Breaks are optional'}</div></div></section></div>;
}

function Inward({ lang, appUser }: { lang: Lang; appUser: AppUser }) {
  const yarns = useCollection<Master>('master_yarns');
  const weights = useCollection<Master>('master_package_weights');
  const [packaging, setPackaging] = useState<'pote' | 'box'>('pote');
  const [qty, setQty] = useState(0); const [weight, setWeight] = useState(50); const [yarn, setYarn] = useState(''); const [supplier, setSupplier] = useState(''); const [file, setFile] = useState<File | null>(null); const [saving, setSaving] = useState(false);
  const weightOptions = weights.length ? weights.map(w => Number(w.weightKg)).filter(Boolean) : [50, 60];
  const total = qty * weight;
  async function save() {
    if (!db || !yarn || qty <= 0) return;
    setSaving(true);
    try {
      let fileUrl = '';
      if (file && storage) { const storageRef = ref(storage, `gate-passes/${Date.now()}-${file.name}`); await uploadBytes(storageRef, file); fileUrl = await getDownloadURL(storageRef); }
      const receipt = await addDoc(collection(db!, 'goods_receipts'), { supplier: supplier.trim(), date: localDate(), yarnLabel: yarn, packaging, packageWeightKg: weight, packageQty: qty, totalWeightKg: total, gatePassUrl: fileUrl, createdBy: appUser.uid, createdAt: serverTimestamp() });
      await runTransaction(db!, async tx => {
        const stockId = yarn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `yarn-${Date.now()}`;
        const stockRef = doc(db!, 'stock_items', stockId); const snap = await tx.get(stockRef); const current = snap.exists() ? snap.data() as Partial<StockItem> : {};
        tx.set(stockRef, { yarnLabel: yarn, availableKg: Number(current.availableKg || 0) + total, reservedKg: Number(current.reservedKg || 0), poteCount: Number(current.poteCount || 0) + (packaging === 'pote' ? qty : 0), boxCount: Number(current.boxCount || 0) + (packaging === 'box' ? qty : 0), updatedAt: serverTimestamp() }, { merge: true });
        tx.set(doc(collection(db!, 'stock_transactions')), { type: 'inward', receiptId: receipt.id, yarnLabel: yarn, qtyKg: total, packageQty: qty, packageWeightKg: weight, createdBy: appUser.uid, createdAt: serverTimestamp() });
      });
      await writeAudit(appUser, 'goods_receipt', `${yarn} · +${total} kg`); setQty(0); setYarn(''); setSupplier(''); setFile(null); alert('Goods received successfully.');
    } catch (e) { alert('Unable to receive goods. Check Firestore rules and Storage billing/configuration.'); } finally { setSaving(false); }
  }
  return <div className="page"><div className="content-grid"><section className="card"><CardHeader title={lang === 'mr' ? 'माल आवक नोंदवा' : 'Receive goods'} /><div className="form"><label>{lang === 'mr' ? 'यार्न प्रकार' : 'Yarn type'}<select value={yarn} onChange={e => setYarn(e.target.value)}><option value="">{lang === 'mr' ? 'निवडा' : 'Select'}</option>{yarns.filter(y => y.active !== false).map(y => <option key={y.id} value={y.name}>{y.name}</option>)}{yarns.length === 0 && <><option value="Cotton · 10 Single">Cotton · 10 Single</option><option value="Cotton · 20 Single">Cotton · 20 Single</option><option value="Polyester · 10 Single">Polyester · 10 Single</option></>}</select></label><div className="tw"><label>{lang === 'mr' ? 'पॅकेजिंग' : 'Packaging'}<select value={packaging} onChange={e => setPackaging(e.target.value as 'pote' | 'box')}><option value="pote">Pote / Bori</option><option value="box">Box</option></select></label><label>{lang === 'mr' ? 'प्रति पॅकेज वजन' : 'Weight per package'}<select value={weight} onChange={e => setWeight(Number(e.target.value))}>{weightOptions.map(w => <option key={w} value={w}>{w} kg</option>)}</select></label></div><label>{lang === 'mr' ? 'संख्या' : 'Quantity'}<input type="number" min="1" value={qty || ''} onChange={e => setQty(Number(e.target.value))} /></label><label>{lang === 'mr' ? 'सप्लायर' : 'Supplier'}<input value={supplier} onChange={e => setSupplier(e.target.value)} /></label><div className="total"><span>{lang === 'mr' ? 'एकूण वजन' : 'Total weight'}</span><b>{total.toLocaleString('en-IN')} kg</b></div><label className="upload"><Camera size={18} /> {lang === 'mr' ? 'Gate Pass / Delivery Note फोटो' : 'Gate Pass / Delivery Note photo'}<input type="file" accept="image/*" capture="environment" onChange={e => setFile(e.target.files?.[0] || null)} /><small>{file ? file.name : 'Tap to capture or choose image'}</small></label><button className="primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : <><Save size={18} />{lang === 'mr' ? 'माल नोंदवा' : 'Save inward'}</>}</button></div></section><section className="card"><CardHeader title={lang === 'mr' ? 'हिशोब' : 'Receipt calculation'} /><div className="steps"><span>1. {packaging === 'pote' ? 'Pote/Bori' : 'Box'}</span><span>× {weight} kg</span><span>= {total} kg</span></div><p className="muted" style={{ marginTop: 20 }}>Stock is updated automatically after saving the receipt.</p></section></div></div>;
}

function Stock({ lang }: { lang: Lang }) { const stock = useCollection<StockItem>('stock_items'); const t = tAll[lang]; return <div className="page"><div className="metric-grid"><Metric icon={<Warehouse />} title={t.totalStock} value={stock.reduce((a, s) => a + Number(s.availableKg || 0), 0).toLocaleString('en-IN')} suffix={t.kg} /><Metric icon={<Boxes />} title="Pote / Bori" value={stock.reduce((a, s) => a + Number(s.poteCount || 0), 0).toString()} /><Metric icon={<Package />} title="Boxes" value={stock.reduce((a, s) => a + Number(s.boxCount || 0), 0).toString()} /></div><section className="card"><CardHeader title={lang === 'mr' ? 'उपलब्ध साठा' : 'Available stock'} />{stock.length === 0 ? <Empty text={lang === 'mr' ? 'अजून साठा नोंदलेला नाही.' : 'No stock recorded yet.'} /> : stock.map(s => <div className="row" key={s.id}><div><strong>{s.yarnLabel}</strong><small>Reserved {s.reservedKg || 0} kg · Pote {s.poteCount || 0} · Box {s.boxCount || 0}</small></div><b>{Number(s.availableKg || 0).toLocaleString('en-IN')} kg</b><span className="pill green">Available</span></div>)}</section></div>; }

function Batches({ lang, appUser }: { lang: Lang; appUser: AppUser }) { const batches = useCollection<any>('batches'); const stock = useCollection<StockItem>('stock_items'); const [open, setOpen] = useState(false); const [yarn, setYarn] = useState(''); const [qty, setQty] = useState(0); const [assignedTo, setAssignedTo] = useState(''); const workers = useCollection<Worker>('workers');
  async function create() { if (!db || !yarn || qty <= 0) return; try { const batchNumber = `B-${Date.now().toString().slice(-6)}`; await runTransaction(db!, async tx => { const stockId = yarn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); const stockRef = doc(db!, 'stock_items', stockId); const snap = await tx.get(stockRef); const s = snap.exists() ? snap.data() as any : null; if (!s || Number(s.availableKg || 0) < qty) throw new Error('INSUFFICIENT_STOCK'); tx.update(stockRef, { availableKg: Number(s.availableKg || 0) - qty, reservedKg: Number(s.reservedKg || 0) + qty, updatedAt: serverTimestamp() }); const batchRef = doc(collection(db!, 'batches')); tx.set(batchRef, { batchNumber, yarnLabel: yarn, inputQtyKg: qty, assignedQtyKg: assignedTo ? qty : 0, progress: 0, status: assignedTo ? 'Assigned' : 'Created', assignedWorkerId: assignedTo || '', createdBy: appUser.uid, createdAt: serverTimestamp() }); }); await writeAudit(appUser, 'batch', `${batchNumber} · ${yarn} · ${qty} kg`); setOpen(false); setYarn(''); setQty(0); setAssignedTo(''); } catch (e) { alert(e instanceof Error && e.message === 'INSUFFICIENT_STOCK' ? 'Not enough available stock.' : 'Unable to create batch.'); } }
  const options = stock.filter(s => s.availableKg > 0); return <div className="page"><div className="section-tools"><span className="muted">{lang === 'mr' ? 'उपलब्ध स्टॉकमधून बॅच तयार करा' : 'Create a batch from available stock'}</span><button className="primary" onClick={() => setOpen(true)}><Plus size={18} />{tAll[lang].newBatch}</button></div><section className="card"><CardHeader title={lang === 'mr' ? 'बॅचेस' : 'Batches'} />{batches.length === 0 ? <Empty text={lang === 'mr' ? 'अजून बॅच नाही.' : 'No batches recorded yet.'} /> : batches.map((b: any) => <div className="row" key={b.id}><div><strong>{b.batchNumber}</strong><small>{b.yarnLabel} · Input {b.inputQtyKg || 0} kg · Assigned {b.assignedQtyKg || 0} kg</small></div><span className="pill green">{b.progress || 0}% · {b.status || 'Created'}</span></div>)}</section>{open && <Modal title={lang === 'mr' ? 'नवी बॅच' : 'New batch'} onClose={() => setOpen(false)}><div className="form"><label>{lang === 'mr' ? 'यार्न' : 'Yarn'}<select value={yarn} onChange={e => setYarn(e.target.value)}><option value="">Select</option>{options.map(s => <option key={s.id} value={s.yarnLabel}>{s.yarnLabel} · {s.availableKg} kg</option>)}</select></label><label>{lang === 'mr' ? 'इनपुट वजन' : 'Input kg'}<input type="number" min="1" value={qty || ''} onChange={e => setQty(Number(e.target.value))} /></label><label>{lang === 'mr' ? 'कामगार नियुक्त करा' : 'Assign worker'}<select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}><option value="">Later</option>{workers.filter(w => w.active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label></div><ModalActions onSave={create} /></Modal>}</div>; }

function Payroll({ lang }: { lang: Lang }) { const workers = useCollection<Worker>('workers'); const attendance = useCollection<any>('attendance'); return <div className="page"><div className="metric-grid"><Metric icon={<WalletCards />} title={lang === 'mr' ? 'या महिन्यात' : 'This month'} value={money(0)} /><Metric icon={<Clock3 />} title="Hourly" value={money(0)} /><Metric icon={<Activity />} title="Per KG" value={money(0)} /><Metric icon={<ClipboardList />} title="Per Task" value={money(0)} /></div><section className="card"><CardHeader title={lang === 'mr' ? 'पगाराचा सारांश' : 'Payroll summary'} />{workers.length === 0 ? <Empty text={lang === 'mr' ? 'अजून कामगार नाहीत.' : 'No workers yet.'} /> : workers.map(w => <div className="row" key={w.id}><div><strong>{w.name}</strong><small>{paymentLabel(w, lang)} · Attendance records {attendance.filter(a => a.workerId === w.id).length}</small></div><b>{money(0)}</b><span className="pill yellow">Pending</span></div>)}</section></div>; }

function Reports({ lang }: { lang: Lang }) { const cards = [lang === 'mr' ? 'साठा हालचाल' : 'Stock movement', lang === 'mr' ? 'दैनिक उत्पादन' : 'Daily production', lang === 'mr' ? 'कामगार हजेरी' : 'Worker attendance', lang === 'mr' ? 'कामगार कमाई' : 'Worker earnings', lang === 'mr' ? 'बॅच कामगिरी' : 'Batch performance', lang === 'mr' ? 'माल आवक रजिस्टर' : 'Inward register']; return <div className="page"><div className="report-grid">{cards.map(name => <div className="card report-card" key={name}><div className="metric-icon"><FileText /></div><h3>{name}</h3><p className="muted">{lang === 'mr' ? 'तारीख, यार्न, कामगार किंवा बॅचनुसार फिल्टर करा.' : 'Filter by date, yarn, worker or batch.'}</p><button className="ghost-btn">{lang === 'mr' ? 'अहवाल उघडा' : 'Open report'}<ChevronRight size={16} /></button></div>)}</div></div>; }

function Logbook({ lang }: { lang: Lang }) { const logs = useCollection<any>('audit_logs'); return <div className="page"><section className="card"><CardHeader title={lang === 'mr' ? 'ऑडिट लॉग' : 'Audit log'} />{logs.length === 0 ? <Empty text={lang === 'mr' ? 'अजून ऑडिट नोंदी नाहीत.' : 'No audit entries yet.'} /> : logs.map(l => <div className="row" key={l.id}><div><strong>{l.summary}</strong><small>{l.actorName || l.actorEmail} · {l.entity} · {l.action}</small></div><span className="muted">{l.createdAt?.toDate ? l.createdAt.toDate().toLocaleString('en-IN') : ''}</span></div>)}</section></div>; }

function SettingsView({ lang, appUser }: { lang: Lang; appUser: AppUser }) { const yarns = useCollection<Master>('master_yarns'); const weights = useCollection<Master>('master_package_weights'); const access = useCollection<any>('access_emails'); const [yarnName, setYarnName] = useState(''); const [weight, setWeight] = useState(''); const [email, setEmail] = useState(''); const [role, setRole] = useState<Role>('manager');
  async function addYarn() { if (!db || !yarnName.trim()) return; await addDoc(collection(db!, 'master_yarns'), { name: yarnName.trim(), active: true, createdAt: serverTimestamp() }); setYarnName(''); }
  async function addWeight() { if (!db || Number(weight) <= 0) return; await addDoc(collection(db!, 'master_package_weights'), { name: `${Number(weight)} kg`, weightKg: Number(weight), active: true, createdAt: serverTimestamp() }); setWeight(''); }
  async function addAccess() { if (!db || !email.trim()) return; const e = email.trim().toLowerCase(); await setDoc(doc(db!, 'access_emails', e), { email: e, role, active: true, createdAt: serverTimestamp(), createdBy: appUser.uid }, { merge: true }); setEmail(''); }
  return <div className="page"><div className="content-grid"><section className="card"><CardHeader title={lang === 'mr' ? 'यार्न मास्टर' : 'Yarn master'} /><div className="form"><label>Add yarn<input value={yarnName} onChange={e => setYarnName(e.target.value)} placeholder="Cotton · 10 Single" /></label><button className="secondary" onClick={addYarn}><Plus size={17} />Add yarn</button></div>{yarns.map(y => <div className="row" key={y.id}><strong>{y.name}</strong><span className="pill green">Active</span></div>)}</section><section className="card"><CardHeader title={lang === 'mr' ? 'पोटे / बॉक्स वजन' : 'Package weights'} /><div className="form"><label>Add weight (kg)<input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="50" /></label><button className="secondary" onClick={addWeight}><Plus size={17} />Add weight</button></div>{weights.length === 0 && <p className="muted">Defaults: 50 kg, 60 kg</p>}{weights.map(w => <div className="row" key={w.id}><strong>{w.weightKg} kg</strong><span className="pill green">Active</span></div>)}</section></div><section className="card"><CardHeader title={lang === 'mr' ? 'वापरकर्ता प्रवेश' : 'User access'} /><div className="form tw"><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="manager@example.com" /></label><label>Role<select value={role} onChange={e => setRole(e.target.value as Role)}><option value="owner">Owner</option><option value="manager">Manager</option><option value="employee">Employee</option><option value="watchman">Watchman</option></select></label></div><button className="primary narrow-btn" onClick={addAccess}><Plus size={17} />Add access</button>{access.map(a => <div className="row" key={a.id}><div><strong>{a.email}</strong><small>{a.role}</small></div><span className={a.active !== false ? 'pill green' : 'pill red'}>{a.active !== false ? 'Active' : 'Inactive'}</span></div>)}</section></div>; }

function paymentLabel(w: Worker, lang: Lang) { const map: Record<PaymentType, string> = { hour: lang === 'mr' ? 'तासाप्रमाणे' : 'Per Hour', kg: lang === 'mr' ? 'किलोप्रमाणे' : 'Per KG', task: lang === 'mr' ? 'कामाप्रमाणे' : 'Per Task' }; return `${map[w.paymentType]} · ₹${w.rate}`; }
function Metric({ icon, title, value, suffix }: { icon: React.ReactNode; title: string; value: string; suffix?: string }) { return <div className="metric card"><div className="metric-icon">{icon}</div><div><span>{title}</span><strong>{value} <small>{suffix}</small></strong></div></div>; }
function CardHeader({ title }: { title: string }) { return <div className="card-header"><h3>{title}</h3></div>; }
function Empty({ text }: { text: string }) { return <div className="empty-state">{text}</div>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop"><div className="modal card"><div className="sectionhead"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>{children}</div></div>; }
function ModalActions({ onSave }: { onSave: () => void }) { return <div className="modal-actions"><button className="primary" onClick={onSave}><Check size={18} />Save</button></div>; }
