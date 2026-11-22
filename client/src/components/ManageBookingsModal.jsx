import React, { useState } from "react";
import { X, ClipboardList, Mail, BedDouble, ShieldCheck } from "lucide-react";
import { apiFetch } from "../api.js";
import { money } from "../money.js";
import { InlineNotice } from "./Notice.jsx";

export default function ManageBookingsModal({ onClose }) {
  const [myEmail, setMyEmail] = useState("");
  const [bookings, setBookings] = useState([]);
  const [notice, setNotice] = useState(null);

  async function searchBookings(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(myEmail)) { setNotice({ kind: "error", text: "Enter a valid email address." }); return; }
    try {
      const data = await apiFetch(`/bookings?email=${encodeURIComponent(myEmail)}`);
      setBookings(data);
      setNotice({ kind: "success", text: `Found ${data.length} reservation${data.length === 1 ? "" : "s"}.` });
    } catch (e) { setNotice({ kind: "error", text: e.message }); }
  }

  async function cancelBooking(id) {
    if (!window.confirm("Cancel this reservation?")) return;
    try {
      const data = await apiFetch(`/bookings/${id}/cancel`, { method: "PATCH", body: JSON.stringify({ email: myEmail }) });
      setBookings(prev => prev.map(b => (b._id === id ? data.booking : b)));
      setNotice({ kind: "success", text: "Reservation cancelled." });
    } catch (e) { setNotice({ kind: "error", text: e.message }); }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal manage-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close"><X /></button>
        <div className="modal-kicker"><ClipboardList size={17} /> YOUR TRAVEL PLANS</div>
        <h2>My reservations<span className="brand-dot">.</span></h2>
        <p className="modal-subtitle">Enter the email you used when booking to find your stays.</p>
        <form className="manage-search" onSubmit={searchBookings}>
          <label><Mail size={17} /><input type="email" value={myEmail} onChange={e => setMyEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <button className="search-button">Find bookings</button>
        </form>
        {notice && <InlineNotice notice={notice} />}
        <div className="booking-list">
          {bookings.map(b => (
            <div className="booking-row" key={b._id}>
              <div className="booking-icon"><BedDouble /></div>
              <div className="booking-info">
                <b>{b.roomName}</b><span>{b.location}</span>
                <small>{new Date(b.checkIn).toLocaleDateString("en-IN")} — {new Date(b.checkOut).toLocaleDateString("en-IN")} · {b.guests} guest(s)</small>
                <strong>{money(b.totalPrice)}</strong>
              </div>
              <div className="booking-actions">
                <span className={b.status === "Confirmed" ? "status-confirmed" : "status-cancelled"}>{b.status}</span>
                {b.status === "Confirmed" && <button className="cancel-link" onClick={() => cancelBooking(b._id)}>Cancel</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="secure-note"><ShieldCheck size={16} /> Your reservation details are looked up using your email address.</div>
      </section>
    </div>
  );
}
