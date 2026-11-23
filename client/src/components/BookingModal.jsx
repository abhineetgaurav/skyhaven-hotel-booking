import React, { useState } from "react";
import { X, CalendarDays, Users, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { apiFetch } from "../api.js";
import { money, todayStr } from "../money.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function BookingModal({ room, checkIn, checkOut, setCheckIn, setCheckOut, guests, setGuests, onClose, onDone }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: user?.name || "", email: user?.email || "", phone: "", requests: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
  const total = nights * room.price;

  function validate() {
    const e = {};
    if (form.fullName.trim().length < 2) e.fullName = "Please enter your full name (at least 2 characters).";
    else if (form.fullName.trim().length > 70) e.fullName = "Name must be under 70 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = "Enter a valid email address.";
    if (!/^[+]?[\d\s()-]{8,18}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number (8–18 characters).";
    if (!checkIn || checkIn < todayStr()) e.checkIn = "Check-in must be today or later.";
    if (!checkOut || checkOut <= checkIn) e.checkOut = "Check-out must be after check-in.";
    if (nights > 60) e.checkOut = "Maximum stay is 60 nights.";
    if (guests < 1 || guests > Math.min(12, room.guests)) e.guests = `Choose 1–${Math.min(12, room.guests)} guests for this stay.`;
    if (form.requests.length > 500) e.requests = "Please keep requests under 500 characters.";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;
    setBusy(true);
    try {
      const data = await apiFetch("/bookings", { method: "POST", body: JSON.stringify({ roomId: room._id, checkIn, checkOut, guests, ...form }) });
      onDone(data.booking);
    } catch (e) {
      if (e.errors) { const es = {}; e.errors.forEach(x => es[x.field] = x.message); setErrors(es); }
      setMessage(e.message.includes("fetch") ? "Booking service is unavailable. Check that the server and MongoDB are running." : e.message);
    } finally { setBusy(false); }
  }

  const field = (key, label, placeholder, type = "text", icon = null) => (
    <label className="form-field">
      <span>{label}</span>
      <div className={errors[key] ? "input-wrap invalid" : "input-wrap"}>
        {icon}
        <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} maxLength={key === "requests" ? 500 : undefined} />
      </div>
      {errors[key] && <small className="field-error">{errors[key]}</small>}
    </label>
  );

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal booking-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
        <div className="booking-head">
          <img src={room.image} alt={room.name} />
          <div><span className="modal-kicker">YOUR NEXT ESCAPE</span><h2>Make it yours<span className="brand-dot">.</span></h2><p>{room.name} · {room.location}</p></div>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="form-section-title">01 <span>Your stay</span></div>
          <div className="date-guest-grid">
            <label className="form-field"><span>Check-in</span><div className={errors.checkIn ? "input-wrap invalid" : "input-wrap"}><CalendarDays size={17} /><input type="date" min={todayStr()} value={checkIn} onChange={e => setCheckIn(e.target.value)} /></div>{errors.checkIn && <small className="field-error">{errors.checkIn}</small>}</label>
            <label className="form-field"><span>Check-out</span><div className={errors.checkOut ? "input-wrap invalid" : "input-wrap"}><CalendarDays size={17} /><input type="date" min={checkIn || todayStr()} value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div>{errors.checkOut && <small className="field-error">{errors.checkOut}</small>}</label>
            <label className="form-field"><span>Guests (max {room.guests})</span><div className={errors.guests ? "input-wrap invalid" : "input-wrap"}><Users size={17} /><select value={guests} onChange={e => setGuests(Number(e.target.value))}>{Array.from({ length: Math.min(12, room.guests) }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>)}</select></div>{errors.guests && <small className="field-error">{errors.guests}</small>}</label>
          </div>
          <div className="form-section-title">02 <span>Your details</span></div>
          <div className="form-grid">{field("fullName", "Full name", "As it appears on your ID", "text")} {field("email", "Email address", "you@example.com", "email")} {field("phone", "Phone number", "+91 98765 43210", "tel")}</div>
          <label className="form-field requests-field">
            <span>Special requests <small>(optional)</small></span>
            <textarea value={form.requests} onChange={e => setForm({ ...form, requests: e.target.value })} maxLength={500} placeholder="Late arrival, accessibility needs, or a little birthday surprise…" rows="3" />
            <small className="character-count">{form.requests.length}/500</small>
            {errors.requests && <small className="field-error">{errors.requests}</small>}
          </label>
          {message && <div className="inline-notice error"><AlertCircle size={17} />{message}</div>}
          <div className="price-summary">
            <div><span>{money(room.price)} × {nights} night{nights !== 1 ? "s" : ""}</span><b>{money(total)}</b></div>
            <div><span>Taxes & fees</span><span className="included">Included in demo price</span></div>
            <div className="total-line"><b>Total for your stay</b><strong>{money(total)}</strong></div>
          </div>
          <button className="confirm-button" type="submit" disabled={busy}>{busy ? "Confirming your stay…" : <>Confirm reservation <ArrowRight size={17} /></>}</button>
          <p className="form-footnote"><ShieldCheck size={14} /> Your details are used to manage this reservation. After confirming you can pay online by UPI, card or net banking, or pay before checkout.</p>
        </form>
      </section>
    </div>
  );
}
