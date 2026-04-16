function StationCard({ station, bookSlot }) {
  return (
    <div style={{
      background: "#1e293b",
      color: "white",
      padding: "20px",
      borderRadius: "12px",
      margin: "15px",
      width: "250px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
    }}>
      <h3>{station.name}</h3>
      <p>Available Slots: {station.slots}</p>

      <button
        onClick={() => bookSlot(station.id)}
        style={{
          padding: "10px",
          background: "#22c55e",
          border: "none",
          borderRadius: "8px",
          color: "white",
          cursor: "pointer"
        }}
      >
        Book Slot
      </button>
    </div>
  );
}

export default StationCard;