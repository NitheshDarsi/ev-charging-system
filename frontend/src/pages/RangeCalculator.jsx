import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API from "../api";
import PageShell from "../components/PageShell";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import TrafficPolyline from "../components/TrafficPolyline";
import L from "leaflet";
import { getRouteSegments, getAdjustedStats, getTimeMultiplier } from "../utils/trafficEngine";

// Fix default icon issue with Leaflet in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function RangeCalculator() {
  const [battery, setBattery] = useState("");
  const [remainingRange, setRemainingRange] = useState("");
  const [result, setResult] = useState(null);
  const navigate = useNavigate();
  const [geo, setGeo] = useState({ lat: null, lon: null });
  const [geoError, setGeoError] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const fetchGeolocation = async () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(err.message || "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const calculate = async () => {
    if (geo.lat === null || geo.lon === null) {
      setGeoError(
        "Location is required for distance calculation. Click “Use my location” first."
      );
      return;
    }

    const res = await API.get("/station/range", {
      params: {
        battery,
        remainingRange,
        userLat: geo.lat,
        userLon: geo.lon,
      },
    });

    const data = res.data;
    if (data && data.stations) {
      // Prevent UI clutter by filtering out radically distant stations
      data.stations = data.stations.filter(s => s.distance <= data.currentRange + 7);
    }

    setResult(data);
    setRouteData(null); // Reset route on new search
  };

  const fetchRoute = async (destLat, destLng) => {
    if (geo.lat === null || geo.lon === null) return;
    setLoadingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${geo.lon},${geo.lat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        // Use our realistic traffic engine to adjust the duration
        const segments = getRouteSegments(coordinates);
        const stats = getAdjustedStats(route.duration / 60, route.distance / 1000, segments);

        setRouteData({
          coordinates,
          distance: stats.distance,
          duration: stats.duration,
          trafficLevel: stats.trafficLevel,
        });
        
        toast.success(`Route calculated: ${Math.round(stats.duration)} mins with ${stats.trafficLevel.toLowerCase()} traffic.`);
      } else {
        toast.error("No driving route found.");
      }
    } catch (err) {
      toast.error("Routing service unavailable.");
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <PageShell title="Range Calculator">
      <div style={{ maxWidth: "420px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ ...geoHintStyle, margin: "12px 0 0", width: "100%", boxSizing: "border-box" }}>
          This calculator uses your current location to estimate the distance to nearby stations.
        </p>
        {geoError ? <p style={{ ...geoErrorStyle, margin: "12px 0 0", width: "100%", boxSizing: "border-box" }}>{geoError}</p> : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px", width: "100%" }}>
          <button
            type="button"
            style={{ ...calcButtonStyle, margin: 0 }}
            onClick={fetchGeolocation}
            disabled={geoLoading}
          >
            {geoLoading ? "Getting location..." : "Use my location"}
          </button>

          <input
            placeholder="Battery %"
            onChange={(e) => setBattery(e.target.value)}
            style={{ ...inputStyle, margin: 0, boxSizing: "border-box" }}
          />

          <input
            placeholder="Remaining Range (km)"
            onChange={(e) => setRemainingRange(e.target.value)}
            style={{ ...inputStyle, margin: 0, boxSizing: "border-box" }}
          />

          <button style={{ ...calcButtonStyle, margin: 0 }} onClick={calculate} type="button">
            Calculate
          </button>
        </div>
      </div>

      {result && (
        <div style={{ paddingBottom: "20px", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <h3 style={resultTitleStyle}>Range: {result.currentRange} km</h3>
            <div style={{ 
              marginBottom: "8px", 
              fontSize: "0.85rem", 
              padding: "6px 12px", 
              borderRadius: "12px", 
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }}></div>
              <span style={{ color: "#94a3b8", fontWeight: 600 }}>Live Traffic: </span>
              <span style={{ color: "#fff", fontWeight: 800 }}>{getAdjustedStats(1, 1, []).trafficLevel}</span>
            </div>
          </div>

          {geo.lat !== null && geo.lon !== null && (
            <div style={{ height: "450px", width: "100%", maxWidth: "100%", marginTop: "20px", borderRadius: "16px", overflow: "hidden", zIndex: 0, position: "relative", border: "1px solid rgba(255,255,255,0.1)" }}>
              <MapContainer
                center={[geo.lat, geo.lon]}
                zoom={11}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* User Location (Red Pin) */}
                <Marker position={[geo.lat, geo.lon]} icon={userIcon}>
                  <Popup><strong>Your Location</strong></Popup>
                </Marker>
                
                {/* Range Circle */}
                <Circle
                  center={[geo.lat, geo.lon]}
                  radius={result.currentRange * 1000}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15 }}
                />

                {/* Station Markers */}
                {result.stations.map((s) => (
                  (s.lat && s.lng) ? (
                    <Marker key={s._id || s.id || Math.random()} position={[s.lat, s.lng]}>
                      <Popup>
                        <div style={{ color: '#000' }}>
                           <strong>{s.name}</strong><br/>
                           Status: {s.status === "under_work" ? "Under maintenance" : "Open"}<br/>
                           Direct Distance: {s.distance.toFixed ? s.distance.toFixed(2) : s.distance} km
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                ))}

                {/* Driving Route Polyline */}
                {routeData && (
                  <TrafficPolyline 
                    positions={routeData.coordinates} 
                    weight={6} 
                  />
                )}

                {/* Integrated Route Summary Overlay */}
                {routeData && (
                  <div style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    zIndex: 1000,
                    padding: "20px",
                    background: "rgba(15, 23, 42, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "20px",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.15)",
                    color: "#fff",
                    minWidth: "220px",
                    animation: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>Live Route Engine</div>
                      <div style={{ 
                        fontSize: 9, 
                        fontWeight: 900, 
                        padding: "2px 8px", 
                        borderRadius: "20px", 
                        background: routeData.trafficLevel === "Severe" ? "rgba(239, 68, 68, 0.2)" : 
                                   routeData.trafficLevel === "Heavy" ? "rgba(234, 88, 12, 0.2)" : 
                                   routeData.trafficLevel === "Moderate" ? "rgba(234, 179, 8, 0.2)" : "rgba(34, 197, 94, 0.2)",
                        color: routeData.trafficLevel === "Severe" ? "#f87171" : 
                               routeData.trafficLevel === "Heavy" ? "#fb923c" : 
                               routeData.trafficLevel === "Moderate" ? "#facc15" : "#4ade80",
                        border: "1px solid currentColor",
                        textTransform: "uppercase"
                      }}>
                        {routeData.trafficLevel} Traffic
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>Arrival</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                          <span style={{ fontSize: 28, fontWeight: 900, color: "#3b82f6", lineHeight: 1 }}>{Math.round(routeData.duration)}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8" }}>min</span>
                        </div>
                      </div>
                      
                      <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.1)" }}></div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>Distance</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                          <span style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{routeData.distance.toFixed(1)}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8" }}>km</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "#64748b", fontStyle: "italic" }}>
                      Real-time traffic calculation active • Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </MapContainer>
            </div>
          )}

          <h4 style={resultSubtitleStyle}>Charging Stations:</h4>
          <div style={gridStyle}>
            {result.stations.map(s => (
              <div key={s._id || s.id || Math.random()} style={cardStyle}>
                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{s.name}</h4>
                <div style={{ margin: "4px 0" }}>
                  <span style={badgeStyle(s.status === "open" ? "success" : "error")}>
                    {s.status === "open" ? "Open" : "Maintenance"}
                  </span>
                  <span style={badgeStyle(s.isReachable ? "success" : "error")}>
                    {s.isReachable ? "Reachable" : "Out of Range"}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#ccc", fontSize: "0.95rem", display: "flex", justifyContent: "space-between" }}>
                  <span>Distance: {s.distance.toFixed ? s.distance.toFixed(2) : s.distance} km</span>
                  <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>~{Math.round(s.distance * 2.5 * getTimeMultiplier() / 1.5)} min</span>
                </p>
                <p style={{ margin: 0, color: "#2dd4bf", fontSize: "0.95rem", fontWeight: 700 }}>
                  Price: ₹{s.pricePerHour || 250}/hr
                </p>
                {s.slots !== undefined && (
                  <p style={{ margin: 0, color: "#aaa", fontSize: "0.9rem", marginBottom: "8px" }}>
                    Available Slots: {s.slots}
                  </p>
                )}
                {s.status === "open" && s.isReachable && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                    <button
                      className="glass-btn"
                      style={{ padding: "8px 12px", fontSize: "0.85rem", flex: 1, background: "rgba(6, 182, 212, 0.2)", border: "1px solid rgba(6, 182, 212, 0.4)", color: "#fff" }}
                      onClick={() => fetchRoute(s.lat, s.lng)}
                      disabled={loadingRoute}
                    >
                      View Route
                    </button>
                    <button
                      className="glass-btn"
                      style={{ padding: "8px 12px", fontSize: "0.85rem", flex: 1 }}
                      onClick={() => navigate("/my-bookings", { state: { presetStationId: s._id || s.id, openAddTab: true } })}
                    >
                      Book Slot
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

const inputStyle = {
  width: "100%",
  maxWidth: "420px",
  padding: "12px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(229, 231, 235, 0.18)",
  background: "rgba(2, 6, 23, 0.55)",
  color: "#fff",
  margin: "10px 0 0",
  colorScheme: "dark"
};

const calcButtonStyle = {
  marginTop: "14px",
  border: "none",
  borderRadius: "14px",
  padding: "12px 14px",
  /* background: "linear-gradient(135deg, #3b82f6, #c084fc)", */
  background: "linear-gradient(135deg, #10b981, #3b82f6)",
  color: "#0b1220",
  fontWeight: 900,
  cursor: "pointer",
};

const resultTitleStyle = { margin: "16px 0 8px" };
const resultSubtitleStyle = { margin: "24px 0 12px" };
const resultTextStyle = { margin: "6px 0" };

const geoHintStyle = {
  margin: "12px 0 0",
  padding: "10px 12px",
  borderRadius: 12,
  /* background: "rgba(192, 132, 252, 0.12)", */
  /* border: "1px solid rgba(192, 132, 252, 0.32)", */
  background: "rgba(16, 185, 129, 0.12)",
  border: "1px solid rgba(16, 185, 129, 0.32)",
  textAlign: "left",
  color: "#fff",
  fontWeight: 700,
};

const geoErrorStyle = {
  margin: "12px 0 0",
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(239, 68, 68, 0.18)",
  border: "1px solid rgba(239, 68, 68, 0.4)",
  textAlign: "left",
  color: "#fff",
  fontWeight: 700,
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '24px',
  marginTop: '20px'
};

const cardStyle = {
  boxSizing: 'border-box',
  background: 'rgba(2, 6, 23, 0.8)',
  border: '1px solid rgba(229, 231, 235, 0.18)',
  borderRadius: '16px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  textAlign: 'left',
};

const badgeStyle = (type) => ({
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 700,
  background: type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
  color: type === 'success' ? '#4ade80' : '#f87171',
  border: `1px solid ${type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
  marginRight: '8px',
});