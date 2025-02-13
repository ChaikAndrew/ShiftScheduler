import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const userRole = localStorage.getItem("role");
  console.log("User role:", userRole);
  console.log("Allowed roles:", allowedRoles);

  if (!userRole || !allowedRoles.includes(userRole)) {
    console.log("Access denied.");
    return <Navigate to="/login" replace />;
  }

  console.log("Access granted.");
  return children;
};
export default PrivateRoute;
