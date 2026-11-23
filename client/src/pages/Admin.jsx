import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Waves, Lock, Mail, ShieldCheck, LogOut, Search, BedDouble, CalendarCheck, XCircle, IndianRupee, Building2, Download, ArrowLeft, AlertCircle, Users, Phone } from "lucide-react";
import { apiFetch } from "../api.js";
import { money } from "../money.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";
import "../admin.css";
import { Toast } from "../components/Notice.jsx";

const fmt = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const nightsOf = b => Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000));
const refOf = b => String(b._id).slice(-8).toUpperCase();

function AdminLogin() {
  const { login, logout } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const u = await login(form.email.trim(), form.password);
      if (u.role !== "admin") { logout(); setError("This account doesn't have admin access."); }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit} noValidate>
        <span className="admin-badge"><ShieldCheck size={15} /> ADMIN PORTAL</span>
        <h1><Waves size={26} /> skyhaven<span>.</span></h1>
        <p>Sign in to manage stays and view their bookings.</p>
        <label className="form-field"><span>Admin email</span><div className="input-wrap"><Mail size={16} /><input type="email" autoComplete="username" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div></label>
        <label className="form-field"><span>Password</span><div className="input-wrap"><Lock size={16} /><input type="password" autoComplete="current-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div></label>
        {error && <div className="inline-notice error"><AlertCircle size={17} />{error}</div>}
        <button className="confirm-button" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <Link to="/" className="admin-back"><ArrowLeft size={14} /> Back to SkyHaven</Link>
      </form>
    </div>
  );
}

function PayCell({ b, onMark }) {
  if (b.status !== "Confirmed") return <small className="dash">—</small>;
  if (b.paymentStatus === "Paid") return <><i className="pill ok">Paid</i><small>{b.paymentMethod}</small><small className="mono-s">{b.transactionId}</small></>;
  return (
    <>
      <i className="pill due">Due</i>
      {b.paymentFailures > 0 && <small className="req">{b.paymentFailures} failed online attempt{b.paymentFailures > 1 ? "s" : ""}</small>}
      <select className="mark-paid" value="" onChange={e => e.target.value && onMark(b, e.target.value)} aria-label="Mark as paid"><option value="">Mark paid…</option>{["Cash", "Card", "UPI", "Netbanking"].map(m => <option key={m}>{m}</option>)}</select>
    </>
  );
}

function Stat({ icon, label, value, tone }) {
  return <div className={`admin-stat ${tone}`}><span>{icon}</span><div><small>{label}</small><b>{value}</b></div></div>;
}

