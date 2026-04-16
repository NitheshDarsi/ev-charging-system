const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema({
  name: String,
  slots: Number,
  // Station maintenance status for booking UI + validations
  status: { type: String, enum: ["open", "under_work"], default: "open" },
  // Optional coordinates for range calculation (Haversine)
  lat: Number,
  lng: Number,
  // Pricing configuration for real-time calculations
  pricePerHour: { type: Number, default: 250 },
});

module.exports = mongoose.model("Station", stationSchema);

distance: Number // distance from user in km