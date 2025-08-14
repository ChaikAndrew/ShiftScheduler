import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LeaderDashboard.module.scss";
import OperatorManager from "../../components/OperatorManager/OperatorManager";

const baseUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:4040"
    : "https://shift-scheduler-server.vercel.app";

const OperatorDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    setTimeout(() => window.dispatchEvent(new Event("storage")), 0);
    navigate("/login");
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.welcomeCard}>
        <p className={styles.welcomeText}>
          Welcome, Leader! Here you can view your statistics and tasks.
        </p>
      </div>
      <OperatorManager baseUrl={baseUrl} />
      <div className={styles.welcomeCard}>
        <button
          onClick={handleLogout}
          className={`${styles.btn} ${styles.btnLogout}`}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default OperatorDashboard;
