const express = require("express");
const router = express.Router();

const { 
  getStations, 
  bookSlot, 
  getStationsInRange 
} = require("../controllers/stationController");

// Get all stations
router.get("/", getStations);

// Book slot
router.post("/book", bookSlot);

// Range calculation
router.get("/range", getStationsInRange);

module.exports = router;