import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Waves } from "lucide-react";
import Header from "./Header.jsx";
import ManageBookingsModal from "./ManageBookingsModal.jsx";
import { Toast } from "./Notice.jsx";

export default function Layout() {
  const [showManage, setShowManage] = useState(false);
  return (
    <div className="app-shell">
      <Header onOpenManage={() => setShowManage(true)} />
      <main><Outlet /></main>
      <footer>
        <Link className="brand footer-brand" to="/"><span className="brand-mark"><Waves size={22} /></span><span>skyhaven<span className="brand-dot">.</span><small>STAYS THAT STAY WITH YOU</small></span></Link>
        <span>Find your somewhere. Make it memorable.</span>
        <span>© 2026 SkyHaven Stays</span>
      </footer>
      {showManage && <ManageBookingsModal onClose={() => setShowManage(false)} />}
      <Toast />
    </div>
  );
}
