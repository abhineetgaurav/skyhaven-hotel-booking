import React, { useEffect, useState } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { BedDouble, Heart, MapPin, Star, ArrowRight, ShieldCheck } from "lucide-react";
import { apiFetch } from "../api.js";
import PaymentModal, { PaymentBadge } from "../components/PaymentModal.jsx";
import { money } from "../money.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";

export default function Account() {
  const { user, ready, wishlist, toggleWishlist } = useAuth();
  const { notify } = useNotice();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [payBooking, setPayBooking] = useState(null);
  const [wishlistRooms, setWishlistRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [b, w] = await Promise.all([apiFetch("/bookings/mine"), apiFetch("/wishlist")]);
      setBookings(b); setWishlistRooms(w);
    } catch { /* already surfaced via auth */ }
    finally { setLoading(false); }
  }
  useEffect(() => { if (user) load(); }, [user]);

  if (!ready) return <div className="loading-state"><span className="loader"></span></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  async function cancelBooking(id) {
    if (!window.confirm("Cancel this reservation?")) return;
    try {
      const data = await apiFetch(`/bookings/${id}/cancel`, { method: "PATCH", body: JSON.stringify({ email: user.email }) });
      setBookings(prev => prev.map(b => (b._id === id ? data.booking : b)));
      notify("success", "Reservation cancelled.");
    } catch (e) { notify("error", e.message); }
  }

  async function removeFromWishlist(roomId) {
    try { await toggleWishlist(roomId); setWishlistRooms(prev => prev.filter(r => r._id !== roomId)); }
    catch { notify("error", "Could not update your wishlist."); }
  }

  return (
    <section className="account-page">
      <div className="account-head">
        <span className="user-avatar large">{user.name.charAt(0).toUpperCase()}</span>
        <div><h1>{user.name}</h1><p>{user.email}</p></div>
      </div>

      <h2 className="account-section-title"><BedDouble size={18} /> My bookings</h2>
      {loading ? <div className="loading-state"><span className="loader"></span></div> : bookings.length === 0 ? (
        <p className="no-reviews">No bookings yet. <Link to="/">Explore stays</Link> to plan your next trip.</p>
      ) : (
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
                <PaymentBadge booking={b} />
                {b.status === "Confirmed" && b.paymentStatus !== "Paid" && <button className="pay-now-link" onClick={() => setPayBooking(b)}>Pay now</button>}
                {b.status === "Confirmed" && <button className="cancel-link" onClick={() => cancelBooking(b._id)}>Cancel</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="account-section-title"><Heart size={18} /> My wishlist</h2>
      {wishlistRooms.length === 0 ? (
        <p className="no-reviews">No saved stays yet. Tap the heart on any stay to save it here.</p>
      ) : (
        <div className="wishlist-grid">
          {wishlistRooms.map(room => (
            <div className="wishlist-card" key={room._id}>
              <img src={room.image} alt={room.name} />
              <div className="wishlist-card-body">
                <div className="room-location"><MapPin size={13} />{room.location}</div>
                <b>{room.name}</b>
                <span className="rating"><Star size={13} fill="currentColor" />{room.rating}</span>
                <div className="wishlist-card-actions">
                  <Link className="details-button" to={`/rooms/${room._id}`}>View <ArrowRight size={14} /></Link>
                  <button className="cancel-link" onClick={() => removeFromWishlist(room._id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {payBooking && <PaymentModal booking={payBooking} onPaid={nb => setBookings(prev => prev.map(x => x._id === nb._id ? nb : x))} onClose={() => setPayBooking(null)} />}
      <div className="secure-note"><ShieldCheck size={16} /> Your bookings are matched to your account email automatically.</div>
    </section>
  );
}
