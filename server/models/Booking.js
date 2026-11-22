import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  roomName: { type: String, required: true },
  location: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true, min: 1, max: 12 },
  fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 70 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  requests: { type: String, maxlength: 500, default: "" },
  totalPrice: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["Confirmed", "Cancelled"], default: "Confirmed" }
}, { timestamps: true });
export default mongoose.model("Booking", bookingSchema);