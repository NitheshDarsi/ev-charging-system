import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';

export default function Home() {
  const navigate = useNavigate();

  return (
    <PageShell title="Welcome">
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        textAlign: "center",
        padding: "0 20px"
      }}>
        <h1 style={{
          fontSize: "clamp(2rem, 8vw, 3.5rem)",
          fontWeight: 1000,
          background: "linear-gradient(135deg, #fff, #93c5fd)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "16px",
          lineHeight: 1.1,
          letterSpacing: "-0.04em"
        }}>
          EV charging for vehicles<br />and slot booking
        </h1>
        <p style={{
          fontSize: "clamp(1rem, 4vw, 1.25rem)",
          color: "#94a3b8",
          maxWidth: "700px",
          lineHeight: 1.6,
          marginBottom: "48px"
        }}>
          State wide booking across our entire supported grid. Locate stations in your range, check precise route traffic, and reserve your slots securely in seconds.
        </p>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <button 
            type="button"
            className="glass-btn"
            style={{ padding: "16px 32px", fontSize: "1.1rem" }}
            onClick={() => navigate("/my-bookings", { state: { openAddTab: true } })}
          >
            Book a Slot
          </button>
          <button 
            type="button"
            className="glass-btn"
            style={{ 
              padding: "16px 32px", 
              fontSize: "1.1rem", 
              background: "linear-gradient(135deg, #3b82f6, #4ade80)",
              border: "none",
              color: "#0f172a",
              fontWeight: 900
            }}
            onClick={() => navigate("/range")}
          >
            Range Calculator
          </button>
        </div>
      </div>
    </PageShell>
  );
}
