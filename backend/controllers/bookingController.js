const Booking = require("../models/Booking");
const Station = require("../models/Station");

// ✅ CREATE BOOKING
exports.createBooking = async (req, res) => {
  try {
    const { station, slotTime, date, duration, paymentStatus, paymentMethod } = req.body;

    const stationDoc = await Station.findById(station);
    if (!stationDoc) {
      return res.status(404).json({ message: "Station not found" });
    }
    if (stationDoc.status === "under_work") {
      return res
        .status(400)
        .json({ message: "Selected station is under maintenance" });
    }

    // Prevent double booking
    const existing = await Booking.findOne({
      station,
      slotTime,
      date,
    });

    if (existing) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    const totalPrice = (duration || 1) * stationDoc.pricePerHour;

    const booking = new Booking({
      user: req.user.id,
      station,
      slotTime,
      date,
      duration: duration || 1,
      paymentStatus: paymentStatus || "pending",
      paymentMethod: paymentMethod || "UPI",
      totalPrice: totalPrice,
    });

    await booking.save();

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ✅ GET MY BOOKINGS
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
    }).populate("station");

    res.json(bookings);
  } catch (err) {
    console.error("GET_MY_BOOKINGS_ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};



// ✅ UPDATE BOOKING
exports.updateBooking = async (req, res) => {
  try {
    const { station, slotTime, date, duration, paymentStatus, paymentMethod, totalPrice } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only owner OR admin can edit
    const isOwner = String(booking.user) === String(req.user.id);
    if (!req.user.isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const stationDoc = await Station.findById(station);
    if (!stationDoc) {
      return res.status(404).json({ message: "Station not found" });
    }
    if (stationDoc.status === "under_work") {
      return res
        .status(400)
        .json({ message: "Selected station is under maintenance" });
    }

    // Prevent editing into an already-booked slot by anyone else
    const existing = await Booking.findOne({
      station,
      slotTime,
      date,
      _id: { $ne: bookingId },
    });

    if (existing) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    booking.station = station;
    booking.slotTime = slotTime;
    booking.date = date;
    if (duration !== undefined) booking.duration = duration;
    if (paymentStatus !== undefined) booking.paymentStatus = paymentStatus;
    if (paymentMethod !== undefined) booking.paymentMethod = paymentMethod;
    if (totalPrice !== undefined) booking.totalPrice = totalPrice;
    await booking.save();

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ DELETE BOOKING
exports.deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isOwner = String(booking.user) === String(req.user.id);
    if (!req.user.isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Booking.findByIdAndDelete(bookingId);

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET ALL BOOKINGS (ADMIN)
exports.getAllBookings = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const bookings = await Booking.find()
      .populate("station")
      .populate("user", "-password");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET AVAILABLE SLOTS
exports.getAvailableSlots = async (req, res) => {
  try {
    const { stationId, date } = req.query;

    const allSlots = Array.from({ length: 24 }, (_, h) =>
      `${String(h).padStart(2, "0")}:00`
    );

    const booked = await Booking.find({
      station: stationId,
      date,
    });

    const bookedSlots = booked.map((b) => b.slotTime); // ✅ FIXED

    const available = allSlots.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    res.json(available);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ MARK PAID
exports.markPaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only owner or admin
    if (!req.user.isAdmin && String(booking.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.paymentStatus = "paid";
    await booking.save();
    res.json({ message: "Payment verified", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};