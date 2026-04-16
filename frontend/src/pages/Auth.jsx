import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API from "../api";

import "./auth.css";

function getInitialMode(pathname) {
  if (pathname.endsWith("/register")) return "register";
  if (pathname.endsWith("/login")) return "login";
  // default landing
  return "login";
}

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialMode = useMemo(
    () => getInitialMode(location.pathname),
    [location.pathname]
  );
  const [mode, setMode] = useState(initialMode);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(getInitialMode(location.pathname));
  }, [location.pathname]);

  const go = (nextMode) => {
    setMode(nextMode);
    navigate(nextMode === "register" ? "/register" : "/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Manual validation to prevent bypass
    if (!email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (mode === "register" && !name) {
      toast.error("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const res = await API.post("/auth/login", { email, password });
        
        if (!res.data || !res.data.token) {
          throw new Error("Invalid server response: No token received.");
        }

        localStorage.setItem("token", res.data.token);
        const user = res.data.user || {};
        const isAdmin = !!user.isAdmin;
        
        toast.success(`Welcome back, ${user.name || "User"}!`);
        navigate(isAdmin ? "/admin/bookings" : "/home");
      } else {
        await API.post("/auth/register", { name, email, password, isAdmin });
        toast.success("Registered successfully! Please sign in.");
        setMode("login");
        navigate("/login");
      }
    } catch (err) {
      const body = err.response?.data;
      toast.error(
        body?.message ||
          body?.msg ||
          body?.error ||
          err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authBg" />
      <div className="authWrap">
        <div className="authCard">
          <div className="authHeader">
            <div className="authTitle">EV Charging System</div>
            <div className="authSubtitle">
              Book stations, edit bookings, and manage maintenance windows.
            </div>
          </div>

          <div className="authTabs">
            <button
              type="button"
              className={mode === "login" ? "authTab active" : "authTab"}
              onClick={() => go("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? "authTab active" : "authTab"}
              onClick={() => go("register")}
            >
              Register
            </button>
          </div>

          <form className="authForm" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <label className="authField">
                  <span>Full Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </label>
                
                <div className="authRoleToggle">
                  <label className="authRoleLabel">
                    <input type="radio" checked={!isAdmin} onChange={() => setIsAdmin(false)} /> User Account
                  </label>
                  <label className="authRoleLabel">
                    <input type="radio" checked={isAdmin} onChange={() => setIsAdmin(true)} /> Admin Account
                  </label>
                </div>
              </>
            )}

            <label className="authField">
              <span>Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                type="email"
              />
            </label>

            <label className="authField">
              <span>Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                type="password"
              />
            </label>

            <button className="authSubmit" disabled={loading} type="submit">
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

