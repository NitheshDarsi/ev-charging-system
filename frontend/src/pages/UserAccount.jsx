import { useEffect, useState, useMemo } from "react";
import PageShell from "../components/PageShell";
import API from "../api";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const IN_EV_CAR_DB = {
  "Tata Motors": [
    { model: "Nexon EV Empowered+", hp: 143, torque: 215, battery: 40.5, range: 465, isHybrid: false },
    { model: "Nexon EV Creative", hp: 127, torque: 215, battery: 30.0, range: 325, isHybrid: false },
    { model: "Punch EV Long Range", hp: 120, torque: 190, battery: 35.0, range: 421, isHybrid: false },
    { model: "Tiago EV Long Range", hp: 74, torque: 114, battery: 24.0, range: 315, isHybrid: false },
    { model: "Tigor EV", hp: 74, torque: 170, battery: 26.0, range: 315, isHybrid: false },
    { model: "Curvv EV 55", hp: 165, torque: 215, battery: 55.0, range: 585, isHybrid: false },
  ],
  "MG Motor": [
    { model: "ZS EV Excite", hp: 174, torque: 280, battery: 50.3, range: 461, isHybrid: false },
    { model: "Comet EV", hp: 41, torque: 110, battery: 17.3, range: 230, isHybrid: false },
  ],
  "Mahindra": [
    { model: "XUV400 EL Pro", hp: 148, torque: 310, battery: 39.4, range: 456, isHybrid: false },
    { model: "XUV400 EC Pro", hp: 148, torque: 310, battery: 34.5, range: 375, isHybrid: false },
  ],
  "BYD": [
    { model: "Atto 3", hp: 201, torque: 310, battery: 60.48, range: 521, isHybrid: false },
    { model: "Seal Premium", hp: 308, torque: 360, battery: 82.5, range: 650, isHybrid: false },
    { model: "Sealion 7", hp: 308, torque: 380, battery: 82.5, range: 570, isHybrid: false },
    { model: "Sealion 6 (PHEV)", hp: 324, torque: 300, battery: 18.3, range: 100, gasRange: 950, isHybrid: true, engineHp: 130, evHp: 194 },
    { model: "e6", hp: 94, torque: 180, battery: 71.7, range: 520, isHybrid: false },
  ],
  "Hyundai": [
    { model: "Ioniq 5", hp: 214, torque: 350, battery: 72.6, range: 631, isHybrid: false },
    { model: "Kona Electric", hp: 134, torque: 395, battery: 39.2, range: 452, isHybrid: false },
    { model: "Tucson Plug-in Hybrid", hp: 261, torque: 350, battery: 13.8, range: 53, gasRange: 550, isHybrid: true, engineHp: 180, evHp: 90 },
  ],
  "Kia": [
    { model: "EV6 GT-Line", hp: 320, torque: 605, battery: 77.4, range: 528, isHybrid: false },
    { model: "Sorento Plug-in Hybrid", hp: 261, torque: 350, battery: 13.8, range: 51, gasRange: 650, isHybrid: true, engineHp: 177, evHp: 89 },
  ],
  "Volvo": [
    { model: "XC40 Recharge", hp: 402, torque: 660, battery: 78.0, range: 418, isHybrid: false },
    { model: "C40 Recharge", hp: 402, torque: 660, battery: 78.0, range: 530, isHybrid: false },
    { model: "XC90 T8 Recharge (PHEV)", hp: 455, torque: 709, battery: 18.8, range: 77, gasRange: 600, isHybrid: true, engineHp: 312, evHp: 143 },
    { model: "XC60 T8 Recharge (PHEV)", hp: 455, torque: 709, battery: 18.8, range: 77, gasRange: 620, isHybrid: true, engineHp: 312, evHp: 143 }
  ],
  "BMW": [
    { model: "i4 eDrive40", hp: 335, torque: 430, battery: 83.9, range: 590, isHybrid: false },
    { model: "iX xDrive40", hp: 322, torque: 630, battery: 76.6, range: 425, isHybrid: false },
    { model: "i7 xDrive60", hp: 536, torque: 745, battery: 105.7, range: 625, isHybrid: false },
    { model: "XM (PHEV)", hp: 644, torque: 800, battery: 25.7, range: 88, gasRange: 480, isHybrid: true, engineHp: 483, evHp: 194 },
    { model: "X5 xDrive50e (PHEV)", hp: 483, torque: 700, battery: 25.7, range: 110, gasRange: 650, isHybrid: true, engineHp: 308, evHp: 194 },
    { model: "330e Sedan (PHEV)", hp: 288, torque: 420, battery: 12.0, range: 60, gasRange: 500, isHybrid: true, engineHp: 181, evHp: 107 }
  ],
  "Mercedes-Benz": [
    { model: "EQS 580 4MATIC", hp: 516, torque: 855, battery: 107.8, range: 676, isHybrid: false },
    { model: "EQE 500 4MATIC", hp: 402, torque: 858, battery: 90.6, range: 526, isHybrid: false },
    { model: "C 300 e (PHEV)", hp: 313, torque: 550, battery: 25.4, range: 110, gasRange: 640, isHybrid: true, engineHp: 204, evHp: 129 },
    { model: "AMG S 63 E Performance", hp: 791, torque: 1430, battery: 13.1, range: 33, gasRange: 450, isHybrid: true, engineHp: 603, evHp: 188 }
  ],
  "Porsche": [
    { model: "Taycan 4S", hp: 522, torque: 640, battery: 79.2, range: 400, isHybrid: false },
    { model: "Cayenne E-Hybrid", hp: 463, torque: 650, battery: 25.9, range: 90, gasRange: 680, isHybrid: true, engineHp: 300, evHp: 174 },
    { model: "Panamera 4 E-Hybrid", hp: 463, torque: 650, battery: 25.9, range: 93, gasRange: 720, isHybrid: true, engineHp: 300, evHp: 187 }
  ],
  "Audi": [
    { model: "e-tron GT", hp: 523, torque: 630, battery: 83.7, range: 488, isHybrid: false },
    { model: "Q8 e-tron", hp: 402, torque: 664, battery: 106.0, range: 582, isHybrid: false },
    { model: "Q5 TFSI e (PHEV)", hp: 362, torque: 500, battery: 17.9, range: 62, gasRange: 580, isHybrid: true, engineHp: 261, evHp: 141 }
  ],
  "Land Rover": [
    { model: "Range Rover P460e", hp: 460, torque: 660, battery: 38.2, range: 119, gasRange: 740, isHybrid: true, engineHp: 350, evHp: 158 },
    { model: "Defender P400e", hp: 404, torque: 640, battery: 19.2, range: 51, gasRange: 650, isHybrid: true, engineHp: 300, evHp: 141 }
  ],
  "Toyota": [
    { model: "Innova Hycross (Hybrid)", hp: 184, torque: 206, battery: 1.6, range: 25, gasRange: 1050, isHybrid: true, engineHp: 150, evHp: 34 },
    { model: "Camry Hybrid", hp: 215, torque: 221, battery: 1.6, range: 10, gasRange: 1100, isHybrid: true, engineHp: 176, evHp: 118 },
    { model: "Vellfire (Hybrid)", hp: 190, torque: 240, battery: 2.0, range: 20, gasRange: 850, isHybrid: true, engineHp: 140, evHp: 50 }
  ],
  "Lexus": [
    { model: "NX 350h", hp: 240, torque: 270, battery: 1.6, range: 15, gasRange: 900, isHybrid: true, engineHp: 188, evHp: 180 },
    { model: "RX 500h F Sport", hp: 366, torque: 460, battery: 2.0, range: 20, gasRange: 820, isHybrid: true, engineHp: 271, evHp: 180 }
  ],
  "Maruti Suzuki": [
    { model: "Grand Vitara (Hybrid)", hp: 114, torque: 141, battery: 0.76, range: 15, gasRange: 1150, isHybrid: true, engineHp: 91, evHp: 79 },
    { model: "Invicto (Hybrid)", hp: 184, torque: 206, battery: 1.6, range: 25, gasRange: 1000, isHybrid: true, engineHp: 150, evHp: 34 }
  ],
  "Honda": [
    { model: "City e:HEV (Hybrid)", hp: 124, torque: 253, battery: 0.7, range: 10, gasRange: 900, isHybrid: true, engineHp: 97, evHp: 107 }
  ]
};

