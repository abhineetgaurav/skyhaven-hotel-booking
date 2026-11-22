import mongoose from "mongoose";
const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["Hotel", "Resort", "Apartment", "Boutique"], required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true, min: 1 },
  rating: { type: Number, min: 1, max: 5, required: true },
  reviews: { type: Number, default: 0 },
  guests: { type: Number, min: 1, required: true },
  beds: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  amenities: [{ type: String }]
}, { timestamps: true });
export default mongoose.model("Room", roomSchema);