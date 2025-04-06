import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // або { decode as jwtDecode }

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const location = useLocation(); // 🆕 отримуємо поточний шлях

  if (!token) {
    console.warn("🚫 No token found, redirecting to login.");
    return location.pathname === "/login" ? null : (
      <Navigate to="/login" replace />
    );
  }

  try {
    const decoded = jwtDecode(token);

    if (decoded.exp * 1000 < Date.now()) {
      console.warn("⏰ Token expired, redirecting to login.");
      localStorage.removeItem("token");
      return location.pathname === "/login" ? null : (
        <Navigate to="/login" replace />
      );
    }

    if (!allowedRoles.includes(decoded.role)) {
      return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <h2>🔒 Access Denied</h2>
          <p>У тебе немає доступу до цієї сторінки.</p>
        </div>
      );
    }

    return children;
  } catch (error) {
    console.error("❌ Token decoding failed:", error);
    localStorage.removeItem("token");
    return location.pathname === "/login" ? null : (
      <Navigate to="/login" replace />
    );
  }
};

export default PrivateRoute;
