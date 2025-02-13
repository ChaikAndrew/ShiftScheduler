import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./OperatorDashboard.module.scss";

const OperatorDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className={styles.dashboardContainer}>
      <h1>Operator Dashboard</h1>
      <p>Welcome, Operator! Here you can view your statistics and tasks.</p>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Logout
      </button>
    </div>
  );
};

export default OperatorDashboard;