function Dashboard() {
  const { user, logout } = useAuth();
  const { notify } = useNotice();
  const [overview, setOverview] = useState(null);
  const [stays, setStays] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestQ, setGuestQ] = useState("");
  const [guestResults, setGuestResults] = useState(null);
  useEffect(() => {
    if (guestQ.trim().length < 2) { setGuestResults(null); return; }
    const t = setTimeout(() => apiFetch(`/admin/bookings?q=${encodeURIComponent(guestQ.trim())}`).then(setGuestResults).catch(e => notify("error", e.message)), 250);
    return () => clearTimeout(t);
  }, [guestQ, notify]);
  const openStay = id => { setSelected(id); setStatus(""); setQ(""); setGuestQ(""); };

  const loadStays = useCallback(() => apiFetch(`/admin/stays?search=${encodeURIComponent(search)}`).then(setStays).catch(e => notify("error", e.message)), [search, notify]);
  const loadOverview = useCallback(() => apiFetch("/admin/overview").then(setOverview).catch(e => notify("error", e.message)), [notify]);
  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { const t = setTimeout(loadStays, 200); return () => clearTimeout(t); }, [loadStays]);

  const loadDetail = useCallback(async () => {
    if (!selected) return setDetail(null);
    setLoading(true);
    try { setDetail(await apiFetch(`/admin/stays/${selected}/bookings${status ? `?status=${status}` : ""}`)); }
    catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [selected, status, notify]);
  useEffect(() => { loadDetail(); }, [loadDetail]);

  async function markPaid(b, method) {
    try { const d = await apiFetch(`/admin/bookings/${b._id}/payment`, { method: "PATCH", body: JSON.stringify({ method }) }); notify("success", d.message); loadDetail(); loadOverview(); setGuestQ(g => g + " "); setGuestQ(g => g.trimEnd()); }
    catch (e) { notify("error", e.message); }
  }
  async function cancel(b) {
    if (!window.confirm(`Cancel booking ${refOf(b)} for ${b.fullName}? The guest will be emailed.`)) return;
    try { const d = await apiFetch(`/admin/bookings/${b._id}/cancel`, { method: "PATCH" }); notify("success", d.message); loadDetail(); loadStays(); loadOverview(); }
    catch (e) { notify("error", e.message); }
  }

  const bookings = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (detail?.bookings || []).filter(b => !t || [b.fullName, b.email, b.phone, refOf(b)].some(v => v.toLowerCase().includes(t)));
  }, [detail, q]);

  function exportCsv() {
    const rows = [["Reference", "Guest", "Email", "Phone", "Check-in", "Check-out", "Nights", "Guests", "Total", "Status", "Requests"],
      ...bookings.map(b => [refOf(b), b.fullName, b.email, b.phone, fmt(b.checkIn), fmt(b.checkOut), nightsOf(b), b.guests, b.totalPrice, b.status, b.requests || ""])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${detail.stay.name.replace(/\W+/g, "-")}-bookings.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <span className="admin-brand"><Waves size={20} /> skyhaven<span>.</span> <em>Admin</em></span>
        <div className="admin-top-right"><Link to="/">View site</Link><span>{user.email}</span><button onClick={logout}><LogOut size={15} /> Sign out</button></div>
      </header>
      <div className="admin-body">
        <div className="admin-guest-search">
          <Search size={18} />
          <input placeholder="Search any guest by name, email, phone or booking reference…" value={guestQ} onChange={e => setGuestQ(e.target.value)} />
          {guestQ && <button onClick={() => setGuestQ("")} aria-label="Clear search">×</button>}
        </div>
        <div className="admin-stats">
          <Stat tone="blue" icon={<Building2 size={20} />} label="Stays" value={overview?.stays ?? "–"} />
          <Stat tone="mint" icon={<CalendarCheck size={20} />} label="Confirmed bookings" value={overview?.confirmed ?? "–"} />
          <Stat tone="rose" icon={<XCircle size={20} />} label="Cancelled" value={overview?.cancelled ?? "–"} />
          <Stat tone="gold" icon={<IndianRupee size={20} />} label="Paid / booked revenue" value={overview ? `${money(overview.collected)} / ${money(overview.revenue)}` : "–"} />
        </div>
        <div className="admin-grid">
          <aside className="admin-stays">
            <div className="admin-search"><Search size={15} /><input placeholder="Search stays or city" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="admin-stay-list">
              {stays.map(s => (
                <button key={s._id} className={selected === s._id ? "admin-stay active" : "admin-stay"} onClick={() => openStay(s._id)}>
                  <img src={s.image} alt="" loading="lazy" />
                  <span><b>{s.name}</b><small>{s.location}</small></span>
                  <span className="admin-count" title="Confirmed bookings">{s.confirmed}</span>
                </button>
              ))}
              {!stays.length && <p className="admin-empty-small">No stays match.</p>}
            </div>
          </aside>
          <section className="admin-panel">
            {guestResults ? (
              <>
                <h2 className="admin-results-title">{guestResults.length} booking{guestResults.length === 1 ? "" : "s"} matching “{guestQ.trim()}”</h2>
                {!guestResults.length ? <div className="admin-placeholder small"><Users size={34} /><p>No guests found. Try a different name, email or phone.</p></div> : (
                  <div className="admin-table-wrap"><table className="admin-table">
                    <thead><tr><th>Ref</th><th>Guest</th><th>Stay</th><th>Dates</th><th>Total</th><th>Status</th><th>Payment</th><th></th></tr></thead>
                    <tbody>{guestResults.map(b => (
                      <tr key={b._id} className={b.status === "Cancelled" ? "cancelled" : ""}>
                        <td className="mono">{refOf(b)}</td>
                        <td><b>{b.fullName}</b><small><Mail size={11} /> {b.email}</small><small><Phone size={11} /> {b.phone}</small></td>
                        <td><b>{b.roomName}</b><small>{b.location}</small></td>
                        <td>{fmt(b.checkIn)} → {fmt(b.checkOut)}<small>{nightsOf(b)} night{nightsOf(b) > 1 ? "s" : ""} · {b.guests} guest{b.guests > 1 ? "s" : ""}</small></td>
                        <td><b>{money(b.totalPrice)}</b></td>
                        <td><i className={b.status === "Confirmed" ? "pill ok" : "pill bad"}>{b.status}</i></td>
                        <td><PayCell b={b} onMark={markPaid} /></td>
                        <td><button className="admin-ghost" onClick={() => openStay(b.room)}>Open stay</button></td>
                      </tr>))}</tbody>
                  </table></div>
                )}
              </>
            ) : !selected ? (
              <div className="admin-placeholder">
                <BedDouble size={40} /><h2>Select a stay</h2><p>Pick a stay on the left to see everyone who has booked it.</p>
                {overview?.recent?.length > 0 && <div className="admin-recent"><h3>Latest bookings</h3>{overview.recent.map(b => <button key={b._id} onClick={() => openStay(b.room)}><b>{b.roomName}</b><span>{b.fullName} · {fmt(b.checkIn)}</span><i className={b.status === "Confirmed" ? "pill ok" : "pill bad"}>{b.status}</i></button>)}</div>}
              </div>
            ) : !detail ? <p className="admin-empty-small">Loading…</p> : (
              <>
                <div className="admin-stay-head">
                  <img src={detail.stay.image} alt="" />
                  <div><h2>{detail.stay.name}</h2><p>{detail.stay.location} · {detail.stay.type} · {money(detail.stay.price)} / night</p></div>
                </div>
                <div className="admin-toolbar">
                  <div className="admin-search"><Search size={15} /><input placeholder="Search guest, email, phone, reference" value={q} onChange={e => setQ(e.target.value)} /></div>
                  <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option><option>Confirmed</option><option>Cancelled</option></select>
                  <button className="admin-ghost" onClick={exportCsv} disabled={!bookings.length}><Download size={15} /> CSV</button>
                </div>
                {loading && <p className="admin-empty-small">Loading bookings…</p>}
                {!loading && !bookings.length ? <div className="admin-placeholder small"><CalendarCheck size={34} /><p>No bookings found for this stay{status || q ? " with these filters" : " yet"}.</p></div> : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>Ref</th><th>Guest</th><th>Stay dates</th><th>Guests</th><th>Total</th><th>Status</th><th>Payment</th><th></th></tr></thead>
                      <tbody>{bookings.map(b => (
                        <tr key={b._id} className={b.status === "Cancelled" ? "cancelled" : ""}>
                          <td className="mono">{refOf(b)}</td>
                          <td><b>{b.fullName}</b><small><Mail size={11} /> {b.email}</small><small><Phone size={11} /> {b.phone}</small>{b.requests && <small className="req">“{b.requests}”</small>}</td>
                          <td>{fmt(b.checkIn)} → {fmt(b.checkOut)}<small>{nightsOf(b)} night{nightsOf(b) > 1 ? "s" : ""}</small></td>
                          <td><Users size={13} /> {b.guests}</td>
                          <td><b>{money(b.totalPrice)}</b></td>
                          <td><i className={b.status === "Confirmed" ? "pill ok" : "pill bad"}>{b.status}</i></td>
                        <td><PayCell b={b} onMark={markPaid} /></td>
                          <td>{b.status === "Confirmed" && <button className="admin-danger" onClick={() => cancel(b)}>Cancel</button>}</td>
                        </tr>))}</tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="admin-login-page"><span className="loader"></span></div>;
  return <>{user?.role === "admin" ? <Dashboard /> : <AdminLogin />}<Toast /></>;
}
