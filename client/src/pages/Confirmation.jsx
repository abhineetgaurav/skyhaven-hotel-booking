import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { CalendarDays, Users, MapPin, Mail, IdCard, Clock, Printer, CalendarPlus, ArrowRight, CreditCard, CheckCircle2, Copy, Check, PartyPopper } from "lucide-react";
import { apiFetch } from "../api.js";
import { money } from "../money.js";
import PaymentModal from "../components/PaymentModal.jsx";
import "../confirmation.css";

const KEY = "sh_last_booking";
const day = d => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const ymd = d => new Date(d).toISOString().slice(0, 10).replace(/-/g, "");
const ref = b => String(b._id).slice(-8).toUpperCase();

function downloadIcs(b) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SkyHaven//EN", "BEGIN:VEVENT", `UID:${b._id}@skyhaven`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${ymd(b.checkIn)}`, `DTEND;VALUE=DATE:${ymd(b.checkOut)}`, `SUMMARY:Stay at ${b.roomName}`, `LOCATION:${b.location}`, `DESCRIPTION:SkyHaven booking ${ref(b)}`, "END:VEVENT", "END:VCALENDAR"];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  a.download = `skyhaven-${ref(b)}.ics`; a.click(); URL.revokeObjectURL(a.href);
}

export default function Confirmation() {
  const location = useLocation();
  const [booking, setBooking] = useState(() => {
    if (location.state?.booking) return location.state.booking;
    try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; }
  });
  const [room, setRoom] = useState(null);
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (booking) sessionStorage.setItem(KEY, JSON.stringify(booking)); }, [booking]);
  useEffect(() => { if (booking) apiFetch(`/rooms/${booking.room}`).then(setRoom).catch(() => {}); }, [booking?.room]);

  if (!booking) return <Navigate to="/" replace />;
  const nights = Math.max(1, Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000));
  const paid = booking.paymentStatus === "Paid";
  const city = booking.location.split(",")[0];
  const copyRef = async () => { try { await navigator.clipboard.writeText(ref(booking)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard unavailable */ } };

  return (
    <section className="confirm-page">
      <div className="confirm-hero">
        <svg className="success-check big" viewBox="0 0 52 52" aria-hidden="true"><circle className="sc-circle" cx="26" cy="26" r="24" /><path className="sc-tick" d="M14 27l8 8 16-17" /></svg>
        <div>
          <span className="confirm-kicker"><PartyPopper size={15} /> BOOKING CONFIRMED</span>
          <h1>Pack your bags, {booking.fullName.split(" ")[0]}!</h1>
          <p>Your stay in <b>{city}</b> is booked. We've emailed the details and a guest guide to <b>{booking.email}</b>.</p>
        </div>
      </div>

      <div className="confirm-grid">
        <article className="confirm-ticket">
          <div className="ticket-image" style={room?.image ? { backgroundImage: `url(${room.image})` } : undefined}>
            <span className={paid ? "ticket-pay paid" : "ticket-pay due"}>{paid ? "Paid" : "Payment due before checkout"}</span>
          </div>
          <div className="ticket-body">
            <div className="ticket-title"><h2>{booking.roomName}</h2><span><MapPin size={14} /> {booking.location}</span></div>
            <div className="ticket-dates">
              <div><small>CHECK-IN</small><b>{day(booking.checkIn)}</b><em>from 2:00 PM</em></div>
              <div className="ticket-nights"><span>{nights}</span><small>night{nights > 1 ? "s" : ""}</small></div>
              <div><small>CHECK-OUT</small><b>{day(booking.checkOut)}</b><em>by 11:00 AM</em></div>
            </div>
            <div className="ticket-meta">
              <span><Users size={15} /> {booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
              <span><Mail size={15} /> {booking.email}</span>
            </div>
            <div className="ticket-rule" />
            <div className="ticket-foot">
              <div><small>BOOKING REFERENCE</small><button className="ref-chip" onClick={copyRef} title="Copy reference">{ref(booking)} {copied ? <Check size={15} /> : <Copy size={15} />}</button></div>
              <div className="ticket-total"><small>{paid ? "TOTAL PAID" : "TOTAL"}</small><strong>{money(booking.totalPrice)}</strong></div>
            </div>
            {paid && <p className="ticket-txn"><CheckCircle2 size={14} /> {booking.paymentMethod} · Txn {booking.transactionId}</p>}
          </div>
        </article>

        <aside className="confirm-side">
          {!paid && (
            <div className="confirm-pay">
              <CreditCard size={22} />
              <div><b>Skip the desk queue</b><p>Pay {money(booking.totalPrice)} now by UPI, card or net banking, or settle it before checkout.</p></div>
              <button className="confirm-button" onClick={() => setPaying(true)}>Pay now <ArrowRight size={16} /></button>
            </div>
          )}
          <div className="confirm-actions">
            <button onClick={() => downloadIcs(booking)}><CalendarPlus size={17} /> Add to calendar</button>
            <button onClick={() => window.print()}><Printer size={17} /> Print / save PDF</button>
          </div>
          <div className="confirm-next">
            <h3>What happens next</h3>
            <ol>
              <li><Mail size={16} /><div><b>Check your inbox</b><span>Confirmation and guest guide are on their way.</span></div></li>
              <li><IdCard size={16} /><div><b>Bring a photo ID</b><span>Required for every adult guest at check-in.</span></div></li>
              <li><Clock size={16} /><div><b>Arrive from 2:00 PM</b><span>Running late? Tell the property in advance.</span></div></li>
              <li><CalendarDays size={16} /><div><b>Change of plans?</b><span>Cancel anytime from My bookings.</span></div></li>
            </ol>
          </div>
        </aside>
      </div>

      <div className="confirm-links">
        <Link to="/account" className="details-button">View my bookings <ArrowRight size={15} /></Link>
        <Link to="/" className="secondary-button">Keep exploring</Link>
      </div>

      {paying && <PaymentModal booking={booking} onPaid={setBooking} onClose={paid2 => { if (paid2) setBooking(paid2); setPaying(false); }} />}
    </section>
  );
}
