import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.scss";
const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className={styles.dashboardContainer}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, Admin! Here you can manage users and view statistics.</p>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Logout
      </button>
    </div>
  );
};

export default AdminDashboard;
