import React, { useEffect, useMemo, useState } from "react";
import { X, Smartphone, CreditCard, Landmark, Lock, ShieldCheck, AlertCircle, Clock, ArrowRight, Copy, Check, CalendarDays, Wifi } from "lucide-react";
import { apiFetch } from "../api.js";
import { money } from "../money.js";
import "../payment.css";

const TABS = [
  { id: "UPI", label: "UPI", hint: "Instant", icon: Smartphone },
  { id: "Card", label: "Card", hint: "Credit / Debit", icon: CreditCard },
  { id: "Netbanking", label: "Net banking", hint: "All major banks", icon: Landmark }
];
const UPI_APPS = [{ name: "GPay", handle: "@okaxis", color: "#4285f4" }, { name: "PhonePe", handle: "@ybl", color: "#5f259f" }, { name: "Paytm", handle: "@paytm", color: "#00b9f1" }, { name: "BHIM", handle: "@upi", color: "#f58220" }];
const POPULAR_BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank"];
const SHORT = { "State Bank of India": "SBI", "HDFC Bank": "HDFC", "ICICI Bank": "ICICI", "Axis Bank": "Axis" };

const fmtCard = v => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
const fmtExpiry = v => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };
const cardBrand = n => { const d = n.replace(/\s/g, ""); if (/^4/.test(d)) return "VISA"; if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard"; if (/^(60|65|81|82|508)/.test(d)) return "RuPay"; if (/^3[47]/.test(d)) return "Amex"; return ""; };

function CardPreview({ number, name, expiry, brand, flip }) {
  const digits = (number.replace(/\s/g, "") + "•".repeat(16)).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  return (
    <div className={flip ? "card-preview flipped" : "card-preview"} aria-hidden="true">
      <div className="card-face front">
        <div className="card-top"><span className="card-chip" /><Wifi size={20} className="card-nfc" /></div>
        <div className="card-number">{digits}</div>
        <div className="card-bottom">
          <div><small>CARD HOLDER</small><b>{name.trim() || "YOUR NAME"}</b></div>
          <div><small>EXPIRES</small><b>{expiry || "MM/YY"}</b></div>
          <span className="card-brand">{brand}</span>
        </div>
      </div>
      <div className="card-face back"><div className="card-stripe" /><div className="card-cvv">•••</div></div>
    </div>
  );
}

export default function PaymentModal({ booking, onClose, onPaid }) {
  const [method, setMethod] = useState("UPI");
  const [f, setF] = useState({ upiId: "", cardNumber: "", cardName: "", expiry: "", cvv: "", bank: "" });
  const [banks, setBanks] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);
  const [paid, setPaid] = useState(null);
  const [flip, setFlip] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { apiFetch("/payments/banks").then(setBanks).catch(() => {}); }, []);
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };
  const nights = useMemo(() => Math.max(1, Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000)), [booking]);
  const day = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  const otherBanks = banks.filter(b => !POPULAR_BANKS.includes(b));

  async function pay(e) {
    e.preventDefault();
    setFailure(null); setErrors({}); setBusy(true);
    try {
      const body = { email: booking.email, method, ...(method === "UPI" ? { upiId: f.upiId } : method === "Card" ? { cardNumber: f.cardNumber, cardName: f.cardName, expiry: f.expiry, cvv: f.cvv } : { bank: f.bank }) };
      const d = await apiFetch(`/bookings/${booking._id}/pay`, { method: "POST", body: JSON.stringify(body) });
      setPaid(d.booking); onPaid?.(d.booking);
    } catch (err) {
      if (err.errors) { const es = {}; err.errors.forEach(x => es[x.field] = x.message); setErrors(es); }
      else setFailure(err.message);
    } finally { setBusy(false); setF(p => ({ ...p, cvv: "" })); }
  }

  const copyTxn = async () => { try { await navigator.clipboard.writeText(paid.transactionId); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard unavailable */ } };
  const err = k => errors[k] && <small className="field-error">{errors[k]}</small>;
  const close = () => !busy && onClose(paid);

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <section className="modal pay-modal" aria-label="Payment">
        <button className="modal-close" onClick={close} aria-label="Close"><X /></button>

        {paid ? (
          <div className="pay-success">
            <svg className="success-check" viewBox="0 0 52 52" aria-hidden="true"><circle className="sc-circle" cx="26" cy="26" r="24" /><path className="sc-tick" d="M14 27l8 8 16-17" /></svg>
            <h2>Payment successful</h2>
            <p className="pay-amount">{money(paid.totalPrice)}</p>
            <p className="pay-for">paid for <b>{paid.roomName}</b></p>
            <div className="pay-receipt">
              <span>Method</span><b>{paid.paymentMethod}</b>
              <span>Dates</span><b>{day(paid.checkIn)} – {day(paid.checkOut)}</b>
              <span>Transaction ID</span><b className="mono">{paid.transactionId}<button type="button" onClick={copyTxn} aria-label="Copy transaction ID">{copied ? <Check size={14} /> : <Copy size={14} />}</button></b>
            </div>
            <p className="pay-note">A receipt has been emailed to {paid.email}. Nothing more to pay at check-out.</p>
            <button className="confirm-button" onClick={() => onClose(paid)}>Done</button>
          </div>
        ) : (
          <div className="pay-grid">
            <aside className="pay-aside">
              <div className="modal-kicker"><Lock size={14} /> SECURE CHECKOUT</div>
              <h3>{booking.roomName}</h3>
              <p className="pay-loc">{booking.location}</p>
              <div className="pay-lines">
                <div><CalendarDays size={14} /><span>{day(booking.checkIn)} → {day(booking.checkOut)}</span></div>
                <div><span>{nights} night{nights > 1 ? "s" : ""} · {booking.guests} guest{booking.guests > 1 ? "s" : ""}</span></div>
              </div>
              <div className="pay-total"><small>AMOUNT DUE</small><strong>{money(booking.totalPrice)}</strong></div>
              {booking.paymentFailures > 0 && <div className="pay-attempts"><AlertCircle size={13} /> {booking.paymentFailures} earlier attempt{booking.paymentFailures > 1 ? "s" : ""} didn't go through</div>}
              <ul className="pay-trust">
                <li><ShieldCheck size={15} /> 256-bit encrypted</li>
                <li><Lock size={15} /> Card details never stored</li>
                <li><Clock size={15} /> Or pay before checkout</li>
              </ul>
            </aside>

            <div className="pay-main">
              <div className="pay-tabs" role="tablist">
                {TABS.map(t => (
                  <button key={t.id} type="button" role="tab" aria-selected={method === t.id} className={method === t.id ? "active" : ""} onClick={() => { setMethod(t.id); setErrors({}); setFailure(null); }}>
                    <t.icon size={20} /><b>{t.label}</b><small>{t.hint}</small>
                  </button>
                ))}
              </div>

              <form onSubmit={pay} noValidate className={busy ? "busy" : ""}>
                {method === "UPI" && (
                  <div className="pay-pane" key="upi">
                    <div className="upi-apps">{UPI_APPS.map(a => <button type="button" key={a.name} onClick={() => set("upiId", (f.upiId.split("@")[0] || "yourname") + a.handle)}><i style={{ background: a.color }}>{a.name[0]}</i>{a.name}</button>)}</div>
                    <label className="form-field"><span>UPI ID</span><div className={errors.upiId ? "input-wrap invalid" : "input-wrap"}><Smartphone size={16} /><input value={f.upiId} onChange={e => set("upiId", e.target.value.trim())} placeholder="yourname@okaxis" autoComplete="off" inputMode="email" /></div>{err("upiId")}<small className="pay-hint">We'll send a collect request to your UPI app. Approve it to complete payment.</small></label>
                  </div>
                )}

                {method === "Card" && (
                  <div className="pay-pane" key="card">
                    <CardPreview number={f.cardNumber} name={f.cardName} expiry={f.expiry} brand={cardBrand(f.cardNumber)} flip={flip} />
                    <label className="form-field"><span>Card number</span><div className={errors.cardNumber ? "input-wrap invalid" : "input-wrap"}><CreditCard size={16} /><input inputMode="numeric" value={f.cardNumber} onChange={e => set("cardNumber", fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" autoComplete="off" />{cardBrand(f.cardNumber) && <em className="brand-tag">{cardBrand(f.cardNumber)}</em>}</div>{err("cardNumber")}</label>
                    <label className="form-field"><span>Name on card</span><div className={errors.cardName ? "input-wrap invalid" : "input-wrap"}><input value={f.cardName} onChange={e => set("cardName", e.target.value.toUpperCase())} placeholder="AS PRINTED ON THE CARD" autoComplete="off" /></div>{err("cardName")}</label>
                    <div className="pay-row">
                      <label className="form-field"><span>Expiry</span><div className={errors.expiry ? "input-wrap invalid" : "input-wrap"}><input inputMode="numeric" value={f.expiry} onChange={e => set("expiry", fmtExpiry(e.target.value))} placeholder="MM/YY" autoComplete="off" /></div>{err("expiry")}</label>
                      <label className="form-field"><span>CVV</span><div className={errors.cvv ? "input-wrap invalid" : "input-wrap"}><input type="password" inputMode="numeric" maxLength={4} value={f.cvv} onFocus={() => setFlip(true)} onBlur={() => setFlip(false)} onChange={e => set("cvv", e.target.value.replace(/\D/g, ""))} placeholder="•••" autoComplete="off" /></div>{err("cvv")}</label>
                    </div>
                  </div>
                )}

                {method === "Netbanking" && (
                  <div className="pay-pane" key="nb">
                    <span className="pane-label">Popular banks</span>
                    <div className="bank-grid">{POPULAR_BANKS.filter(b => banks.includes(b)).map(b => <button type="button" key={b} className={f.bank === b ? "active" : ""} onClick={() => set("bank", b)}><i><Landmark size={18} /></i>{SHORT[b]}</button>)}</div>
                    <label className="form-field"><span>Other banks</span><div className={errors.bank ? "input-wrap invalid" : "input-wrap"}><Landmark size={16} /><select value={otherBanks.includes(f.bank) ? f.bank : ""} onChange={e => set("bank", e.target.value)}><option value="">Select another bank…</option>{otherBanks.map(b => <option key={b}>{b}</option>)}</select></div>{err("bank")}<small className="pay-hint">You'll be redirected to your bank's secure page to authorise the payment.</small></label>
                  </div>
                )}

                {failure && (
                  <div className="pay-failure" role="alert">
                    <AlertCircle size={20} />
                    <div><b>Payment didn't go through</b><p>{failure}</p><p className="pay-fallback"><Clock size={13} /> Your reservation is still confirmed. Retry, try another method, or <b>pay before checkout</b> at the property.</p></div>
                  </div>
                )}

                <button className="confirm-button pay-submit" type="submit" disabled={busy}>
                  {busy ? <><span className="pay-spinner" /> Processing securely…</> : <><Lock size={16} /> Pay {money(booking.totalPrice)} <ArrowRight size={17} /></>}
                </button>
                <button type="button" className="pay-later" onClick={() => onClose(null)} disabled={busy}>I'll pay before checkout</button>
                <p className="form-footnote demo"><b>Demo mode</b> — no real payment is made. To test a failure use card ending 0002, a UPI ID containing “fail”, or “Demo Bank (always fails)”.</p>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function PaymentBadge({ booking }) {
  if (booking.status !== "Confirmed") return null;
  return booking.paymentStatus === "Paid"
    ? <span className="pay-badge paid" title={booking.paymentMethod}>Paid</span>
    : <span className="pay-badge due">Pay before checkout</span>;
}