// Custom Glassmorphic Select Component to replace native styling limitations
const GlassSelect = ({ value, options, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ position: "relative" }}>
      {open && (
        <div 
          onClick={() => setOpen(false)} 
          style={{ position: "fixed", inset: 0, zIndex: 40 }} 
        />
      )}
      <div 
        onClick={() => setOpen(!open)}
        style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span style={{ opacity: value ? 1 : 0.6 }}>{value || placeholder}</span>
        <span style={{ fontSize: "0.8em", opacity: 0.6 }}>▼</span>
      </div>
      
      {open && (
        <div style={{ 
          position: "absolute", zIndex: 50, top: "100%", left: 0, right: 0, marginTop: "6px",
          background: "rgba(15, 23, 42, 0.98)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "12px",
          maxHeight: "260px", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)",
          padding: "4px"
        }}>
          {options.map((opt, i) => (
            <div 
              key={i}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: "10px 14px",
                color: value === opt.value ? "#38bdf8" : "#f8fafc",
                fontWeight: value === opt.value ? 800 : 500,
                cursor: "pointer",
                borderRadius: "8px",
                background: hovered === i ? "rgba(255, 255, 255, 0.08)" : "transparent",
                transition: "all 0.15s ease-in-out"
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function UserAccount() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Settings Form (Personal)
  const [credentials, setCredentials] = useState({ name: "", email: "", password: "" });
  
  // User's Multi-Vehicle Array
  const [vehicles, setVehicles] = useState([]);

  // Draft Form for Adding a new Vehicle
  const [carForm, setCarForm] = useState({
    brand: "", model: "", purchaseYear: new Date().getFullYear(), hp: 0, torque: 0, battery: 0, range: 0, gasRange: 0, isHybrid: false
  });

  // Geolocation
  const [geo, setGeo] = useState({ lat: null, lon: null });

  useEffect(() => {
    fetchProfile();
    fetchLocation();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/auth/me");
      const user = res.data;
      setIsAdmin(!!user.isAdmin);
      setCredentials({ name: user.name || "", email: user.email || "", password: "" });
      // Map existing records if missing fields
      setVehicles(user.vehicles || []);
    } catch (err) {
      toast.error("Failed to load profile.");
    } finally {
       setLoading(false);
    }
  };

  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.log("Account Map location rejected", err)
      );
    }
  };

  const handleCredentialsChange = (e) => setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: credentials.name, email: credentials.email };
      if (credentials.password) payload.password = credentials.password;
      await API.put("/auth/me", payload);
      toast.success("Account Credentials Saved!");
      setCredentials({ ...credentials, password: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleCarChange = (e) => setCarForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleBrandSelect = (val) => {
    setCarForm({ brand: val, model: "", purchaseYear: new Date().getFullYear(), hp: 0, torque: 0, battery: 0, range: 0, gasRange: 0, isHybrid: false });
  };

  const handleModelSelect = (val) => {
    const cars = IN_EV_CAR_DB[carForm.brand];
    const car = cars?.find(c => c.model === val);
    if (car) {
      setCarForm({
        ...carForm,
        model: car.model,
        hp: car.hp,
        torque: car.torque,
        battery: car.battery,
        range: car.range,
        gasRange: car.gasRange || 0,
        isHybrid: car.isHybrid
      });
    } else {
      setCarForm({ ...carForm, model: val });
    }
  };

  const syncGarage = async (newVehicles) => {
    try {
      await API.put("/auth/me", { vehicles: newVehicles });
      setVehicles(newVehicles);
      toast.success("Garage successfully synced!");
    } catch (err) {
      toast.error("Failed to sync garage.");
    }
  };

  const addVehicleToGarage = (e) => {
    e.preventDefault();
    if (!carForm.brand || !carForm.model) return toast.error("Select Brand & Model");
    
    // Map form properties explicitly to schema properties
    const newCar = {
      brand: carForm.brand,
      model: carForm.model,
      year: Number(carForm.purchaseYear),
      hp: Number(carForm.hp),
      torque: Number(carForm.torque),
      battery: Number(carForm.battery),
      range: Number(carForm.range),
      gasRange: Number(carForm.gasRange || 0),
      isHybrid: carForm.isHybrid
    };
    
    const updated = [...vehicles, newCar];
    syncGarage(updated);
    setCarForm({ brand: "", model: "", purchaseYear: new Date().getFullYear(), hp: 0, torque: 0, battery: 0, range: 0, gasRange: 0, isHybrid: false });
  };

  const removeVehicle = (idx) => {
    const updated = vehicles.filter((_, i) => i !== idx);
    syncGarage(updated);
  };

  const getEffectiveRange = (base, year) => {
    if (!base || !year) return 0;
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - year);
    const lossMultiplier = Math.max(0, 1 - (age * 0.023));
    return parseFloat((base * lossMultiplier).toFixed(1));
  };

  if (loading) return <PageShell title="Account"><div style={{ textAlign: "center" }}>Loading...</div></PageShell>;

  return (
    <PageShell title="Account & Configurations">
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "24px" }}>
        
        {/* LEFT COLUMN: Profile & Geolocation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={cardStyle}>
             <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Personal Overview</h2>
                <span style={roleBadge(isAdmin)}>{isAdmin ? "Admin Root" : "Standard Driver"}</span>
             </div>
             <form onSubmit={handleCredentialsSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
               <label style={labelStyle}>
                 Full Name
                 <input style={inputStyle} name="name" value={credentials.name} onChange={handleCredentialsChange} required />
               </label>
               <label style={labelStyle}>
                 Email Address
                 <input type="email" style={inputStyle} name="email" value={credentials.email} onChange={handleCredentialsChange} required />
               </label>
               <label style={labelStyle}>
                 New Password
                 <input type="password" style={inputStyle} name="password" value={credentials.password} onChange={handleCredentialsChange} placeholder="Leave blank to keep current" />
               </label>
               <button type="submit" className="glass-btn" style={saveBtnStyle} disabled={saving}>
                 {saving ? "Syncing..." : "Update Credentials"}
               </button>
             </form>
          </div>

          <div style={cardStyle}>
            <h2 style={{ margin: "0 0 16px", fontSize: 20 }}>Live Geolocation Tracker</h2>
            <div style={{ height: "240px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
               {geo.lat ? (
                  <MapContainer center={[geo.lat, geo.lon]} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    <Marker position={[geo.lat, geo.lon]} icon={userIcon}>
                      <Popup>Your precise location lock.</Popup>
                    </Marker>
                  </MapContainer>
               ) : (
                  <div style={{ padding: "30px", textAlign: "center", opacity: 0.6 }}>Enabling GPS coordinates...</div>
               )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Garage & Customization */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{...cardStyle, background: "linear-gradient(135deg, rgba(30,41,59,0.7), rgba(2,6,23,0.9))", border: "1px solid rgba(16,185,129,0.3)", overflow: "visible"}}>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, color: "#10b981" }}>+ Add Vehicle to Garage</h2>
            
            <form onSubmit={addVehicleToGarage} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
               <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                 <label style={{ ...labelStyle, flex: "1 1 calc(50% - 12px)" }}>
                   Automaker
                   <GlassSelect 
                     value={carForm.brand} 
                     onChange={handleBrandSelect} 
                     placeholder="-- Select Brand --"
                     options={Object.keys(IN_EV_CAR_DB).map(b => ({ label: b, value: b }))}
                   />
                 </label>
                 <label style={{ ...labelStyle, flex: "1 1 calc(50% - 12px)" }}>
                   Model Chassis
                   <GlassSelect 
                     value={carForm.model} 
                     onChange={handleModelSelect} 
                     placeholder="-- Choose Model --"
                     options={(IN_EV_CAR_DB[carForm.brand] || []).map(c => ({ label: c.model, value: c.model }))}
                   />
                 </label>
               </div>

               {carForm.isHybrid && (
                 <div style={{ padding: "10px 14px", background: "rgba(234, 179, 8, 0.1)", borderRadius: "8px", border: "1px solid rgba(234, 179, 8, 0.2)", fontSize: "0.85rem", color: "#fef08a", marginTop: "-6px" }}>
                   <strong>Hybrid Detected ⚡⛽</strong> Total output combines Internal Combustion Engine + Pure EV Motor.
                 </div>
               )}

               <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                 <label style={{ ...labelStyle, flex: "1 1 calc(50% - 12px)" }}>
                   Total Horse Power (hp)
                   <input type="number" style={inputStyle} name="hp" value={carForm.hp} onChange={handleCarChange} />
                 </label>
                 <label style={{ ...labelStyle, flex: "1 1 calc(50% - 12px)" }}>
                   Torque (Nm)
                   <input type="number" style={inputStyle} name="torque" value={carForm.torque} onChange={handleCarChange} />
                 </label>
               </div>

               <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                 <label style={{ ...labelStyle, flex: "1 1 calc(50% - 12px)" }}>
                   Battery (kWh)
                   <input type="number" step="0.1" style={inputStyle} name="battery" value={carForm.battery} onChange={handleCarChange} />
                 </label>
                 <label style={{ ...labelStyle, flex: "1 1 calc(50% - 12px)" }}>
                   Purchase Year
                   <input type="number" min="2000" max={new Date().getFullYear()} style={inputStyle} name="purchaseYear" value={carForm.purchaseYear} onChange={handleCarChange} />
                 </label>
               </div>
               
               {/* RANGE ROW */}
               {!carForm.isHybrid ? (
                 <label style={labelStyle}>
                   Laboratory Base Range (km)
                   <input type="number" style={inputStyle} name="range" value={carForm.range} onChange={handleCarChange} />
                 </label>
               ) : (
                 <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                   <label style={{ ...labelStyle, flex: "1 1 calc(50% - 12px)" }}>
                     Gas Range (km)
                     <input type="number" style={inputStyle} name="gasRange" value={carForm.gasRange} onChange={handleCarChange} />
                   </label>
                   <label style={{ ...labelStyle, flex: "1 1 calc(50% - 12px)" }}>
                     Base EV Range (km)
                     <input type="number" style={inputStyle} name="range" value={carForm.range} onChange={handleCarChange} />
                   </label>
                 </div>
               )}
               
               <button type="submit" className="glass-btn" style={{ ...saveBtnStyle, background: "linear-gradient(135deg, #10b981, #059669)", color: "#000", marginTop: 8 }}>
                 Deploy to Garage
               </button>
            </form>
          </div>

          <div style={cardStyle}>
            <h2 style={{ margin: "0 0 16px", fontSize: 20 }}>Your Registered Garage</h2>
            {vehicles.length === 0 ? (
               <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "rgba(0,0,0,0.2)", borderRadius: 12 }}>
                 Your garage is empty. Add a vehicle above.
               </div>
            ) : (
               <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {vehicles.map((v, i) => {
                    const effectiveEvRange = getEffectiveRange(v.range, v.year);
                    const totalHybridRange = v.isHybrid ? (v.gasRange || 0) + effectiveEvRange : effectiveEvRange;

                    return (
                    <div key={i} style={{ padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, position: "relative" }}>
                      <button 
                        onClick={() => removeVehicle(i)}
                        style={{ position: "absolute", top: 12, right: 12, background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                      >
                        Remove
                      </button>
                      <h4 style={{ margin: "0 0 6px", fontSize: 18, color: "#f8fafc", paddingRight: 60 }}>
                        {v.brand} {v.model}
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
                        Purchased: {v.year} {v.isHybrid && <span style={{ color: "#eab308", marginLeft: 8 }}>• Hybrid Matrix</span>}
                      </p>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                         <div style={statBox}>
                           <span>System Power</span>
                           <strong>{v.hp} HP / {v.torque} Nm</strong>
                         </div>
                         <div style={statBox}>
                           <span>Drive Battery</span>
                           <strong>{v.battery} kWh</strong>
                         </div>
                      </div>

                      <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: 12, borderRadius: 8 }}>
                         <p style={{ margin: "0 0 4px", fontSize: 11, color: "#93c5fd", textTransform: "uppercase", letterSpacing: 1 }}>
                           {v.isHybrid ? "Total Comb. Range (Gas + EV Output)" : "Effective Range (Degradation Output)"}
                         </p>
                         
                         {v.isHybrid ? (
                             <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 8 }}>
                               <span style={{ fontSize: 24, fontWeight: 900, color: "#cbd5e1" }}>{(v.gasRange || 0).toLocaleString()} <span style={{fontSize: 14, fontWeight: 600}}>km ⛽</span></span>
                               <span style={{ fontSize: 22, color: "#64748b" }}>+</span>
                               <span style={{ fontSize: 24, fontWeight: 900, color: "#10b981" }}>{effectiveEvRange} <span style={{fontSize: 14, fontWeight: 600}}>km ⚡</span></span>
                               <span style={{ fontSize: 20, color: "#64748b", margin: "0 4px" }}>=</span>
                               <span style={{ fontSize: 28, fontWeight: 900, color: "#10b981" }}>{totalHybridRange.toLocaleString()} <span style={{ fontSize: 13, color: "#64748b" }}>KM Real-World</span></span>
                             </div>
                         ) : (
                             <h3 style={{ margin: 0, fontSize: 28, color: "#10b981" }}>
                               {effectiveEvRange} <span style={{ fontSize: 14, color: "#64748b" }}>KM Real-World</span>
                             </h3>
                         )}
                      </div>
                    </div>
                  )})}
               </div>
            )}
          </div>

        </div>
      </div>
    </PageShell>
  );
}

