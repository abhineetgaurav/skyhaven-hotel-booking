import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle, Waves } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotice } from "../context/NoticeContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const { notify } = useNotice();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      notify("success", "Welcome back!");
      navigate(location.state?.from || "/");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="modal-kicker"><Waves size={16} /> WELCOME BACK</div>
        <h1>Log in<span className="brand-dot">.</span></h1>
        <p className="modal-subtitle">Sign in to manage bookings, save favourites and leave reviews.</p>
        <form onSubmit={submit} noValidate>
          <label className="form-field"><span>Email address</span><div className="input-wrap"><Mail size={16} /><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required /></div></label>
          <label className="form-field"><span>Password</span><div className="input-wrap"><Lock size={16} /><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required /></div></label>
          {error && <div className="inline-notice error"><AlertCircle size={17} />{error}</div>}
          <button className="confirm-button" type="submit" disabled={busy}>{busy ? "Logging in…" : <>Log in <ArrowRight size={17} /></>}</button>
        </form>
        <p className="auth-switch">New to SkyHaven? <Link to="/signup">Create an account</Link></p>
      </div>
    </section>
  );
}
