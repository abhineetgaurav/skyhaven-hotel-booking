import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Heart, Compass } from "lucide-react";
import RoomCard from "../components/RoomCard.jsx";
import { apiFetch } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import "../saved.css";

export default function Saved() {
  const { user, ready, wishlist } = useAuth();
  const location = useLocation();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch("/wishlist").then(setRooms).catch(() => setRooms([])).finally(() => setLoading(false));
  }, [user]);

  if (!ready) return <div className="loading-state"><span className="loader"></span></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  // The heart on each card updates the shared wishlist, so un-saving removes the card immediately.
  const visible = rooms.filter(r => wishlist.includes(r._id));

  return (
    <section className="saved-page">
      <div className="saved-head">
        <span className="saved-icon"><Heart size={26} fill="currentColor" /></span>
        <div>
          <h1>Your favourites<span className="brand-dot">.</span></h1>
          <p>{loading ? "Loading your saved stays…" : visible.length ? `${visible.length} stay${visible.length > 1 ? "s" : ""} saved for later` : "Stays you save will wait for you here."}</p>
        </div>
      </div>
      {loading ? <div className="loading-state"><span className="loader"></span></div> : visible.length === 0 ? (
        <div className="saved-empty">
          <span><Heart size={40} /></span>
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on any stay to keep it here, so you can compare and book when you're ready.</p>
          <Link className="details-button" to="/"><Compass size={16} /> Explore stays</Link>
        </div>
      ) : (
        <div className="room-grid">{visible.map((room, i) => <RoomCard key={room._id} room={room} index={i} tripState={{}} />)}</div>
      )}
    </section>
  );
}
