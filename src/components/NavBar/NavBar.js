import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./NavBar.module.scss";

function NavBar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // Отримуємо роль користувача

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <nav className={styles.navbar}>
      {!role ? (
        <div className={styles.singleLink}>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Login
          </NavLink>
        </div>
      ) : (
        <>
          <div className={styles.navLinks}>
            <NavLink
              to="/shift-scheduler"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Shift Scheduler
            </NavLink>

            <NavLink
              to="/monthly-statistics"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Monthly Statistics
            </NavLink>

            <NavLink
              to="/leader-statistics"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Leader Statistics
            </NavLink>

            <NavLink
              to="/machine-statistics"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Machine Statistics
            </NavLink>
            <NavLink
              to="/operator-statistics"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Operator Statistics
            </NavLink>
          </div>

          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}

export default NavBar;
