// Generates 60 additional stays (2 per city) across India, with map coordinates.
const IMG = ["1484154218962-a197022b5858","1518780664697-55e3ad937233","1522708323590-d24dbb6b0267","1540541338287-41700207dee6","1564501049412-61c2a3083791","1566073771259-6a8506099945","1571896349842-33c89424de2d","1578683010236-d716f9a3f461","1582719478250-c89cae4dc85b","1582719508461-905c673771fd","1586105251261-72a756497a11","1587061949409-02df41d5e562","1595576508898-0ad5c879a061","1598928506311-c55ded91a20c","1551882547-ff40c63fe5fa","1601918774946-25832a4be0d6","1611892440504-42a792e24d32","1445019980597-93fa8acb246c","1520250497591-112f2f40a3f4","1542314831-068cd1dbfeeb","1496417263034-38ec4f0b665a","1455587734955-081b22074882"];
const url = (i, w, q) => `https://images.unsplash.com/photo-${IMG[i % IMG.length]}?auto=format&fit=crop&w=${w}&q=${q}`;

// [city, state, lat, lng, [name, type, feature], [name, type, feature]]
const CITIES = [
  ["Mumbai","Maharashtra",19.076,72.8777,["Marine Drive Suites","Hotel","Sea view"],["Bandra Loft Studio","Apartment","Workspace"]],
  ["New Delhi","Delhi",28.6139,77.209,["The Lutyens Court","Hotel","Garden"],["Hauz Khas Haveli","Boutique","Courtyard"]],
  ["Kolkata","West Bengal",22.5726,88.3639,["Hooghly Heritage House","Boutique","River view"],["Park Street Residency","Hotel","Restaurant"]],
  ["Chennai","Tamil Nadu",13.0827,80.2707,["Marina Breeze Hotel","Hotel","Sea view"],["Adyar Garden Flats","Apartment","Kitchen"]],
  ["Hyderabad","Telangana",17.385,78.4867,["Nizam's Pearl Palace","Hotel","Rooftop dining"],["Banjara Hills Nest","Apartment","Workspace"]],
  ["Pune","Maharashtra",18.5204,73.8567,["Koregaon Park Retreat","Boutique","Garden"],["Sahyadri View Resort","Resort","Mountain view"]],
  ["Ahmedabad","Gujarat",23.0225,72.5714,["Sabarmati Haveli","Boutique","Courtyard"],["Heritage Walk Inn","Hotel","Restaurant"]],
  ["Jaisalmer","Rajasthan",26.9157,70.9083,["Golden Fort Camp","Resort","Desert view"],["Sandstone Haveli","Boutique","Rooftop dining"]],
  ["Jodhpur","Rajasthan",26.2389,73.0243,["Blue City Haveli","Boutique","Fort view"],["Mehrangarh Vista Hotel","Hotel","Fort view"]],
  ["Rishikesh","Uttarakhand",30.0869,78.2676,["Ganga Ghat Retreat","Resort","River view"],["Himalayan Yoga Nest","Boutique","Yoga deck"]],
  ["Shimla","Himachal Pradesh",31.1048,77.1734,["Ridge View Cottage","Boutique","Mountain view"],["The Deodar Lodge","Resort","Heating"]],
  ["Darjeeling","West Bengal",27.036,88.2627,["Tea Estate Bungalow","Boutique","Tea garden"],["Kanchenjunga Heights","Hotel","Mountain view"]],
  ["Gangtok","Sikkim",27.3389,88.6065,["Monastery Hill Stay","Boutique","Mountain view"],["Teesta Valley Resort","Resort","River view"]],
  ["Munnar","Kerala",10.0889,77.0595,["Misty Hills Plantation","Resort","Tea garden"],["Cardamom Cloud Cottage","Boutique","Mountain view"]],
  ["Alleppey","Kerala",9.4981,76.3388,["Backwater Houseboat Villa","Resort","Waterfront"],["Kuttanad Canal Home","Apartment","Waterfront"]],
  ["Varanasi","Uttar Pradesh",25.3176,82.9739,["Ghatside Haveli","Boutique","River view"],["Kashi Courtyard Hotel","Hotel","Courtyard"]],
  ["Agra","Uttar Pradesh",27.1767,78.0081,["Taj View Grand","Hotel","Monument view"],["Mughal Garden Stay","Boutique","Garden"]],
  ["Mysuru","Karnataka",12.2958,76.6394,["Palace Road Residency","Hotel","Garden"],["Chamundi Hill Cottage","Boutique","Hill view"]],
  ["Madikeri, Coorg","Karnataka",12.4244,75.7382,["Coffee Mist Estate","Resort","Plantation"],["Abbey Falls Cabin","Boutique","Forest view"]],
  ["Ooty","Tamil Nadu",11.4102,76.695,["Nilgiri Rose Lodge","Boutique","Garden"],["Lakeside Pine Resort","Resort","Lake view"]],
  ["Pondicherry","Puducherry",11.9416,79.8083,["French Quarter Villa","Boutique","Courtyard"],["Promenade Blue Hotel","Hotel","Sea view"]],
  ["Hampi","Karnataka",15.335,76.46,["Boulder Valley Camp","Resort","Ruins view"],["Tungabhadra Homestay","Apartment","River view"]],
  ["Leh","Ladakh",34.1526,77.5771,["Stok Kangri Lodge","Resort","Mountain view"],["Indus Valley Guesthouse","Boutique","Heating"]],
  ["Srinagar","Jammu & Kashmir",34.0837,74.7973,["Dal Lake Houseboat","Boutique","Lake view"],["Shalimar Garden Hotel","Hotel","Garden"]],
  ["Amritsar","Punjab",31.634,74.8723,["Golden Temple Lane Inn","Hotel","Temple view"],["Punjab Haveli Stay","Boutique","Courtyard"]],
  ["Mussoorie","Uttarakhand",30.4598,78.0664,["Camel's Back Cottage","Boutique","Mountain view"],["Doon Valley Resort","Resort","Valley view"]],
  ["Nainital","Uttarakhand",29.3919,79.4542,["Naini Lake Residency","Hotel","Lake view"],["Pinewood Cabin","Boutique","Forest view"]],
  ["Port Blair","Andaman & Nicobar",11.6234,92.7265,["Havelock Reef Resort","Resort","Sea view"],["Coral Bay Villas","Resort","Private pool"]],
  ["Kovalam","Kerala",8.4004,76.9787,["Lighthouse Beach Hotel","Hotel","Sea view"],["Palm Cove Apartments","Apartment","Kitchen"]]
];
const TYPE = {
  Hotel: { base: 4200, guests: [2, 3], beds: ["1 king bed", "2 twin beds", "1 queen bed"], am: ["Free Wi-Fi", "Breakfast", "Air conditioning", "Restaurant"], blurb: "Polished rooms, attentive service and an easy base for exploring" },
  Resort: { base: 6200, guests: [3, 4], beds: ["1 king + sofa bed", "1 queen + 1 single", "2 queen beds"], am: ["Pool", "Breakfast", "Free Wi-Fi", "Parking"], blurb: "Space to unwind, with grounds and amenities that make the stay the destination" },
  Boutique: { base: 3600, guests: [2, 2], beds: ["1 queen bed", "1 king bed"], am: ["Breakfast", "Free Wi-Fi", "Air conditioning"], blurb: "A characterful stay with handcrafted details and a personal touch" },
  Apartment: { base: 2700, guests: [3, 5], beds: ["1 queen + 1 single", "2 queen beds", "1 king + sofa bed"], am: ["Kitchen", "Free Wi-Fi", "Washer", "Air conditioning"], blurb: "Home-style comfort with room to spread out and cook your own meals" }
};

