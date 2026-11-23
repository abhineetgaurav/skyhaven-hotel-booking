import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const { notify } = useNotice();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Please enter your full name.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      await signup(form.name.trim(), form.email.trim(), form.password);
      notify("success", "Account created! Welcome to SkyHaven.");
      navigate("/");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="modal-kicker"><Sparkles size={16} /> JOIN SKYHAVEN</div>
        <h1>Create your account<span className="brand-dot">.</span></h1>
        <p className="modal-subtitle">Save favourites, track bookings and leave reviews on stays you've loved.</p>
        <form onSubmit={submit} noValidate>
          <label className="form-field"><span>Full name</span><div className="input-wrap"><User size={16} /><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" required /></div></label>
          <label className="form-field"><span>Email address</span><div className="input-wrap"><Mail size={16} /><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required /></div></label>
          <label className="form-field"><span>Password</span><div className="input-wrap"><Lock size={16} /><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" required /></div></label>
          {error && <div className="inline-notice error"><AlertCircle size={17} />{error}</div>}
          <button className="confirm-button" type="submit" disabled={busy}>{busy ? "Creating account…" : <>Sign up <ArrowRight size={17} /></>}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </section>
  );
}
