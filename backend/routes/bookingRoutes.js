const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createBooking,
  getMyBookings,
  updateBooking,
  deleteBooking,
  getAllBookings,
  markPaid,
} = require("../controllers/bookingController");

// create booking
router.post("/", auth, createBooking);

// get user bookings
router.get("/my", auth, getMyBookings);

// get all bookings (admin)
router.get("/admin", auth, getAllBookings);

// update booking
router.put("/:id", auth, updateBooking);

// delete booking
router.delete("/:id", auth, deleteBooking);

// mark as paid (fake payment)
router.put("/:id/pay", auth, markPaid);

module.exports = router;