import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../map.css";
import { Link } from "react-router-dom";
import { MapPin, Star, ArrowRight, BedDouble, Users, MousePointerClick } from "lucide-react";
import { money } from "../money.js";

const priceIcon = (room, active) => L.divIcon({
  className: "price-pin-wrap",
  html: `<span class="price-pin${active ? " active" : ""}">${money(room.price)}</span>`,
  iconSize: [0, 0]
});

export default function MapView({ rooms, tripState }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), markers = useRef({});
  const [selectedId, setSelectedId] = useState(null);
  const mapped = rooms.filter(r => typeof r.lat === "number" && typeof r.lng === "number");
  const selected = mapped.find(r => r._id === selectedId) || null;

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: true, zoomControl: false }).setView([22.5, 79], 5);
    L.control.zoom({ position: "bottomright" }).addTo(map.current);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    layer.current.clearLayers(); markers.current = {};
    mapped.forEach(room => {
      const m = L.marker([room.lat, room.lng], { icon: priceIcon(room, room._id === selectedId), riseOnHover: true }).addTo(layer.current);
      m.on("click", () => setSelectedId(room._id));
      markers.current[room._id] = m;
    });
    if (mapped.length) map.current.fitBounds(L.latLngBounds(mapped.map(r => [r.lat, r.lng])), { padding: [50, 50], maxZoom: 9 });
    if (selectedId && !mapped.some(r => r._id === selectedId)) setSelectedId(null);
  }, [rooms]);

  useEffect(() => {
    mapped.forEach(r => markers.current[r._id]?.setIcon(priceIcon(r, r._id === selectedId)));
    if (selected) {
      markers.current[selected._id]?.setZIndexOffset(1000);
      map.current.flyTo([selected.lat, selected.lng], Math.max(map.current.getZoom(), 8), { duration: 0.7 });
    }
  }, [selectedId]);

  return (
    <div className="map-layout">
      <div className="map-list" aria-label="Stays on map">
        {mapped.map(r => (
          <button key={r._id} className={r._id === selectedId ? "map-item active" : "map-item"} onClick={() => setSelectedId(r._id)}>
            <img src={r.image} alt="" loading="lazy" />
            <span><b>{r.name}</b><small>{r.location}</small><em>{money(r.price)} <i>/ night</i></em></span>
            <span className="map-item-rating"><Star size={12} fill="currentColor" />{r.rating}</span>
          </button>
        ))}
        {!mapped.length && <p className="map-empty">No stays with a map location match your filters.</p>}
      </div>
      <div className="map-canvas">
        <div ref={el} className="map-el" />
        <div className="map-count"><MapPin size={14} /> {mapped.length} stays</div>
        {!selected && mapped.length > 0 && <div className="map-hint"><MousePointerClick size={15} /> Tap a price to preview a stay</div>}
        {selected && (
          <div className="map-card">
            <img src={selected.image} alt={selected.name} />
            <div className="map-card-body">
              <div className="room-location"><MapPin size={13} />{selected.location}</div>
              <h4>{selected.name} <span className="rating"><Star size={13} fill="currentColor" />{selected.rating}</span></h4>
              <div className="map-card-meta"><span><BedDouble size={14} />{selected.beds}</span><span><Users size={14} />Up to {selected.guests}</span></div>
              <div className="map-card-foot">
                <div><b>{money(selected.price)}</b><small> / night</small></div>
                <Link className="details-button" to={`/rooms/${selected._id}`} state={tripState}>Select stay <ArrowRight size={15} /></Link>
              </div>
            </div>
            <button className="map-card-close" aria-label="Close" onClick={() => setSelectedId(null)}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}
