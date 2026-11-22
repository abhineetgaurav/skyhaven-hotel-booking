# SkyHaven — Hotel & Accommodation Booking (MERN)

A responsive hotel-booking app with a white + sky-blue palette, accommodation search, filters, room details, validated booking form, and reservation management.

## Stack
- MongoDB + Mongoose
- Express + Node.js REST API
- React + Vite
- Client-side and server-side validation

## Requirements
- Node.js 18+
- MongoDB Community running locally, or a MongoDB Atlas connection string

## Run in VS Code
1. Extract this ZIP and open the `skyhaven-hotel-booking` folder in VS Code.
2. Open the terminal in that folder.
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Configure the backend:
   - Copy `server/.env.example` to `server/.env`
   - For local MongoDB, keep `MONGO_URI=mongodb://127.0.0.1:27017/skyhaven`
   - Set a different `MONGO_URI` if using MongoDB Atlas.
5. Start both frontend and backend:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:5173`.

The frontend runs on port 5173 and the API on port 5000. MongoDB must be available to save real reservations. If MongoDB isn't connected, the UI still loads but booking requests show a helpful connection error.

## Main features
- Search by destination/property name, dates, and guests
- Filter by accommodation type, maximum price, and rating
- Responsive room cards and detail modal
- Booking form validates dates, guest count, name, email, phone, and special requests
- Server validates all submitted booking data again
- Reservation list, cancellation, and duplicate-date/room checks
- API health endpoint: `GET /api/health`

## API
- `GET /api/rooms`
- `GET /api/rooms/:id`
- `POST /api/bookings`
- `GET /api/bookings?email=...`
- `PATCH /api/bookings/:id/cancel`
- `GET /api/health`

Demo room inventory is seeded into MongoDB on server startup if the rooms collection is empty.