const cardStyle = {
  background: "rgba(2, 6, 23, 0.45)",
  border: "1px solid rgba(229, 231, 235, 0.12)",
  borderRadius: 16,
  padding: 24,
  textAlign: "left",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  fontSize: "0.85rem",
  fontWeight: 700,
  color: "rgba(255, 255, 255, 0.9)",
  gap: "6px"
};

const inputStyle = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.2)",
  color: "#fff",
  fontSize: "1rem",
  boxSizing: "border-box",
  width: "100%"
};

const saveBtnStyle = {
  padding: "14px",
  fontSize: "1rem",
  fontWeight: 800,
  /* background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", */
  background: "linear-gradient(135deg, #10b981, #3b82f6)",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  transition: "all 0.2s",
  borderRadius: 12
};

const roleBadge = (isAdmin) => ({
  /* background: isAdmin ? "rgba(59, 130, 246, 0.2)" : "rgba(192, 132, 252, 0.2)", */
  /* color: isAdmin ? "#93c5fd" : "#d8b4fe", */
  /* border: `1px solid ${isAdmin ? "rgba(59, 130, 246, 0.4)" : "rgba(192, 132, 252, 0.4)"}` */
  background: isAdmin ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.2)",
  color: isAdmin ? "#93c5fd" : "#6ee7b7",
  padding: "4px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: `1px solid ${isAdmin ? "rgba(59, 130, 246, 0.4)" : "rgba(16, 185, 129, 0.4)"}`
});

const statBox = {
  background: "rgba(0,0,0,0.3)",
  padding: "8px 12px",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: "0.8rem",
  color: "#94a3b8"
};
