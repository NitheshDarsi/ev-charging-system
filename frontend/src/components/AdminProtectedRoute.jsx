import { Navigate } from "react-router-dom";

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

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  const payload = decodeJwtPayload(token);
  const isAdmin = !!payload?.isAdmin;

  if (!isAdmin) return <Navigate to="/my-bookings" />;

  return children;
}

