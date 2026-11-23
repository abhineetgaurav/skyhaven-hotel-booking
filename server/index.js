import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { body, param, query, validationResult } from "express-validator";
import Room from "./models/Room.js";
import Booking from "./models/Booking.js";
import User from "./models/User.js";
import Review from "./models/Review.js";
import { seedRooms } from "./seed.js";
import { sendBookingConfirmation, sendCancellationEmail, sendPaymentReceipt, safely } from "./mailer.js";
import { validatePaymentInput, charge, BANKS } from "./payments.js";
import { signToken, requireAuth, requireAdmin, optionalAuth } from "./middleware/auth.js";
dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5174" }));
app.use(express.json({ limit: "1mb" }));
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Please correct the highlighted information.", errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
};
const publicUser = u => ({ id: u._id, name: u.name, email: u.email, role: u.role || "user" });

app.get("/api/health", (_req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));

app.post("/api/auth/signup", [
  body("name").trim().isLength({ min: 2, max: 70 }).withMessage("Name must be 2–70 characters."),
  body("email").trim().isEmail().withMessage("Enter a valid email address."),
  body("password").isLength({ min: 8, max: 72 }).withMessage("Password must be at least 8 characters.")
], validate, async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    if (await User.findOne({ email })) return res.status(409).json({ message: "An account with this email already exists.", errors: [{ field: "email", message: "Already registered. Try logging in instead." }] });
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ name: req.body.name.trim(), email, passwordHash });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

