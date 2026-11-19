import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, AlertCircle, ArrowDown, ArrowLeft, ArrowUpRight, Bell, Building2, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, CreditCard,
  FileClock, LayoutDashboard, LifeBuoy, LoaderCircle, LockKeyhole, LogOut, Menu,
  Search, Settings, Shield, ShieldCheck, Store, Sun, Moon, Users, X, Zap
} from "lucide-react";
import { get, patch, post, put } from "./api";

type Profile = { id: number; name: string; email: string; platform_role: "admin" | "super_admin" };
type PageData<T = any> = { items: T[]; pagination: { page: number; per_page: number; total: number; pages: number; has_next: boolean; has_previous: boolean } };
type Column = { label: string; render: (row: any) => ReactNode; className?: string };
type Filter = { key: string; label: string; options: { value: string; label: string }[] };

const nav = [
  { label: "Overview", to: "/", icon: LayoutDashboard },
  { label: "Users", to: "/users", icon: Users },
  { label: "Stores", to: "/stores", icon: Store },
  { label: "Subscriptions", to: "/subscriptions", icon: CreditCard },
  { label: "Subscription Requests", to: "/subscription-requests", icon: ClipboardList },
  { label: "Feedback & Support", to: "/feedback", icon: LifeBuoy },
  { label: "Audit Logs", to: "/audit-logs", icon: FileClock },
  { label: "Administrators", to: "/administrators", icon: ShieldCheck },
  { label: "Monitoring", to: "/monitoring", icon: Activity },
  { label: "Incidents", to: "/incidents", icon: AlertCircle },
  { label: "Settings", to: "/settings", icon: Settings }
];

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
function date(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}
function shortDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(parsed);
}
function statusTone(value?: string) {
  const v = (value || "").toLowerCase();
  if (["active", "resolved", "sent", "up", "enabled", "premium", "super_admin"].includes(v)) return "success";
  if (["trial", "pending", "new", "unknown", "in_progress"].includes(v)) return "warning";
  if (["expired", "failed", "down", "open", "paused", "cancelled"].includes(v)) return "danger";
  return "neutral";
}
function Status({ value }: { value?: string }) {
  const label = (value || "unknown").replaceAll("_", " ");
  return <span className={`status status-${statusTone(value)}`}><i />{label}</span>;
}
function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return <div className="state-panel error-state"><AlertCircle size={22}/><strong>We couldn't load this information</strong><span>{error}</span>{retry && <button className="button button-secondary" onClick={retry}>Try again</button>}</div>;
}
function LoadingState() {
  return <div className="state-panel"><LoaderCircle className="spin" size={22}/><span>Loading platform data…</span></div>;
}
function EmptyState({ title = "Nothing here yet", detail = "There are no records matching this view." }: { title?: string; detail?: string }) {
  return <div className="empty-state"><div className="empty-icon"><ClipboardList size={22}/></div><strong>{title}</strong><span>{detail}</span></div>;
}

function Login({ onLogin }: { onLogin: (profile: Profile) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await post("/admin/auth/login", { email, password });
      const result = await get<{ profile: Profile }>("/admin/auth/me");
      onLogin(result.profile);
    } catch (e) { setError(messageOf(e)); }
    finally { setBusy(false); }
  };
  return <main className="login-screen">
    <section className="login-card">
      <div className="brand-lockup"><div className="brand-mark"><Zap size={20} fill="currentColor"/></div><div><b>RetailOS</b><span>PLATFORM ADMIN</span></div></div>
      <div className="login-heading"><span className="eyebrow">SECURE ACCESS</span><h1>Welcome back</h1><p>Sign in with your provisioned platform administrator account.</p></div>
      <form onSubmit={submit} className="form-stack">
        <label>Email address<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@company.com" required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required /></label>
        {error && <div className="inline-error"><AlertCircle size={16}/>{error}</div>}
        <button className="button button-primary button-full" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <LockKeyhole size={17}/>} Sign in securely</button>
      </form>
      <div className="login-foot"><ShieldCheck size={15}/> Access is verified by the RetailOS server.</div>
    </section>
    <div className="login-caption">TX RETAILOS <span>·</span> INTERNAL PLATFORM CONSOLE</div>
  </main>;
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const saved = window.localStorage.getItem("retailos:theme:v1");
      return saved === "light" || saved === "dark" ? saved : "dark";
    } catch { return "dark"; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { window.localStorage.setItem("retailos:theme:v1", theme); } catch { /* Theme remains active for this session. */ }
  }, [theme]);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  return <button type="button" className="icon-button theme-toggle" onClick={() => setTheme(nextTheme)} aria-label={`Switch to ${nextTheme} theme`} title={`Switch to ${nextTheme} theme`} aria-pressed={theme === "light"}><Icon size={17}/></button>;
}