export function generateStays() {
  const out = [];
  CITIES.forEach(([city, state, lat, lng, ...stays], ci) => {
    stays.forEach(([name, type, feature], si) => {
      const n = ci * 2 + si, t = TYPE[type];
      const jitter = k => ((((n * 37 + k * 11) % 21) - 10) / 10) * 0.018; // keep same-city pins apart
      const price = Math.round((t.base + ((n * 523) % 2600) - 600) / 100) * 100 - 1;
      const first = n * 3;
      out.push({
        name, type, location: `${city}, ${state === city ? "India" : state}`,
        lat: +(lat + jitter(1)).toFixed(5), lng: +(lng + jitter(2)).toFixed(5),
        price, rating: +(4.3 + ((n * 7) % 7) / 10).toFixed(1), reviews: 40 + ((n * 53) % 260),
        guests: t.guests[si % t.guests.length], beds: t.beds[n % t.beds.length],
        image: url(first, 1200, 85), images: [0, 1, 2, 3].map(k => url(first + k * 5, 1400, 85)),
        description: `${t.blurb} in ${city.split(",")[0]}. Enjoy ${feature.toLowerCase()} and the best of the local area right on your doorstep.`,
        amenities: [feature, ...t.am.slice(0, 3)]
      });
    });
  });
  return out;
}
