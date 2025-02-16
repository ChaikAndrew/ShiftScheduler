import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LeaderDashboard.module.scss";

const OperatorDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Видаляємо токен і роль
    localStorage.removeItem("role");
    localStorage.removeItem("token");

    // Примусово викликаємо подію storage для оновлення стану
    setTimeout(() => window.dispatchEvent(new Event("storage")), 0);

    // Перекидаємо на сторінку логування
    navigate("/login");
  };

  return (
    <div className={styles.dashboardContainer}>
      <h1>Leader Dashboard</h1>
      <p>Welcome, Leader! Here you can view your statistics and tasks.</p>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Logout
      </button>
    </div>
  );
};

export default OperatorDashboard;
