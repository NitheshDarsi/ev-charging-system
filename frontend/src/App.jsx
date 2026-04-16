import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import Auth from "./pages/Auth";
import BookingHistory from "./pages/BookingHistory";
import RangeCalculator from "./pages/RangeCalculator";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminBookings from "./pages/AdminBookings";
import UserAccount from "./pages/UserAccount";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";

function AppContent() {
  const location = useLocation();
  const hideNavbarPaths = ["/", "/login", "/register"];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        <Route path="/my-bookings" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/range" element={<ProtectedRoute><RangeCalculator /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><UserAccount /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<AdminProtectedRoute><AdminBookings /></AdminProtectedRoute>} />
      </Routes>
      {showNavbar && <Navbar />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;