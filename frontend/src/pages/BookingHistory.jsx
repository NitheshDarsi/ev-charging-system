import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import API from "../api";
import PageShell from "../components/PageShell";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import TrafficPolyline from "../components/TrafficPolyline";
import L from "leaflet";

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

export default function BookingHistory() {
  const [activeTab, setActiveTab] = useState("history");
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    station: "",
    slotTime: "09:00",
    date: new Date().toISOString().slice(0, 10),
    duration: 1,
    paymentMethod: "UPI",
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  
  const [showMapModal, setShowMapModal] = useState(false);
  const [focusedBooking, setFocusedBooking] = useState(null);
  const [geo, setGeo] = useState({ lat: null, lon: null });
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  
  const location = useLocation();

  const fetchRouteForBooking = async (booking) => {
    const station = booking.station;
    if (!station || !station.lat || !station.lng) {
      toast.error("Station location is unknown.");
      return;
    }
    
    setFocusedBooking(booking);
    setShowMapModal(true);
    setRouteLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGeo({ lat, lon });
        
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${lon},${lat};${station.lng},${station.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRouteData({
              coordinates,
              distance: data.routes[0].distance / 1000,
              duration: data.routes[0].duration / 60,
            });
          } else {
            toast.error("No driving route found.");
          }
        } catch (err) {
          toast.error("Routing failed.");
        } finally {
          setRouteLoading(false);
        }
      },
      (err) => {
        setRouteLoading(false);
        toast.error("Could not get your location to show route.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (location.state?.openAddTab) {
      setActiveTab("add");
      if (location.state?.presetStationId) {
        setForm((prev) => ({ ...prev, station: location.state.presetStationId }));
      }
      window.history.replaceState({}, document.title);
    } else if (location.state?.openHistoryTab) {
      setActiveTab("history");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  async function fetchBookings() {
    try {
      const res = await API.get("/bookings/my");
      setBookings(res.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
      toast.error("Could not load bookings.");
    }
  }

  useEffect(() => {
    (async () => {
      // Initial load: bookings + stations
      try {
        const res = await API.get("/bookings/my");
        setBookings(res.data);
      } catch (err) {
        console.log(err.response?.data || err.message);
        toast.error("Could not load bookings.");
      }

      try {
        const res = await API.get("/stations");
        const stationList = Array.isArray(res.data) ? res.data : [];
        setStations(
          stationList.filter((s) => (s?._id || s?.id) && s?.name)
        );
      } catch (err) {
        console.log(err.response?.data || err.message);
        setStations([]);
      }
    })();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectedStation =
    stations.find(
      (s) => String(s?._id || s?.id) === String(form.station)
    ) || null;

  const selectedStationStatus = selectedStation?.status || "open";
  const isSelectedStationUnderWork = selectedStationStatus === "under_work";

  const handleCreateBooking = (e) => {
    if (e) e.preventDefault();
    setShowCheckout(true);
  };

  const handleFinalSubmit = async () => {
    setIsPaying(true);
    // Simulate real network delay for payment verification
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const isEdit = activeTab === "edit";
      const isInstantPay = form.paymentMethod === "UPI";
      
      const payload = { 
        ...form, 
        paymentStatus: isInstantPay ? "paid" : "pending" 
      };

      if (isEdit) {
        await API.put(`/bookings/${editingId}`, payload);
        toast.success(isInstantPay ? "Payment verified! Booking updated." : "Booking updated. Please pay upon arrival.");
      } else {
        await API.post("/bookings", payload);
        toast.success(isInstantPay ? "Payment successful! Slot reserved." : "Slot reserved! Pending payment.");
      }
      
      setForm((prev) => ({ ...prev, date: "" }));
      fetchBookings();
      setShowCheckout(false);
      setActiveTab("history");
    } catch (err) {
      const body = err.response?.data;
      toast.error(body?.message || err.message || "Action failed.");
    } finally {
      setIsPaying(false);
    }
  };

  const handleStartEdit = (booking) => {
    const stationId = booking?.station?._id || booking?.station;
    setEditingId(booking._id);
    setForm({
      station: stationId || "",
      slotTime: booking.slotTime || "",
      date: booking.date ? String(booking.date).slice(0, 10) : "",
      duration: booking.duration || 1,
    });
    setActiveTab("edit");
  };

  const handleUpdateBooking = (e) => {
    if (e) e.preventDefault();
    setShowCheckout(true);
  };

  const handleDeleteBooking = async (bookingId) => {
    const ok = window.confirm("Are you sure you want to delete this booking?");
    if (!ok) return;

    try {
      await API.delete(`/bookings/${bookingId}`);
      toast.success("Booking deleted successfully.");
      if (editingId === bookingId) setEditingId(null);
      fetchBookings();
      setActiveTab("history");
    } catch (err) {
      const body = err.response?.data;
      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to delete booking.";
      toast.error(apiMessage);
    }
  };

  return (
    <PageShell title="My Bookings">
      <div style={panelStyle}>
        <div style={tabRowStyle}>
          <button
            className={`glass-tab ${activeTab === "add" ? "active" : ""}`}
            onClick={() => {
              setEditingId(null);
              setActiveTab("add");
            }}
          >
            Add Booking Slot
          </button>
          <button
            className={`glass-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              setEditingId(null);
              setActiveTab("history");
            }}
          >
            My Bookings
          </button>
          <button
            className={`glass-tab ${activeTab === "nearby" ? "active" : ""}`}
            onClick={() => {
              setEditingId(null);
              setActiveTab("nearby");
              if (!geo.lat) {
                 navigator.geolocation.getCurrentPosition(
                    (pos) => setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                    (err) => console.log("Map geolocation rejected", err)
                 );
              }
            }}
          >
            Find Nearby EV Charging Stations
          </button>
          {editingId && (
            <button
              className={`glass-tab ${activeTab === "edit" ? "active" : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              Edit Booking
            </button>
          )}
        </div>

        {activeTab === "history" && (
          bookings.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyStateTitleStyle}>No bookings yet</div>
              <div style={emptyStateTextStyle}>
                Add a booking slot to start managing your EV reservations.
              </div>
            </div>
          ) : (
            <div className="bookings-grid">
              {bookings.map((b) => (
                <div key={b._id} style={cardStyle}>
                  <div style={cardTopRowStyle}>
                    <h3 style={cardTitleStyle}>
                      {b.station?.name || "N/A"}
                    </h3>
                    
                    <span
                      style={{
                        ...badgeStyle,
                        background:
                          b.station?.status === "under_work"
                            ? "rgba(239, 68, 68, 0.18)"
                            : "rgba(34, 197, 94, 0.18)",
                        borderColor:
                          b.station?.status === "under_work"
                            ? "rgba(239, 68, 68, 0.45)"
                            : "rgba(34, 197, 94, 0.45)",
                      }}
                    >
                      {b.station?.status === "under_work"
                        ? "Maintenance"
                        : "Open"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "12px 0 16px" }}>
                    <div style={cardDetailBoxStyle}>
                      <span style={{ opacity: 0.7 }}>Slot:</span>
                      <span style={{ color: '#93c5fd', marginLeft: "8px" }}>{b.slotTime}</span>
                    </div>
                    <div style={cardDetailBoxStyle}>
                      <span style={{ opacity: 0.7 }}>Date:</span>
                      <span style={{ color: '#93c5fd', marginLeft: "8px" }}>{new Date(b.date).toLocaleDateString()}</span>
                    </div>
                    <div style={cardDetailBoxStyle}>
                      <span style={{ opacity: 0.7 }}>Payment:</span>
                      <span style={{ color: '#2dd4bf', marginLeft: "8px", fontWeight: 900 }}>{b.paymentMethod || "Pending"}</span>
                    </div>
                  </div>

                  <div style={actionRowStyle}>
                    <button
                      type="button"
                      className="glass-btn"
                      style={{ padding: "10px", fontSize: "0.85rem", flex: 1, background: "rgba(6, 182, 212, 0.2)", border: "1px solid rgba(6, 182, 212, 0.4)", color: "#fff" }}
                      onClick={() => fetchRouteForBooking(b)}
                    >
                      View Route
                    </button>
                    <button
                      type="button"
                      className="btn-edit"
                      style={{ flex: 1 }}
                      onClick={() => handleStartEdit(b)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      style={{ flex: 1 }}
                      onClick={() => handleDeleteBooking(b._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {(activeTab === "add" || activeTab === "edit") && (
          <form
            onSubmit={
              activeTab === "edit" ? handleUpdateBooking : handleCreateBooking
            }
            style={formStyle}
          >
            <div style={formHeaderStyle}>
              <div style={formHeaderTitleStyle}>
                {activeTab === "edit" ? "Edit Booking" : "Add Booking Slot"}
              </div>
              <div style={formHeaderSubStyle}>
                Choose a station, pick an hour, and select a date.
              </div>
            </div>

            <label style={labelStyle}>
              Station
              <select
                name="station"
                value={form.station}
                onChange={handleFormChange}
                className="glass-input"
                required
              >
                <option value="">Select a station</option>
                {stations.map((station) => (
                  <option
                    key={station._id || station.id}
                    value={station._id || station.id}
                  >
                    {station.name}
                  </option>
                ))}
              </select>
            </label>

            <div
              style={{
                ...stationBannerBaseStyle,
                background:
                  selectedStationStatus === "under_work"
                    ? "rgba(239, 68, 68, 0.12)"
                    : "rgba(34, 197, 94, 0.10)",
              }}
            >
              <div style={stationBannerLabelStyle}>Station status</div>
              <div style={stationBannerValueStyle}>
                {selectedStationStatus === "under_work"
                  ? "Under maintenance (cannot book)"
                  : "Open"}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "space-between" }}>
              <label style={{ ...labelStyle, flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 700 }}>Date</span>
                <VerticalWheelScroller 
                  items={upcomingDates} 
                  selectedValue={form.date} 
                  onSelect={(val) => setForm(prev => ({ ...prev, date: val }))} 
                />
              </label>

              <label style={{ ...labelStyle, flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 700 }}>Time</span>
                <VerticalWheelScroller 
                  items={slotTimesData} 
                  selectedValue={form.slotTime} 
                  onSelect={(val) => setForm(prev => ({ ...prev, slotTime: val }))} 
                />
              </label>

              <label style={{ ...labelStyle, flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 700 }}>Duration</span>
                <VerticalWheelScroller 
                  items={durationData} 
                  selectedValue={form.duration} 
                  onSelect={(val) => setForm(prev => ({ ...prev, duration: val }))} 
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSelectedStationUnderWork}
              className="glass-btn"
            >
              {activeTab === "edit" ? "Update & Pay" : "Review & Pay"}
            </button>

            {stations.length === 0 ? (
              <p style={helperTextStyle}>
                Run backend seed once to load stations before booking.
              </p>
            ) : null}
          </form>
        )}

        {activeTab === "nearby" && (
           <div style={{ padding: "16px", background: "rgba(2, 6, 23, 0.45)", borderRadius: "16px", border: "1px solid rgba(229, 231, 235, 0.14)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                 <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>Nearby Stations</h2>
                 <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8" }}>Select a station pin to book immediately.</p>
              </div>
              <div style={{ height: "500px", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                 <MapContainer
                   key={geo.lat ? "geo-loaded" : "no-geo"}
                   center={geo.lat ? [geo.lat, geo.lon] : [20.5937, 78.9629]}
                   zoom={geo.lat ? 12 : 5}
                   style={{ height: "100%", width: "100%", zIndex: 0 }}
                 >
                   <TileLayer
                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                     attribution='&copy; OpenStreetMap'
                   />
                   {geo.lat && geo.lon && (
                     <Marker position={[geo.lat, geo.lon]} icon={userIcon}>
                       <Popup><strong>Your Location</strong></Popup>
                     </Marker>
                   )}
                   {stations.map(s => (
                     (s.lat && s.lng && s.status !== "under_work") ? (
                        <Marker key={s._id || s.id} position={[s.lat, s.lng]}>
                          <Popup autoPan={true}>
                             <div style={{ textAlign: "center", padding: "4px" }}>
                                <div style={{ fontSize: "1rem", fontWeight: 900, marginBottom: "8px", color: "#000" }}>{s.name}</div>
                                <div style={{ marginBottom: "12px", fontSize: "0.9rem", color: "#3b82f6", fontWeight: 700 }}>₹{s.pricePerHour || 250}/hr</div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setForm(prev => ({ ...prev, station: s._id || s.id }));
                                    setActiveTab("add");
                                  }}
                                  style={{
                                    background: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 800, cursor: "pointer", width: "100%"
                                  }}
                                >
                                  Book Slot
                                </button>
                             </div>
                          </Popup>
                        </Marker>
                     ) : null
                   ))}
                 </MapContainer>
              </div>
           </div>
        )}
      </div>

      {showCheckout && (
        <div style={modalOverlayStyle}>
          <div style={checkoutCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontWeight: 1000, fontSize: 22 }}>Secure Checkout</h3>
              <button 
                onClick={() => setShowCheckout(false)} 
                style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: 24, padding: 0 }}
              >
                &times;
              </button>
            </div>

            <div style={orderSummaryStyle}>
              <div style={{ opacity: 0.7, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Order Summary</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 700 }}>{selectedStation?.name || "EV Charging Station"}</span>
                <span>₹{(selectedStation?.pricePerHour || 250) * form.duration}.00</span>
              </div>
              <div style={{ fontSize: 13, color: "#93c5fd", marginBottom: 4 }}>
                Slot: {form.slotTime} ({form.duration} hours @ ₹{selectedStation?.pricePerHour || 250}/hr)
              </div>
              <div style={{ fontSize: 13, color: "#93c5fd" }}>Date: {form.date}</div>
            </div>

            <div style={{ margin: "24px 0" }}>
              <span style={{ fontSize: 12, fontWeight: 900, marginBottom: 12, display: "block" }}>Payment Method</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { id: "UPI", label: "Instant UPI Pay", icon: "📱" },
                  { id: "Cash", label: "Cash (Pay at Station)", icon: "💵" },
                  { id: "Pay After Charging", label: "Pay After Charging", icon: "⏳" }
                ].map((m) => (
                  <div 
                    key={m.id}
                    onClick={() => setForm({ ...form, paymentMethod: m.id })}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      background: form.paymentMethod === m.id ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${form.paymentMethod === m.id ? "#3b82f6" : "rgba(255, 255, 255, 0.1)"}`,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "all 0.2s"
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <span style={{ fontWeight: form.paymentMethod === m.id ? 700 : 400, fontSize: 14 }}>{m.label}</span>
                    {form.paymentMethod === m.id && <span style={{ marginLeft: "auto", color: "#3b82f6" }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleFinalSubmit} 
              disabled={isPaying} 
              className="glass-btn"
              style={{ padding: "16px", fontSize: 16 }}
            >
              {isPaying ? "Confirming..." : form.paymentMethod === "UPI" ? `Pay ₹${(selectedStation?.pricePerHour || 250) * form.duration}.00 Now` : "Confirm Reservation"}
            </button>
            
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#666" }}>
              <span style={{ verticalAlign: "middle", marginRight: 4 }}>{form.paymentMethod === "UPI" ? "🔒" : "🛡️"}</span>
              {form.paymentMethod === "UPI" ? "Secure SSL Encrypted Transaction" : "Secure Reservation Guaranteed"}
            </div>
          </div>
        </div>
      )}

      {showMapModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...checkoutCardStyle, maxWidth: 800, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 1000, fontSize: 20 }}>Route to {focusedBooking?.station?.name}</h3>
              <button 
                onClick={() => { setShowMapModal(false); setRouteData(null); }} 
                style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: 24, padding: 0 }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ height: 400, width: "100%", borderRadius: 16, overflow: "hidden", position: "relative", background: "#000" }}>
              {routeLoading && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, background: "rgba(0,0,0,0.5)", color: "#fff" }}>
                  Calculating route...
                </div>
              )}
              {focusedBooking?.station?.lat && focusedBooking?.station?.lng && (
                <MapContainer
                  center={[focusedBooking.station.lat, focusedBooking.station.lng]}
                  zoom={12}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <Marker position={[focusedBooking.station.lat, focusedBooking.station.lng]}>
                    <Popup><strong>{focusedBooking.station.name}</strong></Popup>
                  </Marker>
                  {geo.lat && geo.lon && (
                    <Marker position={[geo.lat, geo.lon]} icon={userIcon}>
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}
                  {routeData && (
                    <TrafficPolyline positions={routeData.coordinates} weight={6} opacity={0.9} />
                  )}
                  {routeData && (
                  <div style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    zIndex: 1000,
                    padding: "16px 20px",
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(96, 165, 250, 0.3)",
                    borderRadius: "16px",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 12px 24px -5px rgba(0, 0, 0, 0.5)",
                    color: "#fff",
                  }}>
                    <div style={{ fontSize: 11, color: "#93c5fd", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Route Stats</div>
                    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: "#3b82f6", lineHeight: 1 }}>{Math.round(routeData.duration)}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8" }}>MINS</span>
                      </div>
                      <div style={{ width: "2px", height: "30px", background: "rgba(255,255,255,0.1)", borderRadius: "2px" }}></div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{routeData.distance.toFixed(1)}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8" }}>KM</span>
                      </div>
                    </div>
                  </div>
                  )}
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

const slotTimesData = Array.from({ length: 24 }, (_, h) => {
  const val = `${String(h).padStart(2, "0")}:00`;
  return { value: val, label: val };
});

const durationData = [1, 2, 3, 4, 5].map(h => ({
  value: h, 
  label: `${h} hour${h > 1 ? "s" : ""}`
}));

const upcomingDates = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return {
    value: d.toISOString().slice(0, 10),
    label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  };
});

const VerticalWheelScroller = ({ items, selectedValue, onSelect }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current) {
      const index = items.findIndex(i => i.value === selectedValue || String(i.value) === String(selectedValue));
      if (index >= 0) {
        containerRef.current.scrollTo({ top: index * 40, behavior: 'instant' });
      }
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      onScroll={(e) => {
        const el = e.target;
        const index = Math.round(el.scrollTop / 40);
        if (items[index] && items[index].value !== selectedValue && String(items[index].value) !== String(selectedValue)) {
          onSelect(items[index].value);
        }
      }}
      style={{
        height: "120px",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none", 
        msOverflowStyle: "none",
        border: "1px solid rgba(229, 231, 235, 0.18)",
        borderRadius: "14px",
        background: "rgba(2, 6, 23, 0.4)",
        position: "relative",
        padding: "40px 0",
        boxSizing: "border-box"
      }}
      className="noscrollbar"
    >
      <style>{`.noscrollbar::-webkit-scrollbar { display: none; }`}</style>
      {items.map((item, idx) => {
        const isSelected = selectedValue === item.value || selectedValue === String(item.value);
        return (
          <div
            key={item.value}
            onClick={() => {
               onSelect(item.value);
               containerRef.current.scrollTo({ top: idx * 40, behavior: 'smooth' });
            }}
            style={{
              height: "40px",
              scrollSnapAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isSelected ? "#3b82f6" : "rgba(203, 213, 225, 0.3)",
              fontWeight: isSelected ? 900 : 500,
              fontSize: isSelected ? "1.15rem" : "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {item.label}
          </div>
        );
      })}
      
      {/* Center highlight guide */}
      <div style={{
        position: "absolute",
        top: "40px",
        left: 0,
        right: 0,
        height: "40px",
        borderTop: "1px solid rgba(59, 130, 246, 0.3)",
        borderBottom: "1px solid rgba(59, 130, 246, 0.3)",
        background: "rgba(59, 130, 246, 0.05)",
        pointerEvents: "none"
      }}></div>
    </div>
  );
};

const cardStyle = {
  boxSizing: "border-box",
  border: "1px solid rgba(229, 231, 235, 0.14)",
  padding: "16px",
  borderRadius: "16px",
  background: "rgba(2, 6, 23, 0.45)",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  display: "flex",
  flexDirection: "column",
};

const tabRowStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "14px",
  justifyContent: "center",
  flexWrap: "wrap",
};



const formStyle = {
  maxWidth: "420px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};



const actionRowStyle = {
  marginTop: "auto",
  paddingTop: "12px",
  display: "flex",
  gap: "10px",
};




const panelStyle = {
  boxSizing: "border-box",
  width: "100%",
  padding: 18,
  borderRadius: 18,
  border: "1px solid rgba(229, 231, 235, 0.12)",
  background: "rgba(2, 6, 23, 0.18)",
};



const emptyStateStyle = {
  borderRadius: 18,
  padding: 18,
  border: "1px dashed rgba(229, 231, 235, 0.22)",
  background: "rgba(2, 6, 23, 0.18)",
  textAlign: "left",
};

const emptyStateTitleStyle = {
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 6,
};

const emptyStateTextStyle = {
  color: "var(--text)",
  fontWeight: 600,
  lineHeight: 1.5,
};

const cardTopRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 6,
};

const cardTitleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
  textAlign: "left",
  background: "linear-gradient(135deg, #fff, #93c5fd)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textShadow: "0 2px 10px rgba(147, 197, 253, 0.2)",
};

const cardDetailBoxStyle = {
  display: "inline-flex",
  alignItems: "center",
  background: "rgba(147, 197, 253, 0.08)",
  border: "1px solid rgba(147, 197, 253, 0.15)",
  padding: "6px 12px",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontWeight: 800,
  fontSize: "14px",
  letterSpacing: "0.5px",
  width: "fit-content",
};

const cardTextStyle = {
  margin: "6px 0",
  color: "var(--text-h)",
  fontWeight: 700,
  textAlign: "left",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(229, 231, 235, 0.18)",
  color: "#fff",
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap",
};

const formHeaderStyle = {
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(229, 231, 235, 0.12)",
  background: "rgba(2, 6, 23, 0.22)",
};

const formHeaderTitleStyle = {
  fontSize: 18,
  fontWeight: 1000,
  marginBottom: 6,
};

const formHeaderSubStyle = {
  color: "var(--text)",
  fontWeight: 700,
  lineHeight: 1.45,
  fontSize: 13,
};

const stationBannerBaseStyle = {
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(229, 231, 235, 0.12)",
};

const stationBannerLabelStyle = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: 0.2,
  opacity: 0.9,
};

const stationBannerValueStyle = {
  marginTop: 6,
  fontSize: 14,
  fontWeight: 900,
};

const helperTextStyle = {
  marginTop: 8,
  color: "var(--text)",
  fontWeight: 700,
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.8)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const checkoutCardStyle = {
  width: "100%",
  maxWidth: 440,
  background: "rgba(10, 15, 30, 0.95)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: 24,
  padding: 32,
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
};

const orderSummaryStyle = {
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  borderRadius: 16,
  padding: 16,
};

const cardInputStyle = {
  background: "rgba(0, 0, 0, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 12,
  padding: "12px 16px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: 14,
  letterSpacing: 2,
};
