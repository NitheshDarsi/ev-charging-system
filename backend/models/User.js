const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  // If true, user can manage/reschedule/delete any booking (admin panel)
  isAdmin: { type: Boolean, default: false },
  
  // Multi-Vehicle Garage configuration array
  vehicles: [{
    brand: String,
    model: String,
    hp: Number,
    torque: Number,
    battery: Number,
    year: Number,
    range: Number,
    gasRange: Number,
    isHybrid: { type: Boolean, default: false }
  }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);