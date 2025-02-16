import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Або { decode as jwtDecode }

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("No token found, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    if (decoded.exp * 1000 < Date.now()) {
      console.warn("Token expired, redirecting to login.");
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(decoded.role)) {
      return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      );
    }

    return children;
  } catch (error) {
    console.error("Token decoding failed:", error);
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
};

export default PrivateRoute;
