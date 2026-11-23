import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, Menu, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Header({ onOpenManage }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { user, logout, wishlist } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); setMobileMenu(false); navigate("/"); }
  function goToSection(id) { navigate("/", { state: { scrollTo: id } }); setMobileMenu(false); }

  return (
    <header className="topbar">
      <Link className="brand" to="/"><span className="brand-mark"><Waves size={23} /></span><span>skyhaven<span className="brand-dot">.</span><small>STAYS THAT STAY WITH YOU</small></span></Link>
      <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)}><Menu /></button>
      <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
        <button className="nav-text-link" onClick={() => goToSection("stays")}>Explore stays</button>
        <button className="nav-text-link" onClick={() => goToSection("why")}>Why SkyHaven</button>
        <button className="nav-manage" onClick={() => { onOpenManage(); setMobileMenu(false); }}>My reservations <ArrowRight size={15} /></button>
        {user ? (
          <div className="user-menu">
            {user.role === "admin" && <Link to="/admin" className="login-link" onClick={() => setMobileMenu(false)}>Admin</Link>}
            <Link to="/account" className="user-chip" onClick={() => setMobileMenu(false)}><span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>{user.name.split(" ")[0]}</Link>
            <button className="logout-link" onClick={handleLogout}>Log out</button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/admin" className="admin-link" onClick={() => setMobileMenu(false)}><ShieldCheck size={14} /> Admin</Link>
            <Link to="/login" className="login-link" onClick={() => setMobileMenu(false)}>Log in</Link>
            <Link to="/signup" className="signup-button" onClick={() => setMobileMenu(false)}>Sign up</Link>
          </div>
        )}
      </nav>
      <div className="top-pill"><span className="online-dot"></span> Your next escape awaits</div>
      <button className="saved-icon-btn" onClick={() => navigate("/saved")} aria-label={`Saved stays${wishlist.length ? ` (${wishlist.length})` : ""}`} title="Saved stays"><Heart size={20} fill={wishlist.length ? "currentColor" : "none"} />{wishlist.length > 0 && <span className="count">{wishlist.length}</span>}</button>
    </header>
  );
}
