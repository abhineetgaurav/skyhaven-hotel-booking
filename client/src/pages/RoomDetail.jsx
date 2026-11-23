import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { MapPin, Star, CheckCircle2, ArrowLeft, ArrowRight, Heart, BedDouble, Users, ShieldCheck, AlertCircle } from "lucide-react";
import { apiFetch } from "../api.js";
import { money, todayStr, plusDays } from "../money.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";
import BookingModal from "../components/BookingModal.jsx";
import PaymentModal from "../components/PaymentModal.jsx";

export default function RoomDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, wishlist, toggleWishlist } = useAuth();
  const { notify } = useNotice();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [payBooking, setPayBooking] = useState(null);

  const [checkIn, setCheckIn] = useState(location.state?.checkIn || plusDays(7));
  const [checkOut, setCheckOut] = useState(location.state?.checkOut || plusDays(9));
  const [guests, setGuests] = useState(location.state?.guests || 2);

  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  async function load() {
    setLoading(true); setNotFound(false);
    try {
      const [roomData, reviewData] = await Promise.all([apiFetch(`/rooms/${id}`), apiFetch(`/rooms/${id}/reviews`)]);
      setRoom(roomData); setReviews(reviewData); setActiveImage(0);
    } catch { setNotFound(true); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); window.scrollTo({ top: 0 }); }, [id]);
  useEffect(() => {
    if (!user) return;
    const mine = reviews.find(r => r.user === user.id);
    if (mine) setReviewForm({ rating: mine.rating, comment: mine.comment });
  }, [reviews, user]);

  async function onHeart() {
    if (!user) { notify("error", "Log in to save your favourite stays."); navigate("/login", { state: { from: location.pathname } }); return; }
    try { await toggleWishlist(room._id); notify("success", hearted ? "Removed from your favourites." : "Saved to your favourites ♥ — find it under Saved."); } catch { notify("error", "Could not update your wishlist."); }
  }

  async function submitReview(e) {
    e.preventDefault();
    setReviewError("");
    setReviewBusy(true);
    try {
      await apiFetch(`/rooms/${id}/reviews`, { method: "POST", body: JSON.stringify(reviewForm) });
      notify("success", "Thanks for sharing your stay!");
      await load();
    } catch (e) { setReviewError(e.message); }
    finally { setReviewBusy(false); }
  }

  if (loading) return <div className="loading-state"><span className="loader"></span><p>Loading this stay…</p></div>;
  if (notFound || !room) return (
    <div className="empty-state"><span>☁️</span><h3>We couldn't find that stay</h3><p>It may have been removed.</p><Link className="secondary-button" to="/">Back to all stays</Link></div>
  );

  const hearted = wishlist.includes(room._id);
  const gallery = room.images?.length ? room.images : [room.image];
  const myReview = user && reviews.find(r => r.user === user.id);

  return (
    <section className="room-detail">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to all stays</Link>
      <div className="gallery">
        <div className="gallery-main"><img src={gallery[activeImage]} alt={room.name} /></div>
        {gallery.length > 1 && (
          <div className="gallery-thumbs">
            {gallery.map((src, i) => (
              <button key={src} className={i === activeImage ? "gallery-thumb active" : "gallery-thumb"} onClick={() => setActiveImage(i)}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="detail-grid">
        <div className="detail-main">
          <div className="detail-head">
            <div>
              <div className="room-location"><MapPin size={14} />{room.location} · {room.type}</div>
              <div className="room-title-line"><h1>{room.name}</h1><span className="rating"><Star size={15} fill="currentColor" />{room.rating}</span></div>
              <span className="review-count">{room.reviews} guest review{room.reviews === 1 ? "" : "s"}</span>
            </div>
            <button className={hearted ? "heart-button large hearted" : "heart-button large"} onClick={onHeart} aria-label="Save stay"><Heart size={20} /></button>
          </div>
          <p className="detail-description">{room.description}</p>
          <div className="room-amenities"><span><BedDouble size={15} />{room.beds}</span><span><Users size={15} />Up to {room.guests} guests</span></div>
          <div className="amenity-list">{room.amenities.map(a => <span key={a}><CheckCircle2 size={15} />{a}</span>)}</div>

          <div className="reviews-block">
            <h2>Guest reviews</h2>
            {reviews.length === 0 && <p className="no-reviews">No reviews yet — be the first to share your stay.</p>}
            <div className="review-list">
              {reviews.map(r => (
                <div className="review-row" key={r._id}>
                  <div className="review-top"><b>{r.userName}</b><span className="rating"><Star size={13} fill="currentColor" />{r.rating}</span>{r.verifiedStay && <span className="verified-badge"><ShieldCheck size={12} /> Verified stay</span>}</div>
                  <p>{r.comment}</p>
                  <small>{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small>
                </div>
              ))}
            </div>
            {user ? (
              <form className="review-form" onSubmit={submitReview}>
                <h3>{myReview ? "Update your review" : "Leave a review"}</h3>
                <label className="form-field">
                  <span>Rating</span>
                  <div className="input-wrap"><select value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}</select></div>
                </label>
                <label className="form-field requests-field">
                  <span>Your review</span>
                  <textarea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} maxLength={600} rows="3" placeholder="How was your stay?" required />
                </label>
                {reviewError && <div className="inline-notice error"><AlertCircle size={17} />{reviewError}</div>}
                <button className="secondary-button" type="submit" disabled={reviewBusy}>{reviewBusy ? "Saving…" : myReview ? "Update review" : "Submit review"}</button>
              </form>
            ) : (
              <p className="no-reviews"><Link to="/login">Log in</Link> to leave a review.</p>
            )}
          </div>
        </div>

        <aside className="booking-aside">
          <div className="booking-aside-price"><b>{money(room.price)}</b><span>/ night</span></div>
          <label className="form-field"><span>Check-in</span><div className="input-wrap"><input type="date" min={todayStr()} value={checkIn} onChange={e => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(plusDays(2)); }} /></div></label>
          <label className="form-field"><span>Check-out</span><div className="input-wrap"><input type="date" min={checkIn || todayStr()} value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div></label>
          <label className="form-field"><span>Guests</span><div className="input-wrap"><select value={guests} onChange={e => setGuests(Number(e.target.value))}>{Array.from({ length: Math.min(12, room.guests) }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>)}</select></div></label>
          <button className="search-button full" onClick={() => setShowBooking(true)}>Book this stay <ArrowRight size={17} /></button>
          <p className="form-footnote"><ShieldCheck size={14} /> Free cancellation available. No payment collected in this demo.</p>
        </aside>
      </div>

      {showBooking && (
        <BookingModal
          room={room} checkIn={checkIn} checkOut={checkOut} setCheckIn={setCheckIn} setCheckOut={setCheckOut}
          guests={guests} setGuests={setGuests}
          onClose={() => setShowBooking(false)}
          onDone={b => { setShowBooking(false); setPayBooking(b); }}
        />
      )}
      {payBooking && (
        <PaymentModal
          booking={payBooking}
          onClose={paid => { const b = paid || payBooking; setPayBooking(null); navigate("/booking-confirmed", { state: { booking: b } }); }}
        />
      )}
    </section>
  );
}
