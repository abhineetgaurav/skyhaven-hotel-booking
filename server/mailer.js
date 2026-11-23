import nodemailer from "nodemailer";

// If SMTP_HOST is set, real emails are sent. Otherwise emails are printed to the
// server console so the feature can be developed and tested without credentials.
let transporter;
function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE) === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const inr = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const day = d => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const ref = b => String(b._id).slice(-8).toUpperCase();

const DOS = [
  "Carry a valid government photo ID for every adult guest. It's required at check-in.",
  "Show your booking reference (below) at the front desk.",
  "Check in from about 2:00 PM and check out by 11:00 AM, unless your property tells you otherwise.",
  "Tell the property in advance about late arrivals, dietary needs or accessibility requirements.",
  "Settle any pending payment before checkout. UPI, card and net banking are accepted online, and the desk can take payment too.",
  "Switch off lights, AC and taps when you leave the room, and use the safe for valuables.",
  "Report any damage, maintenance issue or lost key to the front desk straight away.",
  "Keep your room card or key safe. A replacement may carry a small charge."
];
const DONTS = [
  "Don't exceed the number of guests on your booking without informing the property.",
  "Don't smoke inside rooms, and don't use open flames or candles.",
  "Don't bring outside guests into the room after visiting hours without the property's approval.",
  "Don't make loud noise after 10:00 PM. Please respect other guests.",
  "Don't bring pets or prohibited items unless the property has confirmed they are allowed.",
  "Don't move or take furniture, linen, towels or fittings from the room.",
  "Don't leave the property without clearing any dues.",
  "Don't share your booking details or door codes with anyone."
];
const guideHtml = () => `<div style="margin-top:22px;border-top:1px solid #e1edf4;padding-top:20px">
<div style="font-size:17px;font-weight:700;color:#18374f;margin-bottom:12px">Your guest guide</div>
<div style="background:#eefaf4;border-radius:12px;padding:14px 18px;margin-bottom:12px"><div style="font-weight:700;color:#1b7a58;margin-bottom:8px;font-size:14px">✓ Do's</div><ul style="margin:0;padding-left:18px;color:#35566d;font-size:13px;line-height:1.7">${DOS.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div>
<div style="background:#fff3f4;border-radius:12px;padding:14px 18px"><div style="font-weight:700;color:#b83a4a;margin-bottom:8px;font-size:14px">✗ Don'ts</div><ul style="margin:0;padding-left:18px;color:#35566d;font-size:13px;line-height:1.7">${DONTS.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div>
<p style="font-size:12px;color:#8aa0b0;margin:12px 0 0">Individual properties may have their own house rules. Where they differ, the property's rules apply.</p></div>`;
const guideText = () => ["", "GUEST GUIDE", "Do's:", ...DOS.map(d => "  + " + d), "Don'ts:", ...DONTS.map(d => "  - " + d), ""].join("\n");

function layout(title, intro, booking, accent, extra = "") {
  const nights = Math.max(1, Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000));
  const row = (k, v) => `<tr><td style="padding:9px 0;color:#70879a;font-size:13px">${k}</td><td style="padding:9px 0;text-align:right;font-weight:600;color:#18374f;font-size:14px">${v}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#f3faff;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e1edf4">
<tr><td style="background:${accent};padding:28px 32px;color:#fff"><div style="font-size:13px;letter-spacing:2px;opacity:.85">SKYHAVEN</div><div style="font-size:26px;font-weight:700;margin-top:8px">${esc(title)}</div></td></tr>
<tr><td style="padding:28px 32px">
<p style="margin:0 0 18px;color:#35566d;font-size:15px;line-height:1.6">Hi ${esc(booking.fullName)}, ${intro}</p>
<div style="background:#f3faff;border-radius:12px;padding:14px 18px;margin-bottom:18px"><div style="font-size:11px;letter-spacing:1.5px;color:#70879a">BOOKING REFERENCE</div><div style="font-size:22px;font-weight:700;color:#125c91;letter-spacing:2px">${ref(booking)}</div></div>
<div style="font-size:19px;font-weight:700;color:#18374f">${esc(booking.roomName)}</div>
<div style="font-size:13px;color:#70879a;margin-bottom:10px">${esc(booking.location)}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e1edf4">
${row("Check-in", day(booking.checkIn))}${row("Check-out", day(booking.checkOut))}${row("Nights", nights)}${row("Guests", booking.guests)}
<tr><td colspan="2" style="border-top:1px solid #e1edf4"></td></tr>
${row("Payment", booking.paymentStatus === "Paid" ? `<span style="color:#1b9a6c">Paid · ${esc(booking.paymentMethod)}</span>` : "Due before checkout")}
${row("Total", `<span style="font-size:18px;color:#125c91">${inr(booking.totalPrice)}</span>`)}
</table>
${booking.requests ? `<p style="font-size:13px;color:#70879a;margin:16px 0 0"><b>Your requests:</b> ${esc(booking.requests)}</p>` : ""}
${extra}</td></tr>
<tr><td style="padding:18px 32px;background:#f7fbfe;color:#8aa0b0;font-size:12px;text-align:center">Need to make a change? Manage your booking any time from SkyHaven using this email address.</td></tr>
</table></td></tr></table></body></html>`;
}

async function send(to, subject, html, text) {
  const info = await getTransporter().sendMail({ from: process.env.MAIL_FROM || "SkyHaven <no-reply@skyhaven.local>", to, subject, html, text });
  if (!process.env.SMTP_HOST) console.log(`[mail:dev] To: ${to} | Subject: ${subject}\n${text}\n`);
  return info;
}

export async function sendBookingConfirmation(booking) {
  const text = `Your stay at ${booking.roomName} (${booking.location}) is confirmed.\nReference: ${ref(booking)}\nCheck-in: ${day(booking.checkIn)}\nCheck-out: ${day(booking.checkOut)}\nGuests: ${booking.guests}\nTotal: ${inr(booking.totalPrice)}`;
  return send(booking.email, `Booking confirmed: ${booking.roomName} (#${ref(booking)})`, layout("Your stay is confirmed ✓", "great news — your reservation is confirmed. Here are the details.", booking, "linear-gradient(135deg,#168bd2,#4cc3e8)", guideHtml()), text + "\n" + guideText());
}

export async function sendPaymentReceipt(booking) {
  const text = `Payment received for booking ${ref(booking)} at ${booking.roomName}.\nAmount: ${inr(booking.totalPrice)}\nMethod: ${booking.paymentMethod}\nTransaction: ${booking.transactionId}`;
  return send(booking.email, `Payment received: ${booking.roomName} (#${ref(booking)})`, layout("Payment received ✓", `we've received your payment of ${inr(booking.totalPrice)} (transaction ${esc(booking.transactionId)}). Nothing more to pay at check-out.`, booking, "linear-gradient(135deg,#1b9a6c,#4cc3a0)"), text);
}

export async function sendCancellationEmail(booking) {
  const text = `Your booking ${ref(booking)} at ${booking.roomName} has been cancelled.`;
  return send(booking.email, `Booking cancelled: ${booking.roomName} (#${ref(booking)})`, layout("Booking cancelled", "your reservation has been cancelled. We hope to host you another time.", booking, "linear-gradient(135deg,#5f7a8c,#8aa3b3)"), text);
}

// Email failures must never fail the booking itself.
export const safely = (promise, label) => promise.catch(err => console.error(`Email (${label}) failed:`, err.message));
