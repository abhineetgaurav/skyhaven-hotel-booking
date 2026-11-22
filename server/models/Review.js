import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 600 },
  verifiedStay: { type: Boolean, default: false }
}, { timestamps: true });
reviewSchema.index({ room: 1, user: 1 }, { unique: true });
export default mongoose.model("Review", reviewSchema);
