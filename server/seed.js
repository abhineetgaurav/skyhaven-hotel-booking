import Room from "./models/Room.js";
import { generateStays } from "./seedStays.js";
const COORDS = { Goa: [15.4909, 73.8278], Manali: [32.2396, 77.1887], Jaipur: [26.9124, 75.7873], Kochi: [9.9312, 76.2673], Bengaluru: [12.9716, 77.5946], Udaipur: [24.5854, 73.7125] };
const rooms = [
 {name:"The Azure Grand",type:"Hotel",location:"Goa, India",price:6499,rating:4.9,reviews:284,guests:2,beds:"1 king bed",image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",images:["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=85"],description:"A refined coastal escape with bright, airy suites, thoughtful service and a beautiful pool.",amenities:["Pool","Free Wi-Fi","Breakfast","Sea view"]},
 {name:"Cloudline Mountain Resort",type:"Resort",location:"Manali, India",price:5299,rating:4.8,reviews:196,guests:3,beds:"1 queen + sofa bed",image:"https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=85",images:["https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1400&q=85"],description:"Wake up to mountain air, forest views and cozy modern interiors made for slow mornings.",amenities:["Mountain view","Restaurant","Parking","Heating"]},
 {name:"The Sunday House",type:"Boutique",location:"Jaipur, India",price:3899,rating:4.7,reviews:142,guests:2,beds:"1 queen bed",image:"https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85",images:["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1400&q=85"],description:"A character-filled boutique stay mixing handcrafted details with contemporary comfort.",amenities:["Breakfast","Free Wi-Fi","Courtyard","Air conditioning"]},
 {name:"Bluewater Beach Villas",type:"Resort",location:"Kochi, India",price:7899,rating:4.9,reviews:118,guests:4,beds:"2 king beds",image:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85",images:["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1400&q=85"],description:"Private villa living with tropical gardens, sunlit spaces and an easygoing waterfront feel.",amenities:["Private pool","Waterfront","Kitchen","Airport transfer"]},
 {name:"Little Nest Apartment",type:"Apartment",location:"Bengaluru, India",price:2499,rating:4.6,reviews:87,guests:3,beds:"1 queen + 1 single",image:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85",images:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1400&q=85"],description:"A comfortable, design-led city apartment with a full kitchen and room to unwind.",amenities:["Kitchen","Workspace","Free Wi-Fi","Washer"]},
 {name:"The Pearl Residency",type:"Hotel",location:"Udaipur, India",price:4599,rating:4.8,reviews:203,guests:2,beds:"1 king bed",image:"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85",images:["https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=85","https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=85"],description:"An elegant hideaway inspired by lakeside palaces, with warm hospitality and sunset views.",amenities:["Rooftop dining","Pool","Breakfast","Lake view"]}
];
export async function seedRooms() {
  // Add any stays that don't exist yet (matched by name) so existing data and bookings are untouched.
  const all = [...rooms, ...generateStays()];
  const existing = new Set((await Room.find({}, "name")).map(r => r.name));
  const fresh = all.filter(r => !existing.has(r.name)).map(r => {
    const c = COORDS[r.location.split(",")[0].trim()];
    return c && r.lat == null ? { ...r, lat: c[0], lng: c[1] } : r;
  });
  if (fresh.length) await Room.insertMany(fresh);
  // Backfill gallery images / coordinates on rooms created by older versions.
  const stale = await Room.find({ $or: [{ images: { $exists: false } }, { images: { $size: 0 } }, { lat: { $exists: false } }, { lat: null }] });
  for (const doc of stale) {
    const match = rooms.find(r => r.name === doc.name);
    if (match && (!doc.images || !doc.images.length)) doc.images = match.images;
    const c = COORDS[doc.location.split(",")[0].trim()];
    if (c && doc.lat == null) { doc.lat = c[0] + (Math.random() - .5) * .03; doc.lng = c[1] + (Math.random() - .5) * .03; }
    await doc.save();
  }
}

// Image IDs that no longer exist on Unsplash -> working replacements. Fixes stays already stored in the database.
const DEAD_IMAGES = { "1601701119533-fe8ab8f98278": "1551882547-ff40c63fe5fa" };
export async function repairImages() {
  for (const [dead, fresh] of Object.entries(DEAD_IMAGES)) {
    const docs = await Room.find({ $or: [{ image: { $regex: dead } }, { images: { $regex: dead } }] });
    for (const d of docs) {
      d.image = d.image.replace(dead, fresh);
      d.images = d.images.map(u => u.replace(dead, fresh));
      await d.save();
    }
    if (docs.length) console.log(`Repaired broken images on ${docs.length} stays.`);
  }
}