app.post("/api/auth/login", [
  body("email").trim().isEmail().withMessage("Enter a valid email address."),
  body("password").notEmpty().withMessage("Enter your password.")
], validate, async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });
    const ok = user && await bcrypt.compare(req.body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Incorrect email or password." });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

app.get("/api/auth/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

const SORTS = {
  recommended: { rating: -1, reviews: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  rating: { rating: -1, reviews: -1 },
  popular: { reviews: -1, rating: -1 }
};
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
app.get("/api/rooms/meta", async (_req, res, next) => {
  try {
    const amenities = await Room.distinct("amenities");
    res.json({ amenities: amenities.sort() });
  } catch (e) { next(e); }
});
app.get("/api/rooms", async (req, res, next) => {
  try {
    const { search = "", type = "", maxPrice, minRating, sort = "recommended", amenities = "", checkIn, checkOut, guests } = req.query;
    const filter = {};
    if (search.trim()) { const rx = escapeRegex(search.trim()); filter.$or = [{ name: { $regex: rx, $options: "i" } }, { location: { $regex: rx, $options: "i" } }]; }
    if (type && ["Hotel", "Resort", "Apartment", "Boutique"].includes(type)) filter.type = type;
    if (maxPrice && Number.isFinite(Number(maxPrice))) filter.price = { $lte: Number(maxPrice) };
    if (minRating && Number.isFinite(Number(minRating))) filter.rating = { $gte: Number(minRating) };
    if (guests && Number.isInteger(Number(guests)) && Number(guests) > 0) filter.guests = { $gte: Number(guests) };
    const wanted = String(amenities).split(",").map(a => a.trim()).filter(Boolean);
    if (wanted.length) filter.amenities = { $all: wanted };
    const start = checkIn ? new Date(checkIn) : null, end = checkOut ? new Date(checkOut) : null;
    if (start && end && !isNaN(start) && !isNaN(end) && end > start) {
      const busy = await Booking.distinct("room", { status: "Confirmed", checkIn: { $lt: end }, checkOut: { $gt: start } });
      if (busy.length) filter._id = { $nin: busy };
    }
    res.json(await Room.find(filter).sort(SORTS[sort] || SORTS.recommended));
  } catch (e) { next(e); }
});
app.get("/api/rooms/:id", param("id").isMongoId().withMessage("Invalid room ID."), validate, async (req, res, next) => {
  try { const room = await Room.findById(req.params.id); if (!room) return res.status(404).json({ message: "Room not found." }); res.json(room); } catch (e) { next(e); }
});

app.get("/api/rooms/:id/reviews", param("id").isMongoId().withMessage("Invalid room ID."), validate, async (req, res, next) => {
  try { res.json(await Review.find({ room: req.params.id }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});
app.post("/api/rooms/:id/reviews", requireAuth, [
  param("id").isMongoId().withMessage("Invalid room ID."),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5."),
  body("comment").trim().isLength({ min: 5, max: 600 }).withMessage("Review must be 5–600 characters.")
], validate, async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found." });
    const verifiedStay = !!(await Booking.findOne({ room: room._id, status: "Confirmed", $or: [{ user: req.user._id }, { email: req.user.email }] }));
    const review = await Review.findOneAndUpdate(
      { room: room._id, user: req.user._id },
      { room: room._id, user: req.user._id, userName: req.user.name, rating: req.body.rating, comment: req.body.comment.trim(), verifiedStay },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const stats = await Review.aggregate([{ $match: { room: room._id } }, { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }]);
    if (stats.length) { room.rating = Math.round(stats[0].avg * 10) / 10; room.reviews = stats[0].count; await room.save(); }
    res.status(201).json({ message: "Thanks for sharing your stay!", review });
  } catch (e) { next(e); }
});

app.get("/api/wishlist", requireAuth, async (req, res, next) => {
  try { const user = await req.user.populate("wishlist"); res.json(user.wishlist); } catch (e) { next(e); }
});
app.post("/api/wishlist/:roomId", requireAuth, param("roomId").isMongoId().withMessage("Invalid room ID."), validate, async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: "Room not found." });
    const idx = req.user.wishlist.findIndex(id => id.equals(room._id));
    if (idx > -1) req.user.wishlist.splice(idx, 1); else req.user.wishlist.push(room._id);
    await req.user.save();
    res.json({ wishlist: req.user.wishlist });
  } catch (e) { next(e); }
});

app.post("/api/bookings", optionalAuth, [
  body("roomId").isMongoId().withMessage("Please select a valid room."),
  body("checkIn").isISO8601().withMessage("Enter a valid check-in date."),
  body("checkOut").isISO8601().withMessage("Enter a valid check-out date."),
  body("guests").isInt({ min: 1, max: 12 }).withMessage("Guests must be between 1 and 12."),
  body("fullName").trim().isLength({ min: 2, max: 70 }).withMessage("Name must be 2–70 characters."),
  body("email").trim().isEmail().withMessage("Enter a valid email address."),
  body("phone").trim().matches(/^[+]?[\d\s()-]{8,18}$/).withMessage("Enter a valid phone number."),
  body("requests").optional({ nullable: true }).isLength({ max: 500 }).withMessage("Requests must be under 500 characters.")
], validate, async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut, guests, fullName, email, phone, requests = "" } = req.body;
    const start = new Date(checkIn), end = new Date(checkOut);
    const today = new Date(); today.setHours(0,0,0,0);
    if (start < today) return res.status(400).json({ message: "Check-in cannot be in the past.", errors: [{field:"checkIn",message:"Choose today or a future date."}] });
    if (end <= start) return res.status(400).json({ message: "Check-out must be after check-in.", errors: [{field:"checkOut",message:"Choose a date after check-in."}] });
    const nights = Math.ceil((end - start) / 86400000);
    if (nights > 60) return res.status(400).json({ message: "Bookings can be up to 60 nights.", errors: [{field:"checkOut",message:"Maximum stay is 60 nights."}] });
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "That accommodation could not be found." });
    if (Number(guests) > room.guests) return res.status(400).json({ message: `This stay accommodates up to ${room.guests} guests.`, errors: [{field:"guests",message:`Maximum ${room.guests} guests for this stay.`}] });
    const conflict = await Booking.findOne({ room: roomId, status: "Confirmed", checkIn: { $lt: end }, checkOut: { $gt: start } });
    if (conflict) return res.status(409).json({ message: "This room is already booked for those dates. Please choose different dates." });
    const booking = await Booking.create({ room: room._id, user: req.user?._id, roomName: room.name, location: room.location, checkIn: start, checkOut: end, guests: Number(guests), fullName: fullName.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), requests: requests.trim(), totalPrice: nights * room.price });
    safely(sendBookingConfirmation(booking), "confirmation");
    res.status(201).json({ message: "Your stay is confirmed! A confirmation email is on its way.", booking });
  } catch (e) { next(e); }
});
app.get("/api/bookings", query("email").trim().isEmail().withMessage("Enter the email used for booking."), validate, async (req, res, next) => {
  try { res.json(await Booking.find({ email: req.query.email.toLowerCase() }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});
app.get("/api/bookings/mine", requireAuth, async (req, res, next) => {
  try { res.json(await Booking.find({ $or: [{ user: req.user._id }, { email: req.user.email }] }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});
app.get("/api/payments/banks", (_req, res) => res.json(BANKS));
// Pay for a booking online. On failure the booking stays confirmed and remains payable before checkout.
app.post("/api/bookings/:id/pay", param("id").isMongoId().withMessage("Invalid booking ID."), body("email").trim().isEmail().withMessage("Enter the booking email."), validate, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, email: req.body.email.toLowerCase() });
    if (!booking) return res.status(404).json({ message: "Booking not found for that email." });
    if (booking.status !== "Confirmed") return res.status(400).json({ message: "This booking is cancelled, so no payment is needed." });
    if (booking.paymentStatus === "Paid") return res.status(400).json({ message: "This booking is already paid." });
    const { errors, clean } = validatePaymentInput(req.body);
    if (errors.length) return res.status(400).json({ message: "Please check your payment details.", errors });
    const result = await charge({ method: req.body.method, clean, amount: booking.totalPrice });
    if (!result.ok) {
      booking.paymentFailures += 1; booking.lastPaymentError = result.reason; await booking.save();
      return res.status(402).json({ message: result.reason, fallback: "Your reservation is still confirmed. You can try again, or pay before checkout at the property.", booking });
    }
    Object.assign(booking, { paymentStatus: "Paid", paymentMethod: result.label, transactionId: result.transactionId, paidAt: new Date(), lastPaymentError: "" });
    await booking.save();
    safely(sendPaymentReceipt(booking), "payment receipt");
    res.json({ message: "Payment successful. A receipt is on its way to your inbox.", booking });
  } catch (e) { next(e); }
});
app.patch("/api/bookings/:id/cancel", param("id").isMongoId().withMessage("Invalid booking ID."), body("email").trim().isEmail().withMessage("Enter the booking email."), validate, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, email: req.body.email.toLowerCase() });
    if (!booking) return res.status(404).json({ message: "Booking not found for that email." });
    if (booking.status === "Cancelled") return res.status(400).json({ message: "This booking is already cancelled." });
    booking.status = "Cancelled"; await booking.save(); safely(sendCancellationEmail(booking), "cancellation"); res.json({ message: "Booking cancelled.", booking });
  } catch (e) { next(e); }
});
// ---------- Admin ----------
const confirmedOnly = { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] };
app.get("/api/admin/overview", requireAdmin, async (_req, res, next) => {
  try {
    const [stays, agg, recent] = await Promise.all([
      Room.countDocuments(),
      Booking.aggregate([{ $group: { _id: null, total: { $sum: 1 }, confirmed: { $sum: confirmedOnly }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, "$totalPrice", 0] } }, collected: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Confirmed"] }, { $eq: ["$paymentStatus", "Paid"] }] }, "$totalPrice", 0] } } } }]),
      Booking.find().sort({ createdAt: -1 }).limit(6)
    ]);
    const a = agg[0] || { total: 0, confirmed: 0, cancelled: 0, revenue: 0, collected: 0 };
    res.json({ stays, bookings: a.total, confirmed: a.confirmed, cancelled: a.cancelled, revenue: a.revenue, collected: a.collected, recent });
  } catch (e) { next(e); }
});
app.get("/api/admin/stays", requireAdmin, async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = search ? { $or: [{ name: { $regex: escapeRegex(search), $options: "i" } }, { location: { $regex: escapeRegex(search), $options: "i" } }] } : {};
    const [rooms, stats] = await Promise.all([
      Room.find(filter, "name location type image price").sort({ name: 1 }).lean(),
      Booking.aggregate([{ $group: { _id: "$room", confirmed: { $sum: confirmedOnly }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, "$totalPrice", 0] } } } }])
    ]);
    const byRoom = new Map(stats.map(s => [String(s._id), s]));
    res.json(rooms.map(r => { const s = byRoom.get(String(r._id)); return { ...r, confirmed: s?.confirmed || 0, cancelled: s?.cancelled || 0, revenue: s?.revenue || 0 }; }));
  } catch (e) { next(e); }
});
app.get("/api/admin/stays/:id/bookings", requireAdmin, param("id").isMongoId().withMessage("Invalid stay ID."), validate, async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Stay not found." });
    const filter = { room: room._id };
    if (["Confirmed", "Cancelled"].includes(req.query.status)) filter.status = req.query.status;
    const bookings = await Booking.find(filter).sort({ checkIn: -1 });
    res.json({ stay: room, bookings });
  } catch (e) { next(e); }
});
// Search guests across every stay by name, email, phone, booking reference or account username.
app.get("/api/admin/bookings", requireAdmin, async (req, res, next) => {
  try {
    const term = String(req.query.q || "").trim();
    if (term.length < 2) return res.json([]);
    const rx = { $regex: escapeRegex(term), $options: "i" };
    const accounts = await User.find({ $or: [{ name: rx }, { email: rx }] }, "_id");
    const or = [{ fullName: rx }, { email: rx }, { phone: rx }, { roomName: rx }, { user: { $in: accounts.map(u => u._id) } }];
    if (/^[0-9a-f]{4,24}$/i.test(term)) or.push({ $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: `${term}$`, options: "i" } } });
    res.json(await Booking.find({ $or: or }).sort({ createdAt: -1 }).limit(50));
  } catch (e) { next(e); }
});
// Record a payment collected at the property (cash, or a card/UPI payment taken at the desk).
app.patch("/api/admin/bookings/:id/payment", requireAdmin, param("id").isMongoId().withMessage("Invalid booking ID."), body("method").isIn(["Cash", "Card", "UPI", "Netbanking"]).withMessage("Choose how it was paid."), validate, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status !== "Confirmed") return res.status(400).json({ message: "Cancelled bookings can't be marked paid." });
    if (booking.paymentStatus === "Paid") return res.status(400).json({ message: "Already marked as paid." });
    Object.assign(booking, { paymentStatus: "Paid", paymentMethod: `${req.body.method} (at property)`, transactionId: "PROP" + String(booking._id).slice(-6).toUpperCase(), paidAt: new Date(), lastPaymentError: "" });
    await booking.save();
    safely(sendPaymentReceipt(booking), "payment receipt");
    res.json({ message: "Payment recorded and receipt sent.", booking });
  } catch (e) { next(e); }
});
app.patch("/api/admin/bookings/:id/cancel", requireAdmin, param("id").isMongoId().withMessage("Invalid booking ID."), validate, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status === "Cancelled") return res.status(400).json({ message: "This booking is already cancelled." });
    booking.status = "Cancelled"; await booking.save();
    safely(sendCancellationEmail(booking), "cancellation");
    res.json({ message: "Booking cancelled and guest notified.", booking });
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server. Please try again." });
});
// Creates (or promotes) the admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase(), password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return console.log("Admin portal disabled: set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env to enable it.");
  if (password.length < 8) return console.warn("ADMIN_PASSWORD must be at least 8 characters; admin not created.");
  const existing = await User.findOne({ email });
  if (!existing) { await User.create({ name: "SkyHaven Admin", email, passwordHash: await bcrypt.hash(password, 10), role: "admin" }); console.log(`Admin account created: ${email}`); }
  else if (existing.role !== "admin") { existing.role = "admin"; await existing.save(); console.log(`Existing account promoted to admin: ${email}`); }
}
const port = process.env.PORT || 5001;
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skyhaven")
  .then(async () => { console.log("MongoDB connected"); await seedRooms(); await ensureAdmin(); app.listen(port, () => console.log(`API running on http://localhost:${port}`)); })
  .catch(err => { console.error("MongoDB connection failed. Start MongoDB and check server/.env.", err.message); process.exit(1); });
