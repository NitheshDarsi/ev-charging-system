const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: true,
  },

  slotTime: {            // ✅ keep slotTime
    type: String,
    required: true,
  },

  date: {
    type: String,
    required: true,
  },

  duration: {
    type: Number,
    default: 1, // hours
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },

  paymentMethod: {
    type: String,
    enum: ["UPI", "Cash", "Pay at Station", "Pay After Charging"],
    default: "UPI",
  },

  totalPrice: {
    type: Number,
    default: 0,
  },

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);