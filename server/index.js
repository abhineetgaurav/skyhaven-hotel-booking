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
import { signToken, requireAuth, optionalAuth } from "./middleware/auth.js";
dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5174" }));
app.use(express.json({ limit: "1mb" }));
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Please correct the highlighted information.", errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  next();
};
const publicUser = u => ({ id: u._id, name: u.name, email: u.email });

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

app.get("/api/rooms", async (req, res, next) => {
  try {
    const { search = "", type = "", maxPrice, minRating } = req.query;
    const filter = {};
    if (search.trim()) filter.$or = [{ name: { $regex: search.trim(), $options: "i" } }, { location: { $regex: search.trim(), $options: "i" } }];
    if (type && ["Hotel", "Resort", "Apartment", "Boutique"].includes(type)) filter.type = type;
    if (maxPrice && Number.isFinite(Number(maxPrice))) filter.price = { $lte: Number(maxPrice) };
    if (minRating && Number.isFinite(Number(minRating))) filter.rating = { $gte: Number(minRating) };
    res.json(await Room.find(filter).sort({ rating: -1 }));
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
    res.status(201).json({ message: "Your stay is confirmed!", booking });
  } catch (e) { next(e); }
});
app.get("/api/bookings", query("email").trim().isEmail().withMessage("Enter the email used for booking."), validate, async (req, res, next) => {
  try { res.json(await Booking.find({ email: req.query.email.toLowerCase() }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});
app.get("/api/bookings/mine", requireAuth, async (req, res, next) => {
  try { res.json(await Booking.find({ $or: [{ user: req.user._id }, { email: req.user.email }] }).sort({ createdAt: -1 })); } catch (e) { next(e); }
});
app.patch("/api/bookings/:id/cancel", param("id").isMongoId().withMessage("Invalid booking ID."), body("email").trim().isEmail().withMessage("Enter the booking email."), validate, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, email: req.body.email.toLowerCase() });
    if (!booking) return res.status(404).json({ message: "Booking not found for that email." });
    if (booking.status === "Cancelled") return res.status(400).json({ message: "This booking is already cancelled." });
    booking.status = "Cancelled"; await booking.save(); res.json({ message: "Booking cancelled.", booking });
  } catch (e) { next(e); }
});
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server. Please try again." });
});
const port = process.env.PORT || 5001;
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skyhaven")
  .then(async () => { console.log("MongoDB connected"); await seedRooms(); app.listen(port, () => console.log(`API running on http://localhost:${port}`)); })
  .catch(err => { console.error("MongoDB connection failed. Start MongoDB and check server/.env.", err.message); process.exit(1); });
