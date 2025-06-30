import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./OperatorDashboard.module.scss";
// import LatestProblemFileViewer from "../../components/LatestProblemFileViewer/LatestProblemFileViewer";
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
      <h1>Operator Dashboard</h1>
      <p>Welcome, Operator! Here you can view your statistics and tasks.</p>
      <button onClick={handleLogout} className={styles.logoutButton}>
        Logout
      </button>
      {/* <LatestProblemFileViewer /> */}
    </div>
  );
};

export default OperatorDashboard;
