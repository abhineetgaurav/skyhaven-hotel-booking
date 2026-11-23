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
  images: [{ type: String }],
  description: { type: String, required: true },
  amenities: [{ type: String }],
  lat: { type: Number, min: -90, max: 90 },
  lng: { type: Number, min: -180, max: 180 }
}, { timestamps: true });
export default mongoose.model("Room", roomSchema);