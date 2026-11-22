import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart, Sparkles, Star, BedDouble, Users, ArrowRight } from "lucide-react";
import { money } from "../money.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";

export default function RoomCard({ room, index, tripState }) {
  const { user, wishlist, toggleWishlist } = useAuth();
  const { notify } = useNotice();
  const hearted = wishlist.includes(room._id);

  async function onHeart(e) {
    e.preventDefault();
    if (!user) { notify("error", "Log in to save your favourite stays."); return; }
    try { await toggleWishlist(room._id); } catch { notify("error", "Could not update your wishlist."); }
  }

  return (
    <article className="room-card">
      <div className="room-image-wrap">
        <img src={room.image} alt={room.name} loading={index > 2 ? "lazy" : "eager"} />
        <span className="room-type">{room.type}</span>
        <button className={hearted ? "heart-button hearted" : "heart-button"} aria-label="Save stay" onClick={onHeart}><Heart size={18} /></button>
        {index === 0 && <span className="popular-tag"><Sparkles size={12} /> Guest favourite</span>}
      </div>
      <div className="room-body">
        <div className="room-location"><MapPin size={14} />{room.location}</div>
        <div className="room-title-line"><h3>{room.name}</h3><span className="rating"><Star size={14} fill="currentColor" />{room.rating}</span></div>
        <p className="room-description">{room.description}</p>
        <div className="room-amenities"><span><BedDouble size={15} />{room.beds}</span><span><Users size={15} />Up to {room.guests}</span></div>
        <div className="room-bottom">
          <div className="room-price"><b>{money(room.price)}</b><span>/ night</span><small>{room.reviews} guest reviews</small></div>
          <Link className="details-button" to={`/rooms/${room._id}`} state={tripState}>View stay <ArrowRight size={16} /></Link>
        </div>
      </div>
    </article>
  );
}
