import { Link, useNavigate, useLocation } from "react-router-dom";
import { Zap, Calendar, Shield, Gauge, User, LogOut } from "lucide-react";
import "./navbar.css";

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(40);
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const payload = token ? decodeJwtPayload(token) : null;
  const isAdmin = !!payload?.isAdmin;

  const handleLogout = () => {
    triggerHaptic();
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path, searchState) => {
    if (searchState) return location.state?.[searchState];
    return location.pathname === path;
  };

  const navItems = [
    { id: "book", name: "Book", icon: Zap, path: "/my-bookings", state: { openAddTab: true }, searchState: "openAddTab" },
    { id: "history", name: "History", icon: Calendar, path: "/my-bookings", state: { openHistoryTab: true }, searchState: "openHistoryTab" },
    ...(isAdmin ? [{ id: "admin", name: "Admin", icon: Shield, path: "/admin/bookings", customClass: "navLinkAdmin" }] : []),
    { id: "range", name: "Range", icon: Gauge, path: "/range" },
    { id: "profile", name: "Profile", icon: User, path: "/account" },
  ];

  const activeIndex = navItems.findIndex((item) => isActive(item.path, item.searchState));
  const totalItems = navItems.length;

  return (
    <div className="navbar">
      {/* Brand — left */}
      <div className="navbarBrandContainer">
        <Link className="navbarBrand" to="/home" onClick={triggerHaptic} style={{ textDecoration: "none" }}>
          EV Charging
        </Link>
      </div>

      {/* Nav links — center */}
      <div className="navbarLinks" style={{ position: "relative" }}>
        {/* Sliding pill indicator */}
        <div
          className="navIndicator"
          style={{
            width: `${100 / totalItems}%`,
            transform: `translateX(${activeIndex * 100}%)`,
            opacity: activeIndex === -1 ? 0 : 1,
          }}
        />

        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = activeIndex === idx;
          return (
            <Link
              key={item.id}
              className={`navLink ${item.customClass || ""} ${active ? "active" : ""}`}
              to={item.path}
              state={item.state}
              onClick={triggerHaptic}
            >
              <Icon size={22} className="navIcon" />
              <span className="navText">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Logout — right */}
      <div className="navbarRight">
        <button className="navLogoutBtn" type="button" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}