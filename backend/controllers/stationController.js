const Station = require("../models/Station");
const fallbackStations = require("../data/stations");

// Haversine distance (km)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius (km)

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Get all stations
exports.getStations = async (req, res) => {
  try {
    const stations = await Station.find().lean();

    if (stations.length > 0) {
      // Ensure older records still return a status for UI/validations
      const normalized = stations.map((s) => ({
        ...s,
        status: s.status || "open",
      }));
      return res.json(normalized);
    }

    return res.json(fallbackStations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Book slot (basic version)
exports.bookSlot = (req, res) => {
  const { id } = req.body;
  const stations = fallbackStations;

  const station = stations.find(s => s.id === id);

  if (!station) {
    return res.status(404).json({ message: "Station not found" });
  }

  if (station.slots > 0) {
    station.slots -= 1;
    res.json({ message: "Slot booked successfully", station });
  } else {
    res.json({ message: "No slots available" });
  }
};

// ✅ RANGE CALCULATOR (Haversine, using Mongo lat/lng)
exports.getStationsInRange = async (req, res) => {
  const { battery, remainingRange, userLat, userLon } = req.query;

  // The distance we can travel is simply the remaining range provided by the user
  const currentRange = Number(remainingRange) || 0;

  // Use MongoDB stations if present, otherwise fallback to demo data
  let stations = await Station.find().lean();
  if (!Array.isArray(stations) || stations.length === 0) {
    stations = fallbackStations;
  }

  const userLatNum =
    userLat !== undefined && userLat !== null && userLat !== ""
      ? Number(userLat)
      : null;
  const userLonNum =
    userLon !== undefined && userLon !== null && userLon !== ""
      ? Number(userLon)
      : null;

  const stationsWithDistance = stations
    .map((s) => {
      // Ensure older records still return a status for UI/validations
      const status = s.status || "open";
      
      // Prefer computed distance from coordinates when user coordinates exist
      if (
        userLatNum !== null &&
        userLonNum !== null &&
        s.lat !== undefined &&
        s.lng !== undefined
      ) {
        const dist = getDistance(userLatNum, userLonNum, Number(s.lat), Number(s.lng));
        return { ...s, distance: dist, status, isReachable: dist <= currentRange };
      }

      // Fallback to existing `distance` field if present in demo data
      if (typeof s.distance === "number") {
        return { ...s, distance: s.distance, status, isReachable: s.distance <= currentRange };
      }

      return null;
    })
    .filter(Boolean);

  // Sort by distance (closest first)
  stationsWithDistance.sort((a, b) => a.distance - b.distance);

  res.json({
    currentRange,
    stations: stationsWithDistance,
  });
};
