import React, { useEffect, useState } from "react";
import { X, Smartphone, CreditCard, Landmark, Lock, CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { apiFetch } from "../api.js";
import { money } from "../money.js";
import "../payment.css";

const TABS = [
  { id: "UPI", label: "UPI", icon: Smartphone },
  { id: "Card", label: "Card", icon: CreditCard },
  { id: "Netbanking", label: "Net banking", icon: Landmark }
];
const fmtCard = v => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
const fmtExpiry = v => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

export default function PaymentModal({ booking, onClose, onPaid }) {
  const [method, setMethod] = useState("UPI");
  const [f, setF] = useState({ upiId: "", cardNumber: "", cardName: "", expiry: "", cvv: "", bank: "" });
  const [banks, setBanks] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);
  const [paid, setPaid] = useState(null);

  useEffect(() => { apiFetch("/payments/banks").then(setBanks).catch(() => {}); }, []);
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };

  async function pay(e) {
    e.preventDefault();
    setFailure(null); setErrors({}); setBusy(true);
    try {
      const body = { email: booking.email, method, ...(method === "UPI" ? { upiId: f.upiId } : method === "Card" ? { cardNumber: f.cardNumber, cardName: f.cardName, expiry: f.expiry, cvv: f.cvv } : { bank: f.bank }) };
      const d = await apiFetch(`/bookings/${booking._id}/pay`, { method: "POST", body: JSON.stringify(body) });
      setPaid(d.booking); onPaid?.(d.booking);
    } catch (err) {
      if (err.errors) { const es = {}; err.errors.forEach(x => es[x.field] = x.message); setErrors(es); }
      else if (err.status === 402) setFailure(err.message);
      else setFailure(err.message);
    } finally { setBusy(false); setF(p => ({ ...p, cvv: "" })); }
  }

  const err = k => errors[k] && <small className="field-error">{errors[k]}</small>;

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(paid); }}>
      <section className="modal pay-modal">
        <button className="modal-close" onClick={() => onClose(paid)} aria-label="Close"><X /></button>
        {paid ? (
          <div className="pay-success">
            <span className="pay-success-icon"><CheckCircle2 size={42} /></span>
            <h2>Payment received</h2>
            <p>{money(paid.totalPrice)} paid for <b>{paid.roomName}</b>.</p>
            <div className="pay-receipt"><span>Method</span><b>{paid.paymentMethod}</b><span>Transaction ID</span><b className="mono">{paid.transactionId}</b></div>
            <p className="pay-note">A receipt has been emailed to {paid.email}. Nothing more to pay at check-out.</p>
            <button className="confirm-button" onClick={() => onClose(paid)}>Done</button>
          </div>
        ) : (
          <>
            <div className="modal-kicker"><Lock size={15} /> SECURE PAYMENT</div>
            <h2>Pay for your stay<span className="brand-dot">.</span></h2>
            <div className="pay-summary"><div><b>{booking.roomName}</b><small>{booking.location}</small></div><strong>{money(booking.totalPrice)}</strong></div>
            <div className="pay-tabs" role="tablist">
              {TABS.map(t => <button key={t.id} type="button" role="tab" aria-selected={method === t.id} className={method === t.id ? "active" : ""} onClick={() => { setMethod(t.id); setErrors({}); setFailure(null); }}><t.icon size={17} />{t.label}</button>)}
            </div>
            <form onSubmit={pay} noValidate>
              {method === "UPI" && (
                <label className="form-field"><span>UPI ID</span><div className={errors.upiId ? "input-wrap invalid" : "input-wrap"}><Smartphone size={16} /><input value={f.upiId} onChange={e => set("upiId", e.target.value)} placeholder="name@okhdfcbank" autoComplete="off" /></div>{err("upiId")}<small className="pay-hint">You'll get a collect request in your UPI app (GPay, PhonePe, Paytm…).</small></label>
              )}
              {method === "Card" && (
                <>
                  <label className="form-field"><span>Card number</span><div className={errors.cardNumber ? "input-wrap invalid" : "input-wrap"}><CreditCard size={16} /><input inputMode="numeric" value={f.cardNumber} onChange={e => set("cardNumber", fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" autoComplete="off" /></div>{err("cardNumber")}</label>
                  <label className="form-field"><span>Name on card</span><div className={errors.cardName ? "input-wrap invalid" : "input-wrap"}><input value={f.cardName} onChange={e => set("cardName", e.target.value)} placeholder="As printed on the card" autoComplete="off" /></div>{err("cardName")}</label>
                  <div className="pay-row">
                    <label className="form-field"><span>Expiry</span><div className={errors.expiry ? "input-wrap invalid" : "input-wrap"}><input inputMode="numeric" value={f.expiry} onChange={e => set("expiry", fmtExpiry(e.target.value))} placeholder="MM/YY" autoComplete="off" /></div>{err("expiry")}</label>
                    <label className="form-field"><span>CVV</span><div className={errors.cvv ? "input-wrap invalid" : "input-wrap"}><input type="password" inputMode="numeric" maxLength={4} value={f.cvv} onChange={e => set("cvv", e.target.value.replace(/\D/g, ""))} placeholder="•••" autoComplete="off" /></div>{err("cvv")}</label>
                  </div>
                </>
              )}
              {method === "Netbanking" && (
                <label className="form-field"><span>Choose your bank</span><div className={errors.bank ? "input-wrap invalid" : "input-wrap"}><Landmark size={16} /><select value={f.bank} onChange={e => set("bank", e.target.value)}><option value="">Select bank…</option>{banks.map(b => <option key={b}>{b}</option>)}</select></div>{err("bank")}<small className="pay-hint">You'll be redirected to your bank to authorise the payment.</small></label>
              )}
              {failure && (
                <div className="pay-failure">
                  <AlertCircle size={19} />
                  <div><b>Payment failed</b><p>{failure}</p><p className="pay-fallback"><Clock size={13} /> Your reservation is still confirmed. Try again or another method, or simply <b>pay before checkout</b> at the property.</p></div>
                </div>
              )}
              <button className="confirm-button" type="submit" disabled={busy}>{busy ? "Processing payment…" : <>Pay {money(booking.totalPrice)} <ArrowRight size={17} /></>}</button>
              <button type="button" className="pay-later" onClick={() => onClose(null)}>Pay later — before checkout</button>
              <p className="form-footnote"><Lock size={13} /> Demo mode: no real payment is made. Test failures: card ending 0002, UPI ID containing “fail”, or “Demo Bank (always fails)”.</p>
            </form>
          </>
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