function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    get<{ profile: Profile }>("/admin/profile").then(r=>setProfile(r.profile)).catch(()=>setProfile(null)).finally(()=>setChecking(false));
  }, []);
  if (checking) return <div className="boot-screen"><LoaderCircle className="spin" size={26}/><span>Checking administrator session</span></div>;
  if (!profile) return <Login onLogin={setProfile}/>;
  return <Routes><Route path="/*" element={<Shell profile={profile} onLogout={()=>setProfile(null)} onProfileUpdate={setProfile} />}/></Routes>;
}

function Shell({ profile, onLogout, onProfileUpdate }: { profile: Profile; onLogout: () => void; onProfileUpdate: (profile: Profile) => void }) {
  const [drawer, setDrawer] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const current = nav.find(n => n.to === location.pathname) || nav[0];
  const visibleNav = profile.platform_role === "super_admin" ? nav : nav.filter(item => item.to !== "/administrators");
  const logout = async () => { try { await post("/admin/auth/logout"); } finally { onLogout(); navigate("/"); } };
  return <div className="app-shell">
    {drawer && <button className="drawer-scrim" aria-label="Close navigation" onClick={()=>setDrawer(false)}/>}
    <aside className={`sidebar ${drawer ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><div className="brand-mark"><Zap size={19} fill="currentColor"/></div><div><b>RetailOS</b><span>ADMIN CONSOLE</span></div><button className="icon-button sidebar-close" onClick={()=>setDrawer(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace-label">PLATFORM</div>
      <nav className="side-nav">{visibleNav.map(item=>{const Icon=item.icon;return <NavLink key={item.to} to={item.to} end={item.to==="/"} onClick={()=>setDrawer(false)} className={({isActive})=>`nav-link ${isActive?"nav-active":""}`}><Icon size={18}/><span>{item.label}</span></NavLink>;})}</nav>
      <div className="sidebar-bottom"><div className="sidebar-help"><div className="help-icon"><CircleHelp size={17}/></div><div><b>Need a hand?</b><span>Platform operations</span></div></div><div className="sidebar-version">TX RETAILOS <span>ADMIN · 1.0</span></div></div>
    </aside>
    <section className="main-column">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={()=>setDrawer(true)} aria-label="Open navigation"><Menu size={20}/></button><div className="breadcrumb"><span>Platform</span><ChevronRight size={14}/><b>{current.label}</b></div></div>
        <div className="topbar-right"><ThemeToggle/><div className="environment-pill"><i/>Platform console</div><div className="profile-wrap"><button className="profile-trigger" onClick={()=>setProfileMenu(v=>!v)}><span className="avatar">{(profile.name||"A").slice(0,1).toUpperCase()}</span><span className="profile-text"><b>{profile.name}</b><small>{profile.platform_role === "super_admin" ? "Super administrator" : "Administrator"}</small></span><ChevronDown size={15}/></button>
        {profileMenu && <div className="profile-menu"><button onClick={()=>{setProfileMenu(false);navigate("/settings");}}><Settings size={16}/> Settings</button><button onClick={logout}><LogOut size={16}/> Sign out</button></div>}</div></div>
      </header>
      <main className="page-content"><Routes>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/users" element={<UsersPage/>}/>
        <Route path="/stores" element={<StoresPage/>}/>
        <Route path="/subscriptions" element={<SubscriptionsPage/>}/>
        <Route path="/subscription-requests" element={<RequestsPage/>}/>
        <Route path="/feedback" element={<FeedbackPage/>}/>
        <Route path="/audit-logs" element={<AuditPage/>}/>
        <Route path="/administrators" element={<AdministratorsPage profile={profile}/>}/>
        <Route path="/monitoring" element={<MonitoringPage/>}/>
        <Route path="/incidents" element={<IncidentsPage/>}/>
        <Route path="/settings" element={<SettingsPage profile={profile} onLogout={onLogout} onProfileUpdate={onProfileUpdate}/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes></main>
      <footer className="app-footer"><span>TX RetailOS Admin</span><span>Independent platform administration</span></footer>
    </section>
  </div>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Dashboard() {
  const [data,setData] = useState<any>(null); const [error,setError] = useState(""); const [loading,setLoading] = useState(true);
  const load=()=>{setLoading(true);setError("");get<any>("/admin/overview").then(setData).catch(e=>setError(messageOf(e))).finally(()=>setLoading(false));};
  useEffect(load,[]);
  const metrics=data?.metrics;
  const cards=[
    {label:"Total users",value:metrics?.users_total,icon:Users,detail:"Registered accounts"},
    {label:"Total stores",value:metrics?.stores_total,icon:Store,detail:"Registered retail stores"},
    {label:"Active premium stores",value:metrics?.active_premium_stores,icon:Zap,detail:"Current Pro entitlement"},
    {label:"Active trial stores",value:metrics?.active_trial_stores,icon:Activity,detail:"Within trial period"},
    {label:"Free stores",value:metrics?.free_stores,icon:Building2,detail:"Stored free plan"},
    {label:"New users · 30 days",value:metrics?.new_users_last_30_days,icon:Users,detail:"Rolling 30-day period"},
    {label:"New stores · 30 days",value:metrics?.new_stores_last_30_days,icon:Store,detail:"Rolling 30-day period"},
    {label:"Sales transactions · 30 days",value:metrics?.sales_last_30_days,icon:ClipboardList,detail:"Transactions, not revenue"}
  ];
  return <><PageHeading eyebrow="PLATFORM OVERVIEW" title="Good day." description="A live snapshot of the RetailOS platform and its activity." action={<button className="button button-secondary" onClick={load}><Activity size={16}/> Refresh data</button>}/>
    {loading?<LoadingState/>:error?<ErrorState error={error} retry={load}/>:<><div className="metric-grid">{cards.map(c=>{const Icon=c.icon;return <article className="metric-card" key={c.label}><div className="metric-top"><span>{c.label}</span><div className="metric-icon"><Icon size={18}/></div></div><strong>{Number(c.value??0).toLocaleString()}</strong><small>{c.detail}</small></article>;})}</div>
    <div className="dashboard-lower"><section className="panel"><div className="panel-heading"><div><h2>Platform snapshot</h2><p>Authoritative totals returned by RetailOS Server.</p></div><Status value="Live data"/></div><div className="snapshot-list"><div><span>Reporting window</span><b>Rolling 30 days</b></div><div><span>Last generated</span><b>{date(data?.generated_at)}</b></div><div><span>Data source</span><b>RetailOS Server</b></div></div></section><section className="panel"><div className="panel-heading"><div><h2>Metric definitions</h2><p>How platform totals are calculated.</p></div></div><div className="definition-list">{Object.entries(data?.definitions||{}).map(([key,value])=><div key={key}><b>{key.replaceAll("_"," ")}</b><p>{String(value)}</p></div>)}</div></section></div></>}
  </>;
}

function TablePage({ title, eyebrow, description, endpoint, columns, filters=[], searchPlaceholder="Search records", emptyTitle, rowAction, extraQuery="", searchEnabled=true, beforeTable }: { title:string; eyebrow:string; description:string; endpoint:string; columns:Column[]; filters?:Filter[]; searchPlaceholder?:string; emptyTitle?:string; rowAction?:(row:any)=>void; extraQuery?:string; searchEnabled?:boolean; beforeTable?:ReactNode }) {
  const [search,setSearch]=useState(""); const [values,setValues]=useState<Record<string,string>>({}); const [page,setPage]=useState(1);
  const [result,setResult]=useState<PageData|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const query=useMemo(()=>{const p=new URLSearchParams({page:String(page),per_page:"20"});if(searchEnabled && search.trim())p.set("search",search.trim());Object.entries(values).forEach(([k,v])=>{if(v)p.set(k,v);});return `${endpoint}?${p.toString()}${extraQuery}`;},[endpoint,page,search,values,extraQuery,searchEnabled]);
  const load=()=>{setLoading(true);setError("");get<PageData>(query).then(setResult).catch(e=>setError(messageOf(e))).finally(()=>setLoading(false));};
  useEffect(load,[query]);
  const reset=()=>{setSearch("");setValues({});setPage(1);};
  return <><PageHeading eyebrow={eyebrow} title={title} description={description} action={<span className="record-count">{result?.pagination?.total?.toLocaleString() ?? "—"} records</span>}/>{beforeTable}
    <section className="panel table-panel"><div className="table-toolbar">{searchEnabled&&<div className="search-field"><Search size={17}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder={searchPlaceholder}/></div>}<div className="filter-row">{filters.map(f=><select key={f.key} aria-label={f.label} value={values[f.key]||""} onChange={e=>{setValues(v=>({...v,[f.key]:e.target.value}));setPage(1);}}><option value="">{f.label}</option>{f.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>)}{(search||Object.values(values).some(Boolean))&&<button className="text-button" onClick={reset}>Clear</button>}</div></div>
    {loading?<LoadingState/>:error?<ErrorState error={error} retry={load}/>:!result?.items?.length?<EmptyState title={emptyTitle||"No records found"} detail="Try changing the search term or filters."/>:<><div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c.label}>{c.label}</th>)}{rowAction&&<th><span className="sr-only">Open</span></th>}</tr></thead><tbody>{result.items.map((row:any,i)=><tr key={row.id??i} className={rowAction?"clickable-row":""} onClick={()=>rowAction?.(row)}>{columns.map(c=><td key={c.label} data-label={c.label} className={c.className}>{c.render(row)}</td>)}{rowAction&&<td className="row-end"><ArrowUpRight size={16}/></td>}</tr>)}</tbody></table></div><div className="table-pagination"><span>Showing {((result.pagination.page-1)*result.pagination.per_page)+1}–{Math.min(result.pagination.page*result.pagination.per_page,result.pagination.total)} of {result.pagination.total}</span><div><button className="icon-button" disabled={!result.pagination.has_previous} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft size={17}/></button><b>{result.pagination.page} / {Math.max(1,result.pagination.pages)}</b><button className="icon-button" disabled={!result.pagination.has_next} onClick={()=>setPage(p=>p+1)}><ChevronRight size={17}/></button></div></div></>}
    </section>
  </>;
}

function DetailModal({ title, endpoint, onClose, kind }: { title:string; endpoint:string; onClose:()=>void; kind:"user"|"store"|"feedback" }) {
  const [data,setData]=useState<any>(null);const [error,setError]=useState("");const [loading,setLoading]=useState(true);
  useEffect(()=>{get<any>(endpoint).then(setData).catch(e=>setError(messageOf(e))).finally(()=>setLoading(false));},[endpoint]);
  const item=data?.[kind]||data?.feedback||data?.user||data?.store;
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="detail-modal"><div className="modal-head"><div><span className="eyebrow">RECORD DETAILS</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose}><X size={19}/></button></div>{loading?<LoadingState/>:error?<ErrorState error={error}/>:<div className="detail-content">
    {kind==="user"&&<><DetailRow label="Account ID" value={item?.id}/><DetailRow label="Name" value={item?.name}/><DetailRow label="Email" value={item?.email}/><DetailRow label="Registered" value={date(item?.registered_at)}/><DetailRow label="Stores" value={item?.stores_count}/>{(item?.stores||[]).map((s:any)=><div className="detail-subcard" key={s.id}><b>{s.name}</b><span>Store #{s.id} · <Status value={s.subscription?.subscription_status}/></span><p>{s.activity?.products_count??0} products · {s.activity?.customers_count??0} customers · {s.activity?.sales_count??0} sales</p></div>)}</>}
    {kind==="store"&&<><DetailRow label="Store ID" value={item?.id}/><DetailRow label="Store name" value={item?.name}/><DetailRow label="Registered" value={date(item?.registered_at)}/><DetailRow label="Owner" value={item?.owner?.name}/><DetailRow label="Owner email" value={item?.owner?.email}/><DetailRow label="Plan" value={item?.subscription?.plan_name}/><DetailRow label="Subscription" value={item?.subscription?.subscription_status}/><DetailRow label="Products" value={item?.activity?.products_count}/><DetailRow label="Customers" value={item?.activity?.customers_count}/><DetailRow label="Sales count" value={item?.activity?.sales_count}/><DetailRow label="Open alerts" value={item?.activity?.open_alerts_count}/><DetailRow label="Last sale" value={date(item?.activity?.last_sale_at)}/></>}
    {kind==="feedback"&&<><DetailRow label="Submission ID" value={item?.submission_id}/><DetailRow label="Category" value={item?.category}/><DetailRow label="Contact" value={item?.contact_name}/><DetailRow label="Email" value={item?.contact_email}/><DetailRow label="Submitted" value={date(item?.created_at)}/><DetailRow label="Delivery" value={item?.delivery_status}/><DetailRow label="Support status" value={item?.support_status}/><div className="message-box">{item?.message}</div></>}
  </div>}</section></div>;
}
function DetailRow({label,value}:{label:string;value:unknown}){return <div className="detail-row"><span>{label}</span><b>{value===null||value===undefined||value===""?"—":String(value)}</b></div>;}

function UsersPage(){const [selected,setSelected]=useState<any>(null);return <><TablePage eyebrow="PLATFORM ACCOUNTS" title="Users" description="Find accounts and inspect their platform-level store and subscription summaries." endpoint="/admin/users" searchPlaceholder="Search name or email" filters={[{key:"has_store",label:"Store access",options:[{value:"true",label:"Has a store"},{value:"false",label:"No store"}]},{key:"plan",label:"Store plan",options:[{value:"free",label:"Free"},{value:"pro",label:"Pro"}]}]} columns={[
{label:"User",render:r=><div className="primary-cell"><b>{r.name}</b><span>{r.email}</span></div>},{label:"Stores",render:r=><b>{r.stores_count}</b>},{label:"Plan",render:r=>(r.stores||[]).length?<div className="stacked-cell">{r.stores.map((s:any)=><span key={s.id}>{s.subscription?.plan_name||s.subscription?.plan}</span>)}</div>:"—"},{label:"Registered",render:r=>shortDate(r.created_at)}]} rowAction={setSelected}/>{selected&&<DetailModal title={selected.name} endpoint={`/admin/users/${selected.id}`} kind="user" onClose={()=>setSelected(null)}/>}</>;}
function StoresPage(){const [selected,setSelected]=useState<any>(null);return <><TablePage eyebrow="RETAIL NETWORK" title="Stores" description="Review registered stores, their owners and current subscription state." endpoint="/admin/stores" searchPlaceholder="Search store, owner or email" filters={[{key:"plan",label:"Plan",options:[{value:"free",label:"Free"},{value:"pro",label:"Pro"}]},{key:"subscription_status",label:"Subscription",options:[{value:"active",label:"Active"},{value:"trial",label:"Trial"},{value:"expired",label:"Expired"}]}]} columns={[
{label:"Store",render:r=><div className="primary-cell"><b>{r.name}</b><span>Store #{r.id}</span></div>},{label:"Owner",render:r=><div className="primary-cell"><b>{r.owner?.name||"—"}</b><span>{r.owner?.email||"—"}</span></div>},{label:"Plan",render:r=><span>{r.subscription?.plan_name||r.subscription?.plan}</span>},{label:"Status",render:r=><Status value={r.subscription?.subscription_status}/>},{label:"Registered",render:r=>shortDate(r.registered_at)}]} rowAction={setSelected}/>{selected&&<DetailModal title={selected.name} endpoint={`/admin/stores/${selected.id}`} kind="store" onClose={()=>setSelected(null)}/>}</>;}
function SubscriptionsPage(){return <TablePage eyebrow="REVENUE ENTITLEMENTS" title="Subscriptions" description="Inspect current plan entitlements. Payment status is not inferred from plan records." endpoint="/admin/subscriptions" searchPlaceholder="Search store or account" filters={[{key:"state",label:"Entitlement",options:[{value:"free",label:"Free"},{value:"trial",label:"Trial"},{value:"active",label:"Active premium"},{value:"expired",label:"Expired"}]},{key:"plan",label:"Plan",options:[{value:"free",label:"Free"},{value:"pro",label:"Pro"}]}]} columns={[
{label:"Store",render:r=><div className="primary-cell"><b>{r.store?.name||"—"}</b><span>#{r.store?.id}</span></div>},{label:"Owner",render:r=><div className="primary-cell"><b>{r.account?.name||"—"}</b><span>{r.account?.email||"—"}</span></div>},{label:"Plan",render:r=>r.subscription?.plan_name||r.subscription?.plan||"—"},{label:"State",render:r=><Status value={r.subscription?.state||r.subscription?.subscription_status}/>},{label:"Period ends",render:r=>date(r.subscription?.current_period_end)}]}/>;}
function RequestsPage(){return <TablePage eyebrow="PLAN CHANGE WORKFLOW" title="Subscription requests" description="Review requested plan changes without treating pending requests as paid activations." endpoint="/admin/subscription-requests" searchPlaceholder="Search store or account" filters={[{key:"status",label:"Request status",options:[{value:"pending",label:"Pending"},{value:"cancelled",label:"Cancelled"}]}]} columns={[
{label:"Store",render:r=><div className="primary-cell"><b>{r.store?.name||"—"}</b><span>#{r.store?.id}</span></div>},{label:"Requested by",render:r=><div className="primary-cell"><b>{r.account?.name||"—"}</b><span>{r.account?.email||"—"}</span></div>},{label:"Plan requested",render:r=>r.requested_plan?.name||r.requested_plan?.id||"—"},{label:"Request",render:r=><Status value={r.status}/>},{label:"Activation",render:r=><Status value={r.activation||"not_activated"}/>},{label:"Submitted",render:r=>date(r.requested_at)}]}/>;}
function FeedbackPage(){const [selected,setSelected]=useState<any>(null);const [status,setStatus]=useState("new");const [saving,setSaving]=useState(false);const [error,setError]=useState("");const save=async()=>{if(!selected)return;setSaving(true);setError("");try{await patch(`/admin/feedback/${selected.id}/status`,{support_status:status});setSelected({...selected,support_status:status});}catch(e){setError(messageOf(e));}finally{setSaving(false);}};return <><TablePage eyebrow="CUSTOMER VOICE" title="Feedback & Support" description="Track support handling separately from email delivery status." endpoint="/admin/feedback" searchPlaceholder="Search submission, message or contact" filters={[{key:"support_status",label:"Support status",options:[{value:"new",label:"New"},{value:"in_progress",label:"In progress"},{value:"resolved",label:"Resolved"}]},{key:"delivery_status",label:"Email delivery",options:[{value:"sent",label:"Sent"},{value:"pending",label:"Pending"},{value:"failed",label:"Failed"}]},{key:"category",label:"Category",options:[{value:"bug",label:"Bug"},{value:"suggestion",label:"Suggestion"},{value:"question",label:"Question"},{value:"other",label:"Other"}]}]} columns={[
{label:"Submission",render:r=><div className="primary-cell"><b>{r.submission_id}</b><span>{r.category}</span></div>},{label:"Contact",render:r=><div className="primary-cell"><b>{r.contact_name||"Anonymous"}</b><span>{r.contact_email||"No email"}</span></div>},{label:"Support",render:r=><Status value={r.support_status}/>},{label:"Delivery",render:r=><Status value={r.delivery_status}/>},{label:"Received",render:r=>date(r.created_at)}]} rowAction={r=>{setSelected(r);setStatus(r.support_status||"new");}}/>{selected&&<div className="modal-backdrop"><section className="detail-modal"><div className="modal-head"><div><span className="eyebrow">FEEDBACK TICKET</span><h2>{selected.submission_id}</h2></div><button className="icon-button" onClick={()=>setSelected(null)}><X size={19}/></button></div><FeedbackDetail id={selected.id}/><div className="form-stack status-editor"><label>Support workflow status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></label>{error&&<div className="inline-error">{error}</div>}<button className="button button-primary" onClick={save} disabled={saving||status===selected.support_status}>{saving?"Saving…":"Save support status"}</button></div></section></div>}</>;}
function FeedbackDetail({id}:{id:number}){const [item,setItem]=useState<any>(null);useEffect(()=>{get<any>(`/admin/feedback/${id}`).then(r=>setItem(r.feedback)).catch(()=>{});},[id]);if(!item)return <LoadingState/>;return <div className="detail-content"><DetailRow label="Category" value={item.category}/><DetailRow label="Contact" value={item.contact_name}/><DetailRow label="Email" value={item.contact_email}/><DetailRow label="Email delivery" value={item.delivery_status}/><DetailRow label="Submitted" value={date(item.created_at)}/><div className="message-box">{item.message}</div></div>;}
function AuditPage(){return <TablePage eyebrow="ACCOUNTABILITY" title="Audit logs" description="Append-only records of privileged platform activity." endpoint="/admin/audit-logs" searchEnabled={false} filters={[{key:"action_type",label:"Action type",options:[{value:"feedback.support_status_changed",label:"Feedback status changed"},{value:"platform_admin.profile_updated",label:"Profile updated"},{value:"platform_admin.role_granted",label:"Admin granted"},{value:"platform_admin.role_revoked",label:"Admin revoked"}]},{key:"target_type",label:"Target type",options:[{value:"user",label:"User"},{value:"feedback_submission",label:"Feedback"},{value:"monitor",label:"Monitor"}]}]} columns={[
{label:"Action",render:r=><div className="primary-cell"><b>{r.action_type}</b><span>{r.target_type} · {r.target_id}</span></div>},{label:"Administrator",render:r=><div className="primary-cell"><b>{r.actor?.name||"System"}</b><span>{r.actor_user_id? `User #${r.actor_user_id}`:"No actor"}</span></div>},{label:"Details",render:r=><span className="muted-cell">{Object.keys(r.details||{}).join(", ")||"—"}</span>},{label:"Timestamp",render:r=>date(r.created_at)}]}/>;}
function AdministratorsPage({profile}:{profile:Profile}){const [data,setData]=useState<{items:any[]}|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [userId,setUserId]=useState("");const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");const canManage=profile.platform_role==="super_admin";const load=()=>{setLoading(true);get<{items:any[]}>("/admin/administrators").then(setData).catch(e=>setError(messageOf(e))).finally(()=>setLoading(false));};useEffect(load,[]);const change=async(id:number,role:"admin"|null)=>{setBusy(true);setNotice("");setError("");try{await put(`/admin/users/${id}/admin-role`,{platform_role:role});setNotice(role?"Administrator access granted.":"Administrator access revoked.");load();}catch(e){setError(messageOf(e));}finally{setBusy(false);}};return <><PageHeading eyebrow="ACCESS GOVERNANCE" title="Administrators" description="Manage platform administrator access. Only the deployment-provisioned super administrator can appoint or revoke administrators."/><section className="panel"><div className="panel-heading"><div><h2>Administrator directory</h2><p>Credential and session information is never displayed.</p></div><span className="record-count">{data?.items?.length??"—"} admins</span></div>{loading?<LoadingState/>:error?<ErrorState error={error} retry={load}/>:!data?.items?.length?<EmptyState title="No administrators found"/>:<div className="table-wrap"><table><thead><tr><th>Administrator</th><th>Role</th><th>Added</th>{canManage&&<th>Access</th>}</tr></thead><tbody>{data.items.map((r:any)=><tr key={r.id}><td><div className="primary-cell"><b>{r.name}</b><span>{r.email} · #{r.id}</span></div></td><td><Status value={r.platform_role}/></td><td>{shortDate(r.created_at)}</td>{canManage&&<td>{r.platform_role==="super_admin"?<span className="muted-cell">Protected root account</span>:<button className="text-button danger-text" disabled={busy} onClick={()=>change(r.id,r.platform_role==="admin"?null:"admin")}>{r.platform_role==="admin"?"Revoke access":"Grant access"}</button>}</td>}</tr>)}</tbody></table></div>}{notice&&<div className="inline-success"><Check size={16}/>{notice}</div>}{error&&<div className="inline-error">{error}</div>}</section>
{canManage&&<section className="panel grant-panel"><div><h2>Grant administrator access</h2><p>Enter the numeric user ID of an existing RetailOS account. The server prevents self-escalation and protects the bootstrap super administrator.</p></div><form onSubmit={e=>{e.preventDefault();const id=Number(userId);if(Number.isInteger(id)&&id>0)change(id,"admin");}}><input inputMode="numeric" value={userId} onChange={e=>setUserId(e.target.value)} placeholder="User ID" required/><button className="button button-primary" disabled={busy||!userId}>Grant access</button></form></section>}</>;}
function MonitoringSummary(){const [data,setData]=useState<any>(null);const [error,setError]=useState("");useEffect(()=>{get<any>("/admin/monitoring/summary").then(setData).catch(e=>setError(messageOf(e)));},[]);if(error)return <div className="inline-error"><AlertCircle size={15}/>{error}</div>;if(!data)return <div className="summary-loading"><LoaderCircle className="spin" size={16}/>Loading monitoring summary…</div>;const items=[["Total monitors",data.monitors_total],["Enabled",data.monitors_enabled],["Paused",data.monitors_paused],["Reporting up",data.monitors_up],["Reporting down",data.monitors_down],["Open incidents",data.open_incidents]];return <div className="monitor-summary">{items.map(([label,value])=><div className="monitor-summary-card" key={String(label)}><span>{label}</span><b>{Number(value??0).toLocaleString()}</b></div>)}</div>;}
function MonitoringPage(){return <TablePage eyebrow="SERVICE VISIBILITY" title="Monitoring" description="Current monitor state and latest recorded checks. This page reads existing monitoring records; it does not run a browser-based scheduler." endpoint="/admin/monitors" searchEnabled={false} beforeTable={<MonitoringSummary/>} filters={[{key:"state",label:"Monitor state",options:[{value:"enabled",label:"Enabled"},{value:"paused",label:"Paused"}]}]} columns={[
{label:"Monitor",render:r=><div className="primary-cell"><b>{r.name}</b><span>{r.target_url}</span></div>},{label:"State",render:r=><Status value={r.state}/>},{label:"Latest result",render:r=><Status value={r.current_status}/>},{label:"Response",render:r=>r.latest_response_ms==null?"—":`${r.latest_response_ms} ms`},{label:"Last checked",render:r=>date(r.last_check_at)},{label:"Next check",render:r=>date(r.next_check_at)}]}/>;}
function IncidentsPage(){return <TablePage eyebrow="SERVICE EVENTS" title="Incidents" description="Recorded monitoring failures and their recovery state." endpoint="/admin/incidents" searchEnabled={false} filters={[{key:"status",label:"Incident status",options:[{value:"open",label:"Open"},{value:"resolved",label:"Resolved"}]}]} columns={[
{label:"Monitor",render:r=><div className="primary-cell"><b>{r.monitor_name||`Monitor #${r.monitor_id}`}</b><span>Incident #{r.id}</span></div>},{label:"Status",render:r=><Status value={r.status}/>},{label:"Failures",render:r=><b>{r.failure_count}</b>},{label:"Latest error",render:r=>r.latest_error||"—"},{label:"Opened",render:r=>date(r.opened_at)},{label:"Resolved",render:r=>date(r.resolved_at)}]}/>;}
function SettingsPage({profile,onLogout,onProfileUpdate}:{profile:Profile;onLogout:()=>void;onProfileUpdate:(profile:Profile)=>void}){const [name,setName]=useState(profile.name);const [current,setCurrent]=useState("");const [next,setNext]=useState("");const [confirm,setConfirm]=useState("");const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");const [error,setError]=useState("");const run=async(fn:()=>Promise<any>,success:string)=>{setBusy(true);setNotice("");setError("");try{await fn();setNotice(success);}catch(e){setError(messageOf(e));}finally{setBusy(false);}};return <><PageHeading eyebrow="YOUR WORKSPACE" title="Settings" description="Manage your administrator profile and account security."/><div className="settings-grid"><section className="panel settings-panel"><div className="panel-heading"><div><h2>Administrator profile</h2><p>Only your display name can be changed here.</p></div><div className="metric-icon"><Users size={18}/></div></div><form className="form-stack" onSubmit={e=>{e.preventDefault();run(async()=>{const updated=await patch<{profile:Profile}>("/admin/profile",{name});onProfileUpdate(updated.profile);}, "Profile updated.");}}><label>Display name<input value={name} onChange={e=>setName(e.target.value)} minLength={2} required/></label><label>Email address<input value={profile.email} disabled/></label><label>Platform role<input value={profile.platform_role.replaceAll("_"," ")} disabled/></label><button className="button button-primary" disabled={busy||name===profile.name}>Save profile</button></form></section>
<section className="panel settings-panel"><div className="panel-heading"><div><h2>Change password</h2><p>Your sessions will be invalidated after a successful password change.</p></div><div className="metric-icon"><LockKeyhole size={18}/></div></div><form className="form-stack" onSubmit={e=>{e.preventDefault();run(async()=>{await post("/admin/auth/change-password",{current_password:current,new_password:next});onLogout();}, "Password changed. Sign in again.");}}><label>Current password<input type="password" value={current} onChange={e=>setCurrent(e.target.value)} required/></label><label>New password<input type="password" value={next} onChange={e=>setNext(e.target.value)} minLength={12} required/></label><button className="button button-primary" disabled={busy||!current||next.length<12}>Update password</button></form></section>
<section className="panel settings-panel security-warning"><div className="panel-heading"><div><h2>Revoke all sessions</h2><p>Sign out every active session for this administrator account, including this browser.</p></div><div className="metric-icon"><Shield size={18}/></div></div><label>Type REVOKE to confirm<input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="REVOKE"/></label><button className="button button-danger" disabled={busy||confirm!=="REVOKE"} onClick={()=>run(async()=>{await post("/admin/sessions/revoke-all");onLogout();},"All sessions revoked.")}>Revoke all sessions</button></section></div>{notice&&<div className="inline-success"><Check size={16}/>{notice}</div>}{error&&<div className="inline-error">{error}</div>}</>;}

export default App;
