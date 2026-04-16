import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import API from "../api";
import PageShell from "../components/PageShell";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function AdminBookings() {
  const [activeTab, setActiveTab] = useState("list");
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    station: "",
    slotTime: "09:00",
    date: "",
  });

  const chartData = useMemo(() => {
    const counts = {};
    bookings.forEach((b) => {
      const name = b.station?.name || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.keys(counts).map((name) => ({
      name,
      bookings: counts[name],
    }));
  }, [bookings]);

  // const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
  const CHART_COLORS = ["#10b981", "#3b82f6", "#34d399", "#60a5fa", "#059669"];

  const slotTimes = useMemo(
    () => Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`),
    []
  );

  async function fetchBookings() {
    try {
      const res = await API.get("/bookings/admin");
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(`Failed to load admin bookings. ${err.response?.data?.message || err.message}`);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/bookings/admin");
        setBookings(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error(`Failed to load admin bookings. ${err.response?.data?.message || err.message}`);
      }

      try {
        const res = await API.get("/stations");
        const stationList = Array.isArray(res.data) ? res.data : [];
        setStations(
          stationList.filter((s) => (s?._id || s?.id) && s?.name)
        );
      } catch {
        setStations([]);
      }
    })();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectedStation = useMemo(() => {
    return (
      stations.find(
        (s) => String(s?._id || s?.id) === String(form.station)
      ) || null
    );
  }, [stations, form.station]);

  const selectedStationStatus = selectedStation?.status || "open";
  const isSelectedStationUnderWork = selectedStationStatus === "under_work";

  const handleStartReschedule = (booking) => {
    const stationId = booking?.station?._id || booking?.station;
    setEditingId(booking._id);
    setForm({
      station: stationId || "",
      slotTime: booking.slotTime || "",
      date: booking.date ? String(booking.date).slice(0, 10) : "",
    });
    setActiveTab("edit");
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/bookings/${editingId}`, form);
      toast.success("Booking rescheduled successfully.");
      setEditingId(null);
      fetchBookings();
      setActiveTab("list");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to reschedule booking."
      );
    }
  };

  const handleMarkPaid = async (bookingId) => {
    try {
      await API.put(`/bookings/${bookingId}/pay`);
      toast.success("Booking marked as paid.");
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as paid.");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    const ok = window.confirm("Delete this booking? This cannot be undone.");
    if (!ok) return;

    try {
      await API.delete(`/bookings/${bookingId}`);
      toast.success("Booking deleted successfully.");
      fetchBookings();
      if (editingId === bookingId) setEditingId(null);
      setActiveTab("list");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to delete booking."
      );
    }
  };

  return (
    <PageShell title="Admin Bookings">

      <div style={tabRowStyle}>
        <button
          className={`glass-tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`glass-tab ${activeTab === "map" ? "active" : ""}`}
          onClick={() => {
            setEditingId(null);
            setActiveTab("map");
          }}
        >
          Map View
        </button>
        <button
          className={`glass-tab ${activeTab === "list" ? "active" : ""}`}
          onClick={() => {
            setEditingId(null);
            setActiveTab("list");
          }}
        >
          All Bookings
        </button>
        {editingId && (
          <button
            className={`glass-tab ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            Reschedule
          </button>
        )}
      </div>



      {activeTab === "dashboard" && (
        <div style={dashboardWrapStyle}>
          <div style={chartCardStyle}>
            <h3 style={{ ...cardTitleStyle, marginBottom: 24, fontSize: 20 }}>
              Station Utilization
            </h3>
            <div style={{ height: 350, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(15, 23, 42, 0.9)", 
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)"
                    }}
                    itemStyle={{ color: "#fff", fontWeight: 700 }}
                  />
                  <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Bookings</div>
              <div style={statValueStyle}>{bookings.length}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Active Stations</div>
              <div style={statValueStyle}>{stations.length}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Revenue (Est.)</div>
              <div style={statValueStyle}>
                ₹{bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "map" && (
         <div style={{ padding: "16px", background: "rgba(2, 6, 23, 0.45)", borderRadius: "16px", border: "1px solid rgba(229, 231, 235, 0.14)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
               <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>Station Live Map</h2>
               <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8" }}>
                 <span style={{ color: "#34d399", fontWeight: "bold" }}>● Green (Free)</span> | <span style={{ color: "#ef4444", fontWeight: "bold" }}>● Red (Booked)</span> | <span style={{ color: "#9ca3af", fontWeight: "bold" }}>● Grey (Maintenance)</span>
               </p>
            </div>
            <div style={{ height: "600px", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
               <MapContainer
                 center={[20.5937, 78.9629]}
                 zoom={5}
                 style={{ height: "100%", width: "100%", zIndex: 0 }}
               >
                 <TileLayer
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                   attribution='&copy; OpenStreetMap'
                 />
                 {stations.map(s => {
                   if (!s.lat || !s.lng) return null;
                   const stationBookings = bookings.filter(b => (b.station?._id || b.station) === (s._id || s.id));
                   
                   let icon = greenIcon;
                   let statusText = "Available";
                   
                   if (s.status === "under_work") {
                     icon = greyIcon;
                     statusText = "Maintenance";
                   } else if (stationBookings.length > 0) {
                     icon = redIcon;
                     statusText = "Booked";
                   }
                   
                   return (
                      <Marker key={s._id || s.id} position={[s.lat, s.lng]} icon={icon}>
                        <Popup autoPan={true}>
                           <div style={{ textAlign: "center", padding: "4px", minWidth: "150px" }}>
                              <div style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: "4px", color: "#000" }}>{s.name}</div>
                              <div style={{ marginBottom: "12px", fontSize: "0.85rem", color: s.status === "under_work" ? "#6b7280" : (stationBookings.length > 0 ? "#ef4444" : "#10b981"), fontWeight: 800, textTransform: "uppercase" }}>
                                {statusText}
                              </div>
                              {stationBookings.length > 0 && (
                                <div style={{ textAlign: "left", background: "#f1f5f9", padding: "8px", borderRadius: "6px", maxHeight: "150px", overflowY: "auto" }}>
                                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#64748b", marginBottom: "4px" }}>UPCOMING BOOKINGS:</div>
                                  {stationBookings.map((b) => (
                                    <div key={b._id} style={{ fontSize: "0.85rem", color: "#0f172a", marginBottom: "6px", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                                      <strong>{new Date(b.date).toLocaleDateString()}</strong> at <strong style={{ color: "#3b82f6" }}>{b.slotTime}</strong>
                                      <br/>
                                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>By: {b.user?.name || "Unknown"} ({b.paymentStatus})</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                           </div>
                        </Popup>
                      </Marker>
                   );
                 })}
               </MapContainer>
            </div>
         </div>
      )}

      {activeTab === "list" ? (
        bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <div style={gridStyle}>
            {bookings.map((b) => (
              <div key={b._id} style={cardStyle}>
                <div style={cardTopRowStyle}>
                  <h3 style={cardTitleStyle}>
                    Station: {b.station?.name || "N/A"}
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
                    <span style={{ opacity: 0.7 }}>Price:</span>
                    <span style={{ color: '#fbbf24', marginLeft: "8px" }}>₹{b.totalPrice || 0}</span>
                  </div>
                  <div style={cardDetailBoxStyle}>
                    <span style={{ opacity: 0.7 }}>Method:</span>
                    <span style={{ color: '#10b981', marginLeft: "8px" }}>{b.paymentMethod || "UPI"}</span>
                  </div>
                  <div style={cardDetailBoxStyle}>
                    <span style={{ opacity: 0.7 }}>Paid:</span>
                    <span style={{ color: b.paymentStatus === "paid" ? '#10b981' : '#ef4444', marginLeft: "8px" }}>
                      {b.paymentStatus === "paid" ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                
                <div style={userBannerStyle}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 4 }}>Booked By:</div>
                  <div style={{ fontWeight: 700 }}>{b.user?.name || "N/A"}</div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>{b.user?.email || "No email"}</div>
                </div>

                <div style={actionRowStyle}>
                  {b.paymentStatus !== "paid" && (
                    <button
                      type="button"
                      className="glass-btn"
                      style={{ flex: 1, background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#fff", fontSize: 13 }}
                      onClick={() => handleMarkPaid(b._id)}
                    >
                      Mark Paid
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-edit"
                    style={{ flex: 1 }}
                    onClick={() => handleStartReschedule(b)}
                  >
                    Reschedule
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
      ) : (
        <form onSubmit={handleUpdateBooking} style={formStyle}>
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

          <p>
            Selected station:{" "}
            {isSelectedStationUnderWork
              ? "Under maintenance (cannot reschedule)"
              : "Open"}
          </p>

          <label style={labelStyle}>
            Slot Time
            <select
              name="slotTime"
              value={form.slotTime}
              onChange={handleFormChange}
              className="glass-input"
              required
            >
              {slotTimes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Date
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleFormChange}
              className="glass-input"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSelectedStationUnderWork}
            className="glass-btn"
          >
            Update Booking
          </button>
        </form>
      )}
    </PageShell>
  );
}

const cardStyle = {
  boxSizing: "border-box",
  border: "1px solid rgba(229, 231, 235, 0.14)",
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(2, 6, 23, 0.45)",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  display: "flex",
  flexDirection: "column",
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '16px',
};

const userBannerStyle = {
  marginTop: '10px',
  padding: '10px 12px',
  background: 'rgba(59, 130, 246, 0.1)',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  borderRadius: '12px',
  textAlign: 'left'
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
  fontSize: 16,
  fontWeight: 900,
  lineHeight: 1.3,
  textAlign: "left",
  /* background: "linear-gradient(135deg, #fff, #93c5fd)", */
  background: "linear-gradient(135deg, #fff, #34d399)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  /* textShadow: "0 2px 10px rgba(147, 197, 253, 0.2)", */
  textShadow: "0 2px 10px rgba(52, 211, 153, 0.2)",
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
  margin: "4px 0",
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

const tabRowStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px",
  justifyContent: "center",
  flexWrap: "wrap",
};



const formStyle = {
  maxWidth: "520px",
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
  flexWrap: "wrap",
};

const dashboardWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  marginTop: "10px",
};

const chartCardStyle = {
  padding: "24px",
  borderRadius: "24px",
  background: "rgba(2, 6, 23, 0.3)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
};

const statCardStyle = {
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(2, 6, 23, 0.45)",
  border: "1px solid rgba(59, 130, 246, 0.15)",
  textAlign: "center",
};

const statLabelStyle = {
  fontSize: "13px",
  fontWeight: 800,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "8px",
};

const statValueStyle = {
  fontSize: "28px",
  fontWeight: 1000,
  /* background: "linear-gradient(135deg, #fff, #93c5fd)", */
  background: "linear-gradient(135deg, #fff, #34d399)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};



