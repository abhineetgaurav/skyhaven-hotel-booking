import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, MapPin, CalendarDays, Users, SlidersHorizontal, ShieldCheck, Heart, CheckCircle2, ArrowRight, AlertCircle, Sparkles, Clock, CreditCard, Star, Waves, ArrowUpDown, Map, LayoutGrid } from "lucide-react";
import MapView from "../components/MapView.jsx";
import RoomCard from "../components/RoomCard.jsx";
import { apiFetch } from "../api.js";
import { todayStr, plusDays } from "../money.js";
import { useNotice } from "../context/NoticeContext.jsx";

export default function Home() {
  const location = useLocation();
  const { notify } = useNotice();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [search, setSearch] = useState(""), [submittedSearch, setSubmittedSearch] = useState("");
  const [type, setType] = useState("All stays"), [maxPrice, setMaxPrice] = useState(20000), [rating, setRating] = useState("Any rating");
  const [sort, setSort] = useState("recommended"), [amenities, setAmenities] = useState([]), [amenityOptions, setAmenityOptions] = useState([]), [applied, setApplied] = useState(null), [showMore, setShowMore] = useState(false), [view, setView] = useState("list");
  const [checkIn, setCheckIn] = useState(plusDays(7)), [checkOut, setCheckOut] = useState(plusDays(9)), [guests, setGuests] = useState(2);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (submittedSearch) q.set("search", submittedSearch);
      if (type !== "All stays") q.set("type", type);
      q.set("maxPrice", String(maxPrice));
      if (rating !== "Any rating") q.set("minRating", rating);
      q.set("sort", sort);
      if (amenities.length) q.set("amenities", amenities.join(","));
      if (applied) { q.set("checkIn", applied.checkIn); q.set("checkOut", applied.checkOut); q.set("guests", String(applied.guests)); }
      setRooms(await apiFetch(`/rooms?${q}`));
      setApiError("");
    } catch (e) {
      setApiError("Can't connect to the booking server. Start MongoDB and run `npm run dev` in the project folder.");
      setRooms([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { loadRooms(); }, [submittedSearch, type, maxPrice, rating, sort, amenities, applied]);
  useEffect(() => { apiFetch("/rooms/meta").then(m => setAmenityOptions(m.amenities)).catch(() => {}); }, []);
  const toggleAmenity = a => setAmenities(list => list.includes(a) ? list.filter(x => x !== a) : [...list, a]);
  const activeFilters = amenities.length + (type !== "All stays") + (rating !== "Any rating") + (maxPrice < 20000 ? 1 : 0) + (applied ? 1 : 0);
  const resetAll = () => { setSearch(""); setSubmittedSearch(""); setType("All stays"); setMaxPrice(20000); setRating("Any rating"); setAmenities([]); setApplied(null); setSort("recommended"); };

  useEffect(() => {
    const id = location.state?.scrollTo;
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [location.state]);

  const tripState = { checkIn, checkOut, guests };

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> A LITTLE CLOSER TO WONDERFUL</div>
          <h1>Find your<br /><span>somewhere.</span></h1>
          <p>Beautiful places, thoughtful stays, and a little more room to breathe. Your next favourite memory starts here.</p>
          <div className="hero-trust"><span><ShieldCheck size={17} /> Handpicked stays</span><span><CheckCircle2 size={17} /> Secure reservations</span></div>
          <div className="hero-small-note"><span className="avatar-stack"><i>R</i><i>A</i><i>M</i></span><span>Loved by <b>5,000+</b> happy travellers</span></div>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=90" alt="Luxury tropical resort with swimming pool" />
          <div className="image-wash"></div>
          <div className="floating-card"><span className="float-icon"><Star size={18} fill="currentColor" /></span><div><b>Little moments. Big memories.</b><small>Find a stay that feels like you.</small></div></div>
          <div className="image-caption"><span>01 / YOUR NEXT ESCAPE</span><b>Make room for wonder.</b></div>
        </div>
        <form className="search-panel" onSubmit={e => { e.preventDefault(); setSubmittedSearch(search.trim()); setApplied({ checkIn, checkOut, guests }); document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" }); }}>
          <label className="search-field destination"><span className="field-icon"><MapPin size={19} /></span><span className="field-content"><small>WHERE TO?</small><input value={search} onChange={e => setSearch(e.target.value)} placeholder="City, hotel, or hideaway" /></span></label>
          <label className="search-field"><span className="field-icon"><CalendarDays size={19} /></span><span className="field-content"><small>CHECK IN</small><input type="date" min={todayStr()} value={checkIn} onChange={e => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(plusDays(2)); }} required /></span></label>
          <label className="search-field"><span className="field-icon"><CalendarDays size={19} /></span><span className="field-content"><small>CHECK OUT</small><input type="date" min={checkIn || todayStr()} value={checkOut} onChange={e => setCheckOut(e.target.value)} required /></span></label>
          <label className="search-field guests-field"><span className="field-icon"><Users size={19} /></span><span className="field-content"><small>GUESTS</small><select value={guests} onChange={e => setGuests(Number(e.target.value))}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>)}</select></span></label>
          <button className="search-button" type="submit"><Search size={19} /><span>Find stays</span></button>
        </form>
      </section>
      <section className="benefits" id="why">
        <div className="benefit"><span className="benefit-icon blue"><ShieldCheck /></span><div><b>Stays you can trust</b><small>Thoughtfully selected, every time.</small></div></div>
        <div className="benefit"><span className="benefit-icon mint"><Heart /></span><div><b>Made for your kind of trip</b><small>From weekend resets to long escapes.</small></div></div>
        <div className="benefit"><span className="benefit-icon peach"><CreditCard /></span><div><b>Clear, honest pricing</b><small>No surprises when you check out.</small></div></div>
        <div className="benefit"><span className="benefit-icon lavender"><Clock /></span><div><b>Easy from start to stay</b><small>Simple booking, less planning stress.</small></div></div>
      </section>
      <section className="stays-section" id="stays">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-line"></span> YOUR NEXT CHAPTER</div><h2>Stays worth <span>staying for.</span></h2><p>Places with personality, picked for the way you want to feel.</p></div>
          <div className="results-label"><span className="results-dot"></span>{rooms.length} lovely places to explore</div>
        </div>
        <div className="filters">
          <div className="filter-label"><SlidersHorizontal size={17} /> FIND YOUR FIT</div>
          <div className="type-filters">{["All stays", "Hotel", "Resort", "Apartment", "Boutique"].map(t => <button key={t} className={type === t ? "type-chip active" : "type-chip"} onClick={() => setType(t)}>{t}</button>)}</div>
          <label className="price-filter"><span>Max / night</span><select value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}><option value="3000">₹3,000</option><option value="5000">₹5,000</option><option value="7000">₹7,000</option><option value="10000">₹10,000</option><option value="20000">Any price</option></select></label>
          <label className="price-filter rating-filter"><span>Rating</span><select value={rating} onChange={e => setRating(e.target.value)}><option>Any rating</option><option value="4.5">4.5+ stars</option><option value="4.8">4.8+ stars</option></select></label>
        </div>
        <div className="filters-more">
          <button type="button" className={showMore ? "more-toggle open" : "more-toggle"} onClick={() => setShowMore(v => !v)}><SlidersHorizontal size={15} /> Amenities{amenities.length ? ` (${amenities.length})` : ""}</button>
          {applied && <span className="applied-pill"><CalendarDays size={14} /> Available {applied.checkIn} → {applied.checkOut} · {applied.guests} guest{applied.guests > 1 ? "s" : ""}<button type="button" aria-label="Clear dates" onClick={() => setApplied(null)}>×</button></span>}
          {activeFilters > 0 && <button type="button" className="clear-link" onClick={resetAll}>Clear all ({activeFilters})</button>}
          <div className="view-toggle"><button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}><LayoutGrid size={14} /> List</button><button type="button" className={view === "map" ? "active" : ""} onClick={() => setView("map")}><Map size={14} /> Map</button></div>
          <label className="sort-select"><ArrowUpDown size={15} /><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort stays"><option value="recommended">Recommended</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Top rated</option><option value="popular">Most reviewed</option></select></label>
        </div>
        {showMore && <div className="amenity-chips">{amenityOptions.map(a => <button type="button" key={a} className={amenities.includes(a) ? "amenity-chip active" : "amenity-chip"} onClick={() => toggleAmenity(a)}>{amenities.includes(a) && <CheckCircle2 size={14} />}{a}</button>)}</div>}
        {apiError && <div className="server-warning"><AlertCircle size={19} /><div><b>Booking service unavailable</b><p>{apiError}</p></div></div>}
        {loading ? (
          <div className="loading-state"><span className="loader"></span><p>Finding your kind of wonderful…</p></div>
        ) : rooms.length === 0 ? (
          <div className="empty-state"><span>☁️</span><h3>No stays found just yet</h3><p>Try another destination or loosen your filters a little.</p><button className="secondary-button" onClick={resetAll}>Clear filters</button></div>
        ) : view === "map" ? (
          <MapView rooms={rooms} tripState={tripState} />
        ) : (
          <div className="room-grid">{rooms.map((room, i) => <RoomCard key={room._id} room={room} index={i} tripState={tripState} />)}</div>
        )}
      </section>
      <section className="quote-banner">
        <div className="quote-art"><div className="sun"></div><div className="hill hill-one"></div><div className="hill hill-two"></div><div className="hill hill-three"></div></div>
        <div className="quote-content"><span className="eyebrow">A GENTLER WAY TO GET AWAY</span><h2>Less planning.<br /><em>More feeling there.</em></h2><p>Whether it's sea air, mountain mornings, or a new city to get lost in — we'll help you find the place.</p><a href="#stays" className="quote-link">Find your stay <ArrowRight size={17} /></a></div>
        <div className="quote-stamp"><Waves size={28} /><span>GO WHERE<br />YOU FEEL GOOD</span></div>
      </section>
      <section className="newsletter">
        <div><span className="eyebrow">A LITTLE NOTE FROM US</span><h2>Good places. Good stories.</h2><p>Keep a little inspiration for your next escape.</p></div>
        <form onSubmit={e => { e.preventDefault(); notify("success", "You're on the list! (Demo signup — no email was sent.)"); e.currentTarget.reset(); }}>
          <input type="email" placeholder="Your email address" aria-label="Your email address" required />
          <button type="submit">Count me in <ArrowRight size={16} /></button>
        </form>
      </section>
    </>
  );
}
